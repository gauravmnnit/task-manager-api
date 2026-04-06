const sgMail = require('@sendgrid/mail')

let sendgridEnabled = false
if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.startsWith('SG.')) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    sendgridEnabled = true
} else {
    console.warn('SendGrid API key not set or invalid. Email sending is disabled.')
}

const getFromEmail = () => process.env.FROM_EMAIL || 'no-reply@example.com'

const sendWelcomeEmail = async (email, name) => {
    if (!sendgridEnabled) {
        console.log(`Skipping welcome email to ${email} (SendGrid disabled)`)
        return
    }

    try {
        await sgMail.send({
            to: email,
            from: getFromEmail(),
            subject: 'Thanks for joining in!',
            text: `Welcome to the app, ${name}. Let me know how you get along with the app.`
        })
    } catch (err) {
        console.error('Failed to send welcome email:', err && err.message ? err.message : err)
    }
}

const sendByeEmail = async (email, name) => {
    if (!sendgridEnabled) {
        console.log(`Skipping goodbye email to ${email} (SendGrid disabled)`)
        return
    }

    try {
        await sgMail.send({
            to: email,
            from: getFromEmail(),
            subject: 'How was your exp ?',
            text: `Hope you are doing good ${name}. Can you give some time to send your feedback.`
        })
    } catch (err) {
        console.error('Failed to send goodbye email:', err && err.message ? err.message : err)
    }
}

module.exports = {
    sendWelcomeEmail,
    sendByeEmail
}
