import { readFileSync } from 'node:fs';
import path from 'node:path';
import { build, type HtmlTagDescriptor, type Plugin, type Rollup } from 'vite';
import { SKELETON_HTML } from './src/cover/skeleton.ts';

const coverDir = path.resolve(import.meta.dirname, 'src/cover');
const STORY_ROUTE = '/^\\/(\\d{4})?\\/?$/';

/** Critical cover and skeleton CSS, the cover's two tiny subset fonts embedded (≈ 7 KB in total). */
function criticalCss(): string {
  return ['cover.css', 'skeleton.css'].map(file => readFileSync(path.join(coverDir, file), 'utf8')).join('\n')
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

/**
 * A lazy chunk's own file plus the static imports and CSS it still needs, minus
 * what the entry already preloads: what the browser can fetch at once instead
 * of discovering it one import at a time.
 */
function chunkFiles(bundle: Rollup.OutputBundle, facade: string): { js: string[]; css: string[] } {
  const chunks = Object.values(bundle).filter((item): item is Rollup.OutputChunk => item.type === 'chunk');
  const byFile = new Map(chunks.map(chunk => [chunk.fileName, chunk]));
  const entry = chunks.find(chunk => chunk.isEntry);
  const loaded = new Set(entry ? [entry.fileName, ...entry.imports] : []);
  const start = chunks.find(chunk => chunk.facadeModuleId?.endsWith(facade));
  const js: string[] = [];
  const css = new Set<string>();
  const visit = (chunk: Rollup.OutputChunk | undefined) => {
    if (!chunk || loaded.has(chunk.fileName) || js.includes(chunk.fileName)) return;
    js.push(chunk.fileName);
    chunk.viteMetadata?.importedCss.forEach(file => css.add(file));
    chunk.imports.forEach(file => visit(byFile.get(file)));
  };
  visit(start);
  return { js, css: [...css] };
}

interface CoverRegistry { year: string | null; retired: string[] }

/**
 * The current year for "/" and the story routes that must not show the cover:
 * superseded editions show the construction page instead, and "" stands for "/"
 * while the current edition itself is superseded.
 */
function coverRegistry(): CoverRegistry {
  try {
    const registry = JSON.parse(readFileSync(path.resolve(import.meta.dirname, 'public/data/editions.json'), 'utf8')) as {
      currentEdition: string; editions: { id: string; status: string }[];
    };
    const retired = registry.editions.filter(edition => edition.status === 'superseded').map(edition => edition.id);
    if (retired.includes(registry.currentEdition)) retired.push('');
    return { year: /^\d{4}$/.test(registry.currentEdition) ? registry.currentEdition : null, retired };
  } catch {
    return { year: null, retired: [] };
  }
}

/**
 * Puts the story cover into index.html so it paints and animates before the
 * app bundle has loaded. React's IntroSlide later adopts the same element
 * (src/cover/shell.ts). Only story routes ("/" and "/<year>") of an edition
 * that is not superseded show it; boot.ts follows the `cover-boot` class set here.
 */
export function coverShellPlugin(): Plugin {
  let isBuild = false;
  let boot: Promise<string> | null = null;
  return {
    name: 'wrapped-cover-shell',
    configResolved(config) {
      isBuild = config.command === 'build';
    },
    async transformIndexHtml(html, context) {
      const { year, retired } = coverRegistry();
      const bundle = context.bundle;
      const files = (facade: string) => (bundle ? chunkFiles(bundle, facade) : { js: [], css: [] });
      const story = files('src/components/MainWrappedPage.tsx');
      const construction = files('src/components/construction/ConstructionPage.tsx');
      const validators = files('src/generated/wrapped-contract-validators.js');
      // Runs before first paint, on every route: starts the edition index (every
      // edition route validates it first) and the validator chunk, so neither
      // waits for the main bundle. Story routes add the cover (dark ground, year
      // for "/", eagle, story chunk); a superseded one shows the construction page
      // instead, so that chunk loads early and the skeleton takes its violet.
      const link = (rel: string, href: string, extra = '') => `l=document.createElement('link');l.rel='${rel}';l.href='${href}';${extra}document.head.appendChild(l);`;
      const preload = (chunk: { js: string[]; css: string[] }) =>
        chunk.js.map(file => link('modulepreload', `/${file}`)).join('')
        + chunk.css.map(file => link('preload', `/${file}`, "l.as='style';")).join('');
      // The catch only keeps a failed request quiet on routes that never ask for it; the loader still sees the rejection.
      const head = `var r=fetch('/data/editions.json',{redirect:'error'});r.catch(function(){});window.__btPrefetch=new Map([['/data/editions.json',r]]);`
        + `var d=document.documentElement,l,m=location.pathname.match(${STORY_ROUTE});`
        + preload(validators)
        + `if(m&&${JSON.stringify(retired)}.indexOf(m[1]||'')<0){d.classList.add('cover-boot');${year ? `d.dataset.coverYear='${year}';` : ''}`
        + link('preload', '/cover-adler.webp', "l.as='image';l.fetchPriority='high';")
        + preload(story)
        + `}else if(m){d.dataset.bootSurface='violet';${preload(construction)}}`;
      const tags: HtmlTagDescriptor[] = [
        { tag: 'style', children: criticalCss(), injectTo: 'head' },
        { tag: 'script', children: head, injectTo: 'head' },
        { tag: 'div', attrs: { id: 'cover-shell' }, injectTo: 'body-prepend' },
      ];
      const page = html.replace('<div id="root"></div>', `<div id="root">${SKELETON_HTML}</div>`);
      if (page === html) throw new Error('index.html has no empty <div id="root"></div> for the skeleton');
      if (isBuild) {
        boot ??= bootScript();
        tags.push({ tag: 'script', children: await boot, injectTo: 'body-prepend' });
      } else {
        tags.push({ tag: 'script', attrs: { type: 'module', src: '/src/cover/boot.ts' }, injectTo: 'body-prepend' });
      }
      return { html: page, tags };
    },
  };
}
