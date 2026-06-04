const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

const createToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

const register = async (req, res) => {
  try {
    const { username, password } = req.body;
    const trimmedUsername = typeof username === "string" ? username.trim() : "";
    const hasPassword = typeof password === "string" && password.trim();

    if (!trimmedUsername) {
      return res.status(400).json({ message: "Нэвтрэх нэр шаардлагатай" });
    }

    if (!hasPassword) {
      return res.status(400).json({ message: "Нууц үг шаардлагатай" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { username: trimmedUsername },
    });

    if (existingUser) {
      return res.status(409).json({ message: "Нэвтрэх нэр бүртгэлтэй байна" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username: trimmedUsername,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    const token = createToken(user.id);

    return res.status(201).json({
      message: "Хэрэглэгч амжилттай бүртгэгдлээ",
      token,
      user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Серверийн алдаа гарлаа" });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const trimmedUsername = typeof username === "string" ? username.trim() : "";
    const hasPassword = typeof password === "string" && password.trim();

    if (!trimmedUsername) {
      return res.status(400).json({ message: "Нэвтрэх нэр шаардлагатай" });
    }

    if (!hasPassword) {
      return res.status(400).json({ message: "Нууц үг шаардлагатай" });
    }

    const user = await prisma.user.findUnique({
      where: { username: trimmedUsername },
    });

    if (!user) {
      return res
        .status(401)
        .json({ message: "Нэвтрэх нэр эсвэл нууц үг буруу байна" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ message: "Нэвтрэх нэр эсвэл нууц үг буруу байна" });
    }

    const token = createToken(user.id);

    return res.json({
      message: "Амжилттай нэвтэрлээ",
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Серверийн алдаа гарлаа" });
  }
};

module.exports = {
  register,
  login,
};
