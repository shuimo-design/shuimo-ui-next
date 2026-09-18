<script setup lang="ts">
import { ref } from "vue";
import { MButton, MUpload, type UploadFile, type UploadRequestOptions } from "@shuimo-design/vue";

/** 文档站没有上传接口：一个假请求，每 200ms 走 20%，文件名带「坏」的最后报错 */
function mockRequest(options: UploadRequestOptions) {
  let percent = 0;
  const timer = setInterval(() => {
    percent += 20;
    if (percent < 100) {
      options.onProgress(percent);
      return;
    }
    clearInterval(timer);
    if (options.file.name.includes("坏")) options.onError(new Error("服务端拒收"));
    else options.onSuccess({ url: `/files/${options.file.name}` });
  }, 200);
  return { abort: () => clearInterval(timer) };
}

const basic = ref<UploadFile[]>([]);
const dragged = ref<UploadFile[]>([]);
const exceeded = ref("");
const manual = ref<UploadFile[]>([]);
const uploader = ref<InstanceType<typeof MUpload> | null>(null);
const limited = ref<UploadFile[]>([]);
const rejected = ref("");
const shown = ref<UploadFile[]>([
  { uid: "seed-1", name: "山居图.png", size: 204800, status: "success", url: "/files/shan.png" },
  { uid: "seed-2", name: "水调歌头.txt", size: 1024, status: "success", url: "/files/shui.txt" },
]);
const previewed = ref("");
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">
        基本用法：选完自动上传；customRequest 换掉内置的
        XMLHttpRequest，这里是个假请求。文件名带「坏」的会失败
      </p>
      <div class="demo__row">
        <MUpload v-model:file-list="basic" :custom-request="mockRequest" multiple />
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">
        drag 拖拽区：拖进来或点击；tip 是触发区下方的说明；limit 超过触发 exceed
      </p>
      <div class="demo__row">
        <MUpload
          v-model:file-list="dragged"
          :custom-request="mockRequest"
          drag
          multiple
          :limit="3"
          @exceed="
            (files) => (exceeded = `一次最多 3 个，这次选了 ${files.length + dragged.length} 个`)
          "
        >
          <template #tip>最多 3 个文件</template>
        </MUpload>
        <span class="demo__hint">{{ exceeded }}</span>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">
        autoUpload 关掉：选完停在 ready，submit() 再传；abort() 中断，clearFiles() 清空
      </p>
      <div class="demo__row">
        <MUpload
          ref="uploader"
          v-model:file-list="manual"
          :custom-request="mockRequest"
          :auto-upload="false"
          multiple
        >
          <MButton type="primary">选几个文件</MButton>
        </MUpload>
        <MButton @click="uploader?.submit()">上传</MButton>
        <MButton @click="uploader?.abort()">中断</MButton>
        <MButton @click="uploader?.clearFiles()">清空</MButton>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">
        accept 限定类型；maxSize 限定字节数，超过的不入列表、走 error 事件
      </p>
      <div class="demo__row">
        <MUpload
          v-model:file-list="limited"
          :custom-request="mockRequest"
          accept="image/*"
          :max-size="512 * 1024"
          @error="(error) => (rejected = String((error as Error).message))"
        >
          <template #tip>只收图片，单个不超过 512 KB</template>
        </MUpload>
        <span class="demo__hint">{{ rejected }}</span>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">回显已有文件；点文件名触发 preview；file 插槽自定义每一行</p>
      <div class="demo__row">
        <MUpload
          v-model:file-list="shown"
          :custom-request="mockRequest"
          @preview="(file) => (previewed = file.url ?? file.name)"
        >
          <template #file="{ file }">
            <span :style="{ color: file.status === 'success' ? 'var(--m-success)' : undefined }">
              {{ file.name }}
            </span>
          </template>
        </MUpload>
        <span class="demo__hint">{{ previewed }}</span>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">disabled：按钮和拖拽区都不响应</p>
      <div class="demo__row">
        <MUpload disabled />
        <MUpload disabled drag />
      </div>
    </div>
  </div>
</template>
