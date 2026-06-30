import { useMemo, useState } from "react";
import { Flame } from "lucide-react";

const CELL_SIZE = 13;
const CELL_GAP = 3;
const STEP = CELL_SIZE + CELL_GAP;
const WEEKS = 52;
const DAYS = 7;

const WEEKDAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// 5-tier colour intensity (0 = no activity)
const TIER_COLORS = [
  "rgba(148,163,184,0.07)",   // 0 — empty
  "rgba(37,99,235,0.35)",      // 1 — 1 submission
  "rgba(37,99,235,0.55)",      // 2 — 2-3
  "rgba(37,99,235,0.75)",      // 3 — 4-6
  "rgba(37,99,235,0.95)",      // 4 — 7+
];

const getTier = (count) => {
  if (!count) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
};

const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const buildCalendar = (lcProfile, cfProfile) => {
  const map = {};

  // LeetCode submission calendar: { "unix_ts": count }
  const lcCal = lcProfile?.rawData?.submissionCalendar;
  if (lcCal) {
    let cal = lcCal;
    if (typeof cal === "string") {
      try { cal = JSON.parse(cal); } catch { cal = {}; }
    }
    Object.entries(cal).forEach(([ts, count]) => {
      const date = new Date(Number(ts) * 1000);
      const key = toDateKey(date);
      map[key] = (map[key] || 0) + Number(count);
    });
  }

  // Codeforces: derive from submission timestamps
  const cfSubs = cfProfile?.rawData?.recentSubmissions || cfProfile?.stats?.recentSubmissions || [];
  cfSubs.forEach((sub) => {
    if (!sub.createdAt) return;
    const date = new Date(sub.createdAt * 1000);
    const key = toDateKey(date);
    map[key] = (map[key] || 0) + 1;
  });

  return map;
};

const buildGrid = (calMap) => {
  // Build a 52-week grid ending at today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find start: 52 weeks ago, adjusted to Sunday
  const start = new Date(today);
  start.setDate(start.getDate() - WEEKS * 7 + 1);
  // Align to Sunday
  const dayOfWeek = start.getDay();
  start.setDate(start.getDate() - dayOfWeek);

  const weeks = [];
  let monthLabels = [];
  let lastMonth = -1;

  for (let w = 0; w < WEEKS; w++) {
    const week = [];
    for (let d = 0; d < DAYS; d++) {
      const date = new Date(start);
      date.setDate(start.getDate() + w * 7 + d);
      const key = toDateKey(date);
      const count = calMap[key] || 0;
      const isFuture = date > today;
      week.push({ date, key, count, tier: isFuture ? -1 : getTier(count) });

      if (d === 0 && date.getMonth() !== lastMonth) {
        monthLabels.push({ week: w, label: MONTH_NAMES[date.getMonth()] });
        lastMonth = date.getMonth();
      }
    }
    weeks.push(week);
  }

  return { weeks, monthLabels };
};

const computeStreaks = (calMap) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let currentStreak = 0;
  let longestStreak = 0;
  let runningStreak = 0;
  let totalActiveDays = 0;

  // Check from today backwards for current streak
  const checkDate = new Date(today);
  while (true) {
    const key = toDateKey(checkDate);
    if ((calMap[key] || 0) > 0) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Count total active days and longest streak over 365 days
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = toDateKey(d);
    if ((calMap[key] || 0) > 0) {
      totalActiveDays++;
      runningStreak++;
      longestStreak = Math.max(longestStreak, runningStreak);
    } else {
      runningStreak = 0;
    }
  }

  return { currentStreak, longestStreak, totalActiveDays };
};

export default function ActivityHeatmap({ lcProfile, cfProfile }) {
  const [tooltip, setTooltip] = useState(null);

  const calMap = useMemo(() => buildCalendar(lcProfile, cfProfile), [lcProfile, cfProfile]);
  const { weeks, monthLabels } = useMemo(() => buildGrid(calMap), [calMap]);
  const { currentStreak, longestStreak, totalActiveDays } = useMemo(() => computeStreaks(calMap), [calMap]);

  const hasData = Object.keys(calMap).length > 0;

  // SVG dimensions
  const leftPad = 30;
  const topPad = 22;
  const svgW = leftPad + WEEKS * STEP + 4;
  const svgH = topPad + DAYS * STEP + 4;

  return (
    <div className="heatmap-wrap">
      {/* Streak stats */}
      <div className="heatmap-streak-row">
        <div className="heatmap-streak-card">
          <Flame size={18} className="streak-flame" />
          <strong>{currentStreak}</strong>
          <span>Current streak</span>
        </div>
        <div className="heatmap-streak-card">
          <strong>{longestStreak}</strong>
          <span>Longest streak</span>
        </div>
        <div className="heatmap-streak-card">
          <strong>{totalActiveDays}</strong>
          <span>Active days (1yr)</span>
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="heatmap-scroll">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          width={svgW}
          height={svgH}
          className="heatmap-svg"
          onMouseLeave={() => setTooltip(null)}
        >
          {/* Month labels */}
          {monthLabels.map(({ week, label }) => (
            <text
              key={`m-${week}`}
              x={leftPad + week * STEP}
              y={14}
              fill="#64748b"
              fontSize="10"
              fontWeight="700"
            >
              {label}
            </text>
          ))}

          {/* Weekday labels */}
          {WEEKDAY_LABELS.map((label, d) =>
            label ? (
              <text
                key={`wd-${d}`}
                x={leftPad - 4}
                y={topPad + d * STEP + CELL_SIZE - 2}
                textAnchor="end"
                fill="#64748b"
                fontSize="9"
                fontWeight="700"
              >
                {label}
              </text>
            ) : null
          )}

          {/* Cells */}
          {weeks.map((week, w) =>
            week.map((cell, d) => {
              if (cell.tier < 0) return null; // future date
              return (
                <rect
                  key={cell.key}
                  x={leftPad + w * STEP}
                  y={topPad + d * STEP}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  rx="2"
                  fill={TIER_COLORS[cell.tier]}
                  className="heatmap-cell"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltip({
                      x: rect.left + rect.width / 2,
                      y: rect.top,
                      date: cell.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }),
                      count: cell.count,
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })
          )}
        </svg>

        {/* Portal-style tooltip rendered in DOM */}
        {tooltip && (
          <div
            className="heatmap-tooltip"
            style={{
              position: "fixed",
              left: tooltip.x,
              top: tooltip.y - 8,
              transform: "translate(-50%, -100%)",
            }}
          >
            <strong>{tooltip.count} submission{tooltip.count !== 1 ? "s" : ""}</strong>
            <span>{tooltip.date}</span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="heatmap-legend">
        <span className="heatmap-legend-label">Less</span>
        {TIER_COLORS.map((color, i) => (
          <div
            key={i}
            className="heatmap-legend-cell"
            style={{ background: color }}
          />
        ))}
        <span className="heatmap-legend-label">More</span>
        {!hasData && (
          <span className="heatmap-no-data">No activity data yet — connect Codeforces or LeetCode</span>
        )}
      </div>
    </div>
  );
}
