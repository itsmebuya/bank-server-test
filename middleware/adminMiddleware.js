const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Зөвхөн admin эрхтэй хэрэглэгч хандах боломжтой" });
  }

  return next();
};

module.exports = adminMiddleware;
