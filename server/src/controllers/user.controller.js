const User = require("../models/User");
const CodingProfile = require("../models/CodingProfile");
const bcrypt = require("bcryptjs");
const { fetchLeetcodeProfile } = require("../services/leetcode.service");

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const formatUser = (user) => ({
  id: user._id,
  email: user.email
});

const buildMissingStats = (profile) => {
  if (profile.stats && Object.keys(profile.stats).length > 0) {
    return profile;
  }

  if (!profile.rawData || !profile.rawData.repos) {
    return profile;
  }

  const repos = profile.rawData.repos || [];
  const topRepos = [...repos]
    .sort((left, right) => {
      const starDiff = (right.stargazers_count || 0) - (left.stargazers_count || 0);
      if (starDiff !== 0) return starDiff;
      const forkDiff = (right.forks_count || 0) - (left.forks_count || 0);
      return forkDiff !== 0 ? forkDiff : new Date(right.updated_at || 0) - new Date(left.updated_at || 0);
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

  const languageBreakdown = Object.entries(
    repos.reduce((acc, repo) => {
      const lang = repo.language || "Unknown";
      acc[lang] = (acc[lang] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  profile.stats = {
    topRepos,
    languageBreakdown,
    overview: profile.stats?.overview || []
  };

  return profile;
};

const shouldRefreshLeetcodeStats = (profile) => {
  if (profile.platform !== "leetcode") return false;

  const easySolved = profile.stats?.easySolved || profile.rawData?.easySolved || 0;
  const mediumSolved = profile.stats?.mediumSolved || profile.rawData?.mediumSolved || 0;
  const hardSolved = profile.stats?.hardSolved || profile.rawData?.hardSolved || 0;

  return (profile.solvedCount || 0) === 0 && easySolved === 0 && mediumSolved === 0 && hardSolved === 0;
};

const refreshStaleLeetcodeProfile = async (profile) => {
  if (!shouldRefreshLeetcodeStats(profile)) {
    return profile;
  }

  try {
    const profileData = await fetchLeetcodeProfile(profile.handle);

    return CodingProfile.findByIdAndUpdate(profile._id, profileData, {
      new: true
    });
  } catch {
    return profile;
  }
};

const register = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, password and confirm password are required"
      });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Provide a valid email"
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and confirm password do not match"
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered"
      });
    }

    const user = await User.create({
      email: normalizedEmail,
      password
    });

    const token = user.generateToken();

    return res.status(201).json({
      success: true,
      message: "Registered successfully",
      token,
      user: formatUser(user)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login request received:", { email, password }); // Debugging log
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const token = user.generateToken();

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: formatUser(user)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message
    });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("profiles");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const profilesWithStats = await Promise.all(
      user.profiles.map(async (profile) => {
        if (profile.platform === "github") {
          return buildMissingStats(profile);
        }

        if (profile.platform === "leetcode") {
          return refreshStaleLeetcodeProfile(profile);
        }

        return profile;
      })
    );

    return res.status(200).json({
      success: true,
      user: {
        ...formatUser(user),
        profiles: profilesWithStats
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch current user",
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  getMe
};
