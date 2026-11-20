// Deterministic 60 Hz simulation shared by the browser and the headless runner.
'use strict';

const TICK = 1 / 60;
const RAD = Math.PI / 180;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist2 = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
const round3 = n => Math.round(n * 1000) / 1000;
const clone = x => JSON.parse(JSON.stringify(x));
const compareId = (a,b) => { const ma=String(a).match(/^(.*?)(\d+)$/),mb=String(b).match(/^(.*?)(\d+)$/); if(ma&&mb&&ma[1]===mb[1])return Number(ma[2])-Number(mb[2]); return String(a).localeCompare(String(b)); };

class RNG {
  constructor(seed) { this.s = (Number(seed) >>> 0) || 0x6d2b79f5; }
  next() { let x = this.s; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; this.s = x >>> 0; return this.s / 4294967296; }
  int(n) { return Math.floor(this.next() * n); }
}

function point(r, angle, y = 0, cx = 0, cz = 0) {
  const a = angle * RAD;
  return [round3(cx + Math.cos(a) * r), y, round3(cz + Math.sin(a) * r)];
}
function makeNight(n) {
  const lanterns = [], moteSpawns = [], shadeSpawns = [];
  if (n === 1) {
    [[0,25],[23.8,7.7],[14.7,-20.2],[-14.7,-20.2],[-23.8,7.7]].forEach((p,i)=>lanterns.push({id:`L${i+1}`,pos:[p[0],0,p[1]]}));
    for (let a=0;a<360;a+=45) moteSpawns.push(point(12,a));
    for (let a=0;a<360;a+=22.5) moteSpawns.push(point(33,a));
    for (let a=15;a<360;a+=30) shadeSpawns.push(point(37,a));
  } else if (n === 2) {
    [[0,20],[17,-10],[-17,-10],[70,20],[87,-10],[53,-10]].forEach((p,i)=>lanterns.push({id:`L${i+1}`,pos:[p[0],0,p[1]]}));
    for (const cx of [0,70]) {
      for (let a=0;a<360;a+=90) moteSpawns.push(point(10,a,0,cx));
      for (let a=0;a<360;a+=45) moteSpawns.push(point(22,a,0,cx));
      for (let a=22.5;a<360;a+=45) shadeSpawns.push(point(26,a,0,cx));
    }
  } else {
    [[0,6,6],[18,3,10],[-18,3,10],[35,0,-10],[-35,0,-10],[20,0,-35],[-20,0,-35]].forEach((p,i)=>lanterns.push({id:`L${i+1}`,pos:p}));
    for (let a=0;a<360;a+=20) moteSpawns.push(point(34,a));
    for (let a=20;a<=160;a+=20) moteSpawns.push(point(18,a,3));
    for (const a of [45,135,225,315]) moteSpawns.push(point(5,a,6));
    for (let a=0;a<360;a+=22.5) shadeSpawns.push(point(43,a));
  }
  return {lanterns, moteSpawns, shadeSpawns};
}

class GameSim {
  constructor({seed=1, night=1, scenario=null}={}) {
    this.seed = Number(seed) || 1; this.rng = new RNG(this.seed); this.night = Number(night);
    if (![1,2,3].includes(this.night)) throw new Error('night must be 1, 2, or 3');
    this.map = makeNight(this.night);
    this.wallTick = 0; this.simTick = 0; this.score = 0; this.events = [];
    this.duration = [0,240,270,300][this.night]; this.timeLeft = this.duration;
    this.state = 'playing'; this.result = null; this.reason = null; this.paused = false;
    this.player = {pos:[0,0,0],vel:[0,0,0],flames:3,carried:0,capacity:10,successfulLights:0,grounded:true,invuln:0,dashCd:0,pulseCd:0,charm:0,face:[0,0,1],dashTicks:0,dashDir:[0,0,1],launching:false,launchVel:[0,0],respawn:0,fallHandled:false,score:0};
    this.lanterns = this.map.lanterns.map(x=>({...clone(x),deposited:0,lit:false,fuelTicks:0,ever_lit:false,relit_count:0,safePush:0}));
    this.motes=[]; this.shades=[]; this.drifters=[]; this.charms=[];
    this.randomMotes=true; this.randomShades=true; this.randomDrifters=true; this.windEnabled=this.night===3;
    this.lastInput={move:[0,0],yaw:0,jump:false,interact:false,pulse:false,dash:false,pause:false};
    this.lastRaw={jump:false,interact:false,pulse:false,dash:false,pause:false};
    this.spawnedShades=0; this.spawnedDrifters=0; this.spawnedMotes=0;
    this.wind={active:false,dir_deg:0}; this.windPhase=0; this.windWarning=false;
    this.nightStartEmitted=false; this.freshDropped=[];
    this.initDefaults();
    if (scenario) this.applyScenario(scenario);
    this.events.push({type:'event',tick:0,name:'night_start',data:{night:this.night}});
  }
  initDefaults() {
    const spawns=this.map.moteSpawns;
    for (let i=0;i<Math.min(20,spawns.length);i++) this.motes.push({id:`M${i+1}`,pos:clone(spawns[i]),kind:'random',ttl:0,spawnIndex:i});
    if (this.night===2) this.charms=[{id:'C1',pos:[35,0,0],available:true,respawn:0}];
    if (this.night===3) this.charms=[{id:'C1',pos:[30,0,25],available:true,respawn:0},{id:'C2',pos:[-30,0,25],available:true,respawn:0}];
    this.randomMotes=true; this.randomShades=true;
  }
  applyScenario(s) {
    if (!s || typeof s!=='object' || Array.isArray(s)) throw new Error('scenario must be a JSON object');
    const p=s.player||{};
    if (p.pos) { if (!Array.isArray(p.pos)||p.pos.length!==3||p.pos.some(x=>!Number.isFinite(x))) throw new Error('scenario.player.pos must have 3 numbers'); this.player.pos=p.pos.map(Number); }
    for (const [key,target] of [['carried','carried'],['flames','flames']]) if (p[key]!==undefined) { if (!Number.isFinite(p[key])) throw new Error(`scenario.player.${key} must be numeric`); this.player[target]=Number(p[key]); }
    if(p.successful_lights!==undefined){if(!Number.isInteger(p.successful_lights)||p.successful_lights<0)throw new Error('scenario.player.successful_lights must be a non-negative integer');this.player.successfulLights=p.successful_lights;}
    this.player.capacity=Math.min(20,10+2*this.player.successfulLights);
    this.player.carried=clamp(Math.floor(this.player.carried),0,this.player.capacity); this.player.flames=clamp(Math.floor(this.player.flames),0,3);
    for (const [k,dst] of [['invuln_ticks','invuln'],['dash_cd_ticks','dashCd'],['pulse_cd_ticks','pulseCd'],['charm_ticks','charm']]) if (p[k]!==undefined) this.player[dst]=Math.max(0,Math.floor(p[k]));
    for (const f of ['random_motes','random_shades','random_drifters','wind_enabled']) if (s[f]!==undefined) this[{random_motes:'randomMotes',random_shades:'randomShades',random_drifters:'randomDrifters',wind_enabled:'windEnabled'}[f]]=!!s[f];
    if (Array.isArray(s.motes)) this.motes=s.motes.map((x,i)=>({id:(x&&x.id)||`M${i+1}`,pos:this.validPos(Array.isArray(x)?x:x.pos,`motes[${i}].pos`),kind:(x&&x.kind)||'random',ttl:0}));
    if (Array.isArray(s.shades)) this.shades=s.shades.map((x,i)=>{const state=x.state||'chase';if(!['spawning','wander','chase','recoil','stunned','drain'].includes(state))throw new Error(`shades[${i}].state is invalid`);const ticks=Math.max(0,Math.floor(x.state_ticks_left||0));return{id:x.id||`S${i+1}`,pos:this.validPos(x.pos,`shades[${i}].pos`),state,stateTicksLeft:ticks,recoil:state==='recoil'?ticks:0,recoilDir:[1,0],stun:state==='stunned'?ticks:0,pushTicks:0,pushDir:[1,0],safePush:0,target_lantern_id:x.target_lantern_id||null,drainTicks:0};});
    if (Array.isArray(s.drifters)) this.drifters=s.drifters.map((x,i)=>({id:x.id||`D${i+1}`,pos:this.validPos(x.pos,`drifters[${i}].pos`),state:x.state||'idle',stolen:x.stolen||0,timer:x.state_ticks_left||0,stealDone:!!x.stolen}));
    if (Array.isArray(s.charms)) this.charms=s.charms.map((x,i)=>({id:x.id||`C${i+1}`,pos:this.validPos(x.pos||[0,0,0],`charms[${i}].pos`),available:x.available!==false,respawn:x.respawn_ticks||0}));
    if (Array.isArray(s.lanterns)) for (const x of s.lanterns) { const l=this.lanterns.find(y=>y.id===x.id); if (!l) continue; if(x.pos)l.pos=this.validPos(x.pos,`lantern ${x.id}.pos`); if(Number.isFinite(x.deposited))l.deposited=Math.max(0,Math.floor(x.deposited)); if(x.fuel!==undefined&&(!Number.isFinite(x.fuel)||x.fuel<0||x.fuel>100))throw new Error(`scenario lantern ${x.id}.fuel must be in [0,100]`); if(x.lit===true||(!Object.hasOwn(x,'lit')&&Number(x.fuel)>0)){l.lit=true;l.fuelTicks=Math.round((x.fuel===undefined?100:x.fuel)*60);l.ever_lit=x.ever_lit===undefined?true:!!x.ever_lit;}else{l.lit=false;l.fuelTicks=0;l.ever_lit=!!x.ever_lit;} }
    if (s.time_left_s!==undefined) { if (!Number.isFinite(s.time_left_s)||s.time_left_s<0) throw new Error('scenario.time_left_s must be >= 0'); this.timeLeft=Math.min(this.duration,s.time_left_s); }
  }
  validPos(v,label) { if(!Array.isArray(v)||v.length!==3||v.some(x=>!Number.isFinite(x))) throw new Error(`${label} must have 3 numbers`); return v.map(Number); }
  emit(name,data={}) { this.events.push({type:'event',tick:this.wallTick,name,data}); }
  pressEdge(name, raw) { const edge=!!raw && !this.lastRaw[name]; this.lastRaw[name]=!!raw; return edge; }
  setInput(input={}) {
    const raw={...this.lastInput,...input};
    if(raw.move!==undefined && (!Array.isArray(raw.move)||raw.move.length!==2||raw.move.some(v=>!Number.isFinite(v)||v< -1||v>1))) throw new Error('input move must be [x,z] in [-1,1]');
    if(raw.cam_yaw_deg!==undefined&&!Number.isFinite(raw.cam_yaw_deg))throw new Error('cam_yaw_deg must be numeric');
    for(const k of ['jump','interact','pulse','dash','pause']) if(raw[k]!==undefined&&typeof raw[k]!=='boolean')throw new Error(`${k} must be boolean`);
    let [x,z]=raw.move||[0,0]; const m=Math.hypot(x,z); if(m>1){x/=m;z/=m;}
    const yaw=(raw.cam_yaw_deg||0)*RAD; const world=[x*Math.cos(yaw)+z*Math.sin(yaw),-x*Math.sin(yaw)+z*Math.cos(yaw)];
    this.lastInput={move:[x,z],yaw:raw.cam_yaw_deg||0,jump:!!raw.jump,interact:!!raw.interact,pulse:!!raw.pulse,dash:!!raw.dash,pause:!!raw.pause};
    return {jump:this.pressEdge('jump',raw.jump),interact:this.pressEdge('interact',raw.interact),pulse:this.pressEdge('pulse',raw.pulse),dash:this.pressEdge('dash',raw.dash),pause:this.pressEdge('pause',raw.pause),world};
  }
  tick(input={}) {
    this.wallTick++; this.events=[];
    const act=this.setInput(input);
    if (act.pause) { this.paused=!this.paused; this.emit(this.paused?'paused':'resumed',{}); }
    if(this.paused || this.state!=='playing') return;
    this.simTick++; this.timeLeft=Math.max(0,this.timeLeft-TICK);
    this.decrementCounters();
    this.updateLanternFuel();
    this.movePlayer(act);
    this.pickups();
    if(act.interact)this.interact();
    this.updateSafeZones();
    if(act.pulse)this.pulse();
    this.moveShades(); this.moveDrifters();
    this.collisions();
    this.spawnSchedules(); this.updateWind();
    this.checkEnd();
  }
  decrementCounters(){
    const p=this.player;
    for(const k of ['invuln','dashCd','pulseCd','charm','respawn']) if(p[k]>0)p[k]--;
    for(const m of this.motes)if(m.ttl>0)m.ttl--;
    this.motes=this.motes.filter(m=>m.ttl!==0||m.kind==='random');
    for(const l of this.lanterns)if(l.safePush>0)l.safePush--;
    for(const s of this.shades) {if(s.stun>0)s.stun--; if(s.pushTicks>0)s.pushTicks--; if(s.safePush>0)s.safePush--; if(s.stateTicksLeft>0)s.stateTicksLeft--;}
    for(const d of this.drifters){if(d.timer>0)d.timer--;}
    for(const c of this.charms)if(!c.available&&c.respawn>0&&--c.respawn===0)c.available=true;
  }
  turnLanternOut(l){if(!l.lit)return;l.lit=false;l.fuelTicks=0;l.deposited=0;this.emit('lantern_out',{lantern_id:l.id});}
  updateLanternFuel(){
    for(const l of this.lanterns)if(l.lit){l.fuelTicks=Math.max(0,l.fuelTicks-1);if(l.fuelTicks<=0)this.turnLanternOut(l);}
    const drainers=this.shades.filter(s=>s.state==='drain').sort((a,b)=>compareId(a.id,b.id));
    for(const s of drainers){const l=this.lanterns.find(x=>x.id===s.target_lantern_id);if(!l||!l.lit)continue;l.fuelTicks=Math.max(0,l.fuelTicks-5);s.drainTicks++;if(s.drainTicks%60===0)this.emit('fuel_drain',{lantern_id:l.id,shade_id:s.id,fuel:this.fuel(l)});if(l.fuelTicks<=0)this.turnLanternOut(l);}
  }
  fuel(l){return Math.round(l.fuelTicks/6)/10;}
  currentGround(x,z,feetY=0) {
    if(this.night===2) return Math.hypot(x,z)<=28 || Math.hypot(x-70,z)<=28 || (x>=26&&x<=44&&Math.abs(z)<=2) ? 0 : null;
    if(this.night===3){
      const r=Math.hypot(x,z), a=Math.atan2(z,x)/RAD;
      if(r<=8)return feetY>=4.5?6:0;
      // Two ramps connect the lower floor to the upper annulus.
      for(const angle of [30,150]) { const q=angle*RAD, t=x*Math.cos(q)+z*Math.sin(q), side=Math.abs(-x*Math.sin(q)+z*Math.cos(q)); if(t>=24&&t<=30&&side<=1.5)return (30-t)/2; }
      if(r>=12&&r<=24&&z>0)return feetY>=1.5?3:0;
      return r<=45?0:null;
    }
    return Math.hypot(x,z)<=40?0:null;
  }
  movePlayer(act){
    const p=this.player;
    if(p.respawn>0){p.vel=[0,0,0];return;}
    const [dx,dz]=act.world;
    if(Math.hypot(dx,dz)>0.001){p.face=[dx,0,dz];}
    const speed=p.charm>0?7.2:6;
    if(act.dash && (p.dashCd===0||p.charm>0) && p.dashTicks===0){p.dashTicks=12;p.dashDir=(Math.hypot(dx,dz)>0.001?[dx,0,dz]:p.face).slice();p.dashCd=p.charm>0?0:90;this.emit('dash',{});}
    if(p.dashTicks>0){p.vel[0]=p.dashDir[0]*14;p.vel[2]=p.dashDir[2]*14;p.dashTicks--;}
    else if(p.launching){p.vel[0]=p.launchVel[0];p.vel[2]=p.launchVel[1];}
    else {p.vel[0]=dx*speed;p.vel[2]=dz*speed;}
    if(act.jump && p.grounded){p.vel[1]=7;p.grounded=false;}
    if(this.wind.active){p.vel[0]+=Math.cos(this.wind.dir_deg*RAD)*2*TICK;p.vel[2]+=Math.sin(this.wind.dir_deg*RAD)*2*TICK;}
    p.pos[0]+=p.vel[0]*TICK;p.pos[2]+=p.vel[2]*TICK;
    const ground=this.currentGround(p.pos[0],p.pos[2],p.pos[1]);
    if(!p.grounded||p.pos[1]>(ground??-10)){p.vel[1]-=20*TICK;p.pos[1]+=p.vel[1]*TICK;}
    if(ground!==null && p.pos[1]<=ground && p.vel[1]<=0){p.pos[1]=ground;p.vel[1]=0;p.grounded=true;p.launching=false;}
    else if(p.grounded&&ground!==null&&ground>p.pos[1]&&ground-p.pos[1]<=0.12){p.pos[1]=ground;}
    else p.grounded=false;
    this.checkJumpPad();
    if(p.pos[1]<-10 && !p.fallHandled){p.fallHandled=true;const lost=p.carried;p.carried=0;p.flames--;this.emit('player_hit',{by:'fall',flames:p.flames,dropped:0,lost});if(p.flames<=0){this.finish('lost','no_flames');}else{p.pos=[0,0,0];p.vel=[0,0,0];p.respawn=60;p.invuln=90;p.grounded=true;} }
    if(p.grounded && p.pos[1]>=0)p.fallHandled=false;
  }
  checkJumpPad(){const p=this.player;if(!p.grounded)return;let pad=null;if(this.night===2){for(const [x,z,tx,tz] of [[20,18,70,0],[50,-18,0,0]])if(dist2(p.pos,[x,0,z])<=1){const dx=tx-p.pos[0],dz=tz-p.pos[2],d=Math.hypot(dx,dz)||1;pad={vy:14,vx:dx/d*24,vz:dz/d*24};break;}}else if(this.night===3&&dist2(p.pos,[0,3,13])<=1)pad={vy:12,vx:0,vz:-8};if(pad){p.vel=[pad.vx,pad.vy,pad.vz];p.launchVel=[pad.vx,pad.vz];p.launching=true;p.grounded=false;}}
  pickups(){
    const p=this.player;
    if(p.respawn>0)return;
    for(let i=0;i<this.motes.length && p.carried<p.capacity;){const m=this.motes[i],g=this.currentGround(m.pos[0],m.pos[2],m.pos[1]);if(dist2(p.pos,m.pos)<=1&&g!==null&&Math.abs(p.pos[1]-g)<=1.5){p.carried++;this.emit('mote_picked',{carried:p.carried});this.motes.splice(i,1);}else i++;}
    for(const c of this.charms)if(c.available&&dist2(p.pos,c.pos)<=1&&Math.abs(p.pos[1]-c.pos[1])<=1.5){c.available=false;c.respawn=2700;p.charm=600;this.emit('charm_picked',{charm_id:c.id,charm_ticks:600});}
  }
  interact(){
    const p=this.player;if(p.respawn>0)return;
    const near=this.lanterns.filter(l=>(!l.lit||l.fuelTicks<6000)&&dist2(p.pos,l.pos)<=2).sort((a,b)=>dist2(p.pos,a.pos)-dist2(p.pos,b.pos)||compareId(a.id,b.id))[0];
    if(!near||p.carried<=0)return;
    if(!near.lit){
      const cost=near.ever_lit?5:10,amount=Math.min(p.carried,cost-near.deposited);if(amount<=0)return;
      p.carried-=amount;near.deposited+=amount;this.score+=5*amount;this.emit('deposit',{lantern_id:near.id,amount,deposited:near.deposited});
      if(near.deposited>=cost){const relight=near.ever_lit;near.lit=true;near.fuelTicks=6000;near.ever_lit=true;near.safePush=30;p.successfulLights++;p.capacity=Math.min(20,10+2*p.successfulLights);this.score+=relight?40:100;this.emit('lantern_lit',{lantern_id:near.id,relight});if(relight)near.relit_count++;}
      return;
    }
    const amount=Math.min(p.carried,Math.ceil((6000-near.fuelTicks)/600));if(amount<=0)return;
    const oldFuel=near.fuelTicks;p.carried-=amount;near.fuelTicks=Math.min(6000,near.fuelTicks+600*amount);near.deposited+=amount;this.score+=5*amount;
    this.emit('deposit',{lantern_id:near.id,amount,deposited:near.deposited});this.emit('refuel',{lantern_id:near.id,amount,fuel:this.fuel(near)});
    if(oldFuel<1800&&near.fuelTicks>=1800)near.safePush=30;
  }
  pulse(){const p=this.player;if(p.respawn>0||p.carried<3||p.pulseCd>0)return;p.carried-=3;p.pulseCd=180;const center=[p.pos[0],p.pos[1]+0.8,p.pos[2]],hit=[];for(const s of this.shades){if(Math.hypot(s.pos[0]-center[0],s.pos[1]-center[1],s.pos[2]-center[2])<=5){hit.push(s.id);const drained=s.state==='drain';s.state='stunned';s.stun=120;s.pushTicks=15;let dx=s.pos[0]-p.pos[0],dz=s.pos[2]-p.pos[2],d=Math.hypot(dx,dz);if(d<1e-8){dx=1;dz=0;d=1;}s.pushDir=[dx/d,dz/d];this.score+=drained?15:5;}}
    for(const d of this.drifters){if(Math.hypot(d.pos[0]-center[0],d.pos[1]-center[1],d.pos[2]-center[2])<=5){if(d.state==='chase'){d.state='flee';d.timer=240;d.stolen=0;}else if(d.state==='flee'&&d.stolen>0){for(let i=0;i<d.stolen;i++)this.motes.push({id:`D${d.id}-M${i+1}`,pos:clone(d.pos),kind:'dropped',ttl:480});this.emit('drifter_drop',{drifter_id:d.id,amount:d.stolen});d.stolen=0;d.timer=120;}}}
    this.emit('pulse',{stunned_ids:hit.sort(compareId)});}
  updateSafeZones(){for(const s of this.shades){for(const l of this.lanterns.filter(x=>x.lit&&x.fuelTicks>=1800)){const d=dist2(s.pos,l.pos);if(d<6){if(s.safePush===0){s.safePush=30;}const dx=s.pos[0]-l.pos[0],dz=s.pos[2]-l.pos[2],m=Math.hypot(dx,dz)||1;s.pos[0]=l.pos[0]+dx/m*6;s.pos[2]=l.pos[2]+dz/m*6;}}}}
  wanderTarget(s){const weak=this.lanterns.filter(l=>l.lit&&l.fuelTicks>0&&l.fuelTicks<1800);const lamps=weak.length?weak:this.lanterns.filter(l=>!l.lit);return lamps.sort((a,b)=>dist2(s.pos,a.pos)-dist2(s.pos,b.pos)||compareId(a.id,b.id))[0]||null;}
  moveShades(){
    const p=this.player;
    for(const s of this.shades){
      if(s.state==='stunned'){if(s.pushTicks>0){const step=4/15;s.pos[0]+=s.pushDir[0]*step;s.pos[2]+=s.pushDir[1]*step;}if(s.stun===0){s.state='wander';s.target_lantern_id=null;s.drainTicks=0;}continue;}
      if(s.state==='spawning'){if(s.stateTicksLeft>0)continue;s.state='wander';}
      if(s.state==='recoil'){if(s.recoil>0){s.pos[0]+=s.recoilDir[0]*(2/60);s.pos[2]+=s.recoilDir[1]*(2/60);s.recoil--;continue;}s.state='chase';}
      const playerDistance=dist2(s.pos,p.pos);
      if(s.state==='drain'){const l=this.lanterns.find(x=>x.id===s.target_lantern_id);if(playerDistance<=6){s.state='chase';continue;}if(!l||!l.lit||l.fuelTicks>=1800||dist2(s.pos,l.pos)>2){s.state='wander';s.target_lantern_id=null;s.drainTicks=0;}else continue;}
      if(s.state!=='chase'&&playerDistance<=12){s.state='chase';continue;}
      if(s.state==='chase'&&playerDistance>18)s.state='wander';
      if(s.state==='wander'){
        const target=this.wanderTarget(s);s.target_lantern_id=target?target.id:null;if(!target)continue;
        const distance=dist2(s.pos,target.pos);
        if(target.lit&&target.fuelTicks>0&&target.fuelTicks<1800&&distance<=2){s.state='drain';s.drainTicks=0;continue;}
        if(distance>0.001){const step=Math.min((this.night===3?4.5:4)*TICK,distance);s.pos[0]+=(target.pos[0]-s.pos[0])/distance*step;s.pos[2]+=(target.pos[2]-s.pos[2])/distance*step;}
        continue;
      }
      if(s.state==='chase'&&playerDistance>0.01){const step=Math.min((this.night===3?4.5:4)*TICK,playerDistance),nx=s.pos[0]+(p.pos[0]-s.pos[0])/playerDistance*step,nz=s.pos[2]+(p.pos[2]-s.pos[2])/playerDistance*step,safe=this.lanterns.find(l=>l.lit&&l.fuelTicks>=1800&&Math.hypot(nx-l.pos[0],nz-l.pos[2])<6);if(safe){const dx=nx-safe.pos[0],dz=nz-safe.pos[2],m=Math.hypot(dx,dz)||1;s.pos[0]=safe.pos[0]+dx/m*6;s.pos[2]=safe.pos[2]+dz/m*6;}else{s.pos[0]=nx;s.pos[2]=nz;}}
    }
  }
  moveDrifters(){const p=this.player;for(let i=0;i<this.drifters.length;){const d=this.drifters[i];if(d.state==='removed'||(d.state==='flee'&&d.timer===0)){this.drifters.splice(i,1);continue;}const distance=dist2(d.pos,p.pos);if(d.state==='idle'&&p.carried>=5&&distance<=15)d.state='chase';else if(d.state==='chase'&&(p.carried<5||distance>15))d.state='idle';if(d.state==='idle'){const a=(this.simTick/90+i*2)*RAD;d.pos[0]+=Math.cos(a)*2*TICK;d.pos[2]+=Math.sin(a)*2*TICK;}else if(d.state==='chase'&&distance>0.01){d.pos[0]+=(p.pos[0]-d.pos[0])/distance*7*TICK;d.pos[2]+=(p.pos[2]-d.pos[2])/distance*7*TICK;}else if(d.state==='flee'&&distance>0.01){d.pos[0]+=(d.pos[0]-p.pos[0])/distance*7*TICK;d.pos[2]+=(d.pos[2]-p.pos[2])/distance*7*TICK;}i++;}}
  collisions(){const p=this.player;if(p.respawn>0)return;for(const d of this.drifters){if(d.state==='chase'&&!d.stealDone&&dist2(p.pos,d.pos)<=1.2){const amount=Math.min(3,p.carried);p.carried-=amount;d.stolen=amount;d.stealDone=true;d.state='flee';d.timer=240;this.emit('drifter_steal',{drifter_id:d.id,amount,carried:p.carried});}}
    if(p.invuln>0)return;const s=this.shades.filter(x=>x.state==='chase'&&dist2(p.pos,x.pos)<=1&&Math.abs(p.pos[1]-x.pos[1])<=1.5&&x.safePush===0).sort((a,b)=>compareId(a.id,b.id))[0];if(s){const dropped=Math.floor(p.carried/2);p.carried-=dropped;for(let i=0;i<dropped;i++){const a=this.rng.next()*Math.PI*2,r=1.5+this.rng.next();this.motes.push({id:`D${this.wallTick}-${i}`,pos:[p.pos[0]+Math.cos(a)*r,p.pos[1],p.pos[2]+Math.sin(a)*r],kind:'dropped',ttl:480});}p.flames--;p.invuln=90;s.recoil=60;s.state='recoil';let dx=s.pos[0]-p.pos[0],dz=s.pos[2]-p.pos[2],d=Math.hypot(dx,dz);if(d<1e-8){dx=1;dz=0;d=1;}s.recoilDir=[dx/d,dz/d];this.emit('player_hit',{by:'shade',flames:p.flames,dropped});if(p.flames<=0)this.finish('lost','no_flames');}}
  spawnSchedules(){if(this.randomMotes&&this.simTick%240===0&&this.motes.filter(m=>m.kind==='random').length<30){const occupied=new Set(this.motes.map(m=>m.spawnIndex));const choices=this.map.moteSpawns.map((_,i)=>i).filter(i=>!occupied.has(i));if(choices.length){const idx=choices[this.rng.int(choices.length)];this.motes.push({id:`M${++this.spawnedMotes+20}`,pos:clone(this.map.moteSpawns[idx]),kind:'random',ttl:0,spawnIndex:idx});}}
    if(this.randomShades){const interval=this.night===1?480:this.night===2?420:360,first=300;const due=this.simTick===first||this.simTick>first&&(this.simTick-first)%interval===0;if(due&&this.shades.length<(this.night===1?6:this.night===2?8:10)){const valid=this.map.shadeSpawns.filter(pt=>dist2(pt,this.player.pos)>=15);for(let j=0;j<(this.simTick===300&&this.night===1?2:1);j++){if(this.shades.length>=(this.night===1?6:this.night===2?8:10)||!valid.length)break;const ix=this.rng.int(valid.length),pos=valid.splice(ix,1)[0],id=`S${++this.spawnedShades}`;this.shades.push({id,pos:clone(pos),state:'spawning',stateTicksLeft:60,stun:0,pushTicks:0,pushDir:[1,0],recoil:0,safePush:0});this.emit('shade_spawned',{id});}}}
    if(this.night>=2&&this.randomDrifters&&this.simTick%1200===0&&this.drifters.length<2){const id=`D${++this.spawnedDrifters}`,pos=this.map.shadeSpawns[this.rng.int(this.map.shadeSpawns.length)];this.drifters.push({id,pos:clone(pos),state:'idle',stolen:0,timer:0,stealDone:false});}
  }
  updateWind(){if(!this.windEnabled||this.night!==3)return;const cycle=this.simTick%1800;if(cycle===0){this.wind.dir_deg=this.rng.int(360);this.wind.active=true;}if(cycle===300)this.wind.active=false;}
  checkEnd(){if(this.player.flames<=0){this.finish('lost','no_flames');return;}if(this.timeLeft<=0){const lit=this.lanterns.filter(l=>l.lit&&l.fuelTicks>0).length,need=Math.ceil(0.6*this.lanterns.length);this.finish(lit>=need?'won':'lost',lit>=need?'dawn_survived':'dawn');}}
  finish(result,reason){if(this.state!=='playing')return;this.state=result;this.result=result;this.reason=reason;if(result==='won'){const lit=this.lanterns.filter(l=>l.lit&&l.fuelTicks>0);this.score+=lit.reduce((n,l)=>n+50+Math.floor(l.fuelTicks/60),0)+50*this.player.flames;}this.emit('game_over',{result,reason});}
  snapshot(){return {type:'snapshot',tick:this.wallTick,sim_tick:this.simTick,night:this.night,state:this.paused?'paused':this.state,time_left_s:round3(this.timeLeft),score:this.score,player:{pos:this.player.pos.map(round3),vel:this.player.vel.map(round3),flames:this.player.flames,carried:this.player.carried,capacity:this.player.capacity,grounded:this.player.grounded,invuln:round3(this.player.invuln/60),dash_cd_s:round3(this.player.dashCd/60),pulse_cd_s:round3(this.player.pulseCd/60),charm_s:round3(this.player.charm/60)},lanterns:this.lanterns.map(l=>({id:l.id,pos:l.pos.map(round3),lit:l.lit,deposited:l.deposited,fuel:l.lit?Math.round(this.fuel(l)*10)/10:0,ever_lit:l.ever_lit,relit_count:l.relit_count})),shades:this.shades.map(s=>({id:s.id,pos:s.pos.map(round3),state:s.state})),motes:this.motes.map(m=>({id:m.id,pos:m.pos.map(round3),kind:m.kind,ttl_s:round3(m.ttl/60)})),motes_active:this.motes.length,drifters:this.drifters.map(d=>({id:d.id,pos:d.pos.map(round3),state:d.state,stolen:d.stolen})),charms:this.charms.map(c=>({id:c.id,available:c.available,respawn_s:round3(c.respawn/60)})),wind:{active:this.wind.active,dir_deg:this.wind.dir_deg}};}
}

const DaoSim={GameSim,TICK,makeNight,dist2,round3};
if(typeof module!=='undefined'&&module.exports)module.exports=DaoSim;
if(typeof globalThis!=='undefined')globalThis.DaoSim=DaoSim;
