/* Pure game rules; browser and Node.js compatible. */
(function(root,factory){const lib=factory();if(typeof module==='object'&&module.exports)module.exports=lib;root.PurpleAuntieEngine=lib;})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const LEVELS=[
 {name:'นินทาเบา ๆ',subtitle:'เบา ๆ ก่อนนะป้า',emoji:'🤫',time:78,lines:['ป้าบอกไม่เผือก แต่รู้ทุกเรื่อง','ทำเป็นไม่สน แต่หูไวกว่าใคร','ยังไม่ทันเล่า ป้ารู้แล้ว','เมื่อกี้ใครเรียกชื่อป้านะ','เรื่องนี้เบามาก อย่าบอกใคร']},
 {name:'เรื่องเพื่อนในคณะ',subtitle:'ข่าวไวปานสายฟ้า',emoji:'💬',time:78,lines:['ป้าบอกไม่ยุ่ง แต่ยืนฟังนานมาก','ทำไมข่าวถึงไปถึงป้าเร็วขนาดนี้','แค่กระซิบเบา ๆ ป้าก็ได้ยิน','บอกว่าไม่อยากรู้ แต่ถามทุกวัน','สรุปใครเป็นคนเริ่มเล่าเรื่องนี้']},
 {name:'ดราม่าหอพัก',subtitle:'กำแพงมีหู ป้ามีสองหู',emoji:'🏡',time:75,lines:['เมื่อคืนได้ยินเสียงอะไรหรือเปล่า','ป้ารู้หมดว่าใครกลับกี่โมง','เราแค่เดินผ่าน ไม่ได้แอบฟัง','ป้าบอกว่าห้ามนินทาเด็ดขาด','แต่อยู่ดี ๆ ป้าก็เล่าต่อเอง']},
 {name:'กิจกรรมมหาลัย',subtitle:'ภารกิจลับระหว่างทาง',emoji:'🎓',time:72,lines:['ป้ามาประชุมหรือมาสืบข่าวกันแน่','ใครชวนป้ามางานนี้เนี่ย','อย่าเพิ่งหันมา หนูยังพิมพ์ไม่เสร็จ','แค่จะเล่าข่าวดี แต่ป้าหูไว','มีคนรู้เรื่องนี้ก่อนประกาศอีกนะ']},
 {name:'เรื่องความรัก',subtitle:'ด่านสุดท้าย ห้ามหลุด!',emoji:'💜',time:70,lines:['ป้าถามว่าคุยกับใครอยู่เหรอ','เธอไม่ตอบแชท แต่ป้ารู้หมดแล้ว','รักครั้งนี้ห้ามให้ป้ารู้เด็ดขาด','ป้าบอกอย่ายุ่ง แล้วถามชื่อแฟน','สุดท้ายป้ารู้เรื่องมากกว่าเราอีก']}
 ];
 const SETTINGS={easy:{away:3.85,warn:1.25,look:1.0},normal:{away:3.2,warn:.95,look:1.15},hard:{away:2.65,warn:.65,look:1.35}};
 function split(text){if(typeof Intl!=='undefined'&&Intl.Segmenter){return Array.from(new Intl.Segmenter('th',{granularity:'grapheme'}).segment(text),x=>x.segment);}return Array.from(text);}
 function prefix(text,typed){return String(text).startsWith(String(typed));}
 function canType(phase){return phase==='safe'||phase==='warn';}
 function stars(seconds,initial){if(seconds<=0)return 0;const portion=seconds/initial;return portion>=.40?3:portion>=.17?2:1;}
 function clock(t){const seconds=Math.max(0,Math.ceil(t));return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;}
 function nextPhase(phase){return phase==='safe'?'warn':phase==='warn'?'look':'safe';}
 return {LEVELS,SETTINGS,split,prefix,canType,stars,clock,nextPhase};
});
