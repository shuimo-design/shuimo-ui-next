<script setup lang="ts">
import { MAvatar } from "@shuimo-design/ui";

const avatarSrc =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#eae4d1"/><circle cx="40" cy="32" r="14" fill="#1c1c1c"/><path d="M12 76c4-18 16-26 28-26s24 8 28 26z" fill="#1c1c1c"/></svg>',
  );
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">圆形（默认）：sm / md / lg</p>
      <div class="demo__row">
        <MAvatar :src="avatarSrc" alt="山人" size="sm" />
        <MAvatar :src="avatarSrc" alt="山人" />
        <MAvatar :src="avatarSrc" alt="山人" size="lg" />
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">方形</p>
      <div class="demo__row">
        <MAvatar :src="avatarSrc" alt="山人" size="sm" variant="square" />
        <MAvatar :src="avatarSrc" alt="山人" variant="square" />
        <MAvatar :src="avatarSrc" alt="山人" size="lg" variant="square" />
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">
        兜底：无图显示插槽文字，插槽也没有就是人形图标；图片加载失败同样回退
      </p>
      <div class="demo__row">
        <MAvatar alt="无图">墨</MAvatar>
        <MAvatar alt="无图" variant="square">山</MAvatar>
        <MAvatar alt="默认图标" />
        <MAvatar alt="默认图标" variant="square" />
        <MAvatar src="/not-exist.png" alt="坏图">坏</MAvatar>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">任意像素尺寸；seed 不同，墨圈和飞溅也不同</p>
      <div class="demo__row">
        <MAvatar :size="72" :seed="2" alt="大">72</MAvatar>
        <MAvatar :size="72" :seed="3" :src="avatarSrc" alt="山人" />
        <MAvatar :size="96" :seed="4" :src="avatarSrc" alt="山人" variant="square" />
      </div>
    </div>
  </div>
</template>
