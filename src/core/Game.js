import PhysicsWorld from "../physics/PhysicsWorld";
import Flag from "../entities/Flag";

export default class Game {

    constructor(canvas) {

        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        this.physics = null;
        this.flag = null;

    }

    resize(width, height) {

        this.canvas.width = width;
        this.canvas.height = height;

        this.physics = new PhysicsWorld(width, height);

        this.flag = new Flag(
            this.physics.world,
            width / 2,
            height / 2
        );

    }

    update() {

        this.physics.update();

    }

    draw() {

        const ctx = this.ctx;

        ctx.fillStyle = "#111";

        ctx.fillRect(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );

        this.flag.draw(ctx);

    }

    loop = () => {

        this.update();

        this.draw();

        requestAnimationFrame(this.loop);

    }

}