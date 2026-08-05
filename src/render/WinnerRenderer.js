// WinnerRenderer.js - Updated to match YouTube style
export default class WinnerRender {

    draw(ctx, winner, canvasWidth, canvasHeight, isCountdown = false) {
        if (!winner) return;

        // Dark overlay with less opacity during winner show
        const overlayAlpha = isCountdown ? 0.7 : 0.5;
        ctx.save();

        ctx.fillStyle = `rgba(0,0,0,${overlayAlpha})`;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Winner flag - large and centered
        const img = winner.country.image;

        if (img && img.complete) {
            const flagSize = Math.min(canvasWidth * 0.2, 240);
            const width = flagSize;
            const height = flagSize * 0.7;

            // Glow effect
            ctx.shadowColor = "rgba(255,215,0,0.4)";
            ctx.shadowBlur = 50;
            
            ctx.drawImage(
                img,
                canvasWidth / 2 - width / 2,
                canvasHeight / 2 - 160,
                width,
                height
            );
            
            ctx.shadowBlur = 0;
        }

        // Winner text - YouTube style
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        // Gold text with outline
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 20;
        
        // Country name with gold gradient
        const gradient = ctx.createLinearGradient(
            canvasWidth / 2 - 150,
            canvasHeight / 2,
            canvasWidth / 2 + 150,
            canvasHeight / 2
        );
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.5, '#FFA500');
        gradient.addColorStop(1, '#FFD700');
        
        ctx.fillStyle = gradient;
        ctx.font = "bold 56px Arial";
        ctx.fillText(
            `${winner.country.name.toUpperCase()}`,
            canvasWidth / 2,
            canvasHeight / 2 + 50
        );

        // "WINS!" in gold with trophy
        ctx.fillStyle = "#FFD700";
        ctx.font = "bold 40px Arial";
        ctx.fillText(
            "🏆 WINS! 🏆",
            canvasWidth / 2,
            canvasHeight / 2 + 120
        );

        ctx.restore();
    }

}