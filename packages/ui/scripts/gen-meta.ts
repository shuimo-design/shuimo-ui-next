/**
 * 用 vue-component-meta 从 SFC 提取 props/emits/slots，产出：
 *  - web-types.json（IDE 提示）
 *  - ../../docs/api/<name>.json（文档 API 表）
 * 同时校验 src/nuxt/components.ts 的清单与实际导出一致。
 */
import { existsSync, globSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { createChecker } from "vue-component-meta";
import { COMPONENT_NAMES } from "../src/nuxt/components";

/**
 * 事件说明的兜底：vue-component-meta 拿不到事件的 JSDoc。
 * `defineEmits<XxxEmits>()` 里接口成员上的注释，到了 meta.events 里 description 永远是空串，
 * tags 也是空数组，getDeclarations() 指向 runtime-core.d.ts——事件在类型层被转成了函数重载，
 * 接口成员上的注释这一步就丢了（3.3.11 实测）。所以直接解析 SFC 同目录的 types.ts，
 * 找到 defineEmits 用的那个接口，把每个成员上方的 `/** … *\/` 按事件名对回去。
 */
function readEmitDocs(sfc: string): Map<string, string> {
  const docs = new Map<string, string>();
  const emitsName = /defineEmits<\s*(\w+)/.exec(readFileSync(sfc, "utf8"))?.[1];
  const typesFile = resolve(dirname(sfc), "types.ts");
  if (!emitsName || !existsSync(typesFile)) return docs;
  const file = ts.createSourceFile(
    typesFile,
    readFileSync(typesFile, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const decl = file.statements.find(
    (s): s is ts.InterfaceDeclaration => ts.isInterfaceDeclaration(s) && s.name.text === emitsName,
  );
  if (!decl) {
    console.warn(`${sfc}: defineEmits 用的 ${emitsName} 不在同目录的 types.ts 里，事件说明留空`);
    return docs;
  }
  for (const member of decl.members) {
    if (!ts.isPropertySignature(member)) continue;
    const key = member.name;
    if (!ts.isIdentifier(key) && !ts.isStringLiteral(key)) continue;
    const text = ts
      .getJSDocCommentsAndTags(member)
      .filter(ts.isJSDoc)
      .map((d) => ts.getTextOfJSDocComment(d.comment)?.trim())
      .find(Boolean);
    if (text) docs.set(key.text, text);
  }
  return docs;
}

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
  const emitDocs = readEmitDocs(sfc);
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
    events: meta.events.map((e) => ({
      name: e.name,
      description: e.description || emitDocs.get(e.name) || undefined,
    })),
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
