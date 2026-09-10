export interface DarkModeProps {
  /** 禁用：不可点 */
  disabled?: boolean;
  /** 没有 v-model 也没有本地记录时，写 data-theme="system" 跟随系统深浅偏好。默认 false：库默认亮色纸，不替使用方决定 */
  autoMode?: boolean;
  /** 太极缓慢自转，默认 true */
  rotate?: boolean;
  /** 记住选择用的 localStorage 键，默认 "shuimo-theme"（值是 dark / light）；false 不记 */
  storageKey?: string | false;
  /** 切换时整页墨迹擦过（View Transitions），默认 true；不支持的浏览器直接切 */
  transition?: boolean;
}

export interface DarkModeEmits {
  /** 用户点击切换后，参数是切换后是否为深色 */
  change: [dark: boolean];
}
