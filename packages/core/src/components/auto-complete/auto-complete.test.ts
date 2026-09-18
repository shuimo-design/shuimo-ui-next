import { describe, expect, it } from "vitest";
import {
  autoCompleteActiveId,
  autoCompleteClasses,
  autoCompleteFindEnabled,
  autoCompleteLabel,
  autoCompleteMatches,
  autoCompleteOptionClasses,
  autoCompleteShouldOpen,
  autoCompleteShowClear,
  autoCompleteVisible,
  type AutoCompleteOption,
} from ".";

const options: AutoCompleteOption[] = [
  { value: "shan", label: "山" },
  { value: "shui" },
  { value: "Shu", disabled: true },
  { value: "yue", label: "月" },
];

describe("autoCompleteVisible", () => {
  it("matches by prefix on value or label, case-insensitively", () => {
    expect(autoCompleteVisible(options, "SH", true).map((o) => o.value)).toEqual([
      "shan",
      "shui",
      "Shu",
    ]);
    expect(autoCompleteVisible(options, "山", true).map((o) => o.value)).toEqual(["shan"]);
    expect(autoCompleteVisible(options, "hu", true)).toEqual([]);
    expect(autoCompleteVisible(options, "  ", true)).toHaveLength(4);
  });

  it("keeps everything when filter is false and honours a custom filter", () => {
    expect(autoCompleteVisible(options, "zzz", false)).toHaveLength(4);
    const contains = (input: string, o: AutoCompleteOption) => o.value.includes(input);
    expect(autoCompleteVisible(options, "hu", contains).map((o) => o.value)).toEqual([
      "shui",
      "Shu",
    ]);
    expect(autoCompleteMatches("u", options[1]!, contains)).toBe(true);
  });

  it("falls back to value as the label", () => {
    expect(autoCompleteLabel(options[0]!)).toBe("山");
    expect(autoCompleteLabel(options[1]!)).toBe("shui");
  });
});

describe("autoCompleteFindEnabled", () => {
  it("skips disabled items and wraps around", () => {
    expect(autoCompleteFindEnabled(options, -1, 1)).toBe(0);
    expect(autoCompleteFindEnabled(options, 1, 1)).toBe(3);
    expect(autoCompleteFindEnabled(options, 3, 1)).toBe(0);
    expect(autoCompleteFindEnabled(options, 0, -1)).toBe(3);
    expect(autoCompleteFindEnabled([{ value: "a", disabled: true }], -1, 1)).toBe(-1);
    expect(autoCompleteFindEnabled([], -1, 1)).toBe(-1);
  });
});

describe("autoCompleteShouldOpen / autoCompleteShowClear", () => {
  it("opens with matches, or with an empty text to show", () => {
    expect(autoCompleteShouldOpen({ count: 1, emptyText: "" })).toBe(true);
    expect(autoCompleteShouldOpen({ count: 0, emptyText: "" })).toBe(false);
    expect(autoCompleteShouldOpen({ count: 0, emptyText: "无匹配" })).toBe(true);
  });

  it("shows the clear button only with text, enabled and clearable", () => {
    expect(autoCompleteShowClear({ clearable: true, disabled: false, value: "a" })).toBe(true);
    expect(autoCompleteShowClear({ clearable: true, disabled: false, value: "" })).toBe(false);
    expect(autoCompleteShowClear({ clearable: true, disabled: true, value: "a" })).toBe(false);
    expect(autoCompleteShowClear({ clearable: false, disabled: false, value: "a" })).toBe(false);
  });
});

describe("classes and aria", () => {
  it("derives the modifier classes", () => {
    expect(autoCompleteClasses({ open: true, focused: true, disabled: false })).toEqual([
      "m-auto-complete",
      "m-auto-complete--open",
      "m-auto-complete--focused",
    ]);
    expect(autoCompleteClasses({ open: false, focused: false, disabled: true })).toEqual([
      "m-auto-complete",
      "m-auto-complete--disabled",
    ]);
    expect(autoCompleteOptionClasses({ active: true, disabled: true })).toEqual([
      "m-auto-complete__option",
      "m-auto-complete__option--active",
      "m-auto-complete__option--disabled",
    ]);
  });

  it("writes aria-activedescendant only while open with a highlight", () => {
    expect(autoCompleteActiveId("lb", { open: true, activeIndex: 2 })).toBe("lb-2");
    expect(autoCompleteActiveId("lb", { open: true, activeIndex: -1 })).toBeUndefined();
    expect(autoCompleteActiveId("lb", { open: false, activeIndex: 2 })).toBeUndefined();
  });
});
