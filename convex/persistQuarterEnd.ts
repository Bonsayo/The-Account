import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const persistQuarterEnd = mutation({
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
        status: 3,
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
        status: 3,
        timestamp: args.timestamp,
        hasAllQuarters: true,
      });
    }

    const matchWithQuarters = await ctx.db
      .query("matches")
      .withIndex("by_matchId", (q) => q.eq("matchId", args.matchId))
      .first();

    if (matchWithQuarters && args.quarter >= 4) {
      const allQuarters = await ctx.db
        .query("quarters")
        .withIndex("by_matchId", (q) => q.eq("matchId", args.matchId))
        .collect();
      const q1 = allQuarters.find(q => q.quarter === 1);
      const q2 = allQuarters.find(q => q.quarter === 2);
      const q3 = allQuarters.find(q => q.quarter === 3);
      const q4 = allQuarters.find(q => q.quarter === 4);
      const hasAllQuarters = !!(q1 && q2 && q3 && q4);

      if (hasAllQuarters) {
        const totalHome = (q1?.homeScore ?? 0) + (q2?.homeScore ?? 0) + (q3?.homeScore ?? 0) + (q4?.homeScore ?? 0);
        const totalAway = (q1?.awayScore ?? 0) + (q2?.awayScore ?? 0) + (q3?.awayScore ?? 0) + (q4?.awayScore ?? 0);
        const q4Finished = q4 && q4.status === 3;

        await ctx.db.patch(matchWithQuarters._id, {
          finished: q4Finished,
          homeScore: totalHome,
          awayScore: totalAway,
          timestamp: args.timestamp,
          hasAllQuarters: true,
        });
      }
    }
  },
});

export default persistQuarterEnd;