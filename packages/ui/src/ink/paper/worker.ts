// 宣纸 Worker 入口：直接复用 shuimo-core 的 worker（它在 import 时注册 self.onmessage）。
// 打包时把它连同 WASM 一起打进 dist/paper-worker.js，让 worker 文件自包含、没有裸包名 import。
import "@jobinjia/shuimo-core/xuan-paper/worker";
