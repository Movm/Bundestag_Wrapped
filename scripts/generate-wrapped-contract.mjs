import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const schemaPath = resolve(root, 'contracts/wrapped/v1.schema.json');
const outputPath = resolve(root, 'apps/wrapped/src/generated/wrapped-contract-v1.ts');
const check = process.argv.includes('--check');

const schema = JSON.parse(await readFile(schemaPath, 'utf8'));

function refName(ref) {
  return ref.replace('#/$defs/', '');
}

function typeOf(node) {
  if ('$ref' in node) return refName(node.$ref);
  if ('const' in node) return JSON.stringify(node.const);
  if ('enum' in node) return node.enum.map(value => JSON.stringify(value)).join(' | ');
  if ('anyOf' in node) return node.anyOf.map(typeOf).join(' | ');
  if ('oneOf' in node) return node.oneOf.map(typeOf).join(' | ');

  const type = node.type;
  if (Array.isArray(type)) return type.map(entry => primitiveType(entry)).join(' | ');
  if (type === 'array') return `Array<${typeOf(node.items)}>`;
  if (type === 'object') {
    if (node.additionalProperties === true) return 'Record<string, unknown>';
    if (node.additionalProperties && typeof node.additionalProperties === 'object') {
      return `Record<string, ${typeOf(node.additionalProperties)}>`;
    }
    return inlineObject(node);
  }
  return primitiveType(type);
}

function primitiveType(type) {
  if (type === 'string') return 'string';
  if (type === 'integer' || type === 'number') return 'number';
  if (type === 'boolean') return 'boolean';
  if (type === 'null') return 'null';
  return 'unknown';
}

function inlineObject(node) {
  const required = new Set(node.required ?? []);
  const lines = Object.entries(node.properties ?? {}).map(([name, property]) =>
    `  ${JSON.stringify(name)}${required.has(name) ? '' : '?'}: ${typeOf(property)};`,
  );
  return `{\n${lines.join('\n')}\n}`;
}

function declaration(name, node) {
  if (node.type === 'object' && !node.additionalProperties) {
    return `export interface ${name} ${inlineObject(node)}`;
  }
  return `export type ${name} = ${typeOf(node)};`;
}

const declarations = Object.entries(schema.$defs)
  .map(([name, node]) => declaration(name, node))
  .join('\n\n');
const generated = `/**\n * GENERATED FILE — DO NOT EDIT.\n * Source: contracts/wrapped/v1.schema.json\n * Run: pnpm contract:generate\n */\n\n${declarations}\n`;

if (check) {
  const current = await readFile(outputPath, 'utf8').catch(() => '');
  if (current !== generated) {
    console.error('Generated Wrapped contract types are stale. Run: pnpm contract:generate');
    process.exitCode = 1;
  }
} else {
  await mkdir(resolve(root, 'apps/wrapped/src/generated'), { recursive: true });
  await writeFile(outputPath, generated);
}
