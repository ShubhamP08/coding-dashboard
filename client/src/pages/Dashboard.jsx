import {
  Activity,
  Award,
  BookOpen,
  Code2,
  GitFork,
  Globe2,
  MessageSquare,
  Star,
  Users,
  Zap
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

const Dashboard = () => {
  const navigate = useNavigate();
  const [profileLink, setProfileLink] = useState("");
  const [connectedProfile, setConnectedProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");

  const githubData = connectedProfile?.rawData || {};
  const githubUser = githubData.user || {};
  const languages = useMemo(() => githubData.languages || [], [githubData.languages]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await api.get("/users/me");
        const githubProfile = response.data.user?.profiles?.find(
          (profile) => profile.platform === "github"
        );

        if (githubProfile) {
          setConnectedProfile(githubProfile);
        }
      // eslint-disable-next-line no-unused-vars
      } catch (err) {
        localStorage.removeItem("token");
        navigate("/login");
      } finally {
        setInitialLoading(false);
      }
    };

    loadUser();
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const connectProfile = async (event) => {
    event.preventDefault();
    setError("");

    if (!profileLink.trim()) {
      setError("Paste your GitHub profile link first");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/profiles/connect", {
        platform: "github",
        profileLink
      });
      setConnectedProfile(response.data.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Could not connect this GitHub profile"
      );
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <section className="dashboard-page">
        <div className="empty-state">
          <span className="section-icon blue">
            <Activity size={22} />
          </span>
          <h1>Loading your dashboard</h1>
          <p>Checking your account and connected GitHub profile.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <div>
          <h1>Dashboard Overview</h1>
          <p>Your GitHub profile, repositories, followers and activity summary.</p>
        </div>
      </div>

      {!connectedProfile && (
        <section className="empty-state">
          <div className="empty-state-header">
            <span className="section-icon blue">
              <Code2 size={24} />
            </span>
            <button className="ghost-compact" type="button" onClick={logout}>
              Logout
            </button>
          </div>

          <div>
            <h2>Connect your GitHub profile</h2>
            <p>
              GitHub is required for the first version of this dashboard. Paste your
              public profile link and we will build the dashboard from GitHub API data.
            </p>
          </div>

          <form className="connect-form" onSubmit={connectProfile}>
            <label className="field">
              <span>Platform</span>
              <input value="GitHub" disabled />
            </label>

            <label className="field">
              <span>GitHub Profile Link</span>
              <input
                value={profileLink}
                onChange={(event) => setProfileLink(event.target.value)}
                placeholder="https://github.com/username"
              />
            </label>

            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? "Connecting..." : "Connect GitHub"}
            </button>
          </form>

          {error && <p className="form-error">{error}</p>}
        </section>
      )}

      {connectedProfile && (
        <>
          <section className="github-hero">
            <img src={connectedProfile.avatar} alt={`${connectedProfile.handle} avatar`} />
            <div>
              <span className="profile-platform">
                <Code2 size={18} />
                GitHub Connected
              </span>
              <h2>{connectedProfile.firstName || connectedProfile.handle}</h2>
              <p>{githubUser.bio || "No GitHub bio added yet."}</p>
              <div className="profile-meta">
                <span>@{connectedProfile.handle}</span>
                {connectedProfile.country && <span>{connectedProfile.country}</span>}
                {connectedProfile.organization && <span>{connectedProfile.organization}</span>}
              </div>
            </div>
            <a className="ghost-compact" href={connectedProfile.profileUrl} target="_blank">
              Open GitHub
            </a>
          </section>

          <div className="stats-grid">
            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-icon blue">
                  <BookOpen size={24} />
                </span>
                <span className="delta">Repos</span>
              </div>
              <p>Public Repos</p>
              <strong>{connectedProfile.solvedCount || 0}</strong>
              <span>Repositories visible on GitHub</span>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-icon orange">
                  <Users size={24} />
                </span>
                <span className="delta">Followers</span>
              </div>
              <p>Followers</p>
              <strong>{connectedProfile.contestsCount || 0}</strong>
              <span>People following this profile</span>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-icon green">
                  <Activity size={24} />
                </span>
                <span className="delta">Following</span>
              </div>
              <p>Following</p>
              <strong>{connectedProfile.attemptedCount || 0}</strong>
              <span>Accounts this user follows</span>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-icon purple">
                  <Code2 size={24} />
                </span>
              </div>
              <p>Public Gists</p>
              <strong>{connectedProfile.submissionsCount || 0}</strong>
              <span>Public snippets shared</span>
            </article>
          </div>

          <div className="dashboard-grid">
            <section className="chart-card">
              <div className="section-title">
                <div>
                  <h2>
                    <Star size={24} />
                    Repository Impact
                  </h2>
                  <p>Latest public repositories from the GitHub API.</p>
                </div>
                <span className="max-pill">{githubData.totalStars || 0} Stars</span>
              </div>

              <div className="repo-summary">
                <div>
                  <Star size={28} />
                  <span>Total Stars</span>
                  <strong>{githubData.totalStars || 0}</strong>
                </div>
                <div>
                  <GitFork size={28} />
                  <span>Total Forks</span>
                  <strong>{githubData.totalForks || 0}</strong>
                </div>
                <div>
                  <Globe2 size={28} />
                  <span>Languages</span>
                  <strong>{languages.length}</strong>
                </div>
              </div>

              <div className="repo-list">
                {(githubData.repos || []).slice(0, 5).map((repo) => (
                  <a key={repo.id} href={repo.html_url} target="_blank">
                    <div>
                      <strong>{repo.name}</strong>
                      <span>{repo.description || "No description"}</span>
                    </div>
                    <small>{repo.language || "Code"}</small>
                  </a>
                ))}
              </div>
            </section>

            <section className="badges-card">
              <div className="section-title">
                <h2>
                  <Award size={24} />
                  GitHub Highlights
                </h2>
              </div>

              <div className="badge-grid">
                <div className="badge-tile orange">
                  <Star size={30} />
                  <strong>{githubData.totalStars || 0}</strong>
                  <span>Stars</span>
                </div>
                <div className="badge-tile lime">
                  <GitFork size={30} />
                  <strong>{githubData.totalForks || 0}</strong>
                  <span>Forks</span>
                </div>
                <div className="badge-tile purple">
                  <Zap size={30} />
                  <strong>{connectedProfile.rank}</strong>
                  <span>Type</span>
                </div>
                <div className="badge-tile teal">
                  <Globe2 size={30} />
                  <strong>{languages[0] || "Code"}</strong>
                  <span>Top Language</span>
                </div>
                <div className="badge-tile blue">
                  <Code2 size={30} />
                  <strong>{connectedProfile.handle}</strong>
                  <span>Handle</span>
                </div>
                <div className="badge-tile pink">
                  <Users size={30} />
                  <strong>{connectedProfile.friendOfCount || 0}</strong>
                  <span>Followers</span>
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
