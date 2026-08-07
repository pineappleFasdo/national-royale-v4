export default class ArenaRenderer {

    draw(ctx, arena) {

        ctx.save();

        ctx.translate(arena.cx, arena.cy);
        ctx.rotate(arena.angle);

        ctx.strokeStyle = "white";
        ctx.lineWidth   = 3;
        ctx.lineCap     = "round";

        const gapAngle = (arena.gapSize / arena.segmentCount) * Math.PI * 2;

        if (arena._doubleHole) {
            // Gap 1: 0 → gapAngle   |   Gap 2: π → π+gapAngle
            // Draw the arc between the two gaps
            ctx.beginPath();
            ctx.arc(0, 0, arena.radius, gapAngle, Math.PI, false);
            ctx.stroke();

            // Draw the arc after gap 2 (wraps back to start of gap 1)
            ctx.beginPath();
            ctx.arc(0, 0, arena.radius, Math.PI + gapAngle, Math.PI * 2, false);
            ctx.stroke();
        } else {
            // Single gap: draw everything except 0 → gapAngle
            ctx.beginPath();
            ctx.arc(0, 0, arena.radius, gapAngle, Math.PI * 2, false);
            ctx.stroke();
        }

        ctx.restore();

    }

}