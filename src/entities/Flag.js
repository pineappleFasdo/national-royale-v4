import Matter from "matter-js";

export default class Flag {

    constructor(world, country, x, y, width, height) {

        this.country = country;
        this.width   = width;
        this.height  = height;

        // Slight air drag + realistic bounce prevents infinite energy
        // and reduces wall-wedge deadlocks.
        this.body = Matter.Bodies.rectangle(
            x, y,
            this.width, this.height,
            {
                label       : "flag",
                restitution : 0.88,
                friction    : 0.01,
                frictionAir : 0.004,
                density     : 0.0012,
                chamfer     : { radius: Math.max(1, width * 0.06) },
                // Allow sleep so packed early-game flags cost less CPU
                sleepThreshold: 60,
            }
        );

        Matter.World.add(world, this.body);

        // Spread initial directions; speed scales with size
        const speed = Math.max(1.8, this.width * 0.18);
        const angle = Math.random() * Math.PI * 2;

        Matter.Body.setVelocity(this.body, {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        });

        Matter.Body.setAngularVelocity(
            this.body,
            (Math.random() - 0.5) * 0.12
        );

        // Stuck-detection counter (used by FlagManager)
        this._stillFrames = 0;
    }


    draw(ctx) {

        const p     = this.body.position;
        const angle = this.body.angle;
        const w     = this.width;
        const h     = this.height;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);

        const img = this.country.image;

        if (img && img.complete && img.naturalWidth > 0) {
            // Skip expensive clip/roundRect for small flags (most of a 200-pack).
            // Only clip when flags are large enough that square corners are noticeable.
            if (w >= 18) {
                const radius = Math.max(2, w * 0.08);
                ctx.beginPath();
                if (typeof ctx.roundRect === "function") {
                    ctx.roundRect(-w / 2, -h / 2, w, h, radius);
                } else {
                    ctx.rect(-w / 2, -h / 2, w, h);
                }
                ctx.clip();
            }
            ctx.drawImage(img, -w / 2, -h / 2, w, h);
        } else {
            ctx.fillStyle = "#334466";
            ctx.fillRect(-w / 2, -h / 2, w, h);
        }

        ctx.restore();
    }

}