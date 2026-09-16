<script setup lang="ts">
import { ref } from "vue";
// 通知由树里的 <MOverlayOutlet>（App.vue 放了一个，MConfigProvider 也自带）渲染，直接调 MNotification.*
import { MButton, MNotification, MSelect, type NotificationPlacement } from "@shuimo-design/vue";

const placement = ref<NotificationPlacement>("top-right");
const placements: { label: string; value: NotificationPlacement }[] = [
  { label: "右上", value: "top-right" },
  { label: "左上", value: "top-left" },
  { label: "右下", value: "bottom-right" },
  { label: "左下", value: "bottom-left" },
];

// 四种类型一起弹
function callAll() {
  MNotification.success({ title: "部署完成", content: "v1.0.0-beta.2 已上线，共 48 个组件。" });
  MNotification.info({ title: "新消息", content: "李白评论了你的诗稿《将进酒》。" });
  MNotification.warning({ title: "磁盘快满了", content: "还剩 2% 空间，请及时清理。" });
  MNotification.error({ title: "同步失败", content: "服务器没有回应，稍后再试。" });
}

function callAt() {
  MNotification.open({
    title: `这是 ${placement.value} 的通知`,
    content: "同一个角的通知按先后叠成一栈。",
    placement: placement.value,
  });
}

function callSticky() {
  MNotification.open({
    title: "我不会自己走",
    content: "duration 为 0 的通知只能点右上角的叉关掉。",
    duration: 0,
    onClose: () => MNotification.info("刚才那条关掉了"),
  });
}

function callPlain() {
  MNotification.open("只有一行标题的通知");
}
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">函数式调用：标题 + 正文，四种类型各带一枚徽记</p>
      <div class="demo__row">
        <MButton @click="callAll">四种一起弹</MButton>
        <MButton @click="callSticky">不自动关闭</MButton>
        <MButton @click="callPlain">只有标题</MButton>
        <MButton type="text" @click="MNotification.closeAll()">全部关掉</MButton>
      </div>
      <p class="demo__hint">默认 4.5 秒后自动关闭；鼠标移上去会暂停倒计时</p>
    </div>

    <div class="demo__block">
      <p class="demo__caption">四个角</p>
      <div class="demo__row">
        <MSelect v-model="placement" :options="placements" style="max-width: 160px" />
        <MButton @click="callAt">在这里弹</MButton>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">声明式：直接当组件放在页面里</p>
      <div class="demo__row">
        <MNotification type="success" title="保存成功" content="修改已同步到列表" :duration="0" />
        <MNotification type="warning" title="磁盘快满了" :duration="0" :closable="false">
          还剩 <b>2%</b> 空间，请及时清理
        </MNotification>
      </div>
      <div class="demo__row">
        <MNotification title="自定义徽记" content="icon 插槽换掉类型徽记" :duration="0">
          <template #icon>🖌</template>
        </MNotification>
        <MNotification type="error" title="同步失败" content="role 是 alert" :duration="0" />
      </div>
    </div>
  </div>
</template>
