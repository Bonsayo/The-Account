import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const upsertMatch = mutation({
  args: {
    matchId: v.string(),
    homeTeam: v.string(),
    awayTeam: v.string(),
    homeScore: v.number(),
    awayScore: v.number(),
    periodScores: v.array(v.object({
      period: v.number(),
      homeScore: v.number(),
      awayScore: v.number(),
      label: v.string(),
    })),
    finished: v.boolean(),
    startTime: v.number(),
    sportName: v.string(),
    league: v.string(),
    timestamp: v.number(),
    hasAllQuarters: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("matches")
      .withIndex("by_matchId", (q) => q.eq("matchId", args.matchId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        homeScore: args.homeScore,
        awayScore: args.awayScore,
        periodScores: args.periodScores,
        finished: args.finished,
        timestamp: args.timestamp,
        hasAllQuarters: args.hasAllQuarters,
      });
    } else {
      await ctx.db.insert("matches", {
        matchId: args.matchId,
        homeTeam: args.homeTeam,
        awayTeam: args.awayTeam,
        homeScore: args.homeScore,
        awayScore: args.awayScore,
        periodScores: args.periodScores,
        finished: args.finished,
        startTime: args.startTime,
        sportName: args.sportName,
        league: args.league,
        timestamp: args.timestamp,
        hasAllQuarters: args.hasAllQuarters,
      });
    }
  },
});

export default upsertMatch;