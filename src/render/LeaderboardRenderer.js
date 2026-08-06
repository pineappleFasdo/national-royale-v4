export default class LeaderboardRenderer {

    draw(ctx, rows, x, y, width, rowH = 26, maxRows = 5) {

        if (!rows || rows.length === 0) return;

        const visible  = rows.slice(0, maxRows);
        const totalH   = rowH * visible.length;
        const padL     = Math.round(rowH * 0.35);
        const flagW    = Math.round(rowH * 1.50);
        const flagH    = Math.round(rowH * 0.70);
        const fontSize = Math.max(10, Math.round(rowH * 0.46));

        const rowBg = [
            "rgba(212,160,23,0.25)",   // Gold
            "rgba(70,90,170,0.22)",    // Blue
            "rgba(70,90,170,0.22)",    // Blue
        ];
        const rankCol = ["#D4A017", "#AAAAAA", "#C46228"];

        ctx.save();

        ctx.fillStyle = "rgba(10,12,28,0.88)";
        ctx.beginPath();
        ctx.roundRect(x, y, width, totalH, 5);
        ctx.fill();

        visible.forEach((entry, i) => {

            const rx   = x;
            const ry   = y + i * rowH;
            const midY = ry + rowH / 2;

            ctx.fillStyle = rowBg[i] ?? "rgba(255,255,255,0.04)";
            ctx.beginPath();
            ctx.roundRect(rx, ry, width, rowH - 1, 3);
            ctx.fill();

            // Rank
            ctx.fillStyle    = rankCol[i] ?? "rgba(255,255,255,0.55)";
            ctx.font         = `bold ${fontSize}px Arial`;
            ctx.textAlign    = "left";
            ctx.textBaseline = "middle";
            const medals = ["🥇", "🥈", "🥉"];

ctx.fillText(
    medals[i] ?? `${i + 1}.`,
    rx + padL,
    midY
);

            const rankW = ctx.measureText(`${i + 1}°`).width;
            const flagX = rx + padL + rankW + 6;
            const flagY = ry + (rowH - flagH) / 2;

            // Flag
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

            // Name — truncates before it collides with the win count
            const nameX    = flagX + flagW + Math.round(rowH * 0.3);
            ctx.font       = `bold ${fontSize}px Arial`;
            const winsText = `${entry.wins} WIN${entry.wins !== 1 ? "S" : ""}`;
            const winsW    = ctx.measureText(winsText).width;
            const maxNameW = width - (nameX - rx) - winsW - padL * 3;

            ctx.fillStyle    = "#FFFFFF";
            ctx.textAlign    = "left";
            ctx.textBaseline = "middle";

            let name = entry.name;
            while (ctx.measureText(name).width > maxNameW && name.length > 2) {
                name = name.slice(0, -1);
            }
            if (name !== entry.name) name += "…";
            ctx.fillText(name, nameX, midY);

            // Win count
            ctx.fillStyle    = "#FFC44D";
            ctx.textAlign    = "right";
            ctx.textBaseline = "middle";
            ctx.fillText(winsText, rx + width - padL, midY);

            // Row divider
            if (i < visible.length - 1) {
                ctx.strokeStyle = "rgba(255,255,255,0.08)";
                ctx.lineWidth   = 1;
                ctx.beginPath();
                ctx.moveTo(rx + padL, ry + rowH);
                ctx.lineTo(rx + width - padL, ry + rowH);
                ctx.stroke();
            }
        });

        ctx.strokeStyle = "rgba(255,200,80,0.20)";
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.roundRect(x, y, width, totalH, 5);
        ctx.stroke();

        ctx.restore();
    }
}