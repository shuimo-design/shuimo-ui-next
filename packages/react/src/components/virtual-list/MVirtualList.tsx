import {
  Fragment,
  useEffect,
  useImperativeHandle,
  useMemo,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from "react";
import {
  createVirtualList,
  virtualListBodyStyle,
  virtualListClasses,
  virtualListInk,
  virtualListItemStyle,
  virtualListKey,
  virtualListOffsets,
  virtualListPhantomStyle,
  virtualListRange,
  virtualListTotalHeight,
  type VirtualListExpose,
  type VirtualListProps as CoreVirtualListProps,
  type VirtualListScope,
} from "@shuimo-design/core";
import { useController, useMounted } from "../../runtime";

/** list 不传时用同一个空数组，省得每次渲染都换一个引用，白白惊动控制器 */
const EMPTY: readonly never[] = [];

export interface MVirtualListProps<T> extends CoreVirtualListProps<T> {
  /** 每一项怎么画（对应 Vue 的默认插槽） */
  children?: (scope: VirtualListScope<T>) => ReactNode;
  /** 滚到了底 */
  onReachBottom?: () => void;
  /** 滚动时，参数是 scrollTop */
  onScroll?: (top: number) => void;
  ref?: Ref<VirtualListExpose>;
  className?: string;
  style?: CSSProperties;
}

export function MVirtualList<T>(props: MVirtualListProps<T>) {
  const {
    list,
    itemHeight,
    estimatedItemHeight = 40,
    buffer = 5,
    height,
    itemKey,
    divider = false,
    children,
  } = props;

  const items = (list ?? EMPTY) as readonly T[];
  const count = items.length;

  // 滚动位置、视口尺寸、变高模式的测量与滚动补偿全在 core 的控制器里，和 Vue 那边是同一份
  const [vlist, state] = useController(createVirtualList, {
    itemHeight,
    estimatedItemHeight,
    buffer,
    onScroll: props.onScroll,
    onReachBottom: props.onReachBottom,
  });

  // 换了一份数据，旧的行高就不可信了；只是追加则保留量过的部分（判断在 core 里）
  useEffect(() => vlist.setItems(items), [vlist, items]);

  useImperativeHandle(
    props.ref,
    () => ({
      scrollTo: vlist.scrollTo,
      scrollToOffset: vlist.scrollToOffset,
      scrollTop: vlist.scrollTop,
    }),
    [vlist],
  );

  // 前缀和只跟行高有关，跟滚到哪没关系：量到的行高表一直是同一个 Map，靠版本号当依赖
  const offsets = useMemo(
    () => virtualListOffsets({ count, itemHeight, estimatedItemHeight, measured: state.measured }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- measured 是同一个 Map，version 才是"变了"的信号
    [count, itemHeight, estimatedItemHeight, state.version, state.measured],
  );
  const range = useMemo(
    () =>
      virtualListRange({
        offsets,
        count,
        scrollTop: state.scrollTop,
        viewportHeight: state.viewportHeight,
        buffer,
      }),
    [offsets, count, state.scrollTop, state.viewportHeight, buffer],
  );

  // 素材登记要有样式表：服务端和水合首帧一律内联，挂载之后才升级成 data 属性
  const mounted = useMounted();
  const ink = virtualListInk({
    divider,
    width: state.viewportWidth,
    height,
    registered: mounted,
  });
  const itemStyle = virtualListItemStyle(itemHeight) as CSSProperties;

  return (
    // 控制器的方法身份恒定（控制器本身存在 ref 里），直接当 ref 回调用
    <div
      ref={vlist.setViewport}
      className={[...virtualListClasses(divider), props.className].filter(Boolean).join(" ")}
      style={{ ...ink.style, ...props.style } as CSSProperties}
      {...ink.attrs}
    >
      {/* 占位层撑出总高度让滚动条正确，可见的那批项由 body 平移到位 */}
      <div
        className="m-virtual-list__phantom"
        style={virtualListPhantomStyle(virtualListTotalHeight(offsets, count)) as CSSProperties}
      />
      <div
        className="m-virtual-list__body"
        style={virtualListBodyStyle(offsets, range.start) as CSSProperties}
      >
        {items.slice(range.start, range.end).map((data, i) => {
          const index = range.start + i;
          return (
            <Fragment key={String(virtualListKey(data, index, itemKey))}>
              {/* 分隔线是项之间一个零高的元素，线画在它的伪元素上、骑在两项的交界线上：
                  不占高度（占了会让首项和其余项差 1px），也不受定高项 overflow: hidden 的裁切 */}
              {divider && index > 0 ? (
                <div className="m-virtual-list__divider" aria-hidden="true" />
              ) : null}
              {/* ref 返回的清理函数由 React 在卸载时调，对上 Vue 那边指令的 beforeUnmount */}
              <div
                ref={vlist.measureRef}
                className="m-virtual-list__item"
                data-index={index}
                style={itemStyle}
              >
                {children?.({ data, index })}
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
