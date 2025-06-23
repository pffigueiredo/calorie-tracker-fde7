
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type CreateUserProfileInput } from '../schema';
import { createUserProfile } from '../handlers/create_user_profile';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateUserProfileInput = {
  daily_calorie_target: 2000
};

describe('createUserProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user profile', async () => {
    const result = await createUserProfile(testInput);

    // Basic field validation
    expect(result.daily_calorie_target).toEqual(2000);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save user profile to database', async () => {
    const result = await createUserProfile(testInput);

    // Query using proper drizzle syntax
    const userProfiles = await db.select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, result.id))
      .execute();

    expect(userProfiles).toHaveLength(1);
    expect(userProfiles[0].daily_calorie_target).toEqual(2000);
    expect(userProfiles[0].created_at).toBeInstanceOf(Date);
    expect(userProfiles[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create profile with different calorie targets', async () => {
    const highTargetInput: CreateUserProfileInput = {
      daily_calorie_target: 3000
    };

    const result = await createUserProfile(highTargetInput);

    expect(result.daily_calorie_target).toEqual(3000);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify in database
    const userProfiles = await db.select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, result.id))
      .execute();

    expect(userProfiles[0].daily_calorie_target).toEqual(3000);
  });
});
