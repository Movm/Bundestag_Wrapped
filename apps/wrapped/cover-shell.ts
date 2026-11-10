import { readFileSync } from 'node:fs';
import path from 'node:path';
import { build, type HtmlTagDescriptor, type Plugin } from 'vite';

const coverDir = path.resolve(import.meta.dirname, 'src/cover');
const STORY_ROUTE = '/^\\/(\\d{4})?\\/?$/';

/** Critical cover CSS with its two tiny subset fonts embedded (≈ 6 KB in total). */
function criticalCss(): string {
  return readFileSync(path.join(coverDir, 'cover.css'), 'utf8')
    .replace(/url\('\.\/(cover-[a-z-]+\.woff2)'\)/g, (_, file: string) =>
      `url(data:font/woff2;base64,${readFileSync(path.join(coverDir, file)).toString('base64')})`)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s*\n\s*/g, '');
}

/** The boot script as one self-contained classic script, to run during HTML parsing. */
async function bootScript(): Promise<string> {
  const output = await build({
    configFile: false,
    logLevel: 'silent',
    resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
    build: {
      write: false,
      minify: true,
      target: 'es2020',
      lib: { entry: path.join(coverDir, 'boot.ts'), formats: ['iife'], name: 'btCoverBoot' },
    },
  });
  const result = Array.isArray(output) ? output[0] : output;
  if (!('output' in result)) throw new Error('cover boot build returned a watcher');
  return result.output[0].type === 'chunk' ? result.output[0].code : '';
}

function currentEditionYear(): string | null {
  try {
    const registry = JSON.parse(readFileSync(path.resolve(import.meta.dirname, 'public/data/editions.json'), 'utf8'));
    return /^\d{4}$/.test(registry.currentEdition) ? registry.currentEdition : null;
  } catch {
    return null;
  }
}

/**
 * Puts the story cover into index.html so it paints and animates before the
 * app bundle has loaded. React's IntroSlide later adopts the same element
 * (src/cover/shell.ts). Only story routes ("/" and "/<year>") show it.
 */
export function coverShellPlugin(): Plugin {
  let isBuild = false;
  let boot: Promise<string> | null = null;
  return {
    name: 'wrapped-cover-shell',
    configResolved(config) {
      isBuild = config.command === 'build';
    },
    async transformIndexHtml(_html, context) {
      const year = currentEditionYear();
      const storyChunk = context.bundle && Object.values(context.bundle).find(
        chunk => chunk.type === 'chunk' && chunk.facadeModuleId?.endsWith('src/components/MainWrappedPage.tsx'),
      );
      // Runs before first paint: dark ground, current year for "/", and an
      // early fetch of the story chunk, all only on story routes.
      const preload = (rel: string, href: string, extra = '') => `l=document.createElement('link');l.rel='${rel}';l.href='${href}';${extra}document.head.appendChild(l);`;
      const head = `if(${STORY_ROUTE}.test(location.pathname)){var d=document.documentElement,l;d.classList.add('cover-boot');${year ? `d.dataset.coverYear='${year}';` : ''}`
        + preload('preload', '/cover-adler.webp', "l.as='image';l.fetchPriority='high';")
        + (storyChunk ? preload('modulepreload', `/${storyChunk.fileName}`) : '')
        + '}';
      const tags: HtmlTagDescriptor[] = [
        { tag: 'style', children: criticalCss(), injectTo: 'head' },
        { tag: 'script', children: head, injectTo: 'head' },
        { tag: 'div', attrs: { id: 'cover-shell' }, injectTo: 'body-prepend' },
      ];
      if (isBuild) {
        boot ??= bootScript();
        tags.push({ tag: 'script', children: await boot, injectTo: 'body-prepend' });
      } else {
        tags.push({ tag: 'script', attrs: { type: 'module', src: '/src/cover/boot.ts' }, injectTo: 'body-prepend' });
      }
      return tags;
    },
  };
}
