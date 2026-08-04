export default class BottomTrayRenderer {

    draw(ctx, eliminated, canvasWidth, canvasHeight) {

        const trayHeight = 80;

        // Tray background
        ctx.fillStyle = "#1b1b1b";
        ctx.fillRect(
            0,
            canvasHeight - trayHeight,
            canvasWidth,
            trayHeight
        );

        // Top border
        ctx.strokeStyle = "#444";
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(0, canvasHeight - trayHeight);
        ctx.lineTo(canvasWidth, canvasHeight - trayHeight);
        ctx.stroke();

        // Draw eliminated flags
        const size = 36;
        const spacing = 8;
        const startX = 10;
        const y = canvasHeight - trayHeight + 22;

        eliminated.forEach((flag, index) => {

            const x = startX + index * (size + spacing);

            if (
                flag.country.image &&
                flag.country.image.complete
            ) {

                ctx.drawImage(
                    flag.country.image,
                    x,
                    y,
                    size,
                    size * 0.7
                );

            }

        });

    }

}