const CodingProfile = require("../models/CodingProfile");
const { fetchCodeforcesProfile } = require("../services/codeforces.service");

const getCodeforcesProfile = async (req, res) => {
  try {
    const { handle } = req.body;

    if (!handle) {
      return res.status(400).json({ message: "Codeforces handle is required" });
    }

    const profileData = await fetchCodeforcesProfile(handle);

    const savedProfile = await CodingProfile.findOneAndUpdate(
      {
        platform: "codeforces",
        handle: profileData.handle
      },
      profileData,
      {
        new: true,
        upsert: true
      }
    );

    res.status(200).json({
      message: "Codeforces profile fetched successfully",
      data: savedProfile
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch Codeforces profile",
      error: error.message
    });
  }
};

module.exports = {
  getCodeforcesProfile
};
