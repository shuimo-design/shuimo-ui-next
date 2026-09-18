<script setup lang="ts">
import { ref } from "vue";
import {
  MButton,
  MCheckbox,
  MShanShui,
  type ShanShuiPalette,
  type ShanShuiParallax,
  type ShanShuiReadyPayload,
} from "@shuimo-design/vue";

const seed = ref(7);
const layers = ref(3);
const sun = ref(true);
const geese = ref(true);
const boat = ref(true);
const palette = ref<ShanShuiPalette>("ink");
const parallax = ref<ShanShuiParallax>("scroll");
const palettes: { label: string; value: ShanShuiPalette }[] = [
  { label: "墨", value: "ink" },
  { label: "晨", value: "dawn" },
  { label: "暮", value: "dusk" },
];
const modes: { label: string; value: ShanShuiParallax }[] = [
  { label: "跟随滚动", value: "scroll" },
  { label: "跟随鼠标", value: "pointer" },
  { label: "不动", value: "none" },
];
const ready = ref<ShanShuiReadyPayload | null>(null);
</script>

<template>
  <div class="demo">
    <div class="demo__row">
      <MButton @click="seed++">换一幅（seed {{ seed }}）</MButton>
      <MButton @click="layers = (layers % 4) + 2">远山 {{ layers }} 层</MButton>
      <MCheckbox v-model="sun" label="朱砂日" />
      <MCheckbox v-model="geese" label="雁阵" />
      <MCheckbox v-model="boat" label="孤舟" />
    </div>
    <div class="demo__row">
      <MButton
        v-for="p in palettes"
        :key="p.value"
        :type="palette === p.value ? 'primary' : 'default'"
        @click="palette = p.value"
      >
        {{ p.label }}
      </MButton>
      <MButton
        v-for="m in modes"
        :key="m.value"
        :type="parallax === m.value ? 'primary' : 'default'"
        @click="parallax = m.value"
      >
        {{ m.label }}
      </MButton>
    </div>
    <MShanShui
      :seed="seed"
      :layers="layers"
      :sun="sun"
      :geese="geese"
      :boat="boat"
      :palette="palette"
      :parallax="parallax"
      height="420px"
      @ready="ready = $event"
    >
      <div>
        <h1 class="shan-shui-demo__title">山水</h1>
        <p class="shan-shui-demo__sub">远山、朱砂日、雁阵、孤舟，一个 seed 定一幅画</p>
      </div>
    </MShanShui>
    <p class="demo__hint">
      ready：{{ ready ? `seed ${ready.seed}、tier ${ready.tier}` : "等待遮罩图解码" }}。
      滚动视差按横幅顶边越过视口顶边的距离算，页面在哪个容器里滚都一样；prefers-reduced-motion
      下不动。
    </p>

    <div class="demo__block">
      <p class="demo__caption">
        朴素版：tier 0 不生成
        SVG，远山是几块由深到浅的墩子，日头是个圆；没有墨迹引擎的页面看到的也是这个
      </p>
      <MShanShui :seed="seed" :tier="0" height="200px" parallax="none">
        <span>tier 0</span>
      </MShanShui>
    </div>

    <div class="demo__block">
      <p class="demo__caption">三种配色并排，同一个 seed 同一幅画，只换颜色</p>
      <div class="demo__row">
        <MShanShui
          v-for="p in palettes"
          :key="p.value"
          :seed="seed"
          :palette="p.value"
          height="180px"
          parallax="none"
          class="shan-shui-demo__small"
        >
          <span>{{ p.label }}</span>
        </MShanShui>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shan-shui-demo__title {
  margin: 0;
  font-size: 48px;
  font-weight: 400;
  letter-spacing: 0.4em;
  text-indent: 0.4em;
}

.shan-shui-demo__sub {
  margin: 8px 0 0;
  color: var(--m-fg-muted);
}

.shan-shui-demo__small {
  width: 280px;
}
</style>
