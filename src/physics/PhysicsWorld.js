import Matter from "matter-js";

export default class PhysicsWorld {

    constructor(width, height) {

        this.engine = Matter.Engine.create();

        this.world = this.engine.world;

        this.world.gravity.y = 0;

        this.width = width;
        this.height = height;

    }

    update() {

        Matter.Engine.update(this.engine);

    }

}