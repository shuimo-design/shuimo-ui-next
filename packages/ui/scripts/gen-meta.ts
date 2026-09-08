/**
 * 用 vue-component-meta 从 SFC 提取 props/emits/slots，产出：
 *  - web-types.json（IDE 提示）
 *  - ../../docs/api/<name>.json（文档 API 表）
 * 同时校验 src/nuxt/components.ts 的清单与实际导出一致。
 */
import { globSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createChecker } from "vue-component-meta";
import { COMPONENT_NAMES } from "../src/nuxt/components";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, "..");
const pkg = JSON.parse(readFileSync(resolve(pkgRoot, "package.json"), "utf8")) as {
  name: string;
  version: string;
};

const checker = createChecker(resolve(pkgRoot, "tsconfig.json"), {
  forceUseTs: true,
  printer: { newLine: 1 },
});

const entry = resolve(pkgRoot, "src/components/index.ts");
const exported = checker.getExportNames(entry).filter((n) => /^M[A-Z]/.test(n));
// vue-component-meta 跟不进 `export *` 转出口，按 SFC 文件直接读
const sfcByName = new Map(
  globSync("src/components/*/M*.vue", { cwd: pkgRoot }).map((file) => [
    file.replace(/^.*\/(M[A-Za-z]+)\.vue$/, "$1"),
    resolve(pkgRoot, file),
  ]),
);

const missing = exported.filter((n) => !(COMPONENT_NAMES as readonly string[]).includes(n));
const stale = COMPONENT_NAMES.filter((n) => !exported.includes(n));
if (missing.length || stale.length) {
  console.error("src/nuxt/components.ts 与实际导出不一致", { missing, stale });
  process.exit(1);
}

interface WebTypeAttr {
  name: string;
  description?: string;
  default?: string;
  required?: boolean;
  value?: { kind: "expression"; type: string };
}
interface WebTypeElement {
  name: string;
  description?: string;
  source: { module: string; symbol: string };
  attributes: WebTypeAttr[];
  events: { name: string; description?: string }[];
  slots: { name: string; description?: string }[];
}

const elements: WebTypeElement[] = [];
const apiDir = resolve(pkgRoot, "../../docs/api");
mkdirSync(apiDir, { recursive: true });

for (const name of exported) {
  const sfc = sfcByName.get(name);
  if (!sfc) {
    console.error(`找不到 ${name} 对应的 SFC 文件`);
    process.exit(1);
  }
  const meta = checker.getComponentMeta(sfc, "default");
  const props = meta.props.filter((p) => !p.global);
  const element: WebTypeElement = {
    name,
    source: { module: pkg.name, symbol: name },
    attributes: props.map((p) => ({
      name: p.name,
      description: p.description || undefined,
      default: p.default,
      required: p.required,
      value: { kind: "expression", type: p.type },
    })),
    events: meta.events.map((e) => ({ name: e.name, description: e.description || undefined })),
    slots: meta.slots.map((s) => ({ name: s.name, description: s.description || undefined })),
  };
  elements.push(element);
  writeFileSync(resolve(apiDir, `${name}.json`), JSON.stringify(element, null, 2) + "\n");
}

const webTypes = {
  $schema: "https://raw.githubusercontent.com/JetBrains/web-types/master/schema/web-types.json",
  framework: "vue",
  name: pkg.name,
  version: pkg.version,
  contributions: { html: { "types-syntax": "typescript", tags: elements } },
};
writeFileSync(resolve(pkgRoot, "web-types.json"), JSON.stringify(webTypes, null, 2) + "\n");
console.log(`web-types: ${elements.length} components → web-types.json, docs/api/`);
