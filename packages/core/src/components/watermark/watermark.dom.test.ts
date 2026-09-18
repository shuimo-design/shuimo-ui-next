import { afterEach, describe, expect, it } from "vitest";
import { createWatermark, WATERMARK_LAYER_CLASS } from ".";

const STYLE = { "--m-watermark-z": "9", "--m-watermark-tile": "100px 100px" };

function mount() {
  const root = document.createElement("div");
  const layer = document.createElement("div");
  layer.className = WATERMARK_LAYER_CLASS;
  layer.setAttribute("aria-hidden", "true");
  for (const [key, value] of Object.entries(STYLE)) layer.style.setProperty(key, value);
  root.append(document.createTextNode("内容"), layer);
  document.body.append(root);
  return { root, layer };
}

/** MutationObserver 的回调在微任务里跑，等一轮 */
const tick = () => new Promise<void>((resolve) => queueMicrotask(resolve));

afterEach(() => {
  document.body.innerHTML = "";
});

describe("createWatermark", () => {
  it("puts the layer back when it is removed", async () => {
    const { root, layer } = mount();
    const guard = createWatermark({ style: STYLE });
    guard.attach(root);
    guard.setLayer(layer);
    guard.connect();
    layer.remove();
    await tick();
    expect(layer.parentNode).toBe(root);
    expect(guard.getSnapshot().restores).toBe(1);
    guard.disconnect();
  });

  it("rewrites class, style and stray attributes", async () => {
    const { root, layer } = mount();
    const guard = createWatermark({ style: STYLE });
    guard.attach(root);
    guard.setLayer(layer);
    guard.connect();
    layer.style.display = "none";
    layer.setAttribute("hidden", "");
    layer.className = "x";
    await tick();
    expect(layer.style.display).toBe("");
    expect(layer.hasAttribute("hidden")).toBe(false);
    expect(layer.className).toBe(WATERMARK_LAYER_CLASS);
    expect(layer.style.getPropertyValue("--m-watermark-z")).toBe("9");
    // 三次改动在同一轮里，贴回去算一次
    expect(guard.getSnapshot().restores).toBe(1);
    guard.disconnect();
  });

  it("uses the latest style handed in by update()", async () => {
    const { root, layer } = mount();
    const guard = createWatermark({ style: STYLE });
    guard.attach(root);
    guard.setLayer(layer);
    guard.connect();
    const next = { ...STYLE, "--m-watermark-z": "20" };
    guard.update({ style: next });
    // 壳自己按新样式改一遍不算篡改
    layer.style.setProperty("--m-watermark-z", "20");
    await tick();
    expect(guard.getSnapshot().restores).toBe(0);
    layer.style.setProperty("--m-watermark-z", "1");
    await tick();
    expect(layer.style.getPropertyValue("--m-watermark-z")).toBe("20");
    expect(guard.getSnapshot().restores).toBe(1);
    guard.disconnect();
  });

  it("stops watching after disconnect and is idempotent", async () => {
    const { root, layer } = mount();
    const guard = createWatermark({ style: STYLE });
    guard.attach(root);
    guard.setLayer(layer);
    guard.connect();
    guard.connect();
    guard.disconnect();
    guard.disconnect();
    layer.remove();
    await tick();
    expect(layer.parentNode).toBeNull();
    expect(guard.getSnapshot().restores).toBe(0);
  });
});
