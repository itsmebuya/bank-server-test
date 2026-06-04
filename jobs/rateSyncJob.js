const cron = require("node-cron");
const prisma = require("../config/prisma");
const { syncExchangeRates } = require("../services/currencyRateService");

const startRateSyncJob = () => {
  const timezone = process.env.CRON_TIMEZONE || "Asia/Ulaanbaatar";

  cron.schedule(
    "0 8 * * *",
    async () => {
      try {
        const result = await syncExchangeRates(prisma);
        console.log(
          `Daily exchange rate sync completed: ${result.pairsSynced} pairs`
        );
      } catch (error) {
        console.error(
          "Daily exchange rate sync failed. Existing rates will be used."
        );
        console.error(error.message);
      }
    },
    {
      timezone,
    }
  );
};

module.exports = {
  startRateSyncJob,
};
