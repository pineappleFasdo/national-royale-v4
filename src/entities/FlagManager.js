import Matter from "matter-js";
import Flag   from "./Flag";

export default class FlagManager {

    constructor(world) {
        this.world = world;
        this.flags = [];
    }


    addFlag(country, x, y, width, height) {

        const flag = new Flag(
            this.world,
            country,
            x, y,
            width, height
        );

        this.flags.push(flag);

        return flag;

    }


    update() {

        for (let i = this.flags.length - 1; i >= 0; i--) {

            const flag = this.flags[i];

            if (flag.body.toRemove) {
                Matter.World.remove(this.world, flag.body);
                this.flags.splice(i, 1);
            }

        }

    }


    draw(ctx) {

        for (const flag of this.flags) {
            flag.draw(ctx);
        }

    }

}