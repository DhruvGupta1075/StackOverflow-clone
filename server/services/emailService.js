import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import dns from "dns";

// Initialize nodemailer transporter
const getTransporter = async () => {
  console.log(`[Email Service] Checking SMTP config: SMTP_USER is ${process.env.SMTP_USER ? "Present" : "Missing"}, SMTP_PASS is ${process.env.SMTP_PASS ? "Present" : "Missing"}`);
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    // If SMTP_SECURE is explicitly set, use it. Otherwise, default to true only for port 465.
    const secure = process.env.SMTP_SECURE !== undefined
      ? process.env.SMTP_SECURE === "true"
      : (port === 465);

    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    let resolvedHost = host;

    // Force IPv4 resolution for smtp.gmail.com to bypass Render's broken IPv6 outbound routing
    if (host === "smtp.gmail.com") {
      try {
        console.log(`[Email Service] Resolving ${host} to IPv4...`);
        const ips = await dns.promises.resolve4(host);
        if (ips && ips.length > 0) {
          resolvedHost = ips[0];
          console.log(`[Email Service] Resolved ${host} to IPv4 address: ${resolvedHost}`);
        }
      } catch (dnsErr) {
        console.warn(`[Email Service] DNS IPv4 resolution failed for ${host}:`, dnsErr.message);
      }
    }

    return nodemailer.createTransport({
      host: resolvedHost,
      port: port,
      secure: secure,
      tls: {
        servername: host, // Ensure TLS certificate SNI validation passes
      },
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 6000,
      greetingTimeout: 6000,
      socketTimeout: 6000,
    });
  } else {
    try {
      console.log("[Email Service] SMTP credentials not set. Generating Ethereal test account...");
      const testAccount = await nodemailer.createTestAccount();
      console.log(`[Email Service] Ethereal account generated: ${testAccount.user}`);
      return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
        connectionTimeout: 6000,
        greetingTimeout: 6000,
        socketTimeout: 6000,
      });
    } catch (err) {
      console.error("[Email Service Error] Failed to initialize Ethereal transporter:", err.stack || err.message);
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
    console.error("[Email Service Mock] Failed to save mail locally:", err.stack || err.message);
  }
};

// Centralized generic sendEmail function with robust logging and REST API fallbacks
export const sendEmail = async ({ to, subject, html, fromName, fromEmail }) => {
  console.log(`[Email Service] Starting sendEmail to: ${to}, subject: "${subject}"`);
  
  // 1. Try Resend if RESEND_API_KEY is configured (Production-ready REST API fallback)
  if (process.env.RESEND_API_KEY) {
    console.log("[Email Service] Resend API key detected. Attempting delivery via Resend HTTPS API (Port 443)...");
    try {
      const fromField = fromName 
        ? `${fromName} <${fromEmail || "security@stackoverflowclone.com"}>` 
        : (fromEmail || "security@stackoverflowclone.com");
      
      const start = Date.now();
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromField,
          to: [to],
          subject: subject,
          html: html,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log(`[Email Service Success] Resend email dispatched in ${Date.now() - start}ms. ID: ${data.id}`);
        return { success: true, messageId: data.id };
      } else {
        console.error("[Email Service Error] Resend API rejected the request:", data);
        throw new Error(data.message || JSON.stringify(data));
      }
    } catch (apiErr) {
      console.error("[Email Service Warning] Resend API delivery failed, falling back. Error detail:", apiErr.stack || apiErr.message);
    }
  }

  // 2. Try SendGrid if SENDGRID_API_KEY is configured
  if (process.env.SENDGRID_API_KEY) {
    console.log("[Email Service] SendGrid API key detected. Attempting delivery via SendGrid HTTPS API (Port 443)...");
    try {
      const start = Date.now();
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: fromEmail || "security@stackoverflowclone.com", name: fromName },
          subject: subject,
          content: [{ type: "text/html", value: html }],
        }),
      });

      if (response.ok) {
        console.log(`[Email Service Success] SendGrid email dispatched in ${Date.now() - start}ms`);
        return { success: true };
      } else {
        const text = await response.text();
        console.error("[Email Service Error] SendGrid API rejected the request:", text);
        throw new Error(text);
      }
    } catch (apiErr) {
      console.error("[Email Service Warning] SendGrid API delivery failed, falling back. Error detail:", apiErr.stack || apiErr.message);
    }
  }

  // 3. Fallback to Nodemailer SMTP
  console.log("[Email Service] Falling back to Nodemailer SMTP...");
  try {
    const transporter = await getTransporter();
    if (!transporter) {
      throw new Error("Transporter initialization returned null");
    }

    console.log("[Email Service] Verifying SMTP connection...");
    const startVerify = Date.now();
    await transporter.verify();
    console.log(`[Email Service] SMTP transporter verified in ${Date.now() - startVerify}ms`);

    const fromHeader = fromName 
      ? `"${fromName}" <${fromEmail || process.env.SMTP_USER}>` 
      : (fromEmail || process.env.SMTP_USER);

    console.log(`[Email Service] Executing transporter.sendMail to ${to}...`);
    const startSend = Date.now();
    const info = await transporter.sendMail({
      from: fromHeader,
      to: to,
      subject: subject,
      html: html,
    });
    console.log(`[Email Service Success] SMTP email sent successfully to ${to} in ${Date.now() - startSend}ms. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (smtpErr) {
    console.error("[Email Service Error] SMTP transmission failed completely. Error details:", smtpErr.stack || smtpErr.message);
    return { success: false, error: smtpErr };
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

  // Save copy locally
  saveMailLocally(`otp-${email}-${Date.now()}.html`, mailHtml);

  return sendEmail({
    to: email,
    subject: "[StackOverflow Clone] New Device Verification OTP",
    html: mailHtml,
    fromName: "StackOverflow Clone Security",
    fromEmail: "security@stackoverflowclone.com",
  });
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

  // Save copy locally
  saveMailLocally(`alert-${email}-${Date.now()}.html`, mailHtml);

  return sendEmail({
    to: email,
    subject: "New Login to Your Code Quest Account",
    html: mailHtml,
    fromName: "StackOverflow Clone Security",
    fromEmail: "security@stackoverflowclone.com",
  });
};

export const sendForgotPasswordEmail = async (email, name, plainPassword) => {
  const mailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #f48225;">StackOverflow Clone</h2>
      </div>
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; border: 1px solid #eee;">
        <h3 style="margin-top: 0; color: #333;">Password Reset Successful</h3>
        <p>Hello <strong>${name}</strong>,</p>
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

  // Save copy locally
  saveMailLocally(`forgot-password-${email}-${Date.now()}.html`, mailHtml);

  return sendEmail({
    to: email,
    subject: "[StackOverflow Clone] Password Reset Request",
    html: mailHtml,
    fromName: "StackOverflow Clone Support",
    fromEmail: "support@stackoverflowclone.com",
  });
};

export const sendLanguageVerificationEmail = async (email, name, otp, otpExpiry) => {
  const mailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #f48225;">Code Quest Support</h2>
      </div>
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; border: 1px solid #eee;">
        <h3 style="margin-top: 0; color: #333;">Language Change Verification</h3>
        <p>Hello <strong>${name}</strong>,</p>
        <p>We received a request to change your preferred language on Code Quest to <strong>French (fr)</strong>.</p>
        <p>Please use the following One-Time Password (OTP) to verify this change:</p>
        <div style="font-family: monospace; font-size: 24px; font-weight: bold; background-color: #fff; padding: 15px; text-align: center; letter-spacing: 4px; border: 1px solid #ddd; border-radius: 4px; margin: 20px 0; color: #2b2b2b;">
          ${otp}
        </div>
        <p>This OTP is valid for <strong>5 minutes</strong> (Expires at ${new Date(otpExpiry).toLocaleTimeString()}) and can only be used once.</p>
        <p style="color: #e74c3c; font-weight: bold;">Security Warning: If you did not request this language change, please ignore this email and secure your account immediately.</p>
      </div>
      <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 15px;">
        <p>&copy; 2026 Code Quest. All rights reserved.</p>
      </div>
    </div>
  `;

  // Save copy locally
  saveMailLocally(`language-change-${email}-${Date.now()}.html`, mailHtml);

  return sendEmail({
    to: email,
    subject: "Language Change Verification",
    html: mailHtml,
    fromName: "Code Quest Support",
    fromEmail: "support@codequest.com",
  });
};
