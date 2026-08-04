export default class EliminationManager {

    constructor(arena) {

        this.arena = arena;
        this.eliminated = [];

    }

    update(flagManager) {

        const survivors = [];

        for (const flag of flagManager.flags) {

            const dx = flag.body.position.x - this.arena.cx;
            const dy = flag.body.position.y - this.arena.cy;

            const distance = Math.sqrt(
                dx * dx + dy * dy
            );

            // Eliminate once the flag is clearly outside
            if (distance > this.arena.radius + 40) {

                this.eliminated.push(flag);

                continue;

            }

            survivors.push(flag);

        }

        flagManager.flags = survivors;

    }

}