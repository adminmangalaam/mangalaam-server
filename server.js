const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many requests. Try later.",
});
app.use("/contact", contactLimiter);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.post("/api/contact", async (req, res) => {
  const { name, email, subject, message, captchaToken } = req.body;

  const verifyUrl = `https://www.google.com/recaptcha/api/siteverify`;
  const response = await axios.post(verifyUrl, null, {
    params: {
      secret:
        app.get("env") === "production"
          ? process.env.RECAPTCHA_SECRET_KEY_PROD
          : process.env.RECAPTCHA_SECRET_KEY_DEV,
      response: captchaToken,
    },
  });

  if (!response.data.success) {
    return res.status(400).json({ message: "Captcha failed" });
  }

  try {
    const mailOptions = {
      from: email,
      to: process.env.EMAIL_USER,
      subject: `Contact Form: ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    };

    await transporter.sendMail(mailOptions);
    return res
      .status(200)
      .json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to send email" });
  }
  // Make sure none of these checks are throwing a 403
  res.status(200).json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
