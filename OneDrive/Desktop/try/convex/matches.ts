import { query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

export const listAllWithQuarters = query({
  args: {},
  handler: async (ctx) => {
    const [matches, quarters] = await Promise.all([
      ctx.db.query("matches").order("desc").take(200),
      ctx.db.query("quarters").take(2000),
    ]);

    const qMap: Record<string, any[]> = {};
    for (const q of quarters) {
      if (!qMap[q.matchId]) qMap[q.matchId] = [];
      qMap[q.matchId].push(q);
    }

    return matches.map((m) => ({
      ...m,
      quarters: (qMap[m.matchId] ?? []).sort((a, b) => a.quarter - b.quarter),
    }));
  },
});

export const listPaginatedWithQuarters = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("matches")
      .order("desc")
      .paginate(args.paginationOpts);

    const matchIds = result.page.map((m) => m.matchId);
    const allQuarters: any[] = [];

    for (const matchId of matchIds) {
      const qs = await ctx.db
        .query("quarters")
        .withIndex("by_matchId", (q) => q.eq("matchId", matchId))
        .collect();
      allQuarters.push(...qs);
    }

    const qMap: Record<string, any[]> = {};
    for (const q of allQuarters) {
      if (!qMap[q.matchId]) qMap[q.matchId] = [];
      qMap[q.matchId].push(q);
    }

    return {
      ...result,
      page: result.page.map((m) => ({
        ...m,
        quarters: (qMap[m.matchId] ?? []).sort((a: any, b: any) => a.quarter - b.quarter),
      })),
    };
  },
});
