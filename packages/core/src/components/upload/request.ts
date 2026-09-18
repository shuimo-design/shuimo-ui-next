/**
 * 内置的上传请求：一个 XMLHttpRequest 发一份 multipart 表单。
 * 用 XHR 而不是 fetch，因为只有它能报上传进度。传了 customRequest 时整份不用。
 */
import type { UploadRequestHandle, UploadRequestOptions } from "./types";

/** 响应体尽量按 JSON 解析，解析不了就原文返回 */
export function parseUploadResponse(text: string): unknown {
  if (!text) return text;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** 进度换算成 0–100 的整数；总量未知时按 0 */
export function uploadPercent(loaded: number, total: number): number {
  if (!(total > 0)) return 0;
  return Math.min(100, Math.round((loaded / total) * 100));
}

/** 2xx 之外都算失败 */
export function uploadRequestOk(status: number): boolean {
  return status >= 200 && status < 300;
}

export function xhrUploadRequest(options: UploadRequestOptions): UploadRequestHandle {
  const xhr = new XMLHttpRequest();
  const form = new FormData();
  for (const [key, value] of Object.entries(options.data)) form.append(key, value);
  form.append(options.name, options.file, options.file.name);

  xhr.upload.addEventListener("progress", (event) => {
    options.onProgress(uploadPercent(event.loaded, event.total));
  });
  xhr.addEventListener("error", () => options.onError(new Error(`上传失败：${options.action}`)));
  xhr.addEventListener("load", () => {
    if (!uploadRequestOk(xhr.status)) {
      options.onError(new Error(`上传失败：${xhr.status} ${options.action}`));
      return;
    }
    options.onSuccess(parseUploadResponse(xhr.responseText));
  });

  xhr.open(options.method, options.action, true);
  xhr.withCredentials = options.withCredentials;
  for (const [key, value] of Object.entries(options.headers)) xhr.setRequestHeader(key, value);
  xhr.send(form);

  return { abort: () => xhr.abort() };
}
