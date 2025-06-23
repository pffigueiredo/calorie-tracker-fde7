
import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type UpdateUserProfileInput, type UserProfile } from '../schema';
import { eq } from 'drizzle-orm';

export const updateUserProfile = async (input: UpdateUserProfileInput): Promise<UserProfile> => {
  try {
    // Update user profile record
    const result = await db.update(userProfilesTable)
      .set({
        daily_calorie_target: input.daily_calorie_target,
        updated_at: new Date()
      })
      .where(eq(userProfilesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`User profile with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('User profile update failed:', error);
    throw error;
  }
};
