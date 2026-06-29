import {
  Activity,
  BarChart3,
  BookOpen,
  Code2,
  Flame,
  GitFork,
  Globe2,
  Plus,
  Share2,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Zap
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import RatingHistoryChart from "../components/RatingHistoryChart";
import ActivityHeatmap from "../components/ActivityHeatmap";
import DevCard from "../components/DevCard";

const getPlatformLabel = (platform) => {
  if (platform === "github") return "GitHub";
  if (platform === "codeforces") return "Codeforces";
  if (platform === "leetcode") return "LeetCode";
  return platform;
};

const formatNum = (v) =>
  new Intl.NumberFormat("en-US").format(v || 0);

// Compute current streak from merged CF + LC calendar
const computeCurrentStreak = (lcProfile, cfProfile) => {
  const map = {};

  const lcCal = lcProfile?.rawData?.submissionCalendar;
  if (lcCal) {
    let cal = lcCal;
    if (typeof cal === "string") {
      try { cal = JSON.parse(cal); } catch { cal = {}; }
    }
    Object.entries(cal).forEach(([ts]) => {
      const d = new Date(Number(ts) * 1000);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      map[key] = (map[key] || 0) + 1;
    });
  }

  const cfSubs = cfProfile?.rawData?.recentSubmissions || [];
  cfSubs.forEach((sub) => {
    if (!sub.createdAt) return;
    const d = new Date(sub.createdAt * 1000);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    map[key] = (map[key] || 0) + 1;
  });

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const check = new Date(today);
  while (true) {
    const key = `${check.getFullYear()}-${String(check.getMonth() + 1).padStart(2, "0")}-${String(check.getDate()).padStart(2, "0")}`;
    if ((map[key] || 0) > 0) {
      streak++;
      check.setDate(check.getDate() - 1);
    } else break;
  }
  return streak;
};

const getRankColor = (rank) => {
  if (!rank) return "#94a3b8";
  const r = rank.toLowerCase();
  if (r.includes("grandmaster") || r.includes("international")) return "#ef4444";
  if (r.includes("master")) return "#f97316";
  if (r.includes("candidate")) return "#a855f7";
  if (r.includes("expert")) return "#3b82f6";
  if (r.includes("specialist")) return "#14b8a6";
  return "#94a3b8";
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showDevCard, setShowDevCard] = useState(false);

  const githubProfile = useMemo(
    () => profiles.find((p) => p.platform === "github"),
    [profiles]
  );
  const codeforcesProfile = useMemo(
    () => profiles.find((p) => p.platform === "codeforces"),
    [profiles]
  );
  const leetcodeProfile = useMemo(
    () => profiles.find((p) => p.platform === "leetcode"),
    [profiles]
  );

  // Aggregated stats
  const totalSolved = profiles.reduce((sum, p) => {
    if (p.platform === "codeforces" || p.platform === "leetcode")
      return sum + (p.solvedCount || 0);
    return sum;
  }, 0);

  const totalRepos = githubProfile?.solvedCount || 0;
  const totalStars = githubProfile?.rawData?.totalStars || 0;
  const bestCFRating = codeforcesProfile?.maxRating || codeforcesProfile?.rating || 0;
  const lcRating = leetcodeProfile?.rating || leetcodeProfile?.rawData?.contestRating || 0;
  const bestRating = Math.max(bestCFRating, lcRating);

  const currentStreak = useMemo(
    () => computeCurrentStreak(leetcodeProfile, codeforcesProfile),
    [leetcodeProfile, codeforcesProfile]
  );

  const lcAcceptance = leetcodeProfile?.rawData?.acceptanceRate || leetcodeProfile?.stats?.acceptanceRate || 0;

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await api.get("/users/me");
        setProfiles(response.data.user?.profiles || []);
      } catch {
        localStorage.removeItem("token");
        navigate("/login");
      } finally {
        setInitialLoading(false);
      }
    };
    loadUser();
  }, [navigate]);

  if (initialLoading) {
    return (
      <section className="dashboard-page">
        <div className="empty-state">
          <span className="section-icon blue">
            <Activity size={22} />
          </span>
          <h1>Loading your dashboard</h1>
          <p>Checking your account and connected platforms.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <div>
          <h1>Dashboard Overview</h1>
          <p>A complete view across all your connected coding platforms.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {profiles.length > 0 && (
            <button
              id="share-dev-card-btn"
              type="button"
              className="ghost-compact"
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
              onClick={() => setShowDevCard(true)}
            >
              <Share2 size={16} />
              Share Card
            </button>
          )}
          <Link className="ghost-compact" to="/platforms" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Plus size={16} />
            Manage Platforms
          </Link>
        </div>
      </div>

      {profiles.length === 0 && (
        <section className="empty-state">
          <span className="section-icon blue">
            <Code2 size={24} />
          </span>
          <h2>Connect your first platform</h2>
          <p>
            Start with GitHub, Codeforces, or LeetCode. Once connected, this page becomes your
            command centre — rating chart, activity heatmap, and more.
          </p>
          <Link className="primary-button as-link" to="/platforms">
            Connect Platform
          </Link>
        </section>
      )}

      {profiles.length > 0 && (
        <>
          {/* ── Stats Grid (6 cards) ── */}
          <div className="stats-grid stats-grid-6">
            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-icon blue"><Globe2 size={22} /></span>
                <span className="delta">Active</span>
              </div>
              <p>Platforms</p>
              <strong>{profiles.length}</strong>
              <span>Connected accounts</span>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-icon orange"><BookOpen size={22} /></span>
              </div>
              <p>Problems Solved</p>
              <strong>{formatNum(totalSolved)}</strong>
              <span>Across CF + LeetCode</span>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-icon purple"><Trophy size={22} /></span>
              </div>
              <p>Best Rating</p>
              <strong>{bestRating || "—"}</strong>
              <span>{bestCFRating >= lcRating ? "Codeforces" : "LeetCode"} peak</span>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-icon green"><Code2 size={22} /></span>
              </div>
              <p>Public Repos</p>
              <strong>{formatNum(totalRepos)}</strong>
              <span>GitHub repositories</span>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-icon" style={{ color: "#f97316", background: "rgba(249,115,22,0.13)" }}>
                  <Flame size={22} />
                </span>
              </div>
              <p>Current Streak</p>
              <strong>{currentStreak}d</strong>
              <span>Days active in a row</span>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-icon" style={{ color: "#facc15", background: "rgba(250,204,21,0.12)" }}>
                  <Star size={22} />
                </span>
              </div>
              <p>GitHub Stars</p>
              <strong>{formatNum(totalStars)}</strong>
              <span>Total across repos</span>
            </article>
          </div>

          {/* ── Rating History Chart ── */}
          {(codeforcesProfile || leetcodeProfile) && (
            <section className="chart-section-card">
              <div className="section-title">
                <div>
                  <h2>
                    <TrendingUp size={22} />
                    Rating History
                  </h2>
                  <p>
                    {codeforcesProfile && leetcodeProfile
                      ? "Codeforces (blue line) + LeetCode current rating (orange dashed reference)."
                      : codeforcesProfile
                      ? "Codeforces rating progression across rated contests."
                      : "LeetCode current contest rating."}
                  </p>
                </div>
              </div>
              <RatingHistoryChart
                cfProfile={codeforcesProfile}
                lcProfile={leetcodeProfile}
              />
            </section>
          )}

          {/* ── Activity Heatmap ── */}
          {(codeforcesProfile || leetcodeProfile) && (
            <section className="chart-section-card">
              <div className="section-title">
                <div>
                  <h2>
                    <Activity size={22} />
                    Activity Heatmap
                  </h2>
                  <p>Daily solve activity over the past 52 weeks (Codeforces + LeetCode combined).</p>
                </div>
              </div>
              <ActivityHeatmap
                lcProfile={leetcodeProfile}
                cfProfile={codeforcesProfile}
              />
            </section>
          )}

          {/* ── Bottom Grid: Platform Summary + Quick Insights ── */}
          <div className="dashboard-grid">
            {/* Platform Summary */}
            <section className="chart-card">
              <div className="section-title">
                <div>
                  <h2>
                    <BarChart3 size={22} />
                    Platform Summary
                  </h2>
                  <p>Key stats for each connected account.</p>
                </div>
              </div>

              <div className="summary-platform-list">
                {profiles.map((profile) => (
                  <Link
                    to={`/profile/${profile.platform}`}
                    className="summary-platform-card summary-platform-card-link"
                    key={profile._id}
                  >
                    <div className="summary-platform-head">
                      <img
                        src={profile.avatar || profile.titlePhoto}
                        alt={`${profile.handle} avatar`}
                      />
                      <div>
                        <span>{getPlatformLabel(profile.platform)}</span>
                        <strong>{profile.handle}</strong>
                      </div>
                      {profile.platform === "codeforces" && profile.rank && (
                        <span
                          className="cf-rank-badge"
                          style={{
                            color: getRankColor(profile.rank),
                            background: `${getRankColor(profile.rank)}18`,
                            border: `1px solid ${getRankColor(profile.rank)}44`,
                          }}
                        >
                          {profile.rank}
                        </span>
                      )}
                    </div>

                    {profile.platform === "github" ? (
                      <div className="mini-stats">
                        <span><BookOpen size={14} />{formatNum(profile.solvedCount)} repos</span>
                        <span><Star size={14} />{formatNum(profile.rawData?.totalStars)} stars</span>
                        <span><GitFork size={14} />{formatNum(profile.rawData?.totalForks)} forks</span>
                        <span><Users size={14} />{formatNum(profile.friendOfCount)} followers</span>
                      </div>
                    ) : profile.platform === "leetcode" ? (
                      <div className="mini-stats">
                        <span><Trophy size={14} />{profile.rating || profile.rawData?.contestRating || 0} rating</span>
                        <span><BookOpen size={14} />{formatNum(profile.solvedCount)} solved</span>
                        <span><Activity size={14} />{profile.contestsCount || 0} contests</span>
                        {lcAcceptance > 0 && <span><Target size={14} />{lcAcceptance}% acceptance</span>}
                      </div>
                    ) : (
                      <div className="mini-stats">
                        <span><Trophy size={14} />{profile.rating || 0} rating</span>
                        <span style={{ color: getRankColor(profile.rank) }}>
                          <Zap size={14} />{profile.maxRating || 0} peak
                        </span>
                        <span><BookOpen size={14} />{formatNum(profile.solvedCount)} solved</span>
                        <span><Activity size={14} />{profile.contestsCount || 0} contests</span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </section>

            {/* Quick Insights */}
            <section className="badges-card">
              <div className="section-title">
                <h2>
                  <Zap size={22} />
                  Quick Insights
                </h2>
              </div>

              <div className="badge-grid">
                <div className="badge-tile orange">
                  <Star size={28} />
                  <strong>{formatNum(totalStars)}</strong>
                  <span>GitHub Stars</span>
                </div>
                <div className="badge-tile lime">
                  <Users size={28} />
                  <strong>{formatNum(githubProfile?.friendOfCount || 0)}</strong>
                  <span>GH Followers</span>
                </div>
                <div className="badge-tile purple">
                  <Trophy size={28} />
                  <strong>{codeforcesProfile?.rank || "—"}</strong>
                  <span>CF Rank</span>
                </div>
                <div className="badge-tile teal">
                  <BookOpen size={28} />
                  <strong>{formatNum(codeforcesProfile?.attemptedCount || 0)}</strong>
                  <span>CF Attempted</span>
                </div>
                <div className="badge-tile blue">
                  <Flame size={28} />
                  <strong>{currentStreak}d</strong>
                  <span>Streak</span>
                </div>
                <div className="badge-tile pink">
                  <Target size={28} />
                  <strong>{lcAcceptance ? `${lcAcceptance}%` : "—"}</strong>
                  <span>LC Acceptance</span>
                </div>
              </div>
            </section>
          </div>
        </>
      )}

      {/* Dev Card Modal */}
      {showDevCard && (
        <DevCard profiles={profiles} onClose={() => setShowDevCard(false)} />
      )}
    </section>
  );
};

export default Dashboard;
