const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const morgan = require("morgan");
const port = process.env.PORT || 5000;
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(morgan("dev"));

// connect to MongoDB database

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connection established");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
  }
})();

// routes
app.use("/api/auth", require("./routes/auth"));

// start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
