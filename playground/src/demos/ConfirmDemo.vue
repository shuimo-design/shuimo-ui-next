<script setup lang="ts">
import { ref } from "vue";
import { MButton, MConfirm, useConfirm } from "@shuimo-design/ui";

const confirm = useConfirm();
const result = ref<string>("");
const open = ref(false);

// 旧文档示例：await 拿结果
async function showConfirm() {
  const ok = await MConfirm.show({ content: "君不见，黄河之水天上来" });
  result.value = ok ? "确定" : "取消";
}

async function showNoMask() {
  const ok = await confirm.show({
    title: "无遮罩",
    content: "后面的页面还能点",
    mask: { show: false },
    confirmText: "知道了",
    cancelText: "再想想",
  });
  result.value = ok ? "知道了" : "再想想";
}
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">函数式调用（旧文档示例）</p>
      <div class="demo__row">
        <MButton @click="showConfirm">点击弹出确认框</MButton>
        <MButton @click="showNoMask">无遮罩、自定义按钮文字</MButton>
      </div>
      <p class="demo__hint">结果：{{ result || "—" }}</p>
    </div>

    <div class="demo__block">
      <p class="demo__caption">声明式：v-model:open + 插槽</p>
      <div class="demo__row">
        <MButton @click="open = true">打开</MButton>
      </div>
      <MConfirm
        v-model:open="open"
        title="删除文件"
        @confirm="result = '删了'"
        @cancel="result = '留着'"
      >
        <p style="margin: 0">将删除 <b>山水.psd</b>，此操作不可恢复。</p>
        <template #footer="{ confirm: ok, cancel }">
          <MButton type="primary" @click="ok">删除</MButton>
          <MButton type="text" @click="cancel">算了</MButton>
        </template>
      </MConfirm>
    </div>
  </div>
</template>
