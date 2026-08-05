import Matter from "matter-js";

export default class EliminationManager {

    constructor(arena, world) {

        this.arena = arena;
        this.world = world;
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

                // IMPORTANT: also remove the physics body from the
                // world. Previously only the render/tracking array
                // was cleared, so every eliminated flag kept living
                // in the Matter world forever as an invisible
                // collider, piling up right around the gap and
                // physically jamming flags that were trying to exit.
                Matter.World.remove(
                    this.world,
                    flag.body
                );

                this.eliminated.push(flag);

                continue;

            }

            survivors.push(flag);

        }

        flagManager.flags = survivors;

    }

}