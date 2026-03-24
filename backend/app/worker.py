"""
Standalone worker process for scheduled jobs (APScheduler).
Run this as a separate service so the scheduler is decoupled from the web process.

Usage:
    python -m app.worker
"""

import asyncio
from app.logger import configure_logging, get_logger
from app.services.scheduler import scheduler, send_weekly_summaries, send_monthly_summaries

configure_logging()
logger = get_logger(__name__)


async def main():
    scheduler.add_job(send_weekly_summaries, "interval", hours=1, id="weekly_summary")
    scheduler.add_job(send_monthly_summaries, "interval", hours=1, id="monthly_summary")
    scheduler.start()
    logger.info("Worker started — scheduler running")

    try:
        while True:
            await asyncio.sleep(60)
    except (KeyboardInterrupt, SystemExit):
        scheduler.shutdown()
        logger.info("Worker stopped")


if __name__ == "__main__":
    asyncio.run(main())
