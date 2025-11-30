// main-api/app.js
const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const bodyParser = require("body-parser");
const expressListEndpoints = require('express-list-endpoints');

const authRouter = require("./routes/auth.route");
const userRouter = require("./routes/user.route");
const eventRouter = require("./routes/event.route");
const groupRouter = require("./routes/group.routes");
const notificationRouter = require("./routes/notification.routes");
const messageRoutes = require("./routes/message.routes");

const handleErrors = require("./middlewares/handleErrors");
const cors = require("cors");

const app = express();
dotenv.config({
  path: "./config/config.env",
});

app.use(cors({
  origin: "*", // or multiple domains
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

connectDB();

app.get("/", (req, res) => {
  res.send("Server Started Successfully :)");
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/events", eventRouter);
app.use("/api/v1/groups", groupRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/messages", messageRoutes);

app.use(handleErrors); 

const PORT = process.env.PORT || 8090;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('✅ Available routes:');
  console.table(expressListEndpoints(app));
});

module.exports = app;