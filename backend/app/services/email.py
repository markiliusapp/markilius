import resend
from datetime import date
from typing import List
import os
from dotenv import load_dotenv

load_dotenv()


def _init():
    resend.api_key = os.getenv("RESEND_API_KEY")
    return os.getenv("MAIL_FROM", "noreply@markilius.com")


async def send_password_reset_email(email: str, reset_token: str):
    MAIL_FROM = _init()
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    reset_link = f"{frontend_url}/reset-password?token={reset_token}"

    html_body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #f97316; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="color: white; margin: 0;">Markilius</h1>
                </div>
                <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
                    <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
                    <p>You requested to reset your password. Click the button below to set a new password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_link}"
                           style="background-color: #f97316; color: white; padding: 12px 30px;
                                  text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                            Reset Password
                        </a>
                    </div>
                    <p style="color: #666; font-size: 14px;">
                        Or copy and paste this link into your browser:<br>
                        <a href="{reset_link}" style="color: #f97316;">{reset_link}</a>
                    </p>
                    <p style="color: #666; font-size: 14px; margin-top: 30px;">This link will expire in 5 minutes.</p>
                    <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                    <p style="color: #999; font-size: 12px; text-align: center;">
                        This email was sent from Markilius. Please do not reply to this email.
                    </p>
                </div>
            </div>
        </body>
    </html>
    """

    resend.Emails.send({
        "from": MAIL_FROM,
        "to": [email],
        "subject": "Reset Your Markilius Password",
        "html": html_body,
    })


async def send_verification_email(email: str, verification_token: str):
    MAIL_FROM = _init()
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    verify_link = f"{frontend_url}/verify-email?token={verification_token}"

    html_body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #f97316; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="color: white; margin: 0;">Markilius</h1>
                </div>
                <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
                    <h2 style="color: #333; margin-top: 0;">Verify Your Email</h2>
                    <p>Thanks for signing up! Click the button below to verify your email address:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{verify_link}"
                           style="background-color: #f97316; color: white; padding: 12px 30px;
                                  text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                            Verify Email
                        </a>
                    </div>
                    <p style="color: #666; font-size: 14px;">
                        Or copy and paste this link into your browser:<br>
                        <a href="{verify_link}" style="color: #f97316;">{verify_link}</a>
                    </p>
                    <p style="color: #666; font-size: 14px; margin-top: 30px;">This link will expire in 24 hours.</p>
                    <p style="color: #666; font-size: 14px;">If you didn't create a Markilius account, you can safely ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                    <p style="color: #999; font-size: 12px; text-align: center;">
                        This email was sent from Markilius. Please do not reply to this email.
                    </p>
                </div>
            </div>
        </body>
    </html>
    """

    resend.Emails.send({
        "from": MAIL_FROM,
        "to": [email],
        "subject": "Verify Your Markilius Email",
        "html": html_body,
    })


async def send_weekly_summary_email(
    email: str,
    first_name: str,
    start_date: date,
    end_date: date,
    total_tasks: int,
    completed_tasks: int,
    completion_percentage: int,
    total_hours: float,
    arenas: List[dict],
):
    MAIL_FROM = _init()
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    week_label = f"{start_date.strftime('%b %d')} – {end_date.strftime('%b %d, %Y')}"

    arena_rows = ""
    for arena in arenas[:5]:
        pct = round((arena["completed"] / arena["total"] * 100) if arena["total"] > 0 else 0)
        arena_rows += f"""
        <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">
                <span style="display:inline-block; width:10px; height:10px; border-radius:50%;
                             background:{arena['color']}; margin-right:8px; vertical-align:middle;"></span>
                {arena['name']}
            </td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align:right; color:#555;">
                {arena['completed']}/{arena['total']} tasks &nbsp;·&nbsp; {arena['hours']}h &nbsp;·&nbsp; {pct}%
            </td>
        </tr>"""

    no_task_msg = ""
    if total_tasks == 0:
        no_task_msg = """
        <p style="color:#888; font-size:14px; margin: 20px 0;">
            No tasks this week. Your record stays honest.
        </p>"""

    html_body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin:0; padding:0;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #f97316; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">Markilius</h1>
                    <p style="color: rgba(255,255,255,0.85); margin: 4px 0 0; font-size: 14px;">Weekly Summary</p>
                </div>
                <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #eee; border-top: none;">
                    <p style="margin-top: 0;">Hi {first_name},</p>
                    <p>Here's how your week looked: <strong>{week_label}</strong></p>
                    {no_task_msg}
                    {"" if total_tasks == 0 else f'''
                    <div style="display:flex; gap:16px; margin: 24px 0; text-align:center;">
                        <div style="flex:1; background:#fff; border:1px solid #eee; border-radius:8px; padding:16px;">
                            <div style="font-size:32px; font-weight:700; color:#f97316;">{completion_percentage}%</div>
                            <div style="font-size:12px; color:#888; margin-top:4px;">Completion</div>
                        </div>
                        <div style="flex:1; background:#fff; border:1px solid #eee; border-radius:8px; padding:16px;">
                            <div style="font-size:32px; font-weight:700; color:#333;">{completed_tasks}<span style="font-size:18px;color:#aaa;">/{total_tasks}</span></div>
                            <div style="font-size:12px; color:#888; margin-top:4px;">Tasks Done</div>
                        </div>
                        <div style="flex:1; background:#fff; border:1px solid #eee; border-radius:8px; padding:16px;">
                            <div style="font-size:32px; font-weight:700; color:#333;">{total_hours}h</div>
                            <div style="font-size:12px; color:#888; margin-top:4px;">Hours Tracked</div>
                        </div>
                    </div>
                    {"" if not arenas else f"""
                    <h3 style="font-size:14px; font-weight:600; color:#555; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">Arena Breakdown</h3>
                    <table style="width:100%; border-collapse:collapse; font-size:14px;">
                        {arena_rows}
                    </table>"""}
                    '''}
                    <div style="text-align: center; margin: 32px 0 16px;">
                        <a href="{frontend_url}"
                           style="background-color: #f97316; color: white; padding: 12px 30px;
                                  text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                            View your record
                        </a>
                    </div>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                    <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                        You're receiving this because weekly summaries are enabled in your Markilius account.<br>
                        <a href="{frontend_url}/profile" style="color: #f97316;">Manage preferences</a>
                    </p>
                </div>
            </div>
        </body>
    </html>
    """

    resend.Emails.send({
        "from": MAIL_FROM,
        "to": [email],
        "subject": f"Week Summary — {week_label}",
        "html": html_body,
    })
