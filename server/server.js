require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();

// --- Global Middleware (order matters) ---
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const cookieParser = require('cookie-parser');
app.use(cookieParser());
app.use(morgan('dev'));
const { generalLimiter } = require('./middleware/rateLimiter');
app.use('/api', generalLimiter);

// --- Routes ---
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const sessionRoutes = require('./routes/sessionRoutes');
app.use('/api/sessions', sessionRoutes);

const analysisRoutes = require('./routes/analysisRoutes');
app.use('/api/analyses', analysisRoutes);

const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

const collaborationRoutes = require('./routes/collaborationRoutes');
app.use('/api/collaboration', collaborationRoutes);

const teamRoutes = require('./routes/teamRoutes');
app.use('/api/teams', teamRoutes);

const commentRoutes = require('./routes/commentRoutes');
app.use('/api/comments', commentRoutes);

// --- Health check route ---
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// --- Global error handler (must be defined LAST, after all routes) ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// --- Create HTTP server and attach Socket.io ---
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join_analysis', (analysisId) => {
    socket.join(`analysis:${analysisId}`);
  });

  socket.on('leave_analysis', (analysisId) => {
    socket.leave(`analysis:${analysisId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});