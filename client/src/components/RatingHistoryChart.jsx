import { useMemo, useRef, useState } from "react";
import { TrendingUp } from "lucide-react";

const PADDING = { top: 28, right: 24, bottom: 52, left: 56 };
const W = 900;
const H = 300;
const INNER_W = W - PADDING.left - PADDING.right;
const INNER_H = H - PADDING.top - PADDING.bottom;

const CF_COLOR = "#60a5fa";
const LC_COLOR = "#fb923c";
const GRID_COLOR = "rgba(148,163,184,0.08)";
const LABEL_COLOR = "#64748b";

const formatDate = (ts) => {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
};

const buildSeries = (ratingGraph) =>
  (ratingGraph || [])
    .filter((p) => p.time > 0)
    .map((p) => ({ rating: p.rating, time: p.time, label: p.contestName || "" }));

export default function RatingHistoryChart({ cfProfile, lcProfile }) {
  const tooltipRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [hiddenLines, setHiddenLines] = useState({});

  const cfSeries = useMemo(
    () => buildSeries(cfProfile?.stats?.ratingGraph || cfProfile?.rawData?.ratingGraph),
    [cfProfile]
  );

  const lcRating = lcProfile?.rating || lcProfile?.rawData?.contestRating || 0;
  const lcSeries = useMemo(() => {
    // Prefer real contest history (populated after a refresh)
    const contestHistory =
      lcProfile?.stats?.contestHistory ||
      lcProfile?.rawData?.contestHistory;

    if (Array.isArray(contestHistory) && contestHistory.length > 0) {
      return contestHistory.map((c) => ({
        rating:    c.rating,
        time:      c.startTime,
        label:     c.title || "",
        ranking:   c.ranking || 0,
        trend:     c.trendDirection || "NONE",
        solved:    c.problemsSolved,
        total:     c.totalProblems,
      }));
    }

    // Nothing stored yet: fall back to a flat reference line so the chart
    // still shows something until the user refreshes their LC profile.
    if (!lcRating) return [];
    if (cfSeries.length >= 2) {
      return [
        { rating: lcRating, time: cfSeries[0].time, label: "LeetCode (refresh to load history)" },
        { rating: lcRating, time: cfSeries[cfSeries.length - 1].time, label: "LeetCode (refresh to load history)" },
      ];
    }
    return [{ rating: lcRating, time: Date.now() / 1000, label: "LeetCode Contest Rating" }];
  }, [lcRating, lcProfile, cfSeries]);


  const allPoints = useMemo(() => [...cfSeries, ...lcSeries], [cfSeries, lcSeries]);

  const { minRating, maxRating, minTime, maxTime } = useMemo(() => {
    if (!allPoints.length) return { minRating: 0, maxRating: 3000, minTime: 0, maxTime: 1 };
    const ratings = allPoints.map((p) => p.rating).filter(Boolean);
    const times = allPoints.map((p) => p.time).filter(Boolean);
    return {
      minRating: Math.max(0, Math.min(...ratings) - 100),
      maxRating: Math.max(...ratings) + 100,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
    };
  }, [allPoints]);

  const toX = (t) =>
    maxTime === minTime ? PADDING.left + INNER_W / 2 : PADDING.left + ((t - minTime) / (maxTime - minTime)) * INNER_W;

  const toY = (r) =>
    maxRating === minRating
      ? PADDING.top + INNER_H / 2
      : PADDING.top + (1 - (r - minRating) / (maxRating - minRating)) * INNER_H;

  const makePath = (series) =>
    series.length < 2
      ? series.length === 1
        ? `M${toX(series[0].time)},${toY(series[0].rating)}`
        : ""
      : series.map((p, i) => `${i === 0 ? "M" : "L"}${toX(p.time)},${toY(p.rating)}`).join(" ");

  const makeAreaPath = (series) => {
    if (series.length < 2) return "";
    const linePart = series.map((p, i) => `${i === 0 ? "M" : "L"}${toX(p.time)},${toY(p.rating)}`).join(" ");
    const last = series[series.length - 1];
    const first = series[0];
    return `${linePart} L${toX(last.time)},${PADDING.top + INNER_H} L${toX(first.time)},${PADDING.top + INNER_H} Z`;
  };

  // Y-axis tick values
  const yTicks = useMemo(() => {
    const range = maxRating - minRating;
    const step = range > 2000 ? 500 : range > 1000 ? 250 : range > 500 ? 100 : 50;
    const ticks = [];
    const start = Math.ceil(minRating / step) * step;
    for (let v = start; v <= maxRating; v += step) ticks.push(v);
    return ticks;
  }, [minRating, maxRating]);

  // X-axis labels (show every Nth CF point)
  const xLabels = useMemo(() => {
    if (!cfSeries.length) return [];
    const maxLabels = 7;
    const step = Math.max(1, Math.ceil(cfSeries.length / maxLabels));
    return cfSeries.filter((_, i) => i % step === 0 || i === cfSeries.length - 1);
  }, [cfSeries]);

  const toggleLine = (key) =>
    setHiddenLines((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleMouseMove = (e, series, color, key) => {
    if (hiddenLines[key] || !series.length) return;
    const svg = e.currentTarget.closest("svg");
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const mouseTime = minTime + ((svgX - PADDING.left) / INNER_W) * (maxTime - minTime);
    let closest = series[0];
    let dist = Infinity;
    series.forEach((p) => {
      const d = Math.abs(p.time - mouseTime);
      if (d < dist) { dist = d; closest = p; }
    });
    setTooltip({
      x: toX(closest.time),
      y: toY(closest.rating),
      rating: closest.rating,
      label: closest.label,
      time: closest.time,
      color,
      key,
      ranking: closest.ranking || 0,
      trend: closest.trend || "NONE",
      solved: closest.solved ?? null,
      total: closest.total ?? null,
    });
  };

  const hasCF = cfSeries.length > 0;
  const hasLC = lcSeries.length > 0;

  if (!hasCF && !hasLC) {
    return (
      <div className="rating-chart-empty">
        <TrendingUp size={32} />
        <p>No rating history available yet. Connect Codeforces or LeetCode to see your chart.</p>
      </div>
    );
  }

  return (
    <div className="rating-chart-wrap">
      {/* Legend */}
      <div className="rating-chart-legend">
        {hasCF && (
          <button
            type="button"
            className={`legend-pill${hiddenLines.cf ? " legend-pill-off" : ""}`}
            style={{ "--pill-color": CF_COLOR }}
            onClick={() => toggleLine("cf")}
          >
            <span className="legend-dot" />
            Codeforces
            {cfProfile?.rating ? ` (${cfProfile.rating})` : ""}
          </button>
        )}
        {hasLC && (
          <button
            type="button"
            className={`legend-pill${hiddenLines.lc ? " legend-pill-off" : ""}`}
            style={{ "--pill-color": LC_COLOR }}
            onClick={() => toggleLine("lc")}
          >
            <span className="legend-dot" />
            LeetCode
            {lcRating ? ` (${lcRating})` : ""}
          </button>
        )}
      </div>

      <div className="rating-chart-svg-wrap">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="rating-chart-svg"
          role="img"
          aria-label="Rating history chart"
          onMouseLeave={() => setTooltip(null)}
        >
          <defs>
            <linearGradient id="cfAreaGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={CF_COLOR} stopOpacity="0.25" />
              <stop offset="100%" stopColor={CF_COLOR} stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="lcAreaGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={LC_COLOR} stopOpacity="0.18" />
              <stop offset="100%" stopColor={LC_COLOR} stopOpacity="0.01" />
            </linearGradient>
            <clipPath id="chartClip">
              <rect x={PADDING.left} y={PADDING.top} width={INNER_W} height={INNER_H} />
            </clipPath>
          </defs>

          {/* Grid lines */}
          {yTicks.map((v) => (
            <g key={v}>
              <line
                x1={PADDING.left} y1={toY(v)}
                x2={PADDING.left + INNER_W} y2={toY(v)}
                stroke={GRID_COLOR} strokeWidth="1"
              />
              <text x={PADDING.left - 8} y={toY(v) + 4} textAnchor="end" className="chart-axis-label" fill={LABEL_COLOR} fontSize="11" fontWeight="700">
                {v}
              </text>
            </g>
          ))}

          {/* X axis labels */}
          {xLabels.map((p, i) => (
            <text
              key={`xl-${i}`}
              x={toX(p.time)}
              y={PADDING.top + INNER_H + 20}
              textAnchor="middle"
              fill={LABEL_COLOR}
              fontSize="11"
              fontWeight="700"
            >
              {formatDate(p.time)}
            </text>
          ))}

          {/* Axis borders */}
          <line x1={PADDING.left} y1={PADDING.top} x2={PADDING.left} y2={PADDING.top + INNER_H} stroke={GRID_COLOR} strokeWidth="1" />
          <line x1={PADDING.left} y1={PADDING.top + INNER_H} x2={PADDING.left + INNER_W} y2={PADDING.top + INNER_H} stroke={GRID_COLOR} strokeWidth="1" />

          {/* Area fills */}
          <g clipPath="url(#chartClip)">
            {hasCF && !hiddenLines.cf && (
              <path d={makeAreaPath(cfSeries)} fill="url(#cfAreaGrad)" />
            )}
            {hasLC && !hiddenLines.lc && (
              <path d={makeAreaPath(lcSeries)} fill="url(#lcAreaGrad)" />
            )}
          </g>

          {/* Lines */}
          <g clipPath="url(#chartClip)">
            {hasCF && !hiddenLines.cf && (
              <>
                <path
                  d={makePath(cfSeries)}
                  fill="none"
                  stroke={CF_COLOR}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Invisible wider hit area for hover */}
                <path
                  d={makePath(cfSeries)}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="16"
                  onMouseMove={(e) => handleMouseMove(e, cfSeries, CF_COLOR, "cf")}
                />
                {cfSeries.map((p, i) => (
                  <circle
                    key={`cfd-${i}`}
                    cx={toX(p.time)} cy={toY(p.rating)}
                    r="3.5"
                    fill={CF_COLOR}
                    stroke="#0f172a"
                    strokeWidth="2"
                    className="chart-dot"
                  />
                ))}
              </>
            )}
            {hasLC && !hiddenLines.lc && (
              <>
                <path
                  d={makePath(lcSeries)}
                  fill="none"
                  stroke={LC_COLOR}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={lcSeries.length <= 2 ? "8 4" : undefined}
                />
                <path
                  d={makePath(lcSeries)}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="16"
                  onMouseMove={(e) => handleMouseMove(e, lcSeries, LC_COLOR, "lc")}
                />
                {lcSeries.map((p, i) => (
                  <circle
                    key={`lcd-${i}`}
                    cx={toX(p.time)} cy={toY(p.rating)}
                    r="3.5"
                    fill={LC_COLOR}
                    stroke="#0f172a"
                    strokeWidth="2"
                    className="chart-dot"
                  />
                ))}
              </>
            )}
          </g>

          {/* Tooltip */}
          {tooltip && (
            <g ref={tooltipRef}>
              <line
                x1={tooltip.x} y1={PADDING.top}
                x2={tooltip.x} y2={PADDING.top + INNER_H}
                stroke={tooltip.color} strokeWidth="1" strokeDasharray="4 3" opacity="0.5"
              />
              <circle cx={tooltip.x} cy={tooltip.y} r="6" fill={tooltip.color} stroke="#0f172a" strokeWidth="2" />
              {/* Tooltip box */}
              {(() => {
                const bx = Math.min(tooltip.x + 10, W - 178);
                const by = Math.max(PADDING.top, tooltip.y - 64);
                const label = tooltip.label?.length > 30 ? tooltip.label.slice(0, 30) + "…" : tooltip.label;
                const trendUp = tooltip.trend === "UP";
                const trendDown = tooltip.trend === "DOWN";
                const trendSymbol = trendUp ? " ▲" : trendDown ? " ▼" : "";
                const trendFill = trendUp ? "#34d399" : trendDown ? "#f87171" : LABEL_COLOR;
                const extraLines = [];
                if (tooltip.ranking > 0) extraLines.push(`Rank #${new Intl.NumberFormat("en-US").format(tooltip.ranking)}`);
                if (tooltip.solved != null) extraLines.push(`${tooltip.solved}/${tooltip.total} solved`);
                const totalH = 28 + (tooltip.time > 0 ? 15 : 0) + (label ? 14 : 0) + extraLines.length * 13 + 8;
                return (
                  <g>
                    <rect x={bx} y={by} width={170} height={totalH} rx="8" fill="#1e293b" stroke={tooltip.color} strokeWidth="1" opacity="0.97" />
                    <text x={bx + 12} y={by + 20} fill={tooltip.color} fontSize="14" fontWeight="800">
                      {tooltip.rating}
                      {trendSymbol && <tspan fill={trendFill} fontSize="11"> {trendSymbol}</tspan>}
                    </text>
                    {tooltip.time > 0 && (
                      <text x={bx + 12} y={by + 34} fill={LABEL_COLOR} fontSize="11" fontWeight="700">{formatDate(tooltip.time)}</text>
                    )}
                    {label && (
                      <text x={bx + 12} y={by + (tooltip.time > 0 ? 47 : 34)} fill={LABEL_COLOR} fontSize="10" fontWeight="600">{label}</text>
                    )}
                    {extraLines.map((line, i) => (
                      <text key={i} x={bx + 12} y={by + (tooltip.time > 0 ? 47 : 34) + (label ? 13 : 0) + i * 13 + 2} fill={LABEL_COLOR} fontSize="10" fontWeight="600">{line}</text>
                    ))}
                  </g>
                );
              })()}
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
