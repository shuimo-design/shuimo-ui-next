import { useState } from "react";
import { MTag } from "@shuimo-design/react";

const ALL = ["朱砂", "花青", "藤黄", "赭石"];

export default function TagDemo() {
  const [tags, setTags] = useState(ALL);

  return (
    <div className="demo">
      <div className="demo__block">
        <p className="demo__caption">普通标签</p>
        <div className="demo__row">
          <MTag>普通标签</MTag>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">类型</p>
        <div className="demo__row">
          <MTag>默认</MTag>
          <MTag type="primary">主要</MTag>
          <MTag type="success">确认</MTag>
          <MTag type="danger">错误</MTag>
          <MTag type="warn">警告</MTag>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">自定义颜色：color 属性，或直接覆盖 --m-tag-color</p>
        <div className="demo__row">
          <MTag color="#951c48">菜头紫</MTag>
          <MTag style={{ "--m-tag-color": "#2f6b5a" } as React.CSSProperties}>竹青</MTag>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">尺寸</p>
        <div className="demo__row">
          <MTag size="sm">小</MTag>
          <MTag>默认</MTag>
          <MTag size="lg">大</MTag>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">可关闭 / 禁用</p>
        <div className="demo__row">
          {tags.map((tag) => (
            <MTag
              key={tag}
              type="primary"
              closable
              onClose={() => setTags((list) => list.filter((t) => t !== tag))}
            >
              {tag}
            </MTag>
          ))}
          {tags.length === 0 ? <MTag onClick={() => setTags(ALL)}>都关了，点我恢复</MTag> : null}
          <MTag disabled closable>
            禁用
          </MTag>
        </div>
      </div>
    </div>
  );
}
