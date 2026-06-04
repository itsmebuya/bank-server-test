require("dotenv").config();

const prisma = require("../config/prisma");
const { syncExchangeRates } = require("../services/currencyRateService");

const run = async () => {
  try {
    const result = await syncExchangeRates(prisma);
    console.log(
      `Exchange rates synced: ${result.pairsSynced} pairs from ${result.source}`
    );
  } catch (error) {
    console.error("Exchange rate sync failed. Existing rates were not changed.");
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
};

if (require.main === module) {
  run();
}

module.exports = {
  run,
};
