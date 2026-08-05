export default class WinnerManager {

    constructor() {
        this.winner  = null;
        this.onWin   = null;

        // Persistent across rounds — keyed by country code
        this._wins   = this._loadWins();
    }

    // ── Persistence helpers ───────────────────────────────────────────

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
        } catch { /* storage blocked */ }
    }

    /** Returns sorted leaderboard array:
     *  [{ code, name, image, wins }, ...] descending */
    getLeaderboard() {
        return Object.entries(this._wins)
            .map(([code, entry]) => ({
                code,
                name  : entry.name,
                image : entry.image,
                wins  : entry.wins,
            }))
            .sort((a, b) => b.wins - a.wins);
    }

    // ── Game logic ────────────────────────────────────────────────────

    update(flagManager) {
        if (this.winner) return;
        if (!flagManager?.flags) return;

        const remaining = flagManager.flags;
        if (remaining.length !== 1) return;

        const flag = remaining[0];
        this.winner = flag;

        // Record the win
        const { code, name, image } = flag.country;
        if (!this._wins[code]) {
            this._wins[code] = { name, image, wins: 0 };
        }
        this._wins[code].wins++;
        this._saveWins();

        if (this.onWin) this.onWin(flag);
    }

    reset() {
        this.winner = null;
    }
}