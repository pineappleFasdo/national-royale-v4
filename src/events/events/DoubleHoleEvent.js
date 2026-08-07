import Matter from "matter-js";

export default class DoubleHoleEvent {
    name  = "DOUBLE HOLE";
    color = "#FF44AA";
    icon  = "🕳️";

    start({ arena }) {
        arena._doubleHole = true;
    }

    update({ arena, flagManager }) {
        if (arena.state !== "PLAYING") return;

        const half           = Math.floor(arena.segmentCount / 2);
        const seg            = arena.segmentCount;
        const secondGapStart = (arena.gapStart + half) % seg;

        // ── 1. Open the second physical gap ──────────────────────────────
        for (let i = 0; i < seg; i++) {
            const inSecondGap = ((i - secondGapStart + seg) % seg) < arena.gapSize;
            if (inSecondGap) {
                arena.segments[i].collisionFilter.mask = 0;
            }
        }

        // ── 2. Mirror the DrainSystem funnel for the second gap ──────────
        // Without this, flags only get pulled toward hole 1; hole 2
        // would be physically open but flags would never naturally reach it.
        const gapCenterIndex  = secondGapStart + arena.gapSize / 2;
        const secondGapAngle  = (gapCenterIndex / seg) * Math.PI * 2;
        const gapHalfAngle    = (arena.gapSize / seg) * Math.PI;
        const funnelHalfAngle = gapHalfAngle * 3.5;

        const cx = arena.cx;
        const cy = arena.cy;

        for (const flag of (flagManager?.flags ?? [])) {
            const body = flag.body;
            const dx   = body.position.x - cx;
            const dy   = body.position.y - cy;
            const dist = Math.hypot(dx, dy);
            if (dist === 0) continue;

            const flagAngle = Math.atan2(dy, dx);
            let diff = flagAngle - secondGapAngle;
            diff = Math.atan2(Math.sin(diff), Math.cos(diff)); // normalise to [-π, π]

            const nearWall = dist > arena.radius * 0.55;
            if (!nearWall || Math.abs(diff) > funnelHalfAngle) continue;

            // Tangential pull toward second gap centre
            const closeness = 1 - Math.abs(diff) / funnelHalfAngle;
            const tx  = -Math.sin(flagAngle);
            const ty  =  Math.cos(flagAngle);
            const dir = diff > 0 ? -1 : 1;

            Matter.Body.applyForce(body, body.position, {
                x: tx * 0.0006 * closeness * dir,
                y: ty * 0.0006 * closeness * dir,
            });

            // Radial eject once inside the gap window and near the wall
            if (Math.abs(diff) < gapHalfAngle && dist > arena.radius * 0.75) {
                Matter.Body.applyForce(body, body.position, {
                    x: (dx / dist) * 0.003,
                    y: (dy / dist) * 0.003,
                });
                Matter.Body.setAngularVelocity(
                    body,
                    body.angularVelocity + (Math.random() - 0.5) * 0.15
                );
            }
        }
    }

    end({ arena }) {
        arena._doubleHole = false;
        for (const seg of arena.segments) {
            seg.collisionFilter.mask = 0xFFFFFFFF;
        }
    }
}
