<script setup lang="ts">
import { ref } from "vue";
import { MButton, MDropdown, type DropdownItem, type DropdownKey } from "@shuimo-design/vue";

const items: DropdownItem[] = [
  { key: "edit", label: "编辑" },
  { key: "copy", label: "复制" },
  { key: "share", label: "分享", disabled: true },
  { key: "remove", label: "删除", divided: true, danger: true },
];

const selected = ref<DropdownKey>();
const open = ref(false);
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">点击触发：选中一项后收起，select 事件带 key 和整项</p>
      <div class="demo__row">
        <MDropdown :items="items" @select="(key) => (selected = key)">
          <MButton>更多操作</MButton>
        </MDropdown>
        <span class="demo__hint">selected {{ selected ?? "-" }}</span>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">悬停触发、方位、禁用</p>
      <div class="demo__row">
        <MDropdown :items="items" trigger="hover">
          <MButton>悬停</MButton>
        </MDropdown>
        <MDropdown :items="items" placement="bottom-end">
          <MButton>bottom-end</MButton>
        </MDropdown>
        <MDropdown :items="items" placement="top-start">
          <MButton>top-start</MButton>
        </MDropdown>
        <MDropdown :items="items" disabled>
          <MButton disabled>禁用</MButton>
        </MDropdown>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">item 插槽自定义每一项；v-model:open 双向绑定展开状态</p>
      <div class="demo__row">
        <MDropdown v-model:open="open" :items="items">
          <MButton>自定义项</MButton>
          <template #item="{ item }">
            <span>{{ item.label }}</span>
            <small style="margin-left: auto; opacity: 0.6">{{ item.key }}</small>
          </template>
        </MDropdown>
        <span class="demo__hint">open {{ open }}</span>
      </div>
    </div>
  </div>
</template>
