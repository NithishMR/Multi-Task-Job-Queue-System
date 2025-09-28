import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false, // use TLS
  auth: {
    user: "pascale.mohr@ethereal.email",
    pass: "vJTMjgMZXb9XSf1V9Q",
  },
});
export default transporter;
