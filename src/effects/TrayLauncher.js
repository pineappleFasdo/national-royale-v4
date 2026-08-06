export default class TrayLauncher {

    constructor() {
        this.particles = [];
        this.isDone    = true;
    }

    startLaunch(flags, trayTop, canvasW, arenaX, arenaY, arenaR, targets) {
        this.particles = [];
        this.isDone    = false;

        const total       = flags.length;
        const trayH       = 100;
        const spacing     = 2;
        const aspectRatio = 1.4;
        const maxFlagH    = 16;

        const availW = canvasW - 12;
        const fH     = maxFlagH;
        const fW     = fH * aspectRatio;
        const cols   = Math.max(1, Math.floor(availW / (fW + spacing)));
        const rows   = Math.ceil(total / cols);
        const gridH  = rows * (fH + spacing) - spacing;
        const startY = trayTop + 6 + (trayH - 12 - gridH) / 2;

        flags.forEach((flag, idx) => {
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            const sx  = 6 + col * (fW + spacing) + fW / 2;
            const sy  = startY + row * (fH + spacing) + fH / 2;

            const target = targets?.[idx] ?? {
                x: arenaX + (Math.random() - 0.5) * arenaR * 1.2,
                y: arenaY + (Math.random() - 0.5) * arenaR * 1.2,
            };

            const delay = Math.floor(idx * (90 / Math.max(1, total)));

            this.particles.push({
                img  : flag.country?.image ?? null,
                sx, sy,
                tx   : target.x,
                ty   : target.y,
                delay,
                t    : 0,
                speed: 0.028 + Math.random() * 0.016,
                w    : fW,
                h    : fH,
                done : false,
                cpx  : (sx + target.x) / 2 + (Math.random() - 0.5) * 60,
                cpy  : Math.min(sy, target.y) - arenaR * 0.55 - Math.random() * arenaR * 0.3,
            });
        });
    }

    update() {
        if (this.isDone) return;

        let allDone = true;

        for (const p of this.particles) {
            if (p.done) continue;

            if (p.delay > 0) {
                p.delay--;
                allDone = false;
                continue;
            }

            p.t += p.speed;
            if (p.t >= 1) {
                p.t    = 1;
                p.done = true;
            } else {
                allDone = false;
            }
        }

        if (allDone) this.isDone = true;
    }

    draw(ctx) {
        if (this.isDone) return;

        for (const p of this.particles) {
            if (p.done || p.delay > 0) continue;

            const t  = p.t;
            const mt = 1 - t;

            // Quadratic Bézier
            const bx = mt * mt * p.sx + 2 * mt * t * p.cpx + t * t * p.tx;
            const by = mt * mt * p.sy + 2 * mt * t * p.cpy + t * t * p.ty;

            const scale = 0.3 + t * 0.7;
            const w     = p.w * scale;
            const h     = p.h * scale;

            // Fade out last 20% of travel
            const alpha = t > 0.8 ? 1 - (t - 0.8) / 0.2 : 1;

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(bx, by);

            if (p.img && p.img.complete && p.img.naturalWidth > 0) {
                ctx.beginPath();
                ctx.roundRect(-w / 2, -h / 2, w, h, Math.max(1, w * 0.08));
                ctx.clip();
                ctx.drawImage(p.img, -w / 2, -h / 2, w, h);
            } else {
                ctx.fillStyle = "#334466";
                ctx.beginPath();
                ctx.roundRect(-w / 2, -h / 2, w, h, 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }
}