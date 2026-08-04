import Matter from "matter-js";
import Flag from "./Flag";

export default class FlagManager {

    constructor(world) {

        this.world = world;
        this.flags = [];

    }


    addFlag(country, x, y) {

        const flag = new Flag(
            this.world,
            country,
            x,
            y
        );

        this.flags.push(flag);

        return flag;

    }


    update() {

        // Remove flags that entered drain zone

        for (let i = this.flags.length - 1; i >= 0; i--) {

            const flag = this.flags[i];


            if (flag.body.toRemove) {

                Matter.World.remove(
                    this.world,
                    flag.body
                );

                this.flags.splice(i, 1);

                continue;

            }

        }

    }


    draw(ctx) {

        for (const flag of this.flags) {

            flag.draw(ctx);

        }

    }

}