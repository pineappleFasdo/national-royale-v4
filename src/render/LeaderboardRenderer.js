// ─────────────────────────────────────────────────────────────────────────────
// LeaderboardRenderer.js  –  Phase 3 overhaul
//
// Design goals
//   1. Flag images always render  (waits for load; shows shimmer until ready)
//   2. Stable ordering            (no rank-swap flicker mid-round; re-sort only
//                                  after a win, not every frame)
//   3. Long names handled         (ellipsis truncation with measured pixel width)
//   4. Responsive sizing          (scales from 320 px phones to 4K canvases)
//   5. Animated win-count bump    (number pops gold, scales up, eases back)
//   6. Runs every frame           (called from Game.draw() unconditionally)
// ─────────────────────────────────────────────────────────────────────────────

export default class LeaderboardRenderer {

    constructor() {
        // ── Stable display list ───────────────────────────────────────────────
        // We freeze the sorted order between wins so rows don't jitter.
        // Only refreshed by markDirty(), called from WinnerManager after a win.
        this._stableRows  = [];   // the list actually rendered
        this._pendingRows = null; // a new sorted list waiting to be applied
        this._dirty       = false;

        // ── Win-count animation state ─────────────────────────────────────────
        // Map of  countryCode → { startTime, fromValue, toValue }
        this._bumps = new Map();

        // ── Flag image shimmer phase (per-slot, so all shimmer independently) ─
        this._shimmerPhase = 0;
    }

    // ── Public: called by WinnerManager / Game after every win ───────────────

    /**
     * Tell the renderer a new sorted leaderboard is available.
     * The visual list is only re-sorted at the NEXT frame after a 400 ms
     * settle delay so the user sees the bump animation before a re-order.
     *
     * @param {Array}  rows       - sorted leaderboard from WinnerManager.getLeaderboard()
     * @param {string} [winCode]  - ISO code of the flag that just won (triggers bump anim)
     */
    markDirty(rows, winCode) {
        this._pendingRows = rows;
        this._dirty       = true;

        if (winCode) {
            const existing = this._stableRows.find(r => r.code === winCode);
            const fromVal  = existing ? existing.wins : 0;
            const toVal    = (rows.find(r => r.code === winCode)?.wins) ?? fromVal + 1;

            this._bumps.set(winCode, {
                startTime : performance.now(),
                duration  : 600,   // ms
                fromValue : fromVal,
                toValue   : toVal,
            });
        }

        // Apply new order after a short delay so the pop anim plays first
        setTimeout(() => {
            if (this._pendingRows) {
                this._stableRows  = this._pendingRows;
                this._pendingRows = null;
            }
            this._dirty = false;
        }, 420);
    }

    // ── Main draw entry-point ─────────────────────────────────────────────────

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {Array}  rows      - from WinnerManager.getLeaderboard()
     * @param {number} x, y, w  - panel origin and width
     * @param {number} rowH      - from LayoutManager.lbRowH
     * @param {number} maxRows   - from LayoutManager.lbRowCount
     */
    draw(ctx, rows, x, y, w, rowH = 28, maxRows = 5) {

        this._shimmerPhase = (performance.now() / 1200) % 1;   // 0..1 loop ~1.2s

        // Seed the stable list on the very first frame so we always show something
        if (this._stableRows.length === 0 && rows.length > 0) {
            this._stableRows = rows.slice(0, maxRows);
        }

        const visible = Array.from({ length: maxRows }, (_, i) =>
            this._stableRows[i] ?? null
        );

        const totalH  = rowH * maxRows;

        // Dynamic sizing derived from rowH
        const padL    = Math.max(6,  Math.round(rowH * 0.30));
        const padR    = Math.max(6,  Math.round(rowH * 0.30));
        const flagW   = Math.round(rowH * 1.55);
        const flagH   = Math.round(rowH * 0.72);
        const rankW   = Math.round(rowH * 0.95);   // fixed column so flags align
        const fontSize = Math.max(10, Math.round(rowH * 0.44));
        const winsW   = Math.round(w * 0.22);      // right column for win count

        ctx.save();

        // ── Panel background ──────────────────────────────────────────────────
        ctx.fillStyle = "rgba(8,10,24,0.90)";
        this._rrect(ctx, x, y, w, totalH, 7);
        ctx.fill();

        // ── Header stripe ─────────────────────────────────────────────────────
        const headerH = Math.max(14, Math.round(rowH * 0.48));
        ctx.fillStyle = "rgba(30,100,200,0.18)";
        this._rrect(ctx, x, y, w, headerH, [7, 7, 0, 0]);
        ctx.fill();

        ctx.fillStyle    = "rgba(80,160,255,0.90)";
        ctx.font         = `bold ${Math.max(8, Math.round(headerH * 0.58))}px Arial`;
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";
        ctx.letterSpacing = "1.5px";
        ctx.fillText("🏆  LEADERBOARD", x + w / 2, y + headerH / 2);
        ctx.letterSpacing = "0px";

        const rowsY = y + headerH;

        // ── Rows ──────────────────────────────────────────────────────────────
        visible.forEach((entry, i) => {
            this._drawRow(
                ctx, entry, i,
                x, rowsY + i * rowH, w, rowH,
                padL, padR, flagW, flagH, rankW, fontSize, winsW,
                maxRows
            );
        });

        // ── Outer border ──────────────────────────────────────────────────────
        ctx.strokeStyle = "rgba(80,160,255,0.35)";
        ctx.lineWidth   = 1.2;
        this._rrect(ctx, x, y, w, totalH + headerH, 7);
        ctx.stroke();

        ctx.restore();
    }

    // ── Row renderer ──────────────────────────────────────────────────────────

    _drawRow(ctx, entry, i, x, ry, w, rowH, padL, padR, flagW, flagH, rankW, fontSize, winsW, maxRows) {

        const midY = ry + rowH / 2;

        // Row background tint
        const rowBg = i === 0 ? "rgba(255,215,0,0.22)"      // gold
                    : i === 1 ? "rgba(192,192,192,0.20)"    // silver
                    : i === 2 ? "rgba(176,100,40,0.22)"     // bronze
                    :           "rgba(255,255,255,0.03)";

        ctx.fillStyle = rowBg;
        ctx.beginPath();
        ctx.rect(x, ry, w, rowH - 1);
        ctx.fill();

        // ── Rank badge ───────────────────────────────────────────────────────
        const rankColor = i === 0 ? "#D4A017"
                        : i === 1 ? "#A8A8A8"
                        : i === 2 ? "#C46228"
                        :           "rgba(255,255,255,0.40)";

        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;

        ctx.fillStyle    = rankColor;
        ctx.font         = `bold ${fontSize}px Arial`;
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";

        if (medal) {
            ctx.font = `${Math.round(fontSize * 1.1)}px Arial`;
            ctx.fillText(medal, x + padL + rankW / 2, midY);
        } else {
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.fillText(`${i + 1}`, x + padL + rankW / 2, midY);
        }

        // ── Empty placeholder row ─────────────────────────────────────────────
        if (!entry) {
            this._drawPlaceholder(ctx, x, ry, w, rowH, midY, padL, padR, rankW, flagW, flagH, fontSize, winsW, i, maxRows);
            return;
        }

        // ── Flag image ────────────────────────────────────────────────────────
        const flagX = x + padL + rankW + 6;
        const flagY = ry + (rowH - flagH) / 2;

        this._drawFlag(ctx, entry.image, flagX, flagY, flagW, flagH);

        // ── Country name ──────────────────────────────────────────────────────
        const nameX    = flagX + flagW + 8;
        const nameMaxW = w - (nameX - x) - winsW - padR - 4;

        ctx.fillStyle    = "rgba(100,180,255,0.95)";
        ctx.font         = `bold ${fontSize}px Arial`;
        ctx.textAlign    = "left";
        ctx.textBaseline = "middle";

        const truncated = this._truncate(ctx, entry.name, nameMaxW);
        ctx.fillText(truncated, nameX, midY);

        // ── Win count (with bump animation) ──────────────────────────────────
        this._drawWins(ctx, entry, x + w - padR, midY, fontSize, winsW);

        // ── Row divider ───────────────────────────────────────────────────────
        if (i < maxRows - 1) {
            ctx.strokeStyle = "rgba(255,255,255,0.07)";
            ctx.lineWidth   = 0.8;
            ctx.beginPath();
            ctx.moveTo(x + padL,     ry + rowH);
            ctx.lineTo(x + w - padR, ry + rowH);
            ctx.stroke();
        }
    }

    // ── Flag image with shimmer fallback ─────────────────────────────────────

    _drawFlag(ctx, img, fx, fy, fw, fh) {

        const ready = img && img.complete && img.naturalWidth > 0;

        ctx.save();
        this._rrect(ctx, fx, fy, fw, fh, 2);
        ctx.clip();

        if (ready) {
            ctx.drawImage(img, fx, fy, fw, fh);
        } else {
            // Animated shimmer while image loads
            const shimX = fx + (this._shimmerPhase * 2 - 0.5) * fw * 2;
            const grad  = ctx.createLinearGradient(shimX - fw * 0.5, 0, shimX + fw * 0.5, 0);
            grad.addColorStop(0,    "rgba(40,44,68,0.9)");
            grad.addColorStop(0.45, "rgba(70,76,110,0.9)");
            grad.addColorStop(0.55, "rgba(100,108,160,0.95)");
            grad.addColorStop(1,    "rgba(40,44,68,0.9)");
            ctx.fillStyle = grad;
            ctx.fillRect(fx, fy, fw, fh);
        }

        ctx.restore();

        // Border
        ctx.strokeStyle = ready
            ? "rgba(255,255,255,0.22)"
            : "rgba(255,255,255,0.08)";
        ctx.lineWidth = 0.8;
        this._rrect(ctx, fx, fy, fw, fh, 2);
        ctx.stroke();
    }

    // ── Wins column with pop animation ────────────────────────────────────────

    _drawWins(ctx, entry, rightEdge, midY, fontSize, colW) {

        const now   = performance.now();
        const bump  = this._bumps.get(entry.code);

        let displayWins = entry.wins;
        let scale       = 1;
        let color       = "#FFC44D";

        if (bump) {
            const elapsed  = now - bump.startTime;
            const progress = Math.min(1, elapsed / bump.duration);

            if (progress < 1) {
                // Use the "to" value immediately but animate the visual pop
                displayWins = bump.toValue;

                // Scale: quick up (0→0.3 of duration) then ease back (0.3→1)
                const peakT = 0.30;
                if (progress < peakT) {
                    const t = progress / peakT;
                    scale   = 1 + 0.40 * t;               // 1 → 1.4
                } else {
                    const t = (progress - peakT) / (1 - peakT);
                    scale   = 1.40 - 0.40 * this._easeOut(t); // 1.4 → 1.0
                }

                // Gold flash fading to normal amber
                const flashFade = Math.max(0, 1 - progress * 2.5);
                const r = Math.round(255);
                const g = Math.round(196 + 59 * flashFade);   // 196 → 255 → 196
                const b = Math.round(77  * (1 - flashFade));  // 77  → 0
                color = `rgb(${r},${g},${b})`;
            } else {
                this._bumps.delete(entry.code);
            }
        }

        const label    = `${displayWins} WIN${displayWins !== 1 ? "S" : ""}`;
        const textSize = Math.round(fontSize * scale);

        ctx.save();
        ctx.font         = `bold ${textSize}px Arial`;
        ctx.fillStyle    = color;
        ctx.textAlign    = "right";
        ctx.textBaseline = "middle";

        if (scale > 1) {
            // Drop shadow for the pop
            ctx.shadowColor = "rgba(255,220,80,0.60)";
            ctx.shadowBlur  = 8;
        }

        ctx.fillText(label, rightEdge, midY);
        ctx.restore();
    }

    // ── Placeholder row (no winner yet for this slot) ─────────────────────────

    _drawPlaceholder(ctx, x, ry, w, rowH, midY, padL, padR, rankW, flagW, flagH, fontSize, winsW, i, maxRows) {

        const dashColor = "rgba(255,255,255,0.18)";
        const flagX     = x + padL + rankW + 6;
        const flagY     = ry + (rowH - flagH) / 2;

        // Flag slot outline with shimmer
        const shimX = flagX + (this._shimmerPhase * 2 - 0.5) * flagW * 1.5;
        const grad  = ctx.createLinearGradient(shimX - flagW * 0.4, 0, shimX + flagW * 0.4, 0);
        grad.addColorStop(0,    "rgba(30,34,54,0.6)");
        grad.addColorStop(0.5,  "rgba(55,60,88,0.6)");
        grad.addColorStop(1,    "rgba(30,34,54,0.6)");

        ctx.save();
        this._rrect(ctx, flagX, flagY, flagW, flagH, 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = dashColor;
        ctx.lineWidth   = 0.8;
        ctx.stroke();
        ctx.restore();

        // Dash marks
        ctx.fillStyle    = dashColor;
        ctx.font         = `bold ${fontSize}px Arial`;
        ctx.textAlign    = "left";
        ctx.textBaseline = "middle";
        ctx.fillText("—", flagX + flagW + 8, midY);

        ctx.textAlign = "right";
        ctx.fillText("—", x + w - padR, midY);

        if (i < maxRows - 1) {
            ctx.strokeStyle = "rgba(255,255,255,0.05)";
            ctx.lineWidth   = 0.8;
            ctx.beginPath();
            ctx.moveTo(x + padL,     ry + rowH);
            ctx.lineTo(x + w - padR, ry + rowH);
            ctx.stroke();
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Truncate text with ellipsis to fit within maxWidth pixels. */
    _truncate(ctx, text, maxWidth) {
        if (ctx.measureText(text).width <= maxWidth) return text;
        let t = text;
        while (t.length > 1 && ctx.measureText(t + "…").width > maxWidth) {
            t = t.slice(0, -1);
        }
        return t + "…";
    }

    /** Rounded-rect path helper — accepts uniform radius or [tl,tr,br,bl]. */
    _rrect(ctx, x, y, w, h, r) {
        if (typeof ctx.roundRect === "function") {
            ctx.beginPath();
            ctx.roundRect(x, y, w, h, r);
        } else {
            const [tl = r, tr = r, br = r, bl = r] = Array.isArray(r)
                ? r : [r, r, r, r];
            ctx.beginPath();
            ctx.moveTo(x + tl, y);
            ctx.lineTo(x + w - tr, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
            ctx.lineTo(x + w, y + h - br);
            ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
            ctx.lineTo(x + bl, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
            ctx.lineTo(x, y + tl);
            ctx.quadraticCurveTo(x, y, x + tl, y);
            ctx.closePath();
        }
    }

    /** Cubic ease-out: fast start, slow end. */
    _easeOut(t) {
        return 1 - Math.pow(1 - t, 3);
    }
}
