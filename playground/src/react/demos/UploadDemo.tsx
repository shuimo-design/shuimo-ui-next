import { useRef, useState } from "react";
import {
  MButton,
  MUpload,
  type UploadExpose,
  type UploadFile,
  type UploadRequestOptions,
} from "@shuimo-design/react";

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

const seeded: UploadFile[] = [
  { uid: "seed-1", name: "山居图.png", size: 204800, status: "success", url: "/files/shan.png" },
  { uid: "seed-2", name: "水调歌头.txt", size: 1024, status: "success", url: "/files/shui.txt" },
];

export default function UploadDemo() {
  const [basic, setBasic] = useState<UploadFile[]>([]);
  const [dragged, setDragged] = useState<UploadFile[]>([]);
  const [exceeded, setExceeded] = useState("");
  const [manual, setManual] = useState<UploadFile[]>([]);
  const uploader = useRef<UploadExpose>(null);
  const [limited, setLimited] = useState<UploadFile[]>([]);
  const [rejected, setRejected] = useState("");
  const [shown, setShown] = useState<UploadFile[]>(seeded);
  const [previewed, setPreviewed] = useState("");

  return (
    <div className="demo">
      <div className="demo__block">
        <p className="demo__caption">
          基本用法：选完自动上传；customRequest 换掉内置的
          XMLHttpRequest，这里是个假请求。文件名带「坏」的会失败
        </p>
        <div className="demo__row">
          <MUpload
            fileList={basic}
            onFileListChange={setBasic}
            customRequest={mockRequest}
            multiple
          />
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">
          drag 拖拽区：拖进来或点击；renderTip 是触发区下方的说明；limit 超过触发 onExceed
        </p>
        <div className="demo__row">
          <MUpload
            fileList={dragged}
            onFileListChange={setDragged}
            customRequest={mockRequest}
            drag
            multiple
            limit={3}
            onExceed={(files) =>
              setExceeded(`一次最多 3 个，这次选了 ${files.length + dragged.length} 个`)
            }
            renderTip={() => "最多 3 个文件"}
          />
          <span className="demo__hint">{exceeded}</span>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">
          autoUpload 关掉：选完停在 ready，submit() 再传；abort() 中断，clearFiles() 清空
        </p>
        <div className="demo__row">
          <MUpload
            ref={uploader}
            fileList={manual}
            onFileListChange={setManual}
            customRequest={mockRequest}
            autoUpload={false}
            multiple
          >
            <MButton type="primary">选几个文件</MButton>
          </MUpload>
          <MButton onClick={() => uploader.current?.submit()}>上传</MButton>
          <MButton onClick={() => uploader.current?.abort()}>中断</MButton>
          <MButton onClick={() => uploader.current?.clearFiles()}>清空</MButton>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">
          accept 限定类型；maxSize 限定字节数，超过的不入列表、走 onError
        </p>
        <div className="demo__row">
          <MUpload
            fileList={limited}
            onFileListChange={setLimited}
            customRequest={mockRequest}
            accept="image/*"
            maxSize={512 * 1024}
            onError={(error) => setRejected(String((error as Error).message))}
            renderTip={() => "只收图片，单个不超过 512 KB"}
          />
          <span className="demo__hint">{rejected}</span>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">
          回显已有文件；点文件名触发 onPreview；renderFile 自定义每一行
        </p>
        <div className="demo__row">
          <MUpload
            fileList={shown}
            onFileListChange={setShown}
            customRequest={mockRequest}
            onPreview={(file) => setPreviewed(file.url ?? file.name)}
            renderFile={({ file }) => (
              <span style={{ color: file.status === "success" ? "var(--m-success)" : undefined }}>
                {file.name}
              </span>
            )}
          />
          <span className="demo__hint">{previewed}</span>
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">disabled：按钮和拖拽区都不响应</p>
        <div className="demo__row">
          <MUpload disabled />
          <MUpload disabled drag />
        </div>
      </div>
    </div>
  );
}
