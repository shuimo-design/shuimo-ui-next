<script setup lang="ts">
import { computed, useTemplateRef, watch } from "vue";
import {
  ANCHOR_LABEL,
  anchorClasses,
  anchorIndicatorStyle,
  anchorItemStyle,
  anchorLineOptions,
  anchorLinkClasses,
  anchorStyle,
  createAnchor,
  flattenAnchorItems,
  isHorizontalAnchor,
  type AnchorEmits,
  type AnchorProps,
  type AnchorSlots,
} from "@shuimo-design/core";
import { useController } from "../../runtime";
import { useBrushLine } from "../divider/use-brush-line";

defineOptions({ name: "MAnchor" });

const {
  items,
  container,
  offset = 0,
  targetOffset,
  smooth = true,
  affix = false,
  direction = "vertical",
  updateHash = false,
  seed = 1,
} = defineProps<AnchorProps>();
const emit = defineEmits<AnchorEmits>();
defineSlots<AnchorSlots>();
/** 当前激活的 href；还没滚到任何锚点时是空串 */
const current = defineModel<string>("current", { default: "" });

/** 嵌套的 items 铺平成带层级的一列，顺序就是文档顺序 */
const entries = computed(() => flattenAnchorItems(items));
const horizontal = computed(() => isHorizontalAnchor(direction));

function onChange(href: string) {
  current.value = href;
  emit("change", href);
}

// 容器解析、滚动监听、激活判定、点击滚动和滚动锁、指示线的测量全在 core 的控制器里，React 那边用的是同一份
const { controller: anchor, state } = useController(createAnchor, () => ({
  container,
  hrefs: entries.value.map((entry) => entry.key),
  offset,
  targetOffset: targetOffset ?? offset,
  smooth,
  updateHash,
  horizontal: horizontal.value,
  current: current.value,
  onChange,
}));

const nav = useTemplateRef<HTMLElement>("nav");
watch(nav, (el) => anchor.setNav(el), { immediate: true, flush: "post" });

// 指示线按激活项的长度单独生成笔触线；长度变了控制器自己重画
const ink = useTemplateRef<HTMLElement>("ink");
useBrushLine(ink, { ...anchorLineOptions(seed), vertical: () => !horizontal.value });

function onClick(href: string, event: MouseEvent) {
  emit("click", href, event);
  // 滚动由控制器做：URL 只在 updateHash 时改，默认跳转会把 hash 写进去
  event.preventDefault();
  anchor.scrollTo(href);
}

const rootClass = computed(() => anchorClasses({ direction, affix }));
const rootStyle = computed(() => anchorStyle({ affix, offset }));
const inkStyle = computed(() => anchorIndicatorStyle(state.value.indicator, horizontal.value));
</script>

<template>
  <nav ref="nav" :class="rootClass" :style="rootStyle" :aria-label="ANCHOR_LABEL">
    <span class="m-anchor__rail" aria-hidden="true" />
    <!-- 指示线：长度和位移由控制器量出来，压在激活项旁边 -->
    <span ref="ink" class="m-anchor__ink" :style="inkStyle" aria-hidden="true" />
    <ul class="m-anchor__list">
      <li
        v-for="entry in entries"
        :key="entry.key"
        class="m-anchor__item"
        :style="anchorItemStyle(entry.level)"
      >
        <a
          :href="entry.item.href"
          :class="anchorLinkClasses(entry.key === current)"
          :aria-current="entry.key === current ? 'true' : undefined"
          @click="onClick(entry.key, $event)"
        >
          <slot name="item" :item="entry.item" :active="entry.key === current">
            {{ entry.item.title }}
          </slot>
        </a>
      </li>
    </ul>
  </nav>
</template>
