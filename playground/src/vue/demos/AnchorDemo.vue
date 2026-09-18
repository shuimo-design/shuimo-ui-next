<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import { MAnchor, type AnchorItem } from "@shuimo-design/vue";

const chapters: AnchorItem[] = [
  { href: "#anchor-mo", title: "磨墨" },
  {
    href: "#anchor-bi",
    title: "润笔",
    children: [
      { href: "#anchor-bi-feng", title: "试锋" },
      { href: "#anchor-bi-zhan", title: "蘸墨" },
    ],
  },
  { href: "#anchor-zhi", title: "落纸" },
  { href: "#anchor-yin", title: "钤印" },
];

/** 正文：每节一个标题 + 几段字，id 和 href 对上 */
const sections = [
  { id: "anchor-mo", title: "磨墨", text: "松烟入砚，徐徐研开。墨要磨得匀，不急不躁。" },
  { id: "anchor-bi", title: "润笔", text: "新笔先在清水里泡开，笔锋散了才好蘸墨。" },
  { id: "anchor-bi-feng", title: "试锋", text: "在废纸上横竖各拖一笔，看笔锋聚不聚。" },
  { id: "anchor-bi-zhan", title: "蘸墨", text: "饱蘸浓淡，笔肚含墨、笔尖略干。" },
  { id: "anchor-zhi", title: "落纸", text: "一气呵成，不作修饰。" },
  { id: "anchor-yin", title: "钤印", text: "朱砂一点，落款收笔。" },
];

const current = ref("");
const log = ref<string[]>([]);
function onChange(href: string) {
  log.value = [...log.value.slice(-4), href];
}

// container 传函数：导航挂载时盒子已经在了，函数返回的就是它
const box = useTemplateRef<HTMLElement>("box");
const boxTarget = () => box.value;
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">
        盯着一个滚动盒子（container
        传函数）：滚动时激活项跟着走，指示线滑到它旁边；点击滚到对应的节。children 缩进一级
      </p>
      <div class="anchor-demo__layout">
        <MAnchor
          v-model:current="current"
          :items="chapters"
          :container="boxTarget"
          :offset="8"
          @change="onChange"
        />
        <div ref="box" class="anchor-demo__box">
          <section v-for="s in sections" :id="s.id" :key="s.id" class="anchor-demo__section">
            <h4>{{ s.title }}</h4>
            <p v-for="n in 3" :key="n">{{ s.text }}</p>
          </section>
        </div>
      </div>
      <p class="demo__hint">
        当前 {{ current || "（无）" }}；最近变化：{{ log.join("，") || "无" }}
      </p>
    </div>

    <div class="demo__block">
      <p class="demo__caption">
        direction="horizontal" 横排一行，指示线在底部；item 插槽自定义每条，拿到 active
      </p>
      <MAnchor :items="chapters" :container="boxTarget" direction="horizontal" :seed="3">
        <template #item="{ item, active }">
          <span>{{ active ? "◆ " : "" }}{{ item.title }}</span>
        </template>
      </MAnchor>
    </div>

    <div class="demo__block">
      <p class="demo__caption">
        盯着文档站的正文区（container=".pg__main"）并吸顶：affix 加 offset 64 就是 sticky top:
        64px；这里的 href 指向本页上面几节。updateHash 会把 href 写进地址栏，文档站用 hash
        做路由，示例里不开
      </p>
      <MAnchor
        :items="chapters.slice(0, 2)"
        container=".pg__main"
        :offset="64"
        affix
        style="max-width: 200px"
      />
    </div>
  </div>
</template>

<style scoped>
.anchor-demo__layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.anchor-demo__box {
  flex: 1;
  height: 240px;
  padding: 0 16px;
  border: 1px solid var(--m-border);
  overflow: auto;
}

.anchor-demo__section h4 {
  margin: 12px 0 4px;
}

.anchor-demo__section p {
  margin: 4px 0;
}
</style>
