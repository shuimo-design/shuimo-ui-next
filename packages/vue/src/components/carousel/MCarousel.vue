<script setup lang="ts">
import { computed, ref, useSlots, useTemplateRef, watch } from "vue";
import {
  CAROUSEL_LABELS,
  CAROUSEL_TRANSITION,
  carouselArrowDisabled,
  carouselClasses,
  carouselDirection,
  carouselDotClasses,
  carouselDotLabel,
  carouselInterval,
  carouselSlideClass,
  carouselSlideLabel,
  carouselStyle,
  createCarousel,
  isVerticalCarousel,
  normalizeCarouselIndex,
  type CarouselEmits,
  type CarouselSlots,
  type CarouselStepDirection,
} from "@shuimo-design/core";
import { IconChevronLeft, IconChevronRight } from "../../icons";
import { useController } from "../../runtime";
import { RenderNode } from "../../runtime/render-node";
import { collectCarouselItems, type MCarouselProps } from "./collect";

defineOptions({ name: "MCarousel" });

const {
  items: itemsProp,
  autoplay = false,
  loop = true,
  direction = "horizontal",
  height,
  indicator = "dots",
  arrows = "hover",
  seed = 1,
} = defineProps<MCarouselProps>();
const emit = defineEmits<CarouselEmits>();
const slots = useSlots() as CarouselSlots;
defineSlots<CarouselSlots>();
/** 当前那一张的下标，从 0 起 */
const current = defineModel<number>("current", { default: 0 });

/**
 * 数据的来源：传了 items 就用传的，没传才从子组件收集。
 * 收集在渲染期完成（读 vnode 的 props），顺序 = 模板里的书写顺序。
 */
const items = computed(() => itemsProp ?? collectCarouselItems(slots.default?.()));
const count = computed(() => items.value.length);
const vertical = computed(() => isVerticalCarousel(direction));
/** v-model 可能越界（张数变了）：渲染一律用收进范围的下标 */
const index = computed(() => normalizeCarouselIndex(current.value, count.value));

/** 翻页的视觉方向：进来的从哪边滑入。和下标同一轮渲染更新，过渡起手时就是对的 */
const stepDirection = ref<CarouselStepDirection>(1);
watch(index, (next, prev) => {
  stepDirection.value = carouselDirection(prev, next, { count: count.value, loop });
});

function onChange(next: number, previous: number) {
  current.value = next;
  emit("change", next, previous);
}

// 自动播放的计时器、悬停 / 聚焦暂停、翻页和键盘全在 core 的控制器里，React 那边用的是同一份
const { controller: carousel, state } = useController(createCarousel, () => ({
  count: count.value,
  current: index.value,
  interval: carouselInterval(autoplay),
  loop,
  vertical: vertical.value,
  onChange,
}));

const root = useTemplateRef<HTMLElement>("root");
watch(root, (el) => carousel.setRoot(el), { immediate: true, flush: "post" });

const rootClass = computed(() => carouselClasses({ direction, arrows, indicator }));
const rootStyle = computed(() => carouselStyle({ height, direction: stepDirection.value, seed }));
const showArrows = computed(() => arrows !== "none" && count.value > 1);
const showDots = computed(() => indicator === "dots" && count.value > 1);
const prevDisabled = computed(() =>
  carouselArrowDisabled({ current: index.value, delta: -1, count: count.value, loop }),
);
const nextDisabled = computed(() =>
  carouselArrowDisabled({ current: index.value, delta: 1, count: count.value, loop }),
);
</script>

<template>
  <div
    ref="root"
    :class="rootClass"
    :style="rootStyle"
    role="region"
    aria-roledescription="carousel"
    :aria-label="CAROUSEL_LABELS.region"
    tabindex="0"
    @keydown="carousel.onKeyDown"
  >
    <!-- 自动播放时读屏器不播报每次切换；停下来（悬停、聚焦、没开 autoplay）才播报 -->
    <div class="m-carousel__track" :aria-live="state.playing ? 'off' : 'polite'">
      <Transition v-for="(item, i) in items" :key="item.key" :name="CAROUSEL_TRANSITION">
        <div
          v-if="i === index"
          :class="carouselSlideClass()"
          role="group"
          aria-roledescription="slide"
          :aria-label="carouselSlideLabel(i, count)"
        >
          <RenderNode v-if="item.render" :node="item.render" />
          <img v-else-if="item.src" class="m-carousel__img" :src="item.src" :alt="item.alt" />
        </div>
      </Transition>
    </div>
    <button
      v-if="showArrows"
      type="button"
      class="m-carousel__arrow m-carousel__arrow--prev"
      :aria-label="CAROUSEL_LABELS.prev"
      :disabled="prevDisabled"
      @click="carousel.prev"
    >
      <IconChevronLeft />
    </button>
    <button
      v-if="showArrows"
      type="button"
      class="m-carousel__arrow m-carousel__arrow--next"
      :aria-label="CAROUSEL_LABELS.next"
      :disabled="nextDisabled"
      @click="carousel.next"
    >
      <IconChevronRight />
    </button>
    <div v-if="showDots" class="m-carousel__dots" role="group" :aria-label="CAROUSEL_LABELS.dots">
      <button
        v-for="(item, i) in items"
        :key="item.key"
        type="button"
        :class="carouselDotClasses(i === index)"
        :aria-label="carouselDotLabel(i)"
        :aria-current="i === index ? 'true' : undefined"
        @click="carousel.goTo(i)"
      />
    </div>
  </div>
</template>
