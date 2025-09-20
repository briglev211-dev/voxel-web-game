<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Voxel Web Game</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="menu">
    <h1>Voxel Web Game</h1>
    <button id="btnSingle">Singleplayer</button>
    <input id="serverUrl" placeholder="ws://localhost:3000">
    <button id="btnMulti">Multiplayer</button>
  </div>

  <div id="hud">
    <span id="health">Health: 100</span>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.160.0/examples/js/controls/PointerLockControls.js"></script>
  <script src="client.js"></script>
</body>
</html>
