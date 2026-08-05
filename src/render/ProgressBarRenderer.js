export default class ProgressBarRenderer {

    draw(ctx, eliminatedFlags, total, x, y, width) {

        const eliminated = eliminatedFlags.length;
        const alive = total - eliminated;

        const barWidth = width;
        const barHeight = 18;
        const barX = x - barWidth / 2;
        const barY = y;

        const fraction = total > 0 ? alive / total : 0;

        ctx.save();

        // Background
        ctx.fillStyle = "#111A36";
        ctx.fillRect(
            barX,
            barY,
            barWidth,
            barHeight
        );

        // Fill color
        let fillColor;

        if (fraction > 0.65) {

            // Early game
            fillColor = "#62B6FF";

        } else if (fraction > 0.35) {

            // Mid game
            fillColor = "#B38BC2";

        } else {

            // Late game
            fillColor = "#D96E98";

        }

        ctx.fillStyle = fillColor;

        // Starts full and shrinks from RIGHT
        ctx.fillRect(
            barX,
            barY,
            barWidth * fraction,
            barHeight
        );

        // Border
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1;
        ctx.strokeRect(
            barX,
            barY,
            barWidth,
            barHeight
        );

        // Center Text
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(
            `${alive} / ${total} COUNTRIES`,
            barX + barWidth / 2,
            barY + barHeight / 2
        );

        // Latest eliminated flag
        if (eliminated > 0) {

            const last = eliminatedFlags[eliminated - 1];
            const img = last?.country?.image;

            if (img && img.complete) {

                const flagHeight = 14;
                const flagWidth = 20;

                const flagX =
                    barX +
                    barWidth -
                    flagWidth -
                    6;

                const flagY =
                    barY +
                    (barHeight - flagHeight) / 2;

                ctx.drawImage(
                    img,
                    flagX,
                    flagY,
                    flagWidth,
                    flagHeight
                );

            }

        }

        ctx.restore();

        // ELIMINATED text
        ctx.fillStyle = "#00CFEA";
        ctx.font = "bold 13px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        ctx.fillText(
            "ELIMINATED",
            x,
            barY + barHeight + 6
        );

    }

}