import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT ?? "587");
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM ?? "no-reply@cloudcue.app";

const hasSmtpConfig = Boolean(smtpHost && smtpUser && smtpPass);

const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    })
  : null;

export const sendPasswordResetEmail = async (payload: {
  to: string;
  userName: string;
  resetUrl: string;
}): Promise<void> => {
  if (!transporter) {
    console.warn(
      `SMTP is not configured. Password reset URL for ${payload.to}: ${payload.resetUrl}`
    );
    return;
  }

  await transporter.sendMail({
    from: smtpFrom,
    to: payload.to,
    subject: "Reset your CloudCue password",
    text: `Hi ${payload.userName},\n\nReset your password using this link:\n${payload.resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin: 0 0 12px;">Reset your CloudCue password</h2>
        <p style="margin: 0 0 12px;">Hi ${payload.userName},</p>
        <p style="margin: 0 0 16px;">Use the button below to reset your password:</p>
        <p style="margin: 0 0 16px;">
          <a href="${payload.resetUrl}" style="display: inline-block; padding: 10px 16px; background: #3D5387; color: #ffffff; text-decoration: none; border-radius: 8px;">Reset password</a>
        </p>
        <p style="margin: 0; font-size: 12px; color: #4B5563;">If you did not request this, you can ignore this email.</p>
      </div>
    `
  });
};
