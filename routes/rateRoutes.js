const express = require("express");
const { getRates } = require("../controllers/rateController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/", authMiddleware, adminMiddleware, getRates);

module.exports = router;
