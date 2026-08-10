const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendOtpEmail = async (toEmail, otpCode, driverName) => {
    try {
        const mailOptions = {
            from: `FlowLink <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: "Verify your FlowLink account",
            text: `Hi ${driverName || "there"},\n\nYour verification code is: ${otpCode}\n\nIt expires in 10 minutes.\n\nThanks,\nFlowLink`,
            html: `<p>Hi ${driverName || "there"},</p>
<p>Your verification code is:</p>
<h1 style="letter-spacing:4px;color:#333;">${otpCode}</h1>
<p>It expires in 10 minutes.</p>
<p>Thanks,<br>FlowLink</p>`
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ [GMAIL SENT] OTP to ${toEmail} | ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (err) {
        console.error("❌ [GMAIL ERROR]", err.message);
        return { success: false, error: err.message };
    }
};

module.exports = { sendOtpEmail };
