const getCodeforcesRankBadge = (rating = 0, rank = "") => {
  const normalizedRank = rank || "unrated";

  if (rating >= 3000) {
    return { label: "Legendary Grandmaster", tier: "legendary-grandmaster", color: "#ff0000" };
  }

  if (rating >= 2600) {
    return { label: "International Grandmaster", tier: "international-grandmaster", color: "#ff3333" };
  }

  if (rating >= 2400) {
    return { label: "Grandmaster", tier: "grandmaster", color: "#ff7777" };
  }

  if (rating >= 2300) {
    return { label: "International Master", tier: "international-master", color: "#ff8c00" };
  }

  if (rating >= 2100) {
    return { label: "Master", tier: "master", color: "#ffcc00" };
  }

  if (rating >= 1900) {
    return { label: "Candidate Master", tier: "candidate-master", color: "#aa00aa" };
  }

  if (rating >= 1600) {
    return { label: "Expert", tier: "expert", color: "#0000ff" };
  }

  if (rating >= 1400) {
    return { label: "Specialist", tier: "specialist", color: "#03a89e" };
  }

  if (rating >= 1200) {
    return { label: "Pupil", tier: "pupil", color: "#008000" };
  }

  if (rating > 0) {
    return { label: "Newbie", tier: "newbie", color: "#808080" };
  }

  return { label: normalizedRank, tier: "unrated", color: "#6b7280" };
};

module.exports = {
  getCodeforcesRankBadge
};
