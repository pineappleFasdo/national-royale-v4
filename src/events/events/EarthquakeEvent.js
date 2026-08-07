import Matter from "matter-js";

export default class EarthquakeEvent {
    name  = "EARTHQUAKE";
    color = "#FF4444";
    icon  = "🌋";

    _timer     = 0;
    _interval  = 90;
    _shaking   = false;
    _shakeLeft = 0;

    start({ physics }) {
        physics.engine.world.gravity.y = 0;
        this._timer = 0;
    }

    update({ flagManager, physics, arena }) {
        this._timer++;

        if (this._timer >= this._interval) {
            this._timer     = 0;
            this._shaking   = true;
            this._shakeLeft = 18;
            this._interval  = 70 + Math.floor(Math.random() * 60);
        }

        if (this._shaking) {
            this._shakeLeft--;
            if (this._shakeLeft <= 0) this._shaking = false;

            // Shake offset for ArenaRenderer — amplitude tapers as shake ends
            const intensity = this._shakeLeft / 18;
            arena._shakeX = (Math.random() - 0.5) * 18 * intensity;
            arena._shakeY = (Math.random() - 0.5) * 18 * intensity;

            physics.engine.world.gravity.x = (Math.random() - 0.5) * 0.04;
            physics.engine.world.gravity.y = (Math.random() - 0.5) * 0.04;

            for (const flag of flagManager.flags) {
                Matter.Body.applyForce(flag.body, flag.body.position, {
                    x: (Math.random() - 0.5) * 0.0018,
                    y: (Math.random() - 0.5) * 0.0018,
                });
            }
        } else {
            arena._shakeX = 0;
            arena._shakeY = 0;

            physics.engine.world.gravity.x *= 0.85;
            physics.engine.world.gravity.y *= 0.85;
        }
    }

    end({ physics, arena }) {
        physics.engine.world.gravity.x = 0;
        physics.engine.world.gravity.y = 0;
        arena._shakeX = 0;
        arena._shakeY = 0;
    }
}