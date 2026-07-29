import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("discoveredGames").collect();
  },
});

export const upsert = mutation({
  args: {
    eventId: v.number(),
    homeTeam: v.string(),
    awayTeam: v.string(),
    startTime: v.number(),
    finished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("discoveredGames")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        lastSeen: now,
        finished: args.finished ?? false,
      });
    } else {
      await ctx.db.insert("discoveredGames", {
        eventId: args.eventId,
        homeTeam: args.homeTeam,
        awayTeam: args.awayTeam,
        startTime: args.startTime,
        firstSeen: now,
        lastSeen: now,
        finished: args.finished ?? false,
      });
    }
  },
});

export const markFinished = mutation({
  args: {
    eventId: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("discoveredGames")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { finished: true });
    }
  },
});

export default { list, upsert, markFinished };