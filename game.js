'use strict';
/* NORD BOUNCE — self-contained browser edition. No packages or server required. */
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const WORLD_NAMES=['Nordic Dawn','Stone Flow','Silent Grid','Arctic Echo','Midnight Form'];
const WORLD_DETAILS=['Clear lines. First steps.','Warm minerals and confident angles.','Cool geometry. Precise movement.','Quiet momentum, shifting currents.','The ultimate northern challenge.'];
const SKIN_NAMES=[['Snow','Sage','Sand','Fjord','Clay','Solstice'],['Moss','Stone','Ochre','Slate','Pine','Aurelia'],['Mist','Ice','Lagoon','Storm','Iris','Vesper'],['Graphite','Ink','Berry','Emerald','Copper','Nocturne']];
const SKIN_GROUPS=['NORDIC','TERRAIN','SEA','NOIR'];
const PREMIUM_IDS=new Set(['0-5','1-5','2-5','3-5']);
const SKIN_COST=[0,90,140,190,260,0,340,410,480,550,630,0,740,850,960,1090,1240,0,1450,1620,1810,2030,2290,0];
const POWERS={freeze:{name:'Freeze',cost:50,info:'Keep the blocks from dropping after your next volley.'},pulse:{name:'Pulse',cost:80,info:'Deal three damage to every active block.'},double:{name:'Double',cost:60,info:'Double ball damage during your next volley.'},precision:{name:'Precision Aim',cost:120,info:'Show one additional bounce in the aiming guide for this run.'}};
const STORE_KEY='konhagen.nordbounce.web.v1';
const defaults=()=>({coins:0,best:0,unlocked:1,finished:false,owned:['0-0'],equipped:'0-0',inventory:{freeze:0,pulse:0,double:0,precision:0},stats:{blocks:0,shots:0,bosses:0},claimed:[],dark:false});
let save=defaults();
try{const stored=JSON.parse(localStorage.getItem(STORE_KEY)||'null');if(stored&&typeof stored==='object')save={...save,...stored,owned:Array.isArray(stored.owned)?stored.owned:['0-0'],inventory:{...save.inventory,...stored.inventory},stats:{...save.stats,...stored.stats}};}catch(e){console.warn('Could not load saved progress',e)}
save.unlocked=clamp(Number(save.unlocked)||1,1,100);save.coins=Math.max(0,Number(save.coins)||0);
function persist(){try{localStorage.setItem(STORE_KEY,JSON.stringify(save));}catch(e){console.warn('Storage unavailable',e)}}
let page='home', expandedWorld=Math.floor((save.unlocked-1)/20),shopTab='balls',game=null,raf=null,previousFrame=0;
const SKIN_IMAGES=new Map();for(let g=0;g<4;g++)for(let j=0;j<6;j++){let id=`${g}-${j}`,image=new Image();image.src=`assets/skins/Skin_${g}_${j}.png`;SKIN_IMAGES.set(id,image)}
function setTheme(){document.body.classList.toggle('dark',save.dark);document.documentElement.style.setProperty('color-scheme',save.dark?'dark':'light');$('theme-button').innerHTML=save.dark?'☀ <span class="desktop-only">APPEARANCE</span>':'☾ <span class="desktop-only">APPEARANCE</span>';}
$('theme-button').addEventListener('click',()=>{save.dark=!save.dark;persist();setTheme();if(game)draw()});setTheme();
function openPage(name){if(name==='game')return;page=name;document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s.id===name));if(name==='home')renderHome();if(name==='missions')renderMissions();if(name==='shop')renderShop();if(game && name!=='game'){game.paused=true;game=null}if(name==='game'){}window.scrollTo({top:0,behavior:'instant'});}
document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>openPage(b.dataset.open)));
$('start-journey').addEventListener('click',()=>startGame('journey'));
$('start-endless').addEventListener('click',()=>startGame('endless'));
function renderHome(){ $('home-level').textContent=save.finished?'100 / 100':`${save.unlocked} / 100`;$('home-best').textContent=save.best;$('home-coins').textContent=save.coins;$('start-journey').firstChild.textContent=save.finished?'REPLAY FINAL LEVEL ':'CONTINUE JOURNEY ';}
function completedLevels(){return save.finished?100:save.unlocked-1}
function renderMissions(){
 $('mission-count').textContent=`${completedLevels()} / 100`;$('journey-progress').style.width=`${completedLevels()}%`;
 const container=$('worlds');container.innerHTML='';
 for(let world=0;world<5;world++){
  const first=world*20+1,last=first+19,cleared=clamp((save.finished?101:save.unlocked)-first,0,20),available=save.finished||save.unlocked>=first;
  const card=document.createElement('article');card.className='world-card';
  const head=document.createElement('button');head.className='world-head';head.type='button';head.innerHTML=`<span class="world-index">${available?String(world+1).padStart(2,'0'):'⌁'}</span><span class="world-title"><strong>${WORLD_NAMES[world]}</strong><small>Levels ${first}–${last} · ${cleared}/20 completed</small></span><span class="world-chevron">${expandedWorld===world?'−':'+'}</span>`;
  head.addEventListener('click',()=>{expandedWorld=expandedWorld===world?-1:world;renderMissions()});card.append(head);
  const track=document.createElement('div');track.className='world-track';track.innerHTML=`<div style="width:${cleared*5}%"></div>`;card.append(track);
  if(expandedWorld===world){
   const detail=document.createElement('div');detail.className='world-detail';detail.innerHTML=`<p>${WORLD_DETAILS[world]} · Boss at level ${last}.</p>`;
   const grid=document.createElement('div');grid.className='level-grid';
   for(let level=first;level<=last;level++){
    const won=save.finished||level<save.unlocked,current=!save.finished&&level===save.unlocked,boss=level===last;
    const cell=document.createElement('div');cell.className=`level-cell ${current?'current':won?'won':'locked'}`;
    cell.innerHTML=`<div class="square">${won?'✓':current?level:'⌁'}</div><small>${boss?'BOSS':won?'DONE':current?'NEXT':'LOCKED'}</small>`;grid.append(cell);
   }detail.append(grid);
   if(available){const b=document.createElement('button');b.className='world-action';b.textContent=`${save.finished?'REPLAY LEVEL 100':`PLAY LEVEL ${save.unlocked}`} →`;b.addEventListener('click',()=>startGame('journey'));detail.append(b)}card.append(detail)
  }container.append(card)
 }
 renderMissionsCards();
}
const objectives=[{key:'blocks20',title:'First contact',target:20,reward:60,kind:'blocks'},{key:'blocks60',title:'Finding your rhythm',target:60,reward:100,kind:'blocks'},{key:'blocks150',title:'Careful precision',target:150,reward:160,kind:'blocks'},{key:'shots30',title:'Steady momentum',target:30,reward:100,kind:'shots'},{key:'boss1',title:'First champion',target:1,reward:200,kind:'bosses'},{key:'blocks350',title:'Northern master',target:350,reward:400,kind:'blocks'}];
function renderMissionsCards(){const root=$('mission-cards');root.innerHTML='';objectives.forEach(m=>{const prog=Math.min(m.target,save.stats[m.kind]||0),claimed=save.claimed.includes(m.key);const card=document.createElement('div');card.className='mission-card';card.innerHTML=`<div class="mission-row"><strong>${m.title}</strong><small>${prog} / ${m.target}</small></div><div class="meter"><div style="width:${Math.round(prog/m.target*100)}%"></div></div><div class="mission-row"><small>${m.kind==='blocks'?'Destroy blocks':m.kind==='shots'?'Complete shots':'Defeat a boss'} · +${m.reward} coins</small></div>`;const btn=document.createElement('button');btn.className='claim-button';btn.textContent=claimed?'COLLECTED':prog===m.target?'COLLECT REWARD':'IN PROGRESS';btn.disabled=claimed||prog!==m.target;btn.style.opacity=btn.disabled?'.55':'1';btn.style.marginTop='13px';btn.addEventListener('click',()=>{if(save.claimed.includes(m.key)||prog!==m.target)return;save.claimed.push(m.key);save.coins+=m.reward;persist();renderMissionsCards()});card.append(btn);root.append(card)});}
function renderShop(){ $('shop-coins').textContent=`${save.coins} ◎`;$('tab-balls').classList.toggle('selected',shopTab==='balls');$('tab-powers').classList.toggle('selected',shopTab==='powers');let root=$('shop-content');root.innerHTML='';if(shopTab==='powers'){for(const [id,p]of Object.entries(POWERS)){const card=document.createElement('article');card.className='shop-power';card.innerHTML=`<span class="stock">OWNED ×${save.inventory[id]}</span><h3>${p.name}</h3><p>${p.info}</p>`;const b=document.createElement('button');b.textContent=`BUY · ${p.cost} ◎`;b.disabled=save.coins<p.cost;b.addEventListener('click',()=>{if(save.coins<p.cost)return;save.coins-=p.cost;save.inventory[id]++;persist();renderShop()});card.append(b);root.append(card)}return}
 for(let g=0;g<4;g++){
  const section=document.createElement('section');section.className='shop-collection';section.innerHTML=`<h3>${SKIN_GROUPS[g]}</h3><p>${['Quiet beginnings. Beautifully simple.','Considered lines, warm tones.','Deeper colors, refined details.','Rare pieces with unmistakable presence.'][g]}</p>`;
  const grid=document.createElement('div');grid.className='skin-grid';for(let j=0;j<6;j++){
   const id=`${g}-${j}`,isPremium=PREMIUM_IDS.has(id),name=SKIN_NAMES[g][j],idx=g*6+j,owned=save.owned.includes(id),equipped=save.equipped===id;
   const card=document.createElement('article');card.className=`skin-card ${isPremium?'premium':''}`;
   const img=document.createElement('img');img.src=SKIN_IMAGES.get(id).src;img.alt=name+' ball';card.append(img);
   const title=document.createElement('strong');title.textContent=name;card.append(title);
   const subtitle=document.createElement('small');subtitle.textContent=isPremium?'SIGNATURE · EXCLUSIVE':j===0?'ESSENTIAL':j<3?'REFINED':'COLLECTOR';card.append(subtitle);
   const btn=document.createElement('button');if(equipped){btn.textContent='EQUIPPED';btn.className='equipped';btn.disabled=true}
   else if(owned){btn.textContent='EQUIP';btn.addEventListener('click',()=>{save.equipped=id;persist();renderShop()})}
   else if(isPremium){btn.textContent='PREVIEW ONLY';btn.disabled=true;btn.title='Apple purchases are not available in the web version.'}
   else {btn.textContent=`${SKIN_COST[idx]} ◎`;btn.disabled=save.coins<SKIN_COST[idx];btn.addEventListener('click',()=>{if(save.coins<SKIN_COST[idx])return;save.coins-=SKIN_COST[idx];save.owned.push(id);save.equipped=id;persist();renderShop()})}
   card.append(btn);grid.append(card)
  }section.append(grid);root.append(section)
 }
}
$('tab-balls').addEventListener('click',()=>{shopTab='balls';renderShop()});$('tab-powers').addEventListener('click',()=>{shopTab='powers';renderShop()});
// ------------ Gameplay ------------
// World-space coordinates use y increasing downwards. Ball motion is fixed-step
// and collisions are explicit (no SpriteKit or web libraries).
const canvas=$('game-canvas'),ctx=canvas.getContext('2d',{alpha:false});
const CW=600,CH=850,LEFT=10,RIGHT=590,TOP=10,GROUND=755;
const BALL_R=5.5,CELL=82,GAP=12,START_X=35,TOP_ROW=66,ROW_STEP=86;
function rng(seed){let s=seed>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296}}
function makeLevel(level){
 const world=Math.floor((level-1)/20),within=(level-1)%20+1,boss=within===20,r=rng(level*9137+4711);
 const columns=[0,1,2,3,4,5].sort(()=>r()-.5);
 const slots=columns.slice(0,boss?3:clamp(3+Math.floor(within/7),3,5));
 const blocks=slots.map((col,index)=>({x:START_X+col*(CELL+GAP),y:TOP_ROW,w:CELL,h:CELL,hp:boss&&index===0?Math.round(10+world*3):clamp(1+Math.floor(within*.12)+world+Math.floor(r()*2),1,12),maxHP:0,type:boss&&index===0?'boss':r()<.20?'hard':'normal',boss:boss&&index===0}));
 blocks.forEach(b=>b.maxHP=b.hp);
 const pickups=[];const free=[0,1,2,3,4,5].filter(x=>!slots.includes(x));if(free.length&&!boss&&r()>.28)pickups.push({x:START_X+free[0]*(CELL+GAP)+CELL/2,y:TOP_ROW+CELL/2,hit:false});
 return {blocks,pickups,world,boss};
}
function startGame(mode){
 if(game)game.paused=true;
 const level=mode==='journey'?(save.finished?100:save.unlocked):1;
 const initial=mode==='journey'?makeLevel(level):makeLevel(1);
 const balls=mode==='journey'?Math.min(9,3+Math.floor((level-1)/20)):1;
 game={mode,level,round:level,blocks:initial.blocks,pickups:initial.pickups,boss:initial.boss,world:initial.world,
 count:balls,launchX:CW/2,balls:[],returnX:null,queued:0,shotDir:null,shootElapsed:0,shooting:false,aiming:false,aimPoint:null,
 paused:false,won:false,lost:false,freeze:false,double:false,precision:false,gained:0,cleared:0,combo:0,bossDefeated:false,effects:[],preview:null};
 page='game';document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s.id==='game'));$('game-overlay').classList.add('hidden');
 resizeCanvas();renderGameHeader();renderPowerBar();draw();window.scrollTo(0,0);
}
function renderGameHeader(){if(!game)return;$('game-best').textContent=save.best;$('game-round').textContent=game.mode==='journey'?game.level:game.round;$('game-coins').textContent=save.coins;$('game-mode-caption').textContent=game.mode==='journey'?'LEVEL':'ROUND';$('game-world-name').textContent=game.mode==='journey'?`${WORLD_NAMES[game.world].toUpperCase()} · ${((game.level-1)%20)+1} / 20${game.boss?' · BOSS':''}`:'ENDLESS · SURVIVE AS LONG AS YOU CAN';}
function renderPowerBar(){const root=$('power-bar');root.innerHTML='';if(!game)return;for(const [id,p]of Object.entries(POWERS)){const count=save.inventory[id]||0;if(!count)continue;const btn=document.createElement('button');btn.className=`power ${(id==='freeze'&&game.freeze)||(id==='double'&&game.double)||(id==='precision'&&game.precision)?'selected':''}`;btn.textContent=`${p.name.replace(' Aim','')} ×${count}`;btn.disabled=game.shooting||game.paused||game.lost||game.won||(id==='freeze'&&game.freeze)||(id==='double'&&game.double)||(id==='precision'&&game.precision);btn.addEventListener('click',()=>activatePower(id));root.append(btn)}}
function activatePower(id){if(!game||game.shooting||game.paused||!save.inventory[id]||game.lost||game.won)return;if((id==='freeze'&&game.freeze)||(id==='double'&&game.double)||(id==='precision'&&game.precision))return;save.inventory[id]--;if(id==='freeze')game.freeze=true;else if(id==='double')game.double=true;else if(id==='precision')game.precision=true;else if(id==='pulse'){for(const b of game.blocks){if(b.hp>0){b.hp-=3;if(b.hp<=0)recordBlockDestroyed(b)}}removeDeadBlocks();checkWin()}persist();renderPowerBar();draw()}
function recordBlockDestroyed(b){if(b.counted)return;b.counted=true;game.cleared++;save.stats.blocks++;if(b.boss){game.bossDefeated=true;save.stats.bosses++;effect(b.x+b.w/2,b.y+b.h/2,'boss')}else effect(b.x+b.w/2,b.y+b.h/2,'hit')}
function removeDeadBlocks(){game.blocks=game.blocks.filter(b=>b.hp>0)}
function effect(x,y,type){if(!game)return;game.effects.push({x,y,type,t:0})}
function progressLevel(){if(game.mode!=='journey')return;const beaten=game.level;if(beaten===100){save.finished=true}else if(beaten===save.unlocked){save.unlocked=clamp(beaten+1,1,100)}save.coins+=game.boss?150:20;persist();}
function checkWin(){if(!game||game.won||game.lost||game.mode!=='journey'||game.blocks.length>0)return;game.won=true;game.shooting=false;game.balls=[];progressLevel();renderGameHeader();renderPowerBar();showOverlay('LEVEL COMPLETE',game.level===100?'You finished all 100 levels. An extraordinary journey.':`You cleared level ${game.level}. ${game.boss?'Boss defeated. World completed!':'The next level is now unlocked.'}`,[{label:game.level===100?'REPLAY LEVEL 100':'NEXT LEVEL',fn:()=>startGame('journey')},{label:'MISSIONS & WORLDS',fn:()=>{game=null;openPage('missions')}}],'WELL PLAYED')}
function loseGame(){if(!game||game.lost||game.won)return;game.lost=true;game.shooting=false;game.balls=[];renderPowerBar();showOverlay('GAME OVER',game.mode==='journey'?`Level ${game.level} remains locked until you clear every block. Try again.`:`You reached round ${game.round}. Challenge yourself again.`,[{label:game.mode==='journey'?'RETRY LEVEL':'PLAY AGAIN',fn:()=>startGame(game.mode)},{label:'MAIN MENU',fn:()=>{game=null;openPage('home')}}],'A NEW ATTEMPT')}
function showOverlay(title,description,actions,eyebrow='NORD BOUNCE'){$('overlay-title').textContent=title;$('overlay-text').textContent=description;$('overlay-eyebrow').textContent=eyebrow;const holder=$('overlay-actions');holder.innerHTML='';actions.forEach(a=>{let b=document.createElement('button');b.textContent=a.label;b.addEventListener('click',()=>{$('game-overlay').classList.add('hidden');a.fn()});holder.append(b)});$('game-overlay').classList.remove('hidden')}
$('pause-btn').addEventListener('click',()=>{if(!game||game.lost||game.won)return;game.paused=true;renderPowerBar();showOverlay('PAUSED',game.mode==='journey'?`Level ${game.level} · ${WORLD_NAMES[game.world]}`:`Round ${game.round} · Endless`,[{label:'CONTINUE',fn:()=>{game.paused=false;renderPowerBar()}},{label:'RESTART',fn:()=>startGame(game.mode)},{label:'MAIN MENU',fn:()=>{game=null;openPage('home')}}])});
function launchShot(){if(!game||!game.aiming||game.shooting||game.paused)return;const point=game.aimPoint;game.aiming=false;if(!point){draw();return}let dx=point.x-game.launchX,dy=point.y-(GROUND-17);let angle=Math.atan2(Math.abs(dy),dx);angle=clamp(angle,.27,Math.PI-.27);game.shotDir={x:Math.cos(angle),y:-Math.sin(angle)};game.shooting=true;game.queued=game.count;game.shootElapsed=0;game.returnX=null;game.gained=0;game.cleared=0;save.stats.shots++;persist();renderPowerBar();}
function releaseBall(){if(!game)return;const x=game.launchX,y=GROUND-17;const speed=640;game.balls.push({x,y,vx:game.shotDir.x*speed,vy:game.shotDir.y*speed,done:false,trail:[]});game.queued--;}
function collideBallRect(b,rect){
 const nx=clamp(b.x,rect.x,rect.x+rect.w),ny=clamp(b.y,rect.y,rect.y+rect.h);const dx=b.x-nx,dy=b.y-ny;const ds=dx*dx+dy*dy;
 if(ds>BALL_R*BALL_R)return false;
 let nX=0,nY=0,overlap;
 if(ds>0.00001){const d=Math.sqrt(ds);nX=dx/d;nY=dy/d;overlap=BALL_R-d}else{
  const left=b.x-rect.x,right=rect.x+rect.w-b.x,top=b.y-rect.y,bottom=rect.y+rect.h-b.y;
  let m=Math.min(left,right,top,bottom);if(m===left)nX=-1;else if(m===right)nX=1;else if(m===top)nY=-1;else nY=1;overlap=BALL_R+m;
 }
 b.x+=nX*(overlap+.02);b.y+=nY*(overlap+.02);
 const dot=b.vx*nX+b.vy*nY;if(dot<0){b.vx-=2*dot*nX;b.vy-=2*dot*nY}
 return true;
}
function step(dt){if(!game||game.paused||game.lost||game.won)return;dt=Math.min(dt,.04);if(!game.shooting){game.effects.forEach(e=>e.t+=dt);game.effects=game.effects.filter(e=>e.t<.48);return}
 game.shootElapsed+=dt;
 if(game.queued>0){const fired=Math.min(game.count,Math.floor(game.shootElapsed/.072)+1);const expected=game.count-game.queued;for(let i=expected;i<fired;i++)releaseBall()}
 // substeps reduce chance of tunneling through a narrow tile
 const N=Math.max(1,Math.ceil(dt/.006));const sd=dt/N;
 for(let sub=0;sub<N;sub++){
  for(const b of game.balls){if(b.done)continue;b.x+=b.vx*sd;b.y+=b.vy*sd;
   if(b.x<LEFT+BALL_R){b.x=LEFT+BALL_R;b.vx=Math.abs(b.vx)}if(b.x>RIGHT-BALL_R){b.x=RIGHT-BALL_R;b.vx=-Math.abs(b.vx)}
   if(b.y<TOP+BALL_R){b.y=TOP+BALL_R;b.vy=Math.abs(b.vy)}
   if(b.y>GROUND-BALL_R&&b.vy>0){b.done=true;if(game.returnX===null)game.returnX=clamp(b.x,LEFT+16,RIGHT-16);continue}
   for(const obstacle of game.blocks){if(obstacle.hp<=0||b.hit===obstacle)continue;if(collideBallRect(b,obstacle)){obstacle.hp-=game.double?2:1;if(obstacle.hp<=0)recordBlockDestroyed(obstacle);b.hit=obstacle;break}}
   for(const pickup of game.pickups){if(pickup.hit)continue;const d=Math.hypot(b.x-pickup.x,b.y-pickup.y);if(d<BALL_R+10){pickup.hit=true;game.gained++;effect(pickup.x,pickup.y,'pickup')}}
   if(b.hit){const rect=b.hit;if(b.x<rect.x-6||b.x>rect.x+rect.w+6||b.y<rect.y-6||b.y>rect.y+rect.h+6)b.hit=null}
  }
 }
 game.balls=game.balls.filter(b=>!b.done);removeDeadBlocks();game.effects.forEach(e=>e.t+=dt);game.effects=game.effects.filter(e=>e.t<.48);
 if(game.mode==='journey'&&game.blocks.length===0){checkWin();return}
 if(game.queued===0&&game.balls.length===0)endVolley();
}
function endVolley(){if(!game||!game.shooting)return;game.shooting=false;game.round++;game.count=Math.min(90,game.count+game.gained+(game.mode==='journey'?1:0));game.launchX=game.returnX===null?game.launchX:game.returnX;save.coins+=2+(game.cleared>=4?5:0);game.double=false;const frozen=game.freeze;game.freeze=false;
 if(game.mode==='journey'){
  if(!frozen){for(const b of game.blocks)b.y+=ROW_STEP;for(const p of game.pickups)p.y+=ROW_STEP}
  game.pickups=game.pickups.filter(p=>!p.hit&&p.y<GROUND);
  if(game.blocks.some(b=>b.y+b.h>=GROUND-12)){persist();loseGame();return}
 }else{
  if(!frozen){for(const b of game.blocks)b.y+=ROW_STEP;for(const p of game.pickups)p.y+=ROW_STEP}
  if(game.blocks.some(b=>b.y+b.h>=GROUND-12)){save.best=Math.max(save.best,game.round-1);persist();loseGame();return}
  const more=makeLevel(game.round);game.blocks.push(...more.blocks);game.pickups.push(...more.pickups);save.best=Math.max(save.best,game.round);
 }
 persist();renderGameHeader();renderPowerBar();
}
function firstHit(x,y,dx,dy){
 let best=Infinity,nx=0,ny=0,kind='wall';function consider(t,xn,yn,k){if(t>1e-4&&t<best){best=t;nx=xn;ny=yn;kind=k}}
 if(dx<0)consider((LEFT+BALL_R-x)/dx,1,0,'wall');if(dx>0)consider((RIGHT-BALL_R-x)/dx,-1,0,'wall');if(dy<0)consider((TOP+BALL_R-y)/dy,0,1,'wall');
 for(const b of game.blocks){const r={x:b.x-BALL_R,y:b.y-BALL_R,w:b.w+2*BALL_R,h:b.h+2*BALL_R};let tmin=-Infinity,tmax=Infinity,n1x=0,n1y=0;
  if(Math.abs(dx)<1e-7){if(x<r.x||x>r.x+r.w)continue}else{let a=(r.x-x)/dx,c=(r.x+r.w-x)/dx,near=Math.min(a,c),far=Math.max(a,c);if(near>tmin){tmin=near;n1x=a<c?-1:1;n1y=0}tmax=Math.min(tmax,far)}
  if(Math.abs(dy)<1e-7){if(y<r.y||y>r.y+r.h)continue}else{let a=(r.y-y)/dy,c=(r.y+r.h-y)/dy,near=Math.min(a,c),far=Math.max(a,c);if(near>tmin){tmin=near;n1x=0;n1y=a<c?-1:1}tmax=Math.min(tmax,far)}
  if(tmin<=tmax)consider(tmin,n1x,n1y,'block')
 }
 return {t:Number.isFinite(best)?best:800,nx,ny,kind};
}
function aimPath(){if(!game||!game.aiming)return null;let dx=game.aimPoint.x-game.launchX,dy=game.aimPoint.y-(GROUND-17);let angle=clamp(Math.atan2(Math.abs(dy),dx),.27,Math.PI-.27);dx=Math.cos(angle);dy=-Math.sin(angle);const x=game.launchX,y=GROUND-17;const hit=firstHit(x,y,dx,dy);const pts=[{x,y,dx,dy,distance:hit.t,opacity:.64}];if(game.precision){const reflected={dx:dx-2*(dx*hit.nx+dy*hit.ny)*hit.nx,dy:dy-2*(dx*hit.nx+dy*hit.ny)*hit.ny};const start={x:x+dx*hit.t+reflected.dx*.8,y:y+dy*hit.t+reflected.dy*.8};const second=firstHit(start.x,start.y,reflected.dx,reflected.dy);pts.push({...start,...reflected,distance:second.t,opacity:.37})}return pts}
function pointerPoint(event){const r=canvas.getBoundingClientRect();return {x:clamp((event.clientX-r.left)*CW/r.width,0,CW),y:clamp((event.clientY-r.top)*CH/r.height,0,CH)}}
canvas.addEventListener('pointerdown',e=>{if(!game||game.shooting||game.paused||game.lost||game.won)return;e.preventDefault();canvas.setPointerCapture(e.pointerId);game.aiming=true;game.aimPoint=pointerPoint(e)});
canvas.addEventListener('pointermove',e=>{if(!game||!game.aiming)return;e.preventDefault();game.aimPoint=pointerPoint(e)});
canvas.addEventListener('pointerup',e=>{if(!game||!game.aiming)return;e.preventDefault();game.aimPoint=pointerPoint(e);launchShot()});
canvas.addEventListener('pointercancel',()=>{if(game)game.aiming=false});
function resizeCanvas(){const dpr=Math.min(window.devicePixelRatio||1,2);const rect=canvas.getBoundingClientRect();canvas.width=Math.max(1,Math.round(rect.width*dpr));canvas.height=Math.max(1,Math.round(rect.height*dpr));}
window.addEventListener('resize',()=>{if(game){resizeCanvas();draw()}});
function draw(){if(!game||page!=='game')return;const w=canvas.width,h=canvas.height;if(w<1||h<1)return;ctx.setTransform(w/CW,0,0,h/CH,0,0);
 const dark=save.dark,ink=dark?'#e8ece9':'#242726',muted=dark?'#87918e':'#b0b5b4',bg=dark?'#151918':'#f8f8f6';ctx.fillStyle=bg;ctx.fillRect(0,0,CW,CH);
 // blocks / clean modern Scandinavian colors
 const colors=dark?['#455b56','#637164','#826a67','#886e76']:['#c1cbc7','#b9c8b5','#d4bea8','#bd9fa5'];
 for(const b of game.blocks){let tint=b.boss?colors[3]:b.type==='hard'?colors[1]:colors[0];if(game.world===2&&!b.boss)tint=dark?'#4a5d65':'#bfcbd1';if(game.world===3&&!b.boss)tint=dark?'#456b6c':'#b9d0cc';if(game.world===4&&!b.boss)tint=dark?'#586171':'#c1c5d2';
  ctx.fillStyle=tint;ctx.strokeStyle=b.boss?ink:(dark?'#657672':'#b3c1bd');ctx.lineWidth=b.boss?2.8:1;
  roundedRect(b.x,b.y,b.w,b.h,12);ctx.fill();ctx.stroke();ctx.fillStyle=dark?'#1c2422':'#3d4442';ctx.font=`${b.boss?'24':'19'}px -apple-system,BlinkMacSystemFont,Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(Math.max(0,b.hp)),b.x+b.w/2,b.y+b.h/2+(b.boss?8:1));if(b.boss){ctx.font='20px Arial';ctx.fillText('✦',b.x+b.w/2,b.y+18)}
 }
 for(const p of game.pickups)if(!p.hit){ctx.strokeStyle=ink;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(p.x,p.y,16,0,Math.PI*2);ctx.stroke();ctx.fillStyle=ink;ctx.font='26px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('+',p.x,p.y+1)}
 // floor
 ctx.strokeStyle=dark?'#424e4a':'#d6dbd7';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(28,GROUND+17);ctx.lineTo(CW-28,GROUND+17);ctx.stroke();
 // guide: dots stop at first impact unless Precision is active
 const paths=aimPath();if(paths)for(const segment of paths){ctx.fillStyle=dark?`rgba(208,219,215,${segment.opacity})`:`rgba(85,99,95,${segment.opacity})`;const interval=19;for(let d=interval;d<=segment.distance;d+=interval){const px=segment.x+segment.dx*d,py=segment.y+segment.dy*d;ctx.beginPath();ctx.arc(px,py,3.35,0,Math.PI*2);ctx.fill()}}
 // moving balls and shooter use the exact shop skin texture
 const skin=SKIN_IMAGES.get(save.equipped),ready=skin&&skin.complete&&skin.naturalWidth>0;
 function paintBall(x,y,r){if(ready)ctx.drawImage(skin,x-r,y-r,r*2,r*2);else{ctx.fillStyle=ink;ctx.beginPath();ctx.arc(x,y,r*.83,0,Math.PI*2);ctx.fill()}}
 if(!game.shooting&&!game.won){paintBall(game.launchX,GROUND-17,15);ctx.font='17px Arial';ctx.fillStyle=muted;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(`×${game.count}`,game.launchX,GROUND-60)}
 for(const b of game.balls){paintBall(b.x,b.y,9)}
 for(const e of game.effects){const f=e.t/.48;ctx.strokeStyle=e.type==='boss'?`rgba(160,120,137,${1-f})`:e.type==='pickup'?`rgba(105,153,139,${1-f})`:`rgba(110,145,136,${.42*(1-f)})`;ctx.lineWidth=e.type==='boss'?2.6:1.5;for(let i=0;i<(e.type==='boss'?3:1);i++){ctx.beginPath();ctx.arc(e.x,e.y,(12+i*12)+f*(50+i*8),0,Math.PI*2);ctx.stroke()}}
}
function roundedRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function loop(ts){let dt=previousFrame?(ts-previousFrame)/1000:0;previousFrame=ts;if(game&&page==='game'){step(dt);draw()}raf=requestAnimationFrame(loop)}
requestAnimationFrame(loop);renderHome();
