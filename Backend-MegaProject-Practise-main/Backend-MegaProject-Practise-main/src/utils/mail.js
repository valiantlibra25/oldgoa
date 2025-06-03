import mailgen from "mailgen";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config({
  path: "./.env",
});
//mailgen configurations
const sendMail = async (options) => {
  console.log("Starting email send process");
  console.log("SMTP Configuration:", {
    host: process.env.MAILTRAP_SMTP_HOST,
    port: process.env.MAILTRAP_SMTP_PORT,
    // Don't log actual credentials, just check if they exist
    hasUser: !!process.env.MAILTRAP_SMTP_USER,
    hasPassword: !!process.env.MAILTRAP_SMTP_PASSWORD,
  });
  const mailGenerator = new mailgen({
    theme: "default",
    product: {
      name: "Mailgen",
      link: "https://mailgen.js/",
    },
  });

  var emailText = mailGenerator.generatePlaintext(options.MailGenContent);

  var emailBody = mailGenerator.generate(options.MailGenContent);

  //Now use nodemailer to send an email

  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_SMTP_HOST,
    port: process.env.MAILTRAP_SMTP_PORT,
    secure: false, // true for port 465, false for other ports
    auth: {
      user: process.env.MAILTRAP_SMTP_USER,
      pass: process.env.MAILTRAP_SMTP_PASSWORD,
    },
  });

  const mail = {
    from: '"Harsshad from App 👻" <mail.teskmanager@example.com>', // sender address
    to: options.email, // list of receivers
    subject: options.subject, // Subject line
    text: emailText, // plain text body
    html: emailBody, // html body
  };

  try {
    console.log("Attempting to send email to:", options.email);
    const result = await transporter.sendMail(mail);
    console.log("Email sent successfully:", result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending email", error);
  }
};

//Factory method for email verification mail generator content
const emailVerificationMailGenContent = (username, verficationUrl) => {
  return {
    body: {
      name: username,
      intro: "Welcome to App! We're very excited to have you on board.",
      action: {
        instructions: "To get started with App, please click here:",
        button: {
          color: "#22BC66",
          text: "Verify your email account",
          link: verficationUrl,
        },
      },
      outro:
        "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};

const resendemailVerificationMailGenContent = (username, verficationUrl) => {
  return {
    body: {
      name: username,
      intro: "Welcome to App! Kindly verify your email.",
      action: {
        instructions: "To get started with App, please click here:",
        button: {
          color: "#22BC66",
          text: "Verify email reminder.",
          link: verficationUrl,
        },
      },
      outro:
        "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};

const forgotPasswordMailGenContent = (username, passwordResetUrl) => {
  return {
    body: {
      name: username,
      intro: "we got a request to rest your password",
      action: {
        instructions: "To get started with reset password, please click here:",
        button: {
          color: "#22BC66",
          text: "Click here to reset your account password",
          link: passwordResetUrl,
        },
      },
      outro:
        "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};

/* only for explaination
// create email for verify email
sendMail({
  email: user.email,
  subject: "Verify your email",
  MailGenContent: emailVerificationMailGenContent(username, ``),
});

// create email for reset password email
sendMail({
  email: user.email,
  subject: "Reset your password",
  MailGenContent: forgotPasswordMailGenContent(username, ``),
});

*/

export {
  sendMail,
  emailVerificationMailGenContent,
  forgotPasswordMailGenContent,
  resendemailVerificationMailGenContent,
};
