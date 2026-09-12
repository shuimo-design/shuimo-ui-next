export { default as MSteps } from "./MSteps.vue";
export { default as MStep } from "./MStep.vue";
// 类型在 core，两个框架共用同一份；这里转出去，使用方不用再多装一个包
export type {
  StepProps,
  StepSlots,
  StepStatus,
  StepsDirection,
  StepsProps,
  StepsSlots,
} from "@shuimo-design/core";
