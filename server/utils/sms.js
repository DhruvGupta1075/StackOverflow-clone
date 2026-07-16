import twilio from "twilio";

export const sendRealSMS = async (to, body) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !from) {
    console.warn("[Twilio SMS SDK] Missing Twilio credentials. Falling back to local file logging.");
    return false;
  }

  try {
    const client = twilio(accountSid, authToken);
    await client.messages.create({ to, from, body });
    console.log(`[Twilio SMS SDK] OTP successfully sent via SMS to ${to}`);
    return true;
  } catch (err) {
    console.error("[Twilio SMS SDK ERROR] Failed to send SMS via Twilio:", err.message);
    throw err;
  }
};
