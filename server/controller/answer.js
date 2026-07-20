import mongoose from "mongoose";
import question from "../models/question.js";
import user from "../models/auth.js";
import { modifyReputation, hasReceivedReward } from "../services/reputationService.js";

export const Askanswer = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  const { noofanswer, answerbody, useranswered, userid } = req.body;
  const answerAuthorId = userid || req.userid;

  try {
    const updatequestion = await question.findByIdAndUpdate(
      _id,
      {
        $addToSet: { answer: [{ answerbody, useranswered, userid: String(answerAuthorId) }] },
      },
      { new: true }
    );

    if (updatequestion) {
      await updatenoofanswer(_id, updatequestion.answer.length);

      // Award +5 Reputation for posting an answer
      if (answerAuthorId) {
        await modifyReputation({
          userId: answerAuthorId,
          actionType: "Answer Posted",
          points: 5,
          referenceId: String(_id),
          referenceType: "Question",
          description: "Posted an answer (+5 reputation)"
        });
      }
    }

    res.status(200).json({ data: updatequestion });
  } catch (error) {
    console.error("Error in Askanswer:", error);
    res.status(500).json("something went wrong..");
    return;
  }
};

const updatenoofanswer = async (_id, noofanswer) => {
  try {
    await question.findByIdAndUpdate(_id, { $set: { noofanswer: noofanswer } });
  } catch (error) {
    console.log(error);
  }
};

export const deleteanswer = async (req, res) => {
  const { id: _id } = req.params;
  const { noofanswer, answerid } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  if (!mongoose.Types.ObjectId.isValid(answerid)) {
    return res.status(400).json({ message: "answer unavailable" });
  }

  try {
    // Find question and target answer before deletion to identify author & admin status
    const quesDoc = await question.findById(_id);
    const targetAnswer = quesDoc?.answer?.find((ans) => String(ans._id) === String(answerid));

    const currentUser = await user.findById(req.userid);
    const isAdmin = currentUser?.role === "admin";

    const updatequestion = await question.updateOne(
      { _id },
      {
        $pull: { answer: { _id: answerid } },
      }
    );

    const updatedQues = await question.findById(_id);
    if (updatedQues) {
      await updatenoofanswer(_id, updatedQues.answer.length);
    }

    // Deduct reputation
    if (targetAnswer && targetAnswer.userid) {
      const isSelfDelete = String(targetAnswer.userid) === String(req.userid);

      if (isAdmin && !isSelfDelete) {
        // -10 Reputation for Admin Removed Content
        await modifyReputation({
          userId: targetAnswer.userid,
          actionType: "Admin Removed Content",
          points: -10,
          referenceId: String(answerid),
          referenceType: "Answer",
          description: "Administrator removed answer for guideline violation (-10 reputation)"
        });
      } else if (isSelfDelete) {
        // -5 Reputation for User Deletes Own Answer
        await modifyReputation({
          userId: targetAnswer.userid,
          actionType: "Answer Deleted",
          points: -5,
          referenceId: String(answerid),
          referenceType: "Answer",
          description: "Deleted own answer (-5 reputation)"
        });
      }
    }

    res.status(200).json({ data: updatequestion });
  } catch (error) {
    console.error("Error in deleteanswer:", error);
    res.status(500).json("something went wrong..");
    return;
  }
};

export const acceptAnswer = async (req, res) => {
  const { questionId, answerId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(questionId) || !mongoose.Types.ObjectId.isValid(answerId)) {
    return res.status(400).json({ message: "Invalid question or answer ID" });
  }

  try {
    const quesDoc = await question.findById(questionId);
    if (!quesDoc) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Only question author can accept answer
    if (String(quesDoc.userid) !== String(req.userid)) {
      return res.status(403).json({ message: "Only the question author can accept an answer." });
    }

    let acceptedAnswerAuthorId = null;

    quesDoc.answer.forEach((ans) => {
      if (String(ans._id) === String(answerId)) {
        ans.isAccepted = true;
        acceptedAnswerAuthorId = ans.userid;
      } else {
        ans.isAccepted = false;
      }
    });

    await quesDoc.save();

    // Award +10 Reputation for Accepted Answer if not already awarded
    if (acceptedAnswerAuthorId) {
      const alreadyRewarded = await hasReceivedReward(acceptedAnswerAuthorId, "Accepted Answer", answerId);
      if (!alreadyRewarded) {
        await modifyReputation({
          userId: acceptedAnswerAuthorId,
          actionType: "Accepted Answer",
          points: 10,
          referenceId: String(answerId),
          referenceType: "Answer",
          description: "Answer accepted as solution (+10 reputation)"
        });
      }
    }

    res.status(200).json({ success: true, message: "Answer accepted successfully", data: quesDoc });
  } catch (error) {
    console.error("Error in acceptAnswer:", error);
    res.status(500).json({ message: "Failed to accept answer" });
  }
};
