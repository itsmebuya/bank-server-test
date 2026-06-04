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

app.use(
  cors({
    origin: ['http://localhost:3000', 'https://bank-frontend.vercel.app'],
    credentials: true,
  }),
);
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Transaction API is running' });
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
