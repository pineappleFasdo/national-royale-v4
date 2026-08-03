import PhysicsWorld from "../physics/PhysicsWorld";
import ArenaPhysics from "../physics/ArenaPhysics";
import ArenaRenderer from "../render/ArenaRenderer";
import FlagManager from "../entities/FlagManager";
import SpawnManager from "../physics/SpawnManager";
import FlagLoader from "../assets/FlagLoader";
import countries from "../countries";

export default class Game {

    constructor(canvas) {

        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        this.physics = null;
        this.arena = null;

        this.flagManager = null;
        this.arenaRenderer = new ArenaRenderer();

        this.flagLoader = new FlagLoader();

    }

    resize(width, height) {

        this.canvas.width = width;
        this.canvas.height = height;

        // Physics world
        this.physics = new PhysicsWorld(width, height);

        // Arena
        this.arena = new ArenaPhysics(
            this.physics.world,
            width / 2,
            height / 2,
            250
        );

        // Flag manager
        this.flagManager = new FlagManager(
            this.physics.world
        );

        // Load all flag images
        countries.forEach(country => {
            country.image = this.flagLoader.load(country.code);
        });

        // Generate spawn positions
        const positions = SpawnManager.generate(
            width / 2,
            height / 2,
            220,
            20,
            countries.length
        );

        // Spawn all countries
        for (let i = 0; i < positions.length; i++) {

            this.flagManager.addFlag(
                countries[i],
                positions[i].x,
                positions[i].y
            );

        }

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
            ctx,
            this.arena
        );

        this.flagManager.draw(ctx);

    }

    loop = () => {

        this.update();
        this.draw();

        requestAnimationFrame(this.loop);

    };

}