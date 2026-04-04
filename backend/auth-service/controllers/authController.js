const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const USER_SERVICE = process.env.USER_SERVICE_URL || "http://127.0.0.1:5002";

exports.signup = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role });
    await user.save();

    //  Try/catch pour ne pas bloquer si user-service indisponible
    try {
      await axios.post(`${USER_SERVICE}/api/users`, {
        authId: user._id,
        name:   user.name,
        email:  user.email,
        role:   user.role
      });
    } catch (axiosErr) {
      console.warn("[SIGNUP] user-service indisponible:", axiosErr.message);
    }

    res.json({ message: "User registered successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email)    return res.status(400).json({ message: "Email required" });
    if (!password) return res.status(400).json({ message: "Password required" }); // ✅ ajouté

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "supersecret", 
      { expiresIn: "1d" }
    );

    res.json({ token, role: user.role, name: user.name });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};