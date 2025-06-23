
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProfilesTable, foodLogEntriesTable } from '../db/schema';
import { type GetFoodLogEntriesInput } from '../schema';
import { getFoodLogEntries } from '../handlers/get_food_log_entries';

describe('getFoodLogEntries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let otherUserId: number;

  beforeEach(async () => {
    // Create test user profiles
    const userResults = await db.insert(userProfilesTable)
      .values([
        { daily_calorie_target: 2000 },
        { daily_calorie_target: 1800 }
      ])
      .returning()
      .execute();

    testUserId = userResults[0].id;
    otherUserId = userResults[1].id;

    // Create test food log entries
    await db.insert(foodLogEntriesTable)
      .values([
        {
          user_id: testUserId,
          calories: 300,
          log_date: '2024-01-01'
        },
        {
          user_id: testUserId,
          calories: 500,
          log_date: '2024-01-02'
        },
        {
          user_id: testUserId,
          calories: 200,
          log_date: '2024-01-03'
        },
        {
          user_id: otherUserId,
          calories: 400,
          log_date: '2024-01-02'
        }
      ])
      .execute();
  });

  it('should get all entries for a user when no date range provided', async () => {
    const input: GetFoodLogEntriesInput = {
      user_id: testUserId
    };

    const result = await getFoodLogEntries(input);

    expect(result).toHaveLength(3);
    result.forEach(entry => {
      expect(entry.user_id).toEqual(testUserId);
      expect(entry.id).toBeDefined();
      expect(entry.calories).toBeTypeOf('number');
      expect(entry.log_date).toBeInstanceOf(Date);
      expect(entry.created_at).toBeInstanceOf(Date);
    });
  });

  it('should filter entries by start_date', async () => {
    const input: GetFoodLogEntriesInput = {
      user_id: testUserId,
      start_date: '2024-01-02'
    };

    const result = await getFoodLogEntries(input);

    expect(result).toHaveLength(2);
    result.forEach(entry => {
      expect(entry.user_id).toEqual(testUserId);
      expect(entry.log_date >= new Date('2024-01-02')).toBe(true);
    });

    // Check specific entries
    const calories = result.map(r => r.calories).sort();
    expect(calories).toEqual([200, 500]);
  });

  it('should filter entries by end_date', async () => {
    const input: GetFoodLogEntriesInput = {
      user_id: testUserId,
      end_date: '2024-01-02'
    };

    const result = await getFoodLogEntries(input);

    expect(result).toHaveLength(2);
    result.forEach(entry => {
      expect(entry.user_id).toEqual(testUserId);
      expect(entry.log_date <= new Date('2024-01-02')).toBe(true);
    });

    // Check specific entries
    const calories = result.map(r => r.calories).sort();
    expect(calories).toEqual([300, 500]);
  });

  it('should filter entries by date range', async () => {
    const input: GetFoodLogEntriesInput = {
      user_id: testUserId,
      start_date: '2024-01-02',
      end_date: '2024-01-02'
    };

    const result = await getFoodLogEntries(input);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(testUserId);
    expect(result[0].calories).toEqual(500);
    expect(result[0].log_date).toEqual(new Date('2024-01-02'));
  });

  it('should return empty array when no entries match criteria', async () => {
    const input: GetFoodLogEntriesInput = {
      user_id: testUserId,
      start_date: '2024-01-10',
      end_date: '2024-01-20'
    };

    const result = await getFoodLogEntries(input);

    expect(result).toHaveLength(0);
  });

  it('should only return entries for specified user', async () => {
    const input: GetFoodLogEntriesInput = {
      user_id: otherUserId
    };

    const result = await getFoodLogEntries(input);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(otherUserId);
    expect(result[0].calories).toEqual(400);
  });

  it('should return empty array for non-existent user', async () => {
    const input: GetFoodLogEntriesInput = {
      user_id: 99999
    };

    const result = await getFoodLogEntries(input);

    expect(result).toHaveLength(0);
  });

  it('should return entries ordered by log_date descending', async () => {
    const input: GetFoodLogEntriesInput = {
      user_id: testUserId
    };

    const result = await getFoodLogEntries(input);

    expect(result).toHaveLength(3);
    
    // Verify descending order by log_date
    expect(result[0].log_date).toEqual(new Date('2024-01-03')); // Most recent first
    expect(result[1].log_date).toEqual(new Date('2024-01-02'));
    expect(result[2].log_date).toEqual(new Date('2024-01-01')); // Oldest last
  });
});
