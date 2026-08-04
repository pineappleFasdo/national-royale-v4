export default class LayoutManager {

    constructor() {

        this.bottomTrayHeight = 90;
        this.padding = 20;

    }

    update(width, height) {

        this.width = width;
        this.height = height;

        this.playHeight =
            height - this.bottomTrayHeight;

        this.arenaRadius =
            Math.min(width, this.playHeight) * 0.38;

        this.arenaX =
            width / 2;

        this.arenaY =
            this.playHeight / 2;

    }

}