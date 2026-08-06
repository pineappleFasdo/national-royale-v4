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

        this.matchStartTime     = Date.now();
        this.lastRemainingCount = -1;

        countries.forEach(c => {
            c.image = this.flagLoader.load(c.code);
        });

        this.winnerManager = new WinnerManager();
        this.winnerRender  = new WinnerRender();
        this.confetti      = new Confetti();
        this.audio         = new AudioManager();

        this.gameState             = "PLAYING";
        this.restartCountdown      = 0;
        this.restartTimer          = null;
        this.winnerDisplayTime     = 0;
        this.winnerDisplayDuration = 1500;
    }

    // ── Resize ────────────────────────────────────────────────────────────────

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

        const spawnRadius = this.layout.arenaRadius - 20;
        const { positions, spacing } = SpawnManager.generate(
            this.layout.arenaX,
            this.layout.arenaY,
            spawnRadius,
            this.totalCountries
        );

        const flagW       = Math.max(6, spacing * 0.82);
        const flagH       = Math.max(4, flagW   * 0.70);
        const actualCount = Math.min(this.totalCountries, positions.length);

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

        this.winnerManager.onWin = (winner) => this.handleWinner(winner);

        // Collision sound
        Matter.Events.on(this.physics.engine, "collisionStart", (event) => {
            if (this.gameState !== "PLAYING") return;
            for (const pair of event.pairs) {
                const labA = pair.bodyA.label;
                const labB = pair.bodyB.label;
                if (
                    (labA === "flag" || labB === "flag") &&
                    (labA === "arenaWall" || labB === "arenaWall" ||
                     (labA === "flag"     && labB === "flag"))
                ) {
                    this.audio.playCollision();
                    break;
                }
            }
        });
    }

    // ── Game-state transitions ────────────────────────────────────────────────

    handleWinner(winner) {
        if (this.restartTimer) {
            clearTimeout(this.restartTimer);
            this.restartTimer = null;
        }

        this.gameState         = "WINNER_SHOW";
        this.winnerDisplayTime = Date.now();

        this.confetti.start(this.canvas.width / 2, this.canvas.height / 2);
        this.audio.playWinner();
        setTimeout(() => this.audio.speak(`${winner.country.name} wins!`), 600);

        this.restartTimer = setTimeout(() => {
            this.startCountdown();
        }, this.winnerDisplayDuration);
    }

    startCountdown() {
        this.gameState        = "COUNTDOWN";
        this.restartCountdown = 3;
        this.clearAllFlags();

        this.audio.playCountdown(3);

        this.restartTimer = setInterval(() => {
            this.restartCountdown--;
            if (this.restartCountdown > 0) {
                this.audio.playCountdown(this.restartCountdown);
            }
            if (this.restartCountdown <= 0) {
                clearInterval(this.restartTimer);
                this.restartTimer = null;
                this.restartMatch();
            }
        }, 1000);
    }

    clearAllFlags() {
        this.flagManager.flags.forEach(flag => {
            Matter.World.remove(this.physics.world, flag.body);
        });
        this.flagManager.flags             = [];
        this.eliminationManager.eliminated = [];
    }

    restartMatch() {
        this.gameState = "PLAYING";
        this.winnerManager.reset();
        this.confetti.particles = [];
        this.audio.resetMilestones();

        const spawnRadius = this.layout.arenaRadius - 20;
        const { positions, spacing } = SpawnManager.generate(
            this.layout.arenaX,
            this.layout.arenaY,
            spawnRadius,
            this.totalCountries
        );

        const flagW = Math.max(6, spacing * 0.82);
        const flagH = Math.max(4, flagW   * 0.70);

        for (let i = 0; i < this.totalCountries; i++) {
            this.flagManager.addFlag(
                countries[i],
                positions[i].x,
                positions[i].y,
                flagW,
                flagH
            );
        }

        this.arena.setTotalFlags(this.totalCountries);
        this.arena.setRemainingFlags(this.totalCountries);
        this.matchStartTime     = Date.now();
        this.lastRemainingCount = -1;

        if (this.arena.state === ArenaPhysics.STATE_PLAYING) {
            this.arena.state      = ArenaPhysics.STATE_INTRO;
            this.arena.introTimer = 0;
            this.arena.gapSize    = 0;
        }
    }

    // ── Update ────────────────────────────────────────────────────────────────

    update() {
        if (this.gameState === "PLAYING") {
            this.physics.update();

            const wasIntro = this.arena.isIntro;
            this.arena.update();
            if (wasIntro && !this.arena.isIntro) {
                this.audio.playRoundStart();
            }

            this.flagManager.update();

            if (!this.arena.isIntro) {
                const beforeCount = this.flagManager.flags.length;
                this.eliminationManager.update(this.flagManager);
                const afterCount  = this.flagManager.flags.length;

                if (afterCount < beforeCount) {
                    this.audio.playElimination();
                    this.audio.playMilestone(afterCount, this.totalCountries);
                }

                this.arena.setRemainingFlags(afterCount);
                this.drain.update();
                this.drain.applyDrainForce(this.flagManager.flags);
            }
        }

        this.winnerManager.update(this.flagManager);
        this.confetti.update();
    }

    // ── Draw ──────────────────────────────────────────────────────────────────
    //
    // Canvas zones (all coords from this.layout – nothing hardcoded here):
    //
    //   y=0 ─────────────────────────────────
    //        LEADERBOARD  (layout.lbY, always reserved even before first win)
    //   y=layout.lbZoneH ─────────────────────
    //        (empty gap)
    //        ARENA CIRCLE centred in play zone
    //        (empty gap)
    //   y=layout.barY ────────────────────────
    //        PROGRESS BAR
    //        "ELIMINATED" label
    //   y=layout.trayTop ─────────────────────
    //        BOTTOM TRAY
    //   y=height ─────────────────────────────

    draw() {
        const { ctx, layout } = this;

        // Background
        ctx.fillStyle = "#111";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // ── Leaderboard ───────────────────────────────────────────────────
        const leaderboard = this.winnerManager.getLeaderboard();
        if (leaderboard.length > 0) {
            this.leaderboardRenderer.draw(
                ctx,
                leaderboard,
                layout.lbX,          // centered panel left edge
                layout.lbY,          // = lbTopPad (6px)
                layout.lbW,          // panel width
                layout.lbRowH,       // 28px per row
                layout.lbRowCount    // 5 rows max
            );
        }

        // ── Arena + flags ─────────────────────────────────────────────────
        this.arenaRenderer.draw(ctx, this.arena);
        this.flagManager.draw(ctx);

        // ── Progress bar ──────────────────────────────────────────────────
        if (this.gameState === "PLAYING") {
            this.progressBarRenderer.draw(
                ctx,
                this.eliminationManager ? this.eliminationManager.eliminated : [],
                this.totalCountries,
                layout.barCenterX,
                layout.barY,
                layout.barWidth,
                layout.barHeight
            );
        }

        // ── Bottom tray ───────────────────────────────────────────────────
        this.bottomTrayRenderer.draw(
            ctx,
            this.eliminationManager ? this.eliminationManager.eliminated : [],
            this.canvas.width,
            this.canvas.height,
            layout.bottomTrayHeight
        );
        // ── Central overlays ──────────────────────────────────────────────
        this._drawCentralOverlay(ctx);

        // ── Winner / countdown ────────────────────────────────────────────
        if (this.gameState === "WINNER_SHOW" || this.gameState === "COUNTDOWN") {
            this.winnerRender.draw(
                ctx,
                this.winnerManager.winner,
                this.canvas.width,
                this.canvas.height,
                this.gameState === "COUNTDOWN"
            );
        }

        this.confetti.draw(ctx);
        this.drawRestartCountdown(ctx);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    _drawCentralOverlay(ctx) {
        const { arena, canvas } = this;

        if (arena.state === ArenaPhysics.STATE_INTRO) {
            const framesLeft = arena.introDuration - arena.introTimer;
            const secsLeft   = Math.ceil(framesLeft / 60);

            ctx.save();
            ctx.fillStyle = "rgba(0,0,0,0.30)";
            ctx.beginPath();
            ctx.arc(
                this.layout.arenaX,
                this.layout.arenaY,
                this.layout.arenaRadius * 0.40,
                0, Math.PI * 2
            );
            ctx.fill();

            ctx.font         = "bold 28px Arial";
            ctx.textAlign    = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle    = "rgba(255,255,255,0.80)";
            ctx.shadowColor  = "rgba(0,0,0,0.8)";
            ctx.shadowBlur   = 10;
            ctx.fillText("OPENING IN", canvas.width / 2, this.layout.arenaY - 35);

            ctx.font       = "bold 72px Arial";
            ctx.fillStyle  = "#FFD700";
            ctx.shadowBlur = 20;
            ctx.fillText(secsLeft, canvas.width / 2, this.layout.arenaY + 45);
            ctx.restore();

        } else if (arena.state === ArenaPhysics.STATE_OPENING) {
            ctx.save();
            ctx.font         = "bold 48px Arial";
            ctx.textAlign    = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle    = "rgba(255,215,0,0.80)";
            ctx.shadowColor  = "rgba(0,0,0,0.8)";
            ctx.shadowBlur   = 15;
            ctx.fillText("⚡ OPENING ⚡", canvas.width / 2, this.layout.arenaY);
            ctx.restore();
        }
    }

    drawRestartCountdown(ctx) {
        if (this.gameState !== "COUNTDOWN" || this.restartCountdown <= 0) return;

        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.font         = "bold 120px Arial";
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle    = "#FFD700";
        ctx.shadowColor  = "rgba(0,0,0,0.8)";
        ctx.shadowBlur   = 20;
        ctx.fillText(
            this.restartCountdown,
            this.canvas.width  / 2,
            this.canvas.height / 2 + 60
        );

        ctx.font      = "bold 32px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 10;
        ctx.fillText("NEXT ROUND", this.canvas.width / 2, this.canvas.height / 2 - 80);
        ctx.restore();
    }

    loop = () => {
        this.update();
        this.draw();
        requestAnimationFrame(this.loop);
    };
}