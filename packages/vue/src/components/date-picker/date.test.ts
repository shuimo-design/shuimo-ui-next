import { describe, expect, it } from "vitest";
import {
  addMonths,
  buildCalendar,
  formatDate,
  parseDate,
  sameDay,
  toDate,
  weekdayNames,
  yearPageStart,
} from "./date";

describe("formatDate / parseDate", () => {
  it("formats with YYYY / MM / DD tokens", () => {
    const date = new Date(2024, 2, 5);
    expect(formatDate(date, "YYYY-MM-DD")).toBe("2024-03-05");
    expect(formatDate(date, "YYYY/MM")).toBe("2024/03");
    expect(formatDate(date, "YYYY")).toBe("2024");
    expect(formatDate(date, "YYYY年MM月DD日")).toBe("2024年03月05日");
  });

  it("parses back what it formatted", () => {
    const parsed = parseDate("2024-03-05", "YYYY-MM-DD");
    expect(parsed).not.toBeNull();
    expect(sameDay(parsed!, new Date(2024, 2, 5))).toBe(true);
    expect(parseDate("2024年3月5日", "YYYY年MM月DD日")?.getDate()).toBe(5);
  });

  it("fills missing month / day with 1", () => {
    expect(parseDate("2024-07", "YYYY-MM")?.getTime()).toBe(new Date(2024, 6, 1).getTime());
    expect(parseDate("1999", "YYYY")?.getTime()).toBe(new Date(1999, 0, 1).getTime());
  });

  it("rejects malformed or impossible dates", () => {
    expect(parseDate("", "YYYY-MM-DD")).toBeNull();
    expect(parseDate("2024/03/05", "YYYY-MM-DD")).toBeNull();
    expect(parseDate("2024-13-01", "YYYY-MM-DD")).toBeNull();
    expect(parseDate("2023-02-29", "YYYY-MM-DD")).toBeNull();
    expect(parseDate("2024-02-29", "YYYY-MM-DD")).not.toBeNull();
  });
});

describe("buildCalendar", () => {
  it("always yields 42 cells and pads December with next January", () => {
    // 2024-12-01 恰好是周日，前面不用补
    const cells = buildCalendar(2024, 11, { today: new Date(2024, 11, 25) });
    expect(cells).toHaveLength(42);
    expect(sameDay(cells[0]!.date, new Date(2024, 11, 1))).toBe(true);
    expect(cells[0]!.inMonth).toBe(true);
    expect(sameDay(cells[41]!.date, new Date(2025, 0, 11))).toBe(true);
    expect(cells[41]!.inMonth).toBe(false);
    expect(cells.filter((cell) => cell.inMonth)).toHaveLength(31);
    expect(cells.find((cell) => cell.today)?.date.getDate()).toBe(25);
  });

  it("handles leap-year February with leading days from January", () => {
    // 2024-02-01 是周四，前面补 1 月 28–31
    const cells = buildCalendar(2024, 1, { selected: new Date(2024, 1, 29) });
    expect(sameDay(cells[0]!.date, new Date(2024, 0, 28))).toBe(true);
    expect(cells.filter((cell) => cell.inMonth)).toHaveLength(29);
    expect(sameDay(cells[41]!.date, new Date(2024, 2, 9))).toBe(true);
    expect(cells.find((cell) => cell.selected)?.date.getDate()).toBe(29);
  });

  it("respects firstDayOfWeek and disabledDate", () => {
    const cells = buildCalendar(2024, 1, {
      firstDayOfWeek: 1,
      isDisabled: (date) => date.getDay() === 0,
    });
    // 周一起：2 月 1 日周四前面补 1 月 29、30、31
    expect(sameDay(cells[0]!.date, new Date(2024, 0, 29))).toBe(true);
    expect(cells.filter((cell) => cell.disabled)).toHaveLength(6);
    expect(weekdayNames(1)).toEqual(["壹", "贰", "叁", "肆", "伍", "陆", "日"]);
  });
});

describe("addMonths / yearPageStart", () => {
  it("clamps the day when the target month is shorter", () => {
    expect(formatDate(addMonths(new Date(2024, 0, 31), 1), "YYYY-MM-DD")).toBe("2024-02-29");
    expect(formatDate(addMonths(new Date(2024, 11, 15), 1), "YYYY-MM-DD")).toBe("2025-01-15");
    expect(formatDate(addMonths(new Date(2024, 0, 15), -1), "YYYY-MM-DD")).toBe("2023-12-15");
  });

  it("aligns year pages to 12", () => {
    expect(yearPageStart(2024)).toBe(2016);
    expect(yearPageStart(2016)).toBe(2016);
    expect(yearPageStart(2027)).toBe(2016);
    expect(yearPageStart(2028)).toBe(2028);
  });
});

describe("toDate", () => {
  it("takes Date objects at local midnight and strings through parseDate", () => {
    expect(toDate(new Date(2024, 2, 5, 18, 20), "YYYY-MM-DD")?.getTime()).toBe(
      new Date(2024, 2, 5).getTime(),
    );
    expect(toDate("2024-03-05", "YYYY-MM-DD")?.getDate()).toBe(5);
  });

  it("returns null for empty, invalid or unparsable input", () => {
    expect(toDate(null, "YYYY-MM-DD")).toBeNull();
    expect(toDate("", "YYYY-MM-DD")).toBeNull();
    expect(toDate(new Date("nope"), "YYYY-MM-DD")).toBeNull();
    expect(toDate("2024/03/05", "YYYY-MM-DD")).toBeNull();
  });
});
