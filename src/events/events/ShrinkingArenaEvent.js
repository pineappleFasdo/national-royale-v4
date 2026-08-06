import Matter from "matter-js";

export default class ShrinkingArenaEvent {
    name  = "SHRINKING ARENA";
    color = "#CC44FF";
    icon  = "🔵";

    _originalRadius = 0;
    _targetRadius   = 0;
    _elapsed        = 0;
    _duration       = 3600;

    start({ arena }) {
        this._originalRadius = arena.radius;
        this._targetRadius   = arena.radius * 0.52;
        this._elapsed        = 0;
    }

    update({ arena }) {
        if (arena.state !== "PLAYING") return;

        this._elapsed++;
        const t     = Math.min(1, this._elapsed / this._duration);
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        arena.radius = this._originalRadius - (this._originalRadius - this._targetRadius) * eased;

        for (const flag of (arena._flagsRef ?? [])) {
            const dx   = flag.body.position.x - arena.cx;
            const dy   = flag.body.position.y - arena.cy;
            const dist = Math.hypot(dx, dy);
            if (dist > arena.radius - 10) {
                const push = 0.002;
                Matter.Body.applyForce(flag.body, flag.body.position, {
                    x: -(dx / dist) * push,
                    y: -(dy / dist) * push,
                });
            }
        }
    }

    end({ arena }) {
        arena.radius = this._originalRadius;
    }
}