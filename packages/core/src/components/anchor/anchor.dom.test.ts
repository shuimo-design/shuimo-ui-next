import { afterEach, describe, expect, it, vi } from "vitest";
import { createAnchor, resolveAnchorContainer, type AnchorOptions } from ".";

/** 一个 200px 高的滚动盒子，里面三节各 400px 高；旁边一个 nav，激活项挂着类名 */
function mount() {
  const box = document.createElement("div");
  box.id = "box";
  box.style.cssText = "height: 200px; overflow: auto";
  for (const id of ["a", "b", "c"]) {
    const section = document.createElement("section");
    section.id = id;
    section.style.cssText = "height: 400px";
    box.appendChild(section);
  }
  const nav = document.createElement("nav");
  nav.style.cssText = "position: relative";
  for (const id of ["a", "b", "c"]) {
    const link = document.createElement("a");
    link.href = `#${id}`;
    link.className = "m-anchor__link";
    link.style.cssText = "display: block; height: 20px";
    nav.appendChild(link);
  }
  document.body.append(box, nav);
  return { box, nav };
}

function setup(overrides: Partial<AnchorOptions> = {}) {
  const { box, nav } = mount();
  const onChange = vi.fn();
  const options: AnchorOptions = {
    container: "#box",
    hrefs: ["#a", "#b", "#c"],
    offset: 0,
    targetOffset: 0,
    smooth: false,
    updateHash: false,
    horizontal: false,
    current: "",
    onChange,
    ...overrides,
  };
  const anchor = createAnchor(options);
  /** 模拟壳：onChange 写回 current、换激活类名，再喂一次 update + flush */
  onChange.mockImplementation((href: string) => {
    options.current = href;
    for (const link of nav.querySelectorAll<HTMLAnchorElement>("a")) {
      link.classList.toggle("m-anchor__link--active", link.getAttribute("href") === href);
    }
    anchor.update({ ...options });
    anchor.flush?.();
  });
  anchor.setNav(nav);
  anchor.connect();
  return { anchor, box, nav, onChange, options };
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("createAnchor", () => {
  it("resolves the container by selector, element and function", () => {
    const { box } = mount();
    expect(resolveAnchorContainer("#box")).toBe(box);
    expect(resolveAnchorContainer(box)).toBe(box);
    expect(resolveAnchorContainer(() => box)).toBe(box);
    expect(resolveAnchorContainer("#nope")).toBeNull();
    expect(resolveAnchorContainer(undefined)).toBe(document.scrollingElement);
  });

  it("activates the first anchor on connect and follows the scroll", async () => {
    const { anchor, box, onChange } = setup();
    expect(anchor.element()).toBe(box);
    expect(onChange).toHaveBeenLastCalledWith("#a");
    box.scrollTop = 450;
    await vi.waitFor(() => expect(onChange).toHaveBeenLastCalledWith("#b"));
    // 滚到底：最后一节点亮
    box.scrollTop = 10000;
    await vi.waitFor(() => expect(onChange).toHaveBeenLastCalledWith("#c"));
    box.scrollTop = 0;
    await vi.waitFor(() => expect(onChange).toHaveBeenLastCalledWith("#a"));
  });

  it("measures the indicator from the active link and moves it", async () => {
    const { anchor, box } = setup();
    expect(anchor.getServerSnapshot().indicator).toEqual({ size: 0, offset: 0 });
    expect(anchor.getSnapshot().indicator).toEqual({ size: 20, offset: 0 });
    box.scrollTop = 450;
    await vi.waitFor(() =>
      expect(anchor.getSnapshot().indicator).toEqual({ size: 20, offset: 20 }),
    );
  });

  it("scrolls to the target on scrollTo, keeps the clicked item active while scrolling", async () => {
    const { anchor, box, onChange } = setup({ targetOffset: 10 });
    anchor.scrollTo("#c");
    expect(onChange).toHaveBeenLastCalledWith("#c");
    await vi.waitFor(() => expect(box.scrollTop).toBe(800 - 10));
    // 滚动途中不重判：丙保持激活（它顶边在 offset 之下，按判定本该是乙）
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(onChange).toHaveBeenLastCalledWith("#c");
    // 找不到的目标什么都不做
    const calls = onChange.mock.calls.length;
    anchor.scrollTo("#nope");
    expect(onChange).toHaveBeenCalledTimes(calls);
    expect(location.hash).toBe("");
  });

  it("writes the hash only when asked", () => {
    const { anchor } = setup({ updateHash: true });
    anchor.scrollTo("#b");
    expect(location.hash).toBe("#b");
    history.replaceState(null, "", location.pathname);
  });

  it("rebinds when the container changes and stops on disconnect", async () => {
    const { anchor, box, onChange, options } = setup();
    const other = document.createElement("div");
    other.id = "other";
    other.style.cssText = "height: 100px; overflow: auto";
    const tall = document.createElement("div");
    tall.style.cssText = "height: 1000px";
    other.appendChild(tall);
    document.body.appendChild(other);
    anchor.update({ ...options, container: "#other" });
    anchor.flush?.();
    expect(anchor.element()).toBe(other);
    anchor.disconnect();
    expect(anchor.element()).toBeNull();
    expect(anchor.getSnapshot().indicator).toEqual({ size: 0, offset: 0 });
    const calls = onChange.mock.calls.length;
    box.scrollTop = 450;
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(onChange).toHaveBeenCalledTimes(calls);
  });
});
