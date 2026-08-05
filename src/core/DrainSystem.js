import Matter from "matter-js";

export default class DrainSystem {

    constructor(engine, world, arena) {

        this.engine = engine;
        this.world = world;

        // Single source of truth for where the gap actually is.
        // Previously this class tracked its own angle/speed and
        // slowly drifted out of sync with the real wall gap in
        // ArenaPhysics — that mismatch was the main cause of flags
        // clumping/vibrating against solid wall instead of exiting.
        this.arena = arena;

        this.sensor = null;

    }


    createSensor() {

        // Purely a visual/debug marker now, sized to roughly match
        // the gap opening. It no longer deletes flags on contact.
        this.sensor = Matter.Bodies.circle(
            0,
            0,
            this.arena.radius * 0.1,
            {
                isStatic: true,
                isSensor: true,
                label: "drain"
            }
        );

        Matter.World.add(
            this.world,
            this.sensor
        );

    }


    // Center angle + half-width (radians) of the CURRENT real gap,
    // read straight from ArenaPhysics so this is always in sync.
    getGapWindow() {

        const gapStart = this.arena.gapStart || 0;
        const segmentCount = this.arena.segmentCount;
        const gapSize = this.arena.gapSize;

        const gapCenterIndex =
            gapStart + gapSize / 2;

        const gapCenterAngle =
            (gapCenterIndex / segmentCount) *
            Math.PI * 2;

        const gapHalfAngle =
            (gapSize / segmentCount) *
            Math.PI;

        return { gapCenterAngle, gapHalfAngle };

    }


    update() {

        if (!this.sensor) return;

        const { gapCenterAngle } =
            this.getGapWindow();

        const x =
            this.arena.cx +
            Math.cos(gapCenterAngle) *
            this.arena.radius;

        const y =
            this.arena.cy +
            Math.sin(gapCenterAngle) *
            this.arena.radius;

        Matter.Body.setPosition(
            this.sensor,
            { x, y }
        );

    }


    applyDrainForce(flags) {

        const { gapCenterAngle, gapHalfAngle } =
            this.getGapWindow();

        const cx = this.arena.cx;
        const cy = this.arena.cy;

        // How wide a band (in angle) around the gap starts pulling
        // flags toward it, like traffic merging toward an exit.
        const funnelHalfAngle = gapHalfAngle * 3.5;

        for (const flag of flags) {

            const body = flag.body;

            const dx = body.position.x - cx;
            const dy = body.position.y - cy;

            const dist = Math.sqrt(dx * dx + dy * dy);
            const flagAngle = Math.atan2(dy, dx);

            // Signed angular distance to the gap center, in [-PI, PI]
            let diff = flagAngle - gapCenterAngle;
            diff = Math.atan2(Math.sin(diff), Math.cos(diff));

            const nearWall = dist > this.arena.radius * 0.55;

            if (!nearWall) continue;
            if (Math.abs(diff) > funnelHalfAngle) continue;

            // 1) Tangential "funnel" pull: drag flags along the
            //    inside of the wall toward the gap's center angle.
            //    Strength ramps up the closer they already are, so
            //    flags queue up near the opening instead of getting
            //    yanked from anywhere in the arena.
            const closeness =
                1 - Math.abs(diff) / funnelHalfAngle;

            const tangentialStrength =
                0.0006 * closeness;

            const tx = -Math.sin(flagAngle);
            const ty = Math.cos(flagAngle);
            const dir = diff > 0 ? -1 : 1;

            Matter.Body.applyForce(
                body,
                body.position,
                {
                    x: tx * tangentialStrength * dir,
                    y: ty * tangentialStrength * dir
                }
            );

            // 2) Once actually inside the gap's angular window and
            //    close to the boundary, push it OUT radially and
            //    give it some spin — this is the visible "flush".
            const inGapWindow =
                Math.abs(diff) < gapHalfAngle;

            const atBoundary =
                dist > this.arena.radius * 0.75;

            if (inGapWindow && atBoundary) {

                const ejectStrength = 0.003;

                Matter.Body.applyForce(
                    body,
                    body.position,
                    {
                        x: (dx / dist) * ejectStrength,
                        y: (dy / dist) * ejectStrength
                    }
                );

                Matter.Body.setAngularVelocity(
                    body,
                    body.angularVelocity +
                    (Math.random() - 0.5) * 0.15
                );

            }

        }

    }


    draw(ctx) {

        if (!this.sensor) return;

        ctx.beginPath();

        ctx.arc(
            this.sensor.position.x,
            this.sensor.position.y,
            this.sensor.circleRadius,
            0,
            Math.PI * 2
        );

        ctx.strokeStyle = "rgba(255,60,60,0.5)";

        ctx.stroke();

    }

}