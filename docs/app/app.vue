<script setup lang="ts">
const { data: page } = await useAsyncData("index", () => queryCollection("docs").path("/").first());
</script>

<template>
  <main style="padding: 24px">
    <ContentRenderer v-if="page" :value="page" />
    <MButton type="primary">文档站骨架</MButton>
  </main>
</template>
