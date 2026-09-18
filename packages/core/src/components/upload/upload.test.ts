import { describe, expect, it, vi } from "vitest";
import {
  createUpload,
  formatUploadSize,
  uploadAccepts,
  uploadClasses,
  uploadExceeds,
  uploadFileClasses,
  uploadFilesWithStatus,
  uploadInputAttrs,
  uploadTakeFiles,
  uploadTooLarge,
  type UploadFile,
  type UploadOptions,
  type UploadRequestOptions,
} from "./index";
import { parseUploadResponse, uploadPercent, uploadRequestOk } from "./request";

const file = (name: string, type = "text/plain", size = 4) =>
  new File([new Uint8Array(size)], name, { type });

describe("upload pure helpers", () => {
  it("matches accept by extension, type prefix and exact type", () => {
    expect(uploadAccepts(file("a.png", "image/png"), undefined)).toBe(true);
    expect(uploadAccepts(file("a.PNG", "image/png"), ".png")).toBe(true);
    expect(uploadAccepts(file("a.jpg", "image/jpeg"), ".png")).toBe(false);
    expect(uploadAccepts(file("a.jpg", "image/jpeg"), "image/*")).toBe(true);
    expect(uploadAccepts(file("a.txt", "text/plain"), "image/*")).toBe(false);
    expect(uploadAccepts(file("a.txt", "text/plain"), ".png, text/plain")).toBe(true);
  });

  it("checks the count limit and the size limit", () => {
    expect(uploadExceeds({ limit: undefined, current: 5, incoming: 5 })).toBe(false);
    expect(uploadExceeds({ limit: 3, current: 2, incoming: 1 })).toBe(false);
    expect(uploadExceeds({ limit: 3, current: 2, incoming: 2 })).toBe(true);
    expect(uploadTooLarge(file("a", "text/plain", 10), 9)).toBe(true);
    expect(uploadTooLarge(file("a", "text/plain", 10), 10)).toBe(false);
    expect(uploadTooLarge(file("a", "text/plain", 10), undefined)).toBe(false);
  });

  it("keeps only the first file without multiple", () => {
    const files = [file("a"), file("b")];
    expect(uploadTakeFiles(files, false)).toEqual([files[0]]);
    expect(uploadTakeFiles(files, true)).toBe(files);
  });

  it("formats sizes", () => {
    expect(formatUploadSize(undefined)).toBe("");
    expect(formatUploadSize(0)).toBe("0 B");
    expect(formatUploadSize(512)).toBe("512 B");
    expect(formatUploadSize(1536)).toBe("1.5 KB");
    expect(formatUploadSize(20 * 1024 * 1024)).toBe("20 MB");
  });

  it("derives classes and input attributes", () => {
    expect(uploadClasses({ drag: false, disabled: false, dragging: false })).toEqual(["m-upload"]);
    expect(uploadClasses({ drag: true, disabled: true, dragging: true })).toEqual([
      "m-upload",
      "m-upload--drag",
      "m-upload--disabled",
      "m-upload--dragover",
    ]);
    expect(uploadFileClasses("error")).toEqual(["m-upload-file", "m-upload-file--error"]);
    expect(uploadInputAttrs({ multiple: false, directory: false })).toEqual({});
    expect(uploadInputAttrs({ multiple: true, accept: ".png", directory: true })).toEqual({
      multiple: true,
      accept: ".png",
      webkitdirectory: "",
    });
  });

  it("filters by status", () => {
    const list: UploadFile[] = [
      { uid: "1", name: "a", status: "ready" },
      { uid: "2", name: "b", status: "success" },
      { uid: "3", name: "c", status: "error" },
    ];
    expect(uploadFilesWithStatus(list, undefined)).toBe(list);
    expect(uploadFilesWithStatus(list, "error").map((f) => f.uid)).toEqual(["3"]);
    expect(uploadFilesWithStatus(list, ["ready", "success"]).map((f) => f.uid)).toEqual(["1", "2"]);
  });

  it("parses responses and percentages", () => {
    expect(parseUploadResponse('{"ok":true}')).toEqual({ ok: true });
    expect(parseUploadResponse("plain")).toBe("plain");
    expect(parseUploadResponse("")).toBe("");
    expect(uploadPercent(50, 200)).toBe(25);
    expect(uploadPercent(10, 0)).toBe(0);
    expect(uploadRequestOk(204)).toBe(true);
    expect(uploadRequestOk(404)).toBe(false);
  });
});

/** 一个假请求：把回调交出来由用例自己驱动 */
function createHarness(overrides: Partial<UploadOptions> = {}) {
  const requests: UploadRequestOptions[] = [];
  const abort = vi.fn();
  let fileList: UploadFile[] = [];
  const events = {
    change: vi.fn(),
    progress: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    remove: vi.fn(),
    exceed: vi.fn(),
  };
  const options: UploadOptions = {
    idPrefix: "u",
    action: undefined,
    method: "POST",
    headers: {},
    data: undefined,
    name: "file",
    withCredentials: false,
    customRequest: (request) => {
      requests.push(request);
      return { abort };
    },
    multiple: true,
    accept: undefined,
    drag: false,
    disabled: false,
    limit: undefined,
    maxSize: undefined,
    autoUpload: true,
    beforeUpload: undefined,
    fileList,
    onFileListChange: (next) => {
      fileList = next;
    },
    onChange: events.change,
    onProgress: events.progress,
    onSuccess: events.success,
    onError: events.error,
    onRemove: events.remove,
    onExceed: events.exceed,
    ...overrides,
  };
  const upload = createUpload(options);
  return { upload, options, requests, abort, events, list: () => fileList };
}

describe("createUpload", () => {
  it("adds files, uploads them and tracks progress / success / error", () => {
    const { upload, requests, events, list } = createHarness();
    upload.addFiles([file("a.txt"), file("b.txt")]);
    expect(list().map((f) => [f.uid, f.name, f.status])).toEqual([
      ["u-1", "a.txt", "uploading"],
      ["u-2", "b.txt", "uploading"],
    ]);
    expect(events.change).toHaveBeenCalledTimes(2);
    expect(requests.length).toBe(2);
    expect(requests[0]?.name).toBe("file");

    requests[0]!.onProgress(40);
    expect(list()[0]?.percent).toBe(40);
    expect(events.progress).toHaveBeenLastCalledWith(40, expect.objectContaining({ uid: "u-1" }));

    requests[0]!.onSuccess({ ok: true });
    expect(list()[0]).toMatchObject({ status: "success", percent: 100, response: { ok: true } });
    expect(events.success).toHaveBeenCalledWith(
      { ok: true },
      expect.objectContaining({ uid: "u-1" }),
    );

    requests[1]!.onError(new Error("bad"));
    expect(list()[1]).toMatchObject({ status: "error" });
    expect(events.error).toHaveBeenCalledTimes(1);
    // 成功和失败各再报一次 change
    expect(events.change).toHaveBeenCalledTimes(4);
  });

  it("only picks files without action or customRequest", () => {
    const { upload, requests, list } = createHarness({ customRequest: undefined });
    upload.addFiles([file("a.txt")]);
    expect(list()[0]?.status).toBe("ready");
    expect(requests.length).toBe(0);
  });

  it("emits exceed and adds nothing past the limit", () => {
    const { upload, events, list } = createHarness({ limit: 1 });
    upload.addFiles([file("a.txt"), file("b.txt")]);
    expect(list().length).toBe(0);
    expect(events.exceed).toHaveBeenCalledTimes(1);
    expect(events.exceed.mock.calls[0]?.[0]).toHaveLength(2);
  });

  it("drops files over maxSize with an error and filters by accept", () => {
    const { upload, events, list, requests } = createHarness({ maxSize: 8, accept: ".txt" });
    upload.addFiles([
      file("big.txt", "text/plain", 16),
      file("no.png", "image/png"),
      file("ok.txt"),
    ]);
    expect(list().map((f) => f.name)).toEqual(["ok.txt"]);
    expect(events.error).toHaveBeenCalledTimes(1);
    expect(events.error.mock.calls[0]?.[1]).toMatchObject({ name: "big.txt", status: "error" });
    expect(requests.length).toBe(1);
  });

  it("keeps a single file without multiple", () => {
    const { upload, list } = createHarness({ multiple: false });
    upload.addFiles([file("a.txt"), file("b.txt")]);
    expect(list().map((f) => f.name)).toEqual(["a.txt"]);
  });

  it("waits for submit when autoUpload is off", () => {
    const { upload, requests, list } = createHarness({ autoUpload: false });
    upload.addFiles([file("a.txt")]);
    expect(list()[0]?.status).toBe("ready");
    expect(requests.length).toBe(0);
    upload.submit();
    expect(list()[0]?.status).toBe("uploading");
    expect(requests.length).toBe(1);
  });

  it("runs beforeUpload: false drops the file, a File replaces it", async () => {
    const replaced = file("renamed.txt");
    const { upload, requests, list } = createHarness({
      beforeUpload: (raw) => (raw.name === "skip.txt" ? false : replaced),
    });
    upload.addFiles([file("skip.txt"), file("keep.txt")]);
    await vi.waitFor(() => expect(requests.length).toBe(1));
    expect(list().map((f) => [f.name, f.status])).toEqual([["renamed.txt", "uploading"]]);
    expect(requests[0]?.file).toBe(replaced);
  });

  it("aborts and drops late callbacks", () => {
    const { upload, requests, abort, list, events } = createHarness();
    upload.addFiles([file("a.txt")]);
    upload.abort();
    expect(abort).toHaveBeenCalledTimes(1);
    expect(list()[0]?.status).toBe("ready");
    requests[0]!.onSuccess("late");
    expect(list()[0]?.status).toBe("ready");
    expect(events.success).not.toHaveBeenCalled();
  });

  it("removes a file and clears by status", () => {
    const { upload, abort, list, events } = createHarness();
    upload.addFiles([file("a.txt"), file("b.txt")]);
    const [a] = list();
    upload.remove(a!);
    expect(abort).toHaveBeenCalledTimes(1);
    expect(list().map((f) => f.name)).toEqual(["b.txt"]);
    expect(events.remove).toHaveBeenCalledWith(expect.objectContaining({ uid: "u-1" }));

    upload.clearFiles("success");
    expect(list().length).toBe(1);
    upload.clearFiles();
    expect(list().length).toBe(0);
    expect(abort).toHaveBeenCalledTimes(2);
  });

  it("does nothing when disabled", () => {
    const { upload, list, events } = createHarness({ disabled: true });
    upload.addFiles([file("a.txt")]);
    expect(list().length).toBe(0);
    expect(events.change).not.toHaveBeenCalled();
  });

  it("takes the list from update() as the truth", () => {
    const { upload, options, list } = createHarness();
    upload.addFiles([file("a.txt")]);
    // 壳把列表换成了回显的一份（比如从接口拿到的已有文件）
    const external: UploadFile[] = [{ uid: "x", name: "old.png", status: "success", url: "/x" }];
    upload.update({ ...options, fileList: external });
    upload.addFiles([file("b.txt")]);
    expect(list().map((f) => f.name)).toEqual(["old.png", "b.txt"]);
  });
});
