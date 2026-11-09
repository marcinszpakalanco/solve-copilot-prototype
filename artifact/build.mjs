// Builds the single-file page published as the Claude artifact (phone preview).
// react-aria-components is swapped for artifact/rac-shim.jsx so the page needs no package at runtime.
import fs from 'fs';
const local = fs.existsSync('node_modules/esbuild');
const { build } = await import(local ? 'esbuild' : '/opt/npm-tools/node_modules/esbuild/lib/main.js');
const shim = new URL('./rac-shim.jsx', import.meta.url).pathname;
const r = await build({
  entryPoints: ['src/main.jsx'], bundle: true, minify: true, format: 'iife', write: false, outdir: 'artifact/out',
  jsx: 'automatic', loader: { '.js': 'jsx' }, nodePaths: local ? [] : ['/opt/npm-tools/node_modules'],
  define: { 'process.env.NODE_ENV': '"production"' }, target: ['es2020'],
  plugins: [{ name: 'rac', setup(b) { b.onResolve({ filter: /^react-aria-components$/ }, () => ({ path: shim })); } }],
});
const js = r.outputFiles.find(f => f.path.endsWith('.js')).text;
const css = r.outputFiles.find(f => f.path.endsWith('.css')).text;
const html = `<title>Solve Copilot prototype</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..600&display=swap" />
<style>${css}</style>
<div id="root"></div>
<script>${js.replace(/<\/script/gi, '<\\/script')}</script>`;
fs.writeFileSync('artifact/out/solve-copilot.html', html);
console.log('js', js.length, 'css', css.length, 'html', html.length);
