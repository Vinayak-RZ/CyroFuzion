import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,       
    pass: process.env.EMAIL_PASSWORD,   
  },
});

/**
 * Sends an OTP to the specified email address.
 * @param {string} email - The recipient's email.
 * @param {string} otp - The OTP code to send.
 */
export const sendOtpToEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'CryoFuzion blockchain OTP for login verification',
    text: `Your One-Time Password (OTP) is: ${otp}. It will expire in 5 minutes.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}`);
  } catch (err) {
    console.error(`Failed to send OTP to ${email}:`, err);
    throw new Error('Failed to send OTP email');
  }
};
