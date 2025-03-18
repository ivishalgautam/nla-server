function verifySuperAdmin(req, res, next) {
  if (req.user.role !== "superAdmin") {
    return res
      .status(403)
      .json({
        message: "Access denied. Only superAdmins can perform this action.",
      });
  }
  next();
}

module.exports = verifySuperAdmin;
