
import { serial, integer, pgTable, timestamp, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userProfilesTable = pgTable('user_profiles', {
  id: serial('id').primaryKey(),
  daily_calorie_target: integer('daily_calorie_target').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

export const foodLogEntriesTable = pgTable('food_log_entries', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => userProfilesTable.id),
  calories: integer('calories').notNull(),
  log_date: date('log_date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Define relations
export const userProfilesRelations = relations(userProfilesTable, ({ many }) => ({
  foodLogEntries: many(foodLogEntriesTable)
}));

export const foodLogEntriesRelations = relations(foodLogEntriesTable, ({ one }) => ({
  userProfile: one(userProfilesTable, {
    fields: [foodLogEntriesTable.user_id],
    references: [userProfilesTable.id]
  })
}));

// TypeScript types for the table schemas
export type UserProfile = typeof userProfilesTable.$inferSelect;
export type NewUserProfile = typeof userProfilesTable.$inferInsert;
export type FoodLogEntry = typeof foodLogEntriesTable.$inferSelect;
export type NewFoodLogEntry = typeof foodLogEntriesTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  userProfiles: userProfilesTable, 
  foodLogEntries: foodLogEntriesTable 
};
