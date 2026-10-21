function simulateKeyEvent(type,keyCode,charCode){
  var e=document.createEventObject?document.createEventObject():document.createEvent('Events');
  if(e.initEvent)e.initEvent(type,true,true);
  e.keyCode=keyCode;e.which=keyCode;e.charCode=charCode||0;
  if(typeof JSEvents!=='undefined'&&JSEvents.eventHandlers&&JSEvents.eventHandlers.length){
    for(var i=0;i<JSEvents.eventHandlers.length;i++){
      var h=JSEvents.eventHandlers[i];
      if((h.target==Module['canvas']||h.target==window)&&h.eventTypeString==type)h.handlerFunc(e);
    }
  }else if(Module&&Module['canvas']){
    if(Module['canvas'].dispatchEvent)Module['canvas'].dispatchEvent(e);
    else Module['canvas'].fireEvent('on'+type,e);
  }
}
const held=new Set(),pulseTimers=new Map();
function sendKey(key,down){
  if(down){
    if(held.has(key))return;
    held.add(key);simulateKeyEvent('keydown',key);
  }else{
    if(!held.has(key))return;
    held.delete(key);simulateKeyEvent('keyup',key);
  }
}
function pulseKey(key,ms=120){
  const old=pulseTimers.get(key);
  if(old){clearTimeout(old);sendKey(key,false);}
  sendKey(key,true);
  pulseTimers.set(key,setTimeout(()=>{sendKey(key,false);pulseTimers.delete(key);},ms));
}
function releaseAll(){
  pulseTimers.forEach(t=>clearTimeout(t));pulseTimers.clear();
  Array.from(held).forEach(k=>sendKey(k,false));
  if(window.slAttackAutoReset)window.slAttackAutoReset();
}
function isTouch(){return 'ontouchstart' in window||navigator.maxTouchPoints>0;}
function viewportBox(){
  const v=window.visualViewport;
  return v?{left:v.offsetLeft,top:v.offsetTop,width:v.width,height:v.height}:{left:0,top:0,width:window.innerWidth,height:window.innerHeight};
}
function resizeCanvas(){
  const c=document.getElementById('canvas');if(!c)return;
  const v=viewportBox(),portrait=v.height>v.width;
  c.style.position='fixed';c.style.transform='none';c.style.margin='0';
  if(portrait){
    const w=Math.min(v.width,v.height*4/3),h=w*0.75;
    c.style.left=Math.round(v.left+(v.width-w)/2)+'px';c.style.top=Math.round(v.top)+'px';
    c.style.width=Math.round(w)+'px';c.style.height=Math.round(h)+'px';
  }else{
    const h=Math.min(v.height,v.width*0.75),w=h*4/3;
    c.style.left=Math.round(v.left+(v.width-w)/2)+'px';c.style.top=Math.round(v.top+(v.height-h)/2)+'px';
    c.style.width=Math.round(w)+'px';c.style.height=Math.round(h)+'px';
  }
  layoutPadSoon();
}
function box(el,left,top,width,height){
  el.style.left=Math.round(left)+'px';el.style.top=Math.round(top)+'px';
  el.style.width=Math.max(0,Math.round(width))+'px';el.style.height=Math.max(0,Math.round(height))+'px';
}
function centerBox(el,cx,cy,w,h){box(el,cx-w/2,cy-h/2,w,h);}
function layoutPad(){
  const canvas=document.getElementById('canvas'),pad=document.getElementById('sl-pad'),zone=document.getElementById('sl-joy-zone'),hot=document.getElementById('sl-hotbar'),atk=document.getElementById('sl-atk'),cancel=document.getElementById('sl-cancel');
  if(!canvas||!pad||!zone||!hot||!atk||!cancel)return;
  const v=viewportBox(),cr=canvas.getBoundingClientRect(),leftSpace=Math.max(0,cr.left-v.left),rightSpace=Math.max(0,v.left+v.width-cr.right),bottomSpace=Math.max(0,v.top+v.height-cr.bottom);
  pad.style.left=Math.round(v.left)+'px';pad.style.top=Math.round(v.top)+'px';pad.style.width=Math.round(v.width)+'px';pad.style.height=Math.round(v.height)+'px';
  if(v.height>v.width){
    pad.dataset.mode='bottom';
    const hotW=160,hotH=104,top=cr.bottom-v.top,h=bottomSpace,leftW=Math.max(1,v.width*0.46),rightLeft=leftW,rightW=Math.max(1,v.width-rightLeft);
    const panelH=Math.max(110,Math.min(390,h-12));box(zone,0,top+10,leftW-8,panelH);
    centerBox(atk,rightLeft+rightW*0.66,top+Math.min(100,panelH*0.30),94,94);
    centerBox(cancel,rightLeft+rightW*0.43,top+Math.min(200,panelH*0.58),62,62);
    hot.style.left=Math.round(rightLeft+Math.max(8,rightW-hotW-16))+'px';
    hot.style.top=Math.round(top+Math.min(Math.max(110,panelH-hotH-8),Math.max(0,h-hotH-8)))+'px';
  }else{
    pad.dataset.mode='side';
    const hotW=90,hotH=138,top=cr.top-v.top,h=cr.height,rightLeft=cr.right-v.left,rightW=rightSpace,leftW=leftSpace,cx=rightLeft+rightW/2;
    box(zone,0,top+8,Math.max(1,leftW-8),Math.max(1,h-16));
    const atkSize=Math.min(82,Math.max(58,rightW-12)),xSize=Math.min(54,Math.max(44,rightW-20));
    centerBox(atk,cx,top+h*0.22,atkSize,atkSize);
    centerBox(cancel,cx,top+h*0.43,xSize,xSize);
    hot.style.left=Math.round(rightLeft+Math.max(2,(rightW-hotW)/2))+'px';
    hot.style.top=Math.round(Math.max(top+8,top+h-hotH-12))+'px';
  }
}
function layoutPadSoon(){requestAnimationFrame(()=>requestAnimationFrame(layoutPad));setTimeout(layoutPad,100);}
function bindHold(b,key){
  b.addEventListener('pointerdown',e=>{
    e.preventDefault();e.stopPropagation();
    try{b.setPointerCapture(e.pointerId);}catch(_){}
    b.classList.add('pressed');sendKey(key,true);
  });
  const up=e=>{
    if(e){e.preventDefault();e.stopPropagation();}
    b.classList.remove('pressed');sendKey(key,false);
  };
  b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('lostpointercapture',up);
}
function bindTap(b,key){
  b.addEventListener('pointerdown',e=>{
    e.preventDefault();e.stopPropagation();
    try{b.setPointerCapture(e.pointerId);}catch(_){}
    b.classList.add('pressed');pulseKey(key,120);
  });
  const up=e=>{
    if(e){e.preventDefault();e.stopPropagation();}
    b.classList.remove('pressed');
  };
  b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('lostpointercapture',up);
}
function attackButton(parent){
  const b=document.createElement('div');b.id='sl-atk';b.className='sl-btn';b.textContent='ATK';parent.appendChild(b);
  let pointer=null,ready=false,auto=false,autoTimer=null;
  const AUTO_ATTACK_INTERVAL_MS=80;
  const AUTO_ATTACK_DOWN_MS=40;

  function visual(){
    b.classList.toggle('auto-ready',ready&&!auto);
    b.classList.toggle('auto-on',auto);
    b.textContent=(auto||ready)?'AUTO':'ATK';
  }

  function clearAttackPulse(){
    if(autoTimer!==null){
      clearInterval(autoTimer);
      autoTimer=null;
    }

    const t=pulseTimers.get(67);
    if(t){
      clearTimeout(t);
      pulseTimers.delete(67);
    }

    sendKey(67,false);
  }

  function autoPulse(){
    pulseKey(67,AUTO_ATTACK_DOWN_MS);
  }

  function startAuto(){
    clearAttackPulse();
    auto=true;
    autoPulse();
    autoTimer=setInterval(autoPulse,AUTO_ATTACK_INTERVAL_MS);
  }

  function cancelAuto(){
    pointer=null;
    ready=false;
    auto=false;
    b.classList.remove('pressed');
    clearAttackPulse();
    visual();
  }

  window.slAttackAutoCancel=cancelAuto;
  window.slAttackAutoReset=cancelAuto;

  b.addEventListener('pointerdown',e=>{
    e.preventDefault();
    e.stopPropagation();

    if(auto){
      cancelAuto();
      return;
    }

    pointer=e.pointerId;
    ready=false;

    try{b.setPointerCapture(e.pointerId);}catch(_){}

    b.classList.add('pressed');
    sendKey(67,true);
    visual();
  });

  b.addEventListener('pointermove',e=>{
    if(e.pointerId!==pointer)return;

    e.preventDefault();
    e.stopPropagation();

    const r=b.getBoundingClientRect();

    ready=
      e.clientX<r.left||
      e.clientX>r.right||
      e.clientY<r.top||
      e.clientY>r.bottom;

    visual();
  });

  b.addEventListener('pointerup',e=>{
    if(e.pointerId!==pointer)return;

    e.preventDefault();
    e.stopPropagation();

    const arm=ready;

    pointer=null;
    ready=false;
    b.classList.remove('pressed');

    if(arm){
      startAuto();
    }else{
      clearAttackPulse();
      auto=false;
    }

    visual();
  });

  const abort=e=>{
    if(pointer===null)return;

    if(e){
      e.preventDefault();
      e.stopPropagation();
    }

    cancelAuto();
  };

  b.addEventListener('pointercancel',abort);
  b.addEventListener('lostpointercapture',abort);
  return b;
}
function button(parent,id,label,key,cls,tap=false){
  const b=document.createElement('div');b.id=id;b.className=cls;b.textContent=label;parent.appendChild(b);
  (tap?bindTap:bindHold)(b,key);return b;
}
const dirKeys=[37,38,39,40];
function dirButton(parent,id,label,key){
  const b=document.createElement('div');b.id=id;b.className='sl-dir';b.textContent=label;parent.appendChild(b);
  b.addEventListener('pointerdown',e=>{
    e.preventDefault();e.stopPropagation();
    try{b.setPointerCapture(e.pointerId);}catch(_){}
    parent.querySelectorAll('.sl-dir').forEach(x=>x.classList.remove('pressed'));
    dirKeys.forEach(k=>{if(k!==key)sendKey(k,false);});
    b.classList.add('pressed');sendKey(key,true);
  });
  const up=e=>{if(e){e.preventDefault();e.stopPropagation();}b.classList.remove('pressed');sendKey(key,false);};
  b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('lostpointercapture',up);
  return b;
}
function hotButton(parent,index,label,key){
  const b=document.createElement('div');b.id='sl-hot-'+label.toLowerCase();b.className='sl-hot default';
  const k=document.createElement('span');k.className='sl-hot-key';k.textContent=label;
  const c=document.createElement('span');c.className='sl-hot-count';
  b.appendChild(k);b.appendChild(c);parent.appendChild(b);bindTap(b,key);renderHot(index);return b;
}
let slScene='',slHotMode='hide';
window.slHotStates=[null,null,null,null,null,null];
function updateHotbar(){
  const bar=document.getElementById('sl-hotbar');if(!bar)return;
  const byScene=slScene==='Scene_Map'||slScene==='Scene_Item'||slScene==='Scene_Item2';
  const byMode=slHotMode==='use'||slHotMode==='assign';
  const show=byScene||byMode,assign=slHotMode==='assign'||slScene==='Scene_Item'||slScene==='Scene_Item2';
  bar.style.display=show?'grid':'none';bar.classList.toggle('assign',assign);bar.dataset.mode=assign?'assign':'use';
  bar.querySelectorAll('.sl-hot').forEach(b=>b.style.pointerEvents=show?'auto':'none');
  layoutPadSoon();
}
function parseConsole(t){
  let i=t.indexOf('SLFRAME|');
  if(i>=0){
    slScene=t.slice(i+8).split(/\s/)[0];
    if(slScene!=='Scene_Map'&&slScene!=='Scene_Item'&&slScene!=='Scene_Item2')slHotMode='hide';
    updateHotbar();
  }
  i=t.indexOf('SLHOT|MODE|');
  if(i>=0){slHotMode=t.slice(i).split('|')[2]||'hide';updateHotbar();}
  i=t.indexOf('SLHOT|STATE|');
  if(i>=0){
    const p=t.slice(i).split('|'),slot=Number(p[2]);
    if(slot>=1&&slot<=6){
      window.slHotStates[slot-1]={id:Number(p[3])||0,count:Number(p[4])||0,icon:p[5]||'',name:p.slice(6).join('|')};
      renderHot(slot-1);
    }
  }
  for(const kind of ['ASSIGN','USE','FAIL','REJECT']){
    i=t.indexOf('SLHOT|'+kind+'|');
    if(i>=0){flashHot(Number(t.slice(i).split('|')[2])-1,kind);break;}
  }
}
const slLog=console.log.bind(console);
console.log=function(){
  const a=[].slice.call(arguments);
  try{parseConsole(a.join(' '));}catch(_){}
  slLog.apply(console,a);
};
function renderHot(index){
  const labels=['a','s','d','q','z','f'],b=document.getElementById('sl-hot-'+labels[index]);
  if(!b)return;
  const state=window.slHotStates[index],count=b.querySelector('.sl-hot-count');
  if(!state||!state.id){
    b.classList.add('default');b.classList.remove('zero');b.style.backgroundImage='';
    if(count)count.textContent='';
    b.title='';return;
  }
  b.classList.remove('default');b.classList.toggle('zero',state.count<=0);
  b.style.backgroundImage='url("gameasync/Graphics/Icons/'+encodeURIComponent(state.icon)+'.png")';
  if(count)count.textContent=String(state.count);
  b.title=state.name;
}
function flashHot(index,kind){
  const labels=['a','s','d','q','z','f'],b=document.getElementById('sl-hot-'+labels[index]);
  if(!b)return;
  b.classList.remove('okflash','failflash');void b.offsetWidth;
  b.classList.add(kind==='FAIL'||kind==='REJECT'?'failflash':'okflash');
  setTimeout(()=>b.classList.remove('okflash','failflash'),260);
}
function initSLTouchControls(){
  if(!isTouch()||document.getElementById('sl-pad'))return;
  const oldD=document.getElementById('dpad'),oldA=document.getElementById('apad');
  if(oldD)oldD.remove();if(oldA)oldA.remove();
  const main=document.getElementById('main');if(!main)return;
  const style=document.createElement('style');
  style.textContent=`
#sl-pad{position:fixed;left:0;top:0;z-index:5000;pointer-events:none;user-select:none;-webkit-user-select:none;touch-action:none;overflow:visible}
#sl-joy-zone{position:absolute;pointer-events:auto;touch-action:none}
#sl-dpad{position:absolute;left:50%;top:calc(50% + 18px);width:156px;height:156px;transform:translate(-50%,-50%)}
.sl-dir{position:absolute;width:52px;height:52px;display:flex;align-items:center;justify-content:center;box-sizing:border-box;border-radius:12px;background:rgba(55,55,55,.52);border:2px solid rgba(255,255,255,.30);color:#fff;font:700 22px sans-serif;text-shadow:0 1px 2px #000;pointer-events:auto;touch-action:none}
.sl-dir.pressed{background:rgba(225,225,225,.62);transform:scale(.94)}
#sl-up{left:52px;top:0}#sl-left{left:0;top:52px}#sl-right{right:0;top:52px}#sl-down{left:52px;bottom:0}
#sl-pad[data-mode="side"] #sl-dpad{width:126px;height:126px}
#sl-pad[data-mode="side"] #sl-joy-zone{display:none!important}
#sl-pad[data-mode="side"] .sl-dir{width:42px;height:42px;font-size:18px}
#sl-pad[data-mode="side"] #sl-up{left:42px}#sl-pad[data-mode="side"] #sl-left{top:42px}#sl-pad[data-mode="side"] #sl-right{top:42px}#sl-pad[data-mode="side"] #sl-down{left:42px}
.sl-btn{position:absolute;display:flex;align-items:center;justify-content:center;box-sizing:border-box;border-radius:50%;background:rgba(55,55,55,.46);border:2px solid rgba(255,255,255,.28);color:#fff;font:700 18px sans-serif;text-shadow:0 1px 2px #000;pointer-events:auto;touch-action:none}
.sl-btn.pressed{background:rgba(225,225,225,.62);transform:scale(.94)}
#sl-atk.auto-ready,#sl-atk.auto-on{border-color:rgba(255,226,108,.92);box-shadow:0 0 14px rgba(255,226,108,.72)}
#sl-hotbar{position:absolute;display:none;grid-template-columns:repeat(3,48px);grid-template-rows:repeat(2,48px);gap:8px;width:160px;height:104px;z-index:3;pointer-events:none}
#sl-pad[data-mode="side"] #sl-hotbar{grid-template-columns:repeat(2,42px);grid-template-rows:repeat(3,42px);gap:6px;width:90px;height:138px}
#sl-pad[data-mode="side"] .sl-hot{width:42px;height:42px;background-size:28px 28px}
.sl-hot{position:relative;width:48px;height:48px;box-sizing:border-box;border-radius:10px;background-color:rgba(45,45,45,.78);background-position:center;background-repeat:no-repeat;background-size:32px 32px;border:2px solid rgba(255,255,255,.30);box-shadow:0 2px 8px rgba(0,0,0,.40);color:#fff;font-family:sans-serif;text-shadow:0 1px 2px #000;pointer-events:auto;touch-action:none}
.sl-hot.default{display:flex;align-items:center;justify-content:center}
.sl-hot.default .sl-hot-key{position:static;font-size:17px;font-weight:800}
.sl-hot:not(.default) .sl-hot-key{position:absolute;left:3px;top:1px;font-size:10px;font-weight:800}
.sl-hot-count{position:absolute;right:3px;bottom:1px;font-size:11px;font-weight:800}
.sl-hot.default .sl-hot-count{display:none}
.sl-hot.zero{filter:grayscale(1);opacity:.55}
.sl-hot.pressed{transform:scale(.92);background-color:rgba(225,225,225,.55)}
#sl-hotbar.assign .sl-hot{border-color:rgba(255,226,108,.72)}
.sl-hot.okflash{box-shadow:0 0 14px rgba(145,255,174,.95);border-color:#91ffae}
.sl-hot.failflash{box-shadow:0 0 14px rgba(255,123,123,.95);border-color:#ff7b7b}`;
  document.head.appendChild(style);
  const pad=document.createElement('div');pad.id='sl-pad';main.appendChild(pad);
  const zone=document.createElement('div');zone.id='sl-joy-zone';pad.appendChild(zone);
  const dpad=document.createElement('div');dpad.id='sl-dpad';zone.appendChild(dpad);
  dirButton(dpad,'sl-up','▲',38);dirButton(dpad,'sl-left','◀',37);dirButton(dpad,'sl-right','▶',39);dirButton(dpad,'sl-down','▼',40);
  const hot=document.createElement('div');hot.id='sl-hotbar';pad.appendChild(hot);
  hotButton(hot,0,'A',65);hotButton(hot,1,'S',83);hotButton(hot,2,'D',68);hotButton(hot,3,'Q',81);hotButton(hot,4,'Z',117);hotButton(hot,5,'F',116);
  attackButton(pad);const slCancel=button(pad,'sl-cancel','X',88,'sl-btn');slCancel.addEventListener('pointerdown',()=>{if(window.slAttackAutoCancel)window.slAttackAutoCancel();});
  layoutPadSoon();updateHotbar();
  if(window.ResizeObserver){
    const ro=new ResizeObserver(layoutPadSoon);
    ro.observe(document.getElementById('canvas'));
    window.slPadResizeObserver=ro;
  }
  window.addEventListener('resize',()=>{resizeCanvas();layoutPadSoon();});
  window.addEventListener('orientationchange',()=>setTimeout(()=>{resizeCanvas();layoutPadSoon();},150));
  document.addEventListener('fullscreenchange',()=>setTimeout(()=>{resizeCanvas();layoutPadSoon();},100));
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize',()=>{resizeCanvas();layoutPadSoon();});
    window.visualViewport.addEventListener('scroll',layoutPadSoon);
  }
  window.addEventListener('blur',releaseAll);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseAll();});
}
window.addEventListener('resize',resizeCanvas);
window.addEventListener('load',()=>{resizeCanvas();initSLTouchControls();});
