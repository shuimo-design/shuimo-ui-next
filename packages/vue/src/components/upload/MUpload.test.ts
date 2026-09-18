import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-vue";
import { defineComponent, h, ref, type PropType } from "vue";
import type { UploadFile, UploadRequestOptions } from "@shuimo-design/core";
import { MUpload } from ".";

const file = (name: string, type = "text/plain", size = 4) =>
  new File([new Uint8Array(size)], name, { type });

/** 把文件塞进隐藏的 input 并触发 change，和用户在系统对话框里选完一样 */
function pick(container: HTMLElement, files: File[]) {
  const input = container.querySelector<HTMLInputElement>("input[type=file]")!;
  const transfer = new DataTransfer();
  for (const item of files) transfer.items.add(item);
  input.files = transfer.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function drop(zone: Element, files: File[]) {
  const transfer = new DataTransfer();
  for (const item of files) transfer.items.add(item);
  zone.dispatchEvent(
    new DragEvent("dragenter", { dataTransfer: transfer, bubbles: true, cancelable: true }),
  );
  zone.dispatchEvent(
    new DragEvent("drop", { dataTransfer: transfer, bubbles: true, cancelable: true }),
  );
}

/** 一个假请求：把回调交出来由用例自己驱动 */
function fakeRequest() {
  const requests: UploadRequestOptions[] = [];
  return {
    requests,
    customRequest: (request: UploadRequestOptions) => {
      requests.push(request);
      return { abort: vi.fn() };
    },
  };
}

/** 父组件真的把列表写回去，后续操作才基于新列表 */
const Host = defineComponent({
  props: {
    extra: { type: Object as PropType<Record<string, unknown>>, default: () => ({}) },
  },
  setup(props, { slots }) {
    const list = ref<UploadFile[]>([]);
    return () =>
      h("div", [
        h(
          MUpload,
          {
            ...props.extra,
            fileList: list.value,
            "onUpdate:fileList": (v: UploadFile[]) => (list.value = v),
          },
          slots,
        ),
        h(
          "output",
          { "data-testid": "out" },
          list.value.map((f) => `${f.name}:${f.status}`).join(","),
        ),
      ]);
  },
});

describe("MUpload", () => {
  it("lists picked files and drives them through a custom request", async () => {
    const { requests, customRequest } = fakeRequest();
    const onChange = vi.fn();
    const onSuccess = vi.fn();
    const screen = await render(Host, {
      props: { extra: { customRequest, multiple: true, onChange, onSuccess } },
    });
    await expect.element(screen.getByRole("button", { name: "选择文件" })).toBeVisible();

    pick(screen.container, [file("山.txt"), file("水.txt")]);
    await expect
      .element(screen.getByTestId("out"))
      .toHaveTextContent("山.txt:uploading,水.txt:uploading");
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(requests.length).toBe(2);
    // 传输中的行有进度条
    expect(screen.container.querySelectorAll(".m-progress").length).toBe(2);

    requests[0]!.onProgress(50);
    await vi.waitFor(() =>
      expect(screen.container.querySelector(".m-progress")?.getAttribute("aria-valuenow")).toBe(
        "50",
      ),
    );
    requests[0]!.onSuccess({ ok: true });
    requests[1]!.onError(new Error("bad"));
    await expect
      .element(screen.getByTestId("out"))
      .toHaveTextContent("山.txt:success,水.txt:error");
    expect(onSuccess).toHaveBeenCalledWith(
      { ok: true },
      expect.objectContaining({ name: "山.txt" }),
    );
    const rows = screen.container.querySelectorAll(".m-upload-file");
    expect(rows[0]?.classList.contains("m-upload-file--success")).toBe(true);
    expect(rows[1]?.textContent).toContain("上传失败");
  });

  it("keeps files at ready without an action, and submit() sends them later", async () => {
    const { requests, customRequest } = fakeRequest();
    const uploader = ref<InstanceType<typeof MUpload> | null>(null);
    const list = ref<UploadFile[]>([]);
    const screen = await render(
      defineComponent({
        setup: () => () =>
          h("div", [
            h(MUpload, {
              ref: uploader,
              customRequest,
              autoUpload: false,
              fileList: list.value,
              "onUpdate:fileList": (v: UploadFile[]) => (list.value = v),
            }),
          ]),
      }),
    );
    pick(screen.container, [file("山.txt")]);
    await vi.waitFor(() => expect(list.value[0]?.status).toBe("ready"));
    expect(requests.length).toBe(0);
    // 待传的行显示尺寸
    expect(screen.container.querySelector(".m-upload-file__size")?.textContent?.trim()).toBe("4 B");
    uploader.value!.submit();
    await vi.waitFor(() => expect(list.value[0]?.status).toBe("uploading"));
    expect(requests.length).toBe(1);
    uploader.value!.abort();
    await vi.waitFor(() => expect(list.value[0]?.status).toBe("ready"));
    uploader.value!.clearFiles();
    await vi.waitFor(() => expect(list.value.length).toBe(0));
  });

  it("emits exceed past the limit and remove on the delete button", async () => {
    const onExceed = vi.fn();
    const onRemove = vi.fn();
    const screen = await render(Host, {
      props: { extra: { limit: 1, multiple: true, onExceed, onRemove } },
    });
    pick(screen.container, [file("山.txt"), file("水.txt")]);
    expect(onExceed).toHaveBeenCalledTimes(1);
    await expect.element(screen.getByTestId("out")).toHaveTextContent("");

    pick(screen.container, [file("山.txt")]);
    await expect.element(screen.getByTestId("out")).toHaveTextContent("山.txt:ready");
    await screen.getByRole("button", { name: "删除 山.txt" }).click();
    expect(onRemove).toHaveBeenCalledWith(expect.objectContaining({ name: "山.txt" }));
    await expect.element(screen.getByTestId("out")).toHaveTextContent("");
  });

  it("emits preview from the file name and renders the tip", async () => {
    const onPreview = vi.fn();
    const screen = await render(Host, {
      props: { extra: { onPreview } },
      slots: { tip: () => "只能传 txt" },
    });
    const tip = screen.container.querySelector(".m-upload__tip")!;
    expect(tip.textContent).toBe("只能传 txt");
    await expect
      .element(screen.getByRole("button", { name: "选择文件" }))
      .toHaveAttribute("aria-describedby", tip.id);
    pick(screen.container, [file("山.txt")]);
    await screen.getByRole("button", { name: "山.txt", exact: true }).click();
    expect(onPreview).toHaveBeenCalledWith(expect.objectContaining({ name: "山.txt" }));
  });

  it("does not respond when disabled", async () => {
    const onChange = vi.fn();
    const screen = await render(Host, { props: { extra: { disabled: true, onChange } } });
    const button = screen.getByRole("button", { name: "选择文件" });
    await expect.element(button).toBeDisabled();
    expect(screen.container.querySelector(".m-upload--disabled")).not.toBeNull();
    pick(screen.container, [file("山.txt")]);
    await expect.element(screen.getByTestId("out")).toHaveTextContent("");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("accepts dropped files in drag mode and opens the picker from the keyboard", async () => {
    const screen = await render(Host, { props: { extra: { drag: true, accept: ".txt" } } });
    const zone = screen.getByRole("button", { name: "拖到这里或点击" });
    await expect.element(zone).toHaveAttribute("tabindex", "0");

    drop(zone.element(), [file("山.txt"), file("图.png", "image/png")]);
    // 拖入过程中区上有 dragover 类，落下后撤掉；不合 accept 的被过滤
    await expect.element(screen.getByTestId("out")).toHaveTextContent("山.txt:ready");
    expect(screen.container.querySelector(".m-upload--dragover")).toBeNull();

    // 回车打开系统选择框：只能验证 input 被点了
    const input = screen.container.querySelector<HTMLInputElement>("input[type=file]")!;
    const clicked = vi.fn((event: Event) => event.preventDefault());
    input.addEventListener("click", clicked);
    zone.element().focus();
    await userEvent.keyboard("{Enter}");
    expect(clicked).toHaveBeenCalledTimes(1);
  });

  it("ignores drops when disabled and renders a custom file row", async () => {
    const screen = await render(Host, {
      props: { extra: { drag: true, disabled: true } },
      slots: {
        file: ({ file: item }: { file: UploadFile }) => h("i", { class: "custom" }, item.name),
      },
    });
    const zone = page.getByRole("button", { name: "拖到这里或点击" });
    await expect.element(zone).toHaveAttribute("aria-disabled", "true");
    await expect.element(zone).toHaveAttribute("tabindex", "-1");
    drop(zone.element(), [file("山.txt")]);
    await expect.element(screen.getByTestId("out")).toHaveTextContent("");
  });

  it("renders the file slot with the scope", async () => {
    const screen = await render(Host, {
      slots: {
        file: ({ file: item }: { file: UploadFile }) => h("i", { class: "custom" }, item.name),
      },
    });
    pick(screen.container, [file("山.txt")]);
    await vi.waitFor(() =>
      expect(screen.container.querySelector(".custom")?.textContent).toBe("山.txt"),
    );
    expect(screen.container.querySelector(".m-upload-file")).toBeNull();
  });
});
