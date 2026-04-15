const axios = require("axios");

const fetchCodeforcesProfile = async (handle) => {
  const userInfoUrl = `https://codeforces.com/api/user.info?handles=${handle}`;
  const userStatusUrl = `https://codeforces.com/api/user.status?handle=${handle}`;

  const [userInfoResponse, userStatusResponse] = await Promise.all([
    axios.get(userInfoUrl),
    axios.get(userStatusUrl)
  ]);

  if (userInfoResponse.data.status !== "OK") {
    throw new Error("Failed to fetch Codeforces user info");
  }

  if (userStatusResponse.data.status !== "OK") {
    throw new Error("Failed to fetch Codeforces submissions");
  }

  const user = userInfoResponse.data.result[0];
  const submissions = userStatusResponse.data.result;

  const solvedSet = new Set();

  submissions.forEach((submission) => {
    if (submission.verdict === "OK" && submission.problem?.contestId && submission.problem?.index) {
      solvedSet.add(`${submission.problem.contestId}-${submission.problem.index}`);
    }
  });

  return {
    platform: "codeforces",
    handle: user.handle,
    profileUrl: `https://codeforces.com/profile/${user.handle}`,
    rating: user.rating || 0,
    maxRating: user.maxRating || 0,
    rank: user.rank || "",
    maxRank: user.maxRank || "",
    solvedCount: solvedSet.size,
    contestsCount: 0,
    rawData: {
      user,
      submissions
    }
  };
};

module.exports = {
  fetchCodeforcesProfile
};
