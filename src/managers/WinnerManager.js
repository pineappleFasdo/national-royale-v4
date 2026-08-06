// ──────────────────────────────────────────────────────────────────────────────
// WinnerManager.js
//
// Tracks the winner of each round and persists win counts in localStorage.
//
// IMPORTANT FIX: the previous version stored the live HTMLImageElement object
// in localStorage. JSON.stringify turns it into "{}", so on reload the image
// was always null and flags in the leaderboard never rendered.  Now we store
// the image src string and recreate the Image on demand.
// ──────────────────────────────────────────────────────────────────────────────

export default class WinnerManager {

    constructor() {
        this.winner = null;
        this.onWin  = null;

        // Persistent win records: { [countryCode]: { name, imageSrc, wins } }
        this._wins  = this._loadWins();

        // Cache of reconstructed Image objects so we don't re-create each frame
        this._imageCache = {};
    }

    // ── Persistence ───────────────────────────────────────────────────────────

    _loadWins() {
        try {
            const raw = localStorage.getItem("flagBattle_wins");
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    }

    _saveWins() {
        try {
            localStorage.setItem("flagBattle_wins", JSON.stringify(this._wins));
        } catch { /* quota or private-mode block – silently ignore */ }
    }

    // ── Image reconstruction ───────────────────────────────────────────────────

    _getImage(code, imageSrc) {
        if (!imageSrc) return null;

        // Reuse cached Image if already built
        if (this._imageCache[code]) return this._imageCache[code];

        // Accept both a src string and a live HTMLImageElement
        if (typeof imageSrc === "string") {
            const img     = new Image();
            img.src       = imageSrc;
            this._imageCache[code] = img;
            return img;
        }

        // It's already an HTMLImageElement (first win in session – not yet persisted)
        this._imageCache[code] = imageSrc;
        return imageSrc;
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /** Sorted descending by win count – ready for LeaderboardRenderer */
    getLeaderboard() {
        return Object.entries(this._wins)
            .map(([code, entry]) => ({
                code,
                name  : entry.name,
                wins  : entry.wins,
                image : this._getImage(code, entry.imageSrc),
            }))
            .sort((a, b) => b.wins - a.wins);
    }

    // ── Game loop ─────────────────────────────────────────────────────────────

    update(flagManager) {
        if (this.winner)            return;
        if (!flagManager?.flags)    return;

        const remaining = flagManager.flags;
        if (remaining.length !== 1) return;

        const flag = remaining[0];
        this.winner = flag;

        const { code, name, image } = flag.country;

        if (!this._wins[code]) {
            this._wins[code] = { name, imageSrc: image?.src ?? null, wins: 0 };
        }

        this._wins[code].wins++;
        this._saveWins();

        // Prime the image cache with the live element we already have
        if (image) this._imageCache[code] = image;

        if (this.onWin) this.onWin(flag);
    }

    reset() {
        this.winner = null;
    }
}