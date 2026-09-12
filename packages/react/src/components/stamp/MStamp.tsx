import { useCallback, useEffect, useId, type CSSProperties } from "react";
import {
  createStampFont,
  stampClasses,
  stampId,
  stampPlainText,
  stampRender,
  stampStyle,
  type StampProps as CoreStampProps,
} from "@shuimo-design/core";
import { PROBE_SIZE } from "../../ink";
import { useController } from "../../runtime";

export interface MStampProps extends CoreStampProps {
  className?: string;
  style?: CSSProperties;
}

export function MStamp(props: MStampProps) {
  const id = stampId(useId());
  const plain = stampPlainText(props.text);

  // 字的墨迹框要等字体到了才量得准：控制器先给 undefined（兜底比例排一版），
  // 字体加载完把真度量推过来，这里重排一次
  const [fontController, fontState] = useController(createStampFont, { text: plain });
  // ref 回调的身份必须稳定：变了 React 会先 ref(null) 再 ref(node)，白白重量一次
  const svgRef = useCallback(
    (el: SVGSVGElement | null) => fontController.attach(el),
    [fontController],
  );
  // 印文或字体族换了要重新量
  useEffect(() => {
    fontController.refresh();
  }, [fontController, plain, props.font]);

  const render = stampRender(props, id, fontState.measure);

  const glyphs = (className: string, fill?: string) =>
    render.cells.map((cell) => (
      <text
        key={`${cell.column}-${cell.row}`}
        className={className}
        x="0"
        y="0"
        fontSize={PROBE_SIZE}
        textAnchor="middle"
        fill={fill}
        transform={cell.transform}
      >
        {cell.char}
      </text>
    ));

  return (
    <span
      className={[...stampClasses(props, render), props.className].filter(Boolean).join(" ")}
      style={{ ...stampStyle(props, render), ...props.style } as CSSProperties}
      role="img"
      aria-label={render.label}
    >
      <svg
        ref={svgRef}
        className="m-stamp__svg"
        width={render.width}
        height={render.height}
        viewBox={`0 0 ${render.width} ${render.height}`}
        aria-hidden="true"
        focusable="false"
      >
        {/* 滤镜定义是纯数字拼的字符串，没有用户内容 */}
        <defs dangerouslySetInnerHTML={{ __html: render.defs }} />
        {render.mode === "yang" ? (
          <>
            <defs>
              <clipPath id={render.ids.clip}>
                <path d={render.clipPath} />
              </clipPath>
            </defs>
            <g filter={render.filters.ink}>
              <g clipPath={`url(#${render.ids.clip})`} filter={render.filters.text}>
                {glyphs("m-stamp__ink m-stamp__glyph")}
              </g>
              <path
                className="m-stamp__ink m-stamp__border"
                d={render.borderPath}
                fillRule="evenodd"
              />
            </g>
          </>
        ) : (
          <>
            <defs>
              {/* 亮度 mask：白底留、黑字和黑界格抠掉，抠掉的地方就是露出来的纸 */}
              <mask
                id={render.ids.mask}
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width={render.width}
                height={render.height}
              >
                <rect x="0" y="0" width={render.width} height={render.height} fill="#fff" />
                <g filter={render.filters.text}>{glyphs("m-stamp__glyph", "#000")}</g>
                {render.gridLines.length > 0 ? (
                  <g>
                    {render.gridLines.map((line, i) => (
                      <rect
                        // 界格是按行列算出来的固定几何，没有身份可言，用下标当 key
                        key={i}
                        className="m-stamp__grid"
                        x={line.x}
                        y={line.y}
                        width={line.w}
                        height={line.h}
                        fill="#000"
                      />
                    ))}
                  </g>
                ) : null}
              </mask>
            </defs>
            <g filter={render.filters.ink}>
              <g mask={`url(#${render.ids.mask})`}>
                <path className="m-stamp__ink m-stamp__body" d={render.borderPath} />
              </g>
            </g>
          </>
        )}
      </svg>
    </span>
  );
}
