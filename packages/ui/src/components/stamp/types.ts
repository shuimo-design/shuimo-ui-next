import type {
  PolygonOrientation,
  StampCorner,
  StampDirection,
  StampMode,
  StampShape,
} from "../../ink/stamp";

export type { PolygonOrientation, StampCorner, StampDirection, StampMode, StampShape };

export interface StampProps {
  /** 印文：字符串自动分列（竖排、从右往左读）；数组每项是一列，第一项在最右 */
  text: string | string[];
  /** 印章高度（px），宽度按印文和形状算出来 */
  size?: number;
  /** 阳文（朱文，红字红框）还是阴文（白文，红底白字） */
  mode?: StampMode;
  /** 外形：auto 贴着印文、square 方、rect 长方、circle 圆、ellipse 椭圆、polygon 多边形 */
  shape?: StampShape;
  /** 宽高比，rect / ellipse / polygon 用 */
  aspect?: number;
  /** 多边形边数（3 起），默认 6 */
  sides?: number;
  /** 多边形朝向：flat-top 一条边在上，point-top 一个角在上 */
  orientation?: PolygonOrientation;
  /** 随机种子：四角半径、边框磨损、印泥白斑都由它决定，同种子同章 */
  seed?: number;
  /** 印泥色，默认 --m-seal（朱砂） */
  color?: string;
  /** 字体族，默认 --m-font-seal；要篆体自己 @font-face 引好再传名字 */
  font?: string;
  /** 边框厚度（px），默认 size × 3.5% */
  border?: number;
  /** 圆角：round 带一点随机的圆角，none 直角 */
  corner?: StampCorner;
  /** 圆角半径（px），默认短边 4% */
  cornerRadius?: number;
  /** 边框磨损 0 ~ 1：一圈起伏加几个咬进边框的缺口，默认 0.5 */
  roughness?: number;
  /** 刀刻 0 ~ 1：文字边缘的崩口和石屑，默认 0.8 */
  carving?: number;
  /** 印泥 0 ~ 1：没压实的白斑和边缘起毛，默认 0.7 */
  bleed?: number;
  /** 文字到边框的内边距（px），默认 size × 4% */
  padding?: number;
  /** 字距和列距（px），默认 size × 1% */
  gap?: number;
  /** 同列字与字的距离，覆盖 gap */
  rowGap?: number;
  /** 列与列的距离，覆盖 gap */
  columnGap?: number;
  /** 字符串印文分几列，默认按字数取近似方形 */
  columns?: number;
  /** 每个字非等比撑满格子（九叠篆那种）；方 / 圆 / 多边形默认开 */
  stretch?: boolean;
  /** 行高分配：uniform 等分，fit 按各行最高的字分（矮字不留空） */
  cellHeightMode?: "uniform" | "fit";
  /** 文字在框内左右偏移，-1 贴右、0 居中、1 贴左 */
  offsetX?: number;
  /** 文字在框内上下偏移，-1 贴上、0 居中、1 贴下 */
  offsetY?: number;
  /** ttb-rtl 竖排；circular 沿圆周排（圆章用） */
  direction?: StampDirection;
  /** 阴章的界格：列与列、行与行之间抠一道纸色 */
  gridLines?: boolean;
  /** 界格线宽（px），默认字号 6% */
  gridLineWidth?: number;
  /** 盖章的歪斜角度（deg） */
  rotate?: number;
}
