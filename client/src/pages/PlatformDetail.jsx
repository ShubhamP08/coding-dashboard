import { Activity, ArrowRight, BarChart3, ExternalLink, Globe2, Loader2, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/client";
import { getPlatformLabel, getPlatformIcon, getKnownPlatforms } from "../config/platformConfig";
import GithubDetail from "../components/GithubDetail";
import CodeforcesDetail from "../components/CodeforcesDetail";
import LeetcodeDetail from "../components/LeetcodeDetail";

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

const LoadingPanel = ({ platformLabel }) => (
  <section className="detail-loading-panel detail-section-full" aria-busy="true" aria-live="polite">
    <div className="detail-loading-card">
      <div className="detail-loading-head">
        <span className="detail-loading-spinner">
          <Loader2 size={22} className="spin" />
        </span>
        <div className="detail-loading-copy">
          <div className="loading-skeleton loading-skeleton-line loading-skeleton-title" />
          <div className="loading-skeleton loading-skeleton-line loading-skeleton-subtitle" />
        </div>
      </div>
      <div className="loading-skeleton loading-skeleton-grid loading-skeleton-grid-top" />
      <div className="loading-skeleton loading-skeleton-chart" />
      <div className="loading-skeleton loading-skeleton-grid loading-skeleton-grid-bottom" />
      <p className="detail-loading-note">Loading {platformLabel} analytics…</p>
    </div>
  </section>
);

const PlatformDetail = () => {
  const navigate = useNavigate();
  const { platform: platformParam } = useParams();
  const [profiles, setProfiles] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState(platformParam || null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load all profiles
  useEffect(() => {
    const loadProfiles = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await api.get("/users/me");
        const nextProfiles = response.data.user?.profiles || [];
        setProfiles(nextProfiles);

        let platformToShow = platformParam;
        if (!platformToShow && nextProfiles.length > 0) {
          platformToShow = nextProfiles[0].platform;
        }

        if (platformToShow) {
          setSelectedPlatform(platformToShow);
        }
      } catch {
        localStorage.removeItem("token");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    loadProfiles();
  }, [navigate, platformParam]);

  // Load profile data when selectedPlatform changes
  const loadProfile = useCallback(async () => {
    if (!selectedPlatform) return;

    try {
      setLoading(true);
      setError("");
      const response = await api.get("/users/me");
      const nextProfiles = response.data.user?.profiles || [];
      const foundProfile = nextProfiles.find((p) => p.platform === selectedPlatform);

      if (!foundProfile) {
        setError(`${getPlatformLabel(selectedPlatform)} profile not connected`);
        setProfile(null);
      } else {
        setProfile(foundProfile);
      }
    } catch {
      localStorage.removeItem("token");
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [selectedPlatform, navigate]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Build platform tabs
  const platformTabs = useMemo(() => {
    const connectedPlatforms = profiles.map((p) => p.platform);
    const knownPlatforms = getKnownPlatforms();
    const orderedPlatforms = [
      ...knownPlatforms.filter((p) => connectedPlatforms.includes(p)),
      ...connectedPlatforms.filter((p) => !knownPlatforms.includes(p))
    ];

    if (selectedPlatform && !orderedPlatforms.includes(selectedPlatform)) {
      orderedPlatforms.push(selectedPlatform);
    }

    return orderedPlatforms.map((itemPlatform) => {
      const connectedProfile = profiles.find((p) => p.platform === itemPlatform) || null;
      return {
        platform: itemPlatform,
        connected: Boolean(connectedProfile),
        label: getPlatformLabel(itemPlatform),
        icon: getPlatformIcon(itemPlatform),
        handle: connectedProfile?.handle || "Not connected"
      };
    });
  }, [selectedPlatform, profiles]);

  // Build default overview stats
  const overview = useMemo(() => {
    if (profile?.stats?.overview?.length) {
      return profile.stats.overview;
    }

    if (!profile) return [];

    if (profile.platform === "leetcode") {
      return [
        {
          key: "solved",
          label: "Total solved",
          value: profile.solvedCount || profile.rawData?.totalSolved || 0,
          description: "Accepted LeetCode problems"
        },
        {
          key: "easy",
          label: "Easy solved",
          value: profile.stats?.easySolved || profile.rawData?.easySolved || 0,
          description: "Introductory problems completed"
        },
        {
          key: "medium",
          label: "Medium solved",
          value: profile.stats?.mediumSolved || profile.rawData?.mediumSolved || 0,
          description: "Core practice problems completed"
        },
        {
          key: "hard",
          label: "Hard solved",
          value: profile.stats?.hardSolved || profile.rawData?.hardSolved || 0,
          description: "High-difficulty problems completed"
        },
        {
          key: "rating",
          label: "Contest rating",
          value: profile.rating || profile.rawData?.contestRating || "N/A",
          description: "Latest contest rating"
        },
        {
          key: "ranking",
          label: "Global ranking",
          value: profile.rank || profile.rawData?.ranking || "N/A",
          description: "LeetCode profile ranking"
        }
      ];
    }

    return Object.entries({
      repos: { label: "Public repos", value: profile.solvedCount || 0 },
      followers: { label: "Followers", value: profile.friendOfCount || 0 },
      stars: { label: "Stars", value: profile.rawData?.totalStars || 0 },
      forks: { label: "Forks", value: profile.rawData?.totalForks || 0 }
    }).map(([key, data]) => ({
      key,
      label: data.label,
      value: data.value,
      description: ""
    }));
  }, [profile]);

  // Codeforces-specific summary cards
  const codeforcesSummaryCards = useMemo(
    () => [
      { key: "current-rating", label: "Current Rating", value: profile?.rating || 0, description: "Live Codeforces rating" },
      { key: "max-rating", label: "Max Rating", value: profile?.maxRating || 0, description: "Peak achieved rating" },
      {
        key: "global-rank",
        label: "Global Rank",
        value: profile?.rankBadge?.label || profile?.rank || "unrated",
        description: "Current overall standing"
      },
      {
        key: "contest-count",
        label: "Contest Count",
        value: profile?.contestsCount || profile?.stats?.recentContests?.length || 0,
        description: "Rated contests tracked"
      },
      { key: "problems-solved", label: "Problems Solved", value: profile?.solvedCount || 0, description: "Unique accepted problems" }
    ],
    [profile]
  );

  const isGithub = selectedPlatform === "github";
  const isCodeforces = selectedPlatform === "codeforces";
  const isLeetcode = selectedPlatform === "leetcode";
  const PlatformDetailComponent = selectedPlatform === "github" ? GithubDetail : selectedPlatform === "codeforces" ? CodeforcesDetail : selectedPlatform === "leetcode" ? LeetcodeDetail : null;
  const heroDescription = useMemo(() => {
    if (!profile) return "";

    if (isGithub) {
      return profile.rawData?.user?.bio || "No GitHub bio available.";
    }

    if (isLeetcode) {
      const solved = formatNumber(profile.solvedCount || profile.rawData?.totalSolved || 0);
      const ranking = profile.rank || profile.rawData?.ranking || "N/A";
      const rating = profile.rating || profile.rawData?.contestRating || "N/A";
      return `LeetCode profile · ${solved} solved · Ranking ${ranking} · Rating ${rating}`;
    }

    return `${profile.rank || "unrated"} on Codeforces · Member since ${formatDate(profile.registrationTimeSeconds)}`;
  }, [isGithub, isLeetcode, profile]);

  return (
    <section className="detail-page">
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

      {profiles.length === 0 && !loading ? (
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
      ) : (
        <>
          <section className="profile-tabs">
            {platformTabs.map((tab) => {
              const TabIcon = tab.icon;

              return (
                <button
                  key={tab.platform}
                  onClick={() => setSelectedPlatform(tab.platform)}
                  className={`profile-tab ${tab.platform === selectedPlatform ? "active" : ""}`}
                  aria-label={`Switch to ${tab.label}`}
                  type="button"
                >
                  <span className="profile-tab-icon">
                    <TabIcon size={16} />
                  </span>
                  <span>
                    <strong>{tab.label}</strong>
                    <small>{tab.handle}</small>
                  </span>
                </button>
              );
            })}
          </section>

          {loading ? (
            <LoadingPanel platformLabel={getPlatformLabel(selectedPlatform)} />
          ) : profile ? (
            <div key={`profile-${selectedPlatform}`}>
              <section className="detail-hero">
                <div className="detail-hero-main">
                  <img src={profile.avatar || profile.titlePhoto} alt={`${profile.handle} avatar`} />
                  <div>
                    <div className="detail-hero-meta">
                      <span className="detail-platform-badge">
                        <Globe2 size={15} />
                        {getPlatformLabel(profile.platform)}
                      </span>
                      {profile.rankBadge && (
                        <span className="detail-platform-badge muted">
                          {profile.rankBadge?.label || profile.rank || "unrated"}
                        </span>
                      )}
                    </div>
                    <h1>{profile.firstName || profile.handle}</h1>
                    <p>{heroDescription}</p>
                  </div>
                </div>

                <div className="detail-hero-actions">
                  <a className="primary-button" href={profile.profileUrl} target="_blank" rel="noreferrer">
                    <ExternalLink size={16} />
                    Open profile
                  </a>
                  <div className="detail-hero-info">
                    <span>
                      <Users size={15} />
                      {isGithub
                        ? `${formatNumber(profile.friendOfCount || 0)} followers`
                        : isLeetcode
                          ? `${formatNumber(profile.solvedCount || 0)} solved`
                          : `${formatNumber(profile.contestsCount || 0)} contests`}
                    </span>
                    <span>
                      <Activity size={15} />
                      {isLeetcode
                        ? `${formatNumber(profile.stats?.activeDays || profile.rawData?.activeDays || 0)} active days`
                        : `Updated ${formatRelative(profile.lastOnlineTimeSeconds)}`}
                    </span>
                  </div>
                </div>
              </section>

              <section className={`detail-section${isCodeforces ? " detail-section-full codeforces-snapshot-panel" : ""}`}>
                <div className="section-title">
                  <h2>
                    <BarChart3 size={24} />
                    {isCodeforces ? "Codeforces snapshot" : isLeetcode ? "LeetCode snapshot" : "Key metrics"}
                  </h2>
                  <p>
                    {isCodeforces
                      ? "Current rating, rank, contests, and solved problems."
                      : isLeetcode
                        ? "Solved counts, contest standing, and profile ranking."
                        : "Normalized metrics stored on each profile."}
                  </p>
                </div>

                <div className={`detail-metrics-grid${isCodeforces ? " codeforces-summary-grid" : ""}`}>
                  {(isCodeforces ? codeforcesSummaryCards : overview.slice(0, 6)).map((stat) => (
                    <article className="detail-metric-card" key={stat.key || stat.label}>
                      <span>{stat.label}</span>
                      <strong>{typeof stat.value === "number" ? formatNumber(stat.value) : stat.value}</strong>
                      {stat.description && <p>{stat.description}</p>}
                    </article>
                  ))}
                </div>
              </section>

              {PlatformDetailComponent && <PlatformDetailComponent profile={profile} />}
            </div>
          ) : (
            <section className="empty-state">
              <span className="section-icon blue">
                <Globe2 size={24} />
              </span>
              <h1>Platform not connected</h1>
              <p>{error || `${getPlatformLabel(selectedPlatform)} is not connected to your account.`}</p>
              <Link className="primary-button as-link" to="/platforms">
                Connect Platform
              </Link>
            </section>
          )}
        </>
      )}

      {profiles.length > 0 && (
        <Link className="ghost-button as-link" to="/">
          Back to Dashboard
        </Link>
      )}
    </section>
  );
};

export default PlatformDetail;
