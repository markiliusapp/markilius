from datetime import date, timedelta
import calendar


def generate_due_dates(start_date: date, frequency: str) -> list[date]:
    dates = []
    end_date = date(start_date.year + 1, start_date.month, start_date.day)
    current = start_date

    if frequency == "once":
        return [start_date]

    elif frequency == "daily":
        while current <= end_date:
            dates.append(current)
            current += timedelta(days=1)

    elif frequency == "weekdays":
        while current <= end_date:
            if current.weekday() < 5:  # Monday=0 through Friday=4
                dates.append(current)
            current += timedelta(days=1)

    elif frequency.startswith("weekly_"):
        day_map = {
            "weekly_monday": 0,
            "weekly_tuesday": 1,
            "weekly_wednesday": 2,
            "weekly_thursday": 3,
            "weekly_friday": 4,
            "weekly_saturday": 5,
            "weekly_sunday": 6,
        }
        target_weekday = day_map.get(frequency)
        if target_weekday is not None:
            while current.weekday() != target_weekday:
                current += timedelta(days=1)
            while current <= end_date:
                dates.append(current)
                current += timedelta(weeks=1)

    elif frequency == "saturday":
        # Advance to first Saturday
        while current.weekday() != 5:
            current += timedelta(days=1)
        while current <= end_date:
            dates.append(current)
            current += timedelta(weeks=1)

    elif frequency == "sunday":
        # Advance to first Sunday
        while current.weekday() != 6:
            current += timedelta(days=1)
        while current <= end_date:
            dates.append(current)
            current += timedelta(weeks=1)

    elif frequency == "weekends":
        while current.weekday() != 5:
            current += timedelta(days=1)
        while current <= end_date:
            if current.weekday() in (5, 6):
                dates.append(current)
            current += timedelta(days=1)

    elif frequency == "monthly":
        while current <= end_date:
            dates.append(current)
            # Advance by one month, handle month-end edge cases
            month = current.month + 1
            year = current.year
            if month > 12:
                month = 1
                year += 1

            max_day = calendar.monthrange(year, month)[1]
            current = date(year, month, min(start_date.day, max_day))

    return dates
