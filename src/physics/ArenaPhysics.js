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

        this.initialGapSize = 12;
        this.maxGapSize = 30;
        this.gapSize = this.initialGapSize;

        this.remainingFlags = 50;

        this.segments = [];

        for (let i = 0; i < this.segmentCount; i++) {

            const angle =
                (i / this.segmentCount) *
                Math.PI * 2;

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
                    angle,
                    restitution: 1,
                    friction: 0
                }
            );

            this.segments.push(wall);

        }

        Matter.World.add(world, this.segments);

    }

    setRemainingFlags(count) {

        this.remainingFlags = count;

        const t = Math.max(
            0,
            Math.min(
                1,
                (50 - count) / 48
            )
        );

        this.gapSize = Math.round(
            this.initialGapSize +
            (this.maxGapSize -
             this.initialGapSize) * t
        );

    }

    update() {

        this.angle += this.rotationSpeed;

        if (this.angle > Math.PI * 2) {
            this.angle -= Math.PI * 2;
        }

        const gapStart =
            Math.floor(
                (this.angle /
                (Math.PI * 2)) *
                this.segmentCount
            );

        for (let i = 0; i < this.segmentCount; i++) {

            const wall =
                this.segments[i];

            const inGap =
                (
                    (i - gapStart +
                    this.segmentCount)
                    %
                    this.segmentCount
                ) < this.gapSize;

            wall.collisionFilter.mask =
                inGap ? 0 : 0xFFFFFFFF;

            const segmentAngle =
                (i / this.segmentCount) *
                Math.PI * 2;

            const x =
                this.cx +
                Math.cos(segmentAngle) *
                this.radius;

            const y =
                this.cy +
                Math.sin(segmentAngle) *
                this.radius;

            Matter.Body.setPosition(
                wall,
                { x, y }
            );

            Matter.Body.setAngle(
                wall,
                segmentAngle
            );

        }

    }

}