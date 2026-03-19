const twilio = require('twilio');
const { MessageLog } = require("../models/Core");

const client = process.env.TWILIO_SID && process.env.TWILIO_TOKEN 
  ? twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN) 
  : null;

/**
 * Universal Unified Communication Service
 * First attempts WhatsApp, falls back to SMS on failure
 */
const sendNotification = async (to, body, relatedTo = null, relatedToType = "Other") => {
  if (!client) {
    console.error("❌ Communication Service: Twilio credentials missing in .env");
    return { status: "SIMULATED", message: "Live mode disabled without Twilio SID/TOKEN" };
  }

  // Ensure 'to' is in E.164 format (e.g., +9199...)
  const formattedTo = to.startsWith('+') ? to : `+91${to}`;

  let finalChannel = "WhatsApp";
  let finalStatus = "Pending";
  let messageSid = null;
  let errorMessage = null;

  try {
    // Stage 1: Attempt WhatsApp (Business Standard)
    const whatsappMsg = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886", // Twilio sandbox fallback
      to: `whatsapp:${formattedTo}`,
      body: body
    });

    finalStatus = "Sent";
    messageSid = whatsappMsg.sid;
    console.log(`✅ WhatsApp Sent to ${to}: ${whatsappMsg.sid}`);

  } catch (waError) {
    console.warn(`⚠️ WhatsApp Delivery Failed for ${to}, Triggering SMS Fallback...`);
    errorMessage = waError.message;

    try {
      // Stage 2: SMS Fallback (Twilio SMS)
      const smsMsg = await client.messages.create({
        from: process.env.TWILIO_SMS_FROM || "+12015550123",
        to: formattedTo,
        body: body
      });

      finalChannel = "SMS";
      finalStatus = "Sent";
      messageSid = smsMsg.sid;
      console.log(`✅ SMS Fallback Successful to ${to}: ${smsMsg.sid}`);

    } catch (smsError) {
      finalStatus = "Failed";
      errorMessage = `WA: ${waError.message} | SMS: ${smsError.message}`;
      console.error(`❌ Complete Communication Failure for ${to}: ${errorMessage}`);
    }
  }

  // Stage 3: Audit Logging in Database
  try {
    const log = new MessageLog({
      channel: finalChannel,
      to: formattedTo,
      body: body,
      status: finalStatus,
      sid: messageSid,
      error: errorMessage,
      relatedTo,
      relatedToType
    });
    await log.save();
  } catch (logErr) {
    console.error("Failed to save communication log:", logErr);
  }

  return { status: finalStatus, channel: finalChannel, sid: messageSid };
};

module.exports = { sendNotification };
