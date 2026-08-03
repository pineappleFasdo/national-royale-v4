import Matter from "matter-js";

export default class Flag {

    constructor(world, x, y) {

        this.body = Matter.Bodies.rectangle(
            x,
            y,
            40,
            28,
            {
                restitution: 0.95,
                friction: 0,
                frictionAir: 0.002
            }
        );

        Matter.World.add(world, this.body);
        Matter.Body.setVelocity(this.body, {
            x: 5,
            y: -3
        });

    }

    draw(ctx) {

        const p = this.body.position;

        const angle = this.body.angle;

        ctx.save();

        ctx.translate(p.x, p.y);

        ctx.rotate(angle);

        ctx.fillStyle = "#ff4444";

        ctx.fillRect(-20, -14, 40, 28);

        ctx.restore();

    }

}