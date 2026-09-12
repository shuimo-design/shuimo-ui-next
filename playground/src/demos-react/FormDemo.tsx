import { useRef, useState } from "react";
import {
  MButton,
  MForm,
  MFormItem,
  MInput,
  MInputNumber,
  MSwitch,
  type FormExpose,
  type FormRules,
} from "@shuimo-design/react";

/**
 * React 版表单。和 Vue 版共用 core 里的同一套校验规则执行器、同一个校验状态机、同一份类名。
 * 区别只在绑定方式：Vue 用 reactive + v-model，React 这里用一个可变的 model 对象 + onValueChange。
 * 表单项按 prop 直接读写 model，所以 model 必须是**同一个对象**，不能每次渲染新建一个。
 */
export default function FormDemo() {
  const model = useRef({ name: "", email: "", age: 1, agree: false }).current;
  const form = useRef<FormExpose>(null);
  const [result, setResult] = useState("尚未提交");
  const [serverError, setServerError] = useState("");
  // 只是为了让输入框显示出来的值跟着走；校验读的是上面那个 model
  const [, forceRender] = useState(0);
  const bump = () => forceRender((n) => n + 1);

  const rules: FormRules = {
    name: [
      { required: true, message: "请题上名字", trigger: "blur" },
      { min: 2, max: 6, message: "名字 2 到 6 个字", trigger: "change" },
    ],
    email: [{ type: "email", message: "邮箱格式不对", trigger: "blur" }],
    age: [{ type: "number", min: 1, max: 120, message: "年龄要在 1 到 120 之间" }],
    agree: [
      { validator: (_rule, value) => value === true || "不同意就不能提交", trigger: "change" },
    ],
  };

  async function submit() {
    const r = await form.current?.validate();
    if (!r) return;
    setResult(
      r.valid
        ? "校验通过，可以提交了"
        : `还有 ${r.errors.length} 项没过：${r.errors.map((e) => e.message).join("；")}`,
    );
  }

  return (
    <div className="demo">
      <div className="demo__block">
        <p className="demo__caption">
          普通表单：blur / change 触发校验，出错时控件下划一笔朱砂；点「提交」跑整表校验
        </p>
        <MForm ref={form} model={model} rules={rules} labelWidth="96px">
          <MFormItem label="名字" prop="name">
            <MInput
              value={model.name}
              placeholder="题字"
              clearable
              onValueChange={(v) => {
                model.name = v;
                bump();
              }}
            />
          </MFormItem>
          <MFormItem label="邮箱" prop="email">
            <MInput
              value={model.email}
              placeholder="someone@example.com"
              onValueChange={(v) => {
                model.email = v;
                bump();
              }}
            />
          </MFormItem>
          <MFormItem label="年龄" prop="age">
            <MInputNumber
              value={model.age}
              min={1}
              max={120}
              onValueChange={(v) => {
                model.age = v ?? 0;
                bump();
              }}
            />
          </MFormItem>
          <MFormItem label="同意约定" prop="agree">
            <MSwitch
              value={model.agree}
              onValueChange={(v) => {
                model.agree = Boolean(v);
                bump();
              }}
            />
          </MFormItem>
          <MFormItem>
            <div className="demo__row">
              <MButton type="primary" onClick={submit}>
                提交
              </MButton>
              <MButton
                onClick={() => {
                  form.current?.resetFields();
                  setResult("已重置");
                  bump();
                }}
              >
                重置
              </MButton>
              <MButton onClick={() => form.current?.clearValidate()}>只清校验状态</MButton>
            </div>
          </MFormItem>
        </MForm>
        <p className="demo__caption">{result}</p>
      </div>

      <div className="demo__block">
        <p className="demo__caption">
          标签在上、必填星号、外部错误（error prop 非空就一律显示为错误态，渲染期派生，不用 effect）
        </p>
        <MForm model={{ title: "" }} labelPosition="top">
          <MFormItem label="标题" prop="title" required>
            <MInput placeholder="必填" />
          </MFormItem>
          <MFormItem label="接口报错" prop="title" error={serverError}>
            <MInput placeholder="点下面的按钮塞一个错误进来" />
          </MFormItem>
          <MFormItem>
            <div className="demo__row">
              <MButton onClick={() => setServerError("服务端说这个标题重复了")}>
                模拟接口报错
              </MButton>
              <MButton onClick={() => setServerError("")}>清掉</MButton>
            </div>
          </MFormItem>
        </MForm>
      </div>

      <div className="demo__block">
        <p className="demo__caption">行内表单 / 整表禁用</p>
        <MForm model={{ keyword: "" }} inline>
          <MFormItem label="关键词" prop="keyword">
            <MInput placeholder="搜点什么" />
          </MFormItem>
          <MFormItem>
            <MButton type="primary">搜索</MButton>
          </MFormItem>
        </MForm>
        <MForm model={{ title: "不可改" }} disabled labelWidth="96px">
          <MFormItem label="标题" prop="title">
            <MInput value="不可改" />
          </MFormItem>
          <MFormItem label="开关">
            <MSwitch />
          </MFormItem>
        </MForm>
      </div>
    </div>
  );
}
