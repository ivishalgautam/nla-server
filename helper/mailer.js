require("dotenv").config();
let nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "vishal.gautam.5812@gmail.com",
    pass: process.env.GMAIL_PASS,
  },
});

function send(mailOptions) {
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      return console.error(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}

async function sendEmail(email, username, password) {
  let mailOptions = {
    from: process.env.MAIL_ID,
    to: email,
    subject: "NLA Credentials",
    html: `
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f2f2f2; text-align: center;">
        <h1 style="color: #3498db;">NLA ACADEMY</h1>
        <p style="margin-top: 20px;">
          Your username and password are below:
          <div>
            Your username is: ${username}
          </div>
          <div>
            Your password is: ${password}
          </div>
        </p>
        <a href="http://nlaacademy.in/auth/login/student" style="display: inline-block; padding: 10px 20px; background-color: #3498db; color: #ffffff; text-decoration: none; border-radius: 5px; margin-top: 20px;">Login to NLA Academy</a>
      </body>
    </html>
    `,
  };

  send(mailOptions);
}

async function sendResetPasswordMail(email, link) {
  let mailOptions = {
    from: process.env.MAIL_ID,
    to: email,
    subject: "NLA Reset Password",
    html: `
    <h1>NLA ACADEMY</h1>
    <p>
      Your reset password link:
    </p> 
    <a style="border-radius:8px; padding:4px 12px; background-color:red" href='${link}'>Reset password</a>
    `,
  };
  send(mailOptions);
}

async function sendQueryEmail(studentId, studentName, testId, testName) {
  let mailOptions = {
    from: process.env.MAIL_ID,
    to: "vishal.gautam.5812@gmail.com",
    subject: "Student olympiad test query",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Student Table</title>
      </head>
      <body>
      <h1 style="text-align:center;">Olympiad test query</h1>
        <table style="border-collapse: collapse; width: 100%; margin: 20px;">
          <thead>
            <tr>
              <th style="background-color: #f2f2f2; padding: 10px; text-align: left; border: 1px solid #ddd;">Student Name</th>
              <th style="background-color: #f2f2f2; padding: 10px; text-align: left; border: 1px solid #ddd;">Test Name</th>
            </tr>
          </thead>
          <tbody>
            <!-- Add table rows with data here -->
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">${studentName}</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${testName}</td>
            </tr>
            <!-- Add more rows with data here if needed -->
          </tbody>
        </table>
        <a style="text-align:center; display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 20px; width: 100%;"  href="http:/nlaacademy.in/auth/login/admin?callback=http:/nlaacademy.in/admin/students/update/${studentId}">Assign test</a>
      </body>
      </html>
    `,
  };
  send(mailOptions);
}

module.exports = { sendEmail, sendResetPasswordMail, sendQueryEmail };
