import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from core.config import settings
import logging

logger = logging.getLogger(__name__)


async def send_email(to: str, subject: str, body: str, html: bool = False):
    """Send email using SMTP"""
    try:
        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            logger.warning("SMTP credentials not configured, skipping email")
            return False
        
        msg = MIMEMultipart()
        msg['From'] = settings.EMAIL_FROM
        msg['To'] = to
        msg['Subject'] = subject
        
        if html:
            msg.attach(MIMEText(body, 'html'))
        else:
            msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        logger.info(f"Email sent successfully to {to}")
        return True
    except Exception as e:
        logger.error(f"Error sending email: {str(e)}")
        return False


async def send_club_registration_notification(club_name: str, club_email: str, club_city: str, club_country: str):
    """Send notification email to owner when a new club registers"""
    subject = f"🎾 Nuevo Club Registrado: {club_name}"
    
    body = f"""
    <html>
    <body>
        <h2>Nuevo Club Pendiente de Activación</h2>
        <p>Se ha registrado un nuevo club en Nexasist:</p>
        <ul>
            <li><strong>Nombre:</strong> {club_name}</li>
            <li><strong>Email:</strong> {club_email}</li>
            <li><strong>Ciudad:</strong> {club_city}</li>
            <li><strong>País:</strong> {club_country}</li>
        </ul>
        <p>Por favor, ingresa al Owner Panel para revisar y activar este club.</p>
        <p><a href="https://nexasist.com/owner-panel">Ir al Owner Panel</a></p>
        <p>Gracias,<br>Equipo Nexasist</p>
    </body>
    </html>
    """
    
    return await send_email(settings.OWNER_EMAIL, subject, body, html=True)
