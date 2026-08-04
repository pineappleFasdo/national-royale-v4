export default class WinnerManager {

    constructor() {

        this.winner = null;
        this.gameOver = false;

    }

    update(flagManager) {

        if (this.gameOver) {
            return;
        }

        if (flagManager.flags.length === 1) {

            this.winner = flagManager.flags[0];
            this.gameOver = true;

            console.log(
                this.winner.country.name + " WINS!"
            );

        }

    }

}