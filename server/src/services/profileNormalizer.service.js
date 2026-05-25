const extractCodeforcesHandle = (profileLinkOrHandle) => {
  if (!profileLinkOrHandle || typeof profileLinkOrHandle !== "string") {
    throw new Error("Codeforces profile link or handle is required");
  }

  const value = profileLinkOrHandle.trim();

  if (!value) {
    throw new Error("Codeforces profile link or handle is required");
  }

  if (!value.includes("codeforces.com")) {
    return value;
  }

  try {
    const url = new URL(value);
    const parts = url.pathname.split("/").filter(Boolean);
    const profileIndex = parts.findIndex((part) => part.toLowerCase() === "profile");

    if (profileIndex === -1 || !parts[profileIndex + 1]) {
      throw new Error("Invalid Codeforces profile link");
    }

    return decodeURIComponent(parts[profileIndex + 1]);
  } catch (error) {
    throw new Error("Invalid Codeforces profile link");
  }
};

module.exports = {
  extractCodeforcesHandle
};
