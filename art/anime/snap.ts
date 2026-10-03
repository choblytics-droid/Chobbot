import { chromium } from '/home/user/Chobbot/app/node_modules/playwright-core';
const [src, out] = [process.argv[2]!, process.argv[3]!];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1200, height: 1200 } });
await p.goto('file://' + src);
await p.screenshot({ path: out, omitBackground: true });
await b.close();
