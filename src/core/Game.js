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
import CommentarySystem    from "../audio/CommentarySystem";
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
        this.commentary    = new CommentarySystem(this.audio);

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

            const isPlaying  = this.gameState === "PLAYING";
            const isCountdown = this.gameState === "COUNTDOWN";

            if (!isPlaying && !isCountdown) return;

            for (const pair of event.pairs) {
                const labelA = pair.bodyA.label;
                const labelB = pair.bodyB.label;

                const isFlag = (l) => l === "flag";
                const isWall = (l) => l === "arenaWall";

                if (isFlag(labelA) && isFlag(labelB)) {
                    // Flag ↔ Flag: play thud during both COUNTDOWN and PLAYING
                    this.audio.playCollision("flag");
                    break;
                }
                if (isPlaying && (isFlag(labelA) || isFlag(labelB)) && (isWall(labelA) || isWall(labelB))) {
                    // Flag ↔ Wall: only during PLAYING — walls rotate constantly
                    // during countdown and would flood the soundscape
                    this.audio.playCollision("wall");
                    break;
                }
            }

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

        // Store spawn positions so _beginCountdown() can pick them up,
        // just like it does for every round after the first.
        this._nextSpawnPositions = positions;
        this._nextFlagW = Math.max(6, spacing * 0.82);
        this._nextFlagH = Math.max(4, this._nextFlagW * 0.70);

        // Pick the first event before the countdown so it's ready to display.
        this.eventManager.pick();

        // Wire the win callback before _beginCountdown() fires.
        this.winnerManager.onWin = (winner) => this.handleWinner(winner);

        // Route the first round through the same countdown flow as all later
        // rounds — this is what shows the event name on first start.
        this._beginCountdown();
    }

    // ── State transitions ────────────────────────────────────────────────────

    handleWinner(winner) {
        if (this.restartTimer) { clearTimeout(this.restartTimer); this.restartTimer = null; }

        this.gameState         = "WINNER_SHOW";
        this.winnerDisplayTime = Date.now();

        this.eventManager.end(this._eventCtx());

        // Silence any in-progress commentary so it doesn't clash with the announcement
        this.commentary.silence();

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

        // Reset arena radius in case ShrinkingArena left it smaller than full size
        this.arena.radius     = this.layout.arenaRadius;
        // Keep arena walls fully closed during the countdown.
        // Set introDuration very high so the arena never auto-transitions to
        // STATE_OPENING on its own — _startPlaying() will force STATE_PLAYING instantly.
        this.arena.state         = ArenaPhysics.STATE_INTRO;
        this.arena.introTimer    = 0;
        this.arena.introDuration = 99999;
        this.arena.gapSize       = 0;
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

        // Reset the outer-boundary snapshot so the elimination zone
        // matches the freshly-restored arena radius each new round.
        if (this.eliminationManager) {
            this.eliminationManager.reset();
        }

        this.winnerManager.reset();
        this.confetti.particles = [];

        this.arena._flagsRef = this.flagManager.flags;

        // Play the "3" tick immediately when the countdown first appears
        this.audio.resetMilestones();
        this.commentary.silence();   // don't talk over the 3-2-1 countdown
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
        // Open the arena INSTANTLY — skip the INTRO timer and OPENING animation.
        // The 3-2-1 countdown in _drawCountdownOverlay is the only countdown the
        // player sees; there is no separate "OPENING IN" phase any more.
        this.arena.state   = ArenaPhysics.STATE_PLAYING;
        this.arena.gapSize = this.arena.initialGapSize;
        this.arena.syncWalls();
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

                // Periodic ambient commentary — silenced automatically outside PLAYING
                this.commentary.update(countAfter, this.totalCountries);
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
        // No central overlay text any more.
        // The 3-2-1 countdown (_drawCountdownOverlay) is the sole signal to
        // the viewer, and the arena opens instantly the moment it ends.
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

        const titleSize = Math.min(this.canvas.width * 0.045, 36);
ctx.font = `bold ${titleSize}px Arial`;
        ctx.fillStyle = "#FFD700";
        ctx.fillText("NEXT EVENT", cx, cy - 30);

        const eventSize = Math.min(this.canvas.width * 0.065, 52);
ctx.font = `bold ${eventSize}px Arial`;
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

        // Slightly larger dark circle so the big number has breathing room
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.beginPath();
        ctx.arc(cx, cy, this.layout.arenaRadius * 0.58, 0, Math.PI * 2);
        ctx.fill();

        const ev = this.eventManager;
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor  = "rgba(0,0,0,0.9)";

        // Event icon + name
        ctx.font = `bold ${Math.min(this.canvas.width * 0.025,20)}px Arial`;
        ctx.fillStyle = ev.color;
        ctx.shadowBlur = 12;
        ctx.fillText(`${ev.icon} ${ev.name}`, cx, cy - 72);

        // "STARTS IN" label
        ctx.font = `bold ${Math.min(this.canvas.width * 0.028,22)}px Arial`;
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.shadowBlur = 10;
        ctx.fillText("STARTS IN", cx, cy - 40);

        // Big countdown number — the centrepiece
        ctx.font = `bold ${Math.min(this.canvas.width * 0.18,150)}px Arial`;
        ctx.fillStyle = "#FFD700";
        ctx.shadowBlur = 32;
        ctx.fillText(this.restartCountdown, cx, cy + 48);

        ctx.restore();
    }

    // ── Main loop ─────────────────────────────────────────────────────────────

    loop = () => {
        this.update();
        this.draw();
        requestAnimationFrame(this.loop);
    };
}