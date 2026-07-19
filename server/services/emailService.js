import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

// Initialize nodemailer transporter
const getTransporter = async () => {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "465", 10),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    try {
      const testAccount = await nodemailer.createTestAccount();
      return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (err) {
      console.warn("[Email Service] Failed to initialize Ethereal transporter:", err.message);
      return null;
    }
  }
};

// Helper to save mail locally for manual verification
const saveMailLocally = (fileName, htmlContent) => {
  try {
    const emailsDir = path.join(process.cwd(), "sent_emails");
    if (!fs.existsSync(emailsDir)) {
      fs.mkdirSync(emailsDir, { recursive: true });
    }
    const filePath = path.join(emailsDir, fileName);
    fs.writeFileSync(filePath, htmlContent);
    console.log(`[Email Service Mock] Mail preview saved to: ${filePath}`);
  } catch (err) {
    console.error("[Email Service Mock] Failed to save mail locally:", err.message);
  }
};

export const sendOtpEmail = async (email, name, otpCode) => {
  const mailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #f48225;">StackOverflow Clone Security</h2>
      </div>
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; border: 1px solid #eee;">
        <h3 style="margin-top: 0; color: #333;">New Device Verification Code</h3>
        <p>Hello <strong>${name}</strong>,</p>
        <p>You are attempting to log in from a new or unrecognized device. Please use the following verification code to complete your login. This code is valid for 5 minutes:</p>
        <div style="font-family: monospace; font-size: 24px; font-weight: bold; background-color: #fff; padding: 15px; text-align: center; letter-spacing: 4px; border: 1px solid #ddd; border-radius: 4px; margin: 20px 0; color: #2b2b2b;">
          ${otpCode}
        </div>
        <p style="color: #e74c3c; font-weight: bold;">If you did not request this login, please change your password and secure your account immediately.</p>
      </div>
      <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 15px;">
        <p>&copy; 2026 StackOverflow Clone. All rights reserved.</p>
      </div>
    </div>
  `;

  // Log locally
  saveMailLocally(`otp-${email}-${Date.now()}.html`, mailHtml);

  // Send mail
  try {
    const transporter = await getTransporter();
    if (transporter) {
      await transporter.sendMail({
        from: '"StackOverflow Clone Security" <security@stackoverflowclone.com>',
        to: email,
        subject: "[StackOverflow Clone] New Device Verification OTP",
        html: mailHtml,
      });
      console.log(`[Email Service] OTP email sent successfully to ${email}`);
    }
  } catch (error) {
    console.error(`[Email Service Error] Failed to send OTP email to ${email}:`, error.message);
  }
};

export const sendNewDeviceAlertEmail = async (email, name, sessionDetails) => {
  const { browser, operatingSystem, deviceType, ipAddress, location, timestamp } = sessionDetails;

  const mailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #f48225;">StackOverflow Clone Security Alert</h2>
      </div>
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; border: 1px solid #eee;">
        <h3 style="margin-top: 0; color: #d9534f;">New Login to Your Code Quest Account</h3>
        <p>Hello <strong>${name}</strong>,</p>
        <p>We detected a successful login to your account from a new or unrecognized device:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <tr>
            <td style="padding: 6px 0; font-weight: bold; width: 120px;">Date/Time:</td>
            <td style="padding: 6px 0;">${new Date(timestamp).toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">Browser:</td>
            <td style="padding: 6px 0;">${browser}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">Operating System:</td>
            <td style="padding: 6px 0;">${operatingSystem}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">Device Type:</td>
            <td style="padding: 6px 0;">${deviceType}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">IP Address:</td>
            <td style="padding: 6px 0;">${ipAddress}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">Location:</td>
            <td style="padding: 6px 0;">${location}</td>
          </tr>
        </table>
        <p style="background-color: #fff9e6; border-left: 4px solid #f0ad4e; padding: 12px; font-size: 14px; color: #66512c;">
          If this was you, no action is required. If you do not recognize this activity, secure your account and revoke the session immediately under your Profile Security settings.
        </p>
      </div>
      <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 15px;">
        <p>&copy; 2026 StackOverflow Clone. All rights reserved.</p>
      </div>
    </div>
  `;

  // Log locally
  saveMailLocally(`alert-${email}-${Date.now()}.html`, mailHtml);

  // Send mail
  try {
    const transporter = await getTransporter();
    if (transporter) {
      await transporter.sendMail({
        from: '"StackOverflow Clone Security" <security@stackoverflowclone.com>',
        to: email,
        subject: "New Login to Your Code Quest Account",
        html: mailHtml,
      });
      console.log(`[Email Service] Login alert email sent successfully to ${email}`);
    }
  } catch (error) {
    console.error(`[Email Service Error] Failed to send login alert email to ${email}:`, error.message);
  }
};
