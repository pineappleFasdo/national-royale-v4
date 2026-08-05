export default class LeaderboardRenderer {

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {Array}  rows   – from WinnerManager.getLeaderboard()
     * @param {number} x      – left edge of the panel
     * @param {number} y      – top edge of the panel
     * @param {number} width  – panel width
     * @param {number} maxRows – how many rows to show (default 5)
     */
    draw(ctx, rows, x, y, width, maxRows = 5) {

        if (!rows || rows.length === 0) return;

        const rowH      = 28;
        const padLeft   = 10;
        const flagW     = 28;
        const flagH     = 19;
        const fontSize  = 13;
        const visible   = rows.slice(0, maxRows);
        const totalH    = rowH * visible.length;

        ctx.save();

        visible.forEach((entry, i) => {

            const rx = x;
            const ry = y + i * rowH;

            // ── Row background ─────────────────────────────────────
            // Highlight top-3 slightly
            if (i === 0)      ctx.fillStyle = "rgba(212,160,23,0.18)";  // gold tint
            else if (i === 1) ctx.fillStyle = "rgba(180,180,180,0.12)"; // silver tint
            else if (i === 2) ctx.fillStyle = "rgba(180,100,40,0.12)";  // bronze tint
            else              ctx.fillStyle = "rgba(255,255,255,0.04)";

            ctx.beginPath();
            ctx.roundRect(rx, ry, width, rowH - 2, 3);
            ctx.fill();

            // ── Rank badge ─────────────────────────────────────────
            const rankColors = ["#D4A017", "#A8A8A8", "#C46228"];
            ctx.fillStyle = rankColors[i] ?? "rgba(255,255,255,0.25)";
            ctx.font      = `bold ${fontSize}px Arial`;
            ctx.textAlign    = "left";
            ctx.textBaseline = "middle";
            ctx.fillText(
                `${i + 1}°`,
                rx + padLeft,
                ry + rowH / 2
            );

            // ── Flag image ─────────────────────────────────────────
            const flagX = rx + padLeft + 28;
            const flagY = ry + (rowH - flagH) / 2;

            if (entry.image && entry.image.complete) {
                ctx.save();
                ctx.beginPath();
                ctx.roundRect(flagX, flagY, flagW, flagH, 2);
                ctx.clip();
                ctx.drawImage(entry.image, flagX, flagY, flagW, flagH);
                ctx.restore();

                // flag border
                ctx.strokeStyle = "rgba(255,255,255,0.20)";
                ctx.lineWidth   = 1;
                ctx.beginPath();
                ctx.roundRect(flagX, flagY, flagW, flagH, 2);
                ctx.stroke();
            }

            // ── Country name ───────────────────────────────────────
            ctx.fillStyle    = "#FFFFFF";
            ctx.font         = `bold ${fontSize}px Arial`;
            ctx.textAlign    = "left";
            ctx.textBaseline = "middle";
            ctx.fillText(
                entry.name,
                flagX + flagW + 10,
                ry + rowH / 2,
            );

            // ── Win count (right-aligned) ──────────────────────────
            ctx.fillStyle    = "#FFC44D";
            ctx.font         = `bold ${fontSize}px Arial`;
            ctx.textAlign    = "right";
            ctx.fillText(
                `${entry.wins} WIN${entry.wins !== 1 ? "S" : ""}`,
                rx + width - padLeft,
                ry + rowH / 2
            );

            // ── Row divider ────────────────────────────────────────
            ctx.strokeStyle = "rgba(255,255,255,0.06)";
            ctx.lineWidth   = 1;
            ctx.beginPath();
            ctx.moveTo(rx, ry + rowH - 1);
            ctx.lineTo(rx + width, ry + rowH - 1);
            ctx.stroke();
        });

        // ── Outer border around whole table ───────────────────────────
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.roundRect(x, y, width, totalH, 5);
        ctx.stroke();

        ctx.restore();
    }
}