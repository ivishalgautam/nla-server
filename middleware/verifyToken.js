const jwt = require("jsonwebtoken");

function isLoggedIn(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SEC, (err, user) => {
      if (err) {
        res.status(401).json({ message: err });
      } else {
        req.user = user;
        next();
      }
    });
  } else {
    return res.status(404).json({ message: "You need to login first!" });
  }
}

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SEC, (err, user) => {
      if (err) {
        return res.status(401).json({ message: err });
      } else {
        req.user = user;
        next();
      }
    });
  } else {
    return res
      .status(404)
      .json({ message: "Access denied token not provided!" });
  }
}

function verifyTokenAndAuthorization(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.id === req.params.id || req.user.role === "admin") {
      next();
    } else {
      return res.status(401).json({ message: "Unauthorised!" });
    }
  });
}

function verifyTokenAndAdmin(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.role === "admin") {
      next();
    } else {
      return res.status(401).json({ message: "Access denied not admin!" });
    }
  });
}

module.exports = {
  isLoggedIn,
  verifyToken,
  verifyTokenAndAuthorization,
  verifyTokenAndAdmin,
};
