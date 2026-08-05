export default class WinnerRender {

    draw(ctx, winner, canvasWidth, canvasHeight) {

        if (!winner) return;

        // Dark overlay
        ctx.save();

        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(
            0,
            0,
            canvasWidth,
            canvasHeight
        );

        // Winner flag
        const img = winner.country.image;

        if (img && img.complete) {

            const width = 220;
            const height = width * 0.7;

            ctx.drawImage(
                img,
                canvasWidth / 2 - width / 2,
                canvasHeight / 2 - 160,
                width,
                height
            );

        }

        // Winner text
        ctx.fillStyle = "#FFD700";
        ctx.font = "bold 54px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(
            `${winner.country.name.toUpperCase()} WINS!`,
            canvasWidth / 2,
            canvasHeight / 2 + 40
        );

        ctx.restore();

    }

}