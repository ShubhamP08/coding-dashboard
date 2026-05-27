const CodingProfile = require("../models/CodingProfile");
const User = require("../models/User");
const { fetchCodeforcesProfile } = require("../services/codeforces.service");
const { fetchGithubProfile } = require("../services/github.service");
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

    if (selectedPlatform !== "github") {
      return res.status(400).json({
        message: "GitHub profile is required right now"
      });
    }

    const currentUser = await User.findById(req.user.id).populate("profiles");

    if (!currentUser) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const alreadyConnected = currentUser.profiles.some(
      (profile) => profile.platform === selectedPlatform
    );

    if (alreadyConnected) {
      return res.status(409).json({
        message: "GitHub is already connected. Remove it before connecting another GitHub account."
      });
    }

    const profileData = await fetchGithubProfile(profileLink);

    const savedProfile = await CodingProfile.findOneAndUpdate(
      {
        platform: profileData.platform,
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

const getMyProfiles = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("profiles");

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    return res.status(200).json({
      message: "Profiles fetched successfully",
      data: user.profiles
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch profiles",
      error: error.message
    });
  }
};

const removeProfile = async (req, res) => {
  try {
    const { profileId } = req.params;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $pull: {
          profiles: profileId
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
      message: "Profile removed successfully",
      data: user.profiles
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to remove profile",
      error: error.message
    });
  }
};

module.exports = {
  getCodeforcesProfile,
  connectProfile,
  getMyProfiles,
  removeProfile
};
