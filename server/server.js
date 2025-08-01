import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import chartRoutes from './routes/chartRoutes.js';
import morgan from 'morgan';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use(morgan('dev'));
app.use('/auth', authRoutes);
app.use('/api', chartRoutes);
app.get('/', (req, res) => {
  res.send('API is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
