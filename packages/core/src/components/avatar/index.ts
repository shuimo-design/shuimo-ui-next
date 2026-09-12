/**
 * 头像的无框架部分：尺寸归一化、class 派生、两种形状的墨迹变量。
 * 尺寸是已知的像素数（不用量元素），所以整套 CSS 变量在渲染期就能算出来，
 * 服务端和客户端首帧一致，两个壳拿到的是同一份字符串。
 */
import { svgToDataUrl } from "../../ink/assets/brush";
import { inkBlobUrl } from "../../ink/assets/blob";
import { inkRingUrl } from "../../ink/assets/ring";
import { generateInkShape } from "../../ink/assets/shape";
import { generateBrushBorder } from "../../ink/stroke";
import type { AvatarProps, AvatarSize } from "./types";

export type { AvatarProps, AvatarSize, AvatarVariant } from "./types";

/** 预设档位对应的像素边长 */
const SIZES = { sm: 24, md: 40, lg: 50 } as const;

/** 档位名换算成像素；直接传数字就是它本身 */
export function avatarPx(size: AvatarSize = "md"): number {
  return typeof size === "number" ? size : SIZES[size];
}

export function avatarClasses(props: AvatarProps): string[] {
  const { variant = "circle", size = "md" } = props;
  return [
    "m-avatar",
    `m-avatar--${variant}`,
    // 传像素数时没有档位类，尺寸全靠 --m-avatar-size
    ...(typeof size === "number" ? [] : [`m-avatar--${size}`]),
  ];
}

/**
 * 两张图都按实际大小直接生成，不用量元素：
 * 圆——图片被毛边墨团裁成圆，外面套一笔墨圈；方——图片被毛边矩形裁，外面套一圈笔触边框。
 */
export function avatarVars(props: AvatarProps): Record<string, string> {
  const { variant = "circle", seed = 1 } = props;
  const s = avatarPx(props.size);
  const vars: Record<string, string> = { "--m-avatar-size": `${s}px` };
  if (variant === "circle") {
    const ring = inkRingUrl({ seed, size: s });
    const body = Math.round(s * 0.84);
    vars["--m-avatar-body"] = `${body}px`;
    vars["--m-avatar-mask"] =
      `url("${inkBlobUrl({ seed, size: 64, raggedness: 0.05, radius: 0.47 })}")`;
    vars["--m-avatar-mask-size"] = "100% 100%";
    vars["--m-avatar-frame"] = `url("${ring.url}")`;
    vars["--m-avatar-frame-pad"] = `${ring.padding}px`;
  } else {
    const stroke = Math.max(2, s * 0.075);
    const border = generateBrushBorder(s, s, {
      seed,
      strokeWidth: stroke,
      roughness: 0.8,
      flyingWhite: 0.25,
      overshoot: s * 0.04,
      wobble: stroke * 0.2,
    });
    const body = Math.round(s - stroke);
    const shape = generateInkShape(body, body, { seed, raggedness: 0.35, corner: 0.05 });
    vars["--m-avatar-body"] = `${body}px`;
    vars["--m-avatar-mask"] = `url("${shape.url}")`;
    vars["--m-avatar-mask-size"] = `${shape.width}px ${shape.height}px`;
    vars["--m-avatar-frame"] = `url("${svgToDataUrl(border.svg)}")`;
    vars["--m-avatar-frame-pad"] = `${border.padding}px`;
  }
  return vars;
}
