const express = require("express");
const {
  connectProfile,
  getCodeforcesProfile,
  getMyProfiles,
  refreshProfile,
  removeProfile,
  refreshAllProfiles
} = require("../controllers/profile.controller");
const jwtAuth = require("../middleware/jwt.middleware");

const router = express.Router();

router.post("/codeforces", getCodeforcesProfile);
router.get("/me", jwtAuth, getMyProfiles);
router.post("/connect", jwtAuth, connectProfile);
router.put("/:profileId/refresh", jwtAuth, refreshProfile);
router.delete("/:profileId", jwtAuth, removeProfile);

module.exports = router;
