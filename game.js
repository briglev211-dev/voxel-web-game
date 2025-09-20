// ========== Mini Minecraft Fan Game (v2) ==========

// Global config
const TILE = 32;
const CHUNK_SIZE = 16;
const VISIBLE_RANGE = 3;
const CANVAS_W = 960, CANVAS_H = 640;

// Block types
const BLOCKS = {
  air:   {id:'air', solid:false},
  dirt:  {id:'dirt', color:'#976B3D', drop:'dirt', breakTime:1, solid:true},
  grass: {id:'grass', color:'#3CAA2A', drop:'dirt', breakTime:1, solid:true},
  stone: {id:'stone', color:'#7f8a93', drop:'stone', breakTime:2, solid:true},
  trunk: {id:'trunk', color:'#6b3f2f', drop:'wood', breakTime:1, solid:true},
  leaf:  {id:'leaf', color:'#4fb654', drop:'leaf', breakTime:0.3, solid:false},
};

const ITEM_TEMPLATES = {
  dirt:{id:'dirt', display:'Dirt'},
  stone:{id:'stone', display:'Stone'},
  wood:{id:'wood', display:'Wood'},
  meat:{id:'meat', display:'Meat'},
  leaf:{id:'leaf', display:'Leaf'}
};

// --- Helper random
function seededRand(x, y, seed=1337){
  let n=(x*374761393+y*668265263)^seed;
  return function(){
    n=(n^(n<<13))>>>0; n=(n*1274126177)>>>0;
    return ((n)%10000)/10000;
  }
}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// --- Chunk & World
class Chunk {
  constructor(cx,cy){
    this.cx=cx; this.cy=cy;
    this.tiles=new Array(CHUNK_SIZE*CHUNK_SIZE).fill('air');
    this.items=[]; this.mobs=[];
    this.generate();
  }
  idx(tx,ty){return tx+ty*CHUNK_SIZE;}
  get(tx,ty){ if(tx<0||ty<0||tx>=CHUNK_SIZE||ty>=CHUNK_SIZE) return 'air'; return this.tiles[this.idx(tx,ty)]; }
  set(tx,ty,id){ if(tx<0||ty<0||tx>=CHUNK_SIZE||ty>=CHUNK_SIZE) return; this.tiles[this.idx(tx,ty)]=id; }
  generate(){
    const rand=seededRand(this.cx,this.cy,1234);
    const ground=6+Math.floor(rand()*6);
    for(let y=0;y<CHUNK_SIZE;y++){
      for(let x=0;x<CHUNK_SIZE;x++){
        const worldY=this.cy*CHUNK_SIZE+y;
        if(worldY===ground) this.set(x,y,'grass');
        else if(worldY>ground) this.set(x,y,'dirt');
        else if(worldY<ground-3) this.set(x,y,'stone');
      }
    }
    // trees
    if(rand()<0.5){
      const tx=Math.floor(rand()*CHUNK_SIZE);
      let sy=null;
      for(let y=0;y<CHUNK_SIZE;y++) if(this.get(tx,y)==='grass') sy=y;
      if(sy){
        for(let h=1;h<=3;h++) this.set(tx,sy-h,'trunk');
        for(let ly=-1;ly<=1;ly++)for(let lx=-2;lx<=2;lx++){
          if(rand()<0.8) this.set(tx+lx,sy-3+ly,'leaf');
        }
      }
    }
  }
}
class World{
  constructor(){ this.chunks=new Map(); }
  key(cx,cy){return `${cx},${cy}`;}
  getChunk(cx,cy){
    const k=this.key(cx,cy);
    if(!this.chunks.has(k)) this.chunks.set(k,new Chunk(cx,cy));
    return this.chunks.get(k);
  }
  worldToChunkTile(wx,wy){
    const cx=Math.floor(wx/CHUNK_SIZE), cy=Math.floor(wy/CHUNK_SIZE);
    const tx=((wx%CHUNK_SIZE)+CHUNK_SIZE)%CHUNK_SIZE;
    const ty=((wy%CHUNK_SIZE)+CHUNK_SIZE)%CHUNK_SIZE;
    return {cx,cy,tx,ty};
  }
  getBlockAt(wx,wy){const {cx,cy,tx,ty}=this.worldToChunkTile(wx,wy);return this.getChunk(cx,cy).get(tx,ty);}
  setBlockAt(wx,wy,id){const {cx,cy,tx,ty}=this.worldToChunkTile(wx,wy);this.getChunk(cx,cy).set(tx,ty,id);}
  ensureAround(wx,wy){const cx=Math.floor(wx/CHUNK_SIZE),cy=Math.floor(wy/CHUNK_SIZE);for(let ox=-VISIBLE_RANGE;ox<=VISIBLE_RANGE;ox++)for(let oy=-VISIBLE_RANGE;oy<=VISIBLE_RANGE;oy++)this.getChunk(cx+ox,cy+oy);}
}

// --- Player
class Player{
  constructor(x=0.5,y=0.5){this.x=x;this.y=y;this.speed=6;this.inventory={};this.hotbar=[];this.selected=0;}
  addItem(id,n=1){if(!this.inventory[id]) this.inventory[id]=0; this.inventory[id]+=n; if(!this.hotbar.includes(id)) this.hotbar.push(id);}
}

// --- Input
const Input={keys:{},mouseDown:false,mouseBtn:0,mouseX:0,mouseY:0,
  setup(c){
    addEventListener('keydown',e=>{this.keys[e.key.toLowerCase()]=true; if(/[1-9]/.test(e.key)){game.player.selected=parseInt(e.key)-1;}});
    addEventListener('keyup',e=>this.keys[e.key.toLowerCase()]=false);
    c.addEventListener('mousedown',e=>{this.mouseDown=true;this.mouseBtn=e.button;this.mouseX=e.offsetX;this.mouseY=e.offsetY;});
    c.addEventListener('mouseup',()=>this.mouseDown=false);
    c.addEventListener('mousemove',e=>{this.mouseX=e.offsetX;this.mouseY=e.offsetY;});
    c.addEventListener('contextmenu',e=>e.preventDefault());
  }
};

// --- Game
class Game{
  constructor(canvas){
    this.canvas=canvas; this.ctx=canvas.getContext('2d');
    this.world=new World(); this.player=new Player();
    Input.setup(canvas); this.camera={x:0,y:0};
    this.last=performance.now(); requestAnimationFrame(t=>this.frame(t));
    document.getElementById('saveBtn').onclick=()=>this.save();
    document.getElementById('loadBtn').onclick=()=>this.load();
    document.getElementById('resetBtn').onclick=()=>{localStorage.clear();location.reload();}
  }
  save(){localStorage.setItem('world',JSON.stringify({inv:this.player.inventory,hot:this.player.hotbar,sel:this.player.selected})); alert("World saved!");}
  load(){const d=JSON.parse(localStorage.getItem('world')||"null"); if(d){this.player.inventory=d.inv;this.player.hotbar=d.hot;this.player.selected=d.sel; alert("Loaded!");}}
  frame(now){const dt=(now-this.last)/1000;this.last=now;this.update(dt);this.draw();requestAnimationFrame(t=>this.frame(t));}
  update(dt){
    let dx=0,dy=0; if(Input.keys['w'])dy--; if(Input.keys['s'])dy++; if(Input.keys['a'])dx--; if(Input.keys['d'])dx++;
    if(dx||dy){const len=Math.hypot(dx,dy);this.player.x+=dx/len*this.player.speed*dt;this.player.y+=dy/len*this.player.speed*dt;}
    this.camera.x+=(this.player.x-this.camera.x)*0.1; this.camera.y+=(this.player.y-this.camera.y)*0.1;
    this.world.ensureAround(this.player.x,this.player.y);

    if(Input.mouseDown){
      const wx=(Input.mouseX-this.canvas.width/2)/TILE+this.camera.x;
      const wy=(Input.mouseY-this.canvas.height/2)/TILE+this.camera.y;
      const tx=Math.floor(wx), ty=Math.floor(wy);
      if(Input.mouseBtn===0){ // mine
        const b=this.world.getBlockAt(tx,ty);
        if(b!=='air'){this.world.setBlockAt(tx,ty,'air'); this.player.addItem(BLOCKS[b].drop);}
      }
      if(Input.mouseBtn===2){ // place
        const id=this.player.hotbar[this.player.selected];
        if(id && this.player.inventory[id]>0 && this.world.getBlockAt(tx,ty)==='air'){this.world.setBlockAt(tx,ty,id); this.player.inventory[id]--; }
      }
    }
    this.updateUI();
  }
  updateUI(){
    const invDiv=document.getElementById('inventory'); invDiv.innerHTML='';
    for(const [id,count] of Object.entries(this.player.inventory)){
      if(count<=0)continue;
      const el=document.createElement('div'); el.className='slot'; el.innerHTML=`<strong>${id}</strong><div>${count}</div>`;
      invDiv.appendChild(el);
    }
    const hot=document.getElementById('hotbar'); hot.innerHTML='';
    this.player.hotbar.forEach((id,i)=>{
      const el=document.createElement('div'); el.className='slot'; if(i===this.player.selected) el.classList.add('selected');
      el.innerHTML=`<strong>${id}</strong><div>${this.player.inventory[id]||0}</div>`;
      hot.appendChild(el);
    });
  }
  draw(){
    const ctx=this.ctx; ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    const cx=Math.floor(this.camera.x/CHUNK_SIZE), cy=Math.floor(this.camera.y/CHUNK_SIZE);
    for(let ox=-VISIBLE_RANGE;ox<=VISIBLE_RANGE;ox++)for(let oy=-VISIBLE_RANGE;oy<=VISIBLE_RANGE;oy++){
      const ch=this.world.getChunk(cx+ox,cy+oy);
      for(let ty=0;ty<CHUNK_SIZE;ty++)for(let tx=0;tx<CHUNK_SIZE;tx++){
        const id=ch.get(tx,ty); if(id==='air')continue;
        const wx=(cx+ox)*CHUNK_SIZE+tx, wy=(cy+oy)*CHUNK_SIZE+ty;
        const sx=(wx-this.camera.x)*TILE+this.canvas.width/2, sy=(wy-this.camera.y)*TILE+this.canvas.height/2;
        ctx.fillStyle=BLOCKS[id].color; ctx.fillRect(sx,sy,TILE,TILE);
      }
    }
    const px=(this.player.x-this.camera.x)*TILE+this.canvas.width/2, py=(this.player.y-this.camera.y)*TILE+this.canvas.height/2;
    ctx.fillStyle='#222'; ctx.fillRect(px-12,py-24,24,24);
    ctx.fillStyle='#fff'; ctx.fillRect(px-6,py-12,12,6);
  }
}

// Boot
const canvas=document.getElementById('c');
canvas.width=CANVAS_W; canvas.height=CANVAS_H;
const game=new Game(canvas);
