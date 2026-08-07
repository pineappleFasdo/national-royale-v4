import Matter from "matter-js";

export default class EliminationManager {

    constructor(arena, world) {

        this.arena = arena;
        this.world = world;
        this.eliminated = [];

        // Snapshot the outer boundary at construction time.
        // We eliminate flags once they cross this fixed threshold so that a
        // shrinking arena (which reduces arena.radius dynamically) doesn't
        // accidentally shrink the elimination zone inward and trap flags
        // that are already outside the original wall.
        this._outerBoundary = arena.radius + 40;

    }

    // Call this when a new round starts so the boundary resets to
    // the fresh arena size.
    reset() {
        this._outerBoundary = this.arena.radius + 40;
    }

    update(flagManager) {

        const survivors = [];

        for (const flag of flagManager.flags) {

            const dx = flag.body.position.x - this.arena.cx;
            const dy = flag.body.position.y - this.arena.cy;

            const distance = Math.sqrt(
                dx * dx + dy * dy
            );

            // Use the fixed outer boundary so that shrinking the arena
            // doesn't move the elimination line inward — flags must reach
            // the original wall radius + buffer to be eliminated.
            if (distance > this._outerBoundary) {

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
