const express = require("express");
const { getRates, syncRates } = require("../controllers/rateController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/", authMiddleware, adminMiddleware, getRates);
router.post("/sync", authMiddleware, adminMiddleware, syncRates);

module.exports = router;
