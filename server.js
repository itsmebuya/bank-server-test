require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const accountRoutes = require('./routes/accountRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const userRoutes = require('./routes/userRoutes');
const rateRoutes = require('./routes/rateRoutes');
const { startRateSyncJob } = require('./jobs/rateSyncJob');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Transaction API is running' });
});

app.get('/make-first-user-admin', async (req, res) => {
  const { PrismaClient, Role } = require('@prisma/client');

  const prisma = new PrismaClient();

  try {
    const user = await prisma.user.update({
      where: {
        id: 1,
      },
      data: {
        role: Role.ADMIN,
      },
    });

    res.json({
      message: 'First user ADMIN bolloo',
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Admin bolgoh ued aldaa garlaa',
      error: error.message,
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rates', rateRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'API зам олдсонгүй' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Серверийн алдаа гарлаа' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  startRateSyncJob();
});
