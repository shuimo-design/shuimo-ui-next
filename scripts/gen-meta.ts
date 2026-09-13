/**
 * 组件 API 元数据生成器：从 core 的类型定义里读出 Props / Emits / Slots，产出
 *  - docs/api/<组件名>.json（两版文档站的 API 表，playground/src/shared/api.ts 直接消费）
 *  - packages/vue/web-types.json（JetBrains 系 IDE 的模板提示，只有 Vue 有这个协议）
 *
 * 为什么重写：以前这个脚本在 packages/ui 里，用 vue-component-meta 去解析 .vue 文件，
 * 拿到的只是"Vue 这一边长什么样"。现在类型定义搬到了 packages/core/src/components/<name>/types.ts，
 * Vue 壳和 React 壳共用同一份，文档理应从这份共用的类型生成 —— 否则 React 用户看到的
 * 会是一份写着 v-model 和插槽的文档。所以这里改用 TypeScript 编译器 API 直接读类型：
 * createProgram 建一个程序，用 TypeChecker 把每个 <Name>Props 接口的成员（含 extends 继承来的）
 * 连同 JSDoc 一起取出来，类型文字由 checker.typeToString 打印。
 *
 * 三样东西类型里没有、只能回到壳里读：
 *  1. 默认值 —— 写在 Vue SFC 的 `const { a = 1 } = defineProps<X>()` 解构里；
 *  2. v-model 属性 —— `defineModel()` 产出的属性和 `update:x` 事件，类型里根本没有它；
 *  3. React 侧的对应叫法 —— 双向绑定在 React 是 `x` / `defaultX` / `onXChange` 三件套。
 * 这三样都按"读实际代码"来，读不到就不写，绝不猜（React 壳还在迁移，缺的组件很正常）。
 */
import { execFileSync } from "node:child_process";
import { existsSync, globSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { COMPONENT_NAMES } from "../packages/vue/src/nuxt/components";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const VUE_MODULE = "@shuimo-design/vue";
const REACT_MODULE = "@shuimo-design/react";

/* ── 输出结构（字段名沿用 web-types 的口径，playground/src/shared/api.ts 按这些字段取数） ── */

/** 某个属性 / 事件 / 插槽在 React 壳里的叫法；extra 是双向绑定多出来的那两个 */
interface ReactBinding {
  name: string;
  extra?: string[];
}
interface ApiAttribute {
  name: string;
  description?: string;
  default?: string;
  required?: boolean;
  value?: { kind: "expression"; type: string };
  react?: ReactBinding;
}
interface ApiNamed {
  name: string;
  description?: string;
  react?: ReactBinding;
}
/** 一个组件在两个框架里的出处；React 壳没迁完的组件只有 vue 一项 */
interface ApiSource {
  vue: { module: string; symbol: string };
  react?: { module: string; symbol: string };
}
interface ApiDoc {
  name: string;
  description?: string;
  source: ApiSource;
  attributes: ApiAttribute[];
  events: ApiNamed[];
  slots: ApiNamed[];
}

/* ── 建程序：一个 Program 同时装下 core 的类型、vue 残留的类型、react 的壳 ── */

const coreTypeFiles = globSync("packages/core/src/components/*/types.ts", { cwd: root });
/** 还没搬进 core、暂时留在 Vue 包里的类型；迁移做完这一条 glob 就该是空的 */
const vueTypeFiles = globSync("packages/vue/src/components/*/types.ts", { cwd: root });
const reactFiles = globSync("packages/react/src/components/*/M*.tsx", { cwd: root }).filter(
  (f) => !f.endsWith(".test.tsx"),
);

const base = ts.parseJsonConfigFileContent(
  JSON.parse(readFileSync(resolve(root, "tsconfig.base.json"), "utf8")) as { compilerOptions: {} },
  ts.sys,
  root,
);
const program = ts.createProgram({
  // 类型文件和 tsx 一起进，React 壳的 props 类型才能用同一个 checker 解析
  rootNames: [...coreTypeFiles, ...vueTypeFiles, ...reactFiles].map((f) => resolve(root, f)),
  options: { ...base.options, jsx: ts.JsxEmit.ReactJSX, noEmit: true, types: [] },
});
const checker = program.getTypeChecker();

/**
 * 类型名 → 声明。core 的优先，vue 里的只作为"还没搬"的兜底，
 * 这样同名类型在搬家过程中两边都存在时也不会取错。
 */
type TypeDecl = ts.InterfaceDeclaration | ts.TypeAliasDeclaration;
const declsByName = new Map<string, { decl: TypeDecl; pkg: "core" | "vue" }>();
for (const [files, pkg] of [
  [vueTypeFiles, "vue"],
  [coreTypeFiles, "core"],
] as const) {
  for (const file of files) {
    const source = program.getSourceFile(resolve(root, file));
    if (!source) continue;
    for (const statement of source.statements) {
      if (!ts.isInterfaceDeclaration(statement) && !ts.isTypeAliasDeclaration(statement)) continue;
      declsByName.set(statement.name.text, { decl: statement, pkg });
    }
  }
}

/** 取一段声明上的 JSDoc 正文（不含 @tag），没有就返回 undefined */
function docOf(symbol: ts.Symbol): string | undefined {
  const text = ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim();
  return text || undefined;
}

/** 展开一个接口的全部成员：自身的在前，extends 继承来的在后，顺序跟着声明走 */
function membersOf(name: string): ts.Symbol[] {
  const found = declsByName.get(name);
  if (!found) return [];
  return checker.getPropertiesOfType(checker.getTypeAtLocation(found.decl));
}

/**
 * 泛型接口的类型参数在文档里怎么显示：按默认值，没有默认值就按约束。
 * `SwitchProps<T extends SwitchValue = SwitchValue>` 的 `activeValue?: T` 应显示成
 * `SwitchValue | undefined`，读者不需要知道 T —— T 只是让壳层能把 v-model 推窄的手段
 */
function typeParamDisplay(params: readonly ts.TypeParameterDeclaration[] | undefined) {
  const map = new Map<string, string>();
  for (const param of params ?? []) {
    const shown = param.default ?? param.constraint;
    if (shown) map.set(param.name.text, shown.getText());
  }
  return map;
}

/** 把类型文字里的类型参数名换成显示用的文字；只替换整词，`T` 不会碰到 `TabName` */
function substituteTypeParams(text: string, params: Map<string, string>): string {
  let out = text;
  for (const [name, shown] of params) {
    out = out.replace(new RegExp(`(?<![\\w$])${name}(?![\\w$])`, "g"), shown);
  }
  return out;
}

/** 打印某个成员的类型文字；可选成员会自带 ` | undefined`，跟旧脚本一致 */
function typeTextOf(symbol: ts.Symbol): string {
  const at = symbol.valueDeclaration ?? symbol.declarations?.[0];
  if (!at) return "unknown";
  const text = checker.typeToString(
    checker.getTypeOfSymbolAtLocation(symbol, at),
    at,
    ts.TypeFormatFlags.NoTruncation,
  );
  // 成员的父节点就是声明它的接口（继承来的成员，父节点是被继承的那个接口），类型参数从那里拿
  const owner = at.parent;
  const params = ts.isInterfaceDeclaration(owner) ? owner.typeParameters : undefined;
  return substituteTypeParams(text, typeParamDisplay(params));
}

/**
 * 扫出来的默认值跟属性类型对不对得上。
 * core 里 `??` 有时并不是在补默认值，而是在拼字符串：`${o.itemHeight ?? ""}` 是在攒缓存 key，
 * 可 itemHeight 是个数字，把 `""` 当成它的默认值就错了。类型对不上的一律不要。
 */
function defaultFits(symbol: ts.Symbol, text: string): boolean {
  const at = symbol.valueDeclaration ?? symbol.declarations?.[0];
  if (!at) return false;
  const type = checker.getTypeOfSymbolAtLocation(symbol, at);
  const parts = type.isUnion() ? type.types : [type];
  const accepts = (flags: ts.TypeFlags) => parts.some((part) => part.flags & flags);
  if (/^["'`]/.test(text)) return accepts(ts.TypeFlags.StringLike);
  if (/^-?[\d.]/.test(text)) return accepts(ts.TypeFlags.NumberLike);
  if (text === "true" || text === "false") return accepts(ts.TypeFlags.BooleanLike);
  return true;
}

/* ── 默认值 ── */

/** 读一个文件里顶层的 `const NAME = <字面量>`，非字面量的（函数、计算式）不收 */
function topLevelConstants(source: ts.SourceFile): Map<string, string> {
  const found = new Map<string, string>();
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      const init = declaration.initializer;
      if (!init || !ts.isIdentifier(declaration.name)) continue;
      const literal =
        ts.isStringLiteralLike(init) ||
        ts.isNumericLiteral(init) ||
        init.kind === ts.SyntaxKind.TrueKeyword ||
        init.kind === ts.SyntaxKind.FalseKeyword ||
        ts.isArrayLiteralExpression(init) ||
        ts.isPrefixUnaryExpression(init);
      if (literal) found.set(declaration.name.text, init.getText(source));
    }
  }
  return found;
}

const coreSources = new Map(
  globSync("packages/core/src/**/*.ts", { cwd: root }).map((file) => [
    file,
    ts.createSourceFile(
      file,
      readFileSync(resolve(root, file), "utf8"),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    ),
  ]),
);

/**
 * 跨文件的具名常量 → 字面量原文。
 *
 * 默认值经常不是字面量而是一个常量（`placeholder = SELECT_PLACEHOLDER`），
 * 文档里印一个常量名对读者没有任何用，得换回真正的值。同名不同值的（`SEED` 在
 * border 里是 1、在 table 里是 11）在这张全局表里直接作废，只能靠文件内的那张表认。
 */
const constants = new Map<string, string | null>();
for (const source of coreSources.values()) {
  for (const [name, text] of topLevelConstants(source)) {
    const seen = constants.get(name);
    constants.set(name, seen === undefined || seen === text ? text : null);
  }
}

/**
 * 默认值的展示文字：常量换成它的值，`undefined` 当作"没有默认值"（印出来只是噪音）。
 * 返回 undefined 表示这一格不显示。
 */
function displayDefault(text: string | undefined): string | undefined {
  // unboundModel（packages/vue/src/internal/model.ts）运行时就是 undefined，只是给泛型 v-model 用的类型手段
  if (!text || text === "undefined" || text === "unboundModel") return undefined;
  return /^[A-Za-z_$][\w$]*$/.test(text) ? (constants.get(text) ?? text) : text;
}

/**
 * core 里登记的默认值。
 *
 * 组件抽到 core 之后，很多默认值不再写在壳的 `defineProps` 解构上，而是归一化在 core 的
 * 函数里（`const { max = 99, dot = false } = props`）—— 两个壳共用一份，壳上就看不见了。
 * 所以这里扫一遍该组件在 core 里的实现文件，把"从一个对象上解构下来、带默认值、名字又确实是
 * 这个组件的属性"的那些收回来。同一个属性在不同函数里默认值不一致的，说明代码本身有歧义，
 * 宁可不显示也不显示一个可能是错的值。
 */
function readCoreDefaults(dir: string, propNames: Set<string>): Map<string, string> {
  const found = new Map<string, string | null>();
  for (const [file, source] of coreSources) {
    if (dirname(file) !== `packages/core/src/components/${dir}` || basename(file) === "types.ts") {
      continue;
    }
    // 文件自己的常量优先：`const SEED = 1` 在 border 和 table 里各是一个值，只有本文件那份算数
    const local = topLevelConstants(source);
    const record = (key: string, value: ts.Expression) => {
      if (!propNames.has(key)) return;
      const raw = value.getText(source);
      const text = (ts.isIdentifier(value) ? local.get(raw) : undefined) ?? raw;
      const seen = found.get(key);
      found.set(key, seen === undefined || seen === text ? text : null);
    };
    /** 只认字面量和常量名当默认值：`x.closable ?? Boolean(o.closable)` 那种是逻辑，不是默认值 */
    const isValue = (node: ts.Expression): boolean =>
      ts.isStringLiteralLike(node) ||
      ts.isNumericLiteral(node) ||
      ts.isArrayLiteralExpression(node) ||
      node.kind === ts.SyntaxKind.TrueKeyword ||
      node.kind === ts.SyntaxKind.FalseKeyword ||
      (ts.isIdentifier(node) &&
        (local.has(node.text) || typeof constants.get(node.text) === "string"));

    const visit = (node: ts.Node): void => {
      // 形式一：`const { max = 99 } = props`
      if (
        ts.isVariableDeclaration(node) &&
        ts.isObjectBindingPattern(node.name) &&
        node.initializer &&
        ts.isIdentifier(node.initializer)
      ) {
        for (const element of node.name.elements) {
          const key = element.propertyName ?? element.name;
          if (element.initializer && ts.isIdentifier(key)) record(key.text, element.initializer);
        }
      }
      // 形式二：`props.seed ?? SEED`
      if (
        ts.isBinaryExpression(node) &&
        node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken &&
        ts.isPropertyAccessExpression(node.left) &&
        isValue(node.right)
      ) {
        record(node.left.name.text, node.right);
      }
      ts.forEachChild(node, visit);
    };
    ts.forEachChild(source, visit);
  }
  return new Map([...found].filter((entry): entry is [string, string] => entry[1] !== null));
}

/** 一次 `defineModel()` 调用，对应文档里的一行 v-model */
interface ModelEntry {
  /** 属性名：具名 model 是它自己的名字，无名的就是 modelValue */
  name: string;
  /** 泛型参数的原文，例如 `SwitchValue`；没写泛型就留空 */
  type?: string;
  default?: string;
  required: boolean;
  description?: string;
}

/**
 * Vue 的默认值写在 `defineProps` 解构里（`const { a = 1 } = defineProps<X>()`），
 * 是编译期宏，类型层面看不见，只能按语法读 SFC 的 `<script setup>` 块。
 */
function readSfc(file: string): { defaults: Map<string, string>; models: ModelEntry[] } {
  const defaults = new Map<string, string>();
  const models: ModelEntry[] = [];
  const block = /<script\b[^>]*\bsetup\b[^>]*>([\s\S]*?)<\/script>/.exec(
    readFileSync(file, "utf8"),
  );
  if (!block) return { defaults, models };
  // 泛型 SFC：`<script setup generic="T extends SwitchValue = boolean">`。
  // 文档里的 v-model 类型按 T 的约束显示（不是默认值：默认值是"用户不传时"的推导结果，
  // 约束才是"这个属性接受什么"）
  const generic = /\bgeneric\s*=\s*"([^"]*)"/.exec(block[0])?.[1];
  const genericParams = new Map<string, string>();
  for (const raw of generic?.split(",") ?? []) {
    const m = /^\s*(\w+)(?:\s+extends\s+(.+?))?(?:\s*=\s*(.+?))?\s*$/.exec(raw);
    if (m?.[1] && (m[2] ?? m[3])) genericParams.set(m[1], (m[2] ?? m[3])!.trim());
  }
  /** 默认值上的类型断言（`true as T`）只是给泛型看的，文档里去掉 */
  const stripAssertion = (node: ts.Expression): ts.Expression =>
    ts.isAsExpression(node) || ts.isTypeAssertionExpression(node)
      ? stripAssertion(node.expression)
      : node;
  const source = ts.createSourceFile(
    `${file}.ts`,
    block[1]!,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  /** 工厂函数形式的默认值（数组 / 对象必须包一层函数）在文档里只显示里面那个字面量 */
  const literalOf = (node: ts.Expression): string => {
    if (ts.isArrowFunction(node) && node.parameters.length === 0) {
      const body = ts.isBlock(node.body) ? undefined : stripAssertion(node.body);
      if (body && (ts.isArrayLiteralExpression(body) || ts.isObjectLiteralExpression(body))) {
        return body.getText(source);
      }
      if (
        body &&
        ts.isParenthesizedExpression(body) &&
        ts.isObjectLiteralExpression(body.expression)
      ) {
        return body.expression.getText(source);
      }
      // 泛型 model 的默认值只能写成函数（`() => false as T`），文档里显示里面那个字面量
      if (
        body &&
        (ts.isLiteralExpression(body) ||
          body.kind === ts.SyntaxKind.TrueKeyword ||
          body.kind === ts.SyntaxKind.FalseKeyword)
      ) {
        return body.getText(source);
      }
    }
    return stripAssertion(node).getText(source);
  };

  const calleeName = (node: ts.Expression): string | undefined =>
    ts.isCallExpression(node) && ts.isIdentifier(node.expression)
      ? node.expression.text
      : undefined;

  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      const init = declaration.initializer;
      if (!init) continue;
      const callee = calleeName(init);

      // 形式一：`const { a = 1 } = defineProps<X>()`，默认值在解构模式上
      if (callee === "defineProps" && ts.isObjectBindingPattern(declaration.name)) {
        for (const element of declaration.name.elements) {
          if (element.initializer && ts.isIdentifier(element.propertyName ?? element.name)) {
            const key = (element.propertyName ?? element.name) as ts.Identifier;
            defaults.set(key.text, stripAssertion(element.initializer).getText(source));
          }
        }
      }

      // 形式二：`withDefaults(defineProps<X>(), { a: 1 })`
      if (callee === "withDefaults" && ts.isCallExpression(init)) {
        const options = init.arguments[1];
        if (options && ts.isObjectLiteralExpression(options)) {
          for (const property of options.properties) {
            if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name)) continue;
            defaults.set(property.name.text, literalOf(property.initializer));
          }
        }
      }

      // 形式三：`defineModel<T>("name", { default: x })`
      if (callee === "defineModel" && ts.isCallExpression(init)) {
        const [first, second] = init.arguments;
        const named = first && ts.isStringLiteralLike(first) ? first.text : undefined;
        const options = [first, second].find(
          (a): a is ts.ObjectLiteralExpression => !!a && ts.isObjectLiteralExpression(a),
        );
        const typeArg = init.typeArguments?.[0]?.getText(source);
        const entry: ModelEntry = {
          name: named ?? "modelValue",
          type: typeArg && substituteTypeParams(typeArg, genericParams),
          required: false,
        };
        for (const property of options?.properties ?? []) {
          if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name)) continue;
          if (property.name.text === "default") entry.default = literalOf(property.initializer);
          if (property.name.text === "required")
            entry.required = property.initializer.kind === ts.SyntaxKind.TrueKeyword;
        }
        const doc = ts
          .getJSDocCommentsAndTags(statement)
          .filter(ts.isJSDoc)
          .map((d) => ts.getTextOfJSDocComment(d.comment)?.trim())
          .find(Boolean);
        entry.description = doc || undefined;
        models.push(entry);
      }
    }
  }
  return { defaults, models };
}

/**
 * 把 v-model 的类型文字解析成展开后的样子。
 * 泛型 SFC 的 model 写的是 `SelectModel<V, Multiple>` 这种别名，类型参数换成默认值后是
 * `SelectModel<SelectValue, boolean>`——读者要的是它展开后的 `SelectValue[] | SelectValue | undefined`。
 * 展开只能交给 TypeScript：把所有 model 类型放进一个虚拟文件、和 core 的类型一起建一个程序，
 * 让 checker 去算。只处理带尖括号的（泛型实例化）；`RadioValue` 这种普通别名原样保留，
 * 读者认得它。打印用 InTypeAlias：只剥最外层别名，里面的 SelectValue 这些名字留着。
 */
const MODEL_TYPE_FILE = resolve(root, "scripts/__model-types.ts");
function expandModelTypes(texts: readonly string[]): Map<string, string> {
  const out = new Map<string, string>();
  const unique = [...new Set(texts.filter((t) => t.includes("<")))];
  if (!unique.length) return out;
  // 每个 core 类型文件各 import 一次，它们的名字全都在 declsByName 里
  const byFile = new Map<string, string[]>();
  for (const [name, { decl, pkg }] of declsByName) {
    if (pkg !== "core") continue;
    const file = decl.getSourceFile().fileName;
    byFile.set(file, [...(byFile.get(file) ?? []), name]);
  }
  const imports = [...byFile]
    .map(([file, names]) => `import type { ${names.join(", ")} } from "${file}";`)
    .join("\n");
  const aliases = unique.map((t, i) => `type __M${i} = ${t};`).join("\n");
  const text = `${imports}\n${aliases}\n`;

  const host = ts.createCompilerHost(program.getCompilerOptions());
  const readFile = host.readFile.bind(host);
  const fileExists = host.fileExists.bind(host);
  host.readFile = (f) => (f === MODEL_TYPE_FILE ? text : readFile(f));
  host.fileExists = (f) => f === MODEL_TYPE_FILE || fileExists(f);
  const probe = ts.createProgram({
    rootNames: [MODEL_TYPE_FILE],
    options: program.getCompilerOptions(),
    host,
  });
  const probeChecker = probe.getTypeChecker();
  const source = probe.getSourceFile(MODEL_TYPE_FILE)!;
  for (const statement of source.statements) {
    if (!ts.isTypeAliasDeclaration(statement) || !statement.name.text.startsWith("__M")) continue;
    const index = Number(statement.name.text.slice(3));
    const type = probeChecker.getTypeAtLocation(statement.name);
    out.set(
      unique[index]!,
      probeChecker.typeToString(
        type,
        statement,
        ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.InTypeAlias,
      ),
    );
  }
  return out;
}

/** v-model 属性在文档里的类型：可选属性都带 ` | undefined`，泛型里已经有的不重复加 */
function modelType(entry: ModelEntry, expanded: Map<string, string>): string {
  const raw = entry.type?.trim();
  const text = raw && (expanded.get(raw) ?? raw);
  if (!text) return "unknown";
  if (entry.required) return text;
  return /(^|\|)\s*undefined\s*(\||$)/.test(text) ? text : `${text} | undefined`;
}

/* ── React 壳：拿到 props 类型里实际有哪些字段 ── */

const capitalize = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);

/**
 * React 壳的 props 名单。优先从导出的组件函数的第一个参数取（它才是真正生效的那份），
 * 取不到再退回同名的 `M<Name>Props` 接口。
 */
function readReactProps(file: string, component: string): Set<string> | undefined {
  const source = program.getSourceFile(resolve(root, file));
  if (!source) return undefined;
  const moduleSymbol = checker.getSymbolAtLocation(source);
  if (!moduleSymbol) return undefined;

  const collect = (type: ts.Type): Set<string> =>
    new Set(checker.getPropertiesOfType(type).map((p) => p.name));

  for (const exported of checker.getExportsOfModule(moduleSymbol)) {
    if (exported.name !== component) continue;
    const at = exported.valueDeclaration ?? exported.declarations?.[0];
    if (!at) continue;
    const signatures = checker.getTypeOfSymbolAtLocation(exported, at).getCallSignatures();
    const parameter = signatures[0]?.parameters[0];
    const parameterAt = parameter?.valueDeclaration ?? parameter?.declarations?.[0];
    if (parameter && parameterAt) {
      return collect(checker.getTypeOfSymbolAtLocation(parameter, parameterAt));
    }
  }
  const fallback = declsByName.get(`${component}Props`);
  return fallback ? collect(checker.getTypeAtLocation(fallback.decl)) : undefined;
}

/**
 * 找出 React 壳里那个"受控三件套"的语义名：同时存在 `x`、`defaultX`、`onXChange` 的那个 x。
 * Vue 的无名 v-model（属性叫 modelValue）在 React 侧没有统一叫法 —— 弹窗是 open、
 * 勾选是 checked、输入是 value —— 只能反过来从壳里认。认不出唯一的一个就不写。
 */
function detectControlled(props: Set<string>, taken: Set<string>): string | undefined {
  const found = [...props].filter(
    (name) =>
      !taken.has(name) &&
      props.has(`default${capitalize(name)}`) &&
      props.has(`on${capitalize(name)}Change`),
  );
  return found.length === 1 ? found[0] : undefined;
}

/* ── 清单一致性：core 有类型、vue 有实现、react 有实现 ── */

/** 组件名 → 目录名，目录名从 Vue 壳的文件位置推出来（MCell 在 grid/、MTabPane 在 tabs/） */
const dirByName = new Map<string, string>();
const sfcByName = new Map<string, string>();
for (const file of globSync("packages/vue/src/components/*/M*.vue", { cwd: root })) {
  const name = basename(file, ".vue");
  sfcByName.set(name, resolve(root, file));
  dirByName.set(name, basename(dirname(file)));
}
/** 登记在册的组件名，用来判断"壳里有、清单里没有" */
const known = new Set<string>(COMPONENT_NAMES);

let failed = false;
const fail = (message: string) => {
  console.error(`✗ ${message}`);
  failed = true;
};

const exportedFromVue = readFileSync(resolve(root, "packages/vue/src/components/index.ts"), "utf8");
const exportedFromReact = readFileSync(resolve(root, "packages/react/src/index.ts"), "utf8");

/**
 * 这个组件对外露出来了没有。两道门都得过：包的总出口要转出它所在的目录，
 * 目录自己的 index.ts 要导出这个名字。只满足后一条的是"写完了还没接上总出口"
 * （迁移中的常态），只满足前一条的是内部件（message 目录里的 MMessageList）。
 */
const isPublic = (pkg: "vue" | "react", dir: string, name: string): boolean => {
  const barrel = pkg === "vue" ? exportedFromVue : exportedFromReact;
  const path = pkg === "vue" ? `"./${dir}"` : `"./components/${dir}"`;
  const index = resolve(root, `packages/${pkg}/src/components/${dir}/index.ts`);
  return (
    barrel.includes(path) &&
    existsSync(index) &&
    new RegExp(`\\b${name}\\b`).test(readFileSync(index, "utf8"))
  );
};

// 正向：清单里的每个组件，core 要有类型、vue 要有实现
for (const name of COMPONENT_NAMES) {
  if (!sfcByName.has(name)) fail(`${name} 在 COMPONENT_NAMES 里，但 Vue 壳里没有对应的 SFC`);
  const dir = dirByName.get(name);
  if (dir && !exportedFromVue.includes(`"./${dir}"`)) {
    fail(`${name} 所在的 ${dir}/ 没有出现在 packages/vue/src/components/index.ts 里`);
  }
  if (!declsByName.has(`${name.slice(1)}Props`)) {
    fail(`${name} 找不到 ${name.slice(1)}Props 类型定义，文档没法生成`);
  }
}

/**
 * 反向：壳里对外导出了、清单里却没有的组件。
 *
 * 有 `<Name>Props` 的算真组件，漏登记就是 bug —— 它有一份该给用户看的 API，却不会生成文档；
 * 没有 Props 的（MMessageList、MOverlayOutlet 这种渲染出口）本来就不是拿来单独用的，
 * 导出只是给自定义场景留的口子，报一句进度就行。
 */
const unregistered: string[] = [];
const checkUnregistered = (pkg: "vue" | "react", dir: string, name: string) => {
  if (known.has(name) || !isPublic(pkg, dir, name)) return;
  if (declsByName.has(`${name.slice(1)}Props`)) {
    fail(`${name} 已经从 ${pkg} 壳导出、也有 ${name.slice(1)}Props，却没登记进 COMPONENT_NAMES`);
  } else if (!unregistered.includes(name)) {
    unregistered.push(name);
  }
};
for (const [name, dir] of dirByName) checkUnregistered("vue", dir, name);
for (const file of reactFiles) {
  checkUnregistered("react", basename(dirname(file)), basename(file, ".tsx"));
}

/** 类型还没搬进 core 的组件：不算失败，是迁移进度 */
const typesStillInVue: string[] = [];
/** React 壳还没有的组件：不算失败，是迁移进度 */
const reactPending: string[] = [];
/** 没写 JSDoc 的条目：文档表里那一格是空的，属于要补的债 */
const undocumented = new Map<string, string[]>();

if (failed) process.exit(1);

/* ── 逐个组件生成 ── */

const docs: ApiDoc[] = [];
const apiDir = resolve(root, "docs/api");
mkdirSync(apiDir, { recursive: true });

/** 组件 → 它的属性名，用来判断同目录的两个组件有没有同名属性 */
const propNamesByComponent = new Map(
  COMPONENT_NAMES.map(
    (name) => [name, new Set(membersOf(`${name.slice(1)}Props`).map((m) => m.name))] as const,
  ),
);

// 先把所有 SFC 读完，v-model 的类型文字攒到一起，只建一次程序来展开
const sfcInfo = new Map(COMPONENT_NAMES.map((name) => [name, readSfc(sfcByName.get(name)!)]));
const expandedModelTypes = expandModelTypes(
  [...sfcInfo.values()].flatMap((info) => info.models.flatMap((m) => (m.type ? [m.type] : []))),
);

for (const name of COMPONENT_NAMES) {
  const stem = name.slice(1);
  const propsDecl = declsByName.get(`${stem}Props`);
  if (propsDecl?.pkg === "vue") typesStillInVue.push(name);

  const { defaults, models } = sfcInfo.get(name)!;

  // React 壳：目录跟 Vue 壳同名；文件不在就是还没迁
  const dir = dirByName.get(name)!;
  const reactFile = `packages/react/src/components/${dir}/${name}.tsx`;
  const reactProps = existsSync(resolve(root, reactFile))
    ? readReactProps(reactFile, name)
    : undefined;
  if (!reactProps) reactPending.push(name);

  /** 只有 React 壳里确实有这个字段才写，写不出来就不写 —— 文档不编造 API */
  const bind = (target: string | undefined, extra: string[] = []): ReactBinding | undefined => {
    if (!reactProps || !target || !reactProps.has(target)) return undefined;
    const present = extra.filter((e) => reactProps.has(e));
    return present.length ? { name: target, extra: present } : { name: target };
  };

  /* 属性：先是 <Name>Props 的成员，再接上 defineModel 产出的 v-model 属性 */
  const members = membersOf(`${stem}Props`);
  // 一个目录里常住着两个组件（form 里有 MForm 和 MFormItem），core 的实现文件也混在一起。
  // 两边都有的同名属性（labelWidth）按语法分不出这一处默认值是给谁的，索性不认，只信壳上写的。
  const shared = new Set(
    [...dirByName].flatMap(([other, otherDir]) =>
      otherDir === dir && other !== name ? [...(propNamesByComponent.get(other) ?? [])] : [],
    ),
  );
  // 壳上登记的默认值优先（那是框架真正生效的那一份），壳上没有的再回 core 里找
  const coreDefaults = readCoreDefaults(
    dir,
    new Set(members.map((m) => m.name).filter((n) => !shared.has(n))),
  );
  const attributes: ApiAttribute[] = members.map((symbol) => {
    const core = coreDefaults.get(symbol.name);
    return {
      name: symbol.name,
      description: docOf(symbol),
      default: displayDefault(
        defaults.get(symbol.name) ?? (core && defaultFits(symbol, core) ? core : undefined),
      ),
      required: !(symbol.flags & ts.SymbolFlags.Optional),
      value: { kind: "expression" as const, type: typeTextOf(symbol) },
      react: bind(symbol.name),
    };
  });

  const namedModels = new Set(models.filter((m) => m.name !== "modelValue").map((m) => m.name));
  const controlled = reactProps ? detectControlled(reactProps, namedModels) : undefined;
  for (const model of models) {
    // 具名 v-model:x 两边同名；无名 v-model 在 React 侧的名字靠三件套认出来
    const target = model.name === "modelValue" ? controlled : model.name;
    attributes.push({
      name: model.name,
      description: model.description,
      default: displayDefault(model.default),
      required: model.required,
      value: { kind: "expression", type: modelType(model, expandedModelTypes) },
      react: target
        ? bind(target, [`default${capitalize(target)}`, `on${capitalize(target)}Change`])
        : undefined,
    });
  }

  /* 事件：v-model 的 update:x 排在前面（文档站会把它并进属性表），再是声明的事件 */
  const events: ApiNamed[] = models.map((model) => ({ name: `update:${model.name}` }));
  for (const symbol of membersOf(`${stem}Emits`)) {
    events.push({
      name: symbol.name,
      description: docOf(symbol),
      react: bind(`on${capitalize(symbol.name)}`),
    });
  }

  /* 插槽：React 侧默认插槽是 children，具名插槽是 render prop 或直接传 ReactNode */
  const slots: ApiNamed[] = membersOf(`${stem}Slots`).map((symbol) => {
    const candidates =
      symbol.name === "default"
        ? ["children"]
        : [`render${capitalize(symbol.name)}`, symbol.name, `${symbol.name}Node`];
    return {
      name: symbol.name,
      description: docOf(symbol),
      react: bind(candidates.find((c) => reactProps?.has(c))),
    };
  });

  // 没有 JSDoc 的条目记一笔：JSDoc 是文档说明的唯一来源，缺一条文档表里就空一格
  const bare = [
    ...attributes.filter((a) => !a.description).map((a) => a.name),
    // update:x 不进表（ApiDoc 把它并进了 v-model 那一行），缺不缺说明都看不见
    ...events
      .filter((e) => !e.description && !e.name.startsWith("update:"))
      .map((e) => `@${e.name}`),
    ...slots.filter((s) => !s.description).map((s) => `#${s.name}`),
  ];
  if (bare.length) undocumented.set(name, bare);

  const doc: ApiDoc = {
    name,
    source: {
      vue: { module: VUE_MODULE, symbol: name },
      react: reactProps ? { module: REACT_MODULE, symbol: name } : undefined,
    },
    attributes,
    events,
    slots,
  };
  docs.push(doc);
  writeFileSync(resolve(apiDir, `${name}.json`), JSON.stringify(doc, null, 2) + "\n");
}

/* ── web-types：只有 Vue 有这个协议，React 的字段在这里没有意义，剔掉 ── */

const vuePkg = JSON.parse(readFileSync(resolve(root, "packages/vue/package.json"), "utf8")) as {
  name: string;
  version: string;
};

const webTypes = {
  $schema: "https://raw.githubusercontent.com/JetBrains/web-types/master/schema/web-types.json",
  framework: "vue",
  name: vuePkg.name,
  version: vuePkg.version,
  contributions: {
    html: {
      "types-syntax": "typescript",
      tags: docs.map((doc) => ({
        name: doc.name,
        source: { module: doc.source.vue.module, symbol: doc.source.vue.symbol },
        attributes: doc.attributes.map(({ react: _react, ...attribute }) => attribute),
        events: doc.events.map(({ react: _react, ...event }) => event),
        slots: doc.slots.map(({ react: _react, ...slot }) => slot),
      })),
    },
  },
};
writeFileSync(
  resolve(root, "packages/vue/web-types.json"),
  JSON.stringify(webTypes, null, 2) + "\n",
);

/* ── 排版：生成的 JSON 交给仓库的格式化器再走一遍 ── */

// JSON.stringify 会把短数组拆成多行，而 oxfmt 要它们写成一行。两边不统一的话，每跑一次
// build 就把 `pnpm check` 打回红色。根 vite.config.ts 的 fmt.ignore 对这些 JSON 不生效
// （glob 换了四种写法、连精确文件名都试过），所以反过来做：让产出直接符合仓库的排版。
execFileSync("pnpm", ["exec", "vp", "fmt", "docs/api", "packages/vue/web-types.json"], {
  cwd: root,
  stdio: "ignore",
});

/* ── 报告：失败之外的都是进度和技术债，打出来但不挡构建 ── */

console.log(`meta: ${docs.length} 个组件 → docs/api/, packages/vue/web-types.json`);
if (typesStillInVue.length) {
  console.log(`· 类型还在 Vue 包里、等着搬进 core：${typesStillInVue.join(", ")}`);
}
if (reactPending.length) {
  console.log(`· React 壳还没有（文档暂时只有 Vue 一列）：${reactPending.join(", ")}`);
}
if (undocumented.size) {
  console.log(`· 缺 JSDoc（文档里这一格是空的，@ 是事件、# 是插槽）：`);
  for (const [name, items] of undocumented) console.log(`    ${name}: ${items.join(", ")}`);
}
if (unregistered.length) {
  console.log(
    `· 壳里导出了、但没有 Props 类型，按内部出口处理（不生成文档）：${unregistered.join(", ")}`,
  );
}
