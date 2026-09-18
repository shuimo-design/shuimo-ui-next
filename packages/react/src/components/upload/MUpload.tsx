import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
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
  type UploadExpose,
  type UploadFile,
  type UploadFileScope,
  type UploadProps as CoreUploadProps,
} from "@shuimo-design/core";
import { IconCheck, IconClose } from "../../icons";
import { useDisabled, useFormItem } from "../../internal/form-item";
import { useController, useMounted, useSize } from "../../runtime";
import { MButton } from "../button";
import { MList, MListItem } from "../list";
import { MProgress } from "../progress";

export interface MUploadProps extends CoreUploadProps {
  /** 受控的文件列表；不传就由组件自己记（配合 defaultFileList） */
  fileList?: UploadFile[];
  defaultFileList?: UploadFile[];
  onFileListChange?: (fileList: UploadFile[]) => void;
  /** 列表变化：加入、上传成功或失败 */
  onChange?: (file: UploadFile, fileList: UploadFile[]) => void;
  /** 上传进度 */
  onProgress?: (percent: number, file: UploadFile) => void;
  /** 上传成功 */
  onSuccess?: (response: unknown, file: UploadFile) => void;
  /** 上传失败；超过 maxSize 的文件也走这里 */
  onError?: (error: unknown, file: UploadFile) => void;
  /** 点了删除 */
  onRemove?: (file: UploadFile) => void;
  /** 加入的文件数超过 limit；这一批一个都没加 */
  onExceed?: (files: File[], fileList: UploadFile[]) => void;
  /** 点了文件名 */
  onPreview?: (file: UploadFile) => void;
  /** 触发区内容（对应 Vue 的默认插槽）；默认一个「选择文件」按钮，drag 模式下是拖拽区里的提示文字 */
  children?: ReactNode;
  /** 触发区下方的说明（对应 Vue 的 tip 插槽） */
  renderTip?: () => ReactNode;
  /** 自定义列表里的每一项（对应 Vue 的 file 插槽） */
  renderFile?: (scope: UploadFileScope) => ReactNode;
  className?: string;
  style?: CSSProperties;
}

export const MUpload = forwardRef<UploadExpose, MUploadProps>(function MUpload(props, ref) {
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
    children,
    renderTip,
    renderFile,
  } = props;

  // 上下文形状在 core（context/form-item.ts），这两行只是 React 的 useContext 胶水
  const formItem = useFormItem();
  const disabled = useDisabled(disabledProp);

  const controlled = props.fileList !== undefined;
  const [uncontrolled, setUncontrolled] = useState<UploadFile[]>(props.defaultFileList ?? []);
  const fileList = props.fileList ?? uncontrolled;

  // uid 前缀和说明文字的 id 都从 useId 派生：服务端和客户端一致，core 不生成随机数
  const id = useId();
  const tipId = renderTip ? `${id}-tip` : undefined;

  // 队列、请求句柄、accept / limit / maxSize 的判定、拖拽判定全在 core 的控制器里，和 Vue 那边是同一份
  const [upload, state] = useController(createUpload, {
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
    disabled,
    limit,
    maxSize,
    autoUpload,
    beforeUpload,
    fileList,
    onFileListChange: (next: UploadFile[]) => {
      if (!controlled) setUncontrolled(next);
      props.onFileListChange?.(next);
      formItem.validate("change");
    },
    onChange: (file: UploadFile, list: UploadFile[]) => props.onChange?.(file, list),
    onProgress: (percent: number, file: UploadFile) => props.onProgress?.(percent, file),
    onSuccess: (response: unknown, file: UploadFile) => props.onSuccess?.(response, file),
    onError: (error: unknown, file: UploadFile) => props.onError?.(error, file),
    onRemove: (file: UploadFile) => props.onRemove?.(file),
    onExceed: (files: File[], list: UploadFile[]) => props.onExceed?.(files, list),
  });

  // ref 回调的身份必须稳定：变了 React 会先 ref(null) 再 ref(node)，控制器手里的 input 会来回换
  const inputRef = useCallback((el: HTMLInputElement | null) => upload.setInput(el), [upload]);

  /* ── 拖拽区的毛边：按实际尺寸生成，只能挂载后量 ─────────────────────── */
  const [dropRef, size] = useSize("border-box");
  const mounted = useMounted();
  useEffect(() => ensureUploadSheet(), []);
  const ink = uploadInk({ seed, width: size.width, height: size.height, mounted });

  useImperativeHandle(
    ref,
    () => ({
      submit: () => upload.submit(),
      abort: (file?: UploadFile) => upload.abort(file),
      clearFiles: (status) => upload.clearFiles(status),
    }),
    [upload],
  );

  const inputAttrs = uploadInputAttrs({ multiple, accept, directory });
  // React 的类型表里没有 webkitdirectory，走展开写上去；值是空串，渲染成 webkitdirectory=""
  const directoryAttrs: Record<string, string> =
    inputAttrs.webkitdirectory === undefined ? {} : { webkitdirectory: inputAttrs.webkitdirectory };
  const dropAttrs = uploadDropAttrs(disabled);

  const item = (file: UploadFile): ReactNode =>
    renderFile ? (
      renderFile({ file })
    ) : (
      <div className={uploadFileClasses(file.status).join(" ")}>
        <button
          type="button"
          className="m-upload-file__name"
          title={file.name}
          onClick={() => props.onPreview?.(file)}
        >
          {file.name}
        </button>
        {uploadShowProgress(file) ? (
          <MProgress
            className="m-upload-file__progress"
            value={file.percent}
            showInfo={false}
            strokeWidth={4}
          />
        ) : file.size !== undefined ? (
          <span className="m-upload-file__size">{formatUploadSize(file.size)}</span>
        ) : null}
        {file.status === "success" ? (
          <span className="m-upload-file__status" aria-hidden="true">
            <IconCheck />
          </span>
        ) : file.status === "error" ? (
          <span className="m-upload-file__status">{UPLOAD_LABELS.failed}</span>
        ) : null}
        <button
          type="button"
          className="m-upload-file__remove"
          aria-label={uploadRemoveLabel(file)}
          disabled={disabled}
          onClick={() => upload.remove(file)}
        >
          <IconClose />
        </button>
      </div>
    );

  return (
    <div
      id={formItem.id}
      className={[...uploadClasses({ drag, disabled, dragging: state.dragging }), props.className]
        .filter(Boolean)
        .join(" ")}
      style={props.style}
    >
      <input
        ref={inputRef}
        className="m-upload__input"
        type="file"
        hidden
        tabIndex={-1}
        disabled={disabled}
        multiple={inputAttrs.multiple}
        accept={inputAttrs.accept}
        {...directoryAttrs}
        onChange={(event: ChangeEvent<HTMLInputElement>) => upload.onInputChange(event.nativeEvent)}
      />
      {drag ? (
        // 拖拽区：一块可聚焦的按钮区，拖进来或点它
        <div
          ref={dropRef}
          className="m-upload__drop"
          style={ink.style as CSSProperties}
          {...ink.attrs}
          role={dropAttrs.role}
          tabIndex={dropAttrs.tabindex}
          aria-disabled={dropAttrs["aria-disabled"]}
          aria-describedby={tipId}
          onClick={() => upload.open()}
          onKeyDown={(event: KeyboardEvent<HTMLElement>) =>
            upload.onTriggerKeyDown(event.nativeEvent)
          }
          onDragEnter={(event: DragEvent<HTMLElement>) => upload.onDragEnter(event.nativeEvent)}
          onDragOver={(event: DragEvent<HTMLElement>) => upload.onDragOver(event.nativeEvent)}
          onDragLeave={(event: DragEvent<HTMLElement>) => upload.onDragLeave(event.nativeEvent)}
          onDrop={(event: DragEvent<HTMLElement>) => upload.onDrop(event.nativeEvent)}
        >
          <span className="m-upload__drop-wash" aria-hidden="true" />
          {children ?? <span className="m-upload__drop-text">{UPLOAD_LABELS.drop}</span>}
        </div>
      ) : (
        // 按钮模式：真按钮在里面，点击冒泡到这层
        <span className="m-upload__trigger" onClick={() => upload.open()}>
          {children ?? (
            <MButton disabled={disabled} aria-describedby={tipId}>
              {UPLOAD_LABELS.trigger}
            </MButton>
          )}
        </span>
      )}
      {renderTip ? (
        <div id={tipId} className="m-upload__tip">
          {renderTip()}
        </div>
      ) : null}
      {showFileList && fileList.length > 0 ? (
        <MList className="m-upload__list" marker={false}>
          {fileList.map((file) => (
            <MListItem key={file.uid}>{item(file)}</MListItem>
          ))}
        </MList>
      ) : null}
    </div>
  );
});
