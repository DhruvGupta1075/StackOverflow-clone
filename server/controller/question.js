import mongoose from "mongoose";
import question from "../models/question.js";
import User from "../models/auth.js";
import { modifyReputation, hasReceivedReward } from "../services/reputationService.js";

export const Askquestion = async (req, res) => {
  const { postquestiondata } = req.body;
  const postques = new question({ ...postquestiondata });
  try {
    await postques.save();
    res.status(200).json({ data: postques });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};

export const getallquestion = async (req, res) => {
  const { search, tags, author, unanswered, minVotes, startDate, endDate } = req.query;

  try {
    let query = {};

    // 1. Text Search on Title or Body
    if (search) {
      query.$or = [
        { questiontitle: { $regex: search, $options: "i" } },
        { questionbody: { $regex: search, $options: "i" } },
      ];
    }

    // 2. Tag Filter
    if (tags) {
      const tagList = tags.split(",").map((t) => t.trim().toLowerCase());
      query.questiontags = { $in: tagList.map((tag) => new RegExp(`^${tag}$`, "i")) };
    }

    // 3. Author Filter
    if (author) {
      query.userposted = { $regex: author, $options: "i" };
    }

    // 4. Unanswered Filter
    if (unanswered === "true") {
      query.noofanswer = 0;
    }

    // 5. Date Range Filter
    if (startDate || endDate) {
      query.askedon = {};
      if (startDate) query.askedon.$gte = new Date(startDate);
      if (endDate) query.askedon.$lte = new Date(endDate);
    }

    // Fetch matching questions
    let questionsList = await question.find(query);

    // Filter by minVotes in JS
    if (minVotes) {
      const minV = parseInt(minVotes, 10);
      questionsList = questionsList.filter((q) => {
        const votesCount = (q.upvote || []).length - (q.downvote || []).length;
        return votesCount >= minV;
      });
    }

    // Fetch user plan details
    const users = await User.find({}, "plan");
    const userPlanMap = {};
    users.forEach((u) => {
      userPlanMap[u._id.toString()] = u.plan || "Free";
    });

    const getPlanWeight = (plan) => {
      if (plan === "Gold") return 3;
      if (plan === "Silver") return 2;
      if (plan === "Bronze") return 1;
      return 0;
    };

    questionsList.sort((a, b) => {
      const weightA = getPlanWeight(userPlanMap[a.userid] || "Free");
      const weightB = getPlanWeight(userPlanMap[b.userid] || "Free");

      if (weightA !== weightB) {
        return weightB - weightA;
      }

      return new Date(b.askedon).getTime() - new Date(a.askedon).getTime();
    });

    const questionsWithPlan = questionsList.map((q) => {
      const qObj = q.toObject ? q.toObject() : q;
      qObj.authorPlan = userPlanMap[q.userid] || "Free";
      return qObj;
    });

    res.status(200).json({ data: questionsWithPlan });
  } catch (error) {
    console.error("Error in getallquestion:", error);
    res.status(500).json("something went wrong..");
    return;
  }
};

export const deletequestion = async (req, res) => {
  const { id: _id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  try {
    const questionDoc = await question.findById(_id);

    if (questionDoc) {
      const currentUser = await User.findById(req.userid);
      const isAdmin = currentUser?.role === "admin";
      const isOwner = String(questionDoc.userid) === String(req.userid);

      if (isAdmin && !isOwner && questionDoc.userid) {
        // -10 Reputation if admin removes question for guideline violation
        await modifyReputation({
          userId: questionDoc.userid,
          actionType: "Admin Removed Content",
          points: -10,
          referenceId: String(_id),
          referenceType: "Question",
          description: "Administrator removed question for guideline violation (-10 reputation)"
        });
      }
    }

    await question.findByIdAndDelete(_id);
    res.status(200).json({ message: "question deleted" });
  } catch (error) {
    console.error("Error in deletequestion:", error);
    res.status(500).json("something went wrong..");
    return;
  }
};

export const votequestion = async (req, res) => {
  const { id: _id } = req.params;
  const { value, userid } = req.body;
  const voterId = userid || req.userid;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  try {
    const questionDoc = await question.findById(_id);
    if (!questionDoc) {
      return res.status(404).json({ message: "Question not found" });
    }

    const upindex = questionDoc.upvote.findIndex((id) => id === String(voterId));
    const downindex = questionDoc.downvote.findIndex((id) => id === String(voterId));

    let downvoteAdded = false;

    if (value === "upvote") {
      if (downindex !== -1) {
        questionDoc.downvote = questionDoc.downvote.filter((id) => id !== String(voterId));
      }
      if (upindex === -1) {
        questionDoc.upvote.push(String(voterId));
      } else {
        questionDoc.upvote = questionDoc.upvote.filter((id) => id !== String(voterId));
      }
    } else if (value === "downvote") {
      if (upindex !== -1) {
        questionDoc.upvote = questionDoc.upvote.filter((id) => id !== String(voterId));
      }
      if (downindex === -1) {
        questionDoc.downvote.push(String(voterId));
        downvoteAdded = true;
      } else {
        questionDoc.downvote = questionDoc.downvote.filter((id) => id !== String(voterId));
      }
    }

    const questionvote = await question.findByIdAndUpdate(_id, questionDoc, { new: true });

    // Handle Reputation Rules for Question
    if (questionDoc.userid) {
      // 1. Downvote received: -2 Reputation
      if (downvoteAdded) {
        await modifyReputation({
          userId: questionDoc.userid,
          actionType: "Downvote Received",
          points: -2,
          referenceId: String(_id),
          referenceType: "Question",
          description: "Question received a downvote (-2 reputation)"
        });
      }

      // 2. Question receives at least 10 upvotes: +2 Reputation (Award only once per question)
      if ((questionvote.upvote || []).length >= 10) {
        const alreadyRewarded = await hasReceivedReward(questionDoc.userid, "Question Upvoted", _id);
        if (!alreadyRewarded) {
          await modifyReputation({
            userId: questionDoc.userid,
            actionType: "Question Upvoted",
            points: 2,
            referenceId: String(_id),
            referenceType: "Question",
            description: "Question reached 10+ upvotes (+2 reputation)"
          });
        }
      }
    }

    res.status(200).json({ data: questionvote });
  } catch (error) {
    console.error("Error in votequestion:", error);
    res.status(500).json("something went wrong..");
    return;
  }
};

export const voteAnswer = async (req, res) => {
  const { questionId, answerId } = req.params;
  const { value } = req.body;
  const voterId = req.userid;

  if (!mongoose.Types.ObjectId.isValid(questionId) || !mongoose.Types.ObjectId.isValid(answerId)) {
    return res.status(400).json({ message: "Invalid question or answer ID" });
  }

  try {
    const quesDoc = await question.findById(questionId);
    if (!quesDoc) {
      return res.status(404).json({ message: "Question not found" });
    }

    const targetAns = quesDoc.answer.find((ans) => String(ans._id) === String(answerId));
    if (!targetAns) {
      return res.status(404).json({ message: "Answer not found" });
    }

    if (!targetAns.upvote) targetAns.upvote = [];
    if (!targetAns.downvote) targetAns.downvote = [];

    const upindex = targetAns.upvote.findIndex((id) => id === String(voterId));
    const downindex = targetAns.downvote.findIndex((id) => id === String(voterId));

    let downvoteAdded = false;

    if (value === "upvote") {
      if (downindex !== -1) {
        targetAns.downvote = targetAns.downvote.filter((id) => id !== String(voterId));
      }
      if (upindex === -1) {
        targetAns.upvote.push(String(voterId));
      } else {
        targetAns.upvote = targetAns.upvote.filter((id) => id !== String(voterId));
      }
    } else if (value === "downvote") {
      if (upindex !== -1) {
        targetAns.upvote = targetAns.upvote.filter((id) => id !== String(voterId));
      }
      if (downindex === -1) {
        targetAns.downvote.push(String(voterId));
        downvoteAdded = true;
      } else {
        targetAns.downvote = targetAns.downvote.filter((id) => id !== String(voterId));
      }
    }

    await quesDoc.save();

    // Handle Reputation Rules for Answer
    if (targetAns.userid) {
      // 1. Downvote received: -2 Reputation
      if (downvoteAdded) {
        await modifyReputation({
          userId: targetAns.userid,
          actionType: "Downvote Received",
          points: -2,
          referenceId: String(answerId),
          referenceType: "Answer",
          description: "Answer received a downvote (-2 reputation)"
        });
      }

      // 2. Answer receives at least 5 upvotes: +5 Reputation (Award only once per answer)
      if ((targetAns.upvote || []).length >= 5) {
        const alreadyRewarded = await hasReceivedReward(targetAns.userid, "Answer Upvoted", answerId);
        if (!alreadyRewarded) {
          await modifyReputation({
            userId: targetAns.userid,
            actionType: "Answer Upvoted",
            points: 5,
            referenceId: String(answerId),
            referenceType: "Answer",
            description: "Answer reached 5+ upvotes (+5 reputation)"
          });
        }
      }
    }

    res.status(200).json({ success: true, data: quesDoc });
  } catch (error) {
    console.error("Error in voteAnswer:", error);
    res.status(500).json({ message: "Failed to vote on answer" });
  }
};
