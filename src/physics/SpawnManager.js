export default class SpawnManager {

    static generate(cx, cy, arenaRadius, flagRadius, count) {

        const positions = [];

        const spacing = flagRadius * 2.2;

        for (
            let y = -arenaRadius + spacing;
            y <= arenaRadius - spacing;
            y += spacing * 0.866
        ) {

            const rowOffset =
                Math.round(y / (spacing * 0.866)) % 2 === 0
                    ? 0
                    : spacing / 2;

            for (
                let x = -arenaRadius + spacing;
                x <= arenaRadius - spacing;
                x += spacing
            ) {

                const px = x + rowOffset;
                const py = y;

                if (
                    Math.hypot(px, py)
                    <= arenaRadius - spacing
                ) {

                    positions.push({
                        x: cx + px,
                        y: cy + py
                    });

                }

            }

        }

        // Shuffle positions
        for (let i = positions.length - 1; i > 0; i--) {

            const j = Math.floor(
                Math.random() * (i + 1)
            );

            [positions[i], positions[j]] =
            [positions[j], positions[i]];

        }

        return positions.slice(0, count);

    }

}