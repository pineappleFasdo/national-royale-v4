import Matter from "matter-js";

export default class DrainSystem {

    constructor(engine, world, arenaRadius) {

        this.engine = engine;
        this.world = world;
        this.arenaRadius = arenaRadius;

        this.angle = 0;

        this.opening = false;

        this.delay = 3000;
        this.startTime = Date.now();

        this.gapSize = 0.15;

        this.rotationSpeed = 0.002;

        this.growthRate = 0.00005;

        this.sensor = null;

    }


    createSensor() {

        this.sensor = Matter.Bodies.circle(
            0,
            0,
            this.arenaRadius * 0.12,
            {
                isStatic: true,
                isSensor: true,
                label: "drain"
            }
        );


        Matter.World.add(
            this.world,
            this.sensor
        );


        this.setupCollision();

    }


    setupCollision() {

        Matter.Events.on(
            this.engine,
            "collisionStart",
            event => {

                event.pairs.forEach(pair => {

                    const a = pair.bodyA;
                    const b = pair.bodyB;


                    if (
                        a.label === "drain" ||
                        b.label === "drain"
                    ) {

                        const flag =
                            a.label === "drain"
                            ? b
                            : a;


                        if (flag.label === "flag") {

                            flag.toRemove = true;

                        }

                    }

                });

            }
        );

    }


    update() {

        const elapsed =
            Date.now() - this.startTime;


        if (elapsed < this.delay) {
            return;
        }


        this.opening = true;


        // Rotate drain opening

        this.angle += this.rotationSpeed;


        // Increase opening size slowly

        if (this.gapSize < 1.0) {

            this.gapSize += this.growthRate;

        }


        this.updateSensor();

    }


    updateSensor() {

        if (!this.sensor) return;


        const x =
            Math.cos(this.angle) *
            this.arenaRadius *
            0.75;


        const y =
            Math.sin(this.angle) *
            this.arenaRadius *
            0.75;


        Matter.Body.setPosition(
            this.sensor,
            {
                x,
                y
            }
        );

    }


    applyDrainForce(flags) {

        if (!this.opening) return;


        const target =
            this.sensor.position;


        for (const flag of flags) {


            const body =
                flag.body;


            const dx =
                target.x -
                body.position.x;


            const dy =
                target.y -
                body.position.y;


            const distance =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );


            if (
                distance <
                this.arenaRadius * 0.7
            ) {


                const strength =
                    0.00003;


                Matter.Body.applyForce(
                    body,
                    body.position,
                    {
                        x: dx * strength,
                        y: dy * strength
                    }
                );

            }

        }

    }


    draw(ctx) {

        if (!this.sensor) return;


        ctx.beginPath();

        ctx.arc(
            this.sensor.position.x,
            this.sensor.position.y,
            this.sensor.circleRadius,
            0,
            Math.PI * 2
        );

        ctx.strokeStyle = "red";

        ctx.stroke();

    }

}