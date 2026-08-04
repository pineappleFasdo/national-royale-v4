import PhysicsWorld from "../physics/PhysicsWorld";
import ArenaPhysics from "../physics/ArenaPhysics";
import ArenaRenderer from "../render/ArenaRenderer";
import BottomTrayRenderer from "../render/BottomTrayRenderer";
import FlagManager from "../entities/FlagManager";
import SpawnManager from "../physics/SpawnManager";
import FlagLoader from "../assets/FlagLoader";
import EliminationManager from "../managers/EliminationManager";
import LayoutManager from "./LayoutManager";
import countries from "../countries";


export default class Game {

    constructor(canvas) {

        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        this.physics = null;
        this.arena = null;

        this.flagManager = null;
        this.eliminationManager = null;

        this.arenaRenderer = new ArenaRenderer();
        this.bottomTrayRenderer = new BottomTrayRenderer();

        this.flagLoader = new FlagLoader();
        this.layout = new LayoutManager();

        // Change this value whenever you want
        this.flagCount = 90;

        this.matchStartTime = Date.now();
        this.lastRemainingCount = -1;
       

    }

    resize(width, height) {

        this.canvas.width = width;
        this.canvas.height = height;

        this.layout.update(width, height);

        this.physics = new PhysicsWorld(width, height);

        this.arena = new ArenaPhysics(
            this.physics.world,
            this.layout.arenaX,
            this.layout.arenaY,
            this.layout.arenaRadius
        );
    
        this.eliminationManager =
            new EliminationManager(this.arena);

        this.flagManager =
            new FlagManager(this.physics.world);

        // Load all flag images
        countries.forEach(country => {
            country.image =
                this.flagLoader.load(country.code);
        });

        const flagCount = Math.min(
            this.flagCount,
            countries.length
        );

        // Generate spawn positions
        const positions = SpawnManager.generate(
            this.layout.arenaX,
            this.layout.arenaY,
            this.layout.arenaRadius - 30,
            20,
            flagCount
        );

        console.log("Spawn positions:", positions.length);

        const actualCount = Math.min(
            flagCount,
            positions.length
        );

        // Spawn flags
        for (let i = 0; i < actualCount; i++) {

            this.flagManager.addFlag(
                countries[i],
                positions[i].x,
                positions[i].y
            );

        }

    }

    update() {

        this.physics.update();

        this.arena.update();

        this.flagManager.update();

        this.eliminationManager.update(
            this.flagManager
        );
        this.arena.setRemainingFlags(
            this.flagManager.flags.length
        );

        const remaining = this.flagManager.flags.length;
    


        if (remaining !== this.lastRemainingCount) {
        
            this.lastRemainingCount = remaining;
        
            console.log(
                `Remaining: ${remaining} | Time: ${((Date.now() - this.matchStartTime) / 1000).toFixed(1)}s`
            );
        
        }

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
            ctx,
            this.arena
        );

        this.flagManager.draw(ctx);

        this.bottomTrayRenderer.draw(
            ctx,
            this.eliminationManager.eliminated,
            this.canvas.width,
            this.canvas.height
        );

    }

    loop = () => {

        this.update();

        this.draw();

        requestAnimationFrame(this.loop);

    };

}