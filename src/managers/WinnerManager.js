export default class WinnerManager {

    constructor() {

        this.finished = false;
        this.winner = null;
        this.finishedTime = 0;
        this.onWin = null;

    }

    update(flagManager) {

        if (this.finished) return;

        if (flagManager.flags.length === 1) {

            this.finished = true;
            this.winner = flagManager.flags[0];
            this.finishedTime = performance.now();

            console.log(
                "🏆 Winner:",
                this.winner.country.name
            );

            if (this.onWin) {
                this.onWin(this.winner);
            }

        }

    }

    shouldRestart() {

        return this.finished &&
               performance.now() - this.finishedTime > 4000;

    }

    reset() {

        this.finished = false;
        this.winner = null;
        this.finishedTime = 0;

    }

}