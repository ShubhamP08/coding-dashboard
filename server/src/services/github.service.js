const axios = require("axios");

const extractGithubUsername = (profileLinkOrUsername) => {
  if (!profileLinkOrUsername || typeof profileLinkOrUsername !== "string") {
    throw new Error("GitHub profile link or username is required");
  }

  const value = profileLinkOrUsername.trim();

  if (!value) {
    throw new Error("GitHub profile link or username is required");
  }

  if (!value.includes("github.com")) {
    return value.replace(/^@/, "");
  }

  try {
    const url = new URL(value);
    const username = url.pathname.split("/").filter(Boolean)[0];

    if (!username) {
      throw new Error("Invalid GitHub profile link");
    }

    return decodeURIComponent(username).replace(/^@/, "");
  } catch (error) {
    throw new Error("Invalid GitHub profile link");
  }
};

const mapTopRepos = (repos) =>
  [...repos]
    .sort((left, right) => {
      const starDiff = (right.stargazers_count || 0) - (left.stargazers_count || 0);
      if (starDiff !== 0) return starDiff;

      const forkDiff = (right.forks_count || 0) - (left.forks_count || 0);
      if (forkDiff !== 0) return forkDiff;

      return new Date(right.updated_at || 0) - new Date(left.updated_at || 0);
    })
    .slice(0, 6)
    .map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description || "",
      url: repo.html_url,
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      watchers: repo.watchers_count || 0,
      language: repo.language || "Unknown",
      updatedAt: repo.updated_at || null,
      isFork: Boolean(repo.fork)
    }));

const buildLanguageBreakdown = (repos) => {
  const breakdown = repos.reduce((accumulator, repo) => {
    const language = repo.language || "Unknown";
    accumulator[language] = (accumulator[language] || 0) + 1;
    return accumulator;
  }, {});

  return Object.entries(breakdown)
    .map(([language, count]) => ({ language, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 8);
};

const buildGithubStats = (user, repos, totalStars, totalForks, languages) => ({
  overview: [
    {
      key: "repos",
      label: "Public repos",
      value: user.public_repos || 0,
      description: "Repositories visible on GitHub"
    },
    {
      key: "followers",
      label: "Followers",
      value: user.followers || 0,
      description: "People following the profile"
    },
    {
      key: "following",
      label: "Following",
      value: user.following || 0,
      description: "Accounts followed by this profile"
    },
    {
      key: "stars",
      label: "Stars",
      value: totalStars,
      description: "Stars across fetched repositories"
    },
    {
      key: "forks",
      label: "Forks",
      value: totalForks,
      description: "Forks across fetched repositories"
    },
    {
      key: "languages",
      label: "Languages",
      value: languages.length,
      description: "Unique languages used in repositories"
    }
  ],
  topRepos: mapTopRepos(repos),
  languageBreakdown: buildLanguageBreakdown(repos)
});

const fetchGithubProfile = async (profileLinkOrUsername) => {
  const username = extractGithubUsername(profileLinkOrUsername);
  const userUrl = `https://api.github.com/users/${encodeURIComponent(username)}`;
  const reposUrl = `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`;

  const [userResponse, reposResponse] = await Promise.all([
    axios.get(userUrl),
    axios.get(reposUrl).catch(() => ({ data: [] }))
  ]);

  const user = userResponse.data;
  const repos = Array.isArray(reposResponse.data) ? reposResponse.data : [];
  const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
  const totalForks = repos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0);
  const languages = [...new Set(repos.map((repo) => repo.language).filter(Boolean))];
  const stats = buildGithubStats(user, repos, totalStars, totalForks, languages);

  return {
    platform: "github",
    handle: user.login,
    profileUrl: user.html_url,
    avatar: user.avatar_url || "",
    titlePhoto: user.avatar_url || "",
    firstName: user.name || "",
    country: user.location || "",
    city: user.location || "",
    organization: user.company || "",
    contribution: totalStars,
    friendOfCount: user.followers || 0,
    registrationTimeSeconds: user.created_at ? Math.floor(new Date(user.created_at).getTime() / 1000) : 0,
    lastOnlineTimeSeconds: user.updated_at ? Math.floor(new Date(user.updated_at).getTime() / 1000) : 0,
    rating: totalStars,
    maxRating: totalForks,
    rank: user.type || "User",
    maxRank: languages[0] || "",
    rankBadge: {
      label: user.type || "GitHub User",
      tier: "github",
      color: "#60a5fa"
    },
    solvedCount: user.public_repos || 0,
    attemptedCount: user.following || 0,
    submissionsCount: user.public_gists || 0,
    contestsCount: user.followers || 0,
    stats,
    rawData: {
      user,
      repos,
      totalStars,
      totalForks,
      languages,
      topRepos: stats.topRepos,
      languageBreakdown: stats.languageBreakdown
    }
  };
};

module.exports = {
  extractGithubUsername,
  fetchGithubProfile
};
