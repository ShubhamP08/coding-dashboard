import {
  Activity,
  BookOpen,
  Code2,
  GitFork,
  Link as LinkIcon,
  Loader2,
  Plus,
  Star,
  Trash2,
  Users
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";

const Platforms = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [profileLink, setProfileLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [removingId, setRemovingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const githubProfile = useMemo(
    () => profiles.find((profile) => profile.platform === "github"),
    [profiles]
  );

  const loadAccount = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users/me");
      setUser(response.data.user);
      setProfiles(response.data.user?.profiles || []);
    } catch (err) {
      localStorage.removeItem("token");
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccount();
  }, []);

  const connectGithub = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!profileLink.trim()) {
      setError("Paste your GitHub profile link first");
      return;
    }

    try {
      setConnecting(true);
      const response = await api.post("/profiles/connect", {
        platform: "github",
        profileLink
      });
      setProfiles(response.data.profiles || [response.data.data]);
      setProfileLink("");
      setSuccess("GitHub profile connected successfully");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Could not connect GitHub profile"
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
          <span>Primary Platform</span>
          <strong>{githubProfile ? "GitHub" : "Not connected"}</strong>
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
              {profiles.map((profile) => {
                const data = profile.rawData || {};

                return (
                  <article className="connected-card" key={profile._id}>
                    <img src={profile.avatar} alt={`${profile.handle} avatar`} />
                    <div className="connected-main">
                      <span className="profile-platform">
                        <Code2 size={16} />
                        {profile.platform}
                      </span>
                      <h3>{profile.firstName || profile.handle}</h3>
                      <p>{data.user?.bio || "No profile bio available."}</p>
                      <div className="mini-stats">
                        <span>
                          <BookOpen size={15} />
                          {profile.solvedCount || 0} repos
                        </span>
                        <span>
                          <Users size={15} />
                          {profile.contestsCount || 0} followers
                        </span>
                        <span>
                          <Star size={15} />
                          {data.totalStars || 0} stars
                        </span>
                        <span>
                          <GitFork size={15} />
                          {data.totalForks || 0} forks
                        </span>
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
                );
              })}
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

          <form className="connect-form" onSubmit={connectGithub}>
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
                disabled={Boolean(githubProfile)}
              />
            </label>

            <button className="primary-button" type="submit" disabled={connecting || Boolean(githubProfile)}>
              {connecting ? <Loader2 className="spin" size={18} /> : null}
              {githubProfile ? "GitHub Already Connected" : "Connect GitHub"}
            </button>
          </form>

          {error && <p className="form-error panel-message">{error}</p>}
          {success && <p className="form-success panel-message">{success}</p>}

          <div className="platform-roadmap">
            <strong>Coming next</strong>
            <span>Codeforces</span>
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
