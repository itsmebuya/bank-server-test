const cron = require("node-cron");
const prisma = require("../config/prisma");
const {
  getLatestRateSyncedAt,
  isRateSyncStale,
  syncExchangeRates,
} = require("../services/currencyRateService");

const syncRatesIfStale = async () => {
  if (process.env.RATE_SYNC_ON_STARTUP === "false") {
    return;
  }

  try {
    const maxAgeHours = Number(process.env.RATE_SYNC_MAX_AGE_HOURS || 24);
    const latestSyncedAt = await getLatestRateSyncedAt(prisma);

    if (!isRateSyncStale(latestSyncedAt, maxAgeHours)) {
      return;
    }

    const result = await syncExchangeRates(prisma);
    console.log(
      `Startup exchange rate sync completed: ${result.pairsSynced} pairs`
    );
  } catch (error) {
    console.error(
      "Startup exchange rate sync failed. Existing rates will be used."
    );
    console.error(error.message);
  }
};

const startRateSyncJob = () => {
  const timezone = process.env.CRON_TIMEZONE || "Asia/Ulaanbaatar";

  syncRatesIfStale();

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
