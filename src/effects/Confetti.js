export default class Confetti {

    constructor() {
        this.particles = [];
    }

    start(x, y, count = 220) {

        this.particles = [];

        const colors = [
            "#ff3b30",
            "#ff9500",
            "#ffcc00",
            "#34c759",
            "#00c7ff",
            "#007aff",
            "#5856d6",
            "#af52de",
            "#ff2d55"
        ];

        for (let i = 0; i < count; i++) {

            const ribbon = Math.random() > 0.35;

            this.particles.push({

                x,
                y,

                vx: (Math.random() - 0.5) * 16,

                vy: -Math.random() * 12 - 5,

                gravity: 0.18 + Math.random() * 0.08,

                drag: 0.992,

                rotation: Math.random() * Math.PI * 2,

                rotationSpeed:
                    (Math.random() - 0.5) * 0.35,

                wobble: Math.random() * Math.PI * 2,

                wobbleSpeed:
                    0.05 + Math.random() * 0.05,

                color:
                    colors[
                        Math.floor(
                            Math.random() *
                            colors.length
                        )
                    ],

                ribbon,

                width: ribbon
                    ? 4 + Math.random() * 4
                    : 5 + Math.random() * 3,

                height: ribbon
                    ? 10 + Math.random() * 8
                    : 5 + Math.random() * 3

            });

        }

    }

    update() {

        this.particles.forEach(p => {

            p.vx *= p.drag;

            p.vy += p.gravity;

            p.x += p.vx;

            p.y += p.vy;

            p.rotation += p.rotationSpeed;

            p.wobble += p.wobbleSpeed;

            p.x += Math.sin(p.wobble) * 0.8;

        });

        this.particles = this.particles.filter(
            p => p.y < window.innerHeight + 100
        );

    }

    draw(ctx) {

        this.particles.forEach(p => {

            ctx.save();

            ctx.translate(p.x, p.y);

            ctx.rotate(p.rotation);

            ctx.fillStyle = p.color;

            if (p.ribbon) {

                ctx.fillRect(
                    -p.width / 2,
                    -p.height / 2,
                    p.width,
                    p.height
                );

            } else {

                ctx.beginPath();

                ctx.arc(
                    0,
                    0,
                    p.width / 2,
                    0,
                    Math.PI * 2
                );

                ctx.fill();

            }

            ctx.restore();

        });

    }

}