import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/db.js";
import transporter from "./mailtransporter.js";

export const setPassword = async (req, res) => {
  const { token, password } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dutyledger_jwt_super_secret_key_2026");

    const user = await prisma.user.findFirst({
      where: { email: decoded.email },
    });

    if (!user || user.passwordSetToken !== token || (user.tokenExpiry && new Date() > new Date(user.tokenExpiry))) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashed = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        passwordSetToken: null,
        tokenExpiry: null,
      },
    });

    res.status(200).json({ message: "Password set successfully. You can now log in." });
  } catch (err) {
    res.status(400).json({ message: "Invalid token", error: err.message });
  }
};

export const sendWelcomeMail = async (req, res) => {
  const { email, name, token } = req.body;

  try {
    const link = `${process.env.FRONTEND_URL || "http://localhost:3100"}/set-password?token=${token}`;

    await transporter.sendMail({
      from: `"Lucent PolySystems Pvt. Ltd." <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: "Welcome to Lucent PolySystems – Set Your Password",
      html: `
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your account has been created at <strong>Lucent PolySystems Pvt. Ltd.</strong></p>
        <p>Click the link below to set your password (valid for 1 hour):</p>
        <a href="${link}">${link}</a>
        <br /><br />
        <p>Best regards,<br><strong>Lucent PolySystems Pvt. Ltd. HR Team</strong></p>
      `,
    });

    res.status(200).json({ message: "Email sent successfully" });
  } catch (err) {
    console.error("Email error:", err.message);
    res.status(500).json({ message: "Failed to send email", error: err.message });
  }
};

export default { setPassword, sendWelcomeMail };
