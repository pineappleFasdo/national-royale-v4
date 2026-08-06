import Matter from "matter-js";

export default class ArenaPhysics {

    static STATE_INTRO   = "INTRO";
    static STATE_OPENING = "OPENING";
    static STATE_PLAYING = "PLAYING";

    constructor(world, cx, cy, radius) {

        this.cx     = cx;
        this.cy     = cy;
        this.radius = radius;

        this.rotationSpeed = 0.022;
        this.angle         = 0;

        this.segmentCount = 96;
        this.thickness    = 20;

        this.initialGapSize = 6;
        this.maxGapSize     = 18;
        this.gapSize        = 0;

        this.state           = ArenaPhysics.STATE_INTRO;
        this.introDuration   = 180;
        this.introTimer      = 0;
        this.openingDuration = 90;
        this.openingTimer    = 0;

        this.remainingFlags = 50;
        this.totalFlags     = 50;

        this.segments = [];

        for (let i = 0; i < this.segmentCount; i++) {
            const segAngle = (i / this.segmentCount) * Math.PI * 2;
            const wall = Matter.Bodies.rectangle(
                cx + Math.cos(segAngle) * radius,
                cy + Math.sin(segAngle) * radius,
                this.thickness, 32,
                {
                    isStatic    : true,
                    angle       : segAngle,
                    restitution : 1,
                    friction    : 0,
                    label       : "arenaWall"
                }
            );
            this.segments.push(wall);
        }

        Matter.World.add(world, this.segments);
    }


    setTotalFlags(count) {
        this.totalFlags     = count;
        this.remainingFlags = count;
    }


    setRemainingFlags(count) {
        this.remainingFlags = count;
        if (this.state !== ArenaPhysics.STATE_PLAYING) return;

        const eliminated = this.totalFlags - count;
        const t = Math.max(0, Math.min(1, eliminated / Math.max(1, this.totalFlags - 1)));
        this.gapSize = Math.round(
            this.initialGapSize + (this.maxGapSize - this.initialGapSize) * t
        );
    }


    startOpening() {
        if (this.state === ArenaPhysics.STATE_INTRO) {
            this.state        = ArenaPhysics.STATE_OPENING;
            this.openingTimer = 0;
        }
    }


    /**
     * Force-sync ALL wall collision masks immediately without waiting for update().
     * Call this any time gapSize or state is changed outside the normal loop
     * (e.g. on round reset) to prevent a one-frame ghost-gap that lets freshly-
     * spawned flags leak through the wall.
     */
    syncWalls() {
        const effectiveGap = (this.state === ArenaPhysics.STATE_PLAYING)
            ? this.gapSize
            : 0;

        const gapStart = Math.floor(
            (this.angle / (Math.PI * 2)) * this.segmentCount
        );

        for (let i = 0; i < this.segmentCount; i++) {
            const wall  = this.segments[i];
            const inGap = ((i - gapStart + this.segmentCount) % this.segmentCount)
                          < effectiveGap;

            wall.collisionFilter.mask = inGap ? 0 : 0xFFFFFFFF;

            const segAngle = (i / this.segmentCount) * Math.PI * 2;
            Matter.Body.setPosition(wall, {
                x: this.cx + Math.cos(segAngle) * this.radius,
                y: this.cy + Math.sin(segAngle) * this.radius,
            });
            Matter.Body.setAngle(wall, segAngle);
        }
    }


    get isIntro() {
        return (
            this.state === ArenaPhysics.STATE_INTRO ||
            this.state === ArenaPhysics.STATE_OPENING
        );
    }


    update() {

        if (this.state === ArenaPhysics.STATE_INTRO) {
            this.introTimer++;
            this.rotationSpeed = 0.022 + 0.010 * Math.sin(this.introTimer * 0.06);

            if (this.introTimer >= this.introDuration) {
                this.startOpening();
            }

        } else if (this.state === ArenaPhysics.STATE_OPENING) {
            this.openingTimer++;
            const t = Math.min(1, this.openingTimer / this.openingDuration);
            const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            this.gapSize       = Math.round(this.initialGapSize * eased);
            this.rotationSpeed = 0.022;

            if (this.openingTimer >= this.openingDuration) {
                this.state   = ArenaPhysics.STATE_PLAYING;
                this.gapSize = this.initialGapSize;
            }

        } else {
            this.rotationSpeed = 0.022;
        }

        this.angle += this.rotationSpeed;
        if (this.angle > Math.PI * 2) this.angle -= Math.PI * 2;

        this.gapStart = Math.floor(
            (this.angle / (Math.PI * 2)) * this.segmentCount
        );

        for (let i = 0; i < this.segmentCount; i++) {
            const wall  = this.segments[i];
            const inGap = ((i - this.gapStart + this.segmentCount) % this.segmentCount)
                          < this.gapSize;

            wall.collisionFilter.mask = inGap ? 0 : 0xFFFFFFFF;

            const segAngle = (i / this.segmentCount) * Math.PI * 2;
            Matter.Body.setPosition(wall, {
                x: this.cx + Math.cos(segAngle) * this.radius,
                y: this.cy + Math.sin(segAngle) * this.radius
            });
            Matter.Body.setAngle(wall, segAngle);
        }
    }
}