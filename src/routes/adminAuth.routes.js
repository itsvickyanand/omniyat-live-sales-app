const express = require("express");
const router = express.Router();

const crypto = require("crypto");

const AdminSession = require("../models/AdminSession");

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { password } = req.body;

    // 1. Validate password
    if (!password || password !== process.env.SUPER_ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    // 2. Generate secure random session token
    const sessionToken = crypto.randomBytes(64).toString("hex");

    // 3. Set expiration (24 hours)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 4. Store session in database
    await AdminSession.create({
      token: sessionToken,
      expiresAt,
    });

    // 5. Send cookie to browser
    res.cookie("superadmin_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    // 6. Success response
    return res.json({
      success: true,
      message: "Login successful",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// LOGOUT
router.post("/logout", async (req, res) => {
  try {
    const token = req.cookies?.superadmin_session;

    if (token) {
      await AdminSession.destroy({
        where: { token },
      });
    }

    res.clearCookie("superadmin_session");

    return res.json({
      success: true,
      message: "Logged out",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// CHECK AUTH
router.get("/check", async (req, res) => {
  try {
    const token = req.cookies?.superadmin_session;

    // no cookie
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    // find session in DB
    const session = await AdminSession.findOne({
      where: { token },
    });

    // no session found
    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Invalid session",
      });
    }

    // check expiration
    if (new Date() > new Date(session.expiresAt)) {
      // delete expired session
      await AdminSession.destroy({
        where: { token },
      });

      res.clearCookie("superadmin_session");

      return res.status(401).json({
        success: false,
        message: "Session expired",
      });
    }

    // authenticated
    return res.json({
      success: true,
      message: "Authenticated",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;
