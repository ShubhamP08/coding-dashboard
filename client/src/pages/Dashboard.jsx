import {
  Activity,
  Award,
  CheckCircle2,
  Code2,
  Flame,
  Globe2,
  MessageSquare,
  ShieldCheck,
  Star,
  Trophy,
  Zap
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

const platformOptions = [
  { value: "codeforces", label: "Codeforces", placeholder: "https://codeforces.com/profile/tourist" },
  { value: "leetcode", label: "LeetCode", placeholder: "https://leetcode.com/u/username/" },
  { value: "gfg", label: "GFG", placeholder: "https://www.geeksforgeeks.org/user/username/" },
  { value: "github", label: "GitHub", placeholder: "https://github.com/username" }
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState("codeforces");
  const [profileLink, setProfileLink] = useState("");
  const [connectedProfile, setConnectedProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");

  const selectedPlatform = useMemo(
    () => platformOptions.find((option) => option.value === platform),
    [platform]
  );

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await api.get("/users/me");
        const firstProfile = response.data.user?.profiles?.[0];

        if (firstProfile) {
          setConnectedProfile(firstProfile);
        }
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
      setError("Paste one coding profile link first");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/profiles/connect", {
        platform,
        profileLink
      });
      setConnectedProfile(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Could not connect this profile yet");
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
          <p>Checking your account and connected profiles.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <div>
          <h1>Dashboard Overview</h1>
          <p>Your coding progress across all platforms</p>
        </div>
      </div>

      {!connectedProfile && (
        <section className="empty-state">
          <div className="empty-state-header">
            <span className="section-icon blue">
              <Globe2 size={22} />
            </span>
            <button className="ghost-compact" type="button" onClick={logout}>
              Logout
            </button>
          </div>

          <div>
            <h2>Connect your coding profile</h2>
            <p>
              Choose one platform and paste your profile link. Codeforces works now;
              the other platforms are ready in the UI and can be wired next.
            </p>
          </div>

          <form className="connect-form" onSubmit={connectProfile}>
            <label className="field">
              <span>Platform</span>
              <select value={platform} onChange={(event) => setPlatform(event.target.value)}>
                {platformOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Profile Link</span>
            <input
              value={profileLink}
              onChange={(event) => setProfileLink(event.target.value)}
                placeholder={selectedPlatform?.placeholder}
            />
            </label>

            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? "Connecting..." : "Connect Profile"}
            </button>
          </form>

          {error && <p className="form-error">{error}</p>}

          <div className="platform-list">
            <span>Codeforces</span>
            <span>LeetCode</span>
            <span>GFG</span>
            <span>GitHub</span>
          </div>
        </section>
      )}

      {connectedProfile && (
        <>
          <div className="stats-grid">
            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-icon blue">
                  <CheckCircle2 size={24} />
                </span>
                <span className="delta">{connectedProfile.platform}</span>
              </div>
              <p>Total Solved</p>
              <strong>{connectedProfile.solvedCount || 0}</strong>
              <span>Accepted unique problems</span>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-icon orange">
                  <Flame size={24} />
                </span>
                <span className="delta">{connectedProfile.rankBadge?.label || "Rank"}</span>
              </div>
              <p>Current Rank</p>
              <strong>{connectedProfile.rank || "unrated"}</strong>
              <span>{connectedProfile.handle}</span>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-icon green">
                  <Activity size={24} />
                </span>
                <span className="delta">Max {connectedProfile.maxRating || 0}</span>
              </div>
              <p>Rating</p>
              <strong>{connectedProfile.rating || 0}</strong>
              <span>Current platform rating</span>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-icon purple">
                  <Globe2 size={24} />
                </span>
              </div>
              <p>Submissions</p>
              <strong>{connectedProfile.submissionsCount || 0}</strong>
              <span>{connectedProfile.attemptedCount || 0} attempted problems</span>
            </article>
          </div>

          <div className="dashboard-grid">
            <section className="chart-card">
              <div className="section-title">
                <div>
                  <h2>
                    <Trophy size={24} />
                    Contest Ratings
                  </h2>
                  <p>Contests: <strong>{connectedProfile.contestsCount || 0}</strong></p>
                </div>
                <span className="max-pill">Max: {connectedProfile.maxRating || 0}</span>
              </div>

              <div className="chart-area" aria-label="Contest rating line chart">
                <svg viewBox="0 0 760 250" role="img">
                  <path
                    d="M40 175 C130 150 170 150 220 154 C300 164 335 168 405 126 C475 88 555 88 715 72"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  {[40, 180, 320, 460, 600, 740].map((x, index) => (
                    <circle
                      key={x}
                      cx={index === 0 ? 40 : x - 20}
                      cy={[175, 152, 165, 126, 98, 72][index]}
                      r="6"
                      fill="#f59e0b"
                    />
                  ))}
                </svg>
                <div className="chart-labels">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                </div>
              </div>

              <div className="medal-grid">
                <div>
                  <Trophy size={20} />
                  <span>Contribution</span>
                  <strong>{connectedProfile.contribution || 0}</strong>
                </div>
                <div>
                  <Award size={20} />
                  <span>Friends</span>
                  <strong>{connectedProfile.friendOfCount || 0}</strong>
                </div>
                <div>
                  <Award size={20} />
                  <span>Platforms</span>
                  <strong>1</strong>
                </div>
              </div>
            </section>

            <section className="badges-card">
              <div className="section-title">
                <h2>
                  <Award size={24} />
                  Profile Badges
                </h2>
              </div>

              <div className="badge-grid">
                <div className="badge-tile orange">
                  <Flame size={30} />
                  <strong>{connectedProfile.rank || "Unrated"}</strong>
                  <span>Rank</span>
                </div>
                <div className="badge-tile lime">
                  <Zap size={30} />
                  <strong>{connectedProfile.solvedCount || 0}</strong>
                  <span>Solved</span>
                </div>
                <div className="badge-tile purple">
                  <Award size={30} />
                  <strong>{connectedProfile.maxRank || "Max"}</strong>
                  <span>Best Rank</span>
                </div>
                <div className="badge-tile teal">
                  <ShieldCheck size={30} />
                  <strong>{connectedProfile.country || "Unknown"}</strong>
                  <span>Country</span>
                </div>
                <div className="badge-tile blue">
                  <Code2 size={30} />
                  <strong>{connectedProfile.handle}</strong>
                  <span>Handle</span>
                </div>
                <div className="badge-tile pink">
                  <Star size={30} />
                  <strong>{connectedProfile.organization || "Coder"}</strong>
                  <span>Organization</span>
                </div>
              </div>

              <a className="ghost-button as-link" href={connectedProfile.profileUrl} target="_blank">
                Open Profile
              </a>
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
