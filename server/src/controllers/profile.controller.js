const CodingProfile = require("../models/CodingProfile");
const User = require("../models/User");
const { fetchCodeforcesProfile } = require("../services/codeforces.service");
const { extractCodeforcesHandle } = require("../services/profileNormalizer.service");

const isValidationError = (error) =>
  error.message.includes("required") || error.message.includes("Invalid");

const getCodeforcesProfile = async (req, res) => {
  try {
    const { handle, codeforcesProfileLink } = req.body;

    const codeforcesHandle = extractCodeforcesHandle(codeforcesProfileLink || handle);

    const profileData = await fetchCodeforcesProfile(codeforcesHandle);

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
    const statusCode = isValidationError(error) ? 400 : 500;

    res.status(statusCode).json({
      message: "Failed to fetch Codeforces profile",
      error: error.message
    });
  }
};

const connectProfile = async (req, res) => {
  try {
    const { platform, profileLink } = req.body;
    const selectedPlatform = platform?.trim().toLowerCase();

    if (!selectedPlatform || !profileLink) {
      return res.status(400).json({
        message: "Platform and profile link are required"
      });
    }

    if (selectedPlatform !== "codeforces") {
      return res.status(400).json({
        message: "Only Codeforces connection is available right now"
      });
    }

    const codeforcesHandle = extractCodeforcesHandle(profileLink);
    const profileData = await fetchCodeforcesProfile(codeforcesHandle);

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

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $addToSet: {
          profiles: savedProfile._id
        }
      },
      { new: true }
    ).populate("profiles");

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    return res.status(200).json({
      message: "Profile connected successfully",
      data: savedProfile,
      profiles: user.profiles
    });
  } catch (error) {
    const statusCode = isValidationError(error) ? 400 : 500;

    return res.status(statusCode).json({
      message: "Failed to connect profile",
      error: error.message
    });
  }
};

module.exports = {
  getCodeforcesProfile,
  connectProfile
};
