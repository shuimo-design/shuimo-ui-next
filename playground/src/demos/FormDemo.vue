<script setup lang="ts">
import { reactive, ref } from "vue";
import {
  MButton,
  MCheckbox,
  MCheckboxGroup,
  MDatePicker,
  MForm,
  MFormItem,
  MInput,
  MRadio,
  MRadioGroup,
  MSelect,
  MSwitch,
  type FormRules,
  type SelectOption,
} from "@shuimo-design/ui";

const pigments: SelectOption[] = [
  { label: "朱砂", value: "zhusha" },
  { label: "花青", value: "huaqing" },
  { label: "藤黄", value: "tenghuang" },
  { label: "赭石", value: "zheshi" },
];

const model = reactive({
  name: "",
  email: "",
  pigment: undefined as string | number | boolean | (string | number | boolean)[] | undefined,
  season: "",
  hobbies: [] as (string | number | boolean)[],
  date: null as string | null,
  agree: false,
  remark: "",
});

const rules: FormRules = {
  name: [
    { required: true, message: "请题上名字", trigger: "blur" },
    { min: 2, max: 6, message: "名字 2 到 6 个字", trigger: "change" },
  ],
  email: [{ type: "email", message: "邮箱格式不对", trigger: "blur" }],
  pigment: [{ required: true, message: "总得选一种颜料", trigger: "change" }],
  season: [{ required: true, message: "选一个季节", trigger: "change" }],
  hobbies: [{ type: "array", min: 2, message: "至少挑两样", trigger: "change" }],
  date: [{ required: true, message: "落款日期不能空", trigger: "change" }],
  agree: [
    {
      validator: (_rule, value) => value === true || "不同意就不能提交",
      trigger: "change",
    },
  ],
  remark: [{ max: 20, message: "最多 20 个字", trigger: "change" }],
};

const form = ref<InstanceType<typeof MForm> | null>(null);
const result = ref("尚未提交");

async function submit() {
  const r = await form.value?.validate();
  if (!r) return;
  result.value = r.valid
    ? "校验通过，可以提交了"
    : `还有 ${r.errors.length} 项没过：${r.errors.map((e) => e.message).join("；")}`;
}

function reset() {
  form.value?.resetFields();
  result.value = "已重置";
}

const inlineModel = reactive({ keyword: "", scope: "all" });
const inlineRules: FormRules = {
  keyword: [{ required: true, message: "关键词必填", trigger: "blur" }],
};
const scopes: SelectOption[] = [
  { label: "全部", value: "all" },
  { label: "山水", value: "landscape" },
  { label: "花鸟", value: "flower" },
];

const topModel = reactive({ title: "", disabled: "不可改" });
const serverError = ref("");
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">
        普通表单：blur / change 触发校验，出错时控件下划一笔朱砂；点「提交」跑整表校验
      </p>
      <MForm ref="form" :model="model" :rules="rules" label-width="96px" @submit="submit">
        <MFormItem label="名字" prop="name">
          <MInput v-model="model.name" placeholder="题字" clearable />
        </MFormItem>
        <MFormItem label="邮箱" prop="email">
          <MInput v-model="model.email" type="email" placeholder="非必填，但填了要合规" />
        </MFormItem>
        <MFormItem label="颜料" prop="pigment">
          <MSelect v-model="model.pigment" :options="pigments" clearable placeholder="选一种颜料" />
        </MFormItem>
        <MFormItem label="季节" prop="season">
          <MRadioGroup v-model="model.season">
            <MRadio value="chun" label="春" />
            <MRadio value="xia" label="夏" />
            <MRadio value="qiu" label="秋" />
            <MRadio value="dong" label="冬" />
          </MRadioGroup>
        </MFormItem>
        <MFormItem label="爱好" prop="hobbies">
          <MCheckboxGroup v-model="model.hobbies">
            <MCheckbox value="shu" label="书" />
            <MCheckbox value="hua" label="画" />
            <MCheckbox value="qin" label="琴" />
            <MCheckbox value="qi" label="棋" />
          </MCheckboxGroup>
        </MFormItem>
        <MFormItem label="落款日期" prop="date">
          <MDatePicker v-model="model.date" />
        </MFormItem>
        <MFormItem label="同意约定" prop="agree">
          <MSwitch v-model="model.agree" active-text="同意" inactive-text="不同意" />
        </MFormItem>
        <MFormItem label="备注" prop="remark">
          <MInput v-model="model.remark" type="textarea" :rows="2" placeholder="最多 20 个字" />
        </MFormItem>
        <MFormItem>
          <div class="demo__row">
            <MButton type="primary" native-type="submit">提交</MButton>
            <MButton @click="reset">重置</MButton>
            <MButton @click="form?.clearValidate()">清除校验</MButton>
          </div>
        </MFormItem>
      </MForm>
      <p class="demo__hint">{{ result }}</p>
    </div>

    <div class="demo__block">
      <p class="demo__caption">行内表单（旧版 inline）</p>
      <MForm :model="inlineModel" :rules="inlineRules" inline label-width="auto">
        <MFormItem label="关键词" prop="keyword">
          <MInput v-model="inlineModel.keyword" placeholder="必填" />
        </MFormItem>
        <MFormItem label="范围" prop="scope">
          <MSelect v-model="inlineModel.scope" :options="scopes" />
        </MFormItem>
        <MFormItem>
          <MButton type="primary">查询</MButton>
        </MFormItem>
      </MForm>
    </div>

    <div class="demo__block">
      <p class="demo__caption">标签在上方 / 右对齐、整表禁用、外部塞入的错误信息</p>
      <div class="demo__row" style="align-items: flex-start; gap: 32px">
        <MForm :model="topModel" label-position="top" style="min-width: 260px">
          <MFormItem label="标题" prop="title" required>
            <MInput v-model="topModel.title" placeholder="必填，星号是一点朱砂" />
          </MFormItem>
          <MFormItem label="接口报错" prop="title" :error="serverError">
            <MInput v-model="topModel.title" placeholder="点下面按钮模拟后端报错" />
          </MFormItem>
          <MFormItem>
            <MButton size="sm" @click="serverError = serverError ? '' : '后端说：标题已被占用'">
              {{ serverError ? "清掉报错" : "模拟后端报错" }}
            </MButton>
          </MFormItem>
        </MForm>
        <MForm
          :model="topModel"
          label-position="right"
          label-width="80px"
          disabled
          style="min-width: 300px"
        >
          <MFormItem label="标题" prop="disabled">
            <MInput v-model="topModel.disabled" />
          </MFormItem>
          <MFormItem label="开关">
            <MSwitch :model-value="true" />
          </MFormItem>
        </MForm>
      </div>
    </div>
  </div>
</template>
