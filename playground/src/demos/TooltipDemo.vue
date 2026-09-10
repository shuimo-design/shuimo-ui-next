<script setup lang="ts">
import { MButton, MTooltip, type TooltipPlacement } from "@shuimo-design/ui";

const placements: TooltipPlacement[] = ["top", "bottom", "left", "right"];
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">普通悬浮提示：移入或用 Tab 聚焦都会出现</p>
      <div class="demo__row">
        <MTooltip>
          <MButton>移入试试</MButton>
          <template #content>
            <span>君不见，黄河之水天上来</span>
          </template>
        </MTooltip>
        <MTooltip content="content 直接传文字">
          <MButton>content 属性</MButton>
        </MTooltip>
        <MTooltip content="任意元素都能挂提示，不需要是按钮">
          <span style="text-decoration: underline dotted; cursor: help">带下划线的一句话</span>
        </MTooltip>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">方位 placement</p>
      <div class="demo__row">
        <MTooltip
          v-for="placement in placements"
          :key="placement"
          :placement="placement"
          :content="`placement: ${placement}`"
        >
          <MButton>{{ placement }}</MButton>
        </MTooltip>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">其他触发方式与禁用</p>
      <div class="demo__row">
        <MTooltip trigger="click" content="点一下出现，再点或点外面收起">
          <MButton>click 触发</MButton>
        </MTooltip>
        <MTooltip trigger="focus" content="聚焦时出现">
          <MButton>focus 触发</MButton>
        </MTooltip>
        <MTooltip :arrow="false" content="没有墨尖箭头">
          <MButton>无箭头</MButton>
        </MTooltip>
        <MTooltip disabled content="不会出现">
          <MButton disabled>禁用</MButton>
        </MTooltip>
      </div>
    </div>
  </div>
</template>
