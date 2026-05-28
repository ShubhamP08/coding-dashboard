import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Code2,
  ExternalLink,
  GitFork,
  Globe2,
  Loader2,
  Star,
  Trophy,
  Users
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/client";

const getPlatformLabel = (platform) => {
  if (platform === "github") return "GitHub";
  if (platform === "codeforces") return "Codeforces";
  return platform;
};

const getPlatformIcon = (platform) => {
  if (platform === "github") return Code2;
  if (platform === "codeforces") return Trophy;
  return Globe2;
};

const KNOWN_PLATFORMS = ["github", "codeforces"];

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

const DetailSection = ({ icon, title, description, children, full = true }) => {
  const SectionIcon = icon;

  return (
    <section className={`detail-section${full ? " detail-section-full" : ""}`}>
      <div className="section-title">
        <h2>
          <SectionIcon size={24} />
          {title}
        </h2>
        {description ? <p>{description}</p> : null}
      </div>
      {children}
    </section>
  );
};

const EmptyInline = ({ message }) => (
  <div className="empty-inline">
    <p>{message}</p>
  </div>
);

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

  // First load: fetch all profiles
  useEffect(() => {
    const loadProfiles = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await api.get("/users/me");
        const nextProfiles = response.data.user?.profiles || [];
        setProfiles(nextProfiles);
        
        // Determine which platform to show
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

  // Second load: fetch profile data when selectedPlatform changes
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

  const overview = profile?.stats?.overview?.length
    ? profile.stats.overview
    : profile
      ? Object.entries({
          repos: { label: "Public repos", value: profile.solvedCount || 0 },
          followers: { label: "Followers", value: profile.friendOfCount || 0 },
          stars: { label: "Stars", value: profile.rawData?.totalStars || 0 },
          forks: { label: "Forks", value: profile.rawData?.totalForks || 0 }
        }).map(([key, data]) => ({
          key,
          label: data.label,
          value: data.value,
          description: ""
        }))
      : [];

  const isGithub = selectedPlatform === "github";
  const isCodeforces = selectedPlatform === "codeforces";

  const codeforcesCurrentRating = profile?.rating || 0;
  const codeforcesMaxRating = profile?.maxRating || 0;
  const codeforcesGlobalRank = profile?.rankBadge?.label || profile?.rank || "unrated";
  const codeforcesContestCount = profile?.contestsCount || profile?.stats?.recentContests?.length || 0;
  const codeforcesSolvedCount = profile?.solvedCount || 0;

  const platformTabs = useMemo(() => {
    const connectedPlatforms = profiles.map((p) => p.platform);
    const extraPlatforms = connectedPlatforms.filter((p) => !KNOWN_PLATFORMS.includes(p));
    const orderedPlatforms = [...KNOWN_PLATFORMS, ...extraPlatforms];

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

  const githubRepos = useMemo(
    () => profile?.stats?.topRepos || profile?.rawData?.topRepos || [],
    [profile?.stats?.topRepos, profile?.rawData?.topRepos]
  );
  const languageBreakdown = useMemo(
    () => profile?.stats?.languageBreakdown || profile?.rawData?.languageBreakdown || [],
    [profile?.stats?.languageBreakdown, profile?.rawData?.languageBreakdown]
  );
  const recentSubmissions = useMemo(
    () => profile?.stats?.recentSubmissions || profile?.rawData?.recentSubmissions || [],
    [profile?.stats?.recentSubmissions, profile?.rawData?.recentSubmissions]
  );
  const recentContests = useMemo(
    () => profile?.stats?.recentContests || profile?.rawData?.recentContests || [],
    [profile?.stats?.recentContests, profile?.rawData?.recentContests]
  );

  const ratingGraph = useMemo(
    () => profile?.stats?.ratingGraph || profile?.rawData?.ratingGraph || [],
    [profile?.stats?.ratingGraph, profile?.rawData?.ratingGraph]
  );

  const problemTagBreakdown = useMemo(
    () => profile?.stats?.problemTagsBreakdown || profile?.rawData?.problemTagsBreakdown || {},
    [profile?.stats?.problemTagsBreakdown, profile?.rawData?.problemTagsBreakdown]
  );

  const verdictEntries = useMemo(() => {
    const breakdown = profile?.stats?.verdictBreakdown || profile?.rawData?.verdictBreakdown || {};
    return Object.entries(breakdown);
  }, [profile?.stats?.verdictBreakdown, profile?.rawData?.verdictBreakdown]);

  const verdictTotal = useMemo(() => {
    const breakdown = profile?.stats?.verdictBreakdown || profile?.rawData?.verdictBreakdown || {};
    return Object.values(breakdown).reduce((sum, count) => sum + count, 0);
  }, [profile?.stats?.verdictBreakdown, profile?.rawData?.verdictBreakdown]);

  const codeforcesSummaryCards = useMemo(
    () => [
      {
        key: "current-rating",
        label: "Current Rating",
        value: codeforcesCurrentRating,
        description: "Live Codeforces rating"
      },
      {
        key: "max-rating",
        label: "Max Rating",
        value: codeforcesMaxRating,
        description: "Peak achieved rating"
      },
      {
        key: "global-rank",
        label: "Global Rank",
        value: codeforcesGlobalRank,
        description: "Current overall standing"
      },
      {
        key: "contest-count",
        label: "Contest Count",
        value: codeforcesContestCount,
        description: "Rated contests tracked"
      },
      {
        key: "problems-solved",
        label: "Problems Solved",
        value: codeforcesSolvedCount,
        description: "Unique accepted problems"
      }
    ],
    [codeforcesContestCount, codeforcesCurrentRating, codeforcesGlobalRank, codeforcesMaxRating, codeforcesSolvedCount]
  );

  const platformSections = useMemo(() => {
    const githubSections = [
      {
        key: "github-top-repositories",
        icon: Code2,
        title: "Top repositories",
        description: "Most starred and active repositories.",
        content:
          githubRepos.length > 0 ? (
            <div className="detail-repos-grid">
              {githubRepos.map((repo) => (
                <article className="detail-repo-card" key={repo.id}>
                  <div className="detail-repo-head">
                    <div>
                      <strong>{repo.name}</strong>
                      <span className="detail-repo-language">{repo.language || "Unknown"}</span>
                    </div>
                    <a href={repo.url} target="_blank" rel="noreferrer" aria-label="Open repository">
                      <ExternalLink size={16} />
                    </a>
                  </div>
                  <p>{repo.description || "No repository description provided."}</p>
                  <div className="detail-repo-stats">
                    <span>
                      <Star size={14} />
                      {formatNumber(repo.stars)} stars
                    </span>
                    <span>
                      <GitFork size={14} />
                      {formatNumber(repo.forks)} forks
                    </span>
                    <span>
                      <Users size={14} />
                      {formatNumber(repo.watchers)} watchers
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyInline message="No repository data available." />
          )
      },
      {
        key: "github-language-breakdown",
        icon: Star,
        title: "Language breakdown",
        description: "Repository language spread from the fetched repos.",
        content:
          languageBreakdown.length > 0 ? (
            <div className="detail-language-grid">
              {languageBreakdown.map((item) => {
                const maxCount = Math.max(...languageBreakdown.map((i) => i.count));
                const percentage = (item.count / maxCount) * 100;

                return (
                  <article className="detail-language-item" key={item.language}>
                    <div className="detail-language-head">
                      <strong>{item.language}</strong>
                      <span>{item.count}</span>
                    </div>
                    <div className="detail-language-bar">
                      <div style={{ width: `${percentage}%` }}></div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyInline message="No language data available." />
          )
      }
    ];

    const ratingGraphPoints = ratingGraph.length > 0 ? ratingGraph : [{ contestName: "Current", rating: codeforcesCurrentRating, oldRating: codeforcesCurrentRating, delta: 0, time: 0 }];
    const graphValues = ratingGraphPoints.map((point) => point.rating || 0);
    const graphMin = Math.min(...graphValues);
    const graphMax = Math.max(...graphValues);
    const graphWidth = 720;
    const graphHeight = 240;
    const graphPadding = 28;
    const graphPoints = ratingGraphPoints.map((point, index) => {
      const xStep = ratingGraphPoints.length > 1 ? (graphWidth - graphPadding * 2) / (ratingGraphPoints.length - 1) : 0;
      const x = graphPadding + index * xStep;
      const normalized = graphMax === graphMin ? 0.5 : (point.rating - graphMin) / (graphMax - graphMin);
      const y = graphHeight - graphPadding - normalized * (graphHeight - graphPadding * 2);
      return { ...point, x, y };
    });
    const graphPath = graphPoints.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");

    const problemTags = Object.entries(problemTagBreakdown)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    const codeforcesSections = [
      {
        key: "codeforces-rating-and-verdicts",
        icon: Activity,
        title: "Performance overview",
        description: "Rating progression and submission outcomes.",
        content: (
          <div className="codeforces-two-column-grid">
            <article className="detail-section-full codeforces-chart-panel">
              <div className="section-title">
                <h2>
                  <Trophy size={24} />
                  Rating graph
                </h2>
                <p>Rating changes across recent rated contests.</p>
              </div>

              <div className="codeforces-chart-wrap">
                {ratingGraphPoints.length > 0 ? (
                  <svg viewBox={`0 0 ${graphWidth} ${graphHeight}`} className="codeforces-rating-chart" role="img" aria-label="Codeforces rating graph">
                    <defs>
                      <linearGradient id="ratingFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity="0.03" />
                      </linearGradient>
                    </defs>
                    <path d={`${graphPath} L ${graphPoints[graphPoints.length - 1].x},${graphHeight - graphPadding} L ${graphPoints[0].x},${graphHeight - graphPadding} Z`} fill="url(#ratingFill)" />
                    <path d={graphPath} className="codeforces-rating-line" />
                    {graphPoints.map((point) => (
                      <g key={`${point.contestName}-${point.time}`}>
                        <circle cx={point.x} cy={point.y} r="4.5" className="codeforces-rating-dot" />
                        <text x={point.x} y={graphHeight - 6} textAnchor="middle" className="codeforces-rating-label">
                          {point.contestName.length > 10 ? `${point.contestName.slice(0, 10)}…` : point.contestName}
                        </text>
                      </g>
                    ))}
                  </svg>
                ) : (
                  <EmptyInline message="No rating graph available." />
                )}
              </div>
            </article>

            <section className="detail-section-full codeforces-verdict-panel">
              <div className="section-title">
                <h2>
                  <Star size={24} />
                  Verdict breakdown
                </h2>
                <p>Accepted, failed, and runtime behavior across submissions.</p>
              </div>

              {verdictEntries.length > 0 ? (
                <div className="detail-verdicts-grid">
                  {verdictEntries.map(([verdict, count]) => (
                    <article className="detail-verdict-item" key={verdict}>
                      <div className="detail-verdict-row">
                        <div>
                          <strong>{verdict}</strong>
                          <p>{count} submissions</p>
                        </div>
                        <span className="detail-verdict-percentage">
                          {verdictTotal > 0 ? Math.round((count / verdictTotal) * 100) : 0}%
                        </span>
                      </div>
                      <div className="detail-verdict-bar">
                        <span style={{ width: `${verdictTotal > 0 ? (count / verdictTotal) * 100 : 0}%` }} />
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyInline message="No verdict data available." />
              )}
            </section>
          </div>
        )
      },
      {
        key: "codeforces-activity",
        icon: BookOpen,
        title: "Recent activity",
        description: "Recent contests and submissions in a balanced two-column layout.",
        content: (
          <div className="codeforces-two-column-grid">
            <section className="detail-section-full codeforces-list-panel">
              <div className="section-title">
                <h2>
                  <Activity size={24} />
                  Recent contests
                </h2>
                <p>Latest contest rating updates.</p>
              </div>

              {recentContests.length > 0 ? (
                <div className="contest-grid codeforces-contest-grid">
                  {recentContests.slice(0, 6).map((contest) => (
                    <article className="contest-card codeforces-contest-card" key={`${contest.contestId}-${contest.ratingUpdateTimeSeconds}`}>
                      <strong>{contest.contestName}</strong>
                      <span>
                        Rank {contest.rank} · {contest.delta >= 0 ? "+" : ""}
                        {contest.delta}
                      </span>
                      <small>{formatDate(contest.ratingUpdateTimeSeconds)}</small>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyInline message="No contest history available." />
              )}
            </section>

            <section className="detail-section-full codeforces-list-panel">
              <div className="section-title">
                <h2>
                  <BookOpen size={24} />
                  Recent submissions
                </h2>
                <p>Latest submissions with verdict and language.</p>
              </div>

              {recentSubmissions.length > 0 ? (
                <div className="submission-list codeforces-submission-list">
                  {recentSubmissions.slice(0, 8).map((submission) => (
                    <article className="submission-item codeforces-submission-item" key={submission.id}>
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
                  ))}
                </div>
              ) : (
                <EmptyInline message="No recent submissions available." />
              )}
            </section>
          </div>
        )
      },
      {
        key: "codeforces-tags",
        icon: Code2,
        title: "Problem tags breakdown",
        description: "Tags from accepted problems, ranked by frequency.",
        content:
          problemTags.length > 0 ? (
            <div className="codeforces-tags-grid">
              {problemTags.map((item) => {
                const maxTagCount = Math.max(...problemTags.map((tag) => tag.count));
                const width = maxTagCount > 0 ? (item.count / maxTagCount) * 100 : 0;

                return (
                  <article className="detail-language-item codeforces-tag-card" key={item.tag}>
                    <div className="detail-language-head">
                      <strong>{item.tag}</strong>
                      <span>{item.count}</span>
                    </div>
                    <div className="detail-language-bar">
                      <div style={{ width: `${width}%` }}></div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyInline message="No tag data available." />
          )
      }
    ];

    const sectionMap = {
      github: githubSections,
      codeforces: codeforcesSections
    };

    return (sectionMap[selectedPlatform] || []).filter((section) => !section.hidden);
  }, [
    codeforcesCurrentRating,
    githubRepos,
    languageBreakdown,
    selectedPlatform,
    problemTagBreakdown,
    ratingGraph,
    recentContests,
    recentSubmissions,
    verdictEntries,
    verdictTotal
  ]);

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
                <p>
                  {isGithub
                    ? profile.rawData?.user?.bio || "No GitHub bio available."
                    : `${profile.rank || "unrated"} on Codeforces · Member since ${formatDate(profile.registrationTimeSeconds)}`}
                </p>
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
                  {formatNumber(profile.friendOfCount || profile.contestsCount || 0)} {isGithub ? "followers" : "contests"}
                </span>
                <span>
                  <Activity size={15} />
                  Updated {formatRelative(profile.lastOnlineTimeSeconds)}
                </span>
              </div>
            </div>
          </section>

          <section className={`detail-section${isCodeforces ? " detail-section-full codeforces-snapshot-panel" : ""}`}>
            <div className="section-title">
              <h2>
                <BarChart3 size={24} />
                {isCodeforces ? "Codeforces snapshot" : "Key metrics"}
              </h2>
              <p>{isCodeforces ? "Current rating, rank, contests, and solved problems." : "Normalized metrics stored on each profile."}</p>
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

          {platformSections.map((section) => (
            <DetailSection
              key={section.key}
              icon={section.icon}
              title={section.title}
              description={section.description}
            >
              {section.content}
            </DetailSection>
          ))}
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
