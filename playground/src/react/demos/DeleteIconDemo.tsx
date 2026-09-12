import { useState } from "react";
import { MDeleteIcon } from "@shuimo-design/react";

export default function DeleteIconDemo() {
  const [items, setItems] = useState(["兰亭序", "祭侄稿", "寒食帖"]);
  const [clicks, setClicks] = useState(0);
  const bump = () => setClicks((n) => n + 1);

  return (
    <div className="demo">
      <div className="demo__block">
        <p className="demo__caption">默认是一支斜放的毛笔，悬停蘸朱砂；kind="cross" 是一笔叉</p>
        <div className="demo__row">
          <MDeleteIcon onClick={bump} />
          <MDeleteIcon size={48} onClick={bump} />
          <MDeleteIcon kind="cross" onClick={bump} />
          <MDeleteIcon kind="cross" size={20} seed={5} onClick={bump} />
          <MDeleteIcon disabled />
          <MDeleteIcon kind="cross" disabled />
        </div>
        <p className="demo__hint">点了 {clicks} 次</p>
      </div>

      <div className="demo__block">
        <p className="demo__caption">列表里删一项</p>
        <ul className="delete-icon-demo__list">
          {items.map((item) => (
            <li key={item}>
              <span>{item}</span>
              <MDeleteIcon
                size={24}
                label={`删除${item}`}
                onClick={() => setItems((list) => list.filter((it) => it !== item))}
              />
            </li>
          ))}
        </ul>
      </div>

      {/* Vue 那份 demo 的 scoped style 在这里只能内联，样式本身一字不差 */}
      <style>{`
        .delete-icon-demo__list {
          display: grid;
          gap: 8px;
          width: 240px;
          margin: 0;
          padding: 0;
          list-style: none;
        }
        .delete-icon-demo__list li {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
      `}</style>
    </div>
  );
}
