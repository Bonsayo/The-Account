import { query } from "./_generated/server";

export const listMatches = query({
  args: {},
  handler: async (ctx) => {
    const matches = await ctx.db.query("matches").order("desc").collect();
    return matches;
  },
});

export const listMatchesWithQuarters = query({
  args: {},
  handler: async (ctx) => {
    const matches = await ctx.db.query("matches").order("desc").collect();
    const quarters = await ctx.db.query("quarters").collect();

    const qMap: Record<string, any[]> = {};
    for (const q of quarters) {
      if (!qMap[q.matchId]) qMap[q.matchId] = [];
      qMap[q.matchId].push(q);
    }

    return matches.map((m) => ({
      ...m,
      quarters: (qMap[m.matchId] ?? []).sort((a: any, b: any) => a.quarter - b.quarter),
    }));
  },
});