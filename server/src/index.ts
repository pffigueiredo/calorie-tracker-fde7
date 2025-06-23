
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createUserProfileInputSchema,
  updateUserProfileInputSchema,
  createFoodLogEntryInputSchema,
  getFoodLogEntriesInputSchema,
  getDailySummaryInputSchema
} from './schema';

// Import handlers
import { createUserProfile } from './handlers/create_user_profile';
import { updateUserProfile } from './handlers/update_user_profile';
import { getUserProfile } from './handlers/get_user_profile';
import { createFoodLogEntry } from './handlers/create_food_log_entry';
import { getFoodLogEntries } from './handlers/get_food_log_entries';
import { getDailySummary } from './handlers/get_daily_summary';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // User profile routes
  createUserProfile: publicProcedure
    .input(createUserProfileInputSchema)
    .mutation(({ input }) => createUserProfile(input)),
    
  updateUserProfile: publicProcedure
    .input(updateUserProfileInputSchema)
    .mutation(({ input }) => updateUserProfile(input)),
    
  getUserProfile: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUserProfile(input.userId)),
    
  // Food log entry routes
  createFoodLogEntry: publicProcedure
    .input(createFoodLogEntryInputSchema)
    .mutation(({ input }) => createFoodLogEntry(input)),
    
  getFoodLogEntries: publicProcedure
    .input(getFoodLogEntriesInputSchema)
    .query(({ input }) => getFoodLogEntries(input)),
    
  // Daily summary route
  getDailySummary: publicProcedure
    .input(getDailySummaryInputSchema)
    .query(({ input }) => getDailySummary(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
