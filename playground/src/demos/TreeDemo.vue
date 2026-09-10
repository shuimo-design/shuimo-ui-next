<script setup lang="ts">
import { ref } from "vue";
import { MTree, type TreeKey, type TreeNodeData } from "@shuimo-design/ui";

const treeData: TreeNodeData[] = [
  {
    key: "shan",
    label: "山",
    children: [
      { key: "yuan", label: "远山" },
      {
        key: "jin",
        label: "近山",
        children: [
          { key: "song", label: "松" },
          { key: "shi", label: "石" },
        ],
      },
    ],
  },
  {
    key: "shui",
    label: "水",
    children: [
      { key: "jiang", label: "江" },
      { key: "hu", label: "湖", disabled: true },
    ],
  },
  { key: "yun", label: "云" },
];

/** 数据里标 expand 的节点初始就是展开的（旧版写法） */
const expandData: TreeNodeData[] = [
  {
    key: "tang",
    label: "唐",
    expand: true,
    children: [
      { key: "libai", label: "李白" },
      { key: "dufu", label: "杜甫" },
    ],
  },
  { key: "song", label: "宋", children: [{ key: "sushi", label: "苏轼" }] },
];

/** 字段名不叫 key / label / children 时用 fieldNames 映射 */
const customData: TreeNodeData[] = [
  {
    id: 1,
    name: "文房",
    nodes: [
      { id: 2, name: "笔" },
      { id: 3, name: "墨" },
      { id: 4, name: "纸" },
      { id: 5, name: "砚" },
    ],
  },
];

const expanded = ref<TreeKey[]>(["shan"]);
const selected = ref<TreeKey | undefined>();
const checked = ref<TreeKey[]>(["yuan"]);
const strictChecked = ref<TreeKey[]>([]);
</script>

<template>
  <div class="demo">
    <p class="demo__caption">基础用法：点箭头展开，点文字选中</p>
    <MTree v-model:expanded-keys="expanded" v-model:selected-key="selected" :data="treeData" />
    <p class="demo__hint">展开 {{ expanded.join("、") || "无" }} · 选中 {{ selected ?? "无" }}</p>

    <p class="demo__caption">勾选框：父子联动，禁用项不跟着变</p>
    <MTree v-model:checked-keys="checked" :data="treeData" checkable default-expand-all />
    <p class="demo__hint">勾选 {{ checked.join("、") || "无" }}</p>

    <p class="demo__caption">checkStrictly：父子各自独立</p>
    <MTree
      v-model:checked-keys="strictChecked"
      :data="treeData"
      checkable
      check-strictly
      default-expand-all
    />
    <p class="demo__hint">勾选 {{ strictChecked.join("、") || "无" }}</p>

    <p class="demo__caption">数据里带 expand 字段的节点初始展开</p>
    <MTree :data="expandData" />

    <p class="demo__caption">fieldNames 映射 + 自定义节点插槽</p>
    <MTree
      :data="customData"
      :field-names="{ key: 'id', label: 'name', children: 'nodes' }"
      default-expand-all
    >
      <template #default="{ node, level }">
        <span>{{ node.label }}</span>
        <small v-if="level > 0" style="margin-left: 6px; color: var(--m-fg-muted)">
          第 {{ level }} 层
        </small>
      </template>
    </MTree>
  </div>
</template>
