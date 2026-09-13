import { useEffect, useState } from "react";
import type { DemoSource as Source } from "../shared/catalog";

/**
 * 示例底下的源码区。默认收起，第一次展开才去拉这一份高亮好的源码 ——
 * 47 份一起打进主包能把它撑到 2 MB，而多数人根本不会展开。
 * Vue 版（src/vue/DemoSource.vue）是同一套结构和同一份样式。
 */
export default function DemoSource({ load, file }: { load: () => Promise<Source>; file: string }) {
  const [source, setSource] = useState<Source>();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // 换了组件页就收回去、把上一页的源码丢掉，不然翻页会看到别人的代码
  useEffect(() => {
    setOpen(false);
    setCopied(false);
    setSource(undefined);
  }, [file]);

  const toggle = async () => {
    if (!open && !source) setSource(await load());
    setOpen((v) => !v);
  };

  const copy = async () => {
    if (!source) return;
    await navigator.clipboard.writeText(source.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section className="src">
      <div className="src__bar">
        <button className="src__btn" type="button" onClick={toggle}>
          {open ? "收起代码" : "查看代码"}
        </button>
        <code className="src__file">{file}</code>
        {open ? (
          <button className="src__btn" type="button" onClick={copy}>
            {copied ? "已复制" : "复制"}
          </button>
        ) : null}
      </div>
      {/* html 是构建期由 shiki 对仓库自己的示例文件生成的，不含任何用户输入 */}
      {open && source ? (
        <div className="src__code" dangerouslySetInnerHTML={{ __html: source.html }} />
      ) : null}
    </section>
  );
}
