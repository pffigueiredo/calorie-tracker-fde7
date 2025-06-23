
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProfilesTable, foodLogEntriesTable } from '../db/schema';
import { type GetDailySummaryInput, type CreateUserProfileInput } from '../schema';
import { getDailySummary } from '../handlers/get_daily_summary';

describe('getDailySummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return daily summary with entries for specified date', async () => {
    // Create user profile
    const userResult = await db.insert(userProfilesTable)
      .values({
        daily_calorie_target: 2000
      })
      .returning()
      .execute();

    const userId = userResult[0].id;
    const testDate = '2024-01-15';

    // Create food log entries for the test date
    await db.insert(foodLogEntriesTable)
      .values([
        {
          user_id: userId,
          calories: 500,
          log_date: testDate
        },
        {
          user_id: userId,
          calories: 700,
          log_date: testDate
        }
      ])
      .execute();

    // Create entry for different date (should not be included)
    await db.insert(foodLogEntriesTable)
      .values({
        user_id: userId,
        calories: 300,
        log_date: '2024-01-16'
      })
      .execute();

    const input: GetDailySummaryInput = {
      user_id: userId,
      log_date: testDate
    };

    const result = await getDailySummary(input);

    expect(result.log_date).toEqual(new Date(testDate));
    expect(result.total_calories).toEqual(1200);
    expect(result.daily_target).toEqual(2000);
    expect(result.remaining_calories).toEqual(800);
    expect(result.entries).toHaveLength(2);
    
    // Verify entries are correct
    const calories = result.entries.map(entry => entry.calories).sort();
    expect(calories).toEqual([500, 700]);
    
    result.entries.forEach(entry => {
      expect(entry.user_id).toEqual(userId);
      expect(entry.log_date).toEqual(new Date(testDate));
      expect(entry.created_at).toBeInstanceOf(Date);
      expect(entry.id).toBeDefined();
    });
  });

  it('should use today\'s date when no log_date provided', async () => {
    // Create user profile
    const userResult = await db.insert(userProfilesTable)
      .values({
        daily_calorie_target: 1800
      })
      .returning()
      .execute();

    const userId = userResult[0].id;
    const today = new Date().toISOString().split('T')[0];

    // Create food log entry for today
    await db.insert(foodLogEntriesTable)
      .values({
        user_id: userId,
        calories: 600,
        log_date: today
      })
      .execute();

    const input: GetDailySummaryInput = {
      user_id: userId
      // No log_date provided
    };

    const result = await getDailySummary(input);

    expect(result.log_date.toISOString().split('T')[0]).toEqual(today);
    expect(result.total_calories).toEqual(600);
    expect(result.daily_target).toEqual(1800);
    expect(result.remaining_calories).toEqual(1200);
    expect(result.entries).toHaveLength(1);
  });

  it('should return empty entries when no food logs exist for date', async () => {
    // Create user profile
    const userResult = await db.insert(userProfilesTable)
      .values({
        daily_calorie_target: 2200
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    const input: GetDailySummaryInput = {
      user_id: userId,
      log_date: '2024-01-20'
    };

    const result = await getDailySummary(input);

    expect(result.log_date).toEqual(new Date('2024-01-20'));
    expect(result.total_calories).toEqual(0);
    expect(result.daily_target).toEqual(2200);
    expect(result.remaining_calories).toEqual(2200);
    expect(result.entries).toHaveLength(0);
  });

  it('should throw error when user profile does not exist', async () => {
    const input: GetDailySummaryInput = {
      user_id: 999, // Non-existent user
      log_date: '2024-01-15'
    };

    await expect(getDailySummary(input)).rejects.toThrow(/User profile not found/i);
  });

  it('should handle multiple entries and calculate totals correctly', async () => {
    // Create user profile
    const userResult = await db.insert(userProfilesTable)
      .values({
        daily_calorie_target: 2500
      })
      .returning()
      .execute();

    const userId = userResult[0].id;
    const testDate = '2024-01-25';

    // Create multiple food log entries
    await db.insert(foodLogEntriesTable)
      .values([
        {
          user_id: userId,
          calories: 400,
          log_date: testDate
        },
        {
          user_id: userId,
          calories: 600,
          log_date: testDate
        },
        {
          user_id: userId,
          calories: 300,
          log_date: testDate
        },
        {
          user_id: userId,
          calories: 250,
          log_date: testDate
        }
      ])
      .execute();

    const input: GetDailySummaryInput = {
      user_id: userId,
      log_date: testDate
    };

    const result = await getDailySummary(input);

    expect(result.total_calories).toEqual(1550);
    expect(result.daily_target).toEqual(2500);
    expect(result.remaining_calories).toEqual(950);
    expect(result.entries).toHaveLength(4);
  });
});
