export default class SpawnManager {

    /**
     * Find the largest hex-grid spacing where at least `count` slots
     * fit inside `spawnRadius`, then return the positions + the spacing
     * used (so the caller can size flags to match).
     *
     * @returns {{ positions: {x,y}[], spacing: number }}
     */
    static generate(cx, cy, spawnRadius, count) {

        let chosenSpacing = 8; // absolute minimum fallback

        for (let s = 120; s >= 8; s -= 0.5) {

            const slots = SpawnManager._countSlots(spawnRadius, s);

            if (slots >= count) {
                chosenSpacing = s;
                break;
            }

        }

        const positions = SpawnManager._buildPositions(
            cx, cy, spawnRadius, chosenSpacing
        );

        // Shuffle
        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }

        return {
            positions : positions.slice(0, count),
            spacing   : chosenSpacing
        };

    }


    static _countSlots(spawnRadius, spacing) {

        const vSpacing = spacing * 0.866;
        let count = 0;

        for (
            let y = -spawnRadius + spacing;
            y <= spawnRadius - spacing;
            y += vSpacing
        ) {

            const row = Math.round(y / vSpacing);
            const rowOffset = row % 2 === 0 ? 0 : spacing / 2;

            for (
                let x = -spawnRadius + spacing;
                x <= spawnRadius - spacing;
                x += spacing
            ) {

                const px = x + rowOffset;

                if (Math.hypot(px, y) <= spawnRadius - spacing) {
                    count++;
                }

            }

        }

        return count;

    }


    static _buildPositions(cx, cy, spawnRadius, spacing) {

        const vSpacing = spacing * 0.866;
        const positions = [];

        for (
            let y = -spawnRadius + spacing;
            y <= spawnRadius - spacing;
            y += vSpacing
        ) {

            const row = Math.round(y / vSpacing);
            const rowOffset = row % 2 === 0 ? 0 : spacing / 2;

            for (
                let x = -spawnRadius + spacing;
                x <= spawnRadius - spacing;
                x += spacing
            ) {

                const px = x + rowOffset;

                if (Math.hypot(px, y) <= spawnRadius - spacing) {
                    positions.push({ x: cx + px, y: cy + y });
                }

            }

        }

        return positions;

    }

}