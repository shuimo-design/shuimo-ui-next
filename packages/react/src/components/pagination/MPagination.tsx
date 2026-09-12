import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type ReactNode,
} from "react";
import {
  buildPagers,
  clampPage,
  PAGINATION_FOLD_TEXT,
  PAGINATION_JUMPER_LABEL,
  PAGINATION_JUMPER_PREFIX,
  PAGINATION_JUMPER_SUFFIX,
  PAGINATION_LABEL,
  PAGINATION_NEXT_LABEL,
  PAGINATION_PREV_LABEL,
  paginationClasses,
  paginationFoldLabel,
  paginationInkStyle,
  paginationPageCount,
  paginationPageLabel,
  paginationSections,
  paginationTotalText,
  paginationVisible,
  parseJumpPage,
  type PaginationProps as CorePaginationProps,
} from "@shuimo-design/core";
import { IconChevronLeft, IconChevronRight } from "../../icons";

export interface MPaginationProps extends CorePaginationProps {
  /** 受控当前页；不传就由组件自己记（配合 defaultCurrent） */
  current?: number;
  defaultCurrent?: number;
  onCurrentChange?: (page: number) => void;
  /**
   * 每页条数。React 这边只能受控给（或给个初值）：改它的 sizes 下拉要 MSelect，
   * MSelect 还没搬到 React，所以 layout 里的 sizes 整段不渲染，也就没有 onSizeChange
   */
  pageSize?: number;
  defaultPageSize?: number;
  /** 当前页变化 */
  onChange?: (page: number) => void;
  /** 替代「共 N 条」，对应 Vue 的 total 插槽 */
  renderTotal?: (scope: { total: number; pageCount: number }) => ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MPagination(props: MPaginationProps) {
  const {
    total = 0,
    layout = "prev, pager, next, jumper, total",
    foldedMaxPageBtn = 5,
    maxPageBtn = 10,
    showEdgePageNum = true,
    hideOnSinglePage = false,
    disabled = false,
    renderTotal,
  } = props;

  const currentControlled = props.current !== undefined;
  const [currentSelf, setCurrentSelf] = useState(props.defaultCurrent ?? 1);
  const current = currentControlled ? props.current! : currentSelf;

  const sizeControlled = props.pageSize !== undefined;
  const [sizeSelf] = useState(props.defaultPageSize ?? 10);
  const pageSize = sizeControlled ? props.pageSize! : sizeSelf;

  const pageCount = paginationPageCount(total, pageSize);
  // 页码折叠是纯函数，和 Vue 那边同一份
  const pagers = buildPagers({
    pageCount,
    current,
    foldedMax: foldedMaxPageBtn,
    maxPageBtn,
    showEdge: showEdgePageNum,
  });
  const sections = paginationSections(layout);

  // 跳页输入框的内容是自己的：敲一半时不能反过来改 current
  const [jumpText, setJumpText] = useState("");

  const inkStyle = paginationInkStyle();

  function goTo(page: number) {
    if (disabled) return;
    const next = clampPage(page, pageCount);
    if (next === current) return;
    if (!currentControlled) setCurrentSelf(next);
    props.onCurrentChange?.(next);
    props.onChange?.(next);
  }

  function onJump() {
    const page = parseJumpPage(jumpText);
    setJumpText("");
    if (page === undefined) return;
    goTo(page);
  }

  // 总数或每页条数变了以后当前页可能越界，往回收到最后一页。
  // 只在 pageCount 真的变了时跑一次，对应 Vue 那边的 watch(pageCount)
  const lastCount = useRef(pageCount);
  useEffect(() => {
    if (lastCount.current === pageCount) return;
    lastCount.current = pageCount;
    if (current > pageCount) goTo(pageCount);
  });

  if (!paginationVisible(hideOnSinglePage, pageCount)) return null;

  return (
    <nav
      className={[...paginationClasses(disabled), props.className].filter(Boolean).join(" ")}
      style={{ ...inkStyle, ...props.style } as CSSProperties}
      aria-label={PAGINATION_LABEL}
    >
      {sections.map((section) => {
        if (section === "total") {
          return (
            <span key={section} className="m-pagination__total">
              {renderTotal ? renderTotal({ total, pageCount }) : paginationTotalText(total)}
            </span>
          );
        }

        if (section === "prev") {
          return (
            <button
              key={section}
              type="button"
              className="m-pagination__arrow m-pagination__arrow--prev"
              aria-label={PAGINATION_PREV_LABEL}
              disabled={disabled || current <= 1}
              onClick={() => goTo(current - 1)}
            >
              <IconChevronLeft className="m-pagination__arrow-icon" />
            </button>
          );
        }

        if (section === "pager") {
          return (
            <ul key={section} className="m-pagination__pages">
              {pagers.map((pager) => (
                <li key={`${pager.type}-${pager.page}`}>
                  {pager.type === "page" ? (
                    <button
                      type="button"
                      className={[
                        "m-pagination__page",
                        pager.page === current ? "m-pagination__page--current" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      aria-current={pager.page === current ? "page" : undefined}
                      aria-label={paginationPageLabel(pager.page)}
                      disabled={disabled}
                      onClick={() => goTo(pager.page)}
                    >
                      {pager.page}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="m-pagination__page m-pagination__fold"
                      aria-label={paginationFoldLabel(pager, current)}
                      disabled={disabled}
                      onClick={() => goTo(pager.page)}
                    >
                      {PAGINATION_FOLD_TEXT}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          );
        }

        if (section === "next") {
          return (
            <button
              key={section}
              type="button"
              className="m-pagination__arrow m-pagination__arrow--next"
              aria-label={PAGINATION_NEXT_LABEL}
              disabled={disabled || current >= pageCount}
              onClick={() => goTo(current + 1)}
            >
              <IconChevronRight className="m-pagination__arrow-icon" />
            </button>
          );
        }

        if (section === "jumper") {
          return (
            <label key={section} className="m-pagination__jumper">
              <span>{PAGINATION_JUMPER_PREFIX}</span>
              {/* MInput 还没搬到 React，这里按它渲染出的那套类名手写一个最小版，
                  pagination.css 里 .m-pagination__input .m-input__native 的那条规则才能照常命中 */}
              <div
                className={[
                  "m-input",
                  "m-input--number",
                  disabled ? "m-input--disabled" : "",
                  "m-pagination__input",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <input
                  className="m-input__native"
                  type="number"
                  aria-label={PAGINATION_JUMPER_LABEL}
                  min={1}
                  max={pageCount}
                  disabled={disabled}
                  value={jumpText}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setJumpText(event.target.value)
                  }
                  onKeyDown={(event) => {
                    // 原生 change 在浏览器里是失焦或回车才发，这里对齐 Vue 那边 MInput 的 @change
                    if (event.key === "Enter") onJump();
                  }}
                  onBlur={onJump}
                />
              </div>
              <span>{PAGINATION_JUMPER_SUFFIX}</span>
            </label>
          );
        }

        // sizes：每页条数下拉要 MSelect，React 这边还没有，先整段不渲染（见组件 README / 迁移说明）
        return null;
      })}
    </nav>
  );
}
