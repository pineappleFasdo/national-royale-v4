import Matter from "matter-js";

export default class Flag {

    constructor(world, country, x, y) {

        this.country = country;

        this.width = 40;
        this.height = 28;

        this.body = Matter.Bodies.rectangle(
            x,
            y,
            this.width,
            this.height,
            {
                restitution: 0.98,
                friction: 0,
                frictionAir: 0
            }
        );

        Matter.World.add(world, this.body);

        // Initial velocity for testing
        const speed = 6;

        const angle = Math.random() * Math.PI * 2;
        
        Matter.Body.setVelocity(this.body, {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        });

    }

    draw(ctx) {

        const p = this.body.position;
        const angle = this.body.angle;

        ctx.save();

        ctx.translate(p.x, p.y);
        ctx.rotate(angle);

        const img = this.country.image;

        if (img && img.complete) {

            // Optional shadow
            ctx.shadowColor = "rgba(0,0,0,0.35)";
            ctx.shadowBlur = 6;

            // Rounded flag
            ctx.beginPath();
            ctx.roundRect(
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height,
                4
            );
            ctx.clip();

            ctx.drawImage(
                img,
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
            );

            // White border
            ctx.shadowBlur = 0;
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.roundRect(
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height,
                4
            );
            ctx.stroke();

        } else {

            // Fallback while image loads
            ctx.fillStyle = "#ff4444";
            ctx.fillRect(
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
            );

        }

        ctx.restore();

    }

}