import { useState } from "react";
import { MButton, MDropdown, type DropdownItem, type DropdownKey } from "@shuimo-design/react";

const items: DropdownItem[] = [
  { key: "edit", label: "编辑" },
  { key: "copy", label: "复制" },
  { key: "share", label: "分享", disabled: true },
  { key: "remove", label: "删除", divided: true, danger: true },
];

export default function DropdownDemo() {
  const [selected, setSelected] = useState<DropdownKey>();
  const [open, setOpen] = useState(false);

  return (
    <div className="demo">
      <div className="demo__block">
        <p className="demo__caption">点击触发：选中一项后收起，onSelect 带 key 和整项</p>
        <div className="demo__row">
          <MDropdown items={items} onSelect={(key) => setSelected(key)}>
            <MButton>更多操作</MButton>
          </MDropdown>
          <span className="demo__hint">selected {selected ?? "-"}</span>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">悬停触发、方位、禁用</p>
        <div className="demo__row">
          <MDropdown items={items} trigger="hover">
            <MButton>悬停</MButton>
          </MDropdown>
          <MDropdown items={items} placement="bottom-end">
            <MButton>bottom-end</MButton>
          </MDropdown>
          <MDropdown items={items} placement="top-start">
            <MButton>top-start</MButton>
          </MDropdown>
          <MDropdown items={items} disabled>
            <MButton disabled>禁用</MButton>
          </MDropdown>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">renderItem 自定义每一项；open + onOpenChange 受控展开状态</p>
        <div className="demo__row">
          <MDropdown
            items={items}
            open={open}
            onOpenChange={setOpen}
            renderItem={({ item }) => (
              <>
                <span>{item.label}</span>
                <small style={{ marginLeft: "auto", opacity: 0.6 }}>{item.key}</small>
              </>
            )}
          >
            <MButton>自定义项</MButton>
          </MDropdown>
          <span className="demo__hint">open {String(open)}</span>
        </div>
      </div>
    </div>
  );
}
