import { afterEach, describe, expect, it, vi } from "vitest";
import { createAutoComplete, type AutoCompleteOption, type AutoCompleteOptions } from ".";

const options: AutoCompleteOption[] = [
  { value: "shan", label: "山" },
  { value: "shui", label: "水" },
  { value: "yun", label: "云", disabled: true },
  { value: "yue", label: "月" },
];

function setup(overrides: Partial<AutoCompleteOptions> = {}) {
  const calls = {
    onCommit: vi.fn(),
    onSearch: vi.fn(),
    onSelect: vi.fn(),
    onFocus: vi.fn(),
    onBlur: vi.fn(),
    onClear: vi.fn(),
  };
  let current: AutoCompleteOptions = {
    options,
    filter: true,
    value: "",
    disabled: false,
    debounce: 0,
    emptyText: "",
    ...calls,
    ...overrides,
  };
  const ac = createAutoComplete(current);
  const input = document.createElement("input");
  document.body.append(input);
  ac.setInput(input);
  ac.connect();
  /** 模拟壳：写回 value 再喂给控制器，然后跑一遍 flush */
  calls.onCommit.mockImplementation((value: string) => {
    current = { ...current, value };
    ac.update(current);
    ac.flush?.();
  });
  const type = (value: string) => {
    input.value = value;
    ac.onInput({ target: input } as unknown as Event);
  };
  const key = (k: string) => {
    const event = new KeyboardEvent("keydown", { key: k, cancelable: true });
    ac.onKeydown(event);
    return event;
  };
  const set = (patch: Partial<AutoCompleteOptions>) => {
    current = { ...current, ...patch };
    ac.update(current);
    ac.flush?.();
  };
  return { ac, input, calls, type, key, set };
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.useRealTimers();
});

describe("createAutoComplete", () => {
  it("opens while typing, commits the text and emits search", () => {
    const { ac, calls, type } = setup();
    ac.onFocusin(new FocusEvent("focusin"));
    expect(ac.getSnapshot().open).toBe(true);
    type("sh");
    expect(calls.onCommit).toHaveBeenLastCalledWith("sh");
    expect(calls.onSearch).toHaveBeenLastCalledWith("sh");
    expect(ac.getSnapshot()).toMatchObject({ open: true, activeIndex: -1 });
    // 没有匹配、也没有 emptyText：收起
    type("zzz");
    expect(ac.getSnapshot().open).toBe(false);
  });

  it("debounces search and drops the pending call on disconnect", () => {
    vi.useFakeTimers();
    const { ac, calls, type } = setup({ debounce: 100 });
    type("s");
    type("sh");
    expect(calls.onSearch).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(calls.onSearch).toHaveBeenCalledTimes(1);
    expect(calls.onSearch).toHaveBeenCalledWith("sh");
    type("shu");
    ac.disconnect();
    vi.advanceTimersByTime(200);
    expect(calls.onSearch).toHaveBeenCalledTimes(1);
  });

  it("re-opens when the options arrive after search (filter=false)", () => {
    const { ac, type, set } = setup({ filter: false, options: [] });
    ac.onFocusin(new FocusEvent("focusin"));
    expect(ac.getSnapshot().open).toBe(false);
    type("sh");
    expect(ac.getSnapshot().open).toBe(false);
    set({ options: [{ value: "shan" }] });
    expect(ac.getSnapshot().open).toBe(true);
    // 候选又空了就收起，再来又弹
    set({ options: [] });
    expect(ac.getSnapshot().open).toBe(false);
    set({ options: [{ value: "shui" }] });
    expect(ac.getSnapshot().open).toBe(true);
  });

  it("shows the empty text instead of closing when one is given", () => {
    const { ac, type } = setup({ emptyText: "无匹配" });
    ac.onFocusin(new FocusEvent("focusin"));
    type("zzz");
    expect(ac.getSnapshot().open).toBe(true);
  });

  it("walks the list with the arrows, skipping disabled, and picks with Enter", () => {
    const { ac, calls, key } = setup();
    ac.onFocusin(new FocusEvent("focusin"));
    ac.setOpen(false);
    key("ArrowDown");
    expect(ac.getSnapshot()).toMatchObject({ open: true, activeIndex: 0 });
    key("ArrowDown");
    expect(ac.getSnapshot().activeIndex).toBe(1);
    // 云 是 disabled，跳到 月
    key("ArrowDown");
    expect(ac.getSnapshot().activeIndex).toBe(3);
    key("ArrowUp");
    expect(ac.getSnapshot().activeIndex).toBe(1);
    const enter = key("Enter");
    expect(enter.defaultPrevented).toBe(true);
    expect(calls.onCommit).toHaveBeenLastCalledWith("shui");
    expect(calls.onSelect).toHaveBeenCalledWith(options[1]);
    expect(ac.getSnapshot().open).toBe(false);
  });

  it("leaves Enter alone when nothing is highlighted", () => {
    const { ac, calls, key } = setup();
    ac.onFocusin(new FocusEvent("focusin"));
    expect(ac.getSnapshot()).toMatchObject({ open: true, activeIndex: -1 });
    const enter = key("Enter");
    expect(enter.defaultPrevented).toBe(false);
    expect(calls.onSelect).not.toHaveBeenCalled();
  });

  it("closes on Escape / Tab and stays closed until the next keystroke", () => {
    const { ac, key, type, set } = setup();
    ac.onFocusin(new FocusEvent("focusin"));
    const esc = key("Escape");
    expect(esc.defaultPrevented).toBe(true);
    expect(ac.getSnapshot().open).toBe(false);
    // 候选项变了也不自动弹
    set({ options: [...options] });
    expect(ac.getSnapshot().open).toBe(false);
    type("s");
    expect(ac.getSnapshot().open).toBe(true);
    key("Tab");
    expect(ac.getSnapshot().open).toBe(false);
  });

  it("clears, focuses the input and reports the empty search", () => {
    const { ac, input, calls, type } = setup();
    type("sh");
    ac.clear();
    expect(calls.onCommit).toHaveBeenLastCalledWith("");
    expect(calls.onClear).toHaveBeenCalledTimes(1);
    expect(calls.onSearch).toHaveBeenLastCalledWith("");
    expect(ac.getSnapshot().open).toBe(false);
    expect(document.activeElement).toBe(input);
  });

  it("ignores everything while disabled", () => {
    const { ac, calls, type, key } = setup({ disabled: true });
    ac.onFocusin(new FocusEvent("focusin"));
    expect(ac.getSnapshot().open).toBe(false);
    type("sh");
    key("ArrowDown");
    ac.choose(options[0]!);
    ac.clear();
    expect(calls.onCommit).not.toHaveBeenCalled();
    expect(calls.onSelect).not.toHaveBeenCalled();
    expect(ac.getSnapshot().open).toBe(false);
  });

  it("treats focus moving inside the root as not blurring", () => {
    const { ac, calls } = setup();
    const root = document.createElement("div");
    const inside = document.createElement("button");
    root.append(inside);
    document.body.append(root);
    ac.setRoot(root);
    ac.onFocusin(new FocusEvent("focusin"));
    ac.onFocusout(new FocusEvent("focusout", { relatedTarget: inside }));
    expect(ac.getSnapshot().focused).toBe(true);
    ac.onFocusout(new FocusEvent("focusout", { relatedTarget: null }));
    expect(ac.getSnapshot()).toMatchObject({ focused: false, open: false });
    expect(calls.onBlur).toHaveBeenCalledTimes(1);
  });
});
