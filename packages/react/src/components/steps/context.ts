import { createContext } from "react";
import {
  STEP_INDEX_DEFAULT,
  type StepIndexContextValue,
  type StepsContextValue,
} from "@shuimo-design/core";

/**
 * 上下文的形状（字段都是纯值）在 core，这里只管 React 这一侧的容器。
 *
 * 整组配置默认 undefined：不在 MSteps 里时要能认出来（单独一步永远是"等待"）。
 * 位置默认就是 core 的 STEP_INDEX_DEFAULT：自己是唯一的一步，序号 0、也没有连接线。
 */
export const StepsContext = createContext<StepsContextValue | undefined>(undefined);
export const StepIndexContext = createContext<StepIndexContextValue>(STEP_INDEX_DEFAULT);
