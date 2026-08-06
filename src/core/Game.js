import PhysicsWorld        from "../physics/PhysicsWorld";
import ArenaPhysics        from "../physics/ArenaPhysics";
import ArenaRenderer       from "../render/ArenaRenderer";
import BottomTrayRenderer  from "../render/BottomTrayRenderer";
import ProgressBarRenderer from "../render/ProgressBarRenderer";
import FlagManager         from "../entities/FlagManager";
import SpawnManager        from "../physics/SpawnManager";
import FlagLoader          from "../assets/FlagLoader";
import EliminationManager  from "../managers/EliminationManager";
import LayoutManager       from "./LayoutManager";
import countries           from "../countries";
import DrainSystem         from "./DrainSystem";
import WinnerManager       from "../managers/WinnerManager";
import WinnerRender        from "../render/WinnerRenderer";
import Confetti            from "../effects/Confetti";
import AudioManager        from "../audio/AudioManager";
import LeaderboardRenderer from "../render/LeaderboardRenderer";
import EventManager        from "../events/EventManager";
import TrayLauncher        from "../effects/TrayLauncher";
import Matter              from "matter-js";

export default class Game {

    constructor(canvas) {
        this.canvas = canvas;
        this.ctx    = canvas.getContext("2d");
        this.totalCountries = countries.length;

        this.physics            = null;
        this.arena              = null;
        this.drain              = null;
        this.flagManager        = null;
        this.eliminationManager = null;

        this.arenaRenderer       = new ArenaRenderer();
        this.bottomTrayRenderer  = new BottomTrayRenderer();
        this.progressBarRenderer = new ProgressBarRenderer();
        this.leaderboardRenderer = new LeaderboardRenderer();
        this.flagLoader          = new FlagLoader();
        this.layout              = new LayoutManager();
        this.eventManager        = new EventManager();
        this.trayLauncher        = new TrayLauncher();

        this.matchStartTime     = Date.now();
        this.lastRemainingCount = -1;

        countries.forEach(c => { c.image = this.flagLoader.load(c.code); });

        this.winnerManager = new WinnerManager();
        this.winnerRender  = new WinnerRender();
        this.confetti      = new Confetti();
        this.audio         = new AudioManager();

        this.gameState             = "PLAYING";
        this.winnerDisplayTime     = 0;
        this.winnerDisplayDuration = 3500;

        this.nextEventTimer    = 0;
        this.nextEventDuration = 150;   // ~2.5 s @ 60fps

        this.restartCountdown = 0;
        this.restartTimer     = null;

        this._nextSpawnPositions = null;
        this._nextFlagW          = 0;
        this._nextFlagH          = 0;
    }

    // ── Resize ────────────────────────────────────────────────────────────────

    resize(width, height) {
        this.canvas.width  = width;
        this.canvas.height = height;

        this.layout.update(width, height);

        this.physics = new PhysicsWorld(width, height);
        Matter.Events.on(this.physics.engine, "collisionStart", (event) => {

            if (this.gameState !== "PLAYING") return;
        
            this.audio.playCollision();
        
        });

        this.arena = new ArenaPhysics(
            this.physics.world,
            this.layout.arenaX,
            this.layout.arenaY,
            this.layout.arenaRadius
        );

        this.drain = new DrainSystem(this.physics.engine, this.physics.world, this.arena);
        this.drain.createSensor();

        this.eliminationManager = new EliminationManager(this.arena, this.physics.world);
        this.flagManager        = new FlagManager(this.physics.world);

        const spawnRadius = this.layout.arenaRadius - 20;
        const { positions, spacing } = SpawnManager.generate(
            this.layout.arenaX, this.layout.arenaY, spawnRadius, this.totalCountries
        );

        const flagW       = Math.max(6, spacing * 0.82);
        const flagH       = Math.max(4, flagW * 0.70);
        const actualCount = Math.min(this.totalCountries, positions.length);

        for (let i = 0; i < actualCount; i++) {
            this.flagManager.addFlag(countries[i], positions[i].x, positions[i].y, flagW, flagH);
        }

        this.arena.setTotalFlags(actualCount);
        this.matchStartTime     = Date.now();
        this.lastRemainingCount = -1;

        this.eventManager.pick();

        this.winnerManager.onWin = (winner) => this.handleWinner(winner);
    }

    // ── State transitions ────────────────────────────────────────────────────

    handleWinner(winner) {
        if (this.restartTimer) { clearTimeout(this.restartTimer); this.restartTimer = null; }

        this.gameState         = "WINNER_SHOW";
        this.winnerDisplayTime = Date.now();

        this.eventManager.end(this._eventCtx());

        this.confetti.start(this.canvas.width / 2, this.canvas.height / 2);
        this.audio.playWinner();
        this.audio.speak(`${winner.country.name} wins!`);

        this.eventManager.pick();

        this.restartTimer = setTimeout(() => this._beginNextEvent(), this.winnerDisplayDuration);
    }

    _beginNextEvent() {
        this.gameState      = "NEXT_EVENT";
        this.nextEventTimer = 0;

        const spawnRadius = this.layout.arenaRadius - 20;
        const { positions, spacing } = SpawnManager.generate(
            this.layout.arenaX, this.layout.arenaY, spawnRadius, this.totalCountries
        );
        this._nextSpawnPositions = positions;
        this._nextFlagW = Math.max(6, spacing * 0.82);
        this._nextFlagH = Math.max(4, this._nextFlagW * 0.70);

        this._clearAllFlags();

        const eliminated = this.eliminationManager ? [...this.eliminationManager.eliminated] : [];
        this.trayLauncher.startLaunch(
            eliminated,
            this.layout.trayTop,
            this.canvas.width,
            this.layout.arenaX,
            this.layout.arenaY,
            this.layout.arenaRadius,
            this._nextSpawnPositions
        );
    }

    _beginCountdown() {
        this.gameState        = "COUNTDOWN";
        this.restartCountdown = 3;

        // PHASE 2 FIX: close the gap synchronously before flags spawn
        this.arena.state      = ArenaPhysics.STATE_INTRO;
        this.arena.introTimer = 0;
        this.arena.gapSize    = 0;
        this.arena.syncWalls();

        const positions = this._nextSpawnPositions;
        const flagW     = this._nextFlagW;
        const flagH     = this._nextFlagH;
        const count     = Math.min(this.totalCountries, positions?.length ?? 0);

        for (let i = 0; i < count; i++) {
            this.flagManager.addFlag(countries[i], positions[i].x, positions[i].y, flagW, flagH);
        }

        this.arena.setTotalFlags(this.totalCountries);
        this.arena.setRemainingFlags(this.totalCountries);
        this.matchStartTime     = Date.now();
        this.lastRemainingCount = -1;

        this.winnerManager.reset();
        this.confetti.particles = [];

        this.arena._flagsRef = this.flagManager.flags;

        // Play the "3" tick immediately when the countdown first appears
        this.audio.resetMilestones();
        this.audio.playCountdown(3);

        this.restartTimer = setInterval(() => {
            this.restartCountdown--;
            if (this.restartCountdown <= 0) {
                clearInterval(this.restartTimer);
                this.restartTimer = null;
                this._startPlaying();
            } else {
                // Play "2" and "1" ticks
                this.audio.playCountdown(this.restartCountdown);
            }
        }, 1000);
    }

    _startPlaying() {
        this.gameState = "PLAYING";
        this.audio.playRoundStart();
        this.eventManager.start(this._eventCtx());
    }

    _clearAllFlags() {
        this.flagManager.flags.forEach(flag => {
            Matter.World.remove(this.physics.world, flag.body);
        });
        this.flagManager.flags             = [];
        this.eliminationManager.eliminated = [];
    }

    _eventCtx() {
        return {
            arena       : this.arena,
            physics     : this.physics,
            drain       : this.drain,
            flagManager : this.flagManager,
        };
    }

    // ── Update ────────────────────────────────────────────────────────────────

    update() {
        const state = this.gameState;

        if (state === "NEXT_EVENT") {
            this.nextEventTimer++;
            this.trayLauncher.update();
            if (this.nextEventTimer >= this.nextEventDuration) {
                this._beginCountdown();
            }
        }

        if (state === "COUNTDOWN") {
            this.physics.update();
            this.arena.update();
        }

        if (state === "PLAYING") {
            // PHASE 2 FIX: arena first so gap masks are set before Matter resolves
            this.arena.update();
            this.eventManager.update(this._eventCtx());
            this.physics.update();
            this.flagManager.update();

            if (!this.arena.isIntro) {
                const countBefore = this.flagManager.flags.length;
                this.eliminationManager.update(this.flagManager);
                const countAfter  = this.flagManager.flags.length;

                // Fire the pop/elimination sound once per frame that removes flags
                if (countAfter < countBefore) {
                    this.audio.playElimination();
                    this.audio.playMilestone(countAfter, this.totalCountries);
                }

                this.arena.setRemainingFlags(countAfter);
                this.drain.update();
                this.drain.applyDrainForce(this.flagManager.flags);
            }
        }

        this.winnerManager.update(this.flagManager);
        this.confetti.update();
    }

    // ── Draw ──────────────────────────────────────────────────────────────────

    draw() {
        const { ctx } = this;
        const layout  = this.layout;

        ctx.fillStyle = "#111";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Leaderboard — always drawn, shows dash placeholders before first win
        const leaderboard = this.winnerManager.getLeaderboard();
        this.leaderboardRenderer.draw(
            ctx,
            leaderboard,
            layout.lbX, layout.lbY, layout.lbW, layout.lbRowH, layout.lbRowCount
        );

        this.arenaRenderer.draw(ctx, this.arena);
        this.flagManager.draw(ctx);

        // Tray-launcher arc animation (over arena, under overlays)
        this.trayLauncher.draw(ctx);

        if (this.gameState === "PLAYING") {
            this.progressBarRenderer.draw(
                ctx,
                this.eliminationManager?.eliminated ?? [],
                this.totalCountries,
                layout.barCenterX, layout.barY, layout.barWidth, layout.barHeight
            );
        }

        this.bottomTrayRenderer.draw(
            ctx,
            this.eliminationManager?.eliminated ?? [],
            this.canvas.width, this.canvas.height
        );

        this._drawCentralOverlay(ctx);

        if (this.gameState === "WINNER_SHOW" || this.gameState === "COUNTDOWN") {
            this.winnerRender.draw(
                ctx, this.winnerManager.winner,
                this.canvas.width, this.canvas.height,
                this.gameState === "COUNTDOWN"
            );
        }

        this.confetti.draw(ctx);

        if (this.gameState === "NEXT_EVENT") {
            this._drawNextEventOverlay(ctx);
        }

        if (this.gameState === "COUNTDOWN") {
            this._drawCountdownOverlay(ctx);
        }
    }

    // ── Overlay helpers ───────────────────────────────────────────────────────

    _drawCentralOverlay(ctx) {
        const { arena, canvas } = this;

        if (this.gameState === "PLAYING" && arena.state === ArenaPhysics.STATE_INTRO) {
            const framesLeft = arena.introDuration - arena.introTimer;
            const secsLeft   = Math.ceil(framesLeft / 60);

            ctx.save();

            ctx.fillStyle = "rgba(0,0,0,0.32)";
            ctx.beginPath();
            ctx.arc(this.layout.arenaX, this.layout.arenaY, this.layout.arenaRadius * 0.38, 0, Math.PI * 2);
            ctx.fill();

            const cx = canvas.width / 2;
            const cy = this.layout.arenaY;

            const ev = this.eventManager;
            ctx.font         = "bold 18px Arial";
            ctx.textAlign    = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle    = ev.color;
            ctx.shadowColor  = "rgba(0,0,0,0.9)";
            ctx.shadowBlur   = 12;
            ctx.fillText(`${ev.icon} ${ev.name}`, cx, cy - 55);

            ctx.font      = "bold 22px Arial";
            ctx.fillStyle = "rgba(255,255,255,0.80)";
            ctx.shadowBlur = 10;
            ctx.fillText("OPENING IN", cx, cy - 22);

            ctx.font      = "bold 68px Arial";
            ctx.fillStyle = "#FFD700";
            ctx.shadowBlur = 22;
            ctx.fillText(secsLeft, cx, cy + 35);

            ctx.restore();

        } else if (this.gameState === "PLAYING" && arena.state === ArenaPhysics.STATE_OPENING) {
            ctx.save();
            ctx.font         = "bold 44px Arial";
            ctx.textAlign    = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle    = "rgba(255,215,0,0.80)";
            ctx.shadowColor  = "rgba(0,0,0,0.8)";
            ctx.shadowBlur   = 16;
            ctx.fillText("⚡ OPENING ⚡", canvas.width / 2, this.layout.arenaY);
            ctx.restore();
        }
    }

    _drawNextEventOverlay(ctx) {
        const ev    = this.eventManager;
        const cx    = this.canvas.width  / 2;
        const cy    = this.layout.arenaY;
        const t     = Math.min(1, this.nextEventTimer / 15);
        const alpha = t;

        ctx.save();
        ctx.globalAlpha = alpha;

        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.beginPath();
        ctx.arc(cx, cy, this.layout.arenaRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor  = "rgba(0,0,0,0.9)";
        ctx.shadowBlur   = 20;

        ctx.font      = "bold 36px Arial";
        ctx.fillStyle = "#FFD700";
        ctx.fillText("NEXT EVENT", cx, cy - 30);

        ctx.font      = "bold 52px Arial";
        ctx.fillStyle = ev.color;
        ctx.shadowBlur = 28;
        ctx.fillText(`${ev.icon} ${ev.name}`, cx, cy + 32);

        ctx.restore();
    }

    _drawCountdownOverlay(ctx) {
        if (this.restartCountdown <= 0) return;

        const cx = this.canvas.width  / 2;
        const cy = this.layout.arenaY;

        ctx.save();

        ctx.fillStyle = "rgba(0,0,0,0.38)";
        ctx.beginPath();
        ctx.arc(cx, cy, this.layout.arenaRadius * 0.48, 0, Math.PI * 2);
        ctx.fill();

        const ev = this.eventManager;
        ctx.font         = "bold 18px Arial";
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle    = ev.color;
        ctx.shadowColor  = "rgba(0,0,0,0.9)";
        ctx.shadowBlur   = 12;
        ctx.fillText(`${ev.icon} ${ev.name}`, cx, cy - 58);

        ctx.font      = "bold 110px Arial";
        ctx.fillStyle = "#FFD700";
        ctx.shadowBlur = 24;
        ctx.fillText(this.restartCountdown, cx, cy + 18);

        ctx.restore();
    }

    // ── Main loop ─────────────────────────────────────────────────────────────

    loop = () => {
        this.update();
        this.draw();
        requestAnimationFrame(this.loop);
    };
}