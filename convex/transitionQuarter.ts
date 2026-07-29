import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const transitionQuarter = mutation({
  args: {
    matchId: v.string(),
    homeTeam: v.string(),
    awayTeam: v.string(),
    quarter: v.number(),
    homeScore: v.number(),
    awayScore: v.number(),
    status: v.number(),
    timestamp: v.number(),
    hasAllQuarters: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("quarters")
      .withIndex("by_matchId", (q) => q.eq("matchId", args.matchId).eq("quarter", args.quarter))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        homeScore: args.homeScore,
        awayScore: args.awayScore,
        status: args.status,
        timestamp: args.timestamp,
      });
    } else {
      await ctx.db.insert("quarters", {
        matchId: args.matchId,
        homeTeam: args.homeTeam,
        awayTeam: args.awayTeam,
        quarter: args.quarter,
        homeScore: args.homeScore,
        awayScore: args.awayScore,
        status: args.status,
        timestamp: args.timestamp,
        hasAllQuarters: args.hasAllQuarters,
      });
    }
  },
});

export default transitionQuarter;