export default class LeaderboardRenderer {

    draw(ctx, rows, x, y, width, rowH = 28, maxRows = 5) {

        // Always render all maxRows — null slots get dash placeholders so the
        // panel is visible from frame one and the layout never shifts.
        const filled  = (rows ?? []).slice(0, maxRows);
        const visible = Array.from({ length: maxRows }, (_, i) => filled[i] ?? null);
        const totalH  = rowH * maxRows;
        const padL    = 10;
        const flagW   = Math.round(rowH * 1.40);
        const flagH   = Math.round(rowH * 0.70);
        const fontSize = Math.max(11, Math.round(rowH * 0.46));

        const rowBg   = [
            "rgba(212,160,23,0.22)",
            "rgba(180,180,180,0.14)",
            "rgba(180,100,40,0.14)",
        ];
        const rankCol = ["#D4A017", "#AAAAAA", "#C46228"];

        ctx.save();

        // Panel background
        ctx.fillStyle = "rgba(10,12,28,0.85)";
        ctx.beginPath();
        ctx.roundRect(x, y, width, totalH, 5);
        ctx.fill();

        visible.forEach((entry, i) => {

            const rx   = x;
            const ry   = y + i * rowH;
            const midY = ry + rowH / 2;

            // Row tint
            ctx.fillStyle = rowBg[i] ?? "rgba(255,255,255,0.04)";
            ctx.beginPath();
            ctx.roundRect(rx, ry, width, rowH - 1, 3);
            ctx.fill();

            // Rank number
            ctx.fillStyle    = rankCol[i] ?? "rgba(255,255,255,0.55)";
            ctx.font         = `bold ${fontSize}px Arial`;
            ctx.textAlign    = "left";
            ctx.textBaseline = "middle";
            ctx.fillText(`${i + 1}°`, rx + padL, midY);

            const rankW = ctx.measureText(`${i + 1}°`).width;
            const flagX = rx + padL + rankW + 8;
            const flagY = ry + (rowH - flagH) / 2;

            // ── Placeholder row (no winner yet) ──────────────────────────
            if (!entry) {
                const dashColor = "rgba(255,255,255,0.22)";
                ctx.strokeStyle = dashColor;
                ctx.lineWidth   = 1;
                ctx.beginPath();
                ctx.roundRect(flagX, flagY, flagW, flagH, 2);
                ctx.stroke();

                ctx.fillStyle    = dashColor;
                ctx.font         = `bold ${fontSize}px Arial`;
                ctx.textAlign    = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("—", flagX + flagW / 2, midY);

                ctx.textAlign = "left";
                ctx.fillText("—", flagX + flagW + 10, midY);

                ctx.textAlign = "right";
                ctx.fillText("—", rx + width - padL, midY);

                if (i < maxRows - 1) {
                    ctx.strokeStyle = "rgba(255,255,255,0.06)";
                    ctx.lineWidth   = 1;
                    ctx.beginPath();
                    ctx.moveTo(rx + padL, ry + rowH);
                    ctx.lineTo(rx + width - padL, ry + rowH);
                    ctx.stroke();
                }
                return;
            }

            // Flag image
            if (entry.image && entry.image.complete) {
                ctx.save();
                ctx.beginPath();
                ctx.roundRect(flagX, flagY, flagW, flagH, 2);
                ctx.clip();
                ctx.drawImage(entry.image, flagX, flagY, flagW, flagH);
                ctx.restore();

                ctx.strokeStyle = "rgba(255,255,255,0.25)";
                ctx.lineWidth   = 0.8;
                ctx.beginPath();
                ctx.roundRect(flagX, flagY, flagW, flagH, 2);
                ctx.stroke();
            }

            // Country name
            const nameX    = flagX + flagW + 10;
            const maxNameW = width - (nameX - rx) - 80;

            ctx.fillStyle    = "#FFFFFF";
            ctx.font         = `bold ${fontSize}px Arial`;
            ctx.textAlign    = "left";
            ctx.textBaseline = "middle";

            let name = entry.name;
            while (ctx.measureText(name).width > maxNameW && name.length > 3) {
                name = name.slice(0, -1);
            }
            if (name !== entry.name) name += "…";
            ctx.fillText(name, nameX, midY);

            // Win count
            ctx.fillStyle    = "#FFC44D";
            ctx.font         = `bold ${fontSize}px Arial`;
            ctx.textAlign    = "right";
            ctx.textBaseline = "middle";
            ctx.fillText(
                `${entry.wins} WIN${entry.wins !== 1 ? "S" : ""}`,
                rx + width - padL,
                midY
            );

            // Row divider
            if (i < maxRows - 1) {
                ctx.strokeStyle = "rgba(255,255,255,0.09)";
                ctx.lineWidth   = 1;
                ctx.beginPath();
                ctx.moveTo(rx + padL, ry + rowH);
                ctx.lineTo(rx + width - padL, ry + rowH);
                ctx.stroke();
            }
        });

        // Outer border
        ctx.strokeStyle = "rgba(255,200,80,0.22)";
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.roundRect(x, y, width, totalH, 5);
        ctx.stroke();

        ctx.restore();
    }
}