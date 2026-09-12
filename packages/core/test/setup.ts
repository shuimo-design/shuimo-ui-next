/**
 * 浏览器里的测试要拿到真实样式。样式不再由各模块自己 import（那会让纯 Node 的
 * 服务端渲染崩掉，见 styles/index.css 的说明），所以这里统一引一次整份。
 */
import "../src/styles/index.css";
