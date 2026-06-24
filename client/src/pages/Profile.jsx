import {Activity,ArrowRight,BarChart3,BookOpen,Code2,ExternalLink,GitFork,Globe2,Loader2,Star,Trophy,Users} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";

const getPlatformLabel = (platform) => {
  if (platform === "github") return "GitHub";
  if (platform === "codeforces") return "Codeforces";
  return platform;
};

const formatNumber = (value) => new Intl.NumberFormat("en-US").format(value || 0);

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

const formatRelative = (seconds) => {
  if (!seconds) return "N/A";

  const delta = Date.now() - seconds * 1000;
  const minutes = Math.floor(delta / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
};

const getFallbackOverview = (profile) => {
  if (profile.platform === "github") {
    return [
      { key: "repos", label: "Public repos", value: profile.solvedCount || 0, description: "Repositories visible on GitHub" },
      { key: "followers", label: "Followers", value: profile.friendOfCount || 0, description: "People following the profile" },
      { key: "stars", label: "Stars", value: profile.rawData?.totalStars || 0, description: "Stars across fetched repositories" },
      { key: "forks", label: "Forks", value: profile.rawData?.totalForks || 0, description: "Forks across fetched repositories" }
    ];
  }

  return [
    { key: "rating", label: "Rating", value: profile.rating || 0, description: "Current Codeforces rating" },
    { key: "maxRating", label: "Max rating", value: profile.maxRating || 0, description: "Highest rating achieved" },
    { key: "solved", label: "Solved", value: profile.solvedCount || 0, description: "Unique problems solved" },
    { key: "attempted", label: "Attempted", value: profile.attemptedCount || 0, description: "Unique problems attempted" }
  ];
};

const Profile = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [loading, setLoading] = useState(true);

  const loadProfiles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/users/me");
      const nextProfiles = response.data.user?.profiles || [];
      setProfiles(nextProfiles);
      setSelectedPlatform((current) => current || nextProfiles[0]?.platform || "");
    } catch {
      localStorage.removeItem("token");
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.platform === selectedPlatform) || profiles[0] || null,
    [profiles, selectedPlatform]
  );

  const overview = selectedProfile?.stats?.overview?.length
    ? selectedProfile.stats.overview
    : selectedProfile
      ? getFallbackOverview(selectedProfile)
      : [];

  const githubRepos = selectedProfile?.stats?.topRepos || selectedProfile?.rawData?.topRepos || [];
  const languageBreakdown =
    selectedProfile?.stats?.languageBreakdown || selectedProfile?.rawData?.languageBreakdown || [];
  const verdictBreakdown = selectedProfile?.stats?.verdictBreakdown || selectedProfile?.rawData?.verdictBreakdown || {};
  const recentSubmissions =
    selectedProfile?.stats?.recentSubmissions || selectedProfile?.rawData?.recentSubmissions || [];
  const recentContests = selectedProfile?.stats?.recentContests || selectedProfile?.rawData?.recentContests || [];

  if (loading) {
    return (
      <section className="simple-panel">
        <span className="section-icon blue">
          <Loader2 className="spin" size={22} />
        </span>
        <h1>Loading analytics</h1>
        <p>Fetching your connected platforms and their detailed stats.</p>
      </section>
    );
  }

  if (!profiles.length || !selectedProfile) {
    return (
      <section className="profile-page">
        <section className="empty-state">
          <span className="section-icon blue">
            <BarChart3 size={24} />
          </span>
          <h1>No analytics yet</h1>
          <p>Connect GitHub or Codeforces first, then this page will show deep platform analytics.</p>
          <Link className="primary-button as-link" to="/platforms">
            Connect Platform
          </Link>
        </section>
      </section>
    );
  }

  const isGithub = selectedProfile.platform === "github";
  const isCodeforces = selectedProfile.platform === "codeforces";
  const verdictEntries = Object.entries(verdictBreakdown);
  const verdictTotal = verdictEntries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <section className="profile-page">
      <div className="page-heading compact-heading">
        <div>
          <h1>Analytics</h1>
          <p>Deep dive into each connected platform.</p>
        </div>
        <Link className="ghost-compact" to="/platforms">
          Manage Platforms
          <ArrowRight size={16} />
        </Link>
      </div>

      <section className="profile-tabs">
        {profiles.map((profile) => (
          <Link
            key={profile._id}
            to={`/profile/${profile.platform}`}
            className={`profile-tab ${profile.platform === selectedProfile.platform ? "active" : ""}`}
          >
            <span className="profile-tab-icon">
              {profile.platform === "github" ? <Code2 size={16} /> : <Trophy size={16} />}
            </span>
            <span>
              <strong>{getPlatformLabel(profile.platform)}</strong>
              <small>{profile.handle}</small>
            </span>
          </Link>
        ))}
      </section>

      <section className="profile-hero">
        <div className="profile-hero-main">
          <img src={selectedProfile.avatar || selectedProfile.titlePhoto} alt={`${selectedProfile.handle} avatar`} />
          <div>
            <div className="profile-hero-meta">
              <span className="profile-platform-badge">
                <Globe2 size={15} />
                {getPlatformLabel(selectedProfile.platform)}
              </span>
              <span className="profile-platform-badge muted">
                {selectedProfile.rankBadge?.label || selectedProfile.rank || "unrated"}
              </span>
            </div>
            <h2>{selectedProfile.firstName || selectedProfile.handle}</h2>
            <p>{selectedProfile.platform === "github" ? selectedProfile.rawData?.user?.bio || "No GitHub bio available." : `${selectedProfile.rank || "unrated"} rating profile with ${selectedProfile.solvedCount || 0} solved problems.`}</p>
          </div>
        </div>

        <div className="profile-hero-actions">
          <a className="ghost-compact" href={selectedProfile.profileUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={16} />
            Open profile
          </a>
          <div className="profile-hero-metrics">
            <span>
              <Users size={15} />
              {formatNumber(selectedProfile.friendOfCount || selectedProfile.contestsCount || 0)} followers
            </span>
            <span>
              <Activity size={15} />
              Updated {formatRelative(selectedProfile.lastOnlineTimeSeconds)}
            </span>
          </div>
        </div>
      </section>

      <section className="profile-section">
        <div className="section-title">
          <h2>
            <BarChart3 size={24} />
            Overview stats
          </h2>
          <p>Normalized metrics stored on each profile.</p>
        </div>

        <div className="profile-overview-grid">
          {overview.map((stat) => (
            <article className="profile-overview-card" key={stat.key || stat.label}>
              <span>{stat.label}</span>
              <strong>{formatNumber(stat.value)}</strong>
              <p>{stat.description}</p>
            </article>
          ))}
        </div>
      </section>

      {isGithub && (
        <div className="profile-two-column">
          <section className="profile-section panel-surface">
            <div className="section-title">
              <h2>
                <Code2 size={24} />
                Top repositories
              </h2>
              <p>Most active and most starred repositories.</p>
            </div>

            <div className="repo-list">
              {githubRepos.length > 0 ? (
                githubRepos.map((repo) => (
                  <article className="repo-item" key={repo.id}>
                    <div>
                      <strong>{repo.name}</strong>
                      <p>{repo.description || "No repository description provided."}</p>
                    </div>
                    <div className="repo-meta">
                      <span>
                        <Star size={14} />
                        {formatNumber(repo.stars)}
                      </span>
                      <span>
                        <GitFork size={14} />
                        {formatNumber(repo.forks)}
                      </span>
                      <span>{repo.language || "Unknown"}</span>
                    </div>
                    <a href={repo.url} target="_blank" rel="noreferrer">
                      View repository
                      <ExternalLink size={14} />
                    </a>
                  </article>
                ))
              ) : (
                <div className="empty-inline">
                  <p>No repository breakdown available.</p>
                </div>
              )}
            </div>
          </section>

          <section className="profile-section panel-surface">
            <div className="section-title">
              <h2>
                <Star size={24} />
                Language breakdown
              </h2>
              <p>Repository language spread from the fetched repos.</p>
            </div>

            <div className="chip-grid">
              {languageBreakdown.length > 0 ? (
                languageBreakdown.map((item) => (
                  <span className="stat-chip" key={item.language}>
                    {item.language}
                    <strong>{item.count}</strong>
                  </span>
                ))
              ) : (
                <div className="empty-inline">
                  <p>No language data available.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {isCodeforces && (
        <div className="profile-two-column">
          <section className="profile-section panel-surface">
            <div className="section-title">
              <h2>
                <Trophy size={24} />
                Verdict breakdown
              </h2>
              <p>Submission outcomes from the fetched submission sample.</p>
            </div>

            <div className="verdict-list">
              {verdictEntries.length > 0 ? (
                verdictEntries.map(([verdict, count]) => (
                  <article className="verdict-row" key={verdict}>
                    <div className="verdict-row-head">
                      <strong>{verdict}</strong>
                      <span>{count}</span>
                    </div>
                    <div className="verdict-bar">
                      <span style={{ width: `${(count / verdictTotal) * 100}%` }} />
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-inline">
                  <p>No verdict data available.</p>
                </div>
              )}
            </div>
          </section>

          <section className="profile-section panel-surface">
            <div className="section-title">
              <h2>
                <BookOpen size={24} />
                Recent submissions
              </h2>
              <p>Latest submissions and outcomes from Codeforces.</p>
            </div>

            <div className="submission-list">
              {recentSubmissions.length > 0 ? (
                recentSubmissions.map((submission) => (
                  <article className="submission-item" key={submission.id}>
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
                ))
              ) : (
                <div className="empty-inline">
                  <p>No recent submissions available.</p>
                </div>
              )}
            </div>

            <div className="contest-grid">
              {recentContests.slice(0, 3).map((contest) => (
                <article className="contest-card" key={`${contest.contestId}-${contest.ratingUpdateTimeSeconds}`}>
                  <strong>{contest.contestName}</strong>
                  <span>
                    Rank {contest.rank} · {contest.delta >= 0 ? "+" : ""}
                    {contest.delta}
                  </span>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}

      <Link className="ghost-button as-link" to="/">
        Back to Dashboard
      </Link>
    </section>
  );
};

export default Profile;
