const brevo = require('@getbrevo/brevo');

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
const sender = {
  email: process.env.BREVO_SENDER_EMAIL,
  name: "Event Registration System"
};

const sendConfirmationEmail = async (to, name, registrationId, eventName) => {
  try {
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = `Registration Confirmed - ${eventName}`;
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #4F46E5;">Registration Confirmed!</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your payment has been successfully verified, and your registration for <strong>${eventName}</strong> is now confirmed.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #6b7280; text-transform: uppercase;">Your Registration ID</p>
          <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; font-family: monospace; color: #111827;">${registrationId}</p>
        </div>
        <p>A QR code for entry will be sent to you exactly 1 day before the event. Please keep it handy!</p>
        <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">Thank you,<br/>The Event Team</p>
      </div>
    `;
    sendSmtpEmail.sender = sender;
    sendSmtpEmail.to = [{ email: to, name }];

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('[EmailService] Confirmation email sent successfully. ID:', data.messageId);
    return true;
  } catch (error) {
    console.error('[EmailService] Error sending confirmation email:');
    if (error.response && error.response.text) {
      console.error('Brevo API Response Body:', error.response.text);
    } else {
      console.error(error.message);
    }
    return false;
  }
};

const sendRejectionEmail = async (to, name, eventName, reason) => {
  try {
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = `Action Required: Registration Issue - ${eventName}`;
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #DC2626;">Registration Issue</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>There was an issue verifying your payment for <strong>${eventName}</strong>.</p>
        ${reason ? `<div style="background-color: #fee2e2; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0;"><p style="margin: 0; color: #991b1b;"><strong>Reason provided:</strong> ${reason}</p></div>` : ''}
        <p>Please contact the event organizers for further assistance or to resolve this issue.</p>
        <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">Thank you,<br/>The Event Team</p>
      </div>
    `;
    sendSmtpEmail.sender = sender;
    sendSmtpEmail.to = [{ email: to, name }];

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('[EmailService] Rejection email sent successfully. ID:', data.messageId);
    return true;
  } catch (error) {
    console.error('[EmailService] Error sending rejection email:');
    if (error.response && error.response.text) {
      console.error('Brevo API Response Body:', error.response.text);
    } else {
      console.error(error.message);
    }
    return false;
  }
};
const sendQRCodeEmail = async (to, name, registrationId, eventName, qrCodeFilePath) => {
  try {
    const fs = require('fs');
    const path = require('path');

    // Read the file and convert to base64
    // Replace leading slash so it's not treated as an absolute path root on Windows
    const relativeQrPath = qrCodeFilePath.replace(/^[\/\\]/, '');
    const absolutePath = path.join(__dirname, '..', relativeQrPath);
    let attachmentBase64 = '';

    if (fs.existsSync(absolutePath)) {
      const fileData = fs.readFileSync(absolutePath);
      attachmentBase64 = fileData.toString('base64');
    } else {
      console.error(`[EmailService] QR code file not found at ${absolutePath}`);
      return false;
    }

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = `Your Entry Pass for ${eventName}`;
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #4F46E5;">Your Entry Pass is Here!</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your event <strong>${eventName}</strong> is coming up soon!</p>
        <p>Attached to this email is your secure QR code entry pass. Please download it or keep this email handy to show at the entrance.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #6b7280; text-transform: uppercase;">Registration ID</p>
          <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; font-family: monospace; color: #111827;">${registrationId}</p>
        </div>
        <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">See you soon,<br/>The Event Team</p>
      </div>
    `;
    sendSmtpEmail.sender = sender;
    sendSmtpEmail.to = [{ email: to, name }];

    // Add attachment
    sendSmtpEmail.attachment = [
      {
        content: attachmentBase64,
        name: `entry-pass-${registrationId}.png`,
        type: 'image/png'
      }
    ];

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('[EmailService] QR Code email sent successfully. ID:', data.messageId);
    return true;
  } catch (error) {
    console.error('[EmailService] Error sending QR Code email:');
    if (error.response && error.response.text) {
      console.error('Brevo API Response Body:', error.response.text);
    } else {
      console.error(error.message);
    }
    return false;
  }
};

module.exports = {
  sendConfirmationEmail,
  sendRejectionEmail,
  sendQRCodeEmail
};
