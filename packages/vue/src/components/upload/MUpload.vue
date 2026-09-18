<script setup lang="ts">
import { computed, onMounted, ref, useId, useTemplateRef } from "vue";
import {
  UPLOAD_LABELS,
  createUpload,
  ensureUploadSheet,
  formatUploadSize,
  uploadClasses,
  uploadDropAttrs,
  uploadFileClasses,
  uploadInk,
  uploadInputAttrs,
  uploadRemoveLabel,
  uploadShowProgress,
  type UploadEmits,
  type UploadExpose,
  type UploadFile,
  type UploadProps,
  type UploadSlots,
} from "@shuimo-design/core";
import { IconCheck, IconClose } from "../../icons";
import { useDisabled, useFormItem } from "../../internal/form-item";
import { useController, useSize } from "../../runtime";
import { MButton } from "../button";
import { MList, MListItem } from "../list";
import { MProgress } from "../progress";

defineOptions({ name: "MUpload" });

const {
  action,
  method = "POST",
  headers,
  data,
  name = "file",
  withCredentials = false,
  customRequest,
  multiple = false,
  accept,
  directory = false,
  drag = false,
  disabled: disabledProp = false,
  limit,
  maxSize,
  autoUpload = true,
  beforeUpload,
  showFileList = true,
  seed = 1,
} = defineProps<UploadProps>();
const emit = defineEmits<UploadEmits>();
const slots = defineSlots<UploadSlots>();
/** 文件列表；组件加入、上传、删除都会写回来 */
const fileList = defineModel<UploadFile[]>("fileList", { default: () => [] });

const formItem = useFormItem();
const disabled = useDisabled(() => disabledProp);
// uid 前缀和说明文字的 id 都从 useId 派生：服务端和客户端一致，core 不生成随机数
const id = useId();
const tipId = computed(() => (slots.tip ? `${id}-tip` : undefined));

// 队列、请求句柄、accept / limit / maxSize 的判定、拖拽判定全在 core 的控制器里，和 React 那边是同一份
const { controller: upload, state } = useController(createUpload, () => ({
  idPrefix: id,
  action,
  method,
  headers: headers ?? {},
  data,
  name,
  withCredentials,
  customRequest,
  multiple,
  accept,
  drag,
  disabled: disabled.value,
  limit,
  maxSize,
  autoUpload,
  beforeUpload,
  fileList: fileList.value,
  onFileListChange: (next: UploadFile[]) => {
    fileList.value = next;
    formItem.value.validate("change");
  },
  onChange: (file: UploadFile, list: UploadFile[]) => emit("change", file, list),
  onProgress: (percent: number, file: UploadFile) => emit("progress", percent, file),
  onSuccess: (response: unknown, file: UploadFile) => emit("success", response, file),
  onError: (error: unknown, file: UploadFile) => emit("error", error, file),
  onRemove: (file: UploadFile) => emit("remove", file),
  onExceed: (files: File[], list: UploadFile[]) => emit("exceed", files, list),
}));

const classes = computed(() =>
  uploadClasses({ drag, disabled: disabled.value, dragging: state.value.dragging }),
);

/* ── 拖拽区的毛边：按实际尺寸生成，只能挂载后量 ─────────────────────── */
const drop = useTemplateRef<HTMLElement>("drop");
const size = useSize(drop, "border-box");
const mounted = ref(false);
onMounted(() => {
  mounted.value = true;
  ensureUploadSheet();
});
const ink = computed(() =>
  uploadInk({ seed, width: size.width.value, height: size.height.value, mounted: mounted.value }),
);

defineExpose<UploadExpose>({
  submit: () => upload.submit(),
  abort: (file?: UploadFile) => upload.abort(file),
  clearFiles: (status) => upload.clearFiles(status),
});
</script>

<template>
  <div :id="formItem.id" :class="classes">
    <input
      :ref="(el) => upload.setInput(el as HTMLInputElement | null)"
      class="m-upload__input"
      type="file"
      hidden
      tabindex="-1"
      :disabled="disabled"
      v-bind="uploadInputAttrs({ multiple, accept, directory })"
      @change="upload.onInputChange"
    />
    <!-- 拖拽区：一块可聚焦的按钮区，拖进来或点它 -->
    <div
      v-if="drag"
      ref="drop"
      class="m-upload__drop"
      :style="ink.style"
      v-bind="{ ...uploadDropAttrs(disabled), ...ink.attrs }"
      :aria-describedby="tipId"
      @click="upload.open()"
      @keydown="upload.onTriggerKeyDown"
      @dragenter="upload.onDragEnter"
      @dragover="upload.onDragOver"
      @dragleave="upload.onDragLeave"
      @drop="upload.onDrop"
    >
      <span class="m-upload__drop-wash" aria-hidden="true" />
      <slot>
        <span class="m-upload__drop-text">{{ UPLOAD_LABELS.drop }}</span>
      </slot>
    </div>
    <!-- 按钮模式：真按钮在里面，点击冒泡到这层 -->
    <span v-else class="m-upload__trigger" @click="upload.open()">
      <slot>
        <MButton :disabled="disabled" :aria-describedby="tipId">{{
          UPLOAD_LABELS.trigger
        }}</MButton>
      </slot>
    </span>
    <div v-if="slots.tip" :id="tipId" class="m-upload__tip"><slot name="tip" /></div>
    <MList v-if="showFileList && fileList.length > 0" class="m-upload__list" :marker="false">
      <MListItem v-for="file in fileList" :key="file.uid">
        <slot name="file" :file="file">
          <div :class="uploadFileClasses(file.status)">
            <button
              type="button"
              class="m-upload-file__name"
              :title="file.name"
              @click="emit('preview', file)"
            >
              {{ file.name }}
            </button>
            <MProgress
              v-if="uploadShowProgress(file)"
              class="m-upload-file__progress"
              :value="file.percent"
              :show-info="false"
              :stroke-width="4"
            />
            <span v-else-if="file.size !== undefined" class="m-upload-file__size">
              {{ formatUploadSize(file.size) }}
            </span>
            <span v-if="file.status === 'success'" class="m-upload-file__status" aria-hidden="true">
              <IconCheck />
            </span>
            <span v-else-if="file.status === 'error'" class="m-upload-file__status">
              {{ UPLOAD_LABELS.failed }}
            </span>
            <button
              type="button"
              class="m-upload-file__remove"
              :aria-label="uploadRemoveLabel(file)"
              :disabled="disabled"
              @click="upload.remove(file)"
            >
              <IconClose />
            </button>
          </div>
        </slot>
      </MListItem>
    </MList>
  </div>
</template>
