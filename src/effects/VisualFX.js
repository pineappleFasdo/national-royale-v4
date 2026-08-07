// VisualFX.js — collision sparks only (no full-screen shake / flash)

export default class VisualFX {

    constructor() {
        this.sparks = [];
        // kept for API compatibility; always zero
        this.shakeX = 0;
        this.shakeY = 0;
    }

    /** no-op — full-screen shake removed */
    shake(_magnitude = 8) {}

    /** no-op — full-screen flash removed */
    flash(_alpha = 0.35, _rgb = "255,255,255") {}

    /**
     * Burst of sparks at a point.
     * @param {number} x
     * @param {number} y
     * @param {number} [count=8]
     * @param {string} [color="#FFD700"]
     */
    spark(x, y, count = 8, color = "#FFD700") {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 4.5;
            this.sparks.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                fade: 0.04 + Math.random() * 0.05,
                size: 1.5 + Math.random() * 2.5,
                color,
            });
        }
        if (this.sparks.length > 180) {
            this.sparks.splice(0, this.sparks.length - 180);
        }
    }

    update() {
        for (const s of this.sparks) {
            s.x += s.vx;
            s.y += s.vy;
            s.vx *= 0.94;
            s.vy *= 0.94;
            s.life -= s.fade;
        }
        this.sparks = this.sparks.filter(s => s.life > 0);
    }

    draw(ctx, _canvasW, _canvasH) {
        for (const s of this.sparks) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, s.life);
            ctx.fillStyle = s.color;
            ctx.shadowColor = s.color;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    reset() {
        this.sparks = [];
        this.shakeX = 0;
        this.shakeY = 0;
    }
}