import logging

import requests

from app.config import settings

logger = logging.getLogger("app.email")

EMAILJS_URL = "https://api.emailjs.com/api/v1.0/email/send"


class EmailService:
    """Sends transactional email via EmailJS, relayed through a connected Gmail
    account (no domain verification, no recipient restriction). Falls back to
    console logging if not configured."""

    def _ready(self, template_id: str) -> bool:
        return bool(
            settings.emailjs_service_id and settings.emailjs_public_key and template_id
        )

    def _send(self, template_id: str, to: str, log_subject: str, template_params: dict) -> None:
        if not self._ready(template_id):
            logger.info(
                "EMAIL (console fallback) to=%s subject=%s\nparams=%s",
                to,
                log_subject,
                template_params,
            )
            return
        try:
            payload = {
                "service_id": settings.emailjs_service_id,
                "template_id": template_id,
                "user_id": settings.emailjs_public_key,
                "template_params": template_params,
            }
            if settings.emailjs_private_key:
                payload["accessToken"] = settings.emailjs_private_key

            response = requests.post(EMAILJS_URL, json=payload, timeout=10)
            response.raise_for_status()
        except requests.RequestException:
            logger.exception("Failed to send email to=%s subject=%s", to, log_subject)

    def send_prospect_confirmation(self, to: str, first_name: str) -> None:
        self._send(
            template_id=settings.emailjs_prospect_template_id,
            to=to,
            log_subject="We received your application",
            template_params={
                "to_email": to,
                "to_name": first_name,
                "first_name": first_name,
            },
        )

    def send_attorney_notification(
        self, to: str, first_name: str, last_name: str, email: str, lead_id: str
    ) -> None:
        self._send(
            template_id=settings.emailjs_attorney_template_id,
            to=to,
            log_subject="New lead submitted",
            template_params={
                "to_email": to,
                "first_name": first_name,
                "last_name": last_name,
                "lead_email": email,
                "dashboard_url": f"{settings.frontend_url}/attorney/leads/{lead_id}",
            },
        )

    def send_password_reset(self, to: str, full_name: str, reset_token: str) -> None:
        self._send(
            template_id=settings.emailjs_reset_password_template_id,
            to=to,
            log_subject="Reset your password",
            template_params={
                "to_email": to,
                "to_name": full_name,
                "reset_url": f"{settings.frontend_url}/reset-password?token={reset_token}",
            },
        )


email_service = EmailService()
