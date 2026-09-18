export { default as MUpload } from "./MUpload.vue";
// 类型在 core，两个框架共用同一份；这里转出去，使用方不用再多装一个包
export type {
  UploadBeforeUpload,
  UploadData,
  UploadEmits,
  UploadExpose,
  UploadFile,
  UploadFileScope,
  UploadProps,
  UploadRequest,
  UploadRequestHandle,
  UploadRequestOptions,
  UploadSlots,
  UploadStatus,
} from "@shuimo-design/core";
