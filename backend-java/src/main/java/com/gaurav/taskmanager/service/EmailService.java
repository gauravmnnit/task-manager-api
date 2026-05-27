package com.gaurav.taskmanager.service;

import com.sendgrid.Method;
import com.sendgrid.Request;
import com.sendgrid.SendGrid;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Value("${app.sendgrid.apikey:}") private String apiKey;
    @Value("${app.from-email:no-reply@example.com}") private String fromEmail;

    public void sendWelcomeEmail(String toEmail, String name) {
        send(toEmail, "Welcome to Task Manager, " + name + "!",
             "Hi " + name + ",\n\nThanks for joining Task Manager. Let us know if you have any questions!\n\nThe Task Manager Team");
    }

    public void sendByeEmail(String toEmail, String name) {
        send(toEmail, "Sorry to see you go, " + name,
             "Hi " + name + ",\n\nYour account has been deleted. We hope to see you again!\n\nThe Task Manager Team");
    }

    public void sendTaskCreatedEmail(String toEmail, String name, String taskDescription) {
        send(toEmail, "Task Created: " + taskDescription,
             "Hi " + name + ",\n\nYour task \"" + taskDescription + "\" has been created successfully.\n\nThe Task Manager Team");
    }

    public void sendTaskCompletedEmail(String toEmail, String name, String taskDescription, Double completionDays) {
        String time = completionDays != null ? " in " + completionDays + " days" : "";
        send(toEmail, "Task Completed: " + taskDescription,
             "Hi " + name + ",\n\nGreat job! You completed \"" + taskDescription + "\"" + time + ".\n\nThe Task Manager Team");
    }

    private void send(String toEmail, String subject, String body) {
        if (apiKey == null || apiKey.isBlank()) {
            log.info("[EMAIL no-op] To: {} | Subject: {}", toEmail, subject);
            return;
        }
        try {
            Mail mail = new Mail(new Email(fromEmail), subject, new Email(toEmail), new Content("text/plain", body));
            SendGrid sg = new SendGrid(apiKey);
            Request req = new Request();
            req.setMethod(Method.POST);
            req.setEndpoint("mail/send");
            req.setBody(mail.build());
            sg.api(req);
        } catch (Exception e) {
            log.error("SendGrid error: {}", e.getMessage());
        }
    }
}
