import { shiftDate } from "./data";

export function calendarWindow(today: string, selection?: string) {
  const valid = selection && /^20\d\d-\d\d-\d\d$/.test(selection)
    && !Number.isNaN(Date.parse(selection)) && new Date(selection).toISOString().slice(0, 10) === selection;
  const day = valid ? selection : today;
  const monthStart = `${day.slice(0, 7)}-01`;
  const monthDate = new Date(`${monthStart}T12:00:00Z`);
  const previous = new Date(monthDate);
  previous.setUTCMonth(previous.getUTCMonth() - 1);
  const next = new Date(monthDate);
  next.setUTCMonth(next.getUTCMonth() + 1);
  const first = shiftDate(monthStart, -monthDate.getUTCDay());
  return {
    day, monthStart, first, last: shiftDate(first, 41),
    previous: previous.toISOString().slice(0, 10),
    next: next.toISOString().slice(0, 10),
  };
}


export function birthdayInYear(monthDay: string, year: number) {
  const date = `${year}-${monthDay}`;
  if (monthDay === "02-29" && shiftDate(`${year}-02-28`, 1).endsWith("03-01")) {
    return `${year}-02-28`;
  }
  return date;
}

export function nextBirthday(monthDay: string, today: string) {
  const year = Number(today.slice(0, 4));
  const thisYear = birthdayInYear(monthDay, year);
  return thisYear >= today ? thisYear : birthdayInYear(monthDay, year + 1);
}

export function usHolidaysOn(date: string): string[] {
  const year = Number(date.slice(0, 4));
  const holidays: { date: string; name: string }[] = [];
  const weekday = (day: string) => new Date(day + "T12:00:00Z").getUTCDay();
  for (const y of [year - 1, year, year + 1]) {
    const fixed = (monthDay: string, name: string) => {
      const day = y + "-" + monthDay;
      holidays.push({ date: day, name });
      const w = weekday(day);
      if (w === 0 || w === 6) holidays.push({ date: shiftDate(day, w === 0 ? 1 : -1), name: name + " (observed)" });
    };
    const nth = (month: string, w: number, n: number, name: string) => {
      const first = y + "-" + month + "-01";
      holidays.push({ date: shiftDate(first, (w - weekday(first) + 7) % 7 + (n - 1) * 7), name });
    };
    fixed("01-01", "New Year's Day");
    nth("01", 1, 3, "Martin Luther King Jr. Day");
    nth("02", 1, 3, "Washington's Birthday (Presidents' Day)");
    const mayEnd = y + "-05-31";
    holidays.push({ date: shiftDate(mayEnd, -((weekday(mayEnd) + 6) % 7)), name: "Memorial Day" });
    if (y >= 2021) fixed("06-19", "Juneteenth");
    fixed("07-04", "Independence Day");
    nth("09", 1, 1, "Labor Day");
    nth("10", 1, 2, "Columbus Day");
    fixed("11-11", "Veterans Day");
    nth("11", 4, 4, "Thanksgiving Day");
    fixed("12-25", "Christmas Day");
  }
  return holidays.filter((holiday) => holiday.date === date).map((holiday) => holiday.name);
}
