/** 探针：SVG 作为图片（img / CSS mask）时 SMIL 动画是否运行。BENCH=1 vp test bench/smil-probe */
import { expect, it } from "vitest";
import { commands } from "vitest/browser";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="20"><rect x="0" y="0" width="0" height="20" fill="black"><animate attributeName="width" from="0" to="100" dur="0.6s" fill="freeze"/></rect></svg>`;
const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

function blackFraction(img: HTMLImageElement): number {
  const c = document.createElement("canvas");
  c.width = 100;
  c.height = 20;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, 100, 20).data;
  let n = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i]! > 0) n++;
  return n / (100 * 20);
}

it("smil in svg-as-image", async () => {
  const img = new Image();
  img.src = url;
  document.body.append(img);
  await img.decode();
  const t0 = blackFraction(img);
  await new Promise((r) => setTimeout(r, 900));
  const t1 = blackFraction(img);

  // CSS mask：用一个元素 + mask，再用 elementFromPoint 探不了像素；退而用 background-image 的 img 同源判断
  const result = { imgAtStart: t0, imgAfter: t1, animatesAsImage: t1 > t0 + 0.5 };
  await commands.writeFile("bench/results/smil-probe.json", JSON.stringify(result) + "\n");
  expect(result.animatesAsImage).toBe(true);
});
