'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');
const {plain,dateOf,suruga,smbc}=require('../api/rates.js')._test;
test('SMBC mortgage rate parsing and date',()=>{const text='固定金利特約型10年 年 4.15 ％～ 年 4.45 ％ 変動金利型 年 1.225 ％～ 年 1.525 ％ （2026年10月01日現在）';const r=smbc(text);assert.equal(r.length,2);assert.equal(r[0].min,1.225);assert.equal(r[0].max,1.525);assert.equal(r[0].effectiveDate,'2026-10-01');assert.equal(r[1].type,'intro-fixed');});
test('Suruga parser avoids unrelated card loan rates',()=>{const text='カードローン 金利 7.000％～14.000％ ## 住宅ローン スルガ銀行住宅ローン＜優遇金利型＞ 変動金利型 1.575％～4.575％ スルガ銀行住宅ローン 取扱手数料定額型 2.375％～5.275％ 取扱手数料定率型 2.225％～5.125％ ＜2026/10/01 現在＞';const r=suruga(text);assert.equal(r.length,3);assert.deepEqual(r.map(x=>x.min),[1.575,2.225,2.375]);assert.equal(r[0].effectiveDate,'2026-10-01');});
test('Reject missing or suspicious rate values',()=>{assert.equal(smbc('変動金利型 年 0.00 ％～ 年 50.00 ％ （2026年10月01日現在）').length,0);assert.equal(suruga('住宅ローン 金利 9.00%～20.00%').length,0);});
test('HTML normalizer keeps image ALT and strips scripts',()=>{let text=plain('<img src="x" alt="変動金利型"><b>年 1.225 ％</b><script>999</script>');assert.match(text,/変動金利型 年 1.225 ％/);assert.doesNotMatch(text,/999/);});
test('Page links calculator and has valid inline JavaScript',()=>{const html=fs.readFileSync('bank-rates.html','utf8'),index=fs.readFileSync('index.html','utf8');assert.match(index,/bank-rates\.html/);assert.match(html,/\/api\/rates/);const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];assert.equal(scripts.length,1);new vm.Script(scripts[0][1],{filename:'bank-rates.html:inline'});});
