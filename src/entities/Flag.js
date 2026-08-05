import Matter from "matter-js";

export default class Flag {

    constructor(world, country, x, y, width, height) {

        this.country = country;
        this.width   = width;
        this.height  = height;

        this.body = Matter.Bodies.rectangle(
            x, y,
            this.width, this.height,
            {
                label       : "flag",
                restitution : 0.98,
                friction    : 0,
                frictionAir : 0
            }
        );

        Matter.World.add(world, this.body);

        // Speed scales with flag size so small flags don't fly too fast
        const speed = Math.max(2, this.width * 0.15);
        const angle = Math.random() * Math.PI * 2;

        Matter.Body.setVelocity(this.body, {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        });

    }


    draw(ctx) {

        const p      = this.body.position;
        const angle  = this.body.angle;
        const w      = this.width;
        const h      = this.height;
        const radius = Math.max(2, w * 0.08);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);

        const img = this.country.image;

        if (img && img.complete && img.naturalWidth > 0) {

            ctx.shadowColor = "rgba(0,0,0,0.35)";
            ctx.shadowBlur  = Math.max(2, w * 0.1);

            ctx.beginPath();
            ctx.roundRect(-w / 2, -h / 2, w, h, radius);
            ctx.clip();

            ctx.drawImage(img, -w / 2, -h / 2, w, h);

            ctx.shadowBlur = 0;

            ctx.strokeStyle = "rgba(255,255,255,0.8)";
            ctx.lineWidth   = Math.max(0.5, w * 0.025);

            ctx.beginPath();
            ctx.roundRect(-w / 2, -h / 2, w, h, radius);
            ctx.stroke();

        } else {

            // Placeholder while image loads
            ctx.fillStyle = "#334466";
            ctx.beginPath();
            ctx.roundRect(-w / 2, -h / 2, w, h, radius);
            ctx.fill();

        }

        ctx.restore();

    }

}