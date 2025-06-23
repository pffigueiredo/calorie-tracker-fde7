
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProfilesTable, foodLogEntriesTable } from '../db/schema';
import { type CreateFoodLogEntryInput } from '../schema';
import { createFoodLogEntry } from '../handlers/create_food_log_entry';
import { eq } from 'drizzle-orm';

describe('createFoodLogEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;

  beforeEach(async () => {
    // Create a user profile for testing
    const userResult = await db.insert(userProfilesTable)
      .values({
        daily_calorie_target: 2000
      })
      .returning()
      .execute();
    
    testUserId = userResult[0].id;
  });

  it('should create a food log entry with specific date', async () => {
    const testInput: CreateFoodLogEntryInput = {
      user_id: testUserId,
      calories: 250,
      log_date: '2024-01-15'
    };

    const result = await createFoodLogEntry(testInput);

    expect(result.user_id).toEqual(testUserId);
    expect(result.calories).toEqual(250);
    expect(result.log_date).toBeInstanceOf(Date);
    expect(result.log_date.toISOString().split('T')[0]).toEqual('2024-01-15');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a food log entry with today as default date', async () => {
    const testInput: CreateFoodLogEntryInput = {
      user_id: testUserId,
      calories: 300
    };

    const result = await createFoodLogEntry(testInput);

    expect(result.user_id).toEqual(testUserId);
    expect(result.calories).toEqual(300);
    expect(result.log_date).toBeInstanceOf(Date);
    
    // Check that the date is today
    const today = new Date().toISOString().split('T')[0];
    expect(result.log_date.toISOString().split('T')[0]).toEqual(today);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save food log entry to database', async () => {
    const testInput: CreateFoodLogEntryInput = {
      user_id: testUserId,
      calories: 450,
      log_date: '2024-02-10'
    };

    const result = await createFoodLogEntry(testInput);

    // Query database to verify entry was saved
    const entries = await db.select()
      .from(foodLogEntriesTable)
      .where(eq(foodLogEntriesTable.id, result.id))
      .execute();

    expect(entries).toHaveLength(1);
    expect(entries[0].user_id).toEqual(testUserId);
    expect(entries[0].calories).toEqual(450);
    expect(entries[0].log_date).toEqual('2024-02-10');
    expect(entries[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent user', async () => {
    const testInput: CreateFoodLogEntryInput = {
      user_id: 99999, // Non-existent user ID
      calories: 200,
      log_date: '2024-01-15'
    };

    await expect(createFoodLogEntry(testInput))
      .rejects.toThrow(/user with id 99999 does not exist/i);
  });

  it('should handle multiple entries for same user and date', async () => {
    const testInput1: CreateFoodLogEntryInput = {
      user_id: testUserId,
      calories: 300,
      log_date: '2024-01-20'
    };

    const testInput2: CreateFoodLogEntryInput = {
      user_id: testUserId,
      calories: 150,
      log_date: '2024-01-20'
    };

    const result1 = await createFoodLogEntry(testInput1);
    const result2 = await createFoodLogEntry(testInput2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.user_id).toEqual(testUserId);
    expect(result2.user_id).toEqual(testUserId);
    expect(result1.log_date.toISOString().split('T')[0]).toEqual('2024-01-20');
    expect(result2.log_date.toISOString().split('T')[0]).toEqual('2024-01-20');
    expect(result1.calories).toEqual(300);
    expect(result2.calories).toEqual(150);
  });
});
