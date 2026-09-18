export type UploadStatus = "ready" | "uploading" | "success" | "error";

/** 列表里的一项。raw 是原始 File；url 给已经在服务器上的文件用（回显） */
export interface UploadFile {
  /** 唯一标识，由组件按壳层的 useId 前缀派生 */
  uid: string;
  name: string;
  /** 字节数 */
  size?: number;
  /** MIME 类型 */
  type?: string;
  /** ready 待传、uploading 传输中、success 成功、error 失败 */
  status: UploadStatus;
  /** 0–100 的上传进度 */
  percent?: number;
  /** 原始文件；回显的项没有 */
  raw?: File;
  /** 服务端返回；JSON 能解析就是解析后的对象，否则是原文 */
  response?: unknown;
  /** 失败原因 */
  error?: unknown;
  /** 文件地址；预览事件的使用方可拿它打开 */
  url?: string;
}

/** 交给 customRequest 的一份请求参数 */
export interface UploadRequestOptions {
  file: File;
  /** 表单字段名 */
  name: string;
  action: string;
  method: string;
  headers: Record<string, string>;
  /** 随文件一起提交的附加字段 */
  data: Record<string, string | Blob>;
  withCredentials: boolean;
  /** 上报 0–100 的进度 */
  onProgress: (percent: number) => void;
  onSuccess: (response: unknown) => void;
  onError: (error: unknown) => void;
}

/** customRequest 可以返回一个句柄，abort 时组件会调它 */
export interface UploadRequestHandle {
  abort(): void;
}

export type UploadRequest = (options: UploadRequestOptions) => UploadRequestHandle | void;

export type UploadData =
  | Record<string, string | Blob>
  | ((file: File) => Record<string, string | Blob>);

/** 返回 false 跳过这个文件；返回 File 用它替换原文件后再传 */
export type UploadBeforeUpload = (
  file: File,
  files: File[],
) => boolean | File | Promise<boolean | File>;

export interface UploadProps {
  /** 上传地址；不给且没有 customRequest 时只选文件不发请求，状态停在 ready */
  action?: string;
  /** 请求方法，默认 POST */
  method?: string;
  /** 请求头 */
  headers?: Record<string, string>;
  /** 随文件一起提交的附加字段；函数按文件算 */
  data?: UploadData;
  /** 文件在表单里的字段名，默认 file */
  name?: string;
  /** 跨域请求带上 cookie */
  withCredentials?: boolean;
  /** 自定义发请求；给了就不用内置的 XMLHttpRequest */
  customRequest?: UploadRequest;
  /** 一次选多个文件 */
  multiple?: boolean;
  /** 可选的文件类型，同 input 的 accept，如 ".png,image/*" */
  accept?: string;
  /** 选整个目录 */
  directory?: boolean;
  /** 拖拽区模式：把文件拖进来就上传 */
  drag?: boolean;
  /** 禁用 */
  disabled?: boolean;
  /** 最多几个文件；超过触发 exceed，这一批一个都不加 */
  limit?: number;
  /** 单个文件的最大字节数；超过的不入列表，触发 error */
  maxSize?: number;
  /** 选完自动上传，默认 true；关掉后调 submit() 手动传 */
  autoUpload?: boolean;
  /** 上传前的钩子：返回 false 跳过（从列表移除），返回 File 用它替换后再传 */
  beforeUpload?: UploadBeforeUpload;
  /** 显示文件列表，默认 true */
  showFileList?: boolean;
  /** 拖拽区毛边的随机种子，默认 1 */
  seed?: number;
}

export interface UploadEmits {
  /** 列表变化：加入、上传成功或失败 */
  change: [file: UploadFile, fileList: UploadFile[]];
  /** 上传进度 */
  progress: [percent: number, file: UploadFile];
  /** 上传成功 */
  success: [response: unknown, file: UploadFile];
  /** 上传失败；超过 maxSize 的文件也走这里 */
  error: [error: unknown, file: UploadFile];
  /** 点了删除 */
  remove: [file: UploadFile];
  /** 加入的文件数超过 limit；这一批一个都没加 */
  exceed: [files: File[], fileList: UploadFile[]];
  /** 点了文件名 */
  preview: [file: UploadFile];
}

/** file 插槽 / renderFile 拿到的作用域 */
export interface UploadFileScope {
  file: UploadFile;
}

export interface UploadSlots {
  /** 触发区内容；默认一个「选择文件」按钮，drag 模式下是拖拽区里的提示文字 */
  default?: () => unknown;
  /** 触发区下方的说明 */
  tip?: () => unknown;
  /** 自定义列表里的每一项 */
  file?: (scope: UploadFileScope) => unknown;
}

export interface UploadExpose {
  /** 把状态为 ready 的文件都传出去；autoUpload 关掉时用 */
  submit: () => void;
  /** 中断上传；不传就中断全部。中断的文件回到 ready */
  abort: (file?: UploadFile) => void;
  /** 清空列表；传状态就只清那些状态的 */
  clearFiles: (status?: UploadStatus | UploadStatus[]) => void;
}
