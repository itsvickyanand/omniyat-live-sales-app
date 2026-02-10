const AdminSession = require("../models/AdminSession");

module.exports = async function protectAdmin(req, res, next) {
  try {
    // 1. Read cookie
    const token = req.cookies?.superadmin_session;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No session",
      });
    }

    // 2. Find session in database
    const session = await AdminSession.findOne({
      where: { token },
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid session",
      });
    }

    // 3. Check expiration
    if (new Date() > new Date(session.expiresAt)) {
      // destroy expired session
      await AdminSession.destroy({
        where: { token },
      });

      res.clearCookie("superadmin_session");

      return res.status(401).json({
        success: false,
        message: "Session expired",
      });
    }

    // 4. Attach session info to request (optional)
    req.adminSession = session;

    // 5. Allow request
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Authentication error",
    });
  }
};
