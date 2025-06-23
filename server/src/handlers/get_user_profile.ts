import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type UserProfile } from '../schema';
import { eq } from 'drizzle-orm';

export const getUserProfile = async (userId: number): Promise<UserProfile | null> => {
  try {
    const result = await db.select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, userId))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const profile = result[0];
    return {
      id: profile.id,
      daily_calorie_target: profile.daily_calorie_target,
      created_at: profile.created_at,
      updated_at: profile.updated_at
    };
  } catch (error) {
    console.error('Failed to get user profile:', error);
    throw error;
  }
};