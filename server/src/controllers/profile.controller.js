const CodingProfile = require("../models/CodingProfile");
const User = require("../models/User");
const { fetchCodeforcesProfile } = require("../services/codeforces.service");
const { fetchGithubProfile } = require("../services/github.service");
const { fetchLeetcodeProfile } = require("../services/leetcode.service");
const { extractCodeforcesHandle } = require("../services/profileNormalizer.service");


const isValidationError = (error) =>
  error.message.includes("required") || error.message.includes("Invalid");

const supportedPlatforms = ["github", "codeforces", "leetcode"];

const fetchProfileByPlatform = async (
  platform,
  profileLink
) => {
  switch (platform) {
    case "github":
      return fetchGithubProfile(profileLink);

    case "codeforces": {
      const codeforcesHandle =
        extractCodeforcesHandle(profileLink);

      return fetchCodeforcesProfile(
        codeforcesHandle
      );
    }

    case "leetcode":
      return fetchLeetcodeProfile(profileLink);

    default:
      throw new Error("Invalid platform");
  }
};

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

    if (!supportedPlatforms.includes(selectedPlatform)) {
      return res.status(400).json({
        message: "Supported platforms: GitHub, Codeforces, LeetCode"
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
        message: `${selectedPlatform} is already connected. Remove it before connecting another ${selectedPlatform} account.`
      });
    }

    const profileData = await fetchProfileByPlatform(selectedPlatform, profileLink);

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

const refreshProfile = async (req, res) => {
  try {
    const { profileId } = req.params;

    const user = await User.findById(req.user.id).populate("profiles");

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const existingProfile = user.profiles.find(
      (profile) => profile._id.toString() === profileId
    );

    if (!existingProfile) {
      return res.status(404).json({
        message: "Profile not connected to this account"
      });
    }

    if (!supportedPlatforms.includes(existingProfile.platform)) {
      return res.status(400).json({
        message: "Unsupported platform"
      });
    }

    const profileData = await fetchProfileByPlatform(
      existingProfile.platform,
      existingProfile.handle
    );

    const refreshedProfile = await CodingProfile.findByIdAndUpdate(
      existingProfile._id,
      profileData,
      {
        new: true
      }
    );

    const refreshedUser = await User.findById(req.user.id).populate("profiles");

    return res.status(200).json({
      message: "Profile refreshed successfully",
      data: refreshedProfile,
      profiles: refreshedUser?.profiles || []
    });
  } catch (error) {
    const statusCode = isValidationError(error) ? 400 : 500;

    return res.status(statusCode).json({
      message: "Failed to refresh profile",
      error: error.message
    });
  }
};

const refreshAllProfiles = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("profiles");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const results = await Promise.all(
      user.profiles.map(async (existingProfile) => {
        if (!supportedPlatforms.includes(existingProfile.platform)) {
          return existingProfile;
        }

        try {
          const profileData = await fetchProfileByPlatform(
            existingProfile.platform,
            existingProfile.handle
          );

          const refreshed = await CodingProfile.findByIdAndUpdate(
            existingProfile._id,
            profileData,
            { new: true }
          );

          return refreshed || existingProfile;
        } catch (err) {
          return existingProfile;
        }
      })
    );

    const refreshedUser = await User.findById(req.user.id).populate("profiles");

    return res.status(200).json({
      message: "All profiles refreshed",
      profiles: refreshedUser?.profiles || []
    });
  } catch (error) {
    const statusCode = isValidationError(error) ? 400 : 500;

    return res.status(statusCode).json({
      message: "Failed to refresh profiles",
      error: error.message
    });
  }
};

module.exports = {
  getCodeforcesProfile,
  connectProfile,
  getMyProfiles,
  removeProfile,
  refreshProfile
  ,
  refreshAllProfiles
};
