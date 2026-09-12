import { useState } from "react";
import { MSelect, type SelectOption, type SelectValue } from "@shuimo-design/react";

type Model = SelectValue | SelectValue[] | undefined;

// 旧文档示例：地支 / 八卦
const branches = ["子", "丑", "寅", "卯"];

type Trigram = { before: string; after: string; number: string };
const trigrams: Trigram[] = [
  { before: "乾", after: "坎", number: "壹" },
  { before: "兑", after: "坤", number: "贰" },
  { before: "离", after: "震", number: "叁" },
  { before: "震", after: "巽", number: "肆" },
];

const stems = ["甲", "甲乙丙", "子鼠寅卯", "甲乙丙丁"];
const customFilter = (option: unknown, query: string) =>
  String(option).toLowerCase().includes(query.toLowerCase());

type Bagua = { before: string; after: string; element: string };
const elements: Bagua[] = [
  { before: "乾", after: "坎", element: "金" },
  { before: "兑", after: "坤", element: "金" },
  { before: "离", after: "震", element: "木" },
  { before: "震", after: "巽", element: "木" },
];
const matchByElement = (option: unknown, value: SelectValue) =>
  (option as Bagua).element === (value as Bagua).element;

// 新增能力：{ label, value } 写法、清空、分页拉取
const pigments: SelectOption[] = [
  { label: "朱砂", value: "zhusha" },
  { label: "花青", value: "huaqing" },
  { label: "藤黄", value: "tenghuang" },
  { label: "赭石", value: "zheshi" },
  { label: "石绿", value: "shilv", disabled: true },
  { label: "胭脂", value: "yanzhi" },
];

export default function SelectDemo() {
  const [basic, setBasic] = useState<Model>("子");
  const [byParam, setByParam] = useState<Model>("叁");
  const [searchable, setSearchable] = useState<Model>("子");
  const [filtered, setFiltered] = useState<Model>("甲");
  const [matched, setMatched] = useState<Model>({ before: "离", after: "震", element: "木" });
  const [withSlot, setWithSlot] = useState<Model>();
  const [multi, setMulti] = useState<Model>(["子", "丑"]);
  const [pigment, setPigment] = useState<Model>();
  const [paged, setPaged] = useState<string[]>(
    Array.from({ length: 12 }, (_, i) => `第 ${i + 1} 项`),
  );
  const [pagedValue, setPagedValue] = useState<Model>();

  async function fetchMore() {
    await new Promise((resolve) => setTimeout(resolve, 600));
    setPaged((list) => [
      ...list,
      ...Array.from({ length: 8 }, (_, i) => `第 ${list.length + i + 1} 项`),
    ]);
  }

  return (
    <div className="demo">
      <div className="demo__block">
        <p className="demo__caption">普通选择框：options 直接给字符串数组</p>
        <div className="demo__row">
          <MSelect options={branches} value={basic} onValueChange={setBasic} />
          <span className="demo__hint">值为：{String(basic)}</span>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">
          param 参数：inputParam 选中后显示 after，optionParam 下拉显示 before，valueParam 写回
          number
        </p>
        <div className="demo__row">
          <MSelect
            options={trigrams}
            value={byParam}
            onValueChange={setByParam}
            inputParam="after"
            optionParam="before"
            valueParam="number"
          />
          <span className="demo__hint">值为：{String(byParam)}</span>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">filterable：可输入查询</p>
        <div className="demo__row">
          <MSelect options={branches} value={searchable} onValueChange={setSearchable} filterable />
          <MSelect
            options={stems}
            value={filtered}
            onValueChange={setFiltered}
            filterable
            filter={customFilter}
          />
        </div>
        <p className="demo__hint">右边用自定义 filter：不区分大小写的包含匹配</p>
      </div>

      <div className="demo__block">
        <p className="demo__caption">disabled</p>
        <div className="demo__row">
          <MSelect options={branches} value="子" disabled />
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">对象匹配 toMatch：值是对象，按 element 字段判断选中</p>
        <div className="demo__row">
          <MSelect
            options={elements}
            value={matched}
            onValueChange={setMatched}
            inputParam="before"
            optionParam="before"
            toMatch={matchByElement}
          />
          <span className="demo__hint">值为：{JSON.stringify(matched)}</span>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">
          renderOption：自定义下拉里每一项（对应 Vue 的 #option 插槽）
        </p>
        <div className="demo__row">
          <MSelect
            options={elements}
            value={withSlot}
            onValueChange={setWithSlot}
            inputParam="element"
            optionParam="element"
            valueParam="before"
            renderOption={({ option }) => (
              <span>
                先天：{(option as Bagua).before}，后天：{(option as Bagua).after}
              </span>
            )}
          />
          <span className="demo__hint">属相为：{withSlot ? String(withSlot) : "未选"}</span>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">multiple 多选：值为数组，Backspace 删最后一个</p>
        <div className="demo__row">
          <MSelect options={branches} value={multi} onValueChange={setMulti} multiple />
          <span className="demo__hint">
            {Array.isArray(multi) ? multi.join("、") : String(multi)}
          </span>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">{"{ label, value, disabled }"} 写法 + clearable 清空按钮</p>
        <div className="demo__row">
          <MSelect
            options={pigments}
            value={pigment}
            onValueChange={setPigment}
            clearable
            placeholder="选一种颜料"
          />
          <MSelect options={pigments} multiple clearable placeholder="多选" />
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">fetch：列表滚到底自动拉下一页（maxHeight 限高才会出现滚动）</p>
        <div className="demo__row">
          <MSelect
            options={paged}
            value={pagedValue}
            onValueChange={setPagedValue}
            fetch={fetchMore}
            maxHeight={160}
          />
          <span className="demo__hint">已加载 {paged.length} 项</span>
        </div>
      </div>
    </div>
  );
}
