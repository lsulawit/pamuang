const assert=require('node:assert/strict');
const test=require('node:test');
const e=require('../knowledge.js');
test('five complete rounds and level data',()=>{assert.equal(e.LEVELS.length,5);for(const x of e.LEVELS){assert.equal(x.lines.length,5);assert(x.lines.every(l=>l.length>10));}});
test('status cycle and input rule',()=>{assert.equal(e.nextPhase('safe'),'warn');assert.equal(e.nextPhase('warn'),'look');assert.equal(e.nextPhase('look'),'safe');assert(e.canType('warn'));assert(!e.canType('look'));});
test('Thai prefix checks and stars',()=>{assert(e.prefix('ป้าบอกไม่','ป้าบอก'));assert(!e.prefix('ป้าบอกไม่','ไม่'));assert.equal(e.stars(40,70),3);assert.equal(e.stars(12,70),2);assert.equal(e.stars(0,70),0);});
test('clock formatting',()=>{assert.equal(e.clock(70),'01:10');assert.equal(e.clock(-3),'00:00');});
