// Profile a stage scene: time a frame with components toggled off one at a time.
import { chromium } from 'playwright-core';
const id = process.argv[2] ?? 'run', t = +(process.argv[3] ?? '17');
const port = 5400 + Math.floor(Math.random() * 300);
const proc = Bun.spawn(['bunx', 'vite', '--port', String(port), '--strictPort'], { cwd: import.meta.dir + '/..', stdout: 'ignore', stderr: 'ignore', env: { ...process.env, PDOOM_NO_HMR: '1' } });
for (let i = 0; i < 100; i++) { try { if ((await fetch(`http://localhost:${port}`)).ok) break; } catch {} await Bun.sleep(100); }
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await p.goto(`http://localhost:${port}/?export=1&only=${id}${process.argv[4] ? '&scale=' + process.argv[4] : ''}`);
await p.waitForFunction(() => (window as any).__pdoom?.ready, null, { timeout: 600000 });
const r = await p.evaluate(async ([id, t]) => {
  const P = (window as any).__pdoom, E = P.engine, s = E.loaded.get(id).scene;
  const buf = new Uint8Array(P.width * P.height * 4);
  const time = async (label: string) => {
    for (let i = 0; i < 2; i++) { E.render(t + i / 60, 1 / 60, false, 1, 0.5); await E.readPixelsAsync(buf); }
    const a = performance.now();
    for (let i = 0; i < 4; i++) { E.render(t + (i + 2) / 60, 1 / 60, false, 1, 0.5); await E.readPixelsAsync(buf); }
    return `${label}: ${((performance.now() - a) / 4).toFixed(0)} ms`;
  };
  const out = [await time('full')];
  const world = s.world;
  const kids = [...world.children];
  for (const k of kids) { const v = k.visible; k.visible = false; out.push(await time(`- ${k.type}/${k.children.length}ch/${(k as any).count ?? ''}`)); k.visible = v; }
  const us = s.useSky; s.useSky = false; out.push(await time('- sky')); s.useSky = us;
  const fr = s.fx.render; s.fx.render = () => {}; out.push(await time('- fx3d')); s.fx.render = fr;
  const cu = s.ctx.comp.draw; s.ctx.comp.draw = () => {}; out.push(await time('- comp/ui')); s.ctx.comp.draw = cu;
  kids.forEach((k: any) => k.visible = false); s.useSky = false; s.fx.render = () => {}; s.fx2d.render = () => {}; s.ctx.comp.draw = () => {};
  out.push(await time('bare engine+post'));
  const pr = E.post.render.bind(E.post); E.post.render = () => {}; out.push(await time('bare, no post')); E.post.render = pr;
  const rpa = E.readPixelsAsync.bind(E); E.readPixelsAsync = async (b: any) => E.readPixels(b); out.push(await time('bare, SYNC readback')); E.readPixelsAsync = rpa;
  const rp = E.readPixelsAsync.bind(E); E.readPixelsAsync = async () => {}; out.push(await time('bare, no readback')); E.readPixelsAsync = rp;
  return out;
}, [id, t] as const);
console.log(r.join('\n'));
await b.close(); proc.kill();
