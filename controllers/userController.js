const prisma = require("../config/prisma");

const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        accounts: {
          select: {
            id: true,
            accountNumber: true,
            currency: true,
            amount: true,
            accountType: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            accounts: true,
            transactions: true,
          },
        },
      },
    });

    return res.json({ users });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Серверийн алдаа гарлаа" });
  }
};

module.exports = {
  getUsers,
};
