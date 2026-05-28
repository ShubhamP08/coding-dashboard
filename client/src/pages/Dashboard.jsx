import {
  Activity,
  BarChart3,
  BookOpen,
  Code2,
  GitFork,
  Globe2,
  MessageSquare,
  Plus,
  Star,
  Trophy,
  Users,
  Zap
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";

const getPlatformLabel = (platform) => {
  if (platform === "github") return "GitHub";
  if (platform === "codeforces") return "Codeforces";
  return platform;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);

  const githubProfile = useMemo(
    () => profiles.find((profile) => profile.platform === "github"),
    [profiles]
  );
  const codeforcesProfile = useMemo(
    () => profiles.find((profile) => profile.platform === "codeforces"),
    [profiles]
  );

  const totalSolved = profiles.reduce((sum, profile) => {
    if (profile.platform === "codeforces") return sum + (profile.solvedCount || 0);
    return sum;
  }, 0);

  const totalRepos = githubProfile?.solvedCount || 0;
  const totalStars = githubProfile?.rawData?.totalStars || 0;
  const bestRating = codeforcesProfile?.maxRating || codeforcesProfile?.rating || 0;

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await api.get("/users/me");
        setProfiles(response.data.user?.profiles || []);
      } catch (err) {
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
          <p>A quick summary across your connected coding platforms.</p>
        </div>
        <Link className="ghost-compact" to="/platforms">
          <Plus size={16} />
          Manage Platforms
        </Link>
      </div>

      {profiles.length === 0 && (
        <section className="empty-state">
          <span className="section-icon blue">
            <Code2 size={24} />
          </span>
          <h2>Connect your first platform</h2>
          <p>
            Start with GitHub or Codeforces. Once connected, this page becomes your
            summary dashboard and platform details can live on separate pages.
          </p>
          <Link className="primary-button as-link" to="/platforms">
            Connect Platform
          </Link>
        </section>
      )}

      {profiles.length > 0 && (
        <>
          <div className="stats-grid">
            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-icon blue">
                  <Globe2 size={24} />
                </span>
                <span className="delta">Active</span>
              </div>
              <p>Platforms</p>
              <strong>{profiles.length}</strong>
              <span>Connected accounts</span>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-icon orange">
                  <BookOpen size={24} />
                </span>
                <span className="delta">Codeforces</span>
              </div>
              <p>Recent Solved</p>
              <strong>{totalSolved}</strong>
              <span>From latest fetched Codeforces submissions</span>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-icon green">
                  <Code2 size={24} />
                </span>
                <span className="delta">GitHub</span>
              </div>
              <p>Public Repos</p>
              <strong>{totalRepos}</strong>
              <span>Repositories visible on GitHub</span>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-icon purple">
                  <Trophy size={24} />
                </span>
              </div>
              <p>Best Rating</p>
              <strong>{bestRating}</strong>
              <span>Highest Codeforces rating</span>
            </article>
          </div>

          <div className="dashboard-grid">
            <section className="chart-card">
              <div className="section-title">
                <div>
                  <h2>
                    <BarChart3 size={24} />
                    Platform Summary
                  </h2>
                  <p>Keep this page light. Use detail pages later for deeper insights.</p>
                </div>
              </div>

              <div className="summary-platform-list">
                {profiles.map((profile) => (
                  <article className="summary-platform-card" key={profile._id}>
                    <div className="summary-platform-head">
                      <img src={profile.avatar || profile.titlePhoto} alt={`${profile.handle} avatar`} />
                      <div>
                        <span>{getPlatformLabel(profile.platform)}</span>
                        <strong>{profile.handle}</strong>
                      </div>
                    </div>

                    {profile.platform === "github" ? (
                      <div className="mini-stats">
                        <span>
                          <BookOpen size={15} />
                          {profile.solvedCount || 0} repos
                        </span>
                        <span>
                          <Star size={15} />
                          {profile.rawData?.totalStars || 0} stars
                        </span>
                        <span>
                          <GitFork size={15} />
                          {profile.rawData?.totalForks || 0} forks
                        </span>
                      </div>
                    ) : (
                      <div className="mini-stats">
                        <span>
                          <Trophy size={15} />
                          {profile.rating || 0} rating
                        </span>
                        <span>
                          <BookOpen size={15} />
                          {profile.solvedCount || 0} recent solved
                        </span>
                        <span>
                          <Activity size={15} />
                          {profile.contestsCount || 0} contests
                        </span>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>

            <section className="badges-card">
              <div className="section-title">
                <h2>
                  <Zap size={24} />
                  Quick Insights
                </h2>
              </div>

              <div className="badge-grid">
                <div className="badge-tile orange">
                  <Star size={30} />
                  <strong>{totalStars}</strong>
                  <span>GitHub Stars</span>
                </div>
                <div className="badge-tile lime">
                  <Users size={30} />
                  <strong>{githubProfile?.contestsCount || 0}</strong>
                  <span>GitHub Followers</span>
                </div>
                <div className="badge-tile purple">
                  <Trophy size={30} />
                  <strong>{codeforcesProfile?.rank || "N/A"}</strong>
                  <span>CF Rank</span>
                </div>
                <div className="badge-tile teal">
                  <BookOpen size={30} />
                  <strong>{codeforcesProfile?.attemptedCount || 0}</strong>
                  <span>CF Attempted</span>
                </div>
                <div className="badge-tile blue">
                  <Code2 size={30} />
                  <strong>{githubProfile?.rawData?.languages?.length || 0}</strong>
                  <span>Languages</span>
                </div>
                <div className="badge-tile pink">
                  <Globe2 size={30} />
                  <strong>{profiles.length}/2</strong>
                  <span>Available</span>
                </div>
              </div>
            </section>
          </div>
        </>
      )}

      <button className="chat-button" type="button" aria-label="Open chat">
        <MessageSquare size={28} />
      </button>
    </section>
  );
};

export default Dashboard;
