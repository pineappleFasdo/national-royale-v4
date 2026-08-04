export default class ArenaRenderer {

    draw(ctx, arena) {

        ctx.save();

        ctx.translate(
            arena.cx,
            arena.cy
        );

        ctx.rotate(
            arena.angle
        );

        ctx.strokeStyle = "white";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";

        const gapAngle =
            (arena.gapSize / arena.segmentCount) *
            Math.PI * 2;

        const startGap = 0;
        const endGap = gapAngle;

        // Arc after the gap
        ctx.beginPath();
        ctx.arc(
            0,
            0,
            arena.radius,
            endGap,
            Math.PI * 2,
            false
        );
        ctx.stroke();

        // Arc before the gap (wrap-around)
        if (startGap > 0) {
            ctx.beginPath();
            ctx.arc(
                0,
                0,
                arena.radius,
                0,
                startGap,
                false
            );
            ctx.stroke();
        }

        ctx.restore();

    }

}