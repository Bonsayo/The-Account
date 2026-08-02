"use client";

import { useQuery } from "convex/react";
import { useState, useMemo } from "react";

type PeriodScore = {
  period: number;
  homeScore: number;
  awayScore: number;
  label: string;
};

type Quarter = {
  matchId: string;
  quarter: number;
  homeScore: number;
  awayScore: number;
  status: number;
  timestamp?: number;
};

type Match = {
  _id: string;
  matchId: string;
  homeTeam?: string;
  awayTeam?: string;
  homeScore?: number;
  awayScore?: number;
  periodScores?: PeriodScore[];
  finished?: boolean;
  startTime?: number;
  timestamp?: number;
  hasAllQuarters?: boolean;
  quarters: Quarter[];
};

const LOGO_MAP: Record<string, string> = {
  "golden state warriors": "GSW",
  "los angeles lakers": "LAL",
  "los angeles clippers": "LAC",
  "miami heat": "MIA",
  "boston celtics": "BOS",
  "chicago bulls": "CHI",
  "philadelphia 76ers": "PHI",
  "milwaukee bucks": "MIL",
  "phoenix suns": "PHX",
  "denver nuggets": "DEN",
  "dallas mavericks": "DAL",
  "brooklyn nets": "BKN",
  "new york knicks": "NYK",
  "toronto raptors": "TOR",
  "atlanta hawks": "ATL",
  "cleveland cavaliers": "CLE",
  "detroit pistons": "DET",
  "indiana pacers": "IND",
  "orlando magic": "ORL",
  "washington wizards": "WAS",
  "charlotte hornets": "CHA",
  "memphis grizzlies": "MEM",
  "new orleans pelicans": "NOP",
  "san antonio spurs": "SAS",
  "houston rockets": "HOU",
  "oklahoma city thunder": "OKC",
  "utah jazz": "UTA",
  "sacramento kings": "SAC",
  "portland trail blazers": "POR",
  "minnesota timberwolves": "MIN",
};

function cleanName(name?: string): string {
  return (name || "").replace(/\s*\(cyber\)$/g, "").trim() || name || "???";
}

function abbr(name?: string): string {
  const key = (name || "").toLowerCase().replace(/\s*\(cyber\)$/, "").trim();
  return LOGO_MAP[key] || (name || "")
    .split(" ")
    .filter((w) => w[0]?.toUpperCase() === w[0])
    .map((w) => w[0])
    .join("")
    .slice(0, 3) || "???";
}

function fmtTime(ts?: number): string {
  if (!ts) return "";
  const ms = ts > 1e12 ? ts : ts * 1000;
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function fmtTimeShort(ts?: number): string {
  if (!ts) return "";
  const ms = ts > 1e12 ? ts : ts * 1000;
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function currentQuarterLabel(quarters: Quarter[]): string {
  if (!quarters.length) return "SCHEDULED";
  const live = quarters.find((q) => q.status === 1);
  if (live) return `Q${live.quarter}`;
  const highest = quarters.reduce((max, q) => Math.max(max, q.quarter), 0);
  return highest >= 4 ? "" : `Q${highest}`;
}

function quarterTotals(quarters: Quarter[]) {
  let h = 0,
    a = 0;
  for (const q of quarters) {
    if (q.quarter >= 1 && q.quarter <= 4) {
      h += q.homeScore;
      a += q.awayScore;
    }
  }
  return { home: h, away: a };
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="p-4 flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2">
          <div className="h-6 w-20 bg-gray-200 rounded" />
          <div className="h-4 w-32 bg-gray-200 rounded" />
        </div>
        <div className="flex justify-between items-center py-4">
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="w-16 h-16 bg-gray-200 rounded-full" />
            <div className="h-4 w-24 bg-gray-200 rounded" />
          </div>
          <div className="flex flex-col items-center px-6">
            <div className="h-12 w-24 bg-gray-200 rounded" />
          </div>
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="w-16 h-16 bg-gray-200 rounded-full" />
            <div className="h-4 w-24 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="h-16 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

const ALL_QUARTERS = [1, 2, 3, 4];

type QuarterCellProps = {
  quarter: number;
  matchQuarters: Quarter[];
  isFinished: boolean;
};

function QuarterCell({ quarter, matchQuarters, isFinished }: QuarterCellProps) {
  const q = matchQuarters.find((q) => q.quarter === quarter);
  const isLive = q?.status === 1;

  if (!q) {
    return (
      <div className="text-center p-1 text-gray-300 text-xs font-mono">
        -- / --
      </div>
    );
  }

  return (
    <div
      className={`text-center p-1 text-xs font-mono ${
        isLive ? "bg-green-50 rounded font-bold text-green-800" : ""
      }`}
    >
      <div className="text-gray-600">{q.homeScore}</div>
      <div className="text-gray-500">-</div>
      <div className="text-gray-600">{q.awayScore}</div>
    </div>
  );
}

function MatchCard({ m }: { m: Match }) {
  const homeTeam = cleanName(m.homeTeam);
  const awayTeam = cleanName(m.awayTeam);
  const hAbbr = abbr(m.homeTeam);
  const aAbbr = abbr(m.awayTeam);
  const isLive = !m.finished;
  const isScheduled = !m.finished && m.quarters.length === 0;
  const cql = currentQuarterLabel(m.quarters);
  const isExpanded = isLive || m.hasAllQuarters;

  const totals = quarterTotals(m.quarters);
  const winner =
    m.finished && m.homeScore != null && m.awayScore != null
      ? m.homeScore > m.awayScore
        ? "home"
        : m.awayScore > m.homeScore
          ? "away"
          : null
      : null;

  return (
    <div
      className={`bg-white rounded-xl border transition-all ${
        m.finished
          ? "border-gray-200 opacity-75 hover:opacity-100"
          : "border-green-200 shadow-sm shadow-green-100/50"
      } overflow-hidden hover:shadow-md`}
    >
      <div className="p-4 flex flex-col gap-3">
        {/* Status bar */}
        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold tracking-wider ${
              isLive
                ? "bg-green-500 text-green-950"
                : isScheduled
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-500"
            }`}
          >
            {isLive && (
              <span className="w-1.5 h-1.5 rounded-full bg-green-950 animate-pulse" />
            )}
            {isLive ? `LIVE ${cql ? `· ${cql}` : ""}` : isScheduled ? "SCHEDULED" : "FINAL"}
          </div>
          <div className="text-xs text-gray-400 tabular-nums">
            {isLive
              ? fmtTimeShort(m.startTime)
              : m.finished
                ? fmtTimeShort(m.timestamp ?? m.startTime)
                : fmtTimeShort(m.startTime)}
          </div>
        </div>

        {/* Teams + Score */}
        <div className="flex justify-between items-center py-2">
          {/* Home */}
          <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-gray-500 font-mono">
                {hAbbr}
              </span>
            </div>
            <span className="font-semibold text-sm text-center leading-tight line-clamp-2">
              {homeTeam}
            </span>
            <span className="text-[10px] tracking-wider text-gray-400 uppercase">
              {hAbbr}
            </span>
          </div>

          {/* Score */}
          <div className="flex flex-col items-center px-4">
            <div className="flex items-baseline gap-3">
              <span
                className={`font-archivo text-4xl font-bold leading-none tabular-nums ${
                  m.finished && winner === "away" ? "text-gray-300" : ""
                }`}
              >
                {totals.home}
              </span>
              <span className="text-gray-400 text-lg font-semibold">-</span>
              <span
                className={`font-archivo text-4xl font-bold leading-none tabular-nums ${
                  m.finished && winner === "home" ? "text-gray-300" : ""
                }`}
              >
                {totals.away}
              </span>
            </div>
            {m.finished && winner && (
              <span className="text-[10px] tracking-wider text-gray-500 mt-0.5">
                {(winner === "home" ? awayTeam : homeTeam).split(" ")[0]} Wins
              </span>
            )}
          </div>

          {/* Away */}
          <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-gray-500 font-mono">
                {aAbbr}
              </span>
            </div>
            <span className="font-semibold text-sm text-center leading-tight line-clamp-2">
              {awayTeam}
            </span>
            <span className="text-[10px] tracking-wider text-gray-400 uppercase">
              {aAbbr}
            </span>
          </div>
        </div>

        {/* Quarter breakdown */}
        {m.quarters.length > 0 ? (
          <div className="border-t border-gray-100 pt-3">
            <div className="grid grid-cols-4 gap-1 max-w-sm mx-auto">
              {ALL_QUARTERS.map((q) => (
                <div key={q} className="text-center">
                  <div className="text-[10px] font-semibold text-gray-400 tracking-wider mb-1 uppercase">
                    Q{q}
                  </div>
                  <QuarterCell
                    quarter={q}
                    matchQuarters={m.quarters}
                    isFinished={!!m.finished}
                  />
                </div>
              ))}
            </div>
            {/* Running total */}
            <div className="text-center mt-2 pt-2 border-t border-dashed border-gray-200">
              <div className="text-xs font-semibold text-gray-400 tracking-wider uppercase mb-1">
                Total
              </div>
              <div className="text-sm font-bold tabular-nums font-mono">
                {totals.home} - {totals.away}
              </div>
            </div>
          </div>
        ) : !m.finished ? (
          <div className="border-t border-gray-100 pt-3 text-center text-xs text-gray-400">
            Game starts{" "}
            {m.startTime ? fmtTime(m.startTime) : "soon"}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const FILTERS = ["all", "live", "finished"] as const;

export default function Dashboard() {
  const rawData = useQuery("matches:listAllWithQuarters");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [search, setSearch] = useState("");

  const matches: Match[] = useMemo(() => {
    return (rawData ?? []) as unknown as Match[];
  }, [rawData]);

  const isLoading = rawData === undefined;

  const filtered = useMemo(() => {
    let result = matches;
    if (filter === "live") result = result.filter((m) => !m.finished);
    if (filter === "finished") result = result.filter((m) => m.finished);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((m) => {
        const h = cleanName(m.homeTeam).toLowerCase();
        const a = cleanName(m.awayTeam).toLowerCase();
        return h.includes(q) || a.includes(q);
      });
    }
    return result.sort((a, b) => {
      if (!a.finished && b.finished) return -1;
      if (a.finished && !b.finished) return 1;
      const aTs = a.startTime || a.timestamp || 0;
      const bTs = b.startTime || b.timestamp || 0;
      return bTs - aTs;
    });
  }, [matches, filter, search]);

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e]">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 h-16 bg-[#f7f9fb]/80 backdrop-blur-sm border-b border-gray-200 flex items-center justify-between px-4 md:px-8">
        <h1 className="font-archivo text-xl font-bold text-green-700 tracking-tight">
          COURTSIDE LIVE
        </h1>
        <div className="hidden md:flex flex-1 max-w-xs mx-4 relative">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by team..."
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 pl-9 text-sm outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-colors"
          />
          <svg
            className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </header>

      <main className="pt-20 px-4 md:px-8 max-w-7xl mx-auto pb-24">
        {/* Mobile search */}
        <div className="md:hidden mb-4 relative">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by team..."
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 pl-9 text-sm outline-none focus:border-green-400"
          />
          <svg
            className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 border-b border-gray-200">
          {FILTERS.map((f) => {
            const count =
              f === "all"
                ? matches.length
                : f === "live"
                  ? matches.filter((m) => !m.finished).length
                  : matches.filter((m) => m.finished).length;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider whitespace-nowrap transition-all ${
                  filter === f
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f === "live" && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse mr-1" />
                )}
                {f.charAt(0).toUpperCase() + f.slice(1)}
                <span className="ml-1 opacity-60">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Info bar */}
        <div className="flex justify-between items-center mb-4 text-xs text-gray-400">
          <span>
            {isLoading
              ? "Loading..."
              : `${matches.length} match${matches.length !== 1 ? "es" : ""}${
                  filter !== "all" ? ` (${filtered.length} ${filter})` : ""
                }`}
          </span>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <svg
              className="w-12 h-12 mx-auto text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <p className="text-gray-400 text-sm font-medium">
              {search ? "No matches match your search" : "No matches yet"}
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="mt-2 text-xs text-green-600 hover:text-green-700"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filtered.map((m) => (
              <MatchCard key={m._id} m={m} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
