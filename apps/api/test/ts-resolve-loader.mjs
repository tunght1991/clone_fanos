import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

export async function resolve(specifier, context, nextResolve) {
  if (specifier.endsWith('.js')) {
    try {
      const resolved = new URL(specifier, context.parentURL);
      const jsPath = fileURLToPath(resolved);
      const tsPath = jsPath.replace(/\.js$/u, '.ts');

      if (existsSync(tsPath)) {
        return {
          url: pathToFileURL(tsPath).href,
          shortCircuit: true,
        };
      }
    } catch {
      // Fall through to default resolver.
    }
  }

  return nextResolve(specifier, context);
}

