// sendMail.js

import nodemailer from "nodemailer";
import transporter from "./testAccount.js";

const sendMail = async (mail) => {
  try {
    const info = await transporter.sendMail(mail);

    console.log("Message sent:", info.messageId);

    return {
      status: 200,
      previewURL: nodemailer.getTestMessageUrl(info),
    };
  } catch (err) {
    console.error(err);
    return { status: 400, message: "Error sending the mail" };
  }
};

export default sendMail;
