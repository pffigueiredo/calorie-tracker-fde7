
import { z } from 'zod';

// User profile schema
export const userProfileSchema = z.object({
  id: z.number(),
  daily_calorie_target: z.number().positive(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type UserProfile = z.infer<typeof userProfileSchema>;

// Food log entry schema
export const foodLogEntrySchema = z.object({
  id: z.number(),
  user_id: z.number(),
  calories: z.number().positive(),
  log_date: z.coerce.date(),
  created_at: z.coerce.date()
});

export type FoodLogEntry = z.infer<typeof foodLogEntrySchema>;

// Daily summary schema (calculated data)
export const dailySummarySchema = z.object({
  log_date: z.coerce.date(),
  total_calories: z.number(),
  daily_target: z.number(),
  remaining_calories: z.number(),
  entries: z.array(foodLogEntrySchema)
});

export type DailySummary = z.infer<typeof dailySummarySchema>;

// Input schemas
export const createUserProfileInputSchema = z.object({
  daily_calorie_target: z.number().positive()
});

export type CreateUserProfileInput = z.infer<typeof createUserProfileInputSchema>;

export const updateUserProfileInputSchema = z.object({
  id: z.number(),
  daily_calorie_target: z.number().positive()
});

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileInputSchema>;

export const createFoodLogEntryInputSchema = z.object({
  user_id: z.number(),
  calories: z.number().positive(),
  log_date: z.string().optional() // Optional, defaults to today if not provided
});

export type CreateFoodLogEntryInput = z.infer<typeof createFoodLogEntryInputSchema>;

export const getFoodLogEntriesInputSchema = z.object({
  user_id: z.number(),
  start_date: z.string().optional(),
  end_date: z.string().optional()
});

export type GetFoodLogEntriesInput = z.infer<typeof getFoodLogEntriesInputSchema>;

export const getDailySummaryInputSchema = z.object({
  user_id: z.number(),
  log_date: z.string().optional() // Optional, defaults to today if not provided
});

export type GetDailySummaryInput = z.infer<typeof getDailySummaryInputSchema>;
