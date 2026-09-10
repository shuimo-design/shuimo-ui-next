<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import { createPrinter, MButton, MPrinter } from "@shuimo-design/ui";

const rounds = ref(0);
const speed = ref(80);
const text = ref("行到水穷处，坐看云起时。");
const printer = useTemplateRef<InstanceType<typeof MPrinter>>("printer");

// 旧版 MPrinter 是这个控制台打印器，现在叫 createPrinter
const consolePrinter = createPrinter("极客江湖");
function printToConsole() {
  consolePrinter.suggest("建议");
  consolePrinter.info("信息");
  consolePrinter.error("异常");
}
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">逐字打出，末尾一枚墨点在闪</p>
      <p class="printer-demo__line">
        <MPrinter ref="printer" :text="text" :speed="speed" @end="rounds++" />
      </p>
      <div class="demo__row">
        <MButton @click="printer?.restart()">重打</MButton>
        <MButton @click="printer?.finish()">直接写完</MButton>
        <MButton @click="speed = speed === 80 ? 30 : 80">速度 {{ speed }}ms</MButton>
        <MButton
          @click="
            text = text.includes('云') ? '空山新雨后，天气晚来秋。' : '行到水穷处，坐看云起时。'
          "
        >
          换一句
        </MButton>
      </div>
      <p class="demo__hint">打完 {{ rounds }} 次</p>
    </div>

    <div class="demo__block">
      <p class="demo__caption">循环：打完停一会再来一遍；多行文字换行照样保留</p>
      <p class="printer-demo__line printer-demo__line--brush">
        <MPrinter
          text="千山鸟飞绝，万径人踪灭。&#10;孤舟蓑笠翁，独钓寒江雪。"
          :speed="120"
          :pause="1500"
          loop
        />
      </p>
    </div>

    <div class="demo__block">
      <p class="demo__caption">不要光标</p>
      <p class="printer-demo__line"><MPrinter text="安静地写完这一行。" :cursor="false" /></p>
    </div>

    <div class="demo__block">
      <p class="demo__caption">控制台打印（旧文档示例）：打开开发者工具看</p>
      <div class="demo__row">
        <MButton @click="printToConsole">点击再次打印</MButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.printer-demo__line {
  margin: 0;
  min-height: 1.6em;
  font-size: 18px;
}
.printer-demo__line--brush {
  font-family: var(--m-font-brush);
  font-size: 24px;
}
</style>
