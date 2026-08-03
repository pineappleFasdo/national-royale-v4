import PhysicsWorld from "../physics/PhysicsWorld";
import ArenaPhysics from "../physics/ArenaPhysics";
import ArenaRenderer from "../render/ArenaRenderer";
import FlagManager from "../entities/FlagManager";

import SpawnManager from "../physics/SpawnManager";
export default class Game {

    constructor(canvas) {

        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        this.physics = null;
        this.flagManager = null;

        this.arena = null;
        this.arenaRenderer = new ArenaRenderer();

    }

    resize(width, height) {

        this.canvas.width = width;
        this.canvas.height = height;

        this.physics = new PhysicsWorld(width, height);

        this.flagManager = new FlagManager(
          this.physics.world
      );
      
      const positions = SpawnManager.generate(
        width / 2,
        height / 2,
        220,      // arena radius
        20,       // flag radius
        10
    );
    
    for (const pos of positions) {
    
        this.flagManager.addFlag(
            pos.x,
            pos.y
        );
    
    } 

        this.arena = new ArenaPhysics(
          this.physics.world,
          width / 2,
          height / 2,
          250
      );

    }

    update() {

        this.physics.update();
        this.flagManager.update();

    }

    draw() {

        const ctx = this.ctx;

        ctx.fillStyle = "#111";

        ctx.fillRect(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );

        

        this.arenaRenderer.draw(
          this.ctx,
          this.arena
      );
      this.flagManager.draw(this.ctx);


    }

    loop = () => {

        this.update();

        this.draw();

        requestAnimationFrame(this.loop);

    }

}