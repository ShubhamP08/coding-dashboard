import { Activity, Code2, Loader2, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import GithubCard from "../components/GithubCard";
import CodeforcesCard from "../components/CodeforcesCard";
import LeetcodeCard from "../components/LeetcodeCard";

const platformOptions = {
  github: {
    label: "GitHub",
    placeholder: "https://github.com/username"
  },
  codeforces: {
    label: "Codeforces",
    placeholder: "https://codeforces.com/profile/username"
  },
  leetcode: {
    label: "LeetCode",
    placeholder: "https://leetcode.com/username"
  },
  gfg: {
    label: "GeeksforGeeks",
    placeholder: "https://auth.geeksforgeeks.org/user/username"
  }
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
  const [refreshingId, setRefreshingId] = useState("");
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

  const refreshProfile = async (profileId) => {
    setError("");
    setSuccess("");

    try {
      setRefreshingId(profileId);
      const response = await api.put(`/profiles/${profileId}/refresh`);
      setProfiles(response.data.profiles || []);
      setSuccess("Profile refreshed successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Could not refresh profile");
    } finally {
      setRefreshingId("");
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
          <strong>GitHub, Codeforces, Leetcode, GFG</strong>
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
                switch (profile.platform) {
                  case "github":
                    return (
                      <GithubCard
                        key={profile._id}
                        profile={profile}
                        removeProfile={removeProfile}
                        removingId={removingId}
                      />
                    );

                  case "codeforces":
                    return (
                      <CodeforcesCard
                        key={profile._id}
                        profile={profile}
                        removeProfile={removeProfile}
                        removingId={removingId}
                      />
                    );

                  case "leetcode":
                    return (
                      <LeetcodeCard
                        key={profile._id}
                        profile={profile}
                        refreshProfile={refreshProfile}
                        refreshingId={refreshingId}
                        removeProfile={removeProfile}
                        removingId={removingId}
                      />
                    );

                  default:
                    return null;
                }
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
                <option value="leetcode">LeetCode</option>
                <option value="gfg">GeeksforGeeks</option>
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

          {/* <div className="platform-roadmap">
            <strong>Coming next</strong>
            <span>LeetCode</span>
            <span>GFG</span>
          </div> */}
        </section>
      </div>

      <Link className="ghost-button as-link" to="/">
        Back to Dashboard
      </Link>
    </section>
  );
};

export default Platforms;
