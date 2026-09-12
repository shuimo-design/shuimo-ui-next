<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  buildPagers,
  clampPage,
  PAGINATION_FOLD_TEXT,
  PAGINATION_JUMPER_LABEL,
  PAGINATION_JUMPER_PREFIX,
  PAGINATION_JUMPER_SUFFIX,
  PAGINATION_LABEL,
  PAGINATION_NEXT_LABEL,
  PAGINATION_PREV_LABEL,
  PAGINATION_SIZES_LABEL,
  paginationClasses,
  paginationFoldLabel,
  paginationInkStyle,
  paginationPageCount,
  paginationPageLabel,
  paginationSections,
  paginationSizeOptions,
  paginationTotalText,
  paginationVisible,
  parseJumpPage,
  type PaginationEmits,
  type PaginationProps,
  type PaginationSlots,
} from "@shuimo-design/core";
import { IconChevronLeft, IconChevronRight } from "../../icons";
import { useDisabled } from "../../internal/form-item";
import { MInput } from "../input";
import { MSelect, type SelectValue } from "../select";

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
defineSlots<PaginationSlots>();
const current = defineModel<number>("current", { default: 1 });
const pageSize = defineModel<number>("pageSize", { default: 10 });

const disabled = useDisabled(() => disabledProp);
const pageCount = computed(() => paginationPageCount(total, pageSize.value));
// 页码折叠是纯函数，和 React 那边同一份
const pagers = computed(() =>
  buildPagers({
    pageCount: pageCount.value,
    current: current.value,
    foldedMax: foldedMaxPageBtn,
    maxPageBtn,
    showEdge: showEdgePageNum,
  }),
);
const sections = computed(() => paginationSections(layout));
const sizeOptions = computed(() => paginationSizeOptions(pageSizes));
const visible = computed(() => paginationVisible(hideOnSinglePage, pageCount.value));

// 跳页输入框的内容是自己的：敲一半时不能反过来改 current
const jumpText = ref("");

const inkStyle = paginationInkStyle();

function goTo(page: number) {
  if (disabled.value) return;
  const next = clampPage(page, pageCount.value);
  if (next === current.value) return;
  current.value = next;
  emit("change", next);
}

function onJump() {
  const page = parseJumpPage(jumpText.value);
  jumpText.value = "";
  if (page === undefined) return;
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
    :class="paginationClasses(disabled)"
    :style="inkStyle"
    :aria-label="PAGINATION_LABEL"
  >
    <template v-for="section in sections" :key="section">
      <span v-if="section === 'total'" class="m-pagination__total">
        <slot name="total" :total="total" :page-count="pageCount">{{
          paginationTotalText(total)
        }}</slot>
      </span>

      <button
        v-else-if="section === 'prev'"
        type="button"
        class="m-pagination__arrow m-pagination__arrow--prev"
        :aria-label="PAGINATION_PREV_LABEL"
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
            :aria-label="paginationPageLabel(pager.page)"
            :disabled="disabled"
            @click="goTo(pager.page)"
          >
            {{ pager.page }}
          </button>
          <button
            v-else
            type="button"
            class="m-pagination__page m-pagination__fold"
            :aria-label="paginationFoldLabel(pager, current)"
            :disabled="disabled"
            @click="goTo(pager.page)"
          >
            {{ PAGINATION_FOLD_TEXT }}
          </button>
        </li>
      </ul>

      <button
        v-else-if="section === 'next'"
        type="button"
        class="m-pagination__arrow m-pagination__arrow--next"
        :aria-label="PAGINATION_NEXT_LABEL"
        :disabled="disabled || current >= pageCount"
        @click="goTo(current + 1)"
      >
        <IconChevronRight class="m-pagination__arrow-icon" />
      </button>

      <label v-else-if="section === 'jumper'" class="m-pagination__jumper">
        <span>{{ PAGINATION_JUMPER_PREFIX }}</span>
        <MInput
          v-model="jumpText"
          class="m-pagination__input"
          type="number"
          :disabled="disabled"
          :aria-label="PAGINATION_JUMPER_LABEL"
          :min="1"
          :max="pageCount"
          @change="onJump"
        />
        <span>{{ PAGINATION_JUMPER_SUFFIX }}</span>
      </label>

      <MSelect
        v-else-if="section === 'sizes'"
        class="m-pagination__select"
        :options="sizeOptions"
        :model-value="pageSize"
        :disabled="disabled"
        :aria-label="PAGINATION_SIZES_LABEL"
        @update:model-value="onSizeChange"
      />
    </template>
  </nav>
</template>
