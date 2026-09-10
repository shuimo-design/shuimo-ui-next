<script setup lang="ts">
import { ref } from "vue";
import { MInput } from "@shuimo-design/ui";

const value = ref("大侠可尝试修改这里");
const text = ref("");
const password = ref("");
const counted = ref("");
const note = ref("");
</script>

<template>
  <div class="demo">
    <!-- 旧文档：普通输入框 / 占位符 / 禁用 -->
    <div class="demo__block">
      <p class="demo__caption">普通输入框、占位符、禁用、只读</p>
      <div class="demo__row">
        <MInput />
        <MInput placeholder="请大侠输入...." />
        <MInput model-value="不可编辑" disabled />
        <MInput model-value="只读" readonly />
      </div>
    </div>

    <!-- 旧文档：参数（v-model） -->
    <div class="demo__block">
      <p class="demo__caption">v-model：{{ value }}</p>
      <MInput v-model="value" />
    </div>

    <div class="demo__block">
      <p class="demo__caption">清空、密码切换、字数统计、前后缀</p>
      <div class="demo__row">
        <MInput v-model="text" placeholder="题字" clearable />
        <MInput v-model="password" type="password" placeholder="密码" show-password />
        <MInput v-model="counted" placeholder="限 10 字" :maxlength="10" show-count />
        <MInput placeholder="金额">
          <template #prefix>￥</template>
          <template #suffix>元</template>
        </MInput>
      </div>
    </div>

    <!-- 旧文档：文本输入框 -->
    <div class="demo__block">
      <p class="demo__caption">多行文本</p>
      <MInput
        v-model="note"
        type="textarea"
        placeholder="落款"
        :rows="4"
        :maxlength="200"
        show-count
      />
      <MInput type="textarea" model-value="不能拖拽改大小" resize="none" :rows="2" />
    </div>

    <p class="demo__hint">text {{ text || "空" }} · note {{ note.length }} 字</p>
  </div>
</template>
