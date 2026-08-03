export default class ArenaRenderer {

    draw(ctx, arena) {

        ctx.strokeStyle = "white";
        ctx.lineWidth = 6;

        ctx.beginPath();

        ctx.arc(
            arena.cx,
            arena.cy,
            arena.radius,
            0,
            Math.PI * 2
        );

        ctx.stroke();

    }

}