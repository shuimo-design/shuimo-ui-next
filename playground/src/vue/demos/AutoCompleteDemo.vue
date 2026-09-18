<script setup lang="ts">
import { ref } from "vue";
import { MAutoComplete, type AutoCompleteOption } from "@shuimo-design/vue";

const poets: AutoCompleteOption[] = [
  { value: "李白" },
  { value: "李商隐" },
  { value: "杜甫" },
  { value: "杜牧" },
  { value: "王维" },
  { value: "王昌龄", disabled: true },
  { value: "白居易" },
];

const name = ref("");
const picked = ref<AutoCompleteOption>();

/** filter=false：按 search 事件自己筛，模拟远端补全 */
const mail = ref("");
const mailOptions = ref<AutoCompleteOption[]>([]);
function onMailSearch(input: string) {
  const local = input.split("@")[0] ?? "";
  mailOptions.value = local
    ? ["shuimo.design", "gmail.com", "163.com"].map((host) => ({ value: `${local}@${host}` }))
    : [];
}

const contains = (input: string, option: AutoCompleteOption) => option.value.includes(input.trim());
const line = ref("");
const lines: AutoCompleteOption[] = [
  { value: "山色有无中", label: "山色有无中 · 王维" },
  { value: "江流天地外", label: "江流天地外 · 王维" },
  { value: "月涌大江流", label: "月涌大江流 · 杜甫" },
];
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">
        输入即筛：默认按前缀匹配、不分大小写；上下键移动高亮、Enter 选中、Esc 收起；select
        事件带整项
      </p>
      <div class="demo__row">
        <MAutoComplete
          v-model="name"
          :options="poets"
          placeholder="诗人"
          clearable
          @select="(option) => (picked = option)"
        />
        <span class="demo__hint">value {{ name || "-" }}，selected {{ picked?.value ?? "-" }}</span>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">filter=false：候选由调用方按 search 事件给；debounce 300ms 后才发</p>
      <div class="demo__row">
        <MAutoComplete
          v-model="mail"
          :options="mailOptions"
          :filter="false"
          :debounce="300"
          placeholder="邮箱"
          @search="onMailSearch"
        />
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">
        自定义过滤函数、option 插槽、emptyText；label 只在下拉里显示，选中后写回 value
      </p>
      <div class="demo__row">
        <MAutoComplete
          v-model="line"
          :options="lines"
          :filter="contains"
          empty-text="无此句"
          placeholder="诗句"
        >
          <template #option="{ option, active }">
            <span>{{ option.label }}</span>
            <small v-if="active" style="margin-left: auto; opacity: 0.6">回车选中</small>
          </template>
        </MAutoComplete>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">禁用</p>
      <div class="demo__row">
        <MAutoComplete :options="poets" model-value="李白" disabled />
      </div>
    </div>
  </div>
</template>
