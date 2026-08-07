import Matter from "matter-js";
import Flag   from "./Flag";

export default class FlagManager {

    // Soft speed cap (px/frame equivalent) — stops turbo explosions
    static MAX_SPEED = 14;

    // Below this speed for STILL_FRAMES → considered stuck
    static STILL_SPEED   = 0.35;
    static STILL_FRAMES  = 45;   // ~0.75 s

    constructor(world) {
        this.world = world;
        this.flags = [];
    }


    addFlag(country, x, y, width, height) {
        const flag = new Flag(this.world, country, x, y, width, height);
        this.flags.push(flag);
        return flag;
    }


    /**
     * Optional arena ref for anti-stuck nudges toward the gap / away from wall.
     * Set by Game each frame or once: flagManager.arena = this.arena
     */
    update(arena = null) {

        const maxSpd = FlagManager.MAX_SPEED;

        for (let i = this.flags.length - 1; i >= 0; i--) {
            const flag = this.flags[i];
            const body = flag.body;

            if (body.toRemove) {
                Matter.World.remove(this.world, body);
                this.flags.splice(i, 1);
                continue;
            }

            // ── Speed clamp ────────────────────────────────────────────────
            const vx = body.velocity.x;
            const vy = body.velocity.y;
            const spd = Math.hypot(vx, vy);
            if (spd > maxSpd) {
                const s = maxSpd / spd;
                Matter.Body.setVelocity(body, { x: vx * s, y: vy * s });
            }

            // ── Anti-stuck ─────────────────────────────────────────────────
            if (spd < FlagManager.STILL_SPEED) {
                flag._stillFrames = (flag._stillFrames || 0) + 1;
            } else {
                flag._stillFrames = 0;
            }

            if (flag._stillFrames >= FlagManager.STILL_FRAMES) {
                flag._stillFrames = 0;

                // Small random kick + optional outward/gap bias
                const kick = 2.5 + Math.random() * 3.5;
                let angle = Math.random() * Math.PI * 2;

                if (arena) {
                    const dx = body.position.x - arena.cx;
                    const dy = body.position.y - arena.cy;
                    const dist = Math.hypot(dx, dy) || 1;
                    // Prefer pushing toward gap if near wall, else random
                    if (dist > arena.radius * 0.55) {
                        // Bias toward gap center
                        const gapAngle = ((arena.gapStart || 0) + (arena.gapSize || 0) / 2)
                            / arena.segmentCount * Math.PI * 2;
                        angle = gapAngle + (Math.random() - 0.5) * 0.8;
                    }
                }

                Matter.Body.setVelocity(body, {
                    x: Math.cos(angle) * kick,
                    y: Math.sin(angle) * kick,
                });
                Matter.Body.setAngularVelocity(
                    body,
                    (Math.random() - 0.5) * 0.2
                );
            }
        }
    }


    draw(ctx) {
        for (const flag of this.flags) {
            flag.draw(ctx);
        }
    }

}