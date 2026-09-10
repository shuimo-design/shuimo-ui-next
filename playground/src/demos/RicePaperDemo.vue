<script setup lang="ts">
import { computed, ref } from "vue";
import { MButton, MCheckbox, MRicePaper, MSlider, type PaperPreset } from "@shuimo-design/ui";
import { goldFleckUrl, paperTextureUrl, type GoldPreset } from "@shuimo-design/ui/ink";

const seed = ref(7);
const gold = ref(true);
const deckle = ref(false);
const landscape = ref(true);
const parallax = ref(true);
const preset = ref<PaperPreset | undefined>(undefined);
const presets: { label: string; value: PaperPreset | undefined }[] = [
  { label: "跟随主题", value: undefined },
  { label: "生宣", value: "raw" },
  { label: "熟宣", value: "processed" },
  { label: "仿古", value: "antique" },
  { label: "茶渍", value: "teaStained" },
  { label: "月白", value: "moonWhite" },
];

/** 旧站示例：用 CSS 变量调远山透明度 */
const mountainsOpacity = ref(0.5);
const opacityStyle = computed(() => ({
  "--m-rice-paper-landscape-opacity": String(mountainsOpacity.value),
}));

/** 旧站示例：进出场时远山从两侧滑入 / 滑出 */
const visible = ref(true);

/** 洒金对比：旧做法是滤镜里把噪声过阈值得到金点；新做法是 shuimo-core 移植来的矢量金箔 */
const goldColor = ref<GoldPreset>("gold");
const goldDensity = ref(0.5);
const goldClustering = ref(0.3);
const goldMax = ref(12);
const goldColors: GoldPreset[] = ["gold", "paleGold", "roseGold", "copper", "silver", "bronze"];
const goldOptions = computed(() => ({
  color: goldColor.value,
  density: goldDensity.value,
  clustering: goldClustering.value,
  sizeRange: [2, goldMax.value] as [number, number],
}));
const base: [number, number, number] = [252, 250, 240];
const oldStyle = computed(() => ({
  backgroundImage: `url("${paperTextureUrl({ seed: seed.value, baseColor: base, goldSpecks: true, fibers: 0, particles: 0 })}")`,
  backgroundSize: "384px 384px",
}));
const bothStyle = computed(() => ({
  backgroundImage: `url("${goldFleckUrl({ seed: seed.value, ...goldOptions.value })}"), url("${paperTextureUrl({ seed: seed.value, baseColor: base, goldSpecks: true })}")`,
  backgroundSize: "768px 768px, 384px 384px",
}));
const stats = computed(() => {
  const t0 = performance.now();
  const gold = goldFleckUrl({ seed: seed.value + 1000, ...goldOptions.value });
  const t1 = performance.now();
  const paper = paperTextureUrl({ seed: seed.value + 1000, baseColor: base });
  const t2 = performance.now();
  return {
    goldKb: Math.round(gold.length / 1024),
    goldMs: (t1 - t0).toFixed(1),
    paperKb: Math.round(paper.length / 1024),
    paperMs: (t2 - t1).toFixed(1),
  };
});
</script>

<template>
  <div class="demo">
    <div class="demo__row">
      <MButton @click="seed++">换一张纸（seed {{ seed }}）</MButton>
      <MCheckbox v-model="gold" label="洒金" />
      <MCheckbox v-model="deckle" label="毛边" />
      <MCheckbox v-model="landscape" label="远山" />
      <MCheckbox v-model="parallax" :disabled="!landscape" label="视差" />
    </div>
    <div class="demo__row">
      <MButton
        v-for="p in presets"
        :key="p.label"
        :type="preset === p.value ? 'primary' : 'default'"
        @click="preset = p.value"
      >
        {{ p.label }}
      </MButton>
    </div>
    <MRicePaper
      :seed="seed"
      :paper="preset"
      :gold-flecks="gold"
      :deckle-edge="deckle"
      :landscape="landscape"
      :parallax="parallax"
      class="rice-demo__paper"
    >
      <p style="margin: 0; font-size: 18px; line-height: 1.8">
        宣纸：一张可平铺的 SVG 纹理，颗粒、纤维、洒金在一个滤镜里合成，浏览器光栅化一次即缓存。
        底部两侧的远山是四张带种子的 SVG 剪影（左右各远近两层），跟着鼠标和滚动做视差； 同一个 seed
        永远是同一张纸、同一组山。切到暗色主题，山会换成灰白的调子。
      </p>
    </MRicePaper>
    <p class="demo__hint">
      整站背景直接 <code>layout="full-screen"</code>，铺满视口并自己滚动；旧站的
      <code>type="cold|warm"</code> 对应这里的 <code>paper="moonWhite|antique"</code>。
    </p>

    <div class="demo__block">
      <p class="demo__caption">
        洒金对比：左「旧」是滤镜里噪声过阈值出来的金点；中「新」是从 shuimo-core
        移植的矢量金箔（大片不规则、成簇、大片周围溅金粉、明暗各异、无缝平铺）；右是两者叠加。 生成
        {{ stats.goldMs }}ms、{{ stats.goldKb }}KB（洒金层）；纸纹 {{ stats.paperMs }}ms、{{
          stats.paperKb
        }}KB
      </p>
      <div class="demo__row">
        <div class="rice-demo__compare" :style="oldStyle"><span>旧：滤镜金粉</span></div>
        <MRicePaper
          class="rice-demo__compare"
          paper="processed"
          :seed="seed"
          :gold-flecks="goldOptions"
          :landscape="false"
        >
          <span>新：矢量金箔</span>
        </MRicePaper>
        <div class="rice-demo__compare" :style="bothStyle"><span>叠加</span></div>
      </div>
      <div class="demo__row rice-demo__controls">
        <label
          >金色
          <select v-model="goldColor">
            <option v-for="c in goldColors" :key="c" :value="c">{{ c }}</option>
          </select>
        </label>
        <label
          >密度 <input v-model.number="goldDensity" type="range" min="0.05" max="1" step="0.05" />
          {{ goldDensity }}</label
        >
        <label
          >成簇 <input v-model.number="goldClustering" type="range" min="0" max="1" step="0.05" />
          {{ goldClustering }}</label
        >
        <label
          >最大片 <input v-model.number="goldMax" type="range" min="4" max="32" step="1" />
          {{ goldMax }}px</label
        >
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">
        纤维与颗粒：左只有滤镜底纹（原来的样子），右叠了矢量纤维折线和颗粒（shuimo-core
        的做法），放大看纸面有丝
      </p>
      <div class="demo__row">
        <MRicePaper
          class="rice-demo__compare"
          paper="raw"
          :seed="seed"
          :fibers="0"
          :particles="0"
          :landscape="false"
        >
          <span>只有底纹</span>
        </MRicePaper>
        <MRicePaper
          class="rice-demo__compare"
          paper="raw"
          :seed="seed"
          :fibers="2"
          :particles="0.8"
          :landscape="false"
        >
          <span>纤维 2 / 颗粒 0.8</span>
        </MRicePaper>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">色调：旧站的冷 / 暖两色调，现在是纸色预设</p>
      <div class="demo__row">
        <MRicePaper class="rice-demo__small" paper="antique" :seed="seed">
          <div class="rice-demo__disc">warm</div>
        </MRicePaper>
        <MRicePaper class="rice-demo__small" paper="moonWhite" :seed="seed">
          <div class="rice-demo__disc">cold</div>
        </MRicePaper>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">
        远山透明度：<code>--m-rice-paper-landscape-opacity</code>（{{
          mountainsOpacity.toFixed(2)
        }}）。 多张宣纸同屏时每张都在听鼠标，示例页里会有点费，正式页面一张就够
      </p>
      <MSlider v-model="mountainsOpacity" :min="0" :max="1" :step="0.01" style="max-width: 320px" />
      <MRicePaper class="rice-demo__paper" :seed="seed" :parallax="false" :style="opacityStyle">
        <p style="margin: 0">自定义透明度</p>
      </MRicePaper>
    </div>

    <div class="demo__block">
      <p class="demo__caption">
        动画：套一个
        <code>&lt;Transition name="m-layout"&gt;</code
        >，远山从两侧滑入、内容淡入（样式在使用方全局写）
      </p>
      <div class="demo__row">
        <MButton @click="visible = !visible">点我试试</MButton>
      </div>
      <div class="rice-demo__stage">
        <Transition name="m-layout">
          <MRicePaper v-if="visible" class="rice-demo__paper" :seed="seed + 1" :parallax="false">
            <p style="margin: 0">山从两边来</p>
          </MRicePaper>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rice-demo__paper {
  min-height: 260px;
  padding: 24px;
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.08);
}

.rice-demo__compare {
  display: flex;
  align-items: flex-end;
  width: 300px;
  height: 300px;
  padding: 12px;
  box-sizing: border-box;
  background-color: rgb(252 250 240);
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.08);
  font-size: 13px;
}

.rice-demo__controls {
  gap: 16px;
  font-size: 13px;
}
.rice-demo__controls label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.rice-demo__small {
  width: 200px;
  height: 200px;
  padding: 25px;
  box-sizing: border-box;
}

.rice-demo__disc {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: rgb(from var(--m-accent) r g b / 0.2);
  font-size: 2rem;
  font-weight: bold;
}

.rice-demo__stage {
  min-height: 260px;
}

/* 旧站 doc/assets/style/rice-paper.css 的 m-layout 过渡，改到新类名上 */
.m-layout-enter-active,
.m-layout-leave-active {
  --m-layout-speed: 0.8s;
  transition: opacity var(--m-layout-speed);
}

.m-layout-enter-active :deep(.m-rice-paper__content),
.m-layout-leave-active :deep(.m-rice-paper__content) {
  transition: opacity var(--m-layout-speed);
}

.m-layout-enter-active :deep(.m-rice-paper__ridge),
.m-layout-leave-active :deep(.m-rice-paper__ridge) {
  transition: translate calc(var(--m-layout-speed) / 2);
}

.m-layout-enter-from :deep(.m-rice-paper__content),
.m-layout-leave-to :deep(.m-rice-paper__content) {
  opacity: 0;
}

/* 视差写的是 transform，滑入滑出用 translate 属性，两者不打架 */
.m-layout-enter-from :deep(.m-rice-paper__ridge--left),
.m-layout-leave-to :deep(.m-rice-paper__ridge--left) {
  translate: -100% 0;
}

.m-layout-enter-from :deep(.m-rice-paper__ridge--right),
.m-layout-leave-to :deep(.m-rice-paper__ridge--right) {
  translate: 100% 0;
}
</style>
