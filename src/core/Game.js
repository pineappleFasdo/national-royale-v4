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
import WinnerManager from "../managers/WinnerManager";
import WinnerRender from "../render/WinnerRenderer";
import Confetti from "../effects/Confetti";
import AudioManager from "../audio/AudioManager";
import Matter from "matter-js";


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
        this.winnerManager = new WinnerManager();
        this.winnerRender = new WinnerRender();
        this.confetti = new Confetti();
        this.audio = new AudioManager();
        this.restartTimer = null;
this.restartCountdown = 0;

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
        this.winnerManager.onWin = (winner) => {

            this.confetti.start(
                this.canvas.width / 2,
                this.canvas.height / 2
            );
        
            this.audio.speak(
                `${winner.country.name} wins!`
            );
        
            // Auto restart after 5 seconds
            this.restartCountdown = 3;

            this.restartTimer = setInterval(() => {
            
                this.restartCountdown--;
            
                if (this.restartCountdown <= 0) {
            
                    clearInterval(this.restartTimer);
                    this.restartTimer = null;
            
                    this.restartMatch();
            
                }
            
            }, 1000);
        
        };

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
         
        const t0 = performance.now();


const t1 = performance.now();


this.winnerManager.update(this.flagManager);
this.confetti.update();


    }


    draw() {

        const { ctx } = this;
        const t0 = performance.now();

        ctx.fillStyle = "#111";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

       

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

    

        const t1 = performance.now();

    if (performance.now() % 1000 < 16) {
        console.log(
            "Draw:",
            (t1 - t0).toFixed(2),
            "ms"
        );
    }
    if (this.winnerManager.finished) {

        this.winnerRender.draw(
            ctx,
            this.winnerManager.winner,
            this.canvas.width,
            this.canvas.height
        );
    
    }
    this.confetti.draw(ctx);
    this.drawRestartCountdown(ctx);

    }

    restartMatch() {

        console.log("Restarting new match...");
    
        // Reset winner display
        this.winnerManager.reset();
    
        // Remove old physics flags
        this.flagManager.flags.forEach(flag => {
    
            Matter.World.remove(
                this.physics.world,
                flag.body
            );
    
        });
    
        // Clear flags
        this.flagManager.flags = [];
    
        // Clear eliminated tray
        this.eliminationManager.eliminated = [];
    
        // Reset timer
        this.matchStartTime = Date.now();
    
        // Spawn fresh countries
        const spawnRadius = this.layout.arenaRadius - 20;
    
        const { positions, spacing } = SpawnManager.generate(
            this.layout.arenaX,
            this.layout.arenaY,
            spawnRadius,
            countries.length
        );
    
        const flagW = Math.max(6, spacing * 0.82);
        const flagH = Math.max(4, flagW * 0.70);
    
    
        for (let i = 0; i < countries.length; i++) {
    
            this.flagManager.addFlag(
                countries[i],
                positions[i].x,
                positions[i].y,
                flagW,
                flagH
            );
    
        }
    
    
        this.arena.setTotalFlags(
            countries.length
        );
    
        this.arena.setRemainingFlags(
            countries.length
        );
    
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

    drawRestartCountdown(ctx) {

        if (this.restartCountdown <= 0) return;
    
    
        ctx.save();
    
        ctx.font = "bold 80px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
    
        ctx.fillStyle = "white";
        ctx.shadowColor = "black";
        ctx.shadowBlur = 15;
    
    
        ctx.fillText(
            this.restartCountdown,
            this.canvas.width / 2,
            this.canvas.height / 2
        );
    
    
        ctx.restore();
    
    }

}