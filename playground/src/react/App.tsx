import { Fragment, useEffect, useRef, useState, type ComponentType } from "react";
import { flushSync } from "react-dom";
import { MButton, MList, MListItem, MOverlayOutlet, MRicePaper } from "@shuimo-design/react";
import { startInkViewTransition } from "@shuimo-design/core/ink";
import ApiDoc from "./ApiDoc";
import { ALL_DEMOS, CATALOG, assertComplete, fileOf, readHash } from "../shared/catalog";

/**
 * React 版文档站的外壳。Vue 版（src/vue/App.vue）是同一套结构、同一份样式、同一份清单，
 * 只是用 Vue 写的 —— 两边各自独立成站，谁都不寄生在对方的应用里。
 */

// 按清单把 demos/ 下的示例对上号；少一个就直接炸，不要静默少一页
const modules = import.meta.glob<ComponentType>("./demos/*Demo.tsx", {
  eager: true,
  import: "default",
});
const demos: Record<string, ComponentType> = {};
for (const meta of ALL_DEMOS) {
  const found = modules[`./demos/${fileOf(meta.id)}.tsx`];
  if (found) demos[meta.id] = found;
}
assertComplete(demos, "demos", ".tsx");

export default function App() {
  const [dark, setDark] = useState(false);
  const [seed, setSeed] = useState(42);
  const [currentId, setCurrentId] = useState(readHash);

  const current = ALL_DEMOS.find((d) => d.id === currentId) ?? ALL_DEMOS[0]!;
  const Demo = demos[current.id]!;

  // 左右两栏各自滚动
  const main = useRef<HTMLElement>(null);
  const nav = useRef<HTMLElement>(null);

  useEffect(() => {
    const onHashChange = () => setCurrentId(readHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // 切页时右栏拉回顶部；左栏把当前项滚进可视区（直接带 hash 打开时也能看到选中项）
  useEffect(() => {
    main.current?.scrollTo({ top: 0 });
    nav.current?.querySelector(".pg__item--active")?.scrollIntoView({ block: "nearest" });
  }, [currentId]);

  function go(id: string) {
    if (id === currentId) return;
    location.hash = `#/${id}`;
  }

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
  }

  function nextPaperWithTransition() {
    // flushSync 不能省：转场要在回调里拍到"换完之后"的 DOM，而 React 的 setState 默认不是同步落地的
    void startInkViewTransition(() => {
      flushSync(() => setSeed((n) => n + 1));
    });
  }

  return (
    <MRicePaper seed={seed} goldFlecks style={{ height: "100vh" }}>
      <div className="pg">
        <aside className="pg__aside">
          <h1 className="pg__logo">
            水墨 <span>next</span>
          </h1>
          <p className="pg__flavor">
            <span className="pg__flavor-cur">React</span>
            <a className="pg__flavor-alt" href={`../vue/#/${currentId}`}>
              看 Vue 版 →
            </a>
          </p>
          <nav ref={nav} className="pg__nav">
            {CATALOG.map((group) => (
              <Fragment key={group.group}>
                <p className="pg__group">{group.group}</p>
                <MList marker={false}>
                  {group.items.map((item) => (
                    <MListItem
                      key={item.id}
                      active={item.id === currentId}
                      className={item.id === currentId ? "pg__item pg__item--active" : "pg__item"}
                      onClick={() => go(item.id)}
                    >
                      {item.title}
                      <span className="pg__item-name">{item.name}</span>
                    </MListItem>
                  ))}
                </MList>
              </Fragment>
            ))}
          </nav>
          <div className="pg__tools">
            <MButton onClick={toggleDark}>{dark ? "转亮" : "转暗"}</MButton>
            <MButton onClick={nextPaperWithTransition}>换纸</MButton>
          </div>
        </aside>

        <main ref={main} className="pg__main">
          {/* 切换不做转场，直接换页；落墨转场只在 MInkTransition 自己的示例页里演示 */}
          <section key={current.id} className="pg__page">
            <header className="pg__header">
              <h2 className="pg__title">{current.title}</h2>
              <code className="pg__code">{current.name}</code>
            </header>
            <Demo />
            {/* 示例底下挂上构建时生成的属性 / 事件 / 内容表（docs/api/<组件名>.json） */}
            <ApiDoc name={current.name} />
          </section>
        </main>
      </div>
      {/* 函数式的消息 / 确认框渲染在自己的树里，要有这个出口才弹得出来（MConfigProvider 自带一个） */}
      <MOverlayOutlet />
    </MRicePaper>
  );
}
