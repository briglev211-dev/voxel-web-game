let isSingleplayer = false;
let world = [];
let player = {x:5, y:2, z:5, health:100};

// Three.js setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10,20,10);
scene.add(light);

// Ground plane
const groundGeo = new THREE.PlaneGeometry(50,50);
const groundMat = new THREE.MeshLambertMaterial({color:0x228822});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI/2;
scene.add(ground);

// Block materials
const blockMaterials = {
  grass: new THREE.MeshLambertMaterial({color:0x00ff00}),
  stone: new THREE.MeshLambertMaterial({color:0x888888}),
  diamond: new THREE.MeshLambertMaterial({color:0x00ffff})
};
let blockMeshes = {};

function addBlock(x,y,z,type){
  const geo = new THREE.BoxGeometry(1,1,1);
  const mat = blockMaterials[type] || blockMaterials.stone;
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x+0.5,y+0.5,z+0.5);
  scene.add(mesh);
  blockMeshes[`${x},${y},${z}`] = mesh;
  world.push({x,y,z,type});
}
function removeBlock(x,y,z){
  const key = `${x},${y},${z}`;
  if(blockMeshes[key]){
    scene.remove(blockMeshes[key]);
    delete blockMeshes[key];
    world = world.filter(b=>!(b.x===x&&b.y===y&&b.z===z));
  }
}

// Initialize world
function initWorld(){
  world = [];
  blockMeshes = {};
  for(let x=0;x<10;x++){
    for(let z=0;z<10;z++){
      addBlock(x,0,z,'grass');
      addBlock(x,-1,z,'stone');
      if(Math.random()<0.05)addBlock(x,-1,z,'diamond');
    }
  }
}

// PointerLockControls
const controls = new THREE.PointerLockControls(camera, renderer.domElement);
document.body.addEventListener('click', ()=>controls.lock());
scene.add(controls.getObject());

// WASD movement
const move={forward:false,back:false,left:false,right:false};
document.addEventListener('keydown',e=>{
  if(e.key==='w') move.forward=true;
  if(e.key==='s') move.back=true;
  if(e.key==='a') move.left=true;
  if(e.key==='d') move.right=true;
});
document.addEventListener('keyup',e=>{
  if(e.key==='w') move.forward=false;
  if(e.key==='s') move.back=false;
  if(e.key==='a') move.left=false;
  if(e.key==='d') move.right=false;
});

function updatePlayer(){
  const speed = 0.1;
  if(move.forward) controls.moveForward(speed);
  if(move.back) controls.moveForward(-speed);
  if(move.left) controls.moveRight(-speed);
  if(move.right) controls.moveRight(speed);
  document.getElementById('health').innerText = `Health: ${Math.floor(player.health)}`;
}

// Mining/placing blocks
window.addEventListener('mousedown',e=>{
  const bx = Math.floor(player.x);
  const by = Math.floor(player.y);
  const bz = Math.floor(player.z);
  if(e.button===0) removeBlock(bx,by,bz);
  if(e.button===2) addBlock(bx,by,bz,'stone');
});

// Animate loop
function animate(){
  requestAnimationFrame(animate);
  updatePlayer();
  renderer.render(scene,camera);
}

// Start Singleplayer
function startSingleplayer(){
  isSingleplayer=true;
  document.getElementById("menu").style.display="none";
  initWorld();
  camera.position.set(5,2,15);
  controls.getObject().position.set(5,2,15);
  animate();
}

// Start Multiplayer (placeholder)
function startMultiplayer(){
  alert("Multiplayer not implemented yet. You can play Singleplayer.");
}

// Attach buttons
window.startSingleplayer=startSingleplayer;
window.startMultiplayer=startMultiplayer;
document.getElementById("btnSingle").addEventListener("click",startSingleplayer);
document.getElementById("btnMulti").addEventListener("click",startMultiplayer);
