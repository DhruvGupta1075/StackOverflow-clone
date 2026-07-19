import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import userroutes from "./routes/auth.js"
import questionroute from "./routes/question.js"
import answerroutes from "./routes/answer.js"
import paymentroutes from "./routes/payment.js"
import communityroutes from "./routes/community.js"
import languageroutes from "./routes/language.js"
import securityroutes from "./routes/security.js"
const app = express();
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Lightweight cookie parser middleware
app.use((req, res, next) => {
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(";").forEach((cookie) => {
      const parts = cookie.split("=");
      list[parts.shift().trim()] = decodeURIComponent(parts.join("="));
    });
  }
  req.cookies = list;
  next();
});

app.get("/", (req, res) => {
  res.send("Stackoverflow clone is running perfect");
});
app.use('/user',userroutes)
app.use('/api/auth',userroutes)
app.use('/api/user',userroutes)
app.use('/api/language',languageroutes)
app.use('/question',questionroute)
app.use('/answer',answerroutes)
app.use('/payment',paymentroutes)
app.use('/api/community',communityroutes)
app.use('/community',communityroutes)
app.use('/api/security', securityroutes)
const PORT = process.env.PORT || 5000;
const databaseurl = process.env.MONGODB_URL;

mongoose
  .connect(databaseurl)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });
