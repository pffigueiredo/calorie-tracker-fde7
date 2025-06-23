import { db } from '../db';
import { foodLogEntriesTable } from '../db/schema';
import { type GetFoodLogEntriesInput, type FoodLogEntry } from '../schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

export const getFoodLogEntries = async (input: GetFoodLogEntriesInput): Promise<FoodLogEntry[]> => {
  try {
    // Build conditions array
    const conditions = [];
    
    // Always filter by user_id
    conditions.push(eq(foodLogEntriesTable.user_id, input.user_id));

    // Add date range filters if provided
    if (input.start_date) {
      conditions.push(gte(foodLogEntriesTable.log_date, input.start_date));
    }

    if (input.end_date) {
      conditions.push(lte(foodLogEntriesTable.log_date, input.end_date));
    }

    // Build and execute query
    const whereCondition = conditions.length === 1 ? conditions[0] : and(...conditions);
    
    const results = await db.select()
      .from(foodLogEntriesTable)
      .where(whereCondition)
      .orderBy(desc(foodLogEntriesTable.log_date), desc(foodLogEntriesTable.created_at))
      .execute();

    // Convert log_date from string to Date and return results
    return results.map(result => ({
      ...result,
      log_date: new Date(result.log_date) // Convert string to Date
    }));
  } catch (error) {
    console.error('Failed to get food log entries:', error);
    throw error;
  }
};