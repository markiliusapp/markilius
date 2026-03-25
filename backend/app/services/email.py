import resend
from calendar import monthrange
from datetime import date, timedelta
from typing import List, Optional
import os
from dotenv import load_dotenv
from app.utils.auth import generate_unsubscribe_token

load_dotenv()


def _init():
    resend.api_key = os.getenv("RESEND_API_KEY")
    return os.getenv("MAIL_FROM", "noreply@markilius.com")


# ── shared dark-theme palette ─────────────────────────────────────────────────
_DARK = dict(
    BG="#161616", CARD="#1e1e1e", SUBTLE="#262626", BORDER="#3a3a3a",
    TEXT="#f0f0f0", SECONDARY="#a1a1aa", MUTED="#71717a", ORANGE="#f97316",
)


def _email_template(content_html: str) -> str:
    """
    Wraps content in the standard Markilius email shell.
    Header: 4×4 brand grid (30px) + Markilius wordmark (16px, line-height 30px) — equal height.
    SVG not used — email clients strip it. Grid is an HTML table instead.
    """
    C = _DARK
    # rgba values composited against card bg #1e1e1e:
    #   full #f97316 · 50% → #884516 · 20% → #432916
    _F, _H, _L = "#f97316", "#884516", "#432916"
    grid = [
        [_F, _H, _F, _F],
        [_H, _F, _F, _L],
        [_F, _H, _L, _F],
        [_F, _L, _H, _F],
    ]
    # 4 cells × 6px + 3 gaps × 2px (cellspacing) = 30px — matches wordmark line-height
    cell = "width:6px;height:6px;border-radius:1px;"
    rows = "".join(
        "<tr>" + "".join(f'<td style="{cell}background:{c};"></td>' for c in row) + "</tr>"
        for row in grid
    )

    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:{C['BG']};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:{C['BG']};">
  <tr><td align="center" style="padding:40px 16px;">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

      <!-- Header -->
      <tr><td style="padding-bottom:32px;">
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align:middle;padding-right:10px;">
              <table cellpadding="0" cellspacing="2" style="border-collapse:separate;">{rows}</table>
            </td>
            <td style="vertical-align:middle;height:30px;">
              <span style="font-size:16px;font-weight:700;color:{C['ORANGE']};letter-spacing:-0.4px;line-height:30px;white-space:nowrap;">Markilius</span>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- Content card -->
      <tr><td style="background:{C['CARD']};border:1px solid {C['BORDER']};border-radius:12px;padding:32px;">
        {content_html}
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding-top:24px;font-size:12px;color:{C['MUTED']};text-align:center;">
        Markilius &mdash; <a href="mailto:support@markilius.com" style="color:{C['MUTED']};text-decoration:none;">support@markilius.com</a>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>"""


def _heatmap_cell_color(pct: float) -> str:
    if pct == 0:      return _DARK["SUBTLE"]
    if pct < 25:      return "rgba(249,115,22,0.2)"
    if pct < 50:      return "rgba(249,115,22,0.4)"
    if pct < 75:      return "rgba(249,115,22,0.6)"
    if pct < 100:     return "rgba(249,115,22,0.8)"
    return _DARK["ORANGE"]


def _render_heatmap(year: int, month: int, daily_data: List[dict]) -> str:
    """Render a calendar heatmap as an HTML table for email."""
    C = _DARK
    data_by_day = {}
    for d in daily_data:
        day_num = int(str(d["date"]).split("-")[2])
        data_by_day[day_num] = d

    # Sunday-based week start: Python weekday() is Mon=0, so Sun = (weekday+1)%7
    first_weekday = (date(year, month, 1).weekday() + 1) % 7
    last_day = monthrange(year, month)[1]

    header = "".join(
        f'<td style="text-align:center; padding:2px 1px; font-size:10px; '
        f'font-weight:600; color:{C["SECONDARY"]}; text-transform:uppercase; '
        f'letter-spacing:0.4px; width:14.28%;">{d}</td>'
        for d in ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    )

    # Flat list of cells: None = empty, dict = day data
    cells: list = [None] * first_weekday
    for day in range(1, last_day + 1):
        d = data_by_day.get(day, {})
        cells.append({
            "day": day,
            "pct": d.get("completion_percentage", 0),
            "total": d.get("total_tasks", 0),
        })

    rows = ""
    for i in range(0, len(cells), 7):
        row_cells = (cells[i:i + 7] + [None] * 7)[:7]
        tds = ""
        for cell in row_cells:
            if cell is None:
                tds += f'<td style="padding:2px; width:14.28%;"><div style="height:44px;"></div></td>'
            else:
                bg        = _heatmap_cell_color(cell["pct"])
                has_tasks = cell["total"] > 0
                num_color = C["TEXT"] if cell["pct"] < 60 else "#fff"
                pct_color = "#ffffff"
                pct_str   = f'{int(cell["pct"])}%' if has_tasks else ""
                tds += (
                    f'<td style="padding:2px; width:14.28%;">'
                    f'<div style="background:{bg}; border-radius:6px; padding:6px 2px; '
                    f'text-align:center; height:44px; box-sizing:border-box;">'
                    f'<div style="font-size:12px; font-weight:700; color:{num_color}; line-height:1.2;">{cell["day"]}</div>'
                    f'<div style="font-size:10px; color:{pct_color}; margin-top:2px;">{pct_str}</div>'
                    f'</div></td>'
                )
        rows += f"<tr>{tds}</tr>"

    return (
        f'<table width="100%" cellpadding="0" cellspacing="0" '
        f'style="border-collapse:collapse; margin-bottom:20px;">'
        f'<tr>{header}</tr>{rows}</table>'
    )


def _render_weekly_chart(daily_breakdown: List[dict]) -> str:
    """Render stacked arena bar chart per day as an HTML table for email."""
    C = _DARK
    CHART_H = 110  # px

    max_total = max(
        (sum(a.get("hours", 0) for a in d.get("arenas", [])) for d in daily_breakdown),
        default=0,
    )
    import math

    if max_total == 0:
        return ""

    max_whole   = math.ceil(max_total)
    px_per_unit = CHART_H / max_whole if max_whole > 0 else CHART_H

    day_cols = ""
    for d in daily_breakdown:
        d_obj      = date.fromisoformat(str(d["date"]))
        day_name   = d_obj.strftime("%a")
        arenas     = [a for a in d.get("arenas", []) if a.get("hours", 0) > 0]
        total_h    = sum(a.get("hours", 0) for a in arenas)

        bar_px    = int((total_h / max_total) * CHART_H) if total_h > 0 else 0
        spacer_px = CHART_H - bar_px

        inner = f'<tr><td height="{spacer_px}" style="height:{spacer_px}px; line-height:0; font-size:0;"></td></tr>'
        for arena in arenas:
            seg = max(2, int((arena["hours"] / max_total) * CHART_H))
            inner += (
                f'<tr><td height="{seg}" bgcolor="{arena["color"]}" '
                f'style="height:{seg}px; background:{arena["color"]}; line-height:0; font-size:0;"></td></tr>'
            )

        day_cols += (
            f'<td style="text-align:center; padding:0 3px; vertical-align:bottom;">'
            f'<div style="font-size:0; height:16px;"></div>'  # spacer aligns with axis label row
            f'<table width="100%" cellpadding="0" cellspacing="0" '
            f'style="border-collapse:collapse; background:{C["SUBTLE"]}; height:{CHART_H}px;">'
            f'{inner}</table>'
            f'<div style="font-size:10px; font-weight:600; color:{C["SECONDARY"]}; '
            f'margin-top:5px; text-transform:uppercase; letter-spacing:0.4px;">{day_name}</div>'
            f'</td>'
        )

    # Right-side Y-axis: hour markers from top (max) to bottom (0)
    axis_rows = ""
    for tick in range(max_whole, -1, -1):
        row_h = int(px_per_unit) if tick > 0 else 0
        axis_rows += (
            f'<tr><td height="{row_h}" style="height:{row_h}px; vertical-align:top; '
            f'font-size:10px; color:{C["MUTED"]}; white-space:nowrap; padding-left:6px; line-height:1;">'
            f'{tick}h</td></tr>'
        )

    axis_col = (
        f'<td width="28" style="vertical-align:top; padding:0;">'
        f'<div style="height:16px;"></div>'  # aligns with the blank row above bars
        f'<table cellpadding="0" cellspacing="0" style="border-collapse:collapse; height:{CHART_H}px;">'
        f'{axis_rows}</table>'
        f'</td>'
    )

    # Arena legend
    all_arenas: dict = {}
    for d in daily_breakdown:
        for a in d.get("arenas", []):
            if a["name"] not in all_arenas:
                all_arenas[a["name"]] = a["color"]

    legend = "".join(
        f'<span style="display:inline-block; margin-right:12px; font-size:11px; color:{C["SECONDARY"]};">'
        f'<span style="display:inline-block; width:8px; height:8px; border-radius:50%; '
        f'background:{color}; margin-right:4px; vertical-align:middle;"></span>{name}</span>'
        for name, color in all_arenas.items()
    )

    return (
        f'<div style="font-size:11px; font-weight:600; color:{C["SECONDARY"]}; '
        f'text-transform:uppercase; letter-spacing:0.6px; margin-bottom:8px;">Time by Arena</div>'
        f'<div style="background:{C["SUBTLE"]}; border:1px solid {C["BORDER"]}; '
        f'border-radius:8px; padding:16px; margin-bottom:20px;">'
        f'<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">'
        f'<tr>{axis_col}{day_cols}</tr></table>'
        f'{"<div style=margin-top:12px;>" + legend + "</div>" if legend else ""}'
        f'</div>'
    )


async def send_password_reset_email(email: str, reset_token: str):
    MAIL_FROM = _init()
    C = _DARK
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    reset_link = f"{frontend_url}/reset-password?token={reset_token}"

    content = f"""
        <h1 style="margin:0 0 8px;font-size:20px;font-weight:600;color:{C['TEXT']};letter-spacing:-0.3px;">Reset your password</h1>
        <p style="margin:0 0 24px;color:{C['SECONDARY']};font-size:14px;line-height:1.6;">
            Click the button below to set a new password. This link expires in 5 minutes.
        </p>
        <a href="{reset_link}" style="display:inline-block;background:{C['ORANGE']};color:#fff;font-size:14px;font-weight:600;padding:10px 24px;border-radius:8px;text-decoration:none;letter-spacing:-0.1px;">
            Reset password
        </a>
        <p style="margin:24px 0 0;font-size:13px;color:{C['MUTED']};line-height:1.6;">
            Or copy this link into your browser:<br>
            <a href="{reset_link}" style="color:{C['SECONDARY']};word-break:break-all;">{reset_link}</a>
        </p>
        <p style="margin:16px 0 0;font-size:13px;color:{C['MUTED']};">If you didn't request this, you can ignore this email.</p>
    """

    resend.Emails.send({
        "from": MAIL_FROM,
        "to": [email],
        "subject": "Reset your password — Markilius",
        "html": _email_template(content),
    })


async def send_verification_email(email: str, verification_token: str):
    MAIL_FROM = _init()
    C = _DARK
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    verify_link = f"{frontend_url}/verify-email?token={verification_token}"

    content = f"""
        <h1 style="margin:0 0 8px;font-size:20px;font-weight:600;color:{C['TEXT']};letter-spacing:-0.3px;">Verify your email</h1>
        <p style="margin:0 0 24px;color:{C['SECONDARY']};font-size:14px;line-height:1.6;">
            Click the button below to verify your email address. This link expires in 24 hours.
        </p>
        <a href="{verify_link}" style="display:inline-block;background:{C['ORANGE']};color:#fff;font-size:14px;font-weight:600;padding:10px 24px;border-radius:8px;text-decoration:none;letter-spacing:-0.1px;">
            Verify email
        </a>
        <p style="margin:24px 0 0;font-size:13px;color:{C['MUTED']};line-height:1.6;">
            Or copy this link into your browser:<br>
            <a href="{verify_link}" style="color:{C['SECONDARY']};word-break:break-all;">{verify_link}</a>
        </p>
        <p style="margin:16px 0 0;font-size:13px;color:{C['MUTED']};">If you didn't create a Markilius account, you can ignore this email.</p>
    """

    resend.Emails.send({
        "from": MAIL_FROM,
        "to": [email],
        "subject": "Verify your email — Markilius",
        "html": _email_template(content),
    })


_PLAN_LABELS = {
    "monthly": "Monthly — $5.99 / month",
    "yearly": "Yearly — $29.99 / year",
    "lifetime": "Lifetime — $59.99 one-time",
}


async def send_subscription_welcome_email(email: str, first_name: str, tier: str):
    MAIL_FROM = _init()
    C = _DARK
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    dashboard_url = f"{frontend_url}/dashboard"
    plan_label = _PLAN_LABELS.get(tier, tier.capitalize())

    content = f"""
        <h1 style="margin:0 0 8px;font-size:20px;font-weight:600;color:{C['TEXT']};letter-spacing:-0.3px;">You're in.</h1>
        <p style="margin:0 0 24px;color:{C['SECONDARY']};font-size:14px;line-height:1.6;">
            {first_name}, your plan is active. This is your record. It starts today.
        </p>
        <div style="background:{C['SUBTLE']};border:1px solid {C['BORDER']};border-radius:8px;padding:14px 16px;margin-bottom:24px;">
            <p style="margin:0;font-size:12px;color:{C['MUTED']};text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Plan</p>
            <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:{C['TEXT']};">{plan_label}</p>
        </div>
        <a href="{dashboard_url}" style="display:inline-block;background:{C['ORANGE']};color:#fff;font-size:14px;font-weight:600;padding:10px 24px;border-radius:8px;text-decoration:none;letter-spacing:-0.1px;">
            Go to your dashboard
        </a>
    """

    resend.Emails.send({
        "from": MAIL_FROM,
        "to": [email],
        "subject": "You're in — Markilius",
        "html": _email_template(content),
    })


async def send_plan_switched_email(email: str, first_name: str, old_tier: str, new_tier: str):
    MAIL_FROM = _init()
    C = _DARK
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    dashboard_url = f"{frontend_url}/dashboard"
    old_label = _PLAN_LABELS.get(old_tier, old_tier.capitalize())
    new_label = _PLAN_LABELS.get(new_tier, new_tier.capitalize())

    content = f"""
        <h1 style="margin:0 0 8px;font-size:20px;font-weight:600;color:{C['TEXT']};letter-spacing:-0.3px;">Plan updated.</h1>
        <p style="margin:0 0 24px;color:{C['SECONDARY']};font-size:14px;line-height:1.6;">
            {first_name}, your plan has been updated.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:{C['SUBTLE']};border:1px solid {C['BORDER']};border-radius:8px;margin-bottom:24px;">
          <tr>
            <td style="padding:14px 16px;vertical-align:top;">
              <p style="margin:0;font-size:12px;color:{C['MUTED']};text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">From</p>
              <p style="margin:4px 0 0;font-size:14px;color:{C['SECONDARY']};text-decoration:line-through;">{old_label}</p>
            </td>
            <td style="padding:14px 16px;vertical-align:top;">
              <p style="margin:0;font-size:12px;color:{C['MUTED']};text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">To</p>
              <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:{C['TEXT']};">{new_label}</p>
            </td>
          </tr>
        </table>
        <a href="{dashboard_url}" style="display:inline-block;background:{C['ORANGE']};color:#fff;font-size:14px;font-weight:600;padding:10px 24px;border-radius:8px;text-decoration:none;letter-spacing:-0.1px;">
            Go to your dashboard
        </a>
    """

    resend.Emails.send({
        "from": MAIL_FROM,
        "to": [email],
        "subject": "Plan updated — Markilius",
        "html": _email_template(content),
    })


async def send_payment_failed_email(email: str, first_name: str, next_retry: str | None):
    MAIL_FROM = _init()
    C = _DARK
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    billing_url = f"{frontend_url}/dashboard/profile"

    retry_line = (
        f'<p style="margin:0 0 24px;color:{C["SECONDARY"]};font-size:14px;line-height:1.6;">Stripe will retry on {next_retry}. Update your card before then to avoid losing access.</p>'
        if next_retry else
        f'<p style="margin:0 0 24px;color:{C["SECONDARY"]};font-size:14px;line-height:1.6;">No further retries are scheduled. Update your payment method to restore access.</p>'
    )

    content = f"""
        <h1 style="margin:0 0 8px;font-size:20px;font-weight:600;color:{C['TEXT']};letter-spacing:-0.3px;">Payment failed</h1>
        <p style="margin:0 0 16px;color:{C['SECONDARY']};font-size:14px;line-height:1.6;">
            {first_name}, your last payment didn't go through. Update your payment method to keep access to Markilius.
        </p>
        {retry_line}
        <a href="{billing_url}" style="display:inline-block;background:{C['ORANGE']};color:#fff;font-size:14px;font-weight:600;padding:10px 24px;border-radius:8px;text-decoration:none;letter-spacing:-0.1px;">
            Update payment method
        </a>
    """

    resend.Emails.send({
        "from": MAIL_FROM,
        "to": [email],
        "subject": "Payment failed — action required",
        "html": _email_template(content),
    })


async def send_subscription_cancelled_email(email: str, first_name: str, access_ends: str):
    MAIL_FROM = _init()
    C = _DARK
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    billing_url = f"{frontend_url}/dashboard/profile"

    content = f"""
        <h1 style="margin:0 0 8px;font-size:20px;font-weight:600;color:{C['TEXT']};letter-spacing:-0.3px;">Subscription cancelled.</h1>
        <p style="margin:0 0 24px;color:{C['SECONDARY']};font-size:14px;line-height:1.6;">
            {first_name}, your subscription has been cancelled. Your access and record remain intact until {access_ends}.
        </p>
        <div style="background:{C['SUBTLE']};border:1px solid {C['BORDER']};border-radius:8px;padding:14px 16px;margin-bottom:24px;">
            <p style="margin:0;font-size:12px;color:{C['MUTED']};text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Access ends</p>
            <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:{C['TEXT']};">{access_ends}</p>
        </div>
        <a href="{billing_url}" style="display:inline-block;background:{C['ORANGE']};color:#fff;font-size:14px;font-weight:600;padding:10px 24px;border-radius:8px;text-decoration:none;letter-spacing:-0.1px;">
            Reactivate subscription
        </a>
    """

    resend.Emails.send({
        "from": MAIL_FROM,
        "to": [email],
        "subject": "Subscription cancelled — Markilius",
        "html": _email_template(content),
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
    avg_tasks_per_day: float = 0.0,
    days_with_tasks: int = 0,
    most_productive_day: Optional[dict] = None,   # {day_name, completion_percentage}
    least_productive_day: Optional[dict] = None,  # {day_name, completion_percentage}
    daily_breakdown: Optional[List[dict]] = None,  # [{date, completion_percentage, completed_tasks, total_tasks, arenas}]
    all_arenas: Optional[List[dict]] = None,       # [{name, color}] — full arena list to surface missed arenas
):
    MAIL_FROM = _init()
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # Subject: "Your Week — Mar 17–23"
    if start_date.month == end_date.month:
        week_label_short = f"{start_date.strftime('%b')} {start_date.day}–{end_date.day}"
    else:
        week_label_short = f"{start_date.strftime('%b')} {start_date.day}–{end_date.strftime('%b')} {end_date.day}"

    week_label_full = f"{start_date.strftime('%b %d')} – {end_date.strftime('%b %d, %Y')}"

    # ── colours (dark theme) ──────────────────────────────────────────────────
    BG        = "#161616"
    CARD      = "#1e1e1e"
    SUBTLE    = "#262626"
    BORDER    = "#3a3a3a"
    TEXT      = "#f0f0f0"
    SECONDARY = "#a1a1aa"
    MUTED     = "#71717a"
    ORANGE    = "#f97316"

    def stat_card(value: str, label: str, highlight: bool = False) -> str:
        bg = "rgba(249,115,22,0.12)" if highlight else SUBTLE
        border = "1px solid rgba(249,115,22,0.25)" if highlight else f"1px solid {BORDER}"
        val_color = ORANGE if highlight else TEXT
        return (
            f'<td style="width:33%; padding:4px;">'
            f'<div style="background:{bg}; border:{border}; border-radius:8px; padding:14px 12px;">'
            f'<div style="font-size:22px; font-weight:700; color:{val_color}; margin-bottom:3px;">{value}</div>'
            f'<div style="font-size:11px; color:{SECONDARY};">{label}</div>'
            f'</div></td>'
        )

    # ── plain sentence ────────────────────────────────────────────────────────
    if total_tasks == 0:
        plain_sentence = "No tasks recorded this week."
    elif completion_percentage >= 80:
        plain_sentence = f"{completion_percentage}% completion. You showed up."
    elif completion_percentage >= 50:
        plain_sentence = f"{completion_percentage}% completion. Room to close the gap."
    else:
        plain_sentence = f"{completion_percentage}% completion. This week's record is honest."

    # ── best / worst day ─────────────────────────────────────────────────────
    best_day_value  = most_productive_day["day_name"]   if most_productive_day  else "—"
    best_day_label  = f"Best Day ({most_productive_day['completion_percentage']}%)"   if most_productive_day  else "Best Day"
    worst_day_value = least_productive_day["day_name"]  if least_productive_day else "—"
    worst_day_label = f"Worst Day ({least_productive_day['completion_percentage']}%)" if least_productive_day else "Worst Day"

    # ── arena breakdown ───────────────────────────────────────────────────────
    def _arena_row_w(name: str, color: str, pct: int, hours: float, completed: int, total: int, is_last: bool, is_overall: bool = False) -> str:
        row_border = "" if is_last else f"border-bottom:1px solid {BORDER};"
        bar_w      = max(pct, 12) if pct > 0 else 0
        missed     = total == 0
        fill_color = MUTED if is_overall else color
        fill_dim   = "opacity:0.3;" if missed else ""
        return (
            f'<tr style="{row_border}">'
            f'<td style="width:80px; padding:7px 10px 7px 0; text-align:right; vertical-align:middle; white-space:nowrap; font-size:13px; font-weight:500; color:{MUTED};">{name}</td>'
            f'<td style="padding:7px 8px 7px 0; vertical-align:middle;">'
            f'<div style="background:{SUBTLE}; border-radius:13px; height:26px; overflow:hidden;">'
            f'<div style="background:{fill_color}; border-radius:13px; height:26px; width:{bar_w}%; {fill_dim}">'
            f'<span style="display:inline-block; color:#fff; font-size:12px; font-weight:700; line-height:26px; padding-left:10px; white-space:nowrap;">{pct if pct > 0 else ""}{"%" if pct > 0 else ""}</span>'
            f'</div></div></td>'
            f'<td style="width:90px; padding:7px 0; text-align:right; vertical-align:middle; white-space:nowrap; font-size:12px; color:{MUTED};">{completed}/{total}&nbsp;·&nbsp;{hours}h</td>'
            f'</tr>'
        )

    # Merge task arenas with any missed arenas (in all_arenas but no tasks this week)
    arena_names_with_tasks = {a["name"] for a in arenas}
    full_arenas = list(arenas)
    if all_arenas:
        for a in all_arenas:
            if a["name"] not in arena_names_with_tasks:
                full_arenas.append({"name": a["name"], "color": a["color"], "total": 0, "completed": 0, "hours": 0.0})

    # Sort: active arenas by completion % desc, missed arenas at the bottom
    full_arenas.sort(
        key=lambda a: (a["total"] > 0, (a["completed"] / a["total"] * 100) if a["total"] > 0 else 0),
        reverse=True,
    )

    total_all     = sum(a["total"]     for a in full_arenas)
    completed_all = sum(a["completed"] for a in full_arenas)
    hours_all     = round(sum(a["hours"] for a in full_arenas), 1)
    overall_pct   = round((completed_all / total_all * 100) if total_all > 0 else 0)

    arena_rows = _arena_row_w("Overall", ORANGE, overall_pct, hours_all, completed_all, total_all, is_last=(len(full_arenas) == 0), is_overall=True)
    for i, arena in enumerate(full_arenas):
        pct = round((arena["completed"] / arena["total"] * 100) if arena["total"] > 0 else 0)
        arena_rows += _arena_row_w(
            arena["name"], arena["color"], pct, arena["hours"],
            arena["completed"], arena["total"],
            is_last=(i == len(full_arenas) - 1),
        )

    html_body = f"""<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background:{BG}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<div style="max-width:620px; margin:0 auto; padding:24px 16px;">

    <!-- header -->
    <div style="background:{CARD}; border:1px solid {BORDER}; border-radius:10px 10px 0 0; padding:24px; border-bottom:none;">
        <!-- brand logo -->
        <a href="https://markilius.com" style="text-decoration:none; cursor:pointer; display:inline-block;">
        <table cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle; padding-right:10px;">
                <div style="width:26px; height:26px; background:{ORANGE}; border-radius:6px; text-align:center; line-height:26px; font-size:15px; color:#fff; font-weight:900; display:inline-block;">&#10003;</div>
            </td>
            <td style="vertical-align:middle;">
                <span style="font-size:16px; font-weight:700; color:{ORANGE}; letter-spacing:-0.4px; line-height:1;">Markilius</span>
            </td>
        </tr></table>
        </a>
        <!-- week info -->
        <div style="margin-top:20px; padding-top:20px; border-top:1px solid {BORDER};">
            <div style="font-size:11px; font-weight:600; color:{SECONDARY}; text-transform:uppercase; letter-spacing:0.6px; margin-bottom:6px;">Week Summary</div>
            <div style="font-size:22px; font-weight:700; color:{TEXT}; letter-spacing:-0.4px;">{week_label_full}</div>
        </div>
    </div>

    <!-- body -->
    <div style="background:{CARD}; border:1px solid {BORDER}; border-radius:0 0 10px 10px; padding:24px; border-top:none;">

        <!-- stat cards row 1 -->
        <table style="width:100%; border-collapse:collapse; margin-bottom:8px;"><tr>
            {stat_card(f"{completion_percentage}%", "Completion Rate", highlight=True)}
            {stat_card(f"{completed_tasks}/{total_tasks}", "Tasks Completed")}
            {stat_card(str(days_with_tasks), "Days Active")}
        </tr></table>

        <!-- stat cards row 2 -->
        <table style="width:100%; border-collapse:collapse; margin-bottom:20px;"><tr>
            {stat_card(f"{total_hours}h", "Time Logged")}
            {stat_card(best_day_value, best_day_label)}
            {stat_card(worst_day_value, worst_day_label)}
        </tr></table>

        {_render_weekly_chart(daily_breakdown) if daily_breakdown else ""}

        <!-- arena breakdown -->
        <div style="font-size:11px; font-weight:600; color:{SECONDARY}; text-transform:uppercase; letter-spacing:0.6px; margin-bottom:8px;">Arena Breakdown</div>
        <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">{arena_rows}</table>

        <!-- plain sentence -->
        <p style="color:{SECONDARY}; font-size:13px; margin:0 0 24px; padding:12px 14px; background:{SUBTLE}; border-radius:8px; border-left:3px solid {ORANGE};">{plain_sentence}</p>

        <!-- CTA -->
        <div style="text-align:center; margin-top:8px;">
            <a href="{frontend_url}/dashboard/week"
               style="background:{ORANGE}; color:#fff; padding:11px 28px; text-decoration:none;
                      border-radius:8px; display:inline-block; font-size:13px; font-weight:600; letter-spacing:0.2px;">
                View your week
            </a>
        </div>

        <!-- footer -->
        <div style="margin-top:28px; padding-top:20px; border-top:1px solid {BORDER}; text-align:center;">
            <p style="color:{MUTED}; font-size:11px; margin:0;">
                Markilius · your identity made visible &nbsp;·&nbsp;
                <a href="{frontend_url}/dashboard/profile" style="color:{SECONDARY}; text-decoration:none;">Manage preferences</a>
            </p>
        </div>
    </div>
</div>
</body>
</html>"""

    api_url = os.getenv("API_URL", "http://localhost:8000")
    unsubscribe_url = f"{api_url}/auth/unsubscribe?token={generate_unsubscribe_token(email, 'weekly')}&type=weekly"
    resend.Emails.send({
        "from": MAIL_FROM,
        "to": [email],
        "subject": f"Your Week — {week_label_short}",
        "html": html_body,
        "headers": {
            "List-Unsubscribe": f"<{unsubscribe_url}>",
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
    })


async def send_monthly_summary_email(
    email: str,
    first_name: str,
    year: int,
    month: int,
    total_tasks: int,
    completed_tasks: int,
    completion_percentage: float,
    total_hours: float,
    best_week: Optional[dict],            # {start, end, pct, hours}
    worst_week: Optional[dict],           # {start, end, pct, hours}
    most_completed_arena: Optional[str],
    most_neglected_arena: Optional[str],
    arenas: List[dict],                   # [{name, color, completed, total, hours}]
    avg_tasks_per_day: float = 0.0,
    avg_duration_per_day: float = 0.0,
    days_with_tasks: int = 0,
    perfect_days: int = 0,
    most_productive_day: Optional[dict] = None,  # {date_label, completion_percentage}
    daily_breakdown: Optional[List[dict]] = None, # [{date, completion_percentage, total_tasks}]
    all_arenas: Optional[List[dict]] = None,      # [{name, color}] — full arena list to surface missed arenas
):
    MAIL_FROM = _init()
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    month_label = date(year, month, 1).strftime("%B %Y")

    # ── colours (dark theme) ──────────────────────────────────────────────────
    BG        = "#161616"
    CARD      = "#1e1e1e"
    SUBTLE    = "#262626"
    BORDER    = "#3a3a3a"
    TEXT      = "#f0f0f0"
    SECONDARY = "#a1a1aa"
    MUTED     = "#71717a"
    ORANGE    = "#f97316"

    def stat_card(value: str, label: str, highlight: bool = False) -> str:
        bg = "rgba(249,115,22,0.12)" if highlight else SUBTLE
        border = "1px solid rgba(249,115,22,0.25)" if highlight else f"1px solid {BORDER}"
        val_color = ORANGE if highlight else TEXT
        return f"""
        <td style="width:33%; padding:4px;">
            <div style="background:{bg}; border:{border}; border-radius:8px; padding:14px 12px;">
                <div style="font-size:22px; font-weight:700; color:{val_color}; margin-bottom:3px;">{value}</div>
                <div style="font-size:11px; color:{SECONDARY};">{label}</div>
            </div>
        </td>"""

    # ── plain sentence ────────────────────────────────────────────────────────
    if total_tasks == 0:
        plain_sentence = "No tasks recorded this month."
    elif completion_percentage >= 80:
        plain_sentence = f"{completion_percentage:.0f}% completion. Strong month."
    elif completion_percentage >= 50:
        plain_sentence = f"{completion_percentage:.0f}% completion. Room to close the gap."
    else:
        plain_sentence = f"{completion_percentage:.0f}% completion. This month's record is honest."

    # ── week highlights ───────────────────────────────────────────────────────
    def fmt_week(w: dict) -> str:
        s = w["start"].strftime("%b %d")
        e = w["end"].strftime("%b %d")
        return f"{s}–{e} &nbsp;<span style='color:{ORANGE};font-weight:700;'>{w['pct']:.0f}%</span>"

    best_week_str  = fmt_week(best_week)  if best_week  else f"<span style='color:{MUTED}'>—</span>"
    worst_week_str = fmt_week(worst_week) if worst_week else f"<span style='color:{MUTED}'>—</span>"

    # ── arena breakdown ───────────────────────────────────────────────────────
    def _arena_row_m(name: str, color: str, pct: int, hours: float, completed: int, total: int, is_last: bool, is_overall: bool = False) -> str:
        row_border = "" if is_last else f"border-bottom:1px solid {BORDER};"
        bar_w      = max(pct, 12) if pct > 0 else 0
        missed     = total == 0
        fill_color = MUTED if is_overall else color
        fill_dim   = "opacity:0.3;" if missed else ""
        return (
            f'<tr style="{row_border}">'
            f'<td style="width:80px; padding:7px 10px 7px 0; text-align:right; vertical-align:middle; white-space:nowrap; font-size:13px; font-weight:500; color:{MUTED};">{name}</td>'
            f'<td style="padding:7px 8px 7px 0; vertical-align:middle;">'
            f'<div style="background:{SUBTLE}; border-radius:13px; height:26px; overflow:hidden;">'
            f'<div style="background:{fill_color}; border-radius:13px; height:26px; width:{bar_w}%; {fill_dim}">'
            f'<span style="display:inline-block; color:#fff; font-size:12px; font-weight:700; line-height:26px; padding-left:10px; white-space:nowrap;">{pct if pct > 0 else ""}{"%" if pct > 0 else ""}</span>'
            f'</div></div></td>'
            f'<td style="width:90px; padding:7px 0; text-align:right; vertical-align:middle; white-space:nowrap; font-size:12px; color:{MUTED};">{completed}/{total}&nbsp;·&nbsp;{hours}h</td>'
            f'</tr>'
        )

    # Merge task arenas with any missed arenas
    arena_names_with_tasks = {a["name"] for a in arenas}
    full_arenas_m = list(arenas)
    if all_arenas:
        for a in all_arenas:
            if a["name"] not in arena_names_with_tasks:
                full_arenas_m.append({"name": a["name"], "color": a["color"], "total": 0, "completed": 0, "hours": 0.0})

    full_arenas_m.sort(
        key=lambda a: (a["total"] > 0, (a["completed"] / a["total"] * 100) if a["total"] > 0 else 0),
        reverse=True,
    )

    total_all_m     = sum(a["total"]     for a in full_arenas_m)
    completed_all_m = sum(a["completed"] for a in full_arenas_m)
    hours_all_m     = round(sum(a["hours"] for a in full_arenas_m), 1)
    overall_pct_m   = round((completed_all_m / total_all_m * 100) if total_all_m > 0 else 0)

    arena_rows = _arena_row_m("Overall", ORANGE, overall_pct_m, hours_all_m, completed_all_m, total_all_m, is_last=(len(full_arenas_m) == 0), is_overall=True)
    for i, arena in enumerate(full_arenas_m):
        pct = round((arena["completed"] / arena["total"] * 100) if arena["total"] > 0 else 0)
        arena_rows += _arena_row_m(arena["name"], arena["color"], pct, arena["hours"], arena["completed"], arena["total"], is_last=(i == len(full_arenas_m) - 1))

    best_day_value = most_productive_day["date_label"] if most_productive_day else "—"
    best_day_label = f"Most Productive ({most_productive_day['completion_percentage']}%)" if most_productive_day else "Most Productive"

    html_body = f"""<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background:{BG}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<div style="max-width:620px; margin:0 auto; padding:24px 16px;">

    <!-- header -->
    <div style="background:{CARD}; border:1px solid {BORDER}; border-radius:10px 10px 0 0; padding:24px; border-bottom:none;">
        <!-- brand logo -->
        <a href="https://markilius.com" style="text-decoration:none; cursor:pointer; display:inline-block;">
        <table cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle; padding-right:10px;">
                <div style="width:26px; height:26px; background:{ORANGE}; border-radius:6px; text-align:center; line-height:26px; font-size:15px; color:#fff; font-weight:900; display:inline-block;">&#10003;</div>
            </td>
            <td style="vertical-align:middle;">
                <span style="font-size:16px; font-weight:700; color:{ORANGE}; letter-spacing:-0.4px; line-height:1;">Markilius</span>
            </td>
        </tr></table>
        </a>
        <!-- month info -->
        <div style="margin-top:20px; padding-top:20px; border-top:1px solid {BORDER};">
            <div style="font-size:11px; font-weight:600; color:{SECONDARY}; text-transform:uppercase; letter-spacing:0.6px; margin-bottom:6px;">Monthly Review</div>
            <div style="font-size:22px; font-weight:700; color:{TEXT}; letter-spacing:-0.4px;">{month_label}</div>
        </div>
    </div>

    <!-- body -->
    <div style="background:{CARD}; border:1px solid {BORDER}; border-radius:0 0 10px 10px; padding:24px; border-top:none;">

        {_render_heatmap(year, month, daily_breakdown) if daily_breakdown else ""}

        <!-- summary cards row 1 -->
        <table style="width:100%; border-collapse:collapse; margin-bottom:8px;">
            <tr>
                {stat_card(f"{completion_percentage:.0f}%", "Completion Rate", highlight=True)}
                {stat_card(f"{completed_tasks}/{total_tasks}", "Tasks Completed")}
                {stat_card(str(perfect_days), "Perfect Days")}
            </tr>
        </table>

        <!-- summary cards row 2 -->
        <table style="width:100%; border-collapse:collapse; margin-bottom:8px;">
            <tr>
                {stat_card(f"{total_hours}h", "Total Time")}
                {stat_card(f"{avg_tasks_per_day:.1f}", "Avg Tasks / Day")}
                {stat_card(str(days_with_tasks), "Active Days")}
            </tr>
        </table>

        <!-- summary cards row 3 -->
        <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
            <tr>
                {stat_card(f"{avg_duration_per_day:.1f}h", "Avg Time / Day")}
                {stat_card(best_day_value, best_day_label)}
                <td style="width:33%; padding:4px;"></td>
            </tr>
        </table>

        <!-- week highlights -->
        <div style="font-size:11px; font-weight:600; color:{SECONDARY}; text-transform:uppercase; letter-spacing:0.6px; margin-bottom:8px;">Week Highlights</div>
        <table style="width:100%; border-collapse:collapse; margin-bottom:20px; font-size:13px;">
            <tr>
                <td style="padding:10px 0; border-bottom:1px solid {BORDER}; color:{SECONDARY};">Best week</td>
                <td style="padding:10px 0; border-bottom:1px solid {BORDER}; text-align:right; color:{TEXT};">{best_week_str}</td>
            </tr>
            <tr>
                <td style="padding:10px 0; border-bottom:1px solid {BORDER}; color:{SECONDARY};">Worst week</td>
                <td style="padding:10px 0; border-bottom:1px solid {BORDER}; text-align:right; color:{TEXT};">{worst_week_str}</td>
            </tr>
            <tr>
                <td style="padding:10px 0; border-bottom:1px solid {BORDER}; color:{SECONDARY};">Most completed arena</td>
                <td style="padding:10px 0; border-bottom:1px solid {BORDER}; text-align:right; color:{TEXT};">{most_completed_arena or "—"}</td>
            </tr>
            <tr>
                <td style="padding:10px 0; border-bottom:1px solid {BORDER}; color:{SECONDARY};">Most neglected arena</td>
                <td style="padding:10px 0; border-bottom:1px solid {BORDER}; text-align:right; color:{TEXT};">{most_neglected_arena or "—"}</td>
            </tr>
        </table>

        {"<!-- arena breakdown -->" + f"""
        <div style="font-size:11px; font-weight:600; color:{SECONDARY}; text-transform:uppercase; letter-spacing:0.6px; margin-bottom:8px;">Arena Breakdown</div>
        <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">{arena_rows}</table>""" if arena_rows else ""}

        <!-- plain sentence -->
        <p style="color:{SECONDARY}; font-size:13px; margin:0 0 24px; padding:12px 14px; background:{SUBTLE}; border-radius:8px; border-left:3px solid {ORANGE};">{plain_sentence}</p>

        <!-- CTA -->
        <div style="text-align:center;">
            <a href="{frontend_url}/dashboard/month"
               style="background:{ORANGE}; color:#fff; padding:11px 28px; text-decoration:none;
                      border-radius:8px; display:inline-block; font-size:13px; font-weight:600; letter-spacing:0.2px;">
                View full heatmap
            </a>
        </div>

        <!-- footer -->
        <div style="margin-top:28px; padding-top:20px; border-top:1px solid {BORDER}; text-align:center;">
            <p style="color:{MUTED}; font-size:11px; margin:0;">
                Markilius · your identity made visible &nbsp;·&nbsp;
                <a href="{frontend_url}/dashboard/profile" style="color:{SECONDARY}; text-decoration:none;">Manage preferences</a>
            </p>
        </div>
    </div>
</div>
</body>
</html>"""

    api_url = os.getenv("API_URL", "http://localhost:8000")
    unsubscribe_url = f"{api_url}/auth/unsubscribe?token={generate_unsubscribe_token(email, 'monthly')}&type=monthly"
    resend.Emails.send({
        "from": MAIL_FROM,
        "to": [email],
        "subject": f"Your Month — {month_label}",
        "html": html_body,
        "headers": {
            "List-Unsubscribe": f"<{unsubscribe_url}>",
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
    })
