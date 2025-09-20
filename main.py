from ursina import *
from random import randint

app = Ursina()

window.title = "PythonCraft"
window.borderless = False
window.exit_button.visible = False

# Load textures
grass_tex = load_texture("textures/grass.png")
stone_tex = load_texture("textures/stone.png")
iron_tex = load_texture("textures/iron.png")
diamond_tex = load_texture("textures/diamond.png")

# Menu
menu_bg = Entity(parent=camera.ui, model="quad", scale=(2,1), color=color.black66)
menu_text = Text("PythonCraft", parent=camera.ui, y=0.3, x=0, origin=(0,0), scale=2)
btn_single = Button("Singleplayer", parent=camera.ui, y=0, scale=(0.3,0.1))
btn_multi = Button("Multiplayer", parent=camera.ui, y=-0.15, scale=(0.3,0.1))

# HUD
health_bar = Text("Health: 100", parent=camera.ui, position=(-0.85,0.45), visible=False)

# Player
player = None
health = 100

class Voxel(Button):
    def __init__(self, position=(0,0,0), block_type="grass"):
        tex = {
            "grass": grass_tex,
            "stone": stone_tex,
            "iron": iron_tex,
            "diamond": diamond_tex
        }.get(block_type, grass_tex)

        super().__init__(
            parent=scene,
            position=position,
            model="cube",
            origin_y=0.5,
            texture=tex,
            color=color.white,
            highlight_color=color.lime
        )
        self.block_type = block_type

    def input(self, key):
        if self.hovered:
            if key == "left mouse down":
                destroy(self)
            if key == "right mouse down":
                Voxel(position=self.position + mouse.normal, block_type="stone")

class Mob(Entity):
    def __init__(self, position=(0,1,0)):
        super().__init__(
            parent=scene,
            model="cube",
            color=color.red,
            scale=0.9,
            position=position
        )
        self.speed = 0.02

    def update(self):
        self.x += (randint(-1,1) * self.speed)

def start_singleplayer():
    global player
    menu_bg.enabled = False
    menu_text.enabled = False
    btn_single.enabled = False
    btn_multi.enabled = False
    health_bar.visible = True

    # World
    for x in range(20):
        for z in range(20):
            Voxel(position=(x,0,z), block_type="grass")
            if randint(1,100) < 10:
                Voxel(position=(x,-1,z), block_type="stone")
            if randint(1,100) < 3:
                Voxel(position=(x,-1,z), block_type="iron")
            if randint(1,100) < 1:
                Voxel(position=(x,-1,z), block_type="diamond")

    # Player
    player = FirstPersonController()
    player.cursor.visible = True

    # Mobs
    for i in range(5):
        Mob(position=(randint(1,18),1,randint(1,18)))

def start_multiplayer():
    menu_text.text = "Multiplayer Coming Soon!"

btn_single.on_click = start_singleplayer
btn_multi.on_click = start_multiplayer

def update():
    global health
    if player:
        # Example: lose health over time
        health -= 0.01
        if health < 0: health = 0
        health_bar.text = f"Health: {int(health)}"

app.run()
