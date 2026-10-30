"""
Mock email sender. In a real production system this would integrate with
SendGrid/SES/SMTP. Here we log the "sent" email so the reset flow is fully
testable without external dependencies.
"""
from flask import current_app


def send_mock_email(to_address, subject, body):
    current_app.logger.info(
        "MOCK EMAIL SENT | From: %s | To: %s | Subject: %s | Body: %s",
        current_app.config["MAIL_SENDER"],
        to_address,
        subject,
        body,
    )
    return True


def send_password_reset_email(to_address, reset_token):
    subject = "PeerSkillSwap - Password Reset Request"
    body = (
        f"Use the following token to reset your password: {reset_token}\n"
        f"This token expires in 30 minutes."
    )
    return send_mock_email(to_address, subject, body)
