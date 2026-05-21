const { sendWelcomeEmail, sendTaskCreatedEmail, sendTaskCompletedEmail } = require('./src/emails/account')

async function testEmails() {
    console.log('Testing email functionality...')

    try {
        // Test welcome email
        console.log('Sending welcome email...')
        await sendWelcomeEmail('gaurav9519826715@gmail.com', 'Test User')

        // Test task created email
        console.log('Sending task created email...')
        await sendTaskCreatedEmail('gaurav9519826715@gmail.com', 'Test User', 'Test task description')

        // Test task completed email
        console.log('Sending task completed email...')
        await sendTaskCompletedEmail('gaurav9519826715@gmail.com', 'Test User', 'Test task description', 2)

        console.log('All emails sent successfully!')
    } catch (error) {
        console.error('Error sending emails:', error)
    }
}

testEmails()