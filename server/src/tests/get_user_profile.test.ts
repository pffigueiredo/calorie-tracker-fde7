
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { getUserProfile } from '../handlers/get_user_profile';

describe('getUserProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user profile when user exists', async () => {
    // Create test user profile
    const testProfile = await db.insert(userProfilesTable)
      .values({
        daily_calorie_target: 2500
      })
      .returning()
      .execute();

    const userId = testProfile[0].id;

    const result = await getUserProfile(userId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(userId);
    expect(result!.daily_calorie_target).toEqual(2500);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when user does not exist', async () => {
    const nonExistentUserId = 999;

    const result = await getUserProfile(nonExistentUserId);

    expect(result).toBeNull();
  });

  it('should return correct profile for specific user', async () => {
    // Create multiple user profiles
    const profile1 = await db.insert(userProfilesTable)
      .values({
        daily_calorie_target: 1800
      })
      .returning()
      .execute();

    const profile2 = await db.insert(userProfilesTable)
      .values({
        daily_calorie_target: 2200
      })
      .returning()
      .execute();

    // Get specific user profile
    const result = await getUserProfile(profile2[0].id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(profile2[0].id);
    expect(result!.daily_calorie_target).toEqual(2200);
    expect(result!.id).not.toEqual(profile1[0].id);
  });
});
