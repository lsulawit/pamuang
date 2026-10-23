/* Optional Supabase cloud adapter. Game remains fully playable when not configured. */
(()=>{'use strict';let client=null,loadPromise=null;const conf=window.PURPLE_SUPABASE||{};
const ready=/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(conf.url||'')&&!!conf.anonKey;
async function setup(){if(!ready)throw Error('Supabase ยังไม่ถูกตั้งค่า');if(client)return client;if(loadPromise)return loadPromise;loadPromise=new Promise((resolve,reject)=>{if(window.supabase?.createClient){client=window.supabase.createClient(conf.url,conf.anonKey);resolve(client);return;}const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.10/dist/umd/supabase.min.js';script.onload=()=>{try{client=window.supabase.createClient(conf.url,conf.anonKey);resolve(client);}catch(e){reject(e);}};script.onerror=()=>reject(Error('โหลดไลบรารี Supabase ไม่สำเร็จ'));document.head.appendChild(script);});return loadPromise;}
function check(result){if(result.error)throw result.error;return result.data;}
async function session(){const api=await setup();return check(await api.auth.getUser())?.user||null;}
async function login(email,password){const api=await setup();return check(await api.auth.signInWithPassword({email,password}));}
async function register(email,password){const api=await setup();return check(await api.auth.signUp({email,password}));}
async function google(){const api=await setup();return check(await api.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname}}));}
async function logout(){const api=await setup();return check(await api.auth.signOut());}
async function submitScore({score,mode,name}){const api=await setup(),user=await session();if(!user)throw Error('กรุณาล็อกอินก่อนส่งคะแนน');const row={user_id:user.id,nickname:String(name).slice(0,18),score:Math.max(0,Math.min(999999,score)),mode};const found=check(await api.from('scores').select('score').eq('user_id',user.id).eq('mode',mode).maybeSingle());if(found&&found.score>=row.score)return found;return check(await api.from('scores').upsert(row,{onConflict:'user_id,mode'}).select().single());}
async function topScores(){const api=await setup();return check(await api.from('scores').select('user_id,nickname,score').eq('mode','ranked').order('score',{ascending:false}).limit(40));}
async function roomScores(roomCode){const api=await setup();return check(await api.from('challenge_scores').select('nickname,score').eq('room_code',roomCode).order('score',{ascending:false}).limit(20));}
async function submitRoomScore(roomCode,score,name){const api=await setup(),user=await session();if(!user)throw Error('กรุณาล็อกอินก่อนบันทึกคะแนน');return check(await api.from('challenge_scores').upsert({user_id:user.id,room_code:roomCode,nickname:String(name).slice(0,18),score},{onConflict:'room_code,user_id'}));}
window.PurpleCloud={ready,session,login,register,google,logout,submitScore,topScores,roomScores,submitRoomScore};})();
