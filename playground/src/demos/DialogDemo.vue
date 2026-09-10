<script setup lang="ts">
import { ref } from "vue";
import { MButton, MDialog, MInput } from "@shuimo-design/ui";

const controlled = ref(false);
const bound = ref(false);
const name = ref("");
</script>

<template>
  <div class="demo">
    <p class="demo__caption">普通弹窗：active 插槽当触发器，点遮罩、按 ESC、点右上角挂牌都能关</p>
    <div class="demo__row">
      <MDialog title="弹窗">
        <template #active><MButton>点击显示弹窗</MButton></template>
        <span>君不见，黄河之水天上来</span>
      </MDialog>
      <MDialog :mask="false" title="无蒙版">
        <template #active><MButton>无蒙版弹窗</MButton></template>
        <span>晴空一鹤排云上，便引诗情到碧霄。</span>
      </MDialog>
      <MDialog :height="480" title="设置高度">
        <template #active><MButton>高 480px</MButton></template>
        <div>山河风景元无异，城郭人民半已非。</div>
      </MDialog>
    </div>

    <p class="demo__caption">控制关闭：不给挂牌、不许点遮罩，只能走底部按钮</p>
    <div class="demo__row">
      <MDialog
        v-model="controlled"
        title="控制关闭"
        :close-btn="false"
        :mask="{ clickClose: false }"
        :close-on-esc="false"
      >
        <template #active><MButton>点击显示弹窗</MButton></template>
        <p style="margin: 0">这扇窗只能从下面这个按钮关。</p>
        <template #footer>
          <MButton type="primary" @click="controlled = false">关闭</MButton>
        </template>
      </MDialog>
    </div>

    <p class="demo__caption">
      双向绑定 + header / footer 插槽：打开时焦点落进输入框（autofocus），关掉后回到按钮
    </p>
    <div class="demo__row">
      <MButton @click="bound = true">点击这里</MButton>
      <MDialog v-model="bound" :width="420" :seed="7">
        <template #header>题名</template>
        <MInput v-model="name" placeholder="写下你的名字" autofocus />
        <template #footer>
          <MButton @click="bound = false">取消</MButton>
          <MButton type="confirm" @click="bound = false">确定</MButton>
        </template>
      </MDialog>
      <span class="demo__hint">bound {{ bound }} · name {{ name || "空" }}</span>
    </div>
  </div>
</template>
