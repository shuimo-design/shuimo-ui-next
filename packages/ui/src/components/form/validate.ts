/** 规则执行器：纯函数，不依赖 Vue，MFormItem 拿过滤好的规则来跑 */
import type { FormModel, FormRule, FormTrigger } from "./types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/** 按 "a.b.c" 取值；中途遇到非对象就返回 undefined */
export function getByPath(model: FormModel | undefined, path: string): unknown {
  if (!model) return undefined;
  let current: unknown = model;
  for (const key of path.split(".")) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

/** 按 "a.b.c" 写值；中间层不存在就补空对象 */
export function setByPath(model: FormModel | undefined, path: string, value: unknown): void {
  if (!model) return;
  const keys = path.split(".");
  const last = keys.pop();
  if (last === undefined) return;
  let current: Record<string, unknown> = model;
  for (const key of keys) {
    const next = current[key];
    if (next === null || typeof next !== "object") {
      const created: Record<string, unknown> = {};
      current[key] = created;
      current = created;
    } else {
      current = next as Record<string, unknown>;
    }
  }
  current[last] = value;
}

/** 重置时留一份初值副本：数组和普通对象浅拷贝一层，够挡住 v-model 原地改动 */
export function cloneValue<T>(value: T): T {
  if (Array.isArray(value)) return [...value] as T;
  if (
    value !== null &&
    typeof value === "object" &&
    Object.getPrototypeOf(value) === Object.prototype
  )
    return { ...value };
  return value;
}

export function normalizeRules(rules: FormRule | FormRule[] | undefined): FormRule[] {
  if (!rules) return [];
  return Array.isArray(rules) ? rules : [rules];
}

/** 没写 trigger 的规则任何时机都跑 */
export function rulesForTrigger(rules: FormRule[], trigger: FormTrigger | undefined): FormRule[] {
  if (!trigger) return rules;
  return rules.filter((rule) => {
    if (!rule.trigger) return true;
    return Array.isArray(rule.trigger) ? rule.trigger.includes(trigger) : rule.trigger === trigger;
  });
}

function typeMatches(type: FormRule["type"], value: unknown): boolean {
  switch (type) {
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number" && !Number.isNaN(value);
    case "boolean":
      return typeof value === "boolean";
    case "array":
      return Array.isArray(value);
    case "email":
      return typeof value === "string" && EMAIL_RE.test(value);
    case "url":
      if (typeof value !== "string") return false;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    default:
      return true;
  }
}

/** 长度类规则：字符串 / 数组按长度，数字按大小 */
function measure(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string" || Array.isArray(value)) return value.length;
  return undefined;
}

const TYPE_MESSAGES: Record<NonNullable<FormRule["type"]>, string> = {
  string: "请输入文字",
  number: "请输入数字",
  boolean: "请选择",
  array: "请选择",
  email: "邮箱格式不对",
  url: "链接格式不对",
};

/** 单条规则；返回错误文案，undefined 表示通过 */
export async function runRule(
  rule: FormRule,
  value: unknown,
  model: FormModel,
): Promise<string | undefined> {
  const empty = isEmptyValue(value);
  if (rule.required && empty) return rule.message ?? "此项必填";
  // 非必填且没填：内置检查都跳过，但自定义 validator 仍然要跑（由它自己决定空值算不算过）
  if (!empty) {
    if (rule.type && !typeMatches(rule.type, value))
      return rule.message ?? TYPE_MESSAGES[rule.type];
    const size = measure(value);
    if (size !== undefined) {
      const isNumber = typeof value === "number";
      if (rule.len !== undefined && size !== rule.len)
        return rule.message ?? (isNumber ? `须等于 ${rule.len}` : `长度须为 ${rule.len}`);
      if (rule.min !== undefined && size < rule.min)
        return rule.message ?? (isNumber ? `不能小于 ${rule.min}` : `至少 ${rule.min} 个字符`);
      if (rule.max !== undefined && size > rule.max)
        return rule.message ?? (isNumber ? `不能大于 ${rule.max}` : `最多 ${rule.max} 个字符`);
    }
    if (rule.pattern && !rule.pattern.test(String(value))) return rule.message ?? "格式不对";
  }
  if (rule.validator) {
    const result = await rule.validator(rule, value, model);
    if (result === false) return rule.message ?? "校验未通过";
    if (typeof result === "string") return result;
  }
  return undefined;
}

/** 顺序跑一组规则，第一条不过就停 */
export async function runRules(
  rules: FormRule[],
  value: unknown,
  model: FormModel,
): Promise<string | undefined> {
  for (const rule of rules) {
    const message = await runRule(rule, value, model);
    if (message !== undefined) return message;
  }
  return undefined;
}
