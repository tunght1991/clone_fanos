import { existsSync, readFileSync } from 'node:fs';

export type ParsedEnvFile = Record<string, string>;

function stripBom(value: string): string {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}

function unquote(value: string): string {
  if (value.length < 2) {
    return value;
  }

  const first = value[0];
  const last = value[value.length - 1];

  if (first !== last || (first !== '"' && first !== "'")) {
    return value;
  }

  const inner = value.slice(1, -1);

  if (first === "'") {
    return inner;
  }

  return inner
    .replaceAll('\\n', '\n')
    .replaceAll('\\r', '\r')
    .replaceAll('\\t', '\t')
    .replaceAll('\\"', '"')
    .replaceAll('\\\\', '\\');
}

function stripInlineComment(value: string): string {
  const hashIndex = value.indexOf(' #');
  return hashIndex >= 0 ? value.slice(0, hashIndex).trimEnd() : value;
}

export function parseEnvFile(contents: string): ParsedEnvFile {
  const parsed: ParsedEnvFile = {};
  const lines = stripBom(contents).split(/\r?\n/u);

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const exportedLine = line.startsWith('export ') ? line.slice(7).trimStart() : line;
    const equalsIndex = exportedLine.indexOf('=');

    if (equalsIndex <= 0) {
      continue;
    }

    const key = exportedLine.slice(0, equalsIndex).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/u.test(key)) {
      continue;
    }

    const rawValue = exportedLine.slice(equalsIndex + 1).trim();
    const value = rawValue.startsWith('"') || rawValue.startsWith("'")
      ? unquote(rawValue)
      : unquote(stripInlineComment(rawValue));
    parsed[key] = value;
  }

  return parsed;
}

export function readEnvFile(filePath: string): ParsedEnvFile {
  if (!existsSync(filePath)) {
    return {};
  }

  return parseEnvFile(readFileSync(filePath, 'utf8'));
}
