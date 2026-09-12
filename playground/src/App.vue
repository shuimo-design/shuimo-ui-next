<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from "vue";
import { MButton, MList, MListItem, MOverlayOutlet, MRicePaper } from "@shuimo-design/vue";
import { startInkViewTransition } from "@shuimo-design/core/ink";
import ApiDoc from "./ApiDoc.vue";
import ReactIsland from "./ReactIsland.vue";
import { ALL_DEMOS, DEMOS, REACT_PROGRESS } from "./registry";

const dark = ref(false);
const seed = ref(42);
// 两边 demo 并排还是只看一边；记住选择，翻页不用重选
type Pane = "both" | "vue" | "react";
const pane = ref<Pane>((localStorage.getItem("pg-pane") as Pane | null) ?? "both");
watch(pane, (v) => localStorage.setItem("pg-pane", v));
const showVue = computed(() => pane.value !== "react");
const showReact = computed(() => pane.value !== "vue");

function readHash(): string {
  return location.hash.replace(/^#\/?/, "") || ALL_DEMOS[0]!.id;
}
const currentId = ref(readHash());
const current = computed(() => ALL_DEMOS.find((d) => d.id === currentId.value) ?? ALL_DEMOS[0]!);

// 左右两栏各自滚动，切页时只把右栏拉回顶部；左栏把当前项滚进可视区（直接带 hash 打开时也能看到选中项）
const main = useTemplateRef<HTMLElement>("main");
const nav = useTemplateRef<HTMLElement>("nav");

function onHashChange() {
  currentId.value = readHash();
}
function go(id: string) {
  if (id === currentId.value) return;
  location.hash = `#/${id}`;
}

function revealActive() {
  nav.value?.querySelector(".pg__item--active")?.scrollIntoView({ block: "nearest" });
}

watch(currentId, () => {
  main.value?.scrollTo({ top: 0 });
  void nextTick(revealActive);
});

onMounted(() => {
  window.addEventListener("hashchange", onHashChange);
  revealActive();
});
onBeforeUnmount(() => window.removeEventListener("hashchange", onHashChange));

function toggleDark() {
  dark.value = !dark.value;
  document.documentElement.dataset.theme = dark.value ? "dark" : "light";
}

function nextPaperWithTransition() {
  void startInkViewTransition(() => {
    seed.value++;
  });
}
</script>

<template>
  <MRicePaper :seed="seed" gold-flecks style="height: 100vh">
    <div class="pg">
      <aside class="pg__aside">
        <h1 class="pg__logo">水墨 <span>next</span></h1>
        <p class="pg__progress">
          React 已搬 {{ REACT_PROGRESS.done }} / {{ REACT_PROGRESS.total }}
        </p>
        <nav ref="nav" class="pg__nav">
          <template v-for="group in DEMOS" :key="group.group">
            <p class="pg__group">{{ group.group }}</p>
            <MList :marker="false">
              <MListItem
                v-for="item in group.items"
                :key="item.id"
                :active="item.id === currentId"
                class="pg__item"
                :class="{ 'pg__item--active': item.id === currentId }"
                @click="go(item.id)"
              >
                {{ item.title }}
                <span class="pg__item-name">{{ item.name }}</span>
              </MListItem>
            </MList>
          </template>
        </nav>
        <div class="pg__tools">
          <MButton
            :type="pane === 'both' ? 'primary' : 'default'"
            @click="pane = pane === 'both' ? 'vue' : pane === 'vue' ? 'react' : 'both'"
          >
            {{ pane === "both" ? "两边并排" : pane === "vue" ? "只看 Vue" : "只看 React" }}
          </MButton>
          <MButton @click="toggleDark">{{ dark ? "转亮" : "转暗" }}</MButton>
          <MButton @click="nextPaperWithTransition">换纸</MButton>
        </div>
      </aside>

      <main ref="main" class="pg__main">
        <!-- 切换不做转场，直接换页；落墨转场只在 MInkTransition 自己的示例页里演示 -->
        <section :key="current.id" class="pg__page">
          <header class="pg__header">
            <h2 class="pg__title">{{ current.title }}</h2>
            <code class="pg__code">{{ current.name }}</code>
          </header>
          <div class="pg__panes" :class="`pg__panes--${pane}`">
            <section v-if="showVue" class="pg__pane">
              <p class="pg__pane-tag">Vue</p>
              <component :is="current.vue" />
            </section>
            <section v-if="showReact" class="pg__pane">
              <p class="pg__pane-tag">React</p>
              <ReactIsland v-if="current.react" :key="current.id" :component="current.react" />
              <p v-else class="pg__todo">这个组件还没搬到 React</p>
            </section>
          </div>
          <!-- 示例底下挂上构建时生成的属性 / 事件 / 插槽表（docs/api/<组件名>.json） -->
          <ApiDoc :name="current.name" />
        </section>
      </main>
    </div>
    <!-- 函数式的消息 / 确认框现在渲染在用户自己的树里，要有这个出口才弹得出来（MConfigProvider 自带一个） -->
    <MOverlayOutlet />
  </MRicePaper>
</template>

<style scoped>
/* 两边 demo 并排；窄屏自动叠成上下 */
.pg__panes {
  display: grid;
  gap: 20px;
  margin-bottom: 8px;
}
.pg__panes--both {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}
@media (max-width: 1100px) {
  .pg__panes--both {
    grid-template-columns: minmax(0, 1fr);
  }
}
.pg__pane {
  min-width: 0;
  padding: 12px 16px 4px;
  border: 1px solid var(--m-divider);
  border-radius: 2px;
}
.pg__pane-tag {
  margin: 0 0 8px;
  color: var(--m-fg-muted);
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.pg__todo {
  margin: 0;
  padding: 24px 0;
  color: var(--m-fg-muted);
  font-size: 13px;
}
.pg__progress {
  margin: -12px 8px 16px;
  color: var(--m-fg-muted);
  font-size: 11px;
  letter-spacing: 0.08em;
}

/* 整页定高、外层不滚，左右两栏各自竖向滚动；宣纸和远山留在底下当固定背景 */
.pg {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  height: 100vh;
}
.pg__aside {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 100vh;
  padding: 24px 16px;
  border-right: 1px solid var(--m-divider);
  overflow-y: auto;
  overscroll-behavior: contain;
}
.pg__logo {
  margin: 0 8px 20px;
  font-family: var(--m-font-brush);
  font-size: 24px;
  font-weight: 400;
  letter-spacing: 0.1em;
}
.pg__logo span {
  font-family: var(--m-font-sans);
  font-size: 12px;
  color: var(--m-fg-muted);
  letter-spacing: 0.2em;
  vertical-align: middle;
}
.pg__nav {
  flex: 1;
}
.pg__group {
  margin: 12px 8px 4px;
  font-size: 12px;
  color: var(--m-fg-muted);
  letter-spacing: 0.2em;
}
.pg__item {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  border-radius: var(--m-radius);
  cursor: var(--m-cursor-pointer);
  transition: background-color var(--m-duration) var(--m-ease);
}
.pg__item:hover {
  background: color-mix(in srgb, var(--m-ink) 6%, transparent);
}
/* 当前页：淡墨底 + 左侧一道朱砂，正文加重 */
.pg__item--active,
.pg__item--active:hover {
  background: color-mix(in srgb, var(--m-ink) 10%, transparent);
  box-shadow: inset 3px 0 0 var(--m-seal);
  color: var(--m-fg-strong);
  font-weight: 500;
}
.pg__item-name {
  font-size: 11px;
  color: var(--m-fg-muted);
  opacity: 0.7;
}
.pg__tools {
  display: flex;
  gap: 8px;
  padding-top: 16px;
}
.pg__main {
  box-sizing: border-box;
  height: 100vh;
  padding: 32px 40px;
  min-width: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.pg__page {
  max-width: 880px;
}
.pg__header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 24px;
}
.pg__title {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
}
.pg__code {
  font-size: 13px;
  color: var(--m-fg-muted);
}
</style>
