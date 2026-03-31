const express = require("express");
const axios = require("axios");
const cors = require("cors");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3005;

const allowedOrigins = [
  "https://mangalaam.co.in",
  "https://www.mangalaam.co.in",
  "http://www.mangalaam.co.in",
  "http://localhost:5173", // or your local dev port
];

app.use(
  cors({
    origin: function (origin, callback) {
      console.log("Request Origin:", origin);
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
  }),
);

app.options("*", cors());
app.use(express.json());

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many requests. Try later.",
});
app.use("/api/contact", contactLimiter);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.get("/", (req, res) => {
  res.send("Mangalaam Global API is running.");
});

app.post("/api/contact", async (req, res) => {
  const { name, email, subject, message, captchaValue } = req.body;
  console.log("Received contact form submission:");
  const verifyUrl = `https://www.google.com/recaptcha/api/siteverify`;
  const response = await axios.post(verifyUrl, null, {
    params: {
      secret:
        app.get("env") === "production"
          ? process.env.RECAPTCHA_SECRET_KEY_PROD
          : process.env.RECAPTCHA_SECRET_KEY_DEV,
      response: captchaValue,
    },
  });

  if (!response.data.success) {
    return res.status(400).json({ message: "Captcha failed" });
  }

  try {
    const mailOptions = {
      from: email,
      to: process.env.EMAIL_USER,
      subject: `Enquiry from website contact form: ${subject}`,
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
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
