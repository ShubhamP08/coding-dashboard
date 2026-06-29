import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";
import { TrendingUp, Trophy, ArrowUp, ArrowDown, Minus } from "lucide-react";

const LC_COLOR = "#fb923c";
const LC_AREA   = "rgba(251,146,60,0.12)";
const GRID_COLOR = "rgba(148,163,184,0.07)";

const formatDate = (ts) => {
  if (!ts) return "";
  return new Date(ts * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "2-digit",
  });
};

const formatNum = (v) => new Intl.NumberFormat("en-US").format(v || 0);

const TrendIcon = ({ direction, size = 14 }) => {
  if (direction === "UP")   return <ArrowUp   size={size} color="#34d399" />;
  if (direction === "DOWN") return <ArrowDown size={size} color="#f87171" />;
  return <Minus size={size} color="#64748b" />;
};

/* ── Custom Tooltip ───────────────────────────────────────────── */
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="lc-chart-tooltip">
      <div className="lc-chart-tooltip-rating">
        <span style={{ color: LC_COLOR }}>{formatNum(d.rating)}</span>
        <TrendIcon direction={d.trendDirection} size={13} />
      </div>
      <div className="lc-chart-tooltip-title">{d.title}</div>
      <div className="lc-chart-tooltip-date">{formatDate(d.startTime)}</div>
      <div className="lc-chart-tooltip-meta">
        <span>Rank #{formatNum(d.ranking)}</span>
        <span>{d.problemsSolved}/{d.totalProblems} solved</span>
      </div>
    </div>
  );
};

/* ── X-axis tick: show date only every N-th label ─────────────── */
const XTick = ({ x, y, payload }) => (
  <text x={x} y={y + 14} textAnchor="middle" fill="#64748b" fontSize={11} fontWeight={700}>
    {formatDate(payload.value)}
  </text>
);

/* ── Y-axis tick ──────────────────────────────────────────────── */
const YTick = ({ x, y, payload }) => (
  <text x={x - 8} y={y + 4} textAnchor="end" fill="#64748b" fontSize={11} fontWeight={700}>
    {payload.value}
  </text>
);

/* ── Summary strip above chart ────────────────────────────────── */
const SummaryStrip = ({ history, currentRating, badge }) => {
  const ratings = history.map((h) => h.rating);
  const peakRating  = Math.max(...ratings);
  const lowestRating = Math.min(...ratings);
  const ups   = history.filter((h) => h.trendDirection === "UP").length;
  const downs = history.filter((h) => h.trendDirection === "DOWN").length;

  return (
    <div className="lc-chart-strip">
      <div className="lc-chart-strip-item">
        <span>Current</span>
        <strong style={{ color: LC_COLOR }}>{formatNum(currentRating)}</strong>
      </div>
      <div className="lc-chart-strip-item">
        <span>Peak</span>
        <strong>{formatNum(peakRating)}</strong>
      </div>
      <div className="lc-chart-strip-item">
        <span>Lowest</span>
        <strong>{formatNum(lowestRating)}</strong>
      </div>
      <div className="lc-chart-strip-item">
        <span>Contests</span>
        <strong>{history.length}</strong>
      </div>
      <div className="lc-chart-strip-item">
        <span>▲ / ▼</span>
        <strong>
          <span style={{ color: "#34d399" }}>{ups}</span>
          {" / "}
          <span style={{ color: "#f87171" }}>{downs}</span>
        </strong>
      </div>
      {badge && (
        <div className="lc-chart-strip-item">
          <span>Badge</span>
          <strong style={{ color: "#facc15" }}>
            <Trophy size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />
            {badge}
          </strong>
        </div>
      )}
    </div>
  );
};

/* ── Main chart component ─────────────────────────────────────── */
export default function LcRatingChart({ profile }) {
  const contestHistory =
    profile?.stats?.contestHistory ||
    profile?.rawData?.contestHistory ||
    [];

  const currentRating =
    profile?.rating ||
    profile?.rawData?.contestRating ||
    profile?.stats?.contestRating ||
    0;

  const badge =
    profile?.stats?.contestBadge ||
    profile?.rawData?.contestBadge ||
    null;

  /* Decide how many x-axis ticks to show based on data density */
  const tickInterval = contestHistory.length > 200
    ? Math.floor(contestHistory.length / 12)
    : contestHistory.length > 80
    ? Math.floor(contestHistory.length / 10)
    : contestHistory.length > 30
    ? Math.floor(contestHistory.length / 8)
    : 0;

  const ratingValues = contestHistory.map((h) => h.rating);
  const ratingMin = ratingValues.length ? Math.max(0, Math.min(...ratingValues) - 80) : 1400;
  const ratingMax = ratingValues.length ? Math.max(...ratingValues) + 80 : 1600;

  if (!contestHistory.length) {
    return (
      <div className="lc-chart-empty">
        <TrendingUp size={32} />
        <p>No contest history yet.</p>
        <p className="lc-chart-empty-hint">
          LeetCode history loads when you <strong>Refresh Profile</strong> from the Platforms page.
          The <code>/contest</code> endpoint returns a full <code>contestParticipation</code> array — it just
          needed to be extracted, which is now done.
        </p>
      </div>
    );
  }

  return (
    <div className="lc-chart-wrap">
      <SummaryStrip
        history={contestHistory}
        currentRating={currentRating}
        badge={badge}
      />

      <div className="lc-chart-container">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart
            data={contestHistory}
            margin={{ top: 10, right: 20, bottom: 8, left: 0 }}
          >
            <defs>
              <linearGradient id="lcGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={LC_COLOR} stopOpacity={0.28} />
                <stop offset="95%" stopColor={LC_COLOR} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />

            <XAxis
              dataKey="startTime"
              interval={tickInterval}
              tick={<XTick />}
              axisLine={{ stroke: GRID_COLOR }}
              tickLine={false}
              height={28}
            />

            <YAxis
              domain={[ratingMin, ratingMax]}
              tick={<YTick />}
              axisLine={false}
              tickLine={false}
              width={48}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: LC_COLOR, strokeWidth: 1, strokeDasharray: "4 3" }} />

            {/* Reference line at current rating */}
            <ReferenceLine
              y={currentRating}
              stroke={LC_COLOR}
              strokeDasharray="6 3"
              strokeOpacity={0.45}
              label={{ value: `Now: ${currentRating}`, position: "insideTopRight", fill: LC_COLOR, fontSize: 11, fontWeight: 700 }}
            />

            <Area
              type="monotone"
              dataKey="rating"
              stroke={LC_COLOR}
              strokeWidth={2.5}
              fill="url(#lcGradient)"
              dot={contestHistory.length <= 50 ? { r: 3.5, fill: LC_COLOR, stroke: "#0f172a", strokeWidth: 2 } : false}
              activeDot={{ r: 6, fill: LC_COLOR, stroke: "#0f172a", strokeWidth: 2 }}
              isAnimationActive={true}
              animationDuration={600}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="lc-chart-note">
        {contestHistory.length} rated contest{contestHistory.length !== 1 ? "s" : ""} ·
        hover any point for details · sorted oldest → newest
      </p>
    </div>
  );
}
