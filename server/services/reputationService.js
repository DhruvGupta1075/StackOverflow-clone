import User from "../models/auth.js";
import ReputationHistory from "../models/reputationHistory.js";
import question from "../models/question.js";

export const PRIVILEGES = {
  comment_unrestricted: { minRep: 50, name: "Comment without restrictions", description: "Comment on questions and community posts freely" },
  edit_posts: { minRep: 100, name: "Edit community posts", description: "Edit community posts and improve quality" },
  vote_close: { minRep: 250, name: "Vote to close questions", description: "Cast votes to close duplicate or off-topic questions" },
  report_content: { minRep: 500, name: "Report inappropriate content", description: "Flag posts, comments, or answers for moderator review" }
};

export const getUnlockedPrivileges = (reputation = 0) => {
  const unlocked = [];
  if (reputation >= 50) unlocked.push("comment_unrestricted");
  if (reputation >= 100) unlocked.push("edit_posts");
  if (reputation >= 250) unlocked.push("vote_close");
  if (reputation >= 500) unlocked.push("report_content");
  return unlocked;
};

export const getCommunityRank = (reputation = 0) => {
  if (reputation >= 1000) return "Grandmaster";
  if (reputation >= 500) return "Master";
  if (reputation >= 250) return "Curator";
  if (reputation >= 100) return "Scholar";
  if (reputation >= 50) return "Contributor";
  return "Novice";
};

export const BADGE_DEFINITIONS = [
  { name: "First Answer", icon: "message-square", description: "Posted your first answer" },
  { name: "100 Reputation", icon: "award", description: "Reached 100 reputation points" },
  { name: "500 Reputation", icon: "shield-check", description: "Reached 500 reputation points" },
  { name: "1000 Reputation", icon: "crown", description: "Reached 1000 reputation points" },
  { name: "Helpful Member", icon: "heart", description: "Earned 150+ reputation in the community" },
  { name: "Top Contributor", icon: "zap", description: "Active contributor with 250+ reputation" },
  { name: "Problem Solver", icon: "check-circle", description: "Had an answer accepted as solution" },
  { name: "Community Mentor", icon: "star", description: "Established leader with 500+ reputation" }
];

export const checkAndAwardBadges = (userDoc, totalAnswersCount = 0, hasAcceptedAnswer = false) => {
  const existingBadgeNames = new Set((userDoc.badges || []).map((b) => b.name));
  const newBadges = [];

  const addBadge = (badgeName) => {
    if (!existingBadgeNames.has(badgeName)) {
      const def = BADGE_DEFINITIONS.find((b) => b.name === badgeName);
      if (def) {
        newBadges.push({
          name: def.name,
          icon: def.icon,
          description: def.description,
          awardedAt: new Date()
        });
        existingBadgeNames.add(badgeName);
      }
    }
  };

  if (totalAnswersCount >= 1) addBadge("First Answer");
  if (userDoc.reputation >= 100) addBadge("100 Reputation");
  if (userDoc.reputation >= 500) addBadge("500 Reputation");
  if (userDoc.reputation >= 1000) addBadge("1000 Reputation");
  if (userDoc.reputation >= 150) addBadge("Helpful Member");
  if (userDoc.reputation >= 250 && totalAnswersCount >= 3) addBadge("Top Contributor");
  if (hasAcceptedAnswer) addBadge("Problem Solver");
  if (userDoc.reputation >= 500 && totalAnswersCount >= 5) addBadge("Community Mentor");

  return newBadges;
};

export const hasReceivedReward = async (userId, actionType, referenceId) => {
  if (!referenceId) return false;
  const existing = await ReputationHistory.findOne({
    userId,
    actionType,
    referenceId: String(referenceId)
  });
  return !!existing;
};

export const modifyReputation = async ({
  userId,
  actionType,
  points,
  referenceId = null,
  referenceType = null,
  description = ""
}) => {
  try {
    const userDoc = await User.findById(userId);
    if (!userDoc) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    const previousReputation = userDoc.reputation || 0;
    const newReputation = Math.max(0, previousReputation + points);

    userDoc.reputation = newReputation;
    userDoc.unlockedPrivileges = getUnlockedPrivileges(newReputation);

    // Calculate answer counts & accepted answers for badge evaluation
    const questionsWithUserAnswers = await question.find({ "answer.userid": String(userId) });
    let totalAnswersCount = 0;
    let hasAcceptedAnswer = false;

    questionsWithUserAnswers.forEach((q) => {
      q.answer.forEach((ans) => {
        if (ans.userid === String(userId)) {
          totalAnswersCount++;
          if (ans.isAccepted) hasAcceptedAnswer = true;
        }
      });
    });

    const newBadges = checkAndAwardBadges(userDoc, totalAnswersCount, hasAcceptedAnswer);
    if (newBadges.length > 0) {
      userDoc.badges = [...(userDoc.badges || []), ...newBadges];
    }

    await userDoc.save();

    const historyRecord = new ReputationHistory({
      userId,
      actionType,
      points,
      previousReputation,
      newReputation,
      referenceId: referenceId ? String(referenceId) : null,
      referenceType,
      description: description || `${actionType} (${points > 0 ? "+" : ""}${points} reputation)`
    });

    await historyRecord.save();

    return { user: userDoc, historyRecord, newBadges };
  } catch (error) {
    console.error(`[ReputationService] Error modifying reputation for user ${userId}:`, error);
    throw error;
  }
};
