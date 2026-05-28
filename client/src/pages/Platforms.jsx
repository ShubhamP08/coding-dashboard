import {
  Activity,
  BarChart3,
  BookOpen,
  Code2,
  GitFork,
  Link as LinkIcon,
  Loader2,
  Plus,
  Star,
  Trash2,
  Trophy,
  Users
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";

const platformOptions = {
  github: {
    label: "GitHub",
    placeholder: "https://github.com/username"
  },
  codeforces: {
    label: "Codeforces",
    placeholder: "https://codeforces.com/profile/username"
  }
};

const getProfileDescription = (profile) => {
  if (profile.platform === "github") {
    return profile.rawData?.user?.bio || "No GitHub bio available.";
  }

  return `${profile.rank || "unrated"} rating profile with ${
    profile.solvedCount || 0
  } solved problems in the latest fetched submissions.`;
};

const getProfileStats = (profile) => {
  const stats = Array.isArray(profile.stats?.overview) ? profile.stats.overview : [];

  if (stats.length > 0) {
    if (profile.platform === "github") {
      return stats.slice(0, 4).map((stat) => {
        const iconMap = {
          repos: BookOpen,
          followers: Users,
          following: Users,
          stars: Star,
          forks: GitFork,
          languages: Code2
        };

        return {
          icon: iconMap[stat.key] || BarChart3,
          label: `${stat.value} ${stat.label.toLowerCase()}`
        };
      });
    }

    return stats.slice(0, 4).map((stat) => {
      const iconMap = {
        rating: Trophy,
        maxRating: BarChart3,
        solved: BookOpen,
        attempted: Activity,
        contests: Activity,
        submissions: Code2
      };

      return {
        icon: iconMap[stat.key] || BarChart3,
        label: `${stat.value} ${stat.label.toLowerCase()}`
      };
    });
  }

  if (profile.platform === "github") {
    return [
      { icon: BookOpen, label: `${profile.solvedCount || 0} repos` },
      { icon: Users, label: `${profile.contestsCount || 0} followers` },
      { icon: Star, label: `${profile.rawData?.totalStars || 0} stars` },
      { icon: GitFork, label: `${profile.rawData?.totalForks || 0} forks` }
    ];
  }

  return [
    { icon: Trophy, label: `${profile.rating || 0} rating` },
    { icon: BarChart3, label: `${profile.maxRating || 0} max` },
    { icon: BookOpen, label: `${profile.solvedCount || 0} recent solved` },
    { icon: Activity, label: `${profile.contestsCount || 0} contests` }
  ];
};

const Platforms = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [platform, setPlatform] = useState("github");
  const [profileLink, setProfileLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [removingId, setRemovingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const connectedPlatforms = useMemo(
    () => profiles.map((profile) => profile.platform),
    [profiles]
  );
  const selectedPlatform = platformOptions[platform];
  const isSelectedPlatformConnected = connectedPlatforms.includes(platform);

  const loadAccount = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/users/me");
      setUser(response.data.user);
      setProfiles(response.data.user?.profiles || []);
    } catch {
      localStorage.removeItem("token");
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  const connectProfile = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!profileLink.trim()) {
      setError(`Paste your ${selectedPlatform.label} profile link first`);
      return;
    }

    try {
      setConnecting(true);
      const response = await api.post("/profiles/connect", {
        platform,
        profileLink
      });
      setProfiles(response.data.profiles || [response.data.data]);
      setProfileLink("");
      setSuccess(`${selectedPlatform.label} profile connected successfully`);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          `Could not connect ${selectedPlatform.label} profile`
      );
    } finally {
      setConnecting(false);
    }
  };

  const removeProfile = async (profileId) => {
    setError("");
    setSuccess("");

    try {
      setRemovingId(profileId);
      const response = await api.delete(`/profiles/${profileId}`);
      setProfiles(response.data.data || []);
      setSuccess("Profile removed successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Could not remove profile");
    } finally {
      setRemovingId("");
    }
  };

  if (loading) {
    return (
      <section className="simple-panel">
        <span className="section-icon blue">
          <Activity size={22} />
        </span>
        <h1>Loading Platforms</h1>
        <p>Fetching your account and connected profiles.</p>
      </section>
    );
  }

  return (
    <section className="platforms-page">
      <div className="page-heading compact-heading">
        <div>
          <h1>Platforms</h1>
          <p>Add, review, and remove your connected coding accounts.</p>
        </div>
      </div>

      <section className="account-panel">
        <div>
          <span>Account</span>
          <strong>{user?.email}</strong>
        </div>
        <div>
          <span>Connected Platforms</span>
          <strong>{profiles.length}</strong>
        </div>
        <div>
          <span>Available Now</span>
          <strong>GitHub, Codeforces</strong>
        </div>
      </section>

      <div className="platforms-grid">
        <section className="platform-card-large">
          <div className="section-title">
            <h2>
              <Code2 size={24} />
              Connected Accounts
            </h2>
          </div>

          {profiles.length === 0 ? (
            <div className="empty-inline">
              <p>No platforms connected yet.</p>
            </div>
          ) : (
            <div className="connected-list">
              {profiles.map((profile) => (
                <article className="connected-card" key={profile._id}>
                  <img src={profile.avatar || profile.titlePhoto} alt={`${profile.handle} avatar`} />
                  <div className="connected-main">
                    <span className="profile-platform">
                      <Code2 size={16} />
                      {platformOptions[profile.platform]?.label || profile.platform}
                    </span>
                    <h3>{profile.firstName || profile.handle}</h3>
                    <p>{getProfileDescription(profile)}</p>
                    <div className="mini-stats">
                      {getProfileStats(profile).map((stat) => {
                        const Icon = stat.icon;

                        return (
                          <span key={stat.label}>
                            <Icon size={15} />
                            {stat.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="connected-actions">
                    <a className="ghost-compact" href={profile.profileUrl} target="_blank">
                      <LinkIcon size={16} />
                      Open
                    </a>
                    <button
                      className="danger-button"
                      type="button"
                      onClick={() => removeProfile(profile._id)}
                      disabled={removingId === profile._id}
                    >
                      {removingId === profile._id ? (
                        <Loader2 className="spin" size={16} />
                      ) : (
                        <Trash2 size={16} />
                      )}
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="platform-card-large">
          <div className="section-title">
            <h2>
              <Plus size={24} />
              Add Platform
            </h2>
          </div>

          <form className="connect-form" onSubmit={connectProfile}>
            <label className="field">
              <span>Platform</span>
              <select
                value={platform}
                onChange={(event) => {
                  setPlatform(event.target.value);
                  setProfileLink("");
                  setError("");
                  setSuccess("");
                }}
              >
                <option value="github">GitHub</option>
                <option value="codeforces">Codeforces</option>
              </select>
            </label>

            <label className="field">
              <span>{selectedPlatform.label} Profile Link</span>
              <input
                value={profileLink}
                onChange={(event) => setProfileLink(event.target.value)}
                placeholder={selectedPlatform.placeholder}
                disabled={isSelectedPlatformConnected}
              />
            </label>

            <button
              className="primary-button"
              type="submit"
              disabled={connecting || isSelectedPlatformConnected}
            >
              {connecting ? <Loader2 className="spin" size={18} /> : null}
              {isSelectedPlatformConnected
                ? `${selectedPlatform.label} Already Connected`
                : `Connect ${selectedPlatform.label}`}
            </button>
          </form>

          {error && <p className="form-error panel-message">{error}</p>}
          {success && <p className="form-success panel-message">{success}</p>}

          <div className="platform-roadmap">
            <strong>Coming next</strong>
            <span>LeetCode</span>
            <span>GFG</span>
          </div>
        </section>
      </div>

      <Link className="ghost-button as-link" to="/">
        Back to Dashboard
      </Link>
    </section>
  );
};

export default Platforms;
