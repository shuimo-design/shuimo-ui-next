<script setup lang="ts">
import { ref } from "vue";
import { MSelect, type SelectOption, type SelectValue } from "@shuimo-design/ui";

type Model = SelectValue | SelectValue[] | undefined;

// 旧文档示例：地支 / 八卦
const branches = ["子", "丑", "寅", "卯"];
const basic = ref<Model>("子");
const disabledValue = ref<Model>("子");

type Trigram = { before: string; after: string; number: string };
const trigrams: Trigram[] = [
  { before: "乾", after: "坎", number: "壹" },
  { before: "兑", after: "坤", number: "贰" },
  { before: "离", after: "震", number: "叁" },
  { before: "震", after: "巽", number: "肆" },
];
const byParam = ref<Model>("叁");

const searchable = ref<Model>("子");
const stems = ["甲", "甲乙丙", "子鼠寅卯", "甲乙丙丁"];
const filtered = ref<Model>("甲");
const customFilter = (option: unknown, query: string) =>
  String(option).toLowerCase().includes(query.toLowerCase());

type Bagua = { before: string; after: string; element: string };
const elements: Bagua[] = [
  { before: "乾", after: "坎", element: "金" },
  { before: "兑", after: "坤", element: "金" },
  { before: "离", after: "震", element: "木" },
  { before: "震", after: "巽", element: "木" },
];
const matched = ref<Model>({ before: "离", after: "震", element: "木" });
const matchByElement = (option: unknown, value: SelectValue) =>
  (option as Bagua).element === (value as Bagua).element;

const withSlot = ref<Model>();
const multi = ref<Model>(["子", "丑"]);

// 新增能力：{ label, value } 写法、清空、分页拉取
const pigments: SelectOption[] = [
  { label: "朱砂", value: "zhusha" },
  { label: "花青", value: "huaqing" },
  { label: "藤黄", value: "tenghuang" },
  { label: "赭石", value: "zheshi" },
  { label: "石绿", value: "shilv", disabled: true },
  { label: "胭脂", value: "yanzhi" },
];
const pigment = ref<Model>();
const paged = ref<string[]>(Array.from({ length: 12 }, (_, i) => `第 ${i + 1} 项`));
const pagedValue = ref<Model>();
async function fetchMore() {
  await new Promise((resolve) => setTimeout(resolve, 600));
  const start = paged.value.length;
  paged.value.push(...Array.from({ length: 8 }, (_, i) => `第 ${start + i + 1} 项`));
}
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">普通选择框：options 直接给字符串数组</p>
      <div class="demo__row">
        <MSelect v-model="basic" :options="branches" />
        <span class="demo__hint">值为：{{ basic }}</span>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">
        param 参数：input-param 选中后显示 after，option-param 下拉显示 before，value-param 写回
        number
      </p>
      <div class="demo__row">
        <MSelect
          v-model="byParam"
          :options="trigrams"
          input-param="after"
          option-param="before"
          value-param="number"
        />
        <span class="demo__hint">值为：{{ byParam }}</span>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">filterable：可输入查询（旧版 :readonly="false"）</p>
      <div class="demo__row">
        <MSelect v-model="searchable" :options="branches" filterable />
        <MSelect v-model="filtered" :options="stems" filterable :filter="customFilter" />
      </div>
      <p class="demo__hint">右边用自定义 filter：不区分大小写的包含匹配</p>
    </div>

    <div class="demo__block">
      <p class="demo__caption">disabled</p>
      <div class="demo__row">
        <MSelect v-model="disabledValue" :options="branches" disabled />
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">对象匹配 to-match：v-model 是对象，按 element 字段判断选中</p>
      <div class="demo__row">
        <MSelect
          v-model="matched"
          :options="elements"
          input-param="before"
          option-param="before"
          :to-match="matchByElement"
        />
        <span class="demo__hint">值为：{{ matched }}</span>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">option 插槽：自定义下拉里每一项</p>
      <div class="demo__row">
        <MSelect
          v-model="withSlot"
          :options="elements"
          input-param="element"
          option-param="element"
          value-param="before"
        >
          <template #option="{ option }">
            <span> 先天：{{ (option as Bagua).before }}，后天：{{ (option as Bagua).after }} </span>
          </template>
        </MSelect>
        <span class="demo__hint">属相为：{{ withSlot ?? "未选" }}</span>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">multiple 多选：v-model 为数组，Backspace 删最后一个</p>
      <div class="demo__row">
        <MSelect v-model="multi" :options="branches" multiple />
        <span class="demo__hint">{{ Array.isArray(multi) ? multi.join("、") : multi }}</span>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">{ label, value, disabled } 写法 + clearable 清空按钮</p>
      <div class="demo__row">
        <MSelect v-model="pigment" :options="pigments" clearable placeholder="选一种颜料" />
        <MSelect v-model="pigment" :options="pigments" multiple clearable placeholder="多选" />
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">fetch：列表滚到底自动拉下一页（:max-height 限高才会出现滚动）</p>
      <div class="demo__row">
        <MSelect v-model="pagedValue" :options="paged" :fetch="fetchMore" :max-height="160" />
        <span class="demo__hint">已加载 {{ paged.length }} 项</span>
      </div>
    </div>
  </div>
</template>
