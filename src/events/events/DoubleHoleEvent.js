export default class DoubleHoleEvent {
    name  = "DOUBLE HOLE";
    color = "#FF44AA";
    icon  = "🕳️";

    start({ arena }) {
        arena._doubleHole = true;
    }

    update({ arena }) {
        if (arena.state !== "PLAYING") return;

        const half  = Math.floor(arena.segmentCount / 2);
        const seg   = arena.segmentCount;

        for (let i = 0; i < seg; i++) {
            const secondGapStart = (arena.gapStart + half) % seg;
            const inSecondGap    = ((i - secondGapStart + seg) % seg) < arena.gapSize;
            if (inSecondGap) {
                arena.segments[i].collisionFilter.mask = 0;
            }
        }
    }

    end({ arena }) {
        arena._doubleHole = false;
        for (const seg of arena.segments) {
            seg.collisionFilter.mask = 0xFFFFFFFF;
        }
    }
}