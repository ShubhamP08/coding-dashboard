const axios = require("axios");
const { getCodeforcesRankBadge } = require("./rankBadge.service");

const fetchCodeforcesProfile = async (handle) => {
  const encodedHandle = encodeURIComponent(handle);
  const userInfoUrl = `https://codeforces.com/api/user.info?handles=${encodedHandle}`;
  const userStatusUrl = `https://codeforces.com/api/user.status?handle=${encodedHandle}`;
  const userRatingUrl = `https://codeforces.com/api/user.rating?handle=${encodedHandle}`;

  const [userInfoResponse, userStatusResponse, userRatingResponse] = await Promise.all([
    axios.get(userInfoUrl),
    axios.get(userStatusUrl),
    axios.get(userRatingUrl).catch(() => ({ data: { status: "FAILED", result: [] } }))
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
    rawData: {
      user,
      submissions,
      contests
    }
  };
};

module.exports = {
  fetchCodeforcesProfile
};
