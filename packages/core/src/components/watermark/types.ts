export interface WatermarkFont {
  /** 字号 px，默认 14 */
  size?: number;
  /** 字体族，默认衬线字（SVG 平铺图里读不到 CSS 变量，所以是一串具体的字体名） */
  family?: string;
  /** 字重，默认 400 */
  weight?: number | string;
  /** 墨色，默认淡墨（--m-ink 掺 15% 透明），跟随深浅主题 */
  color?: string;
}

export interface WatermarkProps {
  /** 水印文字；数组按行排 */
  content?: string | string[];
  /** 水印图片地址；传了就不画字 */
  image?: string;
  /** 文字的字号、字体、字重、墨色 */
  font?: WatermarkFont;
  /** 旋转角度 deg，默认 -22 */
  rotate?: number;
  /** 相邻水印的横向、纵向间距 px，默认 [100, 100] */
  gap?: [number, number];
  /** 平铺起点的偏移 px，默认各取 gap 的一半 */
  offset?: [number, number];
  /** 单个水印的宽 px；不传按字号和字数估算 */
  width?: number;
  /** 单个水印的高 px；不传按字号和行数估算 */
  height?: number;
  /** 水印层的 z-index，默认 9 */
  zIndex?: number;
  /** 水墨皮下文字加一层按 seed 生成的晕染；false 是干净的字。默认 true */
  ink?: boolean;
  /** 晕染的随机种子，同 seed 同纹理，默认 1 */
  seed?: number;
}

export interface WatermarkSlots {
  /** 被水印覆盖的内容 */
  default?: () => unknown;
}
