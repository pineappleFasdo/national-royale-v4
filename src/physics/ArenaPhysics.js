import Matter from "matter-js";

export default class ArenaPhysics {

    constructor(world, cx, cy, radius) {

        this.cx = cx;
        this.cy = cy;
        this.radius = radius;

        this.segments = [];

        const SEGMENTS = 96;
        const THICKNESS = 20;

        for (let i = 0; i < SEGMENTS; i++) {

            const angle = (i / SEGMENTS) * Math.PI * 2;

            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;

            const wall = Matter.Bodies.rectangle(
                x,
                y,
                THICKNESS,
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

}