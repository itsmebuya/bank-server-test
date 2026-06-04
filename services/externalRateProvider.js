const https = require("https");

const DEFAULT_API_BASE_URL = "https://open.er-api.com/v6/latest";

const requestJson = (url) => {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let body = "";

        res.on("data", (chunk) => {
          body += chunk;
        });

        res.on("end", () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`Exchange API returned status ${res.statusCode}`));
            return;
          }

          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(new Error("Exchange API returned invalid JSON"));
          }
        });
      })
      .on("error", reject);
  });
};

const fetchLatestRatesFromApi = async (base, targets) => {
  const apiBaseUrl = process.env.EXCHANGE_RATE_API_URL || DEFAULT_API_BASE_URL;
  const url = `${apiBaseUrl.replace(/\/$/, "")}/${encodeURIComponent(base)}`;
  const response = await requestJson(url);

  if (response.result && response.result !== "success") {
    throw new Error(`Exchange API sync failed for ${base}`);
  }

  if (!response.rates || typeof response.rates !== "object") {
    throw new Error(`Exchange API rates missing for ${base}`);
  }

  return targets.reduce((rates, target) => {
    const rate = Number(response.rates[target]);

    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error(`Exchange API rate missing for ${base}/${target}`);
    }

    rates[target] = rate;
    return rates;
  }, {});
};

module.exports = {
  fetchLatestRatesFromApi,
};
