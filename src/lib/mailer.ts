import nodemailer from 'nodemailer';

// รหัสสำหรับล็อกอิน Gmail ส่งอีเมล
const SMTP_EMAIL = process.env.SMTP_EMAIL || '';
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || ''; // **App Password Gmail (16 หลัก)**

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: SMTP_EMAIL,
    pass: SMTP_PASSWORD,
  },
});

export const sendOtpEmail = async (toEmail: string, otpCode: string) => {
  if (!SMTP_EMAIL || !SMTP_PASSWORD) {
    console.warn("⚠️ ไม่ได้ตั้งค่าบัญชี SMTP_EMAIL หรือ SMTP_PASSWORD สำหรับการส่งอีเมล รหัสชั่วคราวของคุณคือ: ", otpCode);
    return;
  }

  const mailOptions = {
    from: `"Factory Sim Admin" <${SMTP_EMAIL}>`,
    to: toEmail,
    subject: `Your Login OTP Code: ${otpCode}`,
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 30px; background-color: #f6f8fb; border-radius: 10px;">
        <h2 style="color: #34495e;">Factory Simulation Login</h2>
        <p style="font-size: 16px; color: #555;">รหัสยืนยันการเข้าสู่ระบบแบบ 2 ชั้นของคุณคือ:</p>
        <div style="font-size: 32px; font-weight: bold; padding: 20px; color: #1594dd; letter-spacing: 5px;">
          ${otpCode}
        </div>
        <p style="font-size: 14px; text-align: center; color: #888;">รหัสนี้จะหมดอายุภายใน 5 นาที</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`ส่ง OTP ไปยัง ${toEmail} แล้ว`);
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการส่งอีเมล:", error);
    throw new Error("SEND_EMAIL_FAILED");
  }
};
