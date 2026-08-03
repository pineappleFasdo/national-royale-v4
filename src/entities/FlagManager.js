import Flag from "./Flag";

export default class FlagManager {

    constructor(world) {

        this.world = world;
        this.flags = [];

    }

    addFlag(x, y) {

        const flag = new Flag(
            this.world,
            x,
            y
        );

        this.flags.push(flag);

        return flag;

    }

    // 👇 ADD IT HERE
    spawnRandom(count, centerX, centerY) {

        for (let i = 0; i < count; i++) {

            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 120;

            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;

            this.addFlag(x, y);

        }

    }

    update() {

        // Future logic

    }

    draw(ctx) {

        for (const flag of this.flags) {

            flag.draw(ctx);

        }

    }

}