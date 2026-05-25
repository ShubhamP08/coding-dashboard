const express = require("express");
const { connectProfile, getCodeforcesProfile } = require("../controllers/profile.controller");
const jwtAuth = require("../middleware/jwt.middleware");

const router = express.Router();

router.post("/codeforces", getCodeforcesProfile);
router.post("/connect", jwtAuth, connectProfile);

module.exports = router;
