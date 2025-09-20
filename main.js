let scene, camera, renderer, controls;
let blockMaterials = {};
let blockMeshes = {};
let world = [];
let playerHealth = 100;
let move = { forward:false, back:false, left:false, right:false };

function init() {
    // Scene and Camera
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);

    // Renderer
    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Light
    const light = new THREE.DirectionalLight(0xffffff,1);
    light.position.set(10,20,10);
    scene.add(light);

    // PointerLockControls
    controls = new THREE.PointerLockControls(camera, renderer.domElement);
    scene.add(controls.getObject());
    renderer.domElement.addEventListener('click', () => controls.lock());

    // Textures
    const loader = new THREE.TextureLoader();
    blockMaterials.grass = new THREE.MeshLambertMaterial({map: loader.load('textures/grass.png')});
    blockMaterials.stone = new THREE.MeshLambertMaterial({map: loader.load('textures/stone.png')});
    blockMaterials.iron = new THREE.MeshLambertMaterial({map: loader.load('textures/iron.png')});
    blockMaterials.diamond = new THREE.MeshLambertMaterial({map: loader.load('textures/diamond.png')});

    // Menu buttons
    document.getElementById("btnSingle").addEventListener("click", startSingleplayer);
    document.getElementById("btnMulti").addEventListener("click", ()=>alert("Multiplayer coming soon!"));

    // Movement keys
    document.addEventListener('keydown', e=>{
        if(e.key==='w') move.forward=true;
        if(e.key==='s') move.back=true;
        if(e.key==='a') move.left=true;
        if(e.key==='d') move.right=true;
    });
    document.addEventListener('keyup', e=>{
        if(e.key==='w') move.forward=false;
        if(e.key==='s') move.back=false;
        if(e.key==='a') move.left=false;
        if(e.key==='d') move.right=false;
    });

    window.addEventListener('resize', ()=> {
        camera.aspect = window.innerWidth/window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// Add block function
function addBlock(x,y,z,type){
    const geo = new THREE.BoxGeometry(1,1,1);
    const mat = blockMaterials[type] || blockMaterials.stone;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x+0.5, y+0.5, z+0.5);
    scene.add(mesh);
    blockMeshes[`${x},${y},${z}`] = mesh;
    world.push({x,y,z,type});
}

// Remove block
function removeBlock(x,y,z){
    const key = `${x},${y},${z}`;
    if(blockMeshes[key]){
        scene.remove(blockMeshes[key]);
        delete blockMeshes[key];
        world = world.filter(b=>!(b.x===x && b.y===y && b.z===z));
    }
}

// Simple flat world
function initWorld(){
    world = []; blockMeshes={};
    for(let x=0;x<10;x++){
        for(let z=0;z<10;z++){
            addBlock(x,0,z,'grass');
            if(Math.random()<0.05) addBlock(x,-1,z,'diamond');
            else if(Math.random()<0.1) addBlock(x,-1,z,'iron');
            else addBlock(x,-1,z,'stone');
        }
    }
}

// Update player position
function updatePlayer(){
    const speed = 0.1;
    if(move.forward) controls.moveForward(speed);
    if(move.back) controls.moveForward(-speed);
    if(move.left) controls.moveRight(-speed);
    if(move.right) controls.moveRight(-speed);
}

// Animation loop
function animate(){
    requestAnimationFrame(animate);
    updatePlayer();
    document.getElementById('health').innerText = `Health: ${Math.floor(playerHealth)}`;
    renderer.render(scene, camera);
}

// Start singleplayer
function startSingleplayer(){
    document.getElementById("menu").style.display="none";
    initWorld();
    camera.position.set(5,2,15);
    controls.getObject().position.set(5,2,15);
    animate();
}

window.onload = init;
