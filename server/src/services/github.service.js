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
    rawData: {
      user,
      repos,
      totalStars,
      totalForks,
      languages
    }
  };
};

module.exports = {
  extractGithubUsername,
  fetchGithubProfile
};
