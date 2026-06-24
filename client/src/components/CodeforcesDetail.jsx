import { Activity, BarChart3, BookOpen, Code2, Star, Trophy } from "lucide-react";
import { useMemo } from "react";

const formatDate = (seconds) => {
  if (!seconds) return "N/A";

  return new Date(seconds * 1000).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
};

const EmptyInline = ({ message }) => (
  <div className="empty-inline">
    <p>{message}</p>
  </div>
);

const DetailSection = ({ icon, title, description, children, full = true }) => {
  const SectionIcon = icon;

  return (
    <section className={`detail-section${full ? " detail-section-full" : ""}`}>
      <div className="section-title">
        <h2>
          <SectionIcon size={24} />
          {title}
        </h2>
        {description ? <p>{description}</p> : null}
      </div>
      {children}
    </section>
  );
};

const CodeforcesDetail = ({ profile }) => {
  const ratingGraph = profile?.stats?.ratingGraph || profile?.rawData?.ratingGraph || [];
  const recentSubmissions = profile?.stats?.recentSubmissions || profile?.rawData?.recentSubmissions || [];
  const recentContests = profile?.stats?.recentContests || profile?.rawData?.recentContests || [];

  const verdictEntries = useMemo(() => {
    const breakdown = profile?.stats?.verdictBreakdown || profile?.rawData?.verdictBreakdown || {};
    return Object.entries(breakdown);
  }, [profile?.stats?.verdictBreakdown, profile?.rawData?.verdictBreakdown]);

  const verdictTotal = useMemo(() => {
    const breakdown = profile?.stats?.verdictBreakdown || profile?.rawData?.verdictBreakdown || {};
    return Object.values(breakdown).reduce((sum, count) => sum + count, 0);
  }, [profile?.stats?.verdictBreakdown, profile?.rawData?.verdictBreakdown]);

  const problemTags = useMemo(() => {
    const problemTagBreakdown = profile?.stats?.problemTagsBreakdown || profile?.rawData?.problemTagsBreakdown || {};
    return Object.entries(problemTagBreakdown)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
  }, [profile?.stats?.problemTagsBreakdown, profile?.rawData?.problemTagsBreakdown]);

  // Rating graph dimensions
  const graphValues = ratingGraph.length > 0 ? ratingGraph.map((p) => p.rating || 0) : [profile?.rating || 0];
  const graphMin = Math.min(...graphValues);
  const graphMax = Math.max(...graphValues);
  const graphWidth = 720;
  const graphHeight = 240;
  const graphPadding = 28;
  const ratingGraphPoints = ratingGraph.length > 0 ? ratingGraph : [{ contestName: "Current", rating: profile?.rating || 0, oldRating: profile?.rating || 0, delta: 0, time: 0 }];
  
  const graphPoints = ratingGraphPoints.map((point, index) => {
    const xStep = ratingGraphPoints.length > 1 ? (graphWidth - graphPadding * 2) / (ratingGraphPoints.length - 1) : 0;
    const x = graphPadding + index * xStep;
    const normalized = graphMax === graphMin ? 0.5 : (point.rating - graphMin) / (graphMax - graphMin);
    const y = graphHeight - graphPadding - normalized * (graphHeight - graphPadding * 2);
    return { ...point, x, y };
  });
  const graphPath = graphPoints.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");

  return (
    <>
      <DetailSection
        icon={Activity}
        title="Performance overview"
        description="Rating progression and submission outcomes."
      >
        <div className="codeforces-two-column-grid">
          <article className="detail-section-full codeforces-chart-panel">
            <div className="section-title">
              <h2>
                <Trophy size={24} />
                Rating graph
              </h2>
              <p>Rating changes across recent rated contests.</p>
            </div>

            <div className="codeforces-chart-wrap">
              {ratingGraphPoints.length > 0 ? (
                <svg viewBox={`0 0 ${graphWidth} ${graphHeight}`} className="codeforces-rating-chart" role="img" aria-label="Codeforces rating graph">
                  <defs>
                    <linearGradient id="ratingFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity="0.03" />
                    </linearGradient>
                  </defs>
                  <path d={`${graphPath} L ${graphPoints[graphPoints.length - 1].x},${graphHeight - graphPadding} L ${graphPoints[0].x},${graphHeight - graphPadding} Z`} fill="url(#ratingFill)" />
                  <path d={graphPath} className="codeforces-rating-line" />
                  {graphPoints.map((point) => (
                    <g key={`${point.contestName}-${point.time}`}>
                      <circle cx={point.x} cy={point.y} r="4.5" className="codeforces-rating-dot" />
                      <text x={point.x} y={graphHeight - 6} textAnchor="middle" className="codeforces-rating-label">
                        {point.contestName.length > 10 ? `${point.contestName.slice(0, 10)}…` : point.contestName}
                      </text>
                    </g>
                  ))}
                </svg>
              ) : (
                <EmptyInline message="No rating graph available." />
              )}
            </div>
          </article>

          <section className="detail-section-full codeforces-verdict-panel">
            <div className="section-title">
              <h2>
                <Star size={24} />
                Verdict breakdown
              </h2>
              <p>Accepted, failed, and runtime behavior across submissions.</p>
            </div>

            {verdictEntries.length > 0 ? (
              <div className="detail-verdicts-grid">
                {verdictEntries.map(([verdict, count]) => (
                  <article className="detail-verdict-item" key={verdict}>
                    <div className="detail-verdict-row">
                      <div>
                        <strong>{verdict}</strong>
                        <p>{count} submissions</p>
                      </div>
                      <span className="detail-verdict-percentage">
                        {verdictTotal > 0 ? Math.round((count / verdictTotal) * 100) : 0}%
                      </span>
                    </div>
                    <div className="detail-verdict-bar">
                      <span style={{ width: `${verdictTotal > 0 ? (count / verdictTotal) * 100 : 0}%` }} />
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyInline message="No verdict data available." />
            )}
          </section>
        </div>
      </DetailSection>

      <DetailSection
        icon={BookOpen}
        title="Recent activity"
        description="Recent contests and submissions in a balanced two-column layout."
      >
        <div className="codeforces-two-column-grid">
          <section className="detail-section-full codeforces-list-panel">
            <div className="section-title">
              <h2>
                <Activity size={24} />
                Recent contests
              </h2>
              <p>Latest contest rating updates.</p>
            </div>

            {recentContests.length > 0 ? (
              <div className="contest-grid codeforces-contest-grid">
                {recentContests.slice(0, 6).map((contest) => (
                  <article className="contest-card codeforces-contest-card" key={`${contest.contestId}-${contest.ratingUpdateTimeSeconds}`}>
                    <strong>{contest.contestName}</strong>
                    <span>
                      Rank {contest.rank} · {contest.delta >= 0 ? "+" : ""}
                      {contest.delta}
                    </span>
                    <small>{formatDate(contest.ratingUpdateTimeSeconds)}</small>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyInline message="No contest history available." />
            )}
          </section>

          <section className="detail-section-full codeforces-list-panel">
            <div className="section-title">
              <h2>
                <BookOpen size={24} />
                Recent submissions
              </h2>
              <p>Latest submissions with verdict and language.</p>
            </div>

            {recentSubmissions.length > 0 ? (
              <div className="submission-list codeforces-submission-list">
                {recentSubmissions.slice(0, 8).map((submission) => (
                  <article className="submission-item codeforces-submission-item" key={submission.id}>
                    <div>
                      <strong>
                        {submission.contestId}-{submission.index} {submission.name}
                      </strong>
                      <p>
                        {submission.language} · {submission.rating ? `Rating ${submission.rating}` : "No rating"}
                      </p>
                    </div>
                    <div className="submission-meta">
                      <span>{submission.verdict}</span>
                      <small>{formatDate(submission.createdAt)}</small>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyInline message="No recent submissions available." />
            )}
          </section>
        </div>
      </DetailSection>

      <DetailSection
        icon={Code2}
        title="Problem tags breakdown"
        description="Tags from accepted problems, ranked by frequency."
      >
        {problemTags.length > 0 ? (
          <div className="codeforces-tags-grid">
            {problemTags.map((item) => {
              const maxTagCount = Math.max(...problemTags.map((tag) => tag.count));
              const width = maxTagCount > 0 ? (item.count / maxTagCount) * 100 : 0;

              return (
                <article className="detail-language-item codeforces-tag-card" key={item.tag}>
                  <div className="detail-language-head">
                    <strong>{item.tag}</strong>
                    <span>{item.count}</span>
                  </div>
                  <div className="detail-language-bar">
                    <div style={{ width: `${width}%` }}></div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyInline message="No tag data available." />
        )}
      </DetailSection>
    </>
  );
};

export default CodeforcesDetail;
