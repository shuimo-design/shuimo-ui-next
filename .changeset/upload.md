---
"@shuimo-design/core": minor
"@shuimo-design/vue": minor
"@shuimo-design/react": minor
---

新增 MUpload 上传。

- `v-model:fileList` / React `fileList` + `onFileListChange` + `defaultFileList`；每项是 `{ uid, name, size, type, status, percent, raw, response, error, url }`，uid 由壳层的 `useId` 前缀派生
- `action` / `method` / `headers` / `data` / `name` / `withCredentials` 走内置的 XMLHttpRequest（core 的 `upload/request.ts`），`customRequest` 整个换掉；不给地址也没自定义请求时只选文件，状态停在 `ready`
- `multiple` / `accept` / `directory` / `limit` / `maxSize` / `beforeUpload`（返回 false 跳过、返回 File 替换）/ `autoUpload`（关掉后 `submit()` 手动传）；`abort()` 中断、`clearFiles(status?)` 清空
- `drag` 拖拽区：`role="button"` + 回车 / 空格打开选择框，`dragenter / dragover / drop` 的判定在 core；水墨层是一张毛边纸，拖入时中心晕开一团淡墨
- 默认触发钮是 MButton，`tip` 插槽 / `renderTip` 由 `aria-describedby` 指向；文件列表借 MList 的骨架，传输中的行是 MProgress，`file` 插槽 / `renderFile` 自定义每一行；删除钮带 `aria-label`
- 事件：`change` / `progress` / `success` / `error` / `remove` / `exceed` / `preview`；列表变化会通知外层 MFormItem 校验
- React 的 MButton 多了 `aria-describedby` 透传
