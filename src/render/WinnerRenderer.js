// WinnerRenderer.js
// Renders the winner splash OR a tie screen when multiple flags drained at once.

export default class WinnerRender {

    draw(ctx, winner, canvasWidth, canvasHeight, isCountdown = false) {
        if (!winner) return;

        // ── Tie screen ────────────────────────────────────────────────────────
        if (winner.isTie) {
            if (winner.isSilent) return;   // silent restart — don't render anything
            this._drawTie(ctx, winner, canvasWidth, canvasHeight);
            return;
        }

        // ── Normal winner screen ──────────────────────────────────────────────
        this._drawWinner(ctx, winner, canvasWidth, canvasHeight, isCountdown);
    }

    // ── Private: single winner ────────────────────────────────────────────────

    _drawWinner(ctx, winner, canvasWidth, canvasHeight, isCountdown) {
        const overlayAlpha = isCountdown ? 0.7 : 0.5;
        ctx.save();

        ctx.fillStyle = `rgba(0,0,0,${overlayAlpha})`;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        const img = winner.country.image;
        if (img && img.complete) {
            const flagWidth  = Math.min(canvasWidth * 0.22, 220);
            const flagHeight = flagWidth * 0.70;
            const flagX      = (canvasWidth  - flagWidth)  / 2;
            const flagY      = canvasHeight * 0.33;

            ctx.shadowColor = "rgba(255,215,0,0.4)";
            ctx.shadowBlur  = 50;
            ctx.drawImage(img, flagX, flagY, flagWidth, flagHeight);
            ctx.shadowBlur  = 0;
        }

        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor  = "rgba(0,0,0,0.8)";
        ctx.shadowBlur   = 20;

        const gradient = ctx.createLinearGradient(
            canvasWidth / 2 - 150, canvasHeight / 2,
            canvasWidth / 2 + 150, canvasHeight / 2
        );
        gradient.addColorStop(0,   "#FFD700");
        gradient.addColorStop(0.5, "#FFA500");
        gradient.addColorStop(1,   "#FFD700");

        ctx.fillStyle = gradient;
        const nameSize = Math.min(canvasWidth * 0.06, 58);
        ctx.font = `bold ${nameSize}px Arial`;
        ctx.fillText(
            winner.country.name.toUpperCase(),
            canvasWidth / 2,
            canvasHeight / 2 + 50
        );

        ctx.fillStyle = "#FFD700";
        ctx.font      = "bold 40px Arial";
        ctx.fillText("🏆 WINS! 🏆", canvasWidth / 2, canvasHeight / 2 + 120);

        ctx.restore();
    }

    // ── Private: tie screen ───────────────────────────────────────────────────

    _drawTie(ctx, winner, canvasWidth, canvasHeight) {
        ctx.save();

        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor  = "rgba(0,0,0,0.9)";
        ctx.shadowBlur   = 20;

        // "IT'S A TIE!" heading
        const headingSize = Math.min(canvasWidth * 0.07, 64);
        ctx.font      = `bold ${headingSize}px Arial`;
        ctx.fillStyle = "#FF6B6B";
        ctx.fillText("🤝 IT'S A TIE! 🤝", canvasWidth / 2, canvasHeight * 0.30);

        // Draw small flags side-by-side for each tied country (up to 4)
        const countries  = winner.countries ?? [];
        const maxShow    = Math.min(countries.length, 4);
        const flagW      = Math.min(canvasWidth * 0.14, 120);
        const flagH      = flagW * 0.70;
        const gap        = 16;
        const totalW     = maxShow * flagW + (maxShow - 1) * gap;
        const startX     = (canvasWidth - totalW) / 2;
        const flagY      = canvasHeight * 0.42;

        for (let i = 0; i < maxShow; i++) {
            const img = countries[i].image;
            const x   = startX + i * (flagW + gap);

            if (img && img.complete) {
                ctx.shadowColor = "rgba(255,107,107,0.35)";
                ctx.shadowBlur  = 30;
                ctx.drawImage(img, x, flagY, flagW, flagH);
                ctx.shadowBlur  = 0;
            }

            // Country name below each flag
            const nameSize = Math.min(canvasWidth * 0.025, 18);
            ctx.font      = `bold ${nameSize}px Arial`;
            ctx.fillStyle = "#ffffff";
            ctx.shadowBlur = 8;
            ctx.fillText(
                countries[i].name.toUpperCase(),
                x + flagW / 2,
                flagY + flagH + 14
            );
        }

        // "eliminated at the same time" sub-label
        ctx.font      = `bold ${Math.min(canvasWidth * 0.028, 22)}px Arial`;
        ctx.fillStyle = "rgba(255,255,255,0.70)";
        ctx.shadowBlur = 10;
        ctx.fillText(
            "exited the arena simultaneously",
            canvasWidth / 2,
            canvasHeight * 0.72
        );

        ctx.restore();
    }
}
