var sonicDroid = sonicDroid || {};
sonicDroid.Viewport = function(params) {
  this.width = params.width;
  this.height = params.height;
  this.id = params.id;
  this.keys = {};
  this.speeds = {
    move: 100
  }
  this.prevTime = -1;
};

sonicDroid.Viewport.prototype.init = function() {
  var director;

  director = new CAAT.Director().initialize(
    this.width,
    this.height,
    document.getElementById(this.id)
  );

  CAAT.registerKeyListener(this.onKey.bind(this));

  this.scene = director.createScene();

  this.circle = new CAAT.ShapeActor()
    .setLocation(20,20)
    .setSize(60,60)
    .setFillStyle('#ff0000')
    .setStrokeStyle('#000000');
  this.scene.addChild(this.circle);

  this.scene.createTimer(this.scene.time, Number.MAX_VALUE, null, this.onSceneTick.bind(this), null);

  director.loop(30);
};

sonicDroid.Viewport.prototype.onSceneTick = function(time, ttime) {
  var timeDiff = ttime - this.prevTime,
    keys = this.keys,
    speed = this.speeds.move;

  if (this.prevTime !== -1) {
    if (keys.up && !keys.down) {
      this.circle.y -= speed * (timeDiff / 1000);
    }
    if (keys.down && !keys.up) {
      this.circle.y += speed * (timeDiff / 1000);
    }
    if (keys.left && !keys.right) {
      this.circle.x -= speed * (timeDiff / 1000);
    }
    if (keys.right && !keys.left) {
      this.circle.x += speed * (timeDiff / 1000);
    }
  }

  this.prevTime = ttime;
};

sonicDroid.Viewport.prototype.onKey = function(event) {
  var keyCode = event.getKeyCode(),
    action = event.getAction();

  if (keyCode === CAAT.Keys.UP) {
    event.preventDefault();
    this.keys.up = (action !== 'up');
  }
  if (keyCode === CAAT.Keys.DOWN) {
    event.preventDefault();
    this.keys.down = (action !== 'up');
  }
  if (keyCode === CAAT.Keys.LEFT) {
    event.preventDefault();
    this.keys.left = (action !== 'up');
  }
  if (keyCode === CAAT.Keys.RIGHT) {
    event.preventDefault();
    this.keys.right = (action !== 'up');
  }
};

(function() {
  var vp = new sonicDroid.Viewport({
    width: 800,
    height: 480,
    id: 'viewport'
  });
  window.addEventListener('load', vp.init.bind(vp), false);
})();
