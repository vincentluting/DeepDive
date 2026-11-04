"use strict";

const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const { ESLintUtils, AST_NODE_TYPES } = require("@typescript-eslint/utils");

const createRule = ESLintUtils.RuleCreator(
  () => "https://local.rules/require-language-guard",
);

const REPO_ROOT = process.cwd();
const TARGET_FUNCTIONS = new Set([
  "callLLM",
  "callLLMStructured",
  "streamLLM",
]);
const NON_STREAMING_TARGETS = new Set(["callLLM", "callLLMStructured"]);
const EXEMPT_RELATIVE_PATHS = new Set([
  "lib/ai/model-router.ts",
  "lib/ai/structured-output.ts",
]);
const PRAGMA_RE = /@language-guard-exempt:\s*\S/;
const RESOLVED_GUARD_FILES = {
  enforceOutputLocale: normalizePath(
    path.join(REPO_ROOT, "lib/report-generation/language-guard.ts"),
  ),
  observeStreamLocale: normalizePath(
    path.join(REPO_ROOT, "lib/coaching/stream-language-observer.ts"),
  ),
};

const moduleResolutionCache = new Map();
const parsedSourceCache = new Map();
const exportResolutionCache = new Map();

function normalizePath(filePath) {
  return filePath ? filePath.split(path.sep).join("/") : filePath;
}

function toAbsoluteFilename(filename) {
  return path.isAbsolute(filename)
    ? filename
    : path.resolve(REPO_ROOT, filename || "");
}

function toRelativeFilename(filename) {
  return normalizePath(path.relative(REPO_ROOT, filename));
}

function isInternalModuleSource(source) {
  return source.startsWith("./") || source.startsWith("../") || source.startsWith("@/");
}

function resolveProjectModule(importerFilename, source) {
  if (!source || !isInternalModuleSource(source)) {
    return null;
  }

  const cacheKey = `${normalizePath(importerFilename)}::${source}`;
  if (moduleResolutionCache.has(cacheKey)) {
    return moduleResolutionCache.get(cacheKey);
  }

  const basePath = source.startsWith("@/")
    ? path.resolve(REPO_ROOT, source.slice(2))
    : path.resolve(path.dirname(importerFilename), source);

  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.jsx`,
    path.join(basePath, "index.ts"),
    path.join(basePath, "index.tsx"),
    path.join(basePath, "index.js"),
    path.join(basePath, "index.jsx"),
  ];

  let resolved = null;
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      resolved = normalizePath(candidate);
      break;
    }
  }

  moduleResolutionCache.set(cacheKey, resolved);
  return resolved;
}

function getScriptKind(modulePath) {
  if (modulePath.endsWith(".tsx")) {
    return ts.ScriptKind.TSX;
  }
  if (modulePath.endsWith(".jsx")) {
    return ts.ScriptKind.JSX;
  }
  if (modulePath.endsWith(".js")) {
    return ts.ScriptKind.JS;
  }
  return ts.ScriptKind.TS;
}

function getParsedSourceFile(modulePath) {
  if (parsedSourceCache.has(modulePath)) {
    return parsedSourceCache.get(modulePath);
  }

  const content = fs.readFileSync(modulePath, "utf8");
  const sourceFile = ts.createSourceFile(
    modulePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    getScriptKind(modulePath),
  );
  parsedSourceCache.set(modulePath, sourceFile);
  return sourceFile;
}

function isExported(node) {
  return (
    Array.isArray(node.modifiers) &&
    node.modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
  );
}

function getImportModulePath(importerFilename, statement) {
  if (
    !statement.moduleSpecifier ||
    !ts.isStringLiteral(statement.moduleSpecifier)
  ) {
    return null;
  }
  return resolveProjectModule(importerFilename, statement.moduleSpecifier.text);
}

function collectModuleMetadata(modulePath) {
  const sourceFile = getParsedSourceFile(modulePath);
  const imports = new Map();
  const localDeclarations = new Set();

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      const importClause = statement.importClause;
      const resolvedModulePath = getImportModulePath(modulePath, statement);
      if (!importClause || !resolvedModulePath) {
        continue;
      }

      if (
        importClause.namedBindings &&
        ts.isNamespaceImport(importClause.namedBindings)
      ) {
        imports.set(importClause.namedBindings.name.text, {
          kind: "namespace",
          modulePath: resolvedModulePath,
        });
      }

      if (
        importClause.namedBindings &&
        ts.isNamedImports(importClause.namedBindings)
      ) {
        for (const element of importClause.namedBindings.elements) {
          const importedName = element.propertyName
            ? element.propertyName.text
            : element.name.text;
          imports.set(element.name.text, {
            kind: "named",
            modulePath: resolvedModulePath,
            importedName,
          });
        }
      }
      continue;
    }

    if (ts.isFunctionDeclaration(statement) && statement.name) {
      localDeclarations.add(statement.name.text);
      continue;
    }

    if (ts.isClassDeclaration(statement) && statement.name) {
      localDeclarations.add(statement.name.text);
      continue;
    }

    if (ts.isEnumDeclaration(statement)) {
      localDeclarations.add(statement.name.text);
      continue;
    }

    if (ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement)) {
      localDeclarations.add(statement.name.text);
      continue;
    }

    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) {
          localDeclarations.add(declaration.name.text);
        }
      }
    }
  }

  return { sourceFile, imports, localDeclarations };
}

function resolveExportedFunction(modulePath, exportName, seen = new Set()) {
  if (!modulePath || !TARGET_FUNCTIONS.has(exportName)) {
    return null;
  }

  const cacheKey = `${modulePath}::${exportName}`;
  if (exportResolutionCache.has(cacheKey)) {
    return exportResolutionCache.get(cacheKey);
  }

  if (seen.has(cacheKey)) {
    return null;
  }
  seen.add(cacheKey);

  const { sourceFile, imports, localDeclarations } = collectModuleMetadata(modulePath);
  let resolved = null;

  for (const statement of sourceFile.statements) {
    if (
      ts.isFunctionDeclaration(statement) &&
      statement.name &&
      isExported(statement) &&
      statement.name.text === exportName
    ) {
      resolved = exportName;
      break;
    }

    if (ts.isVariableStatement(statement) && isExported(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (
          ts.isIdentifier(declaration.name) &&
          declaration.name.text === exportName
        ) {
          resolved = exportName;
          break;
        }
      }
      if (resolved) {
        break;
      }
    }

    if (!ts.isExportDeclaration(statement)) {
      continue;
    }

    const targetModulePath = getImportModulePath(modulePath, statement);

    if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
      for (const element of statement.exportClause.elements) {
        if (element.name.text !== exportName) {
          continue;
        }

        const localName = element.propertyName
          ? element.propertyName.text
          : element.name.text;

        if (targetModulePath) {
          resolved = resolveExportedFunction(targetModulePath, localName, seen);
        } else if (imports.has(localName)) {
          const binding = imports.get(localName);
          if (binding.kind === "named") {
            resolved = resolveExportedFunction(
              binding.modulePath,
              binding.importedName,
              seen,
            );
          }
        } else if (localDeclarations.has(localName) && TARGET_FUNCTIONS.has(localName)) {
          resolved = localName;
        }

        if (resolved) {
          break;
        }
      }
    }

    if (resolved) {
      break;
    }

    if (!statement.exportClause && targetModulePath) {
      resolved = resolveExportedFunction(targetModulePath, exportName, seen);
      if (resolved) {
        break;
      }
    }
  }

  exportResolutionCache.set(cacheKey, resolved);
  return resolved;
}

function getImportSourceValue(statement) {
  if (
    !statement.source ||
    statement.source.type !== AST_NODE_TYPES.Literal ||
    typeof statement.source.value !== "string"
  ) {
    return null;
  }
  return statement.source.value;
}

function collectTargetBindings(programNode, importerFilename) {
  const directBindings = new Map();
  const namespaceBindings = new Map();

  for (const statement of programNode.body) {
    if (statement.type !== AST_NODE_TYPES.ImportDeclaration) {
      continue;
    }

    const source = getImportSourceValue(statement);
    if (!source) {
      continue;
    }

    const modulePath = resolveProjectModule(importerFilename, source);
    if (!modulePath) {
      continue;
    }

    for (const specifier of statement.specifiers) {
      if (specifier.type === AST_NODE_TYPES.ImportSpecifier) {
        const importedName =
          specifier.imported.type === AST_NODE_TYPES.Identifier
            ? specifier.imported.name
            : String(specifier.imported.value);
        const resolvedTarget = resolveExportedFunction(modulePath, importedName);
        if (resolvedTarget) {
          directBindings.set(specifier.local.name, resolvedTarget);
        }
      }

      if (specifier.type === AST_NODE_TYPES.ImportNamespaceSpecifier) {
        namespaceBindings.set(specifier.local.name, modulePath);
      }
    }
  }

  return { directBindings, namespaceBindings };
}

function collectGuardImports(programNode, importerFilename) {
  const importedGuards = {
    enforceOutputLocale: false,
    observeStreamLocale: false,
  };

  for (const statement of programNode.body) {
    if (statement.type !== AST_NODE_TYPES.ImportDeclaration) {
      continue;
    }

    const source = getImportSourceValue(statement);
    if (!source) {
      continue;
    }

    const resolvedSource = resolveProjectModule(importerFilename, source);
    if (!resolvedSource) {
      continue;
    }

    for (const specifier of statement.specifiers) {
      if (specifier.type !== AST_NODE_TYPES.ImportSpecifier) {
        continue;
      }

      const importedName =
        specifier.imported.type === AST_NODE_TYPES.Identifier
          ? specifier.imported.name
          : String(specifier.imported.value);

      if (
        importedName === "enforceOutputLocale" &&
        resolvedSource === RESOLVED_GUARD_FILES.enforceOutputLocale
      ) {
        importedGuards.enforceOutputLocale = true;
      }

      if (
        importedName === "observeStreamLocale" &&
        resolvedSource === RESOLVED_GUARD_FILES.observeStreamLocale
      ) {
        importedGuards.observeStreamLocale = true;
      }
    }
  }

  return importedGuards;
}

function getPragmaComments(sourceCode) {
  return sourceCode
    .getAllComments()
    .filter((comment) => PRAGMA_RE.test(comment.value));
}

function hasFileLevelPragma(programNode, pragmaComments) {
  const firstStatement = programNode.body[0];
  if (!firstStatement) {
    return pragmaComments.length > 0;
  }

  return pragmaComments.some(
    (comment) => comment.loc && comment.loc.end.line < firstStatement.loc.start.line,
  );
}

function hasNearbyPragma(node, pragmaComments) {
  return pragmaComments.some((comment) => {
    if (!comment.loc) {
      return false;
    }

    return (
      comment.loc.start.line === node.loc.start.line ||
      comment.loc.end.line === node.loc.start.line ||
      comment.loc.end.line === node.loc.start.line - 1
    );
  });
}

function getInvokedTarget(node, directBindings, namespaceBindings) {
  if (node.callee.type === AST_NODE_TYPES.Identifier) {
    return directBindings.get(node.callee.name) ?? null;
  }

  if (
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    !node.callee.computed &&
    node.callee.object.type === AST_NODE_TYPES.Identifier &&
    node.callee.property.type === AST_NODE_TYPES.Identifier
  ) {
    const modulePath = namespaceBindings.get(node.callee.object.name);
    if (!modulePath) {
      return null;
    }
    return resolveExportedFunction(modulePath, node.callee.property.name);
  }

  return null;
}

function hasRequiredGuardImport(targetFunction, importedGuards) {
  if (NON_STREAMING_TARGETS.has(targetFunction)) {
    return importedGuards.enforceOutputLocale;
  }
  if (targetFunction === "streamLLM") {
    return importedGuards.observeStreamLocale;
  }
  return false;
}

module.exports = createRule({
  name: "require-language-guard",
  meta: {
    type: "problem",
    docs: {
      description:
        "Require every user-facing callLLM / callLLMStructured / streamLLM call site to declare the matching language guard or an explicit exemption.",
    },
    schema: [],
    messages: {
      missingGuard:
        "{{filename}} invokes {{targetFunction}} but neither imports a language guard nor declares `@language-guard-exempt: <reason>`. See lib/report-generation/language-guard.ts (non-streaming) or lib/coaching/stream-language-observer.ts (streaming).",
    },
  },
  defaultOptions: [],
  create(context) {
    const absoluteFilename = toAbsoluteFilename(context.filename);
    const relativeFilename = toRelativeFilename(absoluteFilename);

    if (EXEMPT_RELATIVE_PATHS.has(relativeFilename)) {
      return {};
    }

    const sourceCode = context.sourceCode;
    const pragmaComments = getPragmaComments(sourceCode);

    if (hasFileLevelPragma(sourceCode.ast, pragmaComments)) {
      return {};
    }

    const importedGuards = collectGuardImports(sourceCode.ast, absoluteFilename);
    const { directBindings, namespaceBindings } = collectTargetBindings(
      sourceCode.ast,
      absoluteFilename,
    );

    if (directBindings.size === 0 && namespaceBindings.size === 0) {
      return {};
    }

    return {
      CallExpression(node) {
        const targetFunction = getInvokedTarget(
          node,
          directBindings,
          namespaceBindings,
        );
        if (!targetFunction) {
          return;
        }

        if (hasNearbyPragma(node, pragmaComments)) {
          return;
        }

        if (hasRequiredGuardImport(targetFunction, importedGuards)) {
          return;
        }

        context.report({
          node,
          messageId: "missingGuard",
          data: {
            filename: relativeFilename,
            targetFunction,
          },
        });
      },
    };
  },
});
