const express = require("express");
const { getMe, login, register } = require("../controllers/user.controller");
const jwtAuth = require("../middleware/jwt.middleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", jwtAuth, getMe);

module.exports = router;
