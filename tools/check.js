#!/usr/bin/env node
/* 테스트 데이터 검사기 — data.js를 고친 뒤 실행하세요.
 *   node tools/check.js
 * 오타 난 결과 키, 빠진 유형, 축별 문항 수 불균형 같은 실수를 찾아 줍니다. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const dirs = fs.readdirSync(path.join(ROOT, 'test')).filter(d => fs.existsSync(path.join(ROOT, 'test', d, 'page.json')));
let problems = 0;

function bad(slug, msg) { problems++; console.log(`  ✗ ${slug}: ${msg}`); }

for (const slug of dirs) {
  const dir = path.join(ROOT, 'test', slug);
  const page = JSON.parse(fs.readFileSync(path.join(dir, 'page.json'), 'utf8'));
  const ctx = { window: {} };
  try { vm.runInNewContext(fs.readFileSync(path.join(dir, 'data.js'), 'utf8'), ctx); }
  catch (e) { bad(slug, `data.js 문법 오류 — ${e.message}`); continue; }
  const D = ctx.window.TEST_DATA;
  if (!D) { bad(slug, 'window.TEST_DATA가 없어요'); continue; }
  const before = problems;

  if (page.engine === 'mbti') {
    const types = [];
    for (const a of 'EI') for (const b of 'SN') for (const c of 'TF') for (const d of 'JP') types.push(a + b + c + d);
    types.forEach(t => { if (!D.results[t]) bad(slug, `결과 ${t}가 없어요`); });
    Object.entries(D.results).forEach(([t, r]) => {
      ['best', 'worst'].forEach(k => { if (r[k] && !D.results[r[k]]) bad(slug, `${t}.${k} = '${r[k]}'는 없는 유형이에요`); });
    });
    const per = [0, 0, 0, 0];
    D.questions.forEach((q, i) => { if (!(q.axis >= 0 && q.axis <= 3)) bad(slug, `${i + 1}번 문항 axis가 0~3이 아니에요`); else per[q.axis]++; });
    per.forEach((n, i) => { if (n % 2 === 0) bad(slug, `${D.axes[i].join('/')} 축 문항이 ${n}개(짝수)라 동점이 생길 수 있어요`); });
    if (new Set(per).size > 1) bad(slug, `축별 문항 수가 달라요: ${per.join(', ')}`);
  }

  if (page.engine === 'quiz') {
    const keys = Object.keys(D.results);
    if (D.mode === 'category') {
      const count = Object.fromEntries(keys.map(k => [k, 0]));
      D.questions.forEach((q, i) => q.o.forEach(o => {
        if (!(o[1] in count)) bad(slug, `${i + 1}번 문항 선택지 ‘${o[0]}’의 결과 키 '${o[1]}'가 results에 없어요`);
        else count[o[1]]++;
      }));
      keys.forEach(k => { if (!count[k]) bad(slug, `결과 '${k}'로 가는 선택지가 하나도 없어요`); });
      const n = Object.values(count); const spread = Math.max(...n) - Math.min(...n);
      if (spread > 2) console.log(`  ! ${slug}: 결과별 선택지 수 차이가 커요 (${keys.map(k => k + ':' + count[k]).join(' ')})`);
    } else if (D.mode === 'score') {
      const max = D.questions.reduce((s, q) => s + Math.max(...q.o.map(o => o[1])), 0);
      D.bands.forEach(b => { if (!D.results[b.key]) bad(slug, `bands의 '${b.key}'가 results에 없어요`); });
      if (D.bands[0].min !== 0) bad(slug, '첫 band의 min은 0이어야 해요');
      if (D.bands[D.bands.length - 1].min > max) bad(slug, `마지막 band(min ${D.bands[D.bands.length - 1].min})가 최대 점수 ${max}보다 커서 나올 수 없어요`);
    } else bad(slug, `mode는 'category' 또는 'score'여야 해요`);
  }

  if (page.engine === 'reflex') D.bands.forEach(b => { if (!D.results[b.key]) bad(slug, `bands의 '${b.key}'가 results에 없어요`); });
  if (page.engine === 'oracle' && !(D.answers && D.answers.length)) bad(slug, 'answers가 비어 있어요');

  if (problems === before) console.log(`  ✓ ${slug}`);
}
console.log(problems ? `\n문제 ${problems}개를 고쳐 주세요.` : '\n모든 테스트 데이터가 정상이에요.');
process.exit(problems ? 1 : 0);
