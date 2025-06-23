
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type UpdateUserProfileInput } from '../schema';
import { updateUserProfile } from '../handlers/update_user_profile';
import { eq } from 'drizzle-orm';

describe('updateUserProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update an existing user profile', async () => {
    // Create test user profile first
    const createResult = await db.insert(userProfilesTable)
      .values({
        daily_calorie_target: 2000
      })
      .returning()
      .execute();

    const testInput: UpdateUserProfileInput = {
      id: createResult[0].id,
      daily_calorie_target: 2500
    };

    const result = await updateUserProfile(testInput);

    // Basic field validation
    expect(result.id).toEqual(createResult[0].id);
    expect(result.daily_calorie_target).toEqual(2500);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(result.created_at.getTime());
  });

  it('should save updated profile to database', async () => {
    // Create test user profile first
    const createResult = await db.insert(userProfilesTable)
      .values({
        daily_calorie_target: 1800
      })
      .returning()
      .execute();

    const testInput: UpdateUserProfileInput = {
      id: createResult[0].id,
      daily_calorie_target: 2200
    };

    await updateUserProfile(testInput);

    // Query updated record
    const profiles = await db.select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, createResult[0].id))
      .execute();

    expect(profiles).toHaveLength(1);
    expect(profiles[0].daily_calorie_target).toEqual(2200);
    expect(profiles[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent user profile', async () => {
    const testInput: UpdateUserProfileInput = {
      id: 999, // Non-existent ID
      daily_calorie_target: 2000
    };

    await expect(updateUserProfile(testInput)).rejects.toThrow(/not found/i);
  });

  it('should preserve created_at timestamp when updating', async () => {
    // Create test user profile first
    const createResult = await db.insert(userProfilesTable)
      .values({
        daily_calorie_target: 1500
      })
      .returning()
      .execute();

    const originalCreatedAt = createResult[0].created_at;

    const testInput: UpdateUserProfileInput = {
      id: createResult[0].id,
      daily_calorie_target: 1800
    };

    const result = await updateUserProfile(testInput);

    // Verify created_at remains unchanged
    expect(result.created_at.getTime()).toEqual(originalCreatedAt.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThan(originalCreatedAt.getTime());
  });
});
