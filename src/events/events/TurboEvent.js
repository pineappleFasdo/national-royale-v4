export default class TurboEvent {
    name  = "TURBO";
    color = "#FF6B00";
    icon  = "⚡";

    _originalSpeed = 0.022;

    start({ arena }) {
        this._originalSpeed  = arena.rotationSpeed;
        arena._turboActive   = true;
        arena.rotationSpeed  = 0.068;
        arena.initialGapSize = 5;
        arena.maxGapSize     = 14;
    }

    update({ arena }) {
        if (arena.state === "PLAYING") {
            arena.rotationSpeed = 0.068;
        }
    }

    end({ arena }) {
        arena._turboActive   = false;
        arena.rotationSpeed  = this._originalSpeed;
        arena.initialGapSize = 6;
        arena.maxGapSize     = 18;
    }
}