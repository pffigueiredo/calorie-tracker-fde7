
import { db } from '../db';
import { userProfilesTable, foodLogEntriesTable } from '../db/schema';
import { type GetDailySummaryInput, type DailySummary } from '../schema';
import { eq, and } from 'drizzle-orm';

export const getDailySummary = async (input: GetDailySummaryInput): Promise<DailySummary> => {
  try {
    // Use today's date if no log_date provided
    const logDate = input.log_date ? new Date(input.log_date) : new Date();
    const logDateString = logDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD

    // Get user profile to fetch daily calorie target
    const userProfile = await db.select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, input.user_id))
      .execute();

    if (userProfile.length === 0) {
      throw new Error(`User profile not found for user_id: ${input.user_id}`);
    }

    const dailyTarget = userProfile[0].daily_calorie_target;

    // Get all food log entries for the specified date
    const entries = await db.select()
      .from(foodLogEntriesTable)
      .where(
        and(
          eq(foodLogEntriesTable.user_id, input.user_id),
          eq(foodLogEntriesTable.log_date, logDateString)
        )
      )
      .execute();

    // Calculate total calories
    const totalCalories = entries.reduce((sum, entry) => sum + entry.calories, 0);

    // Calculate remaining calories
    const remainingCalories = dailyTarget - totalCalories;

    return {
      log_date: logDate,
      total_calories: totalCalories,
      daily_target: dailyTarget,
      remaining_calories: remainingCalories,
      entries: entries.map(entry => ({
        ...entry,
        log_date: new Date(entry.log_date)
      }))
    };
  } catch (error) {
    console.error('Daily summary retrieval failed:', error);
    throw error;
  }
};
