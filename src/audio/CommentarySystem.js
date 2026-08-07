// CommentarySystem — periodic ambient voice commentary during PLAYING state.
// Never repeats the same line twice in a row. Silenced during countdown and
// winner announcement so it never steps on important audio moments.

export default class CommentarySystem {

    // ── Line pool ─────────────────────────────────────────────────────────────
    // Grouped by context so the right lines fire at the right time.

    static _GENERIC = [
        "Comment which country will win!",
        "Support your favourite country!",
        "Who will be eliminated next?",
        "The tension is rising!",
        "It's anyone's game right now!",
        "What a battle inside the arena!",
        "The crowd is on the edge of their seats!",
        "Which flag will survive to the end?",
        "Flags are flying — literally!",
        "The competition is fierce today!",
        "Every collision could change everything!",
        "Who will be the last one standing?",
        "Drop your prediction in the comments!",
        "This is National Royale at its finest!",
        "The arena is heating up!",
    ];

    static _MANY_LEFT = [     // > 50% remaining
        "Over a hundred nations still in play!",
        "So many contenders — this could go on a while!",
        "The field is packed — anything can happen!",
    ];

    static _MID_GAME = [      // 25–50% remaining
        "The field is thinning out!",
        "We're past the halfway mark — who's your pick?",
        "Only the strong survive from here!",
        "Things are getting serious in the arena!",
    ];

    static _LATE_GAME = [     // 10–25% remaining
        "We're down to the final quarter!",
        "The end is near — who will make it?",
        "Every elimination counts now!",
        "The pressure is immense!",
        "We're approaching the finish line!",
    ];

    static _FINAL_FEW = [     // ≤ 10 remaining
        "The final few are fighting it out!",
        "This is it — the last flags standing!",
        "One of these flags will be champion!",
        "Heart-pounding action in the final moments!",
        "The champion will be crowned very soon!",
    ];

    // ── Constructor ───────────────────────────────────────────────────────────

    constructor(audio) {
        this._audio       = audio;
        this._timer       = 0;
        this._nextTrigger = this._randomInterval();
        this._lastLine    = null;
        this._enabled     = true;
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /** Call once per frame from Game.update() during PLAYING state only */
    update(remaining, total) {
        if (!this._enabled) return;

        this._timer++;
        if (this._timer < this._nextTrigger) return;

        this._timer       = 0;
        this._nextTrigger = this._randomInterval();

        const line = this._pickLine(remaining, total);
        if (line) this._audio.speakCommentary(line);
    }

    /** Stop commentary mid-line (winner / countdown moments) */
    silence() {
        if (!("speechSynthesis" in window)) return;
        speechSynthesis.cancel();
        this._timer = 0;   // reset timer so we don't fire immediately after silence
    }

    enable()  { this._enabled = true;  }
    disable() { this._enabled = false; }

    // ── Internals ─────────────────────────────────────────────────────────────

    /** First line: 8–15 s. Subsequent lines: 20–35 s. */
    _randomInterval() {
        const isFirst = this._lastLine === null;
        return isFirst
            ? (8  + Math.random() * 7)  * 60   // 8–15 s
            : (20 + Math.random() * 15) * 60;   // 20–35 s
    }

    _pickLine(remaining, total) {
        const pct = remaining / total;

        // Choose the right pool based on how far into the game we are
        let pool;
        if      (remaining <= 10)  pool = CommentarySystem._FINAL_FEW;
        else if (pct <= 0.25)      pool = CommentarySystem._LATE_GAME;
        else if (pct <= 0.50)      pool = CommentarySystem._MID_GAME;
        else if (pct > 0.50)       pool = CommentarySystem._MANY_LEFT;
        else                       pool = CommentarySystem._GENERIC;

        // Merge with generic pool so there's always variety
        const combined = [...pool, ...CommentarySystem._GENERIC];

        // Filter out the last line spoken to prevent immediate repeats
        const candidates = combined.filter(l => l !== this._lastLine);
        if (!candidates.length) return null;

        const line    = candidates[Math.floor(Math.random() * candidates.length)];
        this._lastLine = line;
        return line;
    }
}
