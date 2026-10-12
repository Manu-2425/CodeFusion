
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Home route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Cyber Buddy API",
    status: "Running",
    team: "Code Fusion"
  });
});

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Cyber Buddy backend is running"
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Cyber Buddy server running on port ${PORT}`);
});
