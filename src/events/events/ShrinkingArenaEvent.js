import Matter from "matter-js";

export default class ShrinkingArenaEvent {
    name  = "SHRINKING ARENA";
    color = "#CC44FF";
    icon  = "🔵";

    _originalRadius     = 0;
    _targetRadius       = 0;
    _originalInitialGap = 0;
    _originalMaxGap     = 0;
    _duration           = 600; // ~10 s at 60 fps
    _timer              = 0;

    start({ arena, drain }) {
        this._originalRadius     = arena.radius;
        this._targetRadius       = arena.radius * 0.52;
        this._originalInitialGap = arena.initialGapSize;
        this._originalMaxGap     = arena.maxGapSize;

        // Wider gap only during this event so flags can actually escape
        arena.initialGapSize = 14;
        arena.maxGapSize     = 28;

        this._timer = 0;

        // Tell DrainSystem to use boosted forces + per-flag damping
        if (drain) drain.shrinkMode = true;
    }

    update({ arena, drain }) {
        if (arena.state !== "PLAYING") return;

        this._timer++;

        // Time-based shrink so the arena visibly closes regardless of eliminations
        const t     = Math.min(1, this._timer / this._duration);
        const eased = t < 0.5
            ? 2 * t * t
            : 1 - Math.pow(-2 * t + 2, 2) / 2;

        arena.radius = this._originalRadius
            - (this._originalRadius - this._targetRadius) * eased;

        // Push flags inward when the contracting wall reaches them
        for (const flag of (arena._flagsRef ?? [])) {
            const dx   = flag.body.position.x - arena.cx;
            const dy   = flag.body.position.y - arena.cy;
            const dist = Math.hypot(dx, dy);
            if (dist === 0) continue;

            if (dist > arena.radius - 5) {
                Matter.Body.applyForce(flag.body, flag.body.position, {
                    x: -(dx / dist) * 0.012,
                    y: -(dy / dist) * 0.012,
                });
                // Damp velocity so flags don't endlessly bounce the moving wall
                Matter.Body.setVelocity(flag.body, {
                    x: flag.body.velocity.x * 0.85,
                    y: flag.body.velocity.y * 0.85,
                });
            }
        }
    }

    end({ arena, drain }) {
        arena.radius        = this._originalRadius;
        arena.initialGapSize = this._originalInitialGap;
        arena.maxGapSize    = this._originalMaxGap;

        // Restore normal drain behaviour for all other events
        if (drain) drain.shrinkMode = false;
    }
}
