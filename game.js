(()=>{
'use strict';
const E=window.PurpleAuntieEngine;
const $=id=>document.getElementById(id);
const SCREENS=['homeScreen','levelsScreen','gameScreen','resultScreen','helpScreen','settingsScreen'];
const DEFAULT={unlocked:0,coins:0,stars:[0,0,0,0,0],best:[0,0,0,0,0],sound:true,vibrate:true,assist:true,difficulty:'easy'};
function load(){try{const raw=JSON.parse(localStorage.getItem('purpleAuntieSaveV3')||'{}');return {...DEFAULT,...raw,stars:Array.isArray(raw.stars)?raw.stars.slice(0,5):[0,0,0,0,0],best:Array.isArray(raw.best)?raw.best.slice(0,5):[0,0,0,0,0]};}catch{return {...DEFAULT};}}
let save=load();
function persist(){try{localStorage.setItem('purpleAuntieSaveV3',JSON.stringify(save));}catch{}}
let screen='homeScreen',returnScreen='homeScreen',nativeMode=false,toastTimer=0,audioCtx;
const game={running:false,paused:false,level:0,round:0,typed:'',score:0,time:0,phase:'safe',phaseTime:0,held:new Set(),lastFrame:0};
function show(id){SCREENS.forEach(s=>$(s).classList.toggle('active',s===id));screen=id; if(id!=='gameScreen')game.running=false; if(id==='levelsScreen')renderLevels(); if(id==='settingsScreen')renderSettings();}
function notify(text){const el=$('toast');el.textContent=text;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),1450);}
function sound(freq=600,seconds=.1,wave='sine'){if(!save.sound)return;try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain(),now=audioCtx.currentTime;o.type=wave;o.frequency.setValueAtTime(freq,now);o.frequency.exponentialRampToValueAtTime(Math.max(freq*.72,70),now+seconds);g.gain.setValueAtTime(.055,now);g.gain.exponentialRampToValueAtTime(.001,now+seconds);o.connect(g);g.connect(audioCtx.destination);o.start(now);o.stop(now+seconds+.01);}catch{}}
function vibrate(ms=40){if(save.vibrate&&navigator.vibrate)navigator.vibrate(ms);}
function currentLevel(){return E.LEVELS[game.level];}
function currentText(){return currentLevel().lines[game.round]||'';}
function renderLevels(){
 $('levelProgress').textContent=`${Math.min(5,save.unlocked+(save.stars[4]?1:0))}/5`;
 $('coinCount').textContent=save.coins;
 $('levelList').replaceChildren();
 E.LEVELS.forEach((level,i)=>{
  const unlocked=i<=save.unlocked,btn=document.createElement('button');btn.type='button';btn.className='level-card'+(unlocked?'':' locked');btn.disabled=!unlocked;
  const earned=save.stars[i]||0;
  btn.innerHTML=`<span class="level-emoji">${unlocked?level.emoji:'🔒'}</span><span class="level-details"><span class="level-no">Lv.${i+1}</span><span class="level-name">${level.name}</span><span class="level-sub">${level.subtitle}</span><span class="level-stars">${[0,1,2].map(n=>n<earned?'⭐':'☆').join('')}</span></span><span class="level-arrow">${unlocked?'▶':'🔐'}</span>`;
  btn.addEventListener('click',()=>startLevel(i));$('levelList').append(btn);
 });
}
function tryOrientationLock(){try{const result=window.screen?.orientation?.lock?.('portrait');if(result?.catch)result.catch(()=>{});}catch{}}
function startLevel(level){if(level>save.unlocked){notify('ผ่านด่านก่อนหน้าเพื่อปลดล็อกนะ 💜');return;}game.running=true;game.paused=false;game.level=level;game.round=0;game.typed='';game.score=0;game.time=currentLevel().time;game.phase='safe';game.phaseTime=E.SETTINGS[save.difficulty].away;game.held.clear();game.lastFrame=performance.now();nativeMode=false;$('editorPanel').classList.remove('native');$('pauseLayer').classList.add('hidden');$('realInput').value='';$('realInput').blur();show('gameScreen');game.running=true;renderPhrase();renderHUD();renderPhase();tryOrientationLock();sound(620,.14);}
function renderHUD(){
 $('roundHud').textContent=`${game.round}/5`;
 $('roundProgress').style.width=`${Math.round(game.round/5*100)}%`;
 $('timeHud').textContent=E.clock(game.time);
 $('scoreHud').textContent=game.score;
}
function renderPhrase(){
 const line=currentText(),segments=E.split(line),count=E.split(game.typed).length;
 const holder=$('targetLine');holder.replaceChildren();
 segments.forEach((char,i)=>{const span=document.createElement('span');span.textContent=char;span.className=i<count?'done':i===count?'next':'';holder.append(span);});
 $('inputDisplay').textContent=game.typed;
 $('placeholder').classList.toggle('hidden',!!game.typed);
 $('realInput').value=game.typed;
 renderHUD();
}
function renderPhase(){
 const stage=$('gameStage'),badge=$('statusBadge');stage.classList.toggle('warning',game.phase==='warn');stage.classList.toggle('looking',game.phase==='look');badge.className='status-badge '+(game.phase==='safe'?'safe':game.phase==='warn'?'warn':'look');
 $('statusLabel').textContent=game.phase==='safe'?'พิมพ์ได้!':game.phase==='warn'?'ระวัง! ป้าจะหัน':'หยุดพิมพ์!';
 $('stageCaption').textContent=game.phase==='safe'?'ป้าหันหลังอยู่ พิมพ์ได้เลย':game.phase==='warn'?'เสียงฝีเท้าป้าใกล้เข้ามา…':'ป้ามองอยู่! ห้ามกดปุ่มเด็ดขาด';
}
function advancePhase(){game.phase=E.nextPhase(game.phase);const pace=E.SETTINGS[save.difficulty];game.phaseTime=game.phase==='safe'?pace.away:game.phase==='warn'?pace.warn:pace.look;renderPhase();if(game.phase==='warn'){sound(780,.14,'triangle');vibrate(50);}else if(game.phase==='look'){sound(300,.28,'sawtooth');vibrate([70,50,70]);if(game.held.size)lose('โดนจับได้!','ยังแตะแป้นอยู่ตอนป้าหันมา');}else sound(560,.08);}
function tick(now){requestAnimationFrame(tick);const dt=Math.min(.08,Math.max(0,(now-game.lastFrame)/1000));game.lastFrame=now;if(!game.running||game.paused||screen!=='gameScreen'||document.hidden)return;game.time=Math.max(0,game.time-dt);game.phaseTime-=dt;
 if(game.time<=0){lose('หมดเวลา!','ยังเมาท์ไม่ครบ 5 ประโยคเลย');return;}
 if(game.phaseTime<=0)advancePhase();renderHUD();}
function addGrapheme(char){if(!game.running||game.paused)return;if(game.phase==='look'){lose('โดนจับได้!','ป้ามองเห็นว่ายังพิมพ์อยู่');return;}
 const goal=currentText(),next=game.typed+char;if(!E.prefix(goal,next)){sound(175,.09);notify('ตัวอักษรไม่ตรง ลองใหม่อีกครั้ง');return;}
 game.typed=next;game.score+=10;renderPhrase();sound(700+((game.typed.length%5)*80),.035);
 if(game.typed===goal){finishPhrase();}
}
function finishPhrase(){game.score+=120;game.round+=1;game.typed='';sound(1100,.25);vibrate(80);if(game.round>=5){win();return;}renderPhrase();notify(`สุดยอด! ผ่าน ${game.round}/5 ประโยค ⭐`);}
function onVirtualKey(char,ev){if(!game.running||game.paused)return;if(game.phase==='look'){lose('โดนจับได้!','ป้าหันมาแล้ว แต่ยังแตะคีย์บอร์ด');return;}
 if(char==='BACK'){const segments=E.split(game.typed);segments.pop();game.typed=segments.join('');renderPhrase();sound(290,.05);return;}
 const target=E.split(currentText()),position=E.split(game.typed).length;
 if(char==='HINT'){if(save.assist){addGrapheme(target[position]||'');return;}game.score=Math.max(0,game.score-5);addGrapheme(target[position]||'');return;}
 if(char==='SPACE')char=' ';
 if(save.assist){addGrapheme(target[position]||'');return;}
 addGrapheme(char);
}
function onPhysicalText(){if(!game.running||game.paused)return;
 if(game.phase==='look'){lose('โดนจับได้!','ป้าหันมาแล้ว แต่ยังพิมพ์อยู่');return;}
 const incoming=$('realInput').value;
 if(incoming===game.typed)return;
 if(E.prefix(currentText(),incoming)&&incoming.length>=game.typed.length){
  game.score+=Math.max(1,E.split(incoming).length-E.split(game.typed).length)*10;
  game.typed=incoming;renderPhrase();if(game.typed===currentText())finishPhrase();
 }else if(E.prefix(currentText(),incoming)&&incoming.length<game.typed.length){game.typed=incoming;renderPhrase();}
 else{$('realInput').value=game.typed;notify('พิมพ์ให้ตรงตามประโยคที่แสดงนะ');sound(210,.08);}
}
function endGame(ok,title,description){game.running=false;game.paused=false;game.held.clear();$('realInput').blur();$('pauseLayer').classList.add('hidden');$('resultScreen').classList.toggle('lost',!ok);$('resultHeading').textContent=title;$('resultCaption').textContent=description;
 const earned=ok?E.stars(game.time,currentLevel().time):0;
 $('resultStars').textContent=ok?Array.from({length:3},(_,i)=>i<earned?'⭐':'☆').join(''):'💔 👀 💔';
 const reward=ok?80+(earned*35):0;
 $('resultScore').textContent=game.score;$('resultTime').textContent=`${Math.ceil(game.time)} วิ`;$('resultCoins').textContent=reward;
 if(ok){save.coins+=reward;save.unlocked=Math.max(save.unlocked,Math.min(E.LEVELS.length-1,game.level+1));save.stars[game.level]=Math.max(save.stars[game.level]||0,earned);save.best[game.level]=Math.max(save.best[game.level]||0,game.score);persist();}
 $('resultSubline').textContent=ok?earned===3?'ยอดเยี่ยม! ได้ครบ 3 ดาว 💜':'เก่งมาก! ลองเก็บให้ครบ 3 ดาวดูนะ':'หยุดพิมพ์ให้ทัน แล้วลองใหม่อีกครั้งนะ';
 $('resultNext').classList.toggle('hidden',!ok);
 $('resultNext').textContent=game.level>=E.LEVELS.length-1?'🏆 เล่นด่านสุดท้ายอีกครั้ง':'เล่นด่านต่อไป ▶';
 show('resultScreen');sound(ok?990:230,.3);vibrate(ok?[90,70,100]:[160,90,160]);
}
function win(){endGame(true,'ผ่านด่าน!','ป้าจับไม่ได้ เก่งมาก! 🎉');}
function lose(title,desc){if(!game.running)return;endGame(false,title,desc);}
function pause(){if(!game.running||game.paused)return;game.paused=true;game.held.clear();$('realInput').blur();$('pauseLayer').classList.remove('hidden');}
function resume(){if(!game.running)return;game.paused=false;game.lastFrame=performance.now();$('pauseLayer').classList.add('hidden');}
function keyboardSetup(){const rows=[['ๆ','ไ','ำ','พ','ะ','ั','ี','ร','น','ย','บ','ล'],['ฟ','ห','ก','ด','เ','้','่','า','ส','ว','ง','ข'],['ผ','ป','แ','อ','ิ','ื','ท','ม','ใ','ฝ','ถ','ค']];
 rows.forEach((row,index)=>{const root=$('keyRow'+(index+1));row.forEach(key=>{const b=document.createElement('button');b.className='key';b.type='button';b.textContent=key;b.dataset.char=key;root.append(b);});});
 const bindKey=(el,char)=>{
  el.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;game.held.add(e.pointerId);el.classList.add('pressed');e.preventDefault();onVirtualKey(char,e);});
  for(const evt of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(evt,e=>{game.held.delete(e.pointerId);el.classList.remove('pressed');});
 };
 document.querySelectorAll('[data-char]').forEach(k=>bindKey(k,k.dataset.char));
 bindKey($('keyHint'),'HINT');bindKey($('keySpace'),'SPACE');bindKey($('keyBack'),'BACK');bindKey($('keyEnter'),'HINT');
}
function renderSettings(){$('soundSetting').checked=save.sound;$('vibrateSetting').checked=save.vibrate;$('assistMode').classList.toggle('selected',save.assist);$('strictMode').classList.toggle('selected',!save.assist);document.querySelectorAll('[data-difficulty]').forEach(btn=>btn.classList.toggle('selected',btn.dataset.difficulty===save.difficulty));}
function fromModal(){show(returnScreen==='gameScreen'?'levelsScreen':returnScreen);}
function openHelp(){returnScreen=screen;show('helpScreen');}
function openSettings(){returnScreen=screen;show('settingsScreen');}
function bind(){
 keyboardSetup();
 $('homeStart').onclick=()=>startLevel(Math.min(save.unlocked,4));
 $('homeSound').onclick=()=>{save.sound=!save.sound;persist();notify(save.sound?'เปิดเสียงแล้ว 🔊':'ปิดเสียงแล้ว 🔇');sound(840,.1);};
 $('homeHelp').onclick=openHelp;$('homeSettings').onclick=openSettings;
 $('openLevels').onclick=()=>show('levelsScreen');$('levelsBack').onclick=()=>show('homeScreen');$('levelsHelp').onclick=openHelp;
 document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>{const n=b.dataset.nav;if(n==='home')show('homeScreen');else if(n==='levels')show('levelsScreen');else if(n==='help')openHelp();else openSettings();});
 $('gameHome').onclick=()=>{pause();};$('gamePause').onclick=pause;$('resumeGame').onclick=resume;$('restartGame').onclick=()=>startLevel(game.level);$('quitGame').onclick=()=>{game.running=false;$('pauseLayer').classList.add('hidden');show('levelsScreen');};
 $('nativeToggle').onclick=()=>{nativeMode=true;$('editorPanel').classList.add('native');$('realInput').value=game.typed;$('realInput').focus();notify('พิมพ์เองด้วยคีย์บอร์ดเครื่องได้เลย');};
 $('realInput').addEventListener('beforeinput',e=>{if(e.inputType==='insertFromPaste'||e.inputType==='insertFromDrop')e.preventDefault();if(game.phase==='look'&&game.running){e.preventDefault();lose('โดนจับได้!','ป้าหันมาแล้ว แต่ยังพิมพ์อยู่');}});
 $('realInput').addEventListener('input',onPhysicalText);
 $('realInput').addEventListener('keydown',e=>{if(game.phase==='look'&&game.running&&e.key.length===1){e.preventDefault();lose('โดนจับได้!','ป้าเห็นพิมพ์ต่อหน้าต่อตา');}if(e.key==='Escape'){e.preventDefault();pause();}});
 $('resultMenu').onclick=()=>show('levelsScreen');$('resultRetry').onclick=()=>startLevel(game.level);$('resultNext').onclick=()=>startLevel(Math.min(game.level+1,4));
 document.querySelectorAll('[data-back]').forEach(b=>b.onclick=fromModal);
 $('helpPlay').onclick=()=>startLevel(Math.min(save.unlocked,4));$('saveSettings').onclick=()=>{persist();fromModal();};
 $('soundSetting').onchange=e=>{save.sound=e.target.checked;persist();if(save.sound)sound(660,.1);};
 $('vibrateSetting').onchange=e=>{save.vibrate=e.target.checked;persist();};
 $('assistMode').onclick=()=>{save.assist=true;persist();renderSettings();};$('strictMode').onclick=()=>{save.assist=false;persist();renderSettings();};
 document.querySelectorAll('[data-difficulty]').forEach(b=>b.onclick=()=>{save.difficulty=b.dataset.difficulty;persist();renderSettings();});
 $('resetProgress').onclick=()=>{if(!window.confirm('ล้างคะแนน ดาว และด่านที่ปลดล็อกทั้งหมดในเครื่องนี้?'))return;const settings={sound:save.sound,vibrate:save.vibrate,assist:save.assist,difficulty:save.difficulty};save={...DEFAULT,...settings,stars:[0,0,0,0,0],best:[0,0,0,0,0]};persist();notify('ล้างสถิติแล้ว');};
 window.addEventListener('keydown',e=>{if(e.key==='Escape'&&screen==='gameScreen'&&game.running){e.preventDefault();game.paused?resume():pause();}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.running)pause();game.lastFrame=performance.now();});
 window.addEventListener('blur',()=>{if(game.running)pause();});
 document.addEventListener('contextmenu',e=>{if(e.target.closest('.keyboard'))e.preventDefault();});
 requestAnimationFrame(tick);
}
bind();
})();
