import { useState } from "react";
import { MList, MListItem } from "@shuimo-design/react";

interface Sword {
  title: string;
  active?: boolean;
}

const swords: Sword[] = [{ title: "轩辕剑", active: true }, { title: "湛卢" }, { title: "赤霄" }];
const names = ["轩辕剑", "湛卢", "赤霄"];
const poems = ["江流天地外", "山色有无中", "郡邑浮前浦", "波澜动远空"];

export default function ListDemo() {
  const [activePoem, setActivePoem] = useState(1);

  return (
    <div className="demo">
      <p className="demo__caption">普通列表：数据项带 active 字段的那项用激活样式</p>
      <MList<Sword> data={swords}>{({ item }) => <span>{item.title}</span>}</MList>

      <p className="demo__caption">使用激活状态样式：autoActive 让所有项都激活</p>
      <MList<string> data={names} autoActive />

      <p className="demo__caption">不要项目符号</p>
      <MList<string> data={names} marker={false} />

      <p className="demo__caption">自己放 MListItem，点击切换 active</p>
      <MList>
        {poems.map((poem, index) => (
          <MListItem key={poem} active={index === activePoem} onClick={() => setActivePoem(index)}>
            {poem}
          </MListItem>
        ))}
      </MList>
    </div>
  );
}
