const { fetchLatestRatesFromApi } = require("./externalRateProvider");

const SUPPORTED_CURRENCIES = ["MNT", "USD", "EUR", "CNY", "JPY"];
const EXTERNAL_RATE_SOURCE = "EXTERNAL_API";
const SAME_CURRENCY_RATE_SOURCE = "SAME_CURRENCY";

const normalizeCurrency = (currency) => {
  return typeof currency === "string" ? currency.trim().toUpperCase() : "";
};

const roundMoney = (value) => {
  return Number(value.toFixed(2));
};

const buildCurrencyPairs = () => {
  const pairs = [];

  SUPPORTED_CURRENCIES.forEach((base) => {
    SUPPORTED_CURRENCIES.forEach((target) => {
      if (base !== target) {
        pairs.push({ base, target });
      }
    });
  });

  return pairs;
};

const syncExchangeRates = async (prisma) => {
  const rows = [];

  for (const base of SUPPORTED_CURRENCIES) {
    const targets = SUPPORTED_CURRENCIES.filter((currency) => currency !== base);
    const rates = await fetchLatestRatesFromApi(base, targets);

    targets.forEach((target) => {
      rows.push({
        base,
        target,
        rate: rates[target],
        source: EXTERNAL_RATE_SOURCE,
      });
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.currencyRate.createMany({
      data: rows,
    });
  });

  return {
    source: EXTERNAL_RATE_SOURCE,
    currencies: SUPPORTED_CURRENCIES,
    pairsSynced: rows.length,
  };
};

const getLatestCurrencyRate = async (prisma, baseCurrency, targetCurrency) => {
  const base = normalizeCurrency(baseCurrency);
  const target = normalizeCurrency(targetCurrency);

  if (!base || !target) {
    const error = new Error("Валют шаардлагатай");
    error.statusCode = 400;
    throw error;
  }

  if (base === target) {
    return {
      base,
      target,
      rate: 1,
      source: SAME_CURRENCY_RATE_SOURCE,
      createdAt: null,
    };
  }

  const currencyRate = await prisma.currencyRate.findFirst({
    where: {
      base,
      target,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!currencyRate) {
    const error = new Error(`${base}-с ${target} рүү хөрвүүлэх ханш олдсонгүй`);
    error.statusCode = 400;
    throw error;
  }

  return currencyRate;
};

const convertAmount = (amount, rate) => {
  return roundMoney(amount * rate);
};

const getCurrentRates = async (prisma) => {
  const rates = await prisma.currencyRate.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
  const latestByPair = new Map();

  rates.forEach((rate) => {
    const key = `${rate.base}:${rate.target}`;

    if (!latestByPair.has(key)) {
      latestByPair.set(key, rate);
    }
  });

  return Array.from(latestByPair.values()).sort((a, b) => {
    if (a.base === b.base) {
      return a.target.localeCompare(b.target);
    }

    return a.base.localeCompare(b.base);
  });
};

module.exports = {
  SUPPORTED_CURRENCIES,
  EXTERNAL_RATE_SOURCE,
  buildCurrencyPairs,
  convertAmount,
  getCurrentRates,
  getLatestCurrencyRate,
  normalizeCurrency,
  syncExchangeRates,
};
