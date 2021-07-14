const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name)=>{
    sgMail.send({
        to: email,
        from: 'gaurav9519826715@gmail.com',
        subject: 'Thanks for joining in!',
        text:  `Welcome to the app, ${name}. Let me know how you get along with the app.`
    })
}

const sendByeEmail = (email, name)=>{
    sgMail.send({
        to: email,
        from: 'gaurav9519826715@gmail.com',
        subject: 'How was your exp ?',
        text : `Hope you are doing good ${name}. Can you give some time to send your feedback.`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendByeEmail
}
