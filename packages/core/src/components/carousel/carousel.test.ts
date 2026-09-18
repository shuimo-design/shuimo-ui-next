import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CAROUSEL_AUTOPLAY_INTERVAL,
  carouselArrowDisabled,
  carouselClasses,
  carouselDirection,
  carouselInterval,
  carouselKeyIndex,
  carouselStep,
  carouselStyle,
  createCarousel,
  normalizeCarouselIndex,
  type CarouselOptions,
} from ".";

describe("carousel pure functions", () => {
  it("derives the root classes from direction / arrows / indicator", () => {
    expect(
      carouselClasses({ direction: "horizontal", arrows: "hover", indicator: "dots" }),
    ).toEqual([
      "m-carousel",
      "m-carousel--horizontal",
      "m-carousel--arrows-hover",
      "m-carousel--dots",
    ]);
    expect(carouselClasses({ direction: "vertical", arrows: "none", indicator: "none" })).toEqual([
      "m-carousel",
      "m-carousel--vertical",
      "m-carousel--arrows-none",
    ]);
  });

  it("normalizes autoplay into milliseconds", () => {
    expect(carouselInterval(undefined)).toBe(0);
    expect(carouselInterval(false)).toBe(0);
    expect(carouselInterval(true)).toBe(CAROUSEL_AUTOPLAY_INTERVAL);
    expect(carouselInterval(1500)).toBe(1500);
    expect(carouselInterval(0)).toBe(0);
    expect(carouselInterval(-5)).toBe(0);
    expect(carouselInterval(Number.NaN)).toBe(0);
  });

  it("clamps the model into the slide range", () => {
    expect(normalizeCarouselIndex(undefined, 3)).toBe(0);
    expect(normalizeCarouselIndex(-1, 3)).toBe(0);
    expect(normalizeCarouselIndex(7, 3)).toBe(2);
    expect(normalizeCarouselIndex(1.8, 3)).toBe(1);
    expect(normalizeCarouselIndex(2, 0)).toBe(0);
  });

  it("steps with and without loop", () => {
    expect(carouselStep({ current: 2, delta: 1, count: 3, loop: true })).toBe(0);
    expect(carouselStep({ current: 0, delta: -1, count: 3, loop: true })).toBe(2);
    expect(carouselStep({ current: 2, delta: 1, count: 3, loop: false })).toBeUndefined();
    expect(carouselStep({ current: 0, delta: -1, count: 3, loop: false })).toBeUndefined();
    expect(carouselStep({ current: 1, delta: 1, count: 3, loop: false })).toBe(2);
    // 只有一张永远走不动
    expect(carouselStep({ current: 0, delta: 1, count: 1, loop: true })).toBeUndefined();
    expect(carouselArrowDisabled({ current: 2, delta: 1, count: 3, loop: false })).toBe(true);
    expect(carouselArrowDisabled({ current: 2, delta: 1, count: 3, loop: true })).toBe(false);
  });

  it("tells the visual direction, wrapping when loop is on", () => {
    expect(carouselDirection(0, 1, { count: 3, loop: true })).toBe(1);
    expect(carouselDirection(1, 0, { count: 3, loop: true })).toBe(-1);
    expect(carouselDirection(2, 0, { count: 3, loop: true })).toBe(1);
    expect(carouselDirection(0, 2, { count: 3, loop: true })).toBe(-1);
    // 不 loop 时按下标大小
    expect(carouselDirection(2, 0, { count: 3, loop: false })).toBe(-1);
    expect(carouselDirection(0, 2, { count: 3, loop: false })).toBe(1);
  });

  it("maps keys to slide indexes and leaves other keys alone", () => {
    const h = { current: 1, count: 3, loop: false, vertical: false };
    expect(carouselKeyIndex("ArrowRight", h)).toBe(2);
    expect(carouselKeyIndex("ArrowLeft", h)).toBe(0);
    expect(carouselKeyIndex("ArrowDown", h)).toBeUndefined();
    expect(carouselKeyIndex("Home", h)).toBe(0);
    expect(carouselKeyIndex("End", h)).toBe(2);
    expect(carouselKeyIndex("Enter", h)).toBeUndefined();
    const v = { ...h, vertical: true };
    expect(carouselKeyIndex("ArrowDown", v)).toBe(2);
    expect(carouselKeyIndex("ArrowUp", v)).toBe(0);
    expect(carouselKeyIndex("ArrowRight", v)).toBeUndefined();
    // 不 loop 到头：交还给页面
    expect(carouselKeyIndex("ArrowRight", { ...h, current: 2 })).toBeUndefined();
    expect(carouselKeyIndex("ArrowRight", { ...h, current: 2, loop: true })).toBe(0);
  });

  it("writes direction, height and the seeded dot into root variables", () => {
    const style = carouselStyle({ height: 200, direction: -1, seed: 3 });
    expect(style["--m-carousel-dir"]).toBe("-1");
    expect(style["--m-carousel-h"]).toBe("200px");
    expect(style["--m-carousel-dot"]).toContain("data:image/svg+xml");
    expect(carouselStyle({ height: "40vh", direction: 1, seed: 3 })["--m-carousel-h"]).toBe("40vh");
    expect(carouselStyle({ direction: 1, seed: 3 })["--m-carousel-h"]).toBeUndefined();
    // seed 决定墨点，同 seed 同图
    expect(carouselStyle({ direction: 1, seed: 3 })["--m-carousel-dot"]).toBe(
      carouselStyle({ direction: 1, seed: 3 })["--m-carousel-dot"],
    );
    expect(carouselStyle({ direction: 1, seed: 4 })["--m-carousel-dot"]).not.toBe(
      carouselStyle({ direction: 1, seed: 3 })["--m-carousel-dot"],
    );
  });
});

describe("createCarousel", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function setup(overrides: Partial<CarouselOptions> = {}) {
    const onChange = vi.fn();
    const options: CarouselOptions = {
      count: 3,
      current: 0,
      interval: 1000,
      loop: true,
      vertical: false,
      onChange,
      ...overrides,
    };
    const carousel = createCarousel(options);
    /** 模拟壳：onChange 写回 current，再喂一次 update + flush */
    onChange.mockImplementation((next: number) => {
      options.current = next;
      carousel.update({ ...options });
      carousel.flush?.();
    });
    return { carousel, onChange, options };
  }

  it("does not play before connect and ticks through the slides after", () => {
    const { carousel, onChange } = setup();
    expect(carousel.getServerSnapshot().playing).toBe(false);
    vi.advanceTimersByTime(3000);
    expect(onChange).not.toHaveBeenCalled();

    carousel.connect();
    expect(carousel.getSnapshot().playing).toBe(true);
    vi.advanceTimersByTime(1000);
    expect(onChange).toHaveBeenLastCalledWith(1, 0);
    vi.advanceTimersByTime(1000);
    expect(onChange).toHaveBeenLastCalledWith(2, 1);
    // loop：最后一张再往后回到第一张
    vi.advanceTimersByTime(1000);
    expect(onChange).toHaveBeenLastCalledWith(0, 2);
    carousel.disconnect();
    expect(carousel.getSnapshot().playing).toBe(false);
    vi.advanceTimersByTime(5000);
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it("stops at the last slide when loop is off", () => {
    const { carousel, onChange } = setup({ loop: false, current: 2 });
    carousel.connect();
    vi.advanceTimersByTime(3000);
    expect(onChange).not.toHaveBeenCalled();
    expect(carousel.getSnapshot().playing).toBe(false);
  });

  it("restarts the countdown when the current slide changes by hand", () => {
    const { carousel, onChange } = setup();
    carousel.connect();
    vi.advanceTimersByTime(800);
    carousel.next();
    expect(onChange).toHaveBeenLastCalledWith(1, 0);
    // 刚翻过一张，重新数 1000ms，而不是再过 200ms 就走
    vi.advanceTimersByTime(800);
    expect(onChange).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(200);
    expect(onChange).toHaveBeenLastCalledWith(2, 1);
  });

  it("does not reschedule on a flush that changes nothing", () => {
    const { carousel } = setup();
    carousel.connect();
    vi.advanceTimersByTime(900);
    carousel.flush?.();
    vi.advanceTimersByTime(100);
    expect(carousel.getSnapshot().playing).toBe(true);
  });

  it("goTo / prev / next / keys respect the range and loop", () => {
    const { carousel, onChange } = setup({ interval: 0, loop: false });
    carousel.connect();
    carousel.prev();
    expect(onChange).not.toHaveBeenCalled();
    carousel.next();
    expect(onChange).toHaveBeenLastCalledWith(1, 0);
    carousel.goTo(9);
    expect(onChange).toHaveBeenLastCalledWith(2, 1);
    carousel.goTo(2);
    expect(onChange).toHaveBeenCalledTimes(2);

    const prevented = vi.fn();
    carousel.onKeyDown({
      key: "ArrowRight",
      preventDefault: prevented,
    } as unknown as KeyboardEvent);
    expect(prevented).not.toHaveBeenCalled();
    carousel.onKeyDown({ key: "Home", preventDefault: prevented } as unknown as KeyboardEvent);
    expect(prevented).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith(0, 2);
    // interval 为 0 从不自动走
    vi.advanceTimersByTime(10000);
    expect(onChange).toHaveBeenCalledTimes(3);
    expect(carousel.getSnapshot().playing).toBe(false);
  });

  it("is idempotent across double connect / disconnect", () => {
    const { carousel } = setup();
    carousel.connect();
    carousel.connect();
    expect(carousel.getSnapshot().playing).toBe(true);
    carousel.disconnect();
    carousel.disconnect();
    expect(carousel.getSnapshot().playing).toBe(false);
  });
});
