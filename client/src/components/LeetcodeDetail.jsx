import { BarChart3, CheckCircle, Code2, Flame, Trophy, Target, Clock3, Medal, TrendingUp } from "lucide-react";
import LcRatingChart from "./LcRatingChart";

const formatNumber = (value) => new Intl.NumberFormat("en-US").format(value || 0);

const MetricCard = ({ icon, label, value, hint }) => {
  const Icon = icon;

  return (
    <article className="detail-metric-card">
      <span className="detail-metric-label">
        <Icon size={16} />
        {label}
      </span>
      <strong>{typeof value === "number" ? formatNumber(value) : value}</strong>
      {hint ? <p>{hint}</p> : null}
    </article>
  );
};

const InsightChip = ({ icon, label, value }) => {
  const Icon = icon;

  return (
    <span className="mini-stat-chip">
      <Icon size={15} />
      {label}: {value}
    </span>
  );
};

const SectionTitle = ({ title, description }) => (
  <div className="section-title">
    <h2>
      <BarChart3 size={24} />
      {title}
    </h2>
    {description ? <p>{description}</p> : null}
  </div>
);

export default function LeetcodeDetail({ profile }) {
  const raw = profile?.rawData || {};
  const acceptanceRate = raw.acceptanceRate ?? raw.acceptance_rate ?? profile?.acceptanceRate ?? 0;
  const streak = raw.streak ?? raw.streakCount ?? 0;
  const contestRating = raw.contestRating ?? raw.rating ?? profile?.rating ?? 0;
  const rank = raw.rank ?? profile?.rank ?? "Unranked";
  const ranking = raw.ranking ?? raw.globalRanking ?? raw.globalRank ?? "N/A";

  const easySolved = raw.easySolved ?? raw.easy ?? profile?.stats?.easySolved ?? 0;
  const mediumSolved = raw.mediumSolved ?? raw.medium ?? profile?.stats?.mediumSolved ?? 0;
  const hardSolved = raw.hardSolved ?? raw.hard ?? profile?.stats?.hardSolved ?? 0;
  const totalSolved = profile?.solvedCount || raw.totalSolved || raw.solvedCount || 0;
  const totalQuestions = raw.totalQuestions ?? raw.total ?? profile?.stats?.totalQuestions ?? null;
  const submissions = raw.totalSubmissions ?? raw.submissions ?? profile?.stats?.submissions ?? 0;
  const activeDays = raw.activeDays ?? raw.contributionDays ?? profile?.stats?.activeDays ?? 0;
  const streakGoal = raw.dailyStreakGoal ?? raw.streakGoal ?? null;

  const topTopics = Array.isArray(raw.topTopics)
    ? raw.topTopics
    : Array.isArray(profile?.stats?.topTopics)
      ? profile.stats.topTopics
      : [];

  return (
    <div className="platform-detail">
      <div className="section-title">
        <h2>
          <Code2 size={24} />
          {profile?.username || profile?.handle || "LeetCode"}
        </h2>
        <p>
          {rank !== "Unranked"
            ? `Rank ${rank} • Contest Rating ${contestRating || "N/A"}`
            : "LeetCode profile overview with solved counts, rating, streaks, and topic coverage."}
        </p>
      </div>

      <div className="mini-stats">
        <InsightChip icon={CheckCircle} label="Solved" value={totalSolved} />
        <InsightChip icon={Trophy} label="Rating" value={contestRating || 0} />
        <InsightChip icon={Flame} label="Streak" value={streak || 0} />
        <InsightChip icon={Target} label="Acceptance" value={`${acceptanceRate || 0}%`} />
      </div>

      {/* LC Rating History Chart */}
      <section className="detail-section detail-section-full">
        <div className="section-title">
          <h2>
            <TrendingUp size={24} />
            Contest Rating History
          </h2>
          <p>Full rating progression across every LeetCode rated contest.</p>
        </div>
        <LcRatingChart profile={profile} />
      </section>

      <div className="detail-metrics-grid">
        <MetricCard icon={CheckCircle} label="Easy solved" value={easySolved} hint="Introductory problems completed" />
        <MetricCard icon={BarChart3} label="Medium solved" value={mediumSolved} hint="Most of the grind zone" />
        <MetricCard icon={Trophy} label="Hard solved" value={hardSolved} hint="High-difficulty problems" />
        <MetricCard icon={Medal} label="Ranking" value={ranking} hint="Global or contest position" />
        <MetricCard icon={Clock3} label="Active days" value={activeDays} hint={streakGoal ? `Goal ${streakGoal} days` : "Recent activity streak"} />
        <MetricCard icon={BarChart3} label="Submissions" value={submissions} hint={totalQuestions ? `${formatNumber(totalQuestions)} total questions` : "Total submissions tracked"} />
      </div>

      {topTopics.length > 0 && (
        <section className="detail-section detail-section-full">
          <SectionTitle
            title="Topic coverage"
            description="High-signal LeetCode topic breakdown from your solved problems."
          />
          <div className="detail-language-grid">
            {topTopics.slice(0, 8).map((topic) => {
              const name = topic.name || topic.topic || topic.label || "Topic";
              const count = topic.count ?? topic.value ?? 0;
              const maxCount = Math.max(...topTopics.map((item) => item.count ?? item.value ?? 0), 1);
              const width = (count / maxCount) * 100;

              return (
                <article className="detail-language-item" key={name}>
                  <div className="detail-language-head">
                    <strong>{name}</strong>
                    <span>{count}</span>
                  </div>
                  <div className="detail-language-bar">
                    <div style={{ width: `${width}%` }} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
