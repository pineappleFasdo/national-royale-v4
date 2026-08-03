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

        // Future features:
        // - Eliminated flags
        // - Winner detection
        // - Sounds
        // - Flag states

    }

    draw(ctx) {

        for (const flag of this.flags) {

            flag.draw(ctx);

        }

    }

}