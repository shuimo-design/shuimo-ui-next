<script setup lang="ts">
import { ref } from "vue";
import {
  MMenu,
  MMenuItem,
  type MenuItem,
  type MenuItemData,
  type MenuKey,
} from "@shuimo-design/ui";

// 照旧文档站左侧导航的结构
const menuData: MenuItemData[] = [
  {
    key: "main",
    label: "首页",
    children: [
      { key: "quickStart", label: "快速开始" },
      { key: "color", label: "颜色" },
    ],
  },
  {
    key: "base",
    label: "基础组件",
    children: [
      { key: "button", label: "按钮" },
      { key: "input", label: "输入框" },
      { key: "radio", label: "单选框" },
      { key: "checkbox", label: "复选框" },
      { key: "select", label: "选择框" },
      { key: "switch", label: "开关" },
    ],
  },
  {
    key: "template",
    label: "模版组件",
    children: [
      { key: "form", label: "表单" },
      { key: "table", label: "表格", disabled: true },
      { key: "pagination", label: "分页" },
    ],
  },
  {
    key: "message",
    label: "消息组件",
    children: [
      { key: "dialog", label: "弹窗" },
      { key: "drawer", label: "抽屉" },
    ],
  },
  { key: "other", label: "其他组件", disabled: true },
];

const current = ref<MenuKey | undefined>("quickStart");
const expanded = ref<MenuKey[]>([]);
const lastClick = ref("");

function onNodeClick(item: MenuItem) {
  lastClick.value = `${item.label}（${item.key}）`;
}

// 字段名映射 + label 插槽
const i18nData = [
  { id: "guide", title: "menu.guide", pages: [{ id: "install", title: "menu.install" }] },
  { id: "api", title: "menu.api" },
];
const dict: Record<string, string> = {
  "menu.guide": "指南",
  "menu.install": "安装",
  "menu.api": "接口",
};
const i18nCurrent = ref<MenuKey | undefined>("install");

// 手写 MMenuItem
const manualCurrent = ref<MenuKey | undefined>("shan-yuan");
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">
        传 data，v-model 记当前项；点一级项展开 /
        收起，点叶子项选中。当前项所在的一级项墨点会蘸成朱砂
      </p>
      <MMenu
        v-model="current"
        v-model:expanded-keys="expanded"
        :data="menuData"
        style="width: 220px"
        @node-click="onNodeClick"
      />
      <p class="demo__hint">
        当前 {{ current ?? "无" }} · 展开 {{ expanded.join("、") || "无" }} · 最近点击
        {{ lastClick || "无" }}
      </p>
      <p class="demo__hint">键盘：上下移动，右展开 / 进子菜单，左收起 / 回父项，回车选中</p>
    </div>

    <div class="demo__block">
      <p class="demo__caption">
        fieldNames 映射字段 + label 插槽做翻译，default-expand-all 初始全展开
      </p>
      <MMenu
        v-model="i18nCurrent"
        :data="i18nData"
        :field-names="{ key: 'id', label: 'title', children: 'pages' }"
        default-expand-all
        style="width: 220px"
      >
        <template #label="{ item }">{{ dict[item.label] ?? item.label }}</template>
      </MMenu>
    </div>

    <div class="demo__block">
      <p class="demo__caption">手写 MMenuItem，嵌套即子菜单</p>
      <MMenu v-model="manualCurrent" style="width: 220px">
        <MMenuItem name="shan" label="山">
          <MMenuItem name="shan-yuan" label="远山" />
          <MMenuItem name="shan-jin" label="近山">
            <MMenuItem name="shan-jin-song" label="松" />
            <MMenuItem name="shan-jin-shi" label="石" />
          </MMenuItem>
        </MMenuItem>
        <MMenuItem name="shui" label="水">
          <MMenuItem name="shui-jiang" label="江" />
          <MMenuItem name="shui-hu" label="湖" disabled />
        </MMenuItem>
        <MMenuItem name="yun">
          <template #label
            >云<span class="demo__hint" style="display: inline"> · 插槽</span></template
          >
        </MMenuItem>
      </MMenu>
      <p class="demo__hint">当前 {{ manualCurrent ?? "无" }}</p>
    </div>
  </div>
</template>
