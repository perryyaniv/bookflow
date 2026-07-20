import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Server } from 'socket.io';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import orderRoutes from './routes/orders';
import branchRoutes from './routes/branches';
import settingsRoutes from './routes/settings';
import auditLogRoutes from './routes/auditLog';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true },
});

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.set('io', io);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audit-log', auditLogRoutes);

io.on('connection', (socket) => {
  socket.on('join-branch', (branchId: string) => socket.join(`branch:${branchId}`));
  socket.on('leave-branch', (branchId: string) => socket.leave(`branch:${branchId}`));
});

const PORT = Number(process.env.PORT || 5000);

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bookflow')
  .then(() => {
    console.log('MongoDB connected');
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

export { io };
