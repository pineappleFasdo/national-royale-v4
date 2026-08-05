export default class AudioManager {

    constructor() {

        this.victory = new Audio("/sounds/victory.mp3");

    }

    playVictory() {

        this.victory.currentTime = 0;
        this.victory.play().catch(() => {});

    }

    speak(text) {

        if (!("speechSynthesis" in window)) return;

        speechSynthesis.cancel();

        const speech = new SpeechSynthesisUtterance(text);

        speech.rate = 0.9;
        speech.pitch = 1;
        speech.volume = 1;

        speechSynthesis.speak(speech);

    }

}