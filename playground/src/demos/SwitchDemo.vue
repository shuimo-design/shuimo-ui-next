<script setup lang="ts">
import { ref } from "vue";
import { MSwitch, type SwitchValue } from "@shuimo-design/ui";

const basic = ref(false);
const withText = ref(true);
const withSlot = ref(true);
const loading = ref(false);
const disabled = ref(false);
const changed = ref(false);
const lastChange = ref<SwitchValue>();
const controlled = ref(false);
const asked = ref<SwitchValue>();
const mode = ref<"day" | "night">("day");

function onControlledChange(next: SwitchValue) {
  // 受控：组件不自己改值，这里模拟"问过之后才切"
  asked.value = next;
  window.setTimeout(() => (controlled.value = next === true), 600);
}
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">普通开关</p>
      <div class="demo__row">
        <span>参数值为：{{ basic }}</span>
        <MSwitch v-model="basic" />
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">activeText / inactiveText</p>
      <div class="demo__row">
        <MSwitch v-model="withText" active-text="active" inactive-text="inactive" />
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">slot 覆盖文字</p>
      <div class="demo__row">
        <MSwitch v-model="withSlot" active-text="active" inactive-text="inactive">
          <template #active>
            <span>这里是 active slot</span>
          </template>
        </MSwitch>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">loading / disabled</p>
      <div class="demo__row">
        <MSwitch v-model="loading" loading />
        <MSwitch :model-value="true" loading />
        <MSwitch v-model="disabled" disabled />
        <MSwitch :model-value="true" disabled />
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">change 事件</p>
      <div class="demo__row">
        <MSwitch v-model="changed" inactive-text="bye" @change="lastChange = $event" />
        <span class="demo__hint">change → {{ lastChange ?? "（还没切过）" }}</span>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">controlled：只发 change，值由外部延迟 600ms 再改</p>
      <div class="demo__row">
        <span>参数值为：{{ controlled }}</span>
        <MSwitch v-model="controlled" controlled @change="onControlledChange" />
        <span class="demo__hint">想切到 → {{ asked ?? "—" }}</span>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">activeValue / inactiveValue：非布尔值</p>
      <div class="demo__row">
        <MSwitch
          v-model="mode"
          active-value="night"
          inactive-value="day"
          active-text="夜"
          inactive-text="昼"
        />
        <span class="demo__hint">mode = {{ mode }}</span>
      </div>
    </div>
  </div>
</template>
