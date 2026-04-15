const express = require("express");
const { getCodeforcesProfile } = require("../controllers/profile.controller");

const router = express.Router();

router.post("/codeforces", getCodeforcesProfile);

module.exports = router;
