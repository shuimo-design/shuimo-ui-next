<script setup lang="ts">
import { ref } from "vue";
import { MButton, MMessage, MSelect, useMessage, type MessageDirection } from "@shuimo-design/ui";

const message = useMessage();
const direction = ref<MessageDirection>("top-right");
const directions: { label: string; value: MessageDirection }[] = [
  { label: "右上", value: "top-right" },
  { label: "左上", value: "top-left" },
  { label: "顶部居中", value: "top-center" },
  { label: "右下", value: "bottom-right" },
  { label: "左下", value: "bottom-left" },
  { label: "底部居中", value: "bottom-center" },
];

// 旧文档示例：四种类型一起弹
function callAll() {
  MMessage.success("success 的 message");
  MMessage.warning("warning 的 message");
  MMessage.info("info 的 message");
  MMessage.error("error 的 message");
}

function callAt() {
  message.show({ content: `这是一条 ${direction.value} 的消息`, direction: direction.value });
}

// 旧文档示例：拖拽关闭
function callDraggable() {
  message.show({ content: "往上拖我，拖过三分之一松手就关", direction: "top-center", duration: 0 });
}

function callSticky() {
  message.warning({ content: "我不会自己走，点右边的叉", duration: 0, closable: true });
}

function callLong() {
  message.info(
    "君不见，黄河之水天上来，奔流到海不复回。君不见，高堂明镜悲白发，朝如青丝暮成雪。",
    6000,
  );
}
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">函数式调用（旧文档示例）</p>
      <div class="demo__row">
        <MButton @click="callAll">点击显示 Message</MButton>
        <MButton @click="callDraggable">拖拽关闭</MButton>
        <MButton @click="callSticky">不自动关闭</MButton>
        <MButton @click="callLong">长文本</MButton>
        <MButton type="text" @click="message.closeAll()">全部关掉</MButton>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">六个方向</p>
      <div class="demo__row">
        <MSelect v-model="direction" :options="directions" style="max-width: 160px" />
        <MButton @click="callAt">在这里弹</MButton>
      </div>
      <p class="demo__hint">鼠标移上去会暂停倒计时；往屏幕外拖过三分之一松手即关</p>
    </div>

    <div class="demo__block">
      <p class="demo__caption">声明式：直接当组件放在页面里</p>
      <div class="demo__row">
        <MMessage type="success" content="保存成功" :duration="0" :drag-allow="false" />
        <MMessage type="warning" content="磁盘空间不足" :duration="0" :drag-allow="false" />
      </div>
      <div class="demo__row">
        <MMessage type="error" content="网络请求失败" :duration="0" :drag-allow="false" closable />
        <MMessage type="info" :duration="0" :drag-allow="false">
          <template #icon>🖌</template>
          自定义图标与<b>富文本</b>内容
        </MMessage>
      </div>
    </div>
  </div>
</template>
