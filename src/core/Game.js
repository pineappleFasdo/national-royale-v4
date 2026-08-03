export default class Game {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
    }
  
    resize(width, height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  
    update() {}
  
    draw() {
      this.ctx.fillStyle = "red";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  
      this.ctx.fillStyle = "white";
      this.ctx.font = "40px Arial";
      this.ctx.fillText("Game Running", 50, 80);
    }
  
    loop = () => {
      this.update();
      this.draw();
      requestAnimationFrame(this.loop);
    };
  }