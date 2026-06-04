const prisma = require("../config/prisma");
const {
  getCurrentRates,
  syncExchangeRates,
} = require("../services/currencyRateService");

const getRates = async (req, res) => {
  try {
    const rates = await getCurrentRates(prisma);

    return res.json({ rates });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Серверийн алдаа гарлаа" });
  }
};

const syncRates = async (req, res) => {
  try {
    const result = await syncExchangeRates(prisma);
    const rates = await getCurrentRates(prisma);

    return res.json({
      message: "Ханш амжилттай шинэчлэгдлээ",
      result,
      rates,
    });
  } catch (error) {
    console.error(error);
    return res.status(502).json({
      message: "Ханш татахад алдаа гарлаа. Өмнөх ханш хэвээр ашиглагдана",
      error: error.message,
    });
  }
};

module.exports = {
  getRates,
  syncRates,
};
