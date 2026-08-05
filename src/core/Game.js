import PhysicsWorld       from "../physics/PhysicsWorld";
import ArenaPhysics       from "../physics/ArenaPhysics";
import ArenaRenderer      from "../render/ArenaRenderer";
import BottomTrayRenderer from "../render/BottomTrayRenderer";
import FlagManager        from "../entities/FlagManager";
import SpawnManager       from "../physics/SpawnManager";
import FlagLoader         from "../assets/FlagLoader";
import EliminationManager from "../managers/EliminationManager";
import LayoutManager      from "./LayoutManager";
import countries          from "../countries";
import DrainSystem        from "./DrainSystem";


export default class Game {

    constructor(canvas) {

        this.canvas = canvas;
        this.ctx    = canvas.getContext("2d");

        this.physics            = null;
        this.arena              = null;
        this.drain              = null;
        this.flagManager        = null;
        this.eliminationManager = null;

        this.arenaRenderer      = new ArenaRenderer();
        this.bottomTrayRenderer = new BottomTrayRenderer();
        this.flagLoader         = new FlagLoader();
        this.layout             = new LayoutManager();

        this.matchStartTime     = Date.now();
        this.lastRemainingCount = -1;

        // Preload all images once — stays cached across resizes
        countries.forEach(c => {
            c.image = this.flagLoader.load(c.code);
        });

    }


    resize(width, height) {

        this.canvas.width  = width;
        this.canvas.height = height;

        this.layout.update(width, height);

        this.physics = new PhysicsWorld(width, height);

        this.arena = new ArenaPhysics(
            this.physics.world,
            this.layout.arenaX,
            this.layout.arenaY,
            this.layout.arenaRadius
        );

        this.drain = new DrainSystem(
            this.physics.engine,
            this.physics.world,
            this.arena
        );
        this.drain.createSensor();

        this.eliminationManager = new EliminationManager(
            this.arena,
            this.physics.world
        );

        this.flagManager = new FlagManager(this.physics.world);

        // SpawnManager finds the largest spacing where ALL countries fit.
        // Flag size is derived from that spacing — auto-scales to screen.
        const spawnRadius    = this.layout.arenaRadius - 20;
        const totalCountries = countries.length;

        const { positions, spacing } = SpawnManager.generate(
            this.layout.arenaX,
            this.layout.arenaY,
            spawnRadius,
            totalCountries
        );

        const flagW = Math.max(6,  spacing * 0.82);
        const flagH = Math.max(4,  flagW   * 0.70);

        console.log(
            `Arena r=${this.layout.arenaRadius.toFixed(0)} | ` +
            `spacing=${spacing.toFixed(1)} | ` +
            `flagW=${flagW.toFixed(1)} flagH=${flagH.toFixed(1)} | ` +
            `slots=${positions.length} countries=${totalCountries}`
        );

        const actualCount = Math.min(totalCountries, positions.length);

        for (let i = 0; i < actualCount; i++) {
            this.flagManager.addFlag(
                countries[i],
                positions[i].x,
                positions[i].y,
                flagW,
                flagH
            );
        }

        this.arena.setTotalFlags(actualCount);

        this.matchStartTime     = Date.now();
        this.lastRemainingCount = -1;

    }


    update() {

        this.physics.update();
        this.arena.update();
        this.flagManager.update();

        if (!this.arena.isIntro) {

            this.eliminationManager.update(this.flagManager);
            this.arena.setRemainingFlags(this.flagManager.flags.length);
            this.drain.update();
            this.drain.applyDrainForce(this.flagManager.flags);

        }

        const remaining = this.flagManager.flags.length;
         
        const t0 = performance.now(); this.physics.update(); const t1 = performance.now(); if (performance.now() % 1000 < 16) { console.log("Physics:", (t1 - t0).toFixed(2), "ms"); }

    }


    draw() {

        const { ctx } = this;

        ctx.fillStyle = "#111";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.arena.state === ArenaPhysics.STATE_INTRO) {
            this._drawIntroOverlay(ctx);
        }

        this.arenaRenderer.draw(ctx, this.arena);
        this.flagManager.draw(ctx);

        this.bottomTrayRenderer.draw(
            ctx,
            this.eliminationManager
                ? this.eliminationManager.eliminated
                : [],
            this.canvas.width,
            this.canvas.height
        );

        this._drawStateLabel(ctx);

    }


    _drawIntroOverlay(ctx) {

        const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 180);
        const alpha = 0.07 + 0.07 * pulse;

        ctx.save();
        ctx.beginPath();
        ctx.arc(
            this.layout.arenaX,
            this.layout.arenaY,
            this.layout.arenaRadius,
            0, Math.PI * 2
        );
        ctx.strokeStyle = `rgba(255,220,50,${alpha})`;
        ctx.lineWidth   = 20;
        ctx.stroke();
        ctx.restore();

    }


    _drawStateLabel(ctx) {

        const { arena, canvas } = this;
        let text = "";

        if (arena.state === ArenaPhysics.STATE_INTRO) {
            const framesLeft = arena.introDuration - arena.introTimer;
            const secsLeft   = Math.ceil(framesLeft / 60);
            text = `Opening in ${secsLeft}…`;
        } else if (arena.state === ArenaPhysics.STATE_OPENING) {
            text = "OPENING!";
        }

        if (!text) return;

        ctx.save();
        ctx.font         = "bold 22px sans-serif";
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle    = "rgba(255,255,255,0.9)";
        ctx.shadowColor  = "#000";
        ctx.shadowBlur   = 10;
        ctx.fillText(
            text,
            canvas.width  / 2,
            this.layout.arenaY + this.layout.arenaRadius + 36
        );
        ctx.restore();

    }


    loop = () => {
        this.update();
        this.draw();
        requestAnimationFrame(this.loop);
    };

}