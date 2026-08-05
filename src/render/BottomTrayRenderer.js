export default class BottomTrayRenderer {
    draw(ctx, eliminated, canvasWidth, canvasHeight) {
        const trayHeight = 100;
        const padding = 6;
        const trayTop = canvasHeight - trayHeight;

        // Background
        const gradient = ctx.createLinearGradient(0, trayTop, 0, canvasHeight);
        gradient.addColorStop(0, 'rgba(20,20,20,0.95)');
        gradient.addColorStop(1, 'rgba(10,10,10,1)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, trayTop, canvasWidth, trayHeight);

        // Border
        ctx.shadowColor = "rgba(255,255,255,0.05)";
        ctx.shadowBlur = 3;
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, trayTop);
        ctx.lineTo(canvasWidth, trayTop);
        ctx.stroke();
        ctx.shadowBlur = 0;

        if (eliminated.length === 0) return;

        const availableWidth = canvasWidth - padding * 2;
        const availableHeight = trayHeight - padding * 2;

        // Determine flag size to fit all flags
        // We want as many columns as possible, but flags must be at least 6px wide
        const aspectRatio = 1.4;
        let bestSize = { height: 0, width: 0, cols: 0, rows: 0 };

        // Try sizes from 6px to 40px height
        for (let h = 6; h <= 40; h += 1) {
            const w = h * aspectRatio;
            const cols = Math.floor(availableWidth / (w + 2)); // 2px spacing
            if (cols < 1) continue;
            const rows = Math.ceil(eliminated.length / cols);
            const requiredHeight = rows * (h + 2) - 2;
            if (requiredHeight <= availableHeight) {
                // This size fits, save it (we want largest that fits)
                bestSize = { height: h, width: w, cols, rows };
            } else {
                // If it doesn't fit, we can't go larger
                break;
            }
        }

        // If no size fits (shouldn't happen with h=6), force smallest
        if (bestSize.height === 0) {
            const h = 6;
            const w = h * aspectRatio;
            const cols = Math.floor(availableWidth / (w + 2));
            const rows = Math.ceil(eliminated.length / cols);
            bestSize = { height: h, width: w, cols, rows };
        }

        const { height: flagHeight, width: flagWidth, cols, rows } = bestSize;
        const spacingX = 2;
        const spacingY = 2;

        // Center the grid vertically in the tray
        const totalGridHeight = rows * (flagHeight + spacingY) - spacingY;
        const startY = trayTop + padding + (availableHeight - totalGridHeight) / 2;

        // Draw flags in grid
        for (let i = 0; i < eliminated.length; i++) {
            const flag = eliminated[i];
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = padding + col * (flagWidth + spacingX);
            const y = startY + row * (flagHeight + spacingY);

            if (flag.country.image && flag.country.image.complete) {
                ctx.save();
                ctx.shadowColor = "rgba(0,0,0,0.5)";
                ctx.shadowBlur = 2;
                ctx.shadowOffsetY = 1;
                ctx.drawImage(flag.country.image, x, y, flagWidth, flagHeight);
                ctx.restore();
                // Thin border
                ctx.strokeStyle = "rgba(255,255,255,0.1)";
                ctx.lineWidth = 0.5;
                ctx.strokeRect(x, y, flagWidth, flagHeight);
            }
        }

        // Optional: If there are so many flags that even 6px height overflows, we'll just let them be clipped
        // (but with 201 flags and 100px height, 6px should fit comfortably)
    }
}