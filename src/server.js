require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");
const binanceRoutes = require("./routes/binance.routes");
const threeCommaRoutes = require("./routes/threeComma.routes");
const path = require("path");

const app = express();
const server = http.createServer(app);

// CORS Configuration
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://3comma-production-d61d.up.railway.app",
    "https://drivbots.webflow.io",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  credentials: true,
  maxAge: 86400, // 24 hours
};

// Set Content Security Policy header to allow fonts and other resources
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; font-src 'self' https://threecomma-zy4s.onrender.com; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data:;"
  );
  next();
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "../public")));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "An error occurred",
  });
});

// WebSocket server setup
const wss = new WebSocket.Server({
  server,
  path: "/ws",
  clientTracking: true,
  perMessageDeflate: false,
});

// WebSocket connection handling
wss.on("connection", (ws, req) => {
  console.log("New WebSocket connection from:", req.socket.remoteAddress);

  // Send initial status
  const sendStatus = () => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "status",
          data: {
            status: "OK",
            timestamp: new Date().toISOString(),
            mongodb:
              mongoose.connection.readyState === 1
                ? "connected"
                : "disconnected",
          },
        })
      );
    }
  };

  // Send initial status
  sendStatus();

  // Send status every 5 seconds
  const interval = setInterval(sendStatus, 5000);

  // Handle client messages
  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      console.log("Received message:", data);
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  });

  // Handle errors
  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });

  // Handle connection close
  ws.on("close", () => {
    console.log("Client disconnected");
    clearInterval(interval);
  });
});

// MongoDB Connection Options
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  family: 4,
};

// Database connection
const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/webflow_integration";
    await mongoose.connect(mongoURI, mongoOptions);
    console.log("Connected to MongoDB successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    setTimeout(connectDB, 5000);
  }
};

connectDB();

// Routes
app.use("/api/binance", binanceRoutes);
app.use("/api/3comma", threeCommaRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    mongodb:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://0.0.0.0:${PORT}/ws`);
});
