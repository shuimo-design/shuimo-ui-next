<script setup lang="ts">
import { ref } from "vue";
import { MButton, MDrawer, type DrawerDirection } from "@shuimo-design/ui";

const visible = ref(false);
const direction = ref<DrawerDirection>("right");
const directions: DrawerDirection[] = ["top", "right", "bottom", "left"];
</script>

<template>
  <div class="demo">
    <p class="demo__caption">普通抽屉：默认从右侧滑出，纸框、四角回纹、挂牌和弹窗是同一套</p>
    <div class="demo__row">
      <MDrawer title="抽屉">
        <template #active><MButton>点击显示抽屉</MButton></template>
        <span>君不见，黄河之水天上来</span>
      </MDrawer>
      <MDrawer :mask="{ show: false }" title="无蒙版">
        <template #active><MButton>无蒙版抽屉</MButton></template>
        <span>君不见，黄河之水天上来</span>
      </MDrawer>
    </div>

    <p class="demo__caption">
      四个方向 + v-model + footer
      插槽：关闭挂牌永远横跨一条竖框线，左滑出挂右边线、右滑出挂左边线、上下滑出挂右边线的右上角
    </p>
    <div class="demo__row">
      <MButton v-for="d in directions" :key="d" @click="((direction = d), (visible = true))">
        从{{ { top: "上", right: "右", bottom: "下", left: "左" }[d] }}滑出
      </MButton>
      <MDrawer
        v-model="visible"
        :direction="direction"
        :size="direction === 'top' || direction === 'bottom' ? 240 : 360"
        title="方向"
      >
        <p style="margin: 0">direction = {{ direction }}</p>
        <template #footer>
          <MButton @click="visible = false">关闭</MButton>
        </template>
      </MDrawer>
    </div>
  </div>
</template>
