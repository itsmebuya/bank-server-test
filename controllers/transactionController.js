const prisma = require("../config/prisma");
const {
  convertAmount,
  getLatestCurrencyRate,
  normalizeCurrency,
} = require("../services/currencyRateService");

const validateTransaction = (data) => {
  const senderAccount =
    typeof data.senderAccount === "string" ? data.senderAccount.trim() : "";
  const receiverAccount =
    typeof data.receiverAccount === "string"
      ? data.receiverAccount.trim()
      : "";
  const currency = normalizeCurrency(data.currency);
  const description =
    typeof data.description === "string" ? data.description.trim() : "";
  const amount = Number(data.amount);

  if (!senderAccount) {
    return { message: "Илгээгчийн данс шаардлагатай" };
  }

  if (!receiverAccount) {
    return { message: "Хүлээн авагчийн данс шаардлагатай" };
  }

  if (senderAccount === receiverAccount) {
    return {
      message: "Илгээгч болон хүлээн авагчийн данс ижил байж болохгүй",
    };
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return { message: "Дүн 0-ээс их байх ёстой" };
  }

  if (!currency) {
    return { message: "Валют шаардлагатай" };
  }

  if (!description) {
    return { message: "Гүйлгээний утга шаардлагатай" };
  }

  return {
    data: {
      senderAccount,
      receiverAccount,
      amount,
      currency,
      description,
    },
  };
};

const createTransaction = async (req, res) => {
  try {
    const validation = validateTransaction(req.body);

    if (validation.message) {
      return res.status(400).json({ message: validation.message });
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const senderAccount = await tx.account.findUnique({
        where: { accountNumber: validation.data.senderAccount },
      });

      if (!senderAccount || senderAccount.userId !== req.user.id) {
        const error = new Error("Дансны дугаар олдсонгүй");
        error.statusCode = 404;
        throw error;
      }

      const receiverAccount = await tx.account.findUnique({
        where: { accountNumber: validation.data.receiverAccount },
      });

      if (!receiverAccount) {
        const error = new Error("Дансны дугаар олдсонгүй");
        error.statusCode = 404;
        throw error;
      }

      if (senderAccount.currency !== validation.data.currency) {
        const error = new Error("Илгээгчийн дансны валют таарахгүй байна");
        error.statusCode = 400;
        throw error;
      }

      const currencyRate = await getLatestCurrencyRate(
        tx,
        senderAccount.currency,
        receiverAccount.currency
      );
      const convertedAmount = convertAmount(
        validation.data.amount,
        currencyRate.rate
      );

      const senderUpdate = await tx.account.updateMany({
        where: {
          id: senderAccount.id,
          amount: { gte: validation.data.amount },
        },
        data: {
          amount: { decrement: validation.data.amount },
        },
      });

      if (senderUpdate.count === 0) {
        const error = new Error("Дансны үлдэгдэл хүрэлцэхгүй байна");
        error.statusCode = 400;
        throw error;
      }

      await tx.account.update({
        where: { id: receiverAccount.id },
        data: {
          amount: { increment: convertedAmount },
        },
      });

      const senderTransaction = await tx.transaction.create({
        data: {
          senderAccount: validation.data.senderAccount,
          receiverAccount: validation.data.receiverAccount,
          amount: validation.data.amount,
          currency: senderAccount.currency,
          type: "expenses",
          exchangeRate: currencyRate.rate,
          convertedAmount,
          convertedCurrency: receiverAccount.currency,
          rateSource: currencyRate.source,
          description: validation.data.description,
          userId: req.user.id,
        },
      });

      const receiverTransaction = await tx.transaction.create({
        data: {
          senderAccount: validation.data.senderAccount,
          receiverAccount: validation.data.receiverAccount,
          amount: convertedAmount,
          currency: receiverAccount.currency,
          type: "income",
          exchangeRate: currencyRate.rate,
          convertedAmount: validation.data.amount,
          convertedCurrency: senderAccount.currency,
          rateSource: currencyRate.source,
          description: validation.data.description,
          userId: receiverAccount.userId,
        },
      });

      return {
        senderTransaction,
        receiverTransaction,
      };
    });

    return res.status(201).json({
      message: "Гүйлгээ амжилттай хийгдлээ",
      transaction: transaction.senderTransaction,
      transactions: [
        transaction.senderTransaction,
        transaction.receiverTransaction,
      ],
    });
  } catch (error) {
    console.error(error);
    return res
      .status(error.statusCode || 500)
      .json({
        message: error.statusCode ? error.message : "Серверийн алдаа гарлаа",
      });
  }
};

const getTransactions = async (req, res) => {
  try {
    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";
    const where = {
      userId: req.user.id,
    };

    if (search) {
      where.AND = [
        {
          OR: [
            { senderAccount: { contains: search, mode: "insensitive" } },
            { receiverAccount: { contains: search, mode: "insensitive" } },
            { currency: { contains: search, mode: "insensitive" } },
            { convertedCurrency: { contains: search, mode: "insensitive" } },
            { rateSource: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return res.json({ transactions });
  } catch (error) {
    console.error(error);
    return res
      .status(error.statusCode || 500)
      .json({
        message: error.statusCode ? error.message : "Серверийн алдаа гарлаа",
      });
  }
};

module.exports = {
  createTransaction,
  getTransactions,
};
