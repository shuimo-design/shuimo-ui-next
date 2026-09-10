import { userEvent } from "vitest/browser";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-vue";
import { defineComponent, h, reactive, ref } from "vue";
import { MInput } from "../input";
import { MForm, MFormItem, type FormRules, type FormValidateResult } from ".";
import { isEmptyValue, runRule } from "./validate";

const rules: FormRules = {
  name: [
    { required: true, message: "名字必填", trigger: "blur" },
    { min: 2, max: 4, message: "2 到 4 个字", trigger: "change" },
  ],
};

/** 一个带表单、输入框和三个操作按钮的宿主，把 validate() 的结果打到 output 上 */
function createHost(
  options: { disabled?: boolean; labelPosition?: "left" | "right" | "top" } = {},
) {
  const model = reactive({ name: "" });
  return defineComponent({
    setup() {
      const form = ref<InstanceType<typeof MForm> | null>(null);
      const result = ref("");
      async function check() {
        const r: FormValidateResult | undefined = await form.value?.validate();
        result.value = r ? `${r.valid}:${r.errors.map((e) => e.message).join("|")}` : "none";
      }
      return () =>
        h("div", [
          h(
            MForm,
            {
              ref: form,
              model,
              rules,
              disabled: options.disabled,
              labelPosition: options.labelPosition,
            },
            () => [
              h(MFormItem, { label: "名字", prop: "name" }, () =>
                h(MInput, {
                  modelValue: model.name,
                  "onUpdate:modelValue": (v: string) => {
                    model.name = v;
                  },
                }),
              ),
            ],
          ),
          h("button", { type: "button", onClick: check }, "校验"),
          h("button", { type: "button", onClick: () => form.value?.resetFields() }, "重置"),
          h("button", { type: "button", onClick: () => form.value?.clearValidate() }, "清除"),
          h("output", { "data-testid": "out" }, result.value),
          h("output", { "data-testid": "model" }, model.name),
        ]);
    },
  });
}

describe("MForm", () => {
  it("renders label linked to the control and marks required", async () => {
    const screen = await render(createHost());
    const input = screen.getByLabelText("名字");
    await expect.element(input).toBeVisible();
    const item = screen.container.querySelector(".m-form-item");
    expect(item?.classList.contains("m-form-item--required")).toBe(true);
    expect(screen.container.querySelector(".m-form-item__asterisk")).not.toBeNull();
    const label = screen.container.querySelector("label");
    expect(label?.getAttribute("for")).toBe(input.element().getAttribute("id"));
  });

  it("shows the error on blur and clears it after a valid change", async () => {
    const screen = await render(createHost());
    const input = screen.getByLabelText("名字");
    await input.click();
    await userEvent.tab();
    await expect.element(screen.getByRole("alert")).toHaveTextContent("名字必填");
    await input.fill("山水");
    await userEvent.tab();
    await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();
    expect(
      screen.container.querySelector(".m-form-item")?.classList.contains("m-form-item--success"),
    ).toBe(true);
  });

  it("validate() reports errors and resetFields() restores the value", async () => {
    const screen = await render(createHost());
    await screen.getByRole("button", { name: "校验" }).click();
    await expect.element(screen.getByTestId("out")).toHaveTextContent("false:名字必填");
    await expect.element(screen.getByRole("alert")).toBeVisible();

    await screen.getByLabelText("名字").fill("一二三四五");
    await expect.element(screen.getByTestId("model")).toHaveTextContent("一二三四五");
    await screen.getByRole("button", { name: "校验" }).click();
    await expect.element(screen.getByTestId("out")).toHaveTextContent("false:2 到 4 个字");

    await screen.getByRole("button", { name: "重置" }).click();
    await expect.element(screen.getByTestId("model")).toHaveTextContent("");
    await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();

    await screen.getByLabelText("名字").fill("墨");
    await screen.getByRole("button", { name: "校验" }).click();
    await expect.element(screen.getByTestId("out")).toHaveTextContent("false:2 到 4 个字");
    await screen.getByRole("button", { name: "清除" }).click();
    await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();

    await screen.getByLabelText("名字").fill("山水");
    await screen.getByRole("button", { name: "校验" }).click();
    await expect.element(screen.getByTestId("out")).toHaveTextContent("true:");
  });

  it("disables inner controls when the form is disabled", async () => {
    const screen = await render(createHost({ disabled: true }));
    await expect.element(screen.getByLabelText("名字")).toBeDisabled();
  });

  it("emits validate and puts the label on top", async () => {
    const onValidate = vi.fn();
    const model = reactive({ agree: false });
    const Host = defineComponent({
      setup() {
        return () =>
          h(MForm, { model, labelPosition: "top", onValidate }, () => [
            h(
              MFormItem,
              {
                label: "备注",
                prop: "agree",
                rules: { validator: (_rule, value) => value === true || "得先同意" },
              },
              () =>
                h(MInput, {
                  modelValue: "",
                }),
            ),
          ]);
      },
    });
    const screen = await render(Host);
    expect(screen.container.querySelector(".m-form--label-top")).not.toBeNull();
    const input = screen.getByLabelText("备注");
    await input.click();
    await userEvent.tab();
    await expect.element(screen.getByRole("alert")).toHaveTextContent("得先同意");
    expect(onValidate).toHaveBeenCalledWith("agree", false, "得先同意");
  });
});

describe("form rules", () => {
  it("treats blank strings and empty arrays as empty", () => {
    expect(isEmptyValue("  ")).toBe(true);
    expect(isEmptyValue([])).toBe(true);
    expect(isEmptyValue(0)).toBe(false);
    expect(isEmptyValue(false)).toBe(false);
  });

  it("checks type, range, pattern and custom validators", async () => {
    expect(await runRule({ type: "email" }, "a@b", {})).toBe("邮箱格式不对");
    expect(await runRule({ type: "email" }, "a@b.cn", {})).toBeUndefined();
    expect(await runRule({ min: 3 }, 2, {})).toBe("不能小于 3");
    expect(await runRule({ max: 2 }, "abc", {})).toBe("最多 2 个字符");
    expect(await runRule({ pattern: /^\d+$/, message: "只能数字" }, "1a", {})).toBe("只能数字");
    // 非必填留空时跳过内置检查
    expect(await runRule({ min: 3 }, "", {})).toBeUndefined();
    expect(await runRule({ validator: async () => false, message: "自定义" }, 1, {})).toBe(
      "自定义",
    );
  });
});
