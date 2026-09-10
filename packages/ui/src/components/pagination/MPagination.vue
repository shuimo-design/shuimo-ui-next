<script setup lang="ts">
import "./pagination.css";
import { computed, ref, watch } from "vue";
import { IconChevronLeft, IconChevronRight } from "../../icons";
import { inkMarkUrl } from "../../ink/assets/mark";
import { inkShapeUrl } from "../../ink/assets/shape";
import { useDisabled } from "../../internal/form-item";
import { MInput } from "../input";
import { MSelect, type SelectOption, type SelectValue } from "../select";
import { buildPagers } from "./pager";
import type {
  PaginationEmits,
  PaginationLayoutKey,
  PaginationProps,
  PaginationSlots,
} from "./types";

defineOptions({ name: "MPagination" });

const {
  total = 0,
  pageSizes = [10, 20, 30, 40, 50, 100],
  layout = "prev, pager, next, jumper, total",
  foldedMaxPageBtn = 5,
  maxPageBtn = 10,
  showEdgePageNum = true,
  hideOnSinglePage = false,
  disabled: disabledProp = false,
} = defineProps<PaginationProps>();
const emit = defineEmits<PaginationEmits>();
const slots = defineSlots<PaginationSlots>();
const current = defineModel<number>("current", { default: 1 });
const pageSize = defineModel<number>("pageSize", { default: 10 });

const disabled = useDisabled(() => disabledProp);
const pageCount = computed(() => Math.max(1, Math.ceil(total / Math.max(pageSize.value, 1))));
const pagers = computed(() =>
  buildPagers({
    pageCount: pageCount.value,
    current: current.value,
    foldedMax: foldedMaxPageBtn,
    maxPageBtn,
    showEdge: showEdgePageNum,
  }),
);
const sections = computed(() =>
  layout
    .split(",")
    .map((key) => key.trim())
    .filter((key): key is PaginationLayoutKey =>
      ["prev", "pager", "next", "jumper", "sizes", "total"].includes(key),
    ),
);
const sizeOptions = computed<SelectOption[]>(() =>
  pageSizes.map((size) => ({ label: `${size} 条/页`, value: size })),
);
const visible = computed(() => !(hideOnSinglePage && pageCount.value <= 1));

// 跳页输入框的内容是自己的：敲一半时不能反过来改 current
const jumpText = ref("");

// 水墨皮肤：当前页衬一枚毛边朱砂印，翻页箭头换成细笔一撇；箭头笔宽比通用记号细，贴近旧版位图
const seal = inkShapeUrl(28, 28, { seed: 7, raggedness: 0.6, corner: 0.14 });
const inkStyle = {
  "--m-pagination-seal": `url("${seal.url}")`,
  "--m-pagination-seal-pad": `${seal.padding}px`,
  "--m-pagination-chevron-left": `url("${inkMarkUrl("chevronLeft", { seed: 3, strokeWidth: 1.8 })}")`,
  "--m-pagination-chevron-right": `url("${inkMarkUrl("chevronRight", { seed: 3, strokeWidth: 1.8 })}")`,
};

function goTo(page: number) {
  if (disabled.value) return;
  const next = Math.min(Math.max(Math.trunc(page), 1), pageCount.value);
  if (next === current.value) return;
  current.value = next;
  emit("change", next);
}

function onJump() {
  const page = Number.parseInt(jumpText.value, 10);
  jumpText.value = "";
  if (Number.isNaN(page)) return;
  goTo(page);
}

function onSizeChange(value: SelectValue | SelectValue[] | undefined) {
  if (typeof value !== "number" || value === pageSize.value) return;
  pageSize.value = value;
  emit("sizeChange", value);
}

// 总数或每页条数变了以后当前页可能越界，往回收到最后一页
watch(pageCount, (count) => {
  if (current.value > count) goTo(count);
});
</script>

<template>
  <nav
    v-if="visible"
    class="m-pagination"
    :class="{ 'm-pagination--disabled': disabled }"
    :style="inkStyle"
    aria-label="分页"
  >
    <template v-for="section in sections" :key="section">
      <span v-if="section === 'total'" class="m-pagination__total">
        <slot name="total" :total="total" :page-count="pageCount">共 {{ total }} 条</slot>
      </span>

      <button
        v-else-if="section === 'prev'"
        type="button"
        class="m-pagination__arrow m-pagination__arrow--prev"
        aria-label="上一页"
        :disabled="disabled || current <= 1"
        @click="goTo(current - 1)"
      >
        <IconChevronLeft class="m-pagination__arrow-icon" />
      </button>

      <ul v-else-if="section === 'pager'" class="m-pagination__pages">
        <li v-for="pager in pagers" :key="`${pager.type}-${pager.page}`">
          <button
            v-if="pager.type === 'page'"
            type="button"
            class="m-pagination__page"
            :class="{ 'm-pagination__page--current': pager.page === current }"
            :aria-current="pager.page === current ? 'page' : undefined"
            :aria-label="`第 ${pager.page} 页`"
            :disabled="disabled"
            @click="goTo(pager.page)"
          >
            {{ pager.page }}
          </button>
          <button
            v-else
            type="button"
            class="m-pagination__page m-pagination__fold"
            :aria-label="
              pager.direction === 'prev'
                ? `向前 ${current - pager.page} 页`
                : `向后 ${pager.page - current} 页`
            "
            :disabled="disabled"
            @click="goTo(pager.page)"
          >
            ···
          </button>
        </li>
      </ul>

      <button
        v-else-if="section === 'next'"
        type="button"
        class="m-pagination__arrow m-pagination__arrow--next"
        aria-label="下一页"
        :disabled="disabled || current >= pageCount"
        @click="goTo(current + 1)"
      >
        <IconChevronRight class="m-pagination__arrow-icon" />
      </button>

      <label v-else-if="section === 'jumper'" class="m-pagination__jumper">
        <span>前往</span>
        <MInput
          v-model="jumpText"
          class="m-pagination__input"
          type="number"
          :disabled="disabled"
          aria-label="跳转页码"
          :min="1"
          :max="pageCount"
          @change="onJump"
        />
        <span>页</span>
      </label>

      <MSelect
        v-else-if="section === 'sizes'"
        class="m-pagination__select"
        :options="sizeOptions"
        :model-value="pageSize"
        :disabled="disabled"
        aria-label="每页条数"
        @update:model-value="onSizeChange"
      />
    </template>
  </nav>
</template>
