/**
 * 上传的无框架部分。
 *
 * 纯派生（class、accept 匹配、超限判定、input 属性、尺寸文字、拖拽区的毛边）是纯函数，壳在渲染期调；
 * 队列本身是有状态的：谁在传、传到哪、每个文件的请求句柄，写成 createUpload 控制器。
 * 列表由壳的 v-model / 受控 props 持有，控制器只通过 onFileListChange 写回去，
 * 自己留一份镜像保证同一轮里的连续写入（加入 → 开始传）读到的是新值。
 * 两个壳只剩一个隐藏的 input、触发区和列表。
 */
import { inkBlobUrl } from "../../ink/assets/blob";
import { ensureSheetAssets } from "../../ink/assets/sheet";
import { deckleMaskUrl } from "../../ink/paper";
import { inkVarBindings, type InkVarBindings } from "../../ink/registry";
import { createStore } from "../../runtime/store";
import type { Controller } from "../../runtime/controller";
import { xhrUploadRequest } from "./request";
import type {
  UploadBeforeUpload,
  UploadData,
  UploadFile,
  UploadRequest,
  UploadRequestHandle,
  UploadStatus,
} from "./types";

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
} from "./types";
export { parseUploadResponse, uploadPercent, uploadRequestOk, xhrUploadRequest } from "./request";

/** 触发区、拖拽区和列表按钮的文案，两个壳共用这一份 */
export const UPLOAD_LABELS = {
  trigger: "选择文件",
  drop: "拖到这里或点击",
  remove: "删除",
  failed: "上传失败",
} as const;

/** 拖拽区毛边遮罩按 16px 分桶，同尺寸的区共用同一张图（deckleMaskUrl 内部有缓存） */
const DROP_BUCKET = 16;
/** 拖入时晕开的那团淡墨是固定素材，整个模块只生成一次 */
const WASH = inkBlobUrl({ seed: 5, size: 96, radius: 0.4, raggedness: 0.3 });

/* ── 纯派生 ─────────────────────────────────────────────── */

export function uploadClasses(o: {
  drag: boolean;
  disabled: boolean;
  dragging: boolean;
}): string[] {
  return [
    "m-upload",
    ...(o.drag ? ["m-upload--drag"] : []),
    ...(o.disabled ? ["m-upload--disabled"] : []),
    ...(o.dragging ? ["m-upload--dragover"] : []),
  ];
}

export function uploadFileClasses(status: UploadStatus): string[] {
  return ["m-upload-file", `m-upload-file--${status}`];
}

/**
 * accept 的匹配：逗号分隔，`.png` 比扩展名、`image/*` 比类型前缀、`image/png` 比整个类型。
 * 没给 accept 全部放行。input 自己也会按 accept 过滤，这里是给拖拽用的同一套规则。
 */
export function uploadAccepts(file: File, accept: string | undefined): boolean {
  const rules = (accept ?? "")
    .split(",")
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean);
  if (rules.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return rules.some((rule) => {
    if (rule.startsWith(".")) return name.endsWith(rule);
    if (rule.endsWith("/*")) return type.startsWith(rule.slice(0, -1));
    return type === rule;
  });
}

/** 加上这一批会不会超过 limit；没给 limit 永远不超 */
export function uploadExceeds(o: { limit?: number; current: number; incoming: number }): boolean {
  return o.limit !== undefined && o.limit > 0 && o.current + o.incoming > o.limit;
}

/** 超过 maxSize；没给 maxSize 永远不超 */
export function uploadTooLarge(file: File, maxSize: number | undefined): boolean {
  return maxSize !== undefined && maxSize > 0 && file.size > maxSize;
}

/** 不允许多选时只取第一个 */
export function uploadTakeFiles(files: File[], multiple: boolean): File[] {
  return multiple ? files : files.slice(0, 1);
}

/** 拖着的是文件（而不是文字、链接） */
export function uploadHasFiles(transfer: DataTransfer | null): boolean {
  return Boolean(transfer && Array.from(transfer.types).includes("Files"));
}

/** 从拖放事件里取文件 */
export function uploadDropFiles(transfer: DataTransfer | null): File[] {
  return transfer ? Array.from(transfer.files) : [];
}

/** 指针从拖拽区离开到它外面才算离开；进到子元素上也会触发 dragleave，那不算 */
export function uploadLeavesZone(o: {
  zone: EventTarget | null;
  related: EventTarget | null;
}): boolean {
  const zone = o.zone instanceof Node ? o.zone : null;
  const related = o.related instanceof Node ? o.related : null;
  return !(zone && related && zone.contains(related));
}

/** 给了地址或自定义请求才真的发请求 */
export function uploadCanRequest(o: { action?: string; customRequest?: UploadRequest }): boolean {
  return Boolean(o.action) || o.customRequest !== undefined;
}

/** 原始 File 变成列表里的一项 */
export function uploadFileFrom(file: File, uid: string): UploadFile {
  return {
    uid,
    name: file.name,
    size: file.size,
    type: file.type,
    status: "ready",
    percent: 0,
    raw: file,
  };
}

/** 字节数变成 "1.2 MB" 这类文字；没有尺寸返回空串 */
export function formatUploadSize(bytes: number | undefined): string {
  if (bytes === undefined || !Number.isFinite(bytes) || bytes < 0) return "";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  const text = unit === 0 ? String(Math.round(value)) : value.toFixed(value >= 10 ? 0 : 1);
  return `${text} ${units[unit]}`;
}

/** 回车 / 空格打开选择框 */
export function uploadTriggerKey(key: string): boolean {
  return key === "Enter" || key === " ";
}

/** 隐藏的 input 上的属性。两个壳直接展开这一份 */
export interface UploadInputAttrs {
  multiple?: true;
  accept?: string;
  webkitdirectory?: "";
}

export function uploadInputAttrs(o: {
  multiple: boolean;
  accept?: string;
  directory: boolean;
}): UploadInputAttrs {
  return {
    ...(o.multiple ? { multiple: true } : {}),
    ...(o.accept ? { accept: o.accept } : {}),
    ...(o.directory ? { webkitdirectory: "" } : {}),
  };
}

/** 拖拽区的 aria：是个按钮，禁用时退出 Tab 序列 */
export interface UploadDropAttrs {
  role: "button";
  tabindex: 0 | -1;
  "aria-disabled"?: true;
}

export function uploadDropAttrs(disabled: boolean): UploadDropAttrs {
  return {
    role: "button",
    tabindex: disabled ? -1 : 0,
    ...(disabled ? { "aria-disabled": true } : {}),
  };
}

/** 列表项删除钮的无障碍名字 */
export function uploadRemoveLabel(file: UploadFile): string {
  return `${UPLOAD_LABELS.remove} ${file.name}`;
}

/** 只有传输中才显示进度条 */
export function uploadShowProgress(file: UploadFile): boolean {
  return file.status === "uploading";
}

/** 按状态过滤：不传状态就是全部 */
export function uploadFilesWithStatus(
  list: UploadFile[],
  status: UploadStatus | UploadStatus[] | undefined,
): UploadFile[] {
  if (status === undefined) return list;
  const wanted = new Set(Array.isArray(status) ? status : [status]);
  return list.filter((file) => wanted.has(file.status));
}

function isInkReady(): boolean {
  return (
    typeof document !== "undefined" && document.documentElement.classList.contains("m-ink-ready")
  );
}

export interface UploadInk extends InkVarBindings {
  style: Record<string, string>;
}

/**
 * 拖拽区的两张图：按实际尺寸生成的毛边遮罩，和拖入时晕开的那团淡墨。
 * 尺寸是量出来的，服务端和水合首帧都是 0×0，那时不出遮罩，渲染的是虚线框的朴素版。
 * `mounted` 既是"能不能登记"的闸门，也是"敢不敢读 DOM"的闸门。
 */
export function uploadInk(o: {
  seed: number;
  width: number;
  height: number;
  mounted: boolean;
}): UploadInk {
  const ready = o.mounted && isInkReady();
  const bucket = (v: number) => Math.max(DROP_BUCKET, Math.ceil(v / DROP_BUCKET) * DROP_BUCKET);
  const mask =
    ready && o.width > 0 && o.height > 0
      ? deckleMaskUrl({
          seed: o.seed,
          amount: 0.35,
          width: bucket(o.width),
          height: bucket(o.height),
        })
      : undefined;
  const bindings = inkVarBindings(
    { "--m-upload-drop-mask": mask, "--m-upload-drop-wash": ready ? WASH : undefined },
    o.mounted,
  );
  return { attrs: bindings.attrs, style: bindings.style };
}

/** 拖拽区的纸纹是全局一张（和卡片同一份），写到 :root 上；只在开了引擎时才生成 */
export function ensureUploadSheet(): void {
  if (isInkReady()) ensureSheetAssets();
}

/* ── 队列控制器 ─────────────────────────────────────────────── */

export interface UploadOptions {
  /** uid 前缀，壳用 useId 给；core 自己不生成随机数 */
  idPrefix: string;
  action: string | undefined;
  method: string;
  headers: Record<string, string>;
  data: UploadData | undefined;
  name: string;
  withCredentials: boolean;
  customRequest: UploadRequest | undefined;
  multiple: boolean;
  accept: string | undefined;
  drag: boolean;
  disabled: boolean;
  limit: number | undefined;
  maxSize: number | undefined;
  autoUpload: boolean;
  beforeUpload: UploadBeforeUpload | undefined;
  /** 当前列表，壳的 v-model / 受控值 */
  fileList: UploadFile[];
  /** 列表要换成这一份 */
  onFileListChange: (fileList: UploadFile[]) => void;
  onChange: (file: UploadFile, fileList: UploadFile[]) => void;
  onProgress: (percent: number, file: UploadFile) => void;
  onSuccess: (response: unknown, file: UploadFile) => void;
  onError: (error: unknown, file: UploadFile) => void;
  onRemove: (file: UploadFile) => void;
  onExceed: (files: File[], fileList: UploadFile[]) => void;
}

export interface UploadSnapshot {
  /** 有文件正拖在区上 */
  readonly dragging: boolean;
}

export interface UploadController extends Controller<UploadSnapshot, UploadOptions> {
  /** 隐藏 input 的 ref 回调：打开选择框要点它 */
  setInput(el: HTMLInputElement | null): void;
  /** 打开系统的选择框；禁用时不动 */
  open(): void;
  /** 加入一批文件：过 accept / limit / maxSize，入列表，autoUpload 时开始传 */
  addFiles(files: File[]): void;
  /** 删掉一项；传输中的先中断 */
  remove(file: UploadFile): void;
  /** 把状态为 ready 的都传出去 */
  submit(): void;
  /** 中断传输；不传就全部。中断的回到 ready */
  abort(file?: UploadFile): void;
  /** 清空列表；传状态就只清那些状态的 */
  clearFiles(status?: UploadStatus | UploadStatus[]): void;
  /** 挂在隐藏 input 的 change 上 */
  onInputChange(event: Event): void;
  /** 挂在触发区 / 拖拽区的 keydown 上：回车 / 空格打开选择框 */
  onTriggerKeyDown(event: KeyboardEvent): void;
  onDragEnter(event: DragEvent): void;
  onDragOver(event: DragEvent): void;
  onDragLeave(event: DragEvent): void;
  onDrop(event: DragEvent): void;
}

const SERVER_SNAPSHOT: UploadSnapshot = { dragging: false };

export function createUpload(initial: UploadOptions): UploadController {
  const store = createStore<UploadSnapshot>(SERVER_SNAPSHOT);
  let options = initial;
  /** 列表镜像：连续两次写入之间壳还没来得及把新值喂回来，第二次要基于第一次的结果 */
  let list = initial.fileList;
  let input: HTMLInputElement | null = null;
  /** uid 计数，前缀来自壳的 useId */
  let count = 0;
  /** 每个传输中文件的请求句柄 */
  const handles = new Map<string, UploadRequestHandle>();
  /** 传输票据：中断 / 删除后回来的回调发现票不对就丢掉 */
  const tickets = new Map<string, number>();
  let seq = 0;

  const nextUid = () => `${options.idPrefix}-${++count}`;
  const find = (uid: string) => list.find((file) => file.uid === uid);

  function commit(next: UploadFile[]): void {
    list = next;
    options.onFileListChange(next);
  }

  /** 原地换成新对象：列表不可变，壳按引用判断有没有变 */
  function patch(uid: string, changes: Partial<UploadFile>): UploadFile | undefined {
    const current = find(uid);
    if (!current) return undefined;
    const file: UploadFile = { ...current, ...changes };
    commit(list.map((item) => (item.uid === uid ? file : item)));
    return file;
  }

  /** 撤掉请求和票据；传输中的回到 ready */
  function stop(uid: string): void {
    handles.get(uid)?.abort();
    handles.delete(uid);
    tickets.delete(uid);
  }

  function setDragging(dragging: boolean): void {
    if (store.get().dragging !== dragging) store.set({ dragging });
  }

  const dragActive = () => options.drag && !options.disabled;

  function open(): void {
    if (options.disabled) return;
    input?.click();
  }

  async function upload(uid: string, batch: File[]): Promise<void> {
    const entry = find(uid);
    if (!entry?.raw) return;
    let raw = entry.raw;
    if (options.beforeUpload) {
      let verdict: boolean | File;
      try {
        verdict = await options.beforeUpload(raw, batch);
      } catch {
        verdict = false;
      }
      // 钩子还没回来时文件可能已经被删了
      if (!find(uid)) return;
      if (verdict === false) {
        commit(list.filter((file) => file.uid !== uid));
        return;
      }
      if (verdict instanceof File) {
        raw = verdict;
        patch(uid, { raw, name: raw.name, size: raw.size, type: raw.type });
      }
    }
    // 没地址也没自定义请求：只选文件，状态停在 ready
    if (!uploadCanRequest(options)) return;

    const ticket = ++seq;
    tickets.set(uid, ticket);
    const live = () => tickets.get(uid) === ticket;
    patch(uid, { status: "uploading", percent: 0, error: undefined, response: undefined });

    const request = options.customRequest ?? xhrUploadRequest;
    const data = typeof options.data === "function" ? options.data(raw) : (options.data ?? {});
    const handle = request({
      file: raw,
      name: options.name,
      action: options.action ?? "",
      method: options.method,
      headers: options.headers,
      data,
      withCredentials: options.withCredentials,
      onProgress: (percent) => {
        if (!live()) return;
        const file = patch(uid, {
          status: "uploading",
          percent: Math.min(100, Math.max(0, percent)),
        });
        if (file) options.onProgress(file.percent ?? 0, file);
      },
      onSuccess: (response) => {
        if (!live()) return;
        tickets.delete(uid);
        handles.delete(uid);
        const file = patch(uid, { status: "success", percent: 100, response });
        if (!file) return;
        options.onSuccess(response, file);
        options.onChange(file, list);
      },
      onError: (error) => {
        if (!live()) return;
        tickets.delete(uid);
        handles.delete(uid);
        const file = patch(uid, { status: "error", error });
        if (!file) return;
        options.onError(error, file);
        options.onChange(file, list);
      },
    });
    // 请求可能同步就完成了，那时票据已经撤了，句柄不用留
    if (handle && live()) handles.set(uid, handle);
  }

  function addFiles(files: File[]): void {
    if (options.disabled || files.length === 0) return;
    const picked = uploadTakeFiles(files, options.multiple).filter((file) =>
      uploadAccepts(file, options.accept),
    );
    if (picked.length === 0) return;
    if (uploadExceeds({ limit: options.limit, current: list.length, incoming: picked.length })) {
      options.onExceed(picked, list);
      return;
    }
    const added: UploadFile[] = [];
    for (const file of picked) {
      const entry = uploadFileFrom(file, nextUid());
      if (uploadTooLarge(file, options.maxSize)) {
        const error = new Error(`文件超过 ${formatUploadSize(options.maxSize)}：${file.name}`);
        options.onError(error, { ...entry, status: "error", error });
        continue;
      }
      added.push(entry);
    }
    if (added.length === 0) return;
    commit([...list, ...added]);
    for (const entry of added) options.onChange(entry, list);
    if (options.autoUpload) for (const entry of added) void upload(entry.uid, picked);
  }

  function abort(file?: UploadFile): void {
    const uids = file ? [file.uid] : Array.from(tickets.keys());
    for (const uid of uids) {
      stop(uid);
      if (find(uid)?.status === "uploading") patch(uid, { status: "ready", percent: 0 });
    }
  }

  return {
    getSnapshot: store.get,
    getServerSnapshot: store.getServer,
    subscribe: store.subscribe,

    update(next) {
      options = next;
      list = next.fileList;
    },

    // 没有全局监听、不量尺寸：这一对只负责断开时把在飞的请求撤掉
    connect() {},
    disconnect() {
      // 先复制再遍历：stop 会从 tickets 里删项
      for (const uid of Array.from(tickets.keys())) stop(uid);
      setDragging(false);
    },

    setInput(el) {
      input = el;
    },

    open,
    addFiles,
    abort,

    remove(file) {
      if (options.disabled) return;
      stop(file.uid);
      if (!find(file.uid)) return;
      commit(list.filter((item) => item.uid !== file.uid));
      options.onRemove(file);
    },

    submit() {
      if (options.disabled) return;
      const ready = list.filter((file) => file.status === "ready" && file.raw);
      const batch = ready.map((file) => file.raw as File);
      for (const file of ready) void upload(file.uid, batch);
    },

    clearFiles(status) {
      const gone = new Set(uploadFilesWithStatus(list, status).map((file) => file.uid));
      for (const uid of gone) stop(uid);
      commit(list.filter((file) => !gone.has(file.uid)));
    },

    onInputChange(event) {
      const target = event.target as HTMLInputElement | null;
      const files = Array.from(target?.files ?? []);
      // 清掉选择，同一个文件再选一次 change 才会再来
      if (target) target.value = "";
      addFiles(files);
    },

    onTriggerKeyDown(event) {
      if (!uploadTriggerKey(event.key)) return;
      event.preventDefault();
      open();
    },

    onDragEnter(event) {
      if (!dragActive() || !uploadHasFiles(event.dataTransfer)) return;
      event.preventDefault();
      setDragging(true);
    },
    onDragOver(event) {
      if (!dragActive() || !uploadHasFiles(event.dataTransfer)) return;
      // 不拦默认行为浏览器会当成打开文件
      event.preventDefault();
      setDragging(true);
    },
    onDragLeave(event) {
      if (uploadLeavesZone({ zone: event.currentTarget, related: event.relatedTarget })) {
        setDragging(false);
      }
    },
    onDrop(event) {
      if (!dragActive()) return;
      event.preventDefault();
      setDragging(false);
      addFiles(uploadDropFiles(event.dataTransfer));
    },
  };
}
