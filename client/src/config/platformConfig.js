import { BarChart3, Code2, Globe2, Trophy } from "lucide-react";
import GithubDetail from "../components/GithubDetail";
import CodeforcesDetail from "../components/CodeforcesDetail";
import LeetcodeDetail from "../components/LeetcodeDetail";

/**
 * Platform-specific configuration for seamless platform addition
 * To add a new platform:
 * 1. Create a new component file (e.g., LeetcodeDetail.jsx)
 * 2. Add it to PLATFORM_CONFIG below
 * 3. No changes needed elsewhere!
 */

const PLATFORM_CONFIG = {
  github: {
    label: "GitHub",
    icon: Code2,
    component: GithubDetail,
    defaultStats: [
      { key: "repos", label: "Public repos" },
      { key: "followers", label: "Followers" },
      { key: "stars", label: "Stars" },
      { key: "forks", label: "Forks" }
    ]
  },
  codeforces: {
    label: "Codeforces",
    icon: Trophy,
    component: CodeforcesDetail,
    defaultStats: [
      { key: "current-rating", label: "Current Rating" },
      { key: "max-rating", label: "Max Rating" },
      { key: "global-rank", label: "Global Rank" },
      { key: "contest-count", label: "Contest Count" },
      { key: "problems-solved", label: "Problems Solved" }
    ]
  },
  leetcode: {
    label: "LeetCode",
    icon: BarChart3,
    component: LeetcodeDetail,
    defaultStats: [
      { key: "solved", label: "Solved" },
      { key: "rating", label: "Contest Rating" },
      { key: "streak", label: "Streak" },
      { key: "acceptance", label: "Acceptance" }
    ]
  },
  gfg: {
    label: "GeeksforGeeks",
    icon: Globe2,
    component: null, // To be implemented
    defaultStats: []
  }
};

export const getPlatformConfig = (platform) => {
  return PLATFORM_CONFIG[platform] || {
    label: platform,
    icon: Globe2,
    component: null,
    defaultStats: []
  };
};

export const getPlatformLabel = (platform) => {
  return getPlatformConfig(platform).label;
};

export const getPlatformIcon = (platform) => {
  return getPlatformConfig(platform).icon;
};

export const getPlatformComponent = (platform) => {
  return getPlatformConfig(platform).component;
};

export const getKnownPlatforms = () => {
  return Object.keys(PLATFORM_CONFIG);
};

export default PLATFORM_CONFIG;
