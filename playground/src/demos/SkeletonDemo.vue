<script setup lang="ts">
import { ref } from "vue";
import { MButton, MSkeleton, MSkeletonItem, MSwitch } from "@shuimo-design/ui";

const loading = ref(true);
const animated = ref(true);

// 模拟一次 80ms 就回来的请求：throttle 300 时骨架根本来不及露面
const fastLoading = ref(false);
function reloadFast() {
  fastLoading.value = true;
  setTimeout(() => (fastLoading.value = false), 80);
}
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">默认：一行标题 + 三行段落，最后一行短一截</p>
      <MSkeleton />
    </div>

    <div class="demo__block">
      <p class="demo__caption">头像 / 行数 / 不要标题</p>
      <MSkeleton avatar :rows="4" />
      <MSkeleton :rows="2" :title="false" />
    </div>

    <div class="demo__block">
      <p class="demo__caption">animated：一道淡墨从左扫到右（减弱动效时自动停）</p>
      <div class="demo__row">
        <MSwitch v-model="animated" active-text="动" inactive-text="静" />
      </div>
      <MSkeleton avatar :animated="animated" />
    </div>

    <div class="demo__block">
      <p class="demo__caption">loading 切换：为 false 时渲染默认插槽里的真实内容</p>
      <div class="demo__row">
        <MSwitch v-model="loading" active-text="加载中" inactive-text="已加载" />
      </div>
      <MSkeleton :loading="loading" avatar animated>
        <div class="skeleton-demo__card">
          <h4 class="skeleton-demo__title">题西林壁</h4>
          <p class="skeleton-demo__text">横看成岭侧成峰，远近高低各不同。</p>
          <p class="skeleton-demo__text">不识庐山真面目，只缘身在此山中。</p>
        </div>
      </MSkeleton>
    </div>

    <div class="demo__block">
      <p class="demo__caption">template 插槽：用 MSkeletonItem 自己拼排布</p>
      <MSkeleton animated>
        <template #template>
          <div class="skeleton-demo__custom">
            <MSkeletonItem variant="image" />
            <MSkeletonItem variant="h1" />
            <MSkeletonItem variant="text" />
            <MSkeletonItem variant="text" />
            <div class="demo__row">
              <MSkeletonItem variant="button" />
              <MSkeletonItem variant="circle" />
            </div>
          </div>
        </template>
      </MSkeleton>
    </div>

    <div class="demo__block">
      <p class="demo__caption">
        throttle：loading 变 true 后等 300ms 才露出骨架；请求 80ms 就回来，所以不会闪一下
      </p>
      <div class="demo__row">
        <MButton :disabled="fastLoading" @click="reloadFast">重新请求（80ms）</MButton>
      </div>
      <MSkeleton :loading="fastLoading" :throttle="300" :rows="2">
        <p class="skeleton-demo__text">请求已完成，骨架没有闪过。</p>
      </MSkeleton>
    </div>
  </div>
</template>

<style scoped>
.skeleton-demo__card {
  display: grid;
  gap: 8px;
}
.skeleton-demo__title {
  margin: 0;
  font-size: 16px;
  color: var(--m-fg);
}
.skeleton-demo__text {
  margin: 0;
  color: var(--m-fg-muted);
}
.skeleton-demo__custom {
  display: grid;
  gap: 12px;
}
</style>
