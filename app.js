const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const bodyParser = require("body-parser");
const expressListEndpoints = require('express-list-endpoints');

const authRouter = require("./routes/auth.routes");
const adminRouter = require("./routes/admin.routes");
const projectsRouter = require("./routes/project.routes");
const clientsRouter = require("./routes/client.routes");

const handleErrors = require("./middlewares/handleErrors");
const cors = require("cors");

const app = express();
dotenv.config({
  path: "./config/config.env",
});

// Middleware
app.use(cors({
  origin: "*",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.urlencoded({ 
  limit: '10mb', 
  extended: true 
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Connect to database
connectDB();

// Routes
app.get("/", (req, res) => {
  res.send("Server Started Successfully :)");
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/admins", adminRouter);
app.use("/api/v1/projects", projectsRouter);
app.use("/api/v1/clients", clientsRouter);

// Error handling
app.use(handleErrors); 

// Error handling - TEMPORARY DEBUG VERSION
app.use((err, req, res, next) => {
  console.error("❌ UNHANDLED ERROR:", {
    message: err.message,
    stack: err.stack,
    fullError: JSON.stringify(err, null, 2)
  });
  
  res.status(err.statusCode || 500).json({
    status: "error",
    message: err.message || "Server error. Please try again later.",
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 8090;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('✅ Available routes:');
  console.table(expressListEndpoints(app));
});

module.exports = app;