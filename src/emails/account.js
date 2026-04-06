const sgMail = require('@sendgrid/mail')

let sendgridEnabled = false
if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.startsWith('SG.')) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    sendgridEnabled = true
    console.log('✅ SendGrid is enabled and configured')
} else {
    console.warn('❌ SendGrid API key not set or invalid. Email sending is disabled.')
    console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'Set (hidden)' : 'Not set')
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

const sendTaskCreatedEmail = async (email, name, taskDescription) => {
    if (!sendgridEnabled) {
        console.log(`Skipping task created email to ${email} (SendGrid disabled)`)
        return
    }

    try {
        await sgMail.send({
            to: email,
            from: getFromEmail(),
            subject: 'New Task Created - Task Manager',
            text: `Hi ${name},\n\nYou've successfully created a new task: "${taskDescription}"\n\nKeep up the great work!\n\nBest regards,\nTask Manager Team`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4F46E5;">New Task Created! 🎯</h2>
                    <p>Hi ${name},</p>
                    <p>You've successfully created a new task:</p>
                    <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4F46E5;">
                        <strong>${taskDescription}</strong>
                    </div>
                    <p>Keep up the great work staying organized!</p>
                    <p style="color: #6B7280; font-size: 14px;">Best regards,<br>Task Manager Team</p>
                </div>
            `
        })
    } catch (err) {
        console.error('Failed to send task created email:', err && err.message ? err.message : err)
    }
}

const sendTaskCompletedEmail = async (email, name, taskDescription, completionTime) => {
    if (!sendgridEnabled) {
        console.log(`Skipping task completed email to ${email} (SendGrid disabled)`)
        return
    }

    const timeText = completionTime
        ? `You completed this task in ${completionTime} ${completionTime === 1 ? 'day' : 'days'}!`
        : 'Task completed successfully!'

    try {
        await sgMail.send({
            to: email,
            from: getFromEmail(),
            subject: 'Task Completed - Great Job! 🎉',
            text: `Congratulations ${name}!\n\nYou've completed the task: "${taskDescription}"\n\n${timeText}\n\nKeep up the momentum!\n\nBest regards,\nTask Manager Team`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #10B981;">Task Completed! 🎉</h2>
                    <p>Congratulations ${name}!</p>
                    <p>You've successfully completed:</p>
                    <div style="background: #ECFDF5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
                        <strong style="text-decoration: line-through; color: #6B7280;">${taskDescription}</strong>
                    </div>
                    ${completionTime ? `<p style="color: #059669; font-weight: bold;">${timeText}</p>` : ''}
                    <p>Keep up the momentum and stay productive!</p>
                    <p style="color: #6B7280; font-size: 14px;">Best regards,<br>Task Manager Team</p>
                </div>
            `
        })
    } catch (err) {
        console.error('Failed to send task completed email:', err && err.message ? err.message : err)
    }
}

const sendWelcomeEmailOnRegistration = async (email, name) => {
    if (!sendgridEnabled) {
        console.log(`Skipping welcome email to ${email} (SendGrid disabled)`)
        return
    }

    try {
        await sgMail.send({
            to: email,
            from: getFromEmail(),
            subject: 'Welcome to Task Manager! 🚀',
            text: `Welcome ${name}!\n\nThank you for joining Task Manager. Start organizing your tasks and boost your productivity!\n\nGet started by creating your first task.\n\nBest regards,\nTask Manager Team`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4F46E5;">Welcome to Task Manager! 🚀</h2>
                    <p>Hi ${name},</p>
                    <p>Thank you for joining Task Manager! We're excited to help you stay organized and productive.</p>
                    <div style="background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                        <h3 style="margin: 0; font-size: 18px;">Get Started Today!</h3>
                        <p style="margin: 10px 0 0 0; opacity: 0.9;">Create your first task and start building better habits.</p>
                    </div>
                    <p>Ready to boost your productivity? Let's get started!</p>
                    <p style="color: #6B7280; font-size: 14px;">Best regards,<br>Task Manager Team</p>
                </div>
            `
        })
    } catch (err) {
        console.error('Failed to send welcome email:', err && err.message ? err.message : err)
    }
}

module.exports = {
    sendWelcomeEmail: sendWelcomeEmailOnRegistration,
    sendByeEmail,
    sendTaskCreatedEmail,
    sendTaskCompletedEmail
}
