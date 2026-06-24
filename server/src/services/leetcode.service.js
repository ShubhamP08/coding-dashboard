const axios = require("axios");

const LEETCODE_API =
  process.env.LEETCODE_API_URL || "http://localhost:3000";

const extractUsername = (profileLink) => {
  if (!profileLink || typeof profileLink !== "string") {
    throw new Error("LeetCode profile link or username is required");
  }

  const value = profileLink.trim();

  if (!value) {
    throw new Error("LeetCode profile link or username is required");
  }

  if (!value.includes("leetcode.com")) {
    return value.replaceAll("/", "");
  }

  try {
    const url = new URL(value);
    const parts = url.pathname.split("/").filter(Boolean);

    if (parts[0] === "u" && parts[1]) return decodeURIComponent(parts[1]);
    if (parts[0]) return decodeURIComponent(parts[0]);
  } catch {
    throw new Error("Invalid LeetCode profile link");
  }

  throw new Error("Invalid LeetCode profile link");
};

const getSettledData = (result, fallback) =>
  result.status === "fulfilled" ? result.value.data : fallback;

const getSubmissionList = (submissions) => {
  if (Array.isArray(submissions)) return submissions;
  if (Array.isArray(submissions.submission)) return submissions.submission;
  if (Array.isArray(submissions.recentSubmissions)) return submissions.recentSubmissions;
  return [];
};

const getDifficultyCount = (entries, difficulty) => {
  if (!Array.isArray(entries)) return 0;

  const item = entries.find(
    (entry) => entry.difficulty?.toLowerCase() === difficulty.toLowerCase()
  );

  return item?.count || 0;
};

const countCalendarActiveDays = (submissionCalendar) => {
  if (!submissionCalendar) return 0;

  let calendar = submissionCalendar;

  if (typeof submissionCalendar === "string") {
    try {
      calendar = JSON.parse(submissionCalendar || "{}");
    } catch {
      return 0;
    }
  }

  return Object.values(calendar).filter((count) => Number(count) > 0).length;
};

const fetchLeetcodeProfile = async (profileLink) => {
  const username = extractUsername(profileLink);

  const [
    profileRes,
    fullProfileRes,
    solvedRes,
    contestRes,
    submissionRes,
    calendarRes,
    languageRes,
    skillRes
  ] = await Promise.allSettled([
    axios.get(`${LEETCODE_API}/${username}`),
    axios.get(`${LEETCODE_API}/${username}/profile`),
    axios.get(`${LEETCODE_API}/${username}/solved`),
    axios.get(`${LEETCODE_API}/${username}/contest`),
    axios.get(`${LEETCODE_API}/${username}/submission`),
    axios.get(`${LEETCODE_API}/${username}/calendar`),
    axios.get(`${LEETCODE_API}/${username}/language`),
    axios.get(`${LEETCODE_API}/${username}/skill`)
  ]);

  if (profileRes.status === "rejected") {
    throw new Error("Could not fetch LeetCode profile");
  }

  const profile = getSettledData(profileRes, {});
  const fullProfile = getSettledData(fullProfileRes, {});
  const solved = getSettledData(solvedRes, {});
  const contest = getSettledData(contestRes, {});
  const submissions = getSettledData(submissionRes, {});
  const calendar = getSettledData(calendarRes, {});
  const languages = getSettledData(languageRes, {});
  const skills = getSettledData(skillRes, {});

  const acceptedStats = solved.acSubmissionNum || fullProfile.matchedUserStats?.acSubmissionNum;
  const totalStats = solved.totalSubmissionNum || fullProfile.totalSubmissions;
  const recentSubmissions = getSubmissionList(
    submissions.submission || submissions.recentSubmissions ? submissions : fullProfile.recentSubmissions || submissions
  );
  const totalSolved =
    solved.solvedProblem ||
    solved.totalSolved ||
    fullProfile.totalSolved ||
    getDifficultyCount(acceptedStats, "All") ||
    0;
  const easySolved =
    solved.easySolved ||
    fullProfile.easySolved ||
    getDifficultyCount(acceptedStats, "Easy") ||
    0;
  const mediumSolved =
    solved.mediumSolved ||
    fullProfile.mediumSolved ||
    getDifficultyCount(acceptedStats, "Medium") ||
    0;
  const hardSolved =
    solved.hardSolved ||
    fullProfile.hardSolved ||
    getDifficultyCount(acceptedStats, "Hard") ||
    0;
  const contestRating = contest.contestRating || contest.rating || 0;
  const contestRanking =
    contest.contestGlobalRanking || contest.globalRanking || contest.ranking || 0;
  const attendedContests =
    contest.attendedContestsCount || contest.contestAttend || contest.contestsCount || 0;
  const submissionCalendar =
    calendar.submissionCalendar || fullProfile.submissionCalendar || calendar;
  const activeDays = countCalendarActiveDays(submissionCalendar);
  const totalSubmitted = getDifficultyCount(totalStats, "All");

  return {
    platform: "leetcode",
    handle: username,
    avatar: profile.avatar || profile.userAvatar || "",
    firstName: profile.name || profile.realName || "",
    profileUrl: `https://leetcode.com/u/${username}/`,
    rating: Math.round(contestRating) || 0,
    rank: profile.ranking || fullProfile.ranking ? String(profile.ranking || fullProfile.ranking) : "",
    solvedCount: totalSolved,
    attemptedCount: totalSubmitted || solved.totalQuestions || fullProfile.totalQuestions || 0,
    submissionsCount: totalSubmitted || recentSubmissions.length,
    contestsCount: attendedContests,
    stats: {
      easySolved,
      mediumSolved,
      hardSolved,
      totalSolved,
      totalQuestions: fullProfile.totalQuestions || solved.totalQuestions || 0,
      contestRating,
      contestRanking,
      attendedContests,
      acceptanceRate: solved.acceptanceRate || solved.acceptance_rate || 0,
      activeDays,
      recentSubmissions,
      languages,
      skills,
      overview: [
        { key: "solved", label: "Total solved", value: totalSolved, description: "Accepted LeetCode problems" },
        { key: "easy", label: "Easy solved", value: easySolved, description: "Introductory problems completed" },
        { key: "medium", label: "Medium solved", value: mediumSolved, description: "Core practice problems completed" },
        { key: "hard", label: "Hard solved", value: hardSolved, description: "High-difficulty problems completed" },
        { key: "rating", label: "Contest rating", value: Math.round(contestRating) || "N/A", description: "Latest contest rating" },
        { key: "ranking", label: "Global ranking", value: profile.ranking || fullProfile.ranking || "N/A", description: "LeetCode profile ranking" }
      ]
    },

    rawData: {
      ranking: profile.ranking || fullProfile.ranking,
      reputation: profile.reputation || fullProfile.reputation,
      contributionPoints: profile.contributionPoint || fullProfile.contributionPoint,
      easySolved,
      mediumSolved,
      hardSolved,
      totalSolved,
      totalSubmitted,
      contestRating,
      contestRanking,
      attendedContests,
      submissionCalendar,
      streak: calendar.streak || 0,
      activeDays,
      recentSubmissions,
      languages,
      skills
    }
  };
};

module.exports = {
  fetchLeetcodeProfile
};
