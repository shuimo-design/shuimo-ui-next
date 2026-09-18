import { useState } from "react";
import { MAutoComplete, type AutoCompleteOption } from "@shuimo-design/react";

const poets: AutoCompleteOption[] = [
  { value: "李白" },
  { value: "李商隐" },
  { value: "杜甫" },
  { value: "杜牧" },
  { value: "王维" },
  { value: "王昌龄", disabled: true },
  { value: "白居易" },
];

const lines: AutoCompleteOption[] = [
  { value: "山色有无中", label: "山色有无中 · 王维" },
  { value: "江流天地外", label: "江流天地外 · 王维" },
  { value: "月涌大江流", label: "月涌大江流 · 杜甫" },
];

const contains = (input: string, option: AutoCompleteOption) => option.value.includes(input.trim());

export default function AutoCompleteDemo() {
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<AutoCompleteOption>();

  /** filter=false：按 onSearch 自己筛，模拟远端补全 */
  const [mail, setMail] = useState("");
  const [mailOptions, setMailOptions] = useState<AutoCompleteOption[]>([]);
  function onMailSearch(input: string) {
    const local = input.split("@")[0] ?? "";
    setMailOptions(
      local
        ? ["shuimo.design", "gmail.com", "163.com"].map((host) => ({ value: `${local}@${host}` }))
        : [],
    );
  }

  const [line, setLine] = useState("");

  return (
    <div className="demo">
      <div className="demo__block">
        <p className="demo__caption">
          输入即筛：默认按前缀匹配、不分大小写；上下键移动高亮、Enter 选中、Esc 收起；onSelect
          带整项
        </p>
        <div className="demo__row">
          <MAutoComplete
            value={name}
            onValueChange={setName}
            options={poets}
            placeholder="诗人"
            clearable
            onSelect={setPicked}
          />
          <span className="demo__hint">
            value {name || "-"}，selected {picked?.value ?? "-"}
          </span>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">
          filter=false：候选由调用方按 onSearch 给；debounce 300ms 后才发
        </p>
        <div className="demo__row">
          <MAutoComplete
            value={mail}
            onValueChange={setMail}
            options={mailOptions}
            filter={false}
            debounce={300}
            placeholder="邮箱"
            onSearch={onMailSearch}
          />
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">
          自定义过滤函数、renderOption、emptyText；label 只在下拉里显示，选中后写回 value
        </p>
        <div className="demo__row">
          <MAutoComplete
            value={line}
            onValueChange={setLine}
            options={lines}
            filter={contains}
            emptyText="无此句"
            placeholder="诗句"
            renderOption={({ option, active }) => (
              <>
                <span>{option.label}</span>
                {active ? (
                  <small style={{ marginLeft: "auto", opacity: 0.6 }}>回车选中</small>
                ) : null}
              </>
            )}
          />
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">禁用</p>
        <div className="demo__row">
          <MAutoComplete options={poets} value="李白" disabled />
        </div>
      </div>
    </div>
  );
}
