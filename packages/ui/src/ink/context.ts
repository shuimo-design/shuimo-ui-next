import type { InjectionKey } from "vue";

/** 测试 / 特殊打包环境注入自定义 Worker 工厂；默认从 dist 同目录加载 *.worker.js */
export interface InkWorkerFactories {
  paper?: () => Worker;
  landscape?: () => Worker;
}

export const inkWorkersKey: InjectionKey<InkWorkerFactories> = Symbol("m-ink-workers");
