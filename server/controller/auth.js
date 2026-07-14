import mongoose from "mongoose";
import user from "../models/auth.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import question from "../models/question.js";
import { generatePassword } from "../utils/passwordGenerator.js";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
export const Signup = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const exisitinguser = await user.findOne({ email });
    if (exisitinguser) {
      return res.status(404).json({ message: "User already exist" });
    }
    const hashpassword = await bcrypt.hash(password, 12);
    let baseUsername = (name || email.split("@")[0]).replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    if (!baseUsername) baseUsername = "user";
    let username = baseUsername;
    let existingUsername = await user.findOne({ username });
    while (existingUsername) {
      username = `${baseUsername}${Math.floor(1000 + Math.random() * 9000)}`;
      existingUsername = await user.findOne({ username });
    }
    const role = email.toLowerCase().includes("admin") ? "admin" : "user";
    const newuser = await user.create({
      name,
      email,
      password: hashpassword,
      username,
      role,
    });
    const token = jwt.sign(
      { email: newuser.email, id: newuser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.status(200).json({ data: newuser, token });
  } catch (error) {
    res.status(500).json("something went wrong..");
    return;
  }
};
export const Login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const exisitinguser = await user.findOne({ email });
    if (!exisitinguser) {
      return res.status(404).json({ message: "User does not exist" });
    }

    const ispasswordcrct = await bcrypt.compare(
      password,
      exisitinguser.password
    );
    if (!ispasswordcrct) {
      return res.status(400).json({ message: "Invalid password" });
    }
    const token = jwt.sign(
      { email: exisitinguser.email, id: exisitinguser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.status(200).json({ data: exisitinguser, token });
  } catch (error) {
    res.status(500).json("something went wrong..");
    return;
  }
};
export const getallusers = async (req, res) => {
  try {
    const alluser = await user.find();
    res.status(200).json({ data: alluser });
  } catch (error) {
    res.status(500).json("something went wrong..");
    return;
  }
};
export const updateprofile = async (req, res) => {
  const { id: _id } = req.params;
  const { name, about, tags, billingDetails } = req.body.editForm || req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "User unavailable" });
  }
  try {
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (about !== undefined) updateFields.about = about;
    if (tags !== undefined) updateFields.tags = tags;
    if (billingDetails !== undefined) updateFields.billingDetails = billingDetails;

    const updatedProfile = await user.findByIdAndUpdate(
      _id,
      { $set: updateFields },
      { new: true }
    );
    res.status(200).json({ data: updatedProfile });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};

export const toggleBookmark = async (req, res) => {
  const { questionId } = req.params;
  try {
    const currentUser = await user.findById(req.userid);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate Silver/Gold plan
    if (currentUser.plan !== "Silver" && currentUser.plan !== "Gold") {
      return res.status(403).json({
        message: "Bookmarking is a premium feature. Please upgrade to Silver or Gold Plan to use bookmarks.",
      });
    }

    const isBookmarked = currentUser.bookmarks.includes(questionId);
    if (isBookmarked) {
      currentUser.bookmarks = currentUser.bookmarks.filter((id) => id !== questionId);
      await currentUser.save();
      res.status(200).json({
        message: "Bookmark removed successfully",
        isBookmarked: false,
        bookmarks: currentUser.bookmarks,
      });
    } else {
      currentUser.bookmarks.push(questionId);
      await currentUser.save();
      res.status(200).json({
        message: "Bookmark added successfully",
        isBookmarked: true,
        bookmarks: currentUser.bookmarks,
      });
    }
  } catch (error) {
    console.error("Error in toggleBookmark:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getBookmarks = async (req, res) => {
  try {
    const currentUser = await user.findById(req.userid);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (currentUser.plan !== "Silver" && currentUser.plan !== "Gold") {
      return res.status(403).json({ message: "Upgrade to Silver or Gold plan to access bookmarks." });
    }

    const bookmarkedQuestions = await question.find({
      _id: { $in: currentUser.bookmarks },
    });

    res.status(200).json({ data: bookmarkedQuestions });
  } catch (error) {
    console.error("Error in getBookmarks:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getProfile = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }
  try {
    const matchedUser = await user.findById(id).select("-password");
    if (!matchedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ data: matchedUser });
  } catch (error) {
    console.error("Error in getProfile:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const googleLogin = async (req, res) => {
  const { idToken, accessToken } = req.body;
  if (!idToken && !accessToken) {
    return res.status(400).json({ message: "Google credential token is required" });
  }

  try {
    let email, name, googleId;

    if (accessToken) {
      // Verify via Google userinfo endpoint using accessToken
      const verifyUrl = "https://www.googleapis.com/oauth2/v3/userinfo";
      const response = await fetch(verifyUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      
      if (!response.ok) {
        return res.status(400).json({ message: "Failed to verify Google Access Token" });
      }

      const userInfo = await response.json();
      googleId = userInfo.sub;
      email = userInfo.email;
      name = userInfo.name;
    } else {
      // Verify Google ID Token
      const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`;
      const response = await fetch(verifyUrl);
      
      if (!response.ok) {
        return res.status(400).json({ message: "Failed to verify Google ID Token" });
      }

      const tokenInfo = await response.json();
      googleId = tokenInfo.sub;
      email = tokenInfo.email;
      name = tokenInfo.name;
    }

    if (!email) {
      return res.status(400).json({ message: "Google account does not share email" });
    }

    let existingUser = await user.findOne({ $or: [{ googleId }, { email }] });

    if (existingUser) {
      // Link Google ID if not already linked
      if (!existingUser.googleId) {
        existingUser.googleId = googleId;
        await existingUser.save();
      }
    } else {
      // Create new user
      let baseUsername = (name || email.split("@")[0]).replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      if (!baseUsername) baseUsername = "user";
      let username = baseUsername;
      let existingUsername = await user.findOne({ username });
      while (existingUsername) {
        username = `${baseUsername}${Math.floor(1000 + Math.random() * 9000)}`;
        existingUsername = await user.findOne({ username });
      }
      const role = email.toLowerCase().includes("admin") ? "admin" : "user";
      existingUser = await user.create({
        name,
        email,
        googleId,
        username,
        role,
        plan: "Free",
        subscriptionStatus: "inactive",
      });
    }

    const token = jwt.sign(
      { email: existingUser.email, id: existingUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({ data: existingUser, token });
  } catch (error) {
    console.error("Error in googleLogin:", error);
    res.status(500).json({ message: "Something went wrong during Google Login" });
  }
};

export const githubLogin = async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ message: "GitHub authorization code is required" });
  }

  try {
    // Exchange authorization code for GitHub access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return res.status(400).json({ message: "Failed to exchange GitHub authorization code" });
    }

    // Get GitHub user profile
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `token ${accessToken}`,
      },
    });

    const githubProfile = await userResponse.json();
    const githubId = String(githubProfile.id);
    const name = githubProfile.name || githubProfile.login || "GitHub User";

    // Get GitHub user emails
    const emailsResponse = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `token ${accessToken}`,
      },
    });

    const emailsList = await emailsResponse.json();
    const primaryEmailObj = Array.isArray(emailsList)
      ? (emailsList.find((e) => e.primary) || emailsList[0])
      : null;
    const email = primaryEmailObj ? primaryEmailObj.email : null;

    if (!email) {
      return res.status(400).json({ message: "Could not retrieve email from GitHub account" });
    }

    let existingUser = await user.findOne({ $or: [{ githubId }, { email }] });

    if (existingUser) {
      // Link GitHub ID if not already linked
      if (!existingUser.githubId) {
        existingUser.githubId = githubId;
        await existingUser.save();
      }
    } else {
      // Create new user
      let baseUsername = (name || email.split("@")[0]).replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      if (!baseUsername) baseUsername = "user";
      let username = baseUsername;
      let existingUsername = await user.findOne({ username });
      while (existingUsername) {
        username = `${baseUsername}${Math.floor(1000 + Math.random() * 9000)}`;
        existingUsername = await user.findOne({ username });
      }
      const role = email.toLowerCase().includes("admin") ? "admin" : "user";
      existingUser = await user.create({
        name,
        email,
        githubId,
        username,
        role,
        plan: "Free",
        subscriptionStatus: "inactive",
      });
    }

    const token = jwt.sign(
      { email: existingUser.email, id: existingUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({ data: existingUser, token });
  } catch (error) {
    console.error("Error in githubLogin:", error);
    res.status(500).json({ message: "Something went wrong during GitHub Login" });
  }
};

export const forgotPassword = async (req, res) => {
  const { emailOrPhone } = req.body;

  if (!emailOrPhone) {
    return res.status(400).json({ message: "Registered Email or Phone Number is required." });
  }

  try {
    const existingUser = await user.findOne({
      $or: [
        { email: emailOrPhone },
        { "billingDetails.phone": emailOrPhone }
      ]
    });

    if (!existingUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const today = new Date();
    if (existingUser.lastForgotPasswordRequest) {
      const lastRequestDate = new Date(existingUser.lastForgotPasswordRequest);
      if (
        today.getFullYear() === lastRequestDate.getFullYear() &&
        today.getMonth() === lastRequestDate.getMonth() &&
        today.getDate() === lastRequestDate.getDate()
      ) {
        return res.status(400).json({ message: "You can use this option only one time per day." });
      }
    }

    // Generate a random 10-character password using ONLY letters A-Z, a-z
    const plainPassword = generatePassword();

    // Hash the password with bcrypt (12 rounds)
    const hashedNewPassword = await bcrypt.hash(plainPassword, 12);

    // Save user state
    existingUser.password = hashedNewPassword;
    existingUser.lastForgotPasswordRequest = today;
    await existingUser.save();

    // Construct the email HTML body
    const mailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #f48225;">StackOverflow Clone</h2>
        </div>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; border: 1px solid #eee;">
          <h3 style="margin-top: 0; color: #333;">Password Reset Successful</h3>
          <p>Hello <strong>${existingUser.name}</strong>,</p>
          <p>We received a request to reset your password. A new password has been generated for you:</p>
          <div style="font-family: monospace; font-size: 20px; font-weight: bold; background-color: #fff; padding: 15px; text-align: center; letter-spacing: 2px; border: 1px solid #ddd; border-radius: 4px; margin: 20px 0; color: #2b2b2b;">
            ${plainPassword}
          </div>
          <p style="color: #c0392b; font-weight: bold;">Please copy this password. You should change it immediately after logging in.</p>
          <p>If you did not request this password reset, please secure your account immediately.</p>
        </div>
        <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 15px;">
          <p>&copy; 2026 StackOverflow Clone. All rights reserved.</p>
        </div>
      </div>
    `;

    // Save locally for verification
    const emailsDir = path.join(process.cwd(), "sent_emails");
    if (!fs.existsSync(emailsDir)) {
      fs.mkdirSync(emailsDir, { recursive: true });
    }
    const emailLogPath = path.join(emailsDir, `forgot-password-${existingUser._id}.html`);
    fs.writeFileSync(emailLogPath, mailHtml);
    console.log(`[Email Mock] Forgot password email preview written to: ${emailLogPath}`);

    // Set up Nodemailer transporter
    let transporter;
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.ethereal.email",
        port: parseInt(process.env.SMTP_PORT || "587", 10),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Auto-generate test SMTP credentials from ethereal.email if none are configured
      try {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        console.log(`[Email Mock] Created temporary Ethereal account: ${testAccount.user}`);
      } catch (err) {
        console.warn("[Email WARNING] Failed to create Ethereal test account:", err.message);
      }
    }

    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: '"StackOverflow Clone Support" <support@stackoverflowclone.com>',
          to: existingUser.email,
          subject: "[StackOverflow Clone] Password Reset Request",
          html: mailHtml,
        });
        console.log(`[Email Transporter] Forgot password mail sent successfully: ${info.messageId}`);
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log(`[Email Mock] View email preview at: ${previewUrl}`);
        }
      } catch (mailError) {
        console.warn(
          "[Email WARNING] SMTP delivery failed. Using saved local file preview instead. Error detail:",
          mailError.message
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Password reset email sent."
    });

  } catch (error) {
    console.error("Error in forgotPassword:", error);
    return res.status(500).json({ message: "Something went wrong.." });
  }
};
