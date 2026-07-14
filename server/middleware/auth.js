import jwt from "jsonwebtoken";
import user from "../models/auth.js";

const auth = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({ message: "Authorization token is missing." });
    }
    const token = req.headers.authorization.split(" ")[1];
    let decodedata = jwt.verify(token, process.env.JWT_SECRET);
    req.userid = decodedata?.id;

    if (req.userid) {
      const currentUser = await user.findById(req.userid);
      if (currentUser) {
        if (currentUser.isSuspended || currentUser.isBanned) {
          return res.status(403).json({ message: "Your account is suspended or banned due to content violations." });
        }
      }
    }
    next();
  } catch (error) {
    console.log("Authentication verification failed:", error.message);
    return res.status(401).json({ message: "Authentication failed. Session expired or invalid." });
  }
};
export default auth;
