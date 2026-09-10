<script setup lang="ts">
import { ref } from "vue";
import { MButton, MPopover, type PopoverPlacement } from "@shuimo-design/ui";

const visible = ref(false);
const placements: PopoverPlacement[] = ["top", "bottom", "left", "right"];
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">普通气泡卡片：hover 触发</p>
      <div class="demo__row">
        <MPopover trigger="hover">
          <MButton>将毛笔移入试试</MButton>
          <template #content>
            <div>君不见，黄河之水天上来</div>
          </template>
        </MPopover>
        <MPopover trigger="hover" content="奔流到海不复回" placement="top">
          <MButton>纯文字内容</MButton>
        </MPopover>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">点击控制：v-model:show 双向绑定，内容里可以放操作</p>
      <div class="demo__row">
        <MPopover v-model:show="visible">
          <MButton>点击我</MButton>
          <template #content>
            <div style="text-align: right">
              <div>君不见，黄河之水天上来</div>
              <div class="demo__row" style="justify-content: flex-end; margin-top: 8px">
                <MButton @click="visible = false">关闭</MButton>
                <MButton type="primary" @click="visible = false">确定</MButton>
              </div>
            </div>
          </template>
        </MPopover>
        <span class="demo__hint">visible {{ visible }}</span>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">方位 placement 与手动控制</p>
      <div class="demo__row">
        <MPopover
          v-for="placement in placements"
          :key="placement"
          :placement="placement"
          trigger="hover"
          :content="`placement: ${placement}`"
        >
          <MButton>{{ placement }}</MButton>
        </MPopover>
        <MPopover trigger="focus" content="聚焦时出现，失焦收起">
          <MButton>focus 触发</MButton>
        </MPopover>
        <MPopover trigger="manual" show content="manual：只听 v-model:show">
          <MButton>manual</MButton>
        </MPopover>
        <MPopover disabled content="不会出现">
          <MButton disabled>禁用</MButton>
        </MPopover>
      </div>
    </div>
  </div>
</template>
