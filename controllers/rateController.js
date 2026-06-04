const prisma = require("../config/prisma");
const { getCurrentRates } = require("../services/currencyRateService");

const getRates = async (req, res) => {
  try {
    const rates = await getCurrentRates(prisma);

    return res.json({ rates });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Серверийн алдаа гарлаа" });
  }
};

module.exports = {
  getRates,
};
