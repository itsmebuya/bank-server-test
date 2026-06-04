const prisma = require("../config/prisma");
const { normalizeCurrency } = require("../services/currencyRateService");

const generateAccountNumber = () => {
  return String(Math.floor(10000000 + Math.random() * 90000000));
};

const createAccount = async (req, res) => {
  try {
    const currency = normalizeCurrency(req.body.currency);
    const amount =
      req.body.amount === undefined || req.body.amount === ""
        ? 0
        : Number(req.body.amount);

    if (!currency) {
      return res.status(400).json({ message: "Валют шаардлагатай" });
    }

    if (!Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({ message: "Дансны эхний үлдэгдэл сөрөг байж болохгүй" });
    }

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const accountNumber = generateAccountNumber();

      try {
        const account = await prisma.account.create({
          data: {
            accountNumber,
            currency,
            amount,
            userId: req.user.id,
          },
        });

        return res.status(201).json({
          message: "Данс амжилттай үүслээ",
          account,
        });
      } catch (error) {
        if (error.code !== "P2002") {
          throw error;
        }
      }
    }

    return res.status(500).json({ message: "Дансны дугаар үүсгэх боломжгүй байна" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Серверийн алдаа гарлаа" });
  }
};

const getAccounts = async (req, res) => {
  try {
    const accounts = await prisma.account.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ accounts });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Серверийн алдаа гарлаа" });
  }
};

module.exports = {
  createAccount,
  getAccounts,
};
