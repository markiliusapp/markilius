from datetime import date, timedelta
import calendar


def generate_due_dates(start_date: date, frequency: str) -> list[date]:
    dates = []
    end_year = start_date.year + 1
    end_max_day = calendar.monthrange(end_year, start_date.month)[1]
    end_date = date(end_year, start_date.month, min(start_date.day, end_max_day))
    current = start_date

    if frequency == "once":
        return [start_date]

    elif frequency == "daily":
        while current <= end_date:
            dates.append(current)
            current += timedelta(days=1)

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
