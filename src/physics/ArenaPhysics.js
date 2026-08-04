import Matter from "matter-js";

export default class ArenaPhysics {

    constructor(world, cx, cy, radius) {

        this.cx = cx;
        this.cy = cy;
        this.radius = radius;

        this.angle = 0;
        this.rotationSpeed = 0.01;

        this.segmentCount = 96;
        this.thickness = 20;
        this.gapSize = 12;

        this.segments = [];

        for (let i = 0; i < this.segmentCount; i++) {

            // Leave a gap
            if (i < this.gapSize) {
                continue;
            }

            const angle =
                (i / this.segmentCount) * Math.PI * 2;

            const x =
                cx + Math.cos(angle) * radius;

            const y =
                cy + Math.sin(angle) * radius;

            const wall = Matter.Bodies.rectangle(
                x,
                y,
                this.thickness,
                32,
                {
                    isStatic: true,
                    angle: angle,
                    restitution: 1,
                    friction: 0
                }
            );

            this.segments.push(wall);

        }

        Matter.World.add(world, this.segments);

    }

    update() {

        this.angle += this.rotationSpeed;

        if (this.angle > Math.PI * 2) {
            this.angle -= Math.PI * 2;
        }

        let wallIndex = 0;

        for (let i = 0; i < this.segmentCount; i++) {

            if (i < this.gapSize) {
                continue;
            }

            const wall = this.segments[wallIndex++];

            const segmentAngle =
                (i / this.segmentCount) * Math.PI * 2 +
                this.angle;

            const x =
                this.cx +
                Math.cos(segmentAngle) *
                this.radius;

            const y =
                this.cy +
                Math.sin(segmentAngle) *
                this.radius;

            Matter.Body.setPosition(wall, {
                x,
                y
            });

            Matter.Body.setAngle(
                wall,
                segmentAngle
            );

        }

    }

}