import express from "express";
import {
  Askquestion,
  deletequestion,
  getallquestion,
  votequestion,
  voteAnswer,
} from "../controller/question.js";

const router = express.Router();
import auth from "../middleware/auth.js";
import checkLimit from "../middleware/checkLimit.js";
router.post("/ask", auth, checkLimit, Askquestion);
router.get("/getallquestion", getallquestion);
router.delete("/delete/:id", auth, deletequestion);
router.patch("/vote/:id", auth, votequestion);
router.patch("/voteanswer/:questionId/:answerId", auth, voteAnswer);

export default router;
