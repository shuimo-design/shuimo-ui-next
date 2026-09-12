import { useRef, useState } from "react";
import { userEvent } from "vitest/browser";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { isEmptyValue, runRule, type FormExpose, type FormRules } from "@shuimo-design/core";
import { MInput } from "../input";
import { MForm, MFormItem } from ".";

const rules: FormRules = {
  name: [
    { required: true, message: "名字必填", trigger: "blur" },
    { min: 2, max: 4, message: "2 到 4 个字", trigger: "change" },
  ],
};

/** 一个带表单、输入框和三个操作按钮的宿主，把 validate() 的结果打到 output 上 */
function Host({
  disabled,
  labelPosition,
}: {
  disabled?: boolean;
  labelPosition?: "left" | "right" | "top";
}) {
  // model 是可变对象：表单项按 prop 直接读写它，和 Vue 那边的 reactive 是同一个约定
  const model = useRef({ name: "" }).current;
  const form = useRef<FormExpose>(null);
  const [result, setResult] = useState("");
  const [shown, setShown] = useState("");

  async function check() {
    const r = await form.current?.validate();
    setResult(r ? `${r.valid}:${r.errors.map((e) => e.message).join("|")}` : "none");
    setShown(model.name);
  }

  return (
    <div>
      <MForm
        ref={form}
        model={model}
        rules={rules}
        disabled={disabled}
        labelPosition={labelPosition}
      >
        <MFormItem label="名字" prop="name">
          <MInput
            defaultValue=""
            onValueChange={(v) => {
              model.name = v;
              setShown(v);
            }}
          />
        </MFormItem>
      </MForm>
      <button type="button" onClick={check}>
        校验
      </button>
      <button
        type="button"
        onClick={() => {
          form.current?.resetFields();
          setShown(model.name);
        }}
      >
        重置
      </button>
      <button type="button" onClick={() => form.current?.clearValidate()}>
        清除
      </button>
      <output data-testid="out">{result}</output>
      <output data-testid="model">{shown}</output>
    </div>
  );
}

describe("MForm", () => {
  it("renders label linked to the control and marks required", async () => {
    const screen = await render(<Host />);
    const input = screen.getByLabelText("名字");
    await expect.element(input).toBeVisible();
    const item = screen.container.querySelector(".m-form-item");
    expect(item?.classList.contains("m-form-item--required")).toBe(true);
    expect(screen.container.querySelector(".m-form-item__asterisk")).not.toBeNull();
    const label = screen.container.querySelector("label");
    expect(label?.getAttribute("for")).toBe(input.element().getAttribute("id"));
  });

  it("shows the error on blur and clears it after a valid change", async () => {
    const screen = await render(<Host />);
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
    const screen = await render(<Host />);
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
    const screen = await render(<Host disabled />);
    await expect.element(screen.getByLabelText("名字")).toBeDisabled();
  });

  it("emits validate and puts the label on top", async () => {
    const onValidate = vi.fn();
    const model = { agree: false };
    const screen = await render(
      <MForm model={model} labelPosition="top" onValidate={onValidate}>
        <MFormItem
          label="备注"
          prop="agree"
          rules={{ validator: (_rule, value) => value === true || "得先同意" }}
        >
          <MInput value="" />
        </MFormItem>
      </MForm>,
    );
    expect(screen.container.querySelector(".m-form--label-top")).not.toBeNull();
    const input = screen.getByLabelText("备注");
    await input.click();
    await userEvent.tab();
    await expect.element(screen.getByRole("alert")).toHaveTextContent("得先同意");
    expect(onValidate).toHaveBeenCalledWith("agree", false, "得先同意");
  });

  it("shows an external error prop as an error state", async () => {
    const screen = await render(
      <MForm model={{ title: "" }}>
        <MFormItem label="标题" prop="title" error="接口说这个标题重复了">
          <MInput defaultValue="" />
        </MFormItem>
      </MForm>,
    );
    // 外部 error 是渲染期派生的，不用等 effect：首帧就是错误态
    await expect.element(screen.getByRole("alert")).toHaveTextContent("接口说这个标题重复了");
    expect(
      screen.container.querySelector(".m-form-item")?.classList.contains("m-form-item--error"),
    ).toBe(true);
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
