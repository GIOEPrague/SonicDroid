var sonicDroid = sonicDroid || {};
sonicDroid.Viewport = function(params) {
  this.width = params.width;
  this.height = params.height;
  this.id = params.id;
  this.imageUrls = params.imageUrls;
  this.keys = {};
  this.speeds = {
    move: 500,
    bg: 500
  }
  this.prevTime = -1;
  this.flameDiff = 0;
  this.flame = true;
  this.flameInterval = 150;
};

sonicDroid.Viewport.prototype.init = function() {
  var director;

  director = new CAAT.Director().initialize(
    this.width,
    this.height,
    document.getElementById(this.id)
  );

  CAAT.registerKeyListener(this.onKey.bind(this));

  new CAAT.ImagePreloader().loadImages(
    this.imageUrls,
    (function(counter, images) {
      if (counter === images.length) {
        director.emptyScenes();
        director.setImagesCache(images);
        this.createScene(director);
      }
    }).bind(this)
  );
};

sonicDroid.Viewport.prototype.createScene = function(director) {
  var scene,
    droidImg;

  this.scene = scene = director.createScene();

  droidImg = new CAAT.SpriteImage().initialize(director.getImage('droid'), 1, 2);
  this.droid = new CAAT.Actor()
    .setBackgroundImage(droidImg.getRef(), true)
    .setLocation(20, 20);
  scene.addChild(this.droid);

  scene.createTimer(scene.time, Number.MAX_VALUE, null, this.onSceneTick.bind(this), null);
  director.loop(30);
};

sonicDroid.Viewport.prototype.onSceneTick = function(time, ttime) {
  var timeDiff = ttime - this.prevTime,
    keys = this.keys,
    speed = this.speeds.move,
    droid = this.droid,
    scene = this.scene;

  if (this.prevTime !== -1) {
    if (this.flameDiff > this.flameInterval) {
      this.flame = !this.flame;
      this.flameDiff -= this.flameInterval;
    }
    droid.setSpriteIndex(this.flame ? 0 : 1);
    this.flameDiff += timeDiff;

    if (keys.up && !keys.down) {
      droid.y -= speed * (timeDiff / 1000);
      if (droid.y < 0) {
        droid.y = 0;
      }
    }
    if (keys.down && !keys.up) {
      droid.y += speed * (timeDiff / 1000);
      if ((droid.y + droid.height) > scene.height) {
        droid.y = scene.height - droid.height;
      }
    }
    if (keys.left && !keys.right) {
      droid.x -= speed * (timeDiff / 1000);
      if (droid.x < 0) {
        droid.x = 0;
      }
    }
    if (keys.right && !keys.left) {
      droid.x += speed * (timeDiff / 1000);
      if ((droid.x + droid.width) > scene.width) {
        droid.x = scene.width - droid.width;
      }
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
    id: 'viewport',
    imageUrls: [{
      id: 'droid', url: 'img/droid.png'
    }]
  });
  window.addEventListener('load', vp.init.bind(vp), false);
})();
