const axios = require("axios");
const { getCodeforcesRankBadge } = require("./rankBadge.service");

const SUBMISSION_FETCH_LIMIT = Number(process.env.CODEFORCES_SUBMISSION_LIMIT) || 3000;
const RAW_SUBMISSION_SAMPLE_LIMIT = 100;

const createVerdictBreakdown = (submissions) =>
  submissions.reduce((breakdown, submission) => {
    const verdict = submission.verdict || "UNKNOWN";
    breakdown[verdict] = (breakdown[verdict] || 0) + 1;
    return breakdown;
  }, {});

const mapRecentSubmissions = (submissions) =>
  submissions.slice(0, 20).map((submission) => ({
    id: submission.id,
    contestId: submission.problem?.contestId || null,
    index: submission.problem?.index || "",
    name: submission.problem?.name || "Unknown problem",
    rating: submission.problem?.rating || 0,
    verdict: submission.verdict || "UNKNOWN",
    language: submission.programmingLanguage || "Unknown",
    createdAt: submission.creationTimeSeconds || 0,
    timeConsumedMillis: submission.timeConsumedMillis || 0,
    memoryConsumedBytes: submission.memoryConsumedBytes || 0
  }));

const mapRecentContests = (contests) =>
  contests.slice(-10).reverse().map((contest) => ({
    contestId: contest.contestId,
    contestName: contest.contestName,
    rank: contest.rank,
    ratingUpdateTimeSeconds: contest.ratingUpdateTimeSeconds || 0,
    oldRating: contest.oldRating || 0,
    newRating: contest.newRating || 0,
    delta: (contest.newRating || 0) - (contest.oldRating || 0)
  }));

const mapRatingGraph = (contests, fallbackRating) => {
  const points = contests
    .filter((contest) => contest.ratingUpdateTimeSeconds)
    .map((contest) => ({
      contestName: contest.contestName,
      rating: contest.newRating || fallbackRating || 0,
      oldRating: contest.oldRating || fallbackRating || 0,
      delta: (contest.newRating || 0) - (contest.oldRating || 0),
      time: contest.ratingUpdateTimeSeconds || 0
    }));

  if (!points.length && fallbackRating) {
    return [{ contestName: "Current", rating: fallbackRating, oldRating: fallbackRating, delta: 0, time: 0 }];
  }

  return points;
};

const createTagBreakdown = (submissions) =>
  submissions.reduce((breakdown, submission) => {
    if (submission.verdict !== "OK" || !Array.isArray(submission.problem?.tags)) {
      return breakdown;
    }

    submission.problem.tags.forEach((tag) => {
      breakdown[tag] = (breakdown[tag] || 0) + 1;
    });

    return breakdown;
  }, {});

const buildCodeforcesStats = (user, submissions, contests, solvedCount, attemptedCount) => {
  const verdictBreakdown = createVerdictBreakdown(submissions);
  const recentSubmissions = mapRecentSubmissions(submissions);
  const recentContests = mapRecentContests(contests);
  const ratingGraph = mapRatingGraph(contests, user.rating || 0);
  const problemTagsBreakdown = createTagBreakdown(submissions);

  return {
    overview: [
      {
        key: "rating",
        label: "Rating",
        value: user.rating || 0,
        description: "Current Codeforces rating"
      },
      {
        key: "maxRating",
        label: "Max rating",
        value: user.maxRating || 0,
        description: "Highest rating achieved"
      },
      {
        key: "solved",
        label: "Solved",
        value: solvedCount,
        description: "Unique problems solved"
      },
      {
        key: "attempted",
        label: "Attempted",
        value: attemptedCount,
        description: "Unique problems attempted"
      },
      {
        key: "contests",
        label: "Contests",
        value: contests.length,
        description: "Contest rating history entries"
      },
      {
        key: "submissions",
        label: "Submissions",
        value: submissions.length,
        description: "Fetched submission count"
      }
    ],
    verdictBreakdown,
    recentSubmissions,
    recentContests,
    ratingGraph,
    problemTagsBreakdown
  };
};

const fetchCodeforcesProfile = async (handle) => {
  const encodedHandle = encodeURIComponent(handle);
  const userInfoUrl = `https://codeforces.com/api/user.info?handles=${encodedHandle}`;
  const userStatusUrl = `https://codeforces.com/api/user.status?handle=${encodedHandle}&from=1&count=${SUBMISSION_FETCH_LIMIT}`;
  const userRatingUrl = `https://codeforces.com/api/user.rating?handle=${encodedHandle}`;

  const [userInfoResponse, userStatusResponse, userRatingResponse] = await Promise.all([
    axios.get(userInfoUrl, { timeout: 10000 }),
    axios.get(userStatusUrl, { timeout: 15000 }),
    axios.get(userRatingUrl, { timeout: 10000 }).catch(() => ({ data: { status: "FAILED", result: [] } }))
  ]);

  if (userInfoResponse.data.status !== "OK") {
    throw new Error("Failed to fetch Codeforces user info");
  }

  if (userStatusResponse.data.status !== "OK") {
    throw new Error("Failed to fetch Codeforces submissions");
  }

  const user = userInfoResponse.data.result[0];
  const submissions = userStatusResponse.data.result;
  const contests = userRatingResponse.data.status === "OK" ? userRatingResponse.data.result : [];

  const solvedSet = new Set();
  const attemptedSet = new Set();

  submissions.forEach((submission) => {
    if (submission.problem?.contestId && submission.problem?.index) {
      const problemKey = `${submission.problem.contestId}-${submission.problem.index}`;
      attemptedSet.add(problemKey);

      if (submission.verdict === "OK") {
        solvedSet.add(problemKey);
      }
    }
  });

  const rating = user.rating || 0;
  const rank = user.rank || "unrated";
  const stats = buildCodeforcesStats(
    user,
    submissions,
    contests,
    solvedSet.size,
    attemptedSet.size
  );

  return {
    platform: "codeforces",
    handle: user.handle,
    profileUrl: `https://codeforces.com/profile/${user.handle}`,
    avatar: user.avatar || "",
    titlePhoto: user.titlePhoto || "",
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    country: user.country || "",
    city: user.city || "",
    organization: user.organization || "",
    contribution: user.contribution || 0,
    friendOfCount: user.friendOfCount || 0,
    registrationTimeSeconds: user.registrationTimeSeconds || 0,
    lastOnlineTimeSeconds: user.lastOnlineTimeSeconds || 0,
    rating,
    maxRating: user.maxRating || 0,
    rank,
    maxRank: user.maxRank || "",
    rankBadge: getCodeforcesRankBadge(rating, rank),
    solvedCount: solvedSet.size,
    attemptedCount: attemptedSet.size,
    submissionsCount: submissions.length,
    contestsCount: contests.length,
    stats,
    rawData: {
      user,
      recentSubmissions: submissions.slice(0, RAW_SUBMISSION_SAMPLE_LIMIT),
      contests,
      verdictBreakdown: stats.verdictBreakdown,
      recentContests: stats.recentContests,
      ratingGraph: stats.ratingGraph,
      problemTagsBreakdown: stats.problemTagsBreakdown,
      submissionFetchLimit: SUBMISSION_FETCH_LIMIT,
      fetchedSubmissionsCount: submissions.length,
      isSubmissionLimited: submissions.length === SUBMISSION_FETCH_LIMIT
    }
  };
};

module.exports = {
  fetchCodeforcesProfile
};
