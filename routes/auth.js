const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const auth = require("../middleware/auth");

router.post("/register", async (req, res) => {
  try {
    const { username, password, email, phone, name } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({
        error: "Username or email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password: hashedPassword,
      email,
      phone,
      name,
    });

    // Create token and set cookie
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    // send a cookie to the client

    res.cookie("token", token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      name: user.name,
    };

    res.json({ message: "User registered successfully", user: userData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create token and set cookie
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      sameSite: 'strict',
    });

    res.json({ message: "Logged in successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/logout", (req, res) => {
  try {
    // Clear the token by setting it to an empty value and expiring immediately
    res.cookie("token", "", {
      httpOnly: true, // Prevents client-side access to the cookie
      secure: process.env.NODE_ENV === "production", // Set to true if in production (only sends over HTTPS)
      expires: new Date(0), // Expire the cookie immediately
      sameSite: "Strict", // Restrict cross-site requests for security
    });

    // Send a success message
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    // Send an error message if something goes wrong
    res.status(500).json({ message: "Something went wrong during logout" });
  }
});

// Protected route example
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
