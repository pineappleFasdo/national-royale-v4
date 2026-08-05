export default class BottomTrayRenderer {

    draw(ctx, eliminated, canvasWidth, canvasHeight) {

        if (!eliminated.length) return;

        const trayHeight = 90;
        const padding = 6;

        const trayTop = canvasHeight - trayHeight;

        // Background
        ctx.fillStyle = "#1b1b1b";
        ctx.fillRect(
            0,
            trayTop,
            canvasWidth,
            trayHeight
        );

        // Border
        ctx.strokeStyle = "#444";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, trayTop);
        ctx.lineTo(canvasWidth, trayTop);
        ctx.stroke();

        // Available area
        const usableWidth =
            canvasWidth - padding * 2;

        const usableHeight =
            trayHeight - padding * 2;

        // Calculate columns using square layout
        const aspect = 1.4; // flag width / height

        let cols = Math.ceil(
            Math.sqrt(eliminated.length * usableWidth / usableHeight)
        );

        cols = Math.max(cols, 1);

        let rows = Math.ceil(
            eliminated.length / cols
        );

        // Calculate maximum flag size
        const flagHeight = Math.floor(
            usableHeight / rows
        ) - 2;

        const flagWidth = Math.floor(
            flagHeight * aspect
        );

        // Recalculate columns after size is known
        cols = Math.floor(
            usableWidth / (flagWidth + 2)
        );

        cols = Math.max(cols, 1);

        rows = Math.ceil(
            eliminated.length / cols
        );

        eliminated.forEach((flag, index) => {

            const col = index % cols;
            const row = Math.floor(index / cols);

            const x =
                padding +
                col * (flagWidth + 2);

            const y =
                trayTop +
                padding +
                row * (flagHeight + 2);

            if (
                flag.country.image &&
                flag.country.image.complete
            ) {

                ctx.drawImage(
                    flag.country.image,
                    x,
                    y,
                    flagWidth,
                    flagHeight
                );

            }

        });

    }

}