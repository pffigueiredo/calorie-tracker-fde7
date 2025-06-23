
import { db } from '../db';
import { foodLogEntriesTable, userProfilesTable } from '../db/schema';
import { type CreateFoodLogEntryInput, type FoodLogEntry } from '../schema';
import { eq } from 'drizzle-orm';

export const createFoodLogEntry = async (input: CreateFoodLogEntryInput): Promise<FoodLogEntry> => {
  try {
    // Verify user exists first to prevent foreign key constraint violation
    const existingUser = await db.select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, input.user_id))
      .execute();

    if (existingUser.length === 0) {
      throw new Error(`User with id ${input.user_id} does not exist`);
    }

    // Use provided log_date or default to today
    const logDate = input.log_date ? input.log_date : new Date().toISOString().split('T')[0];

    // Insert food log entry
    const result = await db.insert(foodLogEntriesTable)
      .values({
        user_id: input.user_id,
        calories: input.calories,
        log_date: logDate
      })
      .returning()
      .execute();

    const entry = result[0];
    return {
      ...entry,
      log_date: new Date(entry.log_date) // Convert string date back to Date object
    };
  } catch (error) {
    console.error('Food log entry creation failed:', error);
    throw error;
  }
};
