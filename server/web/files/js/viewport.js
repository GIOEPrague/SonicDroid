var sonicDroid = sonicDroid || {};
sonicDroid.Viewport = function(params) {
  this.width = params.width;
  this.height = params.height;
  this.id = params.id;
  this.scoreId = params.scoreId;
  this.imageUrls = params.imageUrls;
  this.keys = {};
  this.speeds = {
    move: 500,
    originalMove: 500,
    flamed: 1000,
    obstacles: 750
  }
  this.prevTime = -1;
  this.prevStarTime = -1;
  this.flame = false;
  this.obstacles = [];
  this.pickedObstacles = [];
  this.score = 0;
  this.droidWingSize = 40;
  this.droidHeadTolerance = 20;
  this.droidTailTolerance = 50;
  this.maxPickingAnimTime = 250;
  this.maxPickingScale = 5;
  this.stars = [];
  this.starsCount = 300;
  this.maxStarsZ = 10;
};

sonicDroid.Viewport.prototype.init = function() {
  var director;

  this.director = director = new CAAT.Director().initialize(
    this.width,
    this.height,
    document.getElementById(this.id)
  );

  for (var i = 0; i < this.starsCount; i++) {
    this.stars[i] = {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      z: Math.random() * this.maxStarsZ
    }
  }

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
  this.scoreElem = document.getElementById(this.scoreId);
};

sonicDroid.Viewport.prototype.createScene = function(director) {
  var scene,
    droidImg,
    stars;

  this.scene = scene = director.createScene();

  stars = new CAAT.Actor()
    .setLocation(0, 0)
    .setSize(scene.width, scene.height);
  stars.paint = this.onStarsPaint.bind(this);
  scene.addChild(stars);

  droidImg = new CAAT.SpriteImage().initialize(director.getImage('droid'), 1, 2);
  this.droid = new CAAT.Actor()
    .setBackgroundImage(droidImg.getRef(), true)
    .setLocation(50, 180);
  scene.addChild(this.droid);

  scene.animate = this.animateScene.bind(this);
  director.loop(30);
};

sonicDroid.Viewport.prototype.onStarsPaint = function(director, time) {
  var ctx = director.ctx,
    timeDiff = time - this.prevStarTime,
    speed = this.speeds.move;

  // FIXME it's ugly to abuse the dash character (only draw the line)
  ctx.fillStyle = 'white';
  for (var i = 0; i < this.starsCount; i++) {
    var star = this.stars[i],
      size = (star.z * 3);
    ctx.font = size + 'px sans-serif';

    star.x -= (star.z / this.maxStarsZ) * (speed * 2) * (timeDiff / 1000);

    if (star.x < -size) {
      star.x = this.width + size;
      star.y = Math.random() * this.height,
      star.z = Math.random() * this.maxStarsZ;
    }
    ctx.fillText('\u2014', star.x, star.y);
  }
  this.prevStarTime = time;
};

sonicDroid.Viewport.prototype.setSpeed = function(newSpeed) {
  this.speeds.obstacles = newSpeed;
};

sonicDroid.Viewport.prototype.addObstacle = function(id, y, speedCallback, currentScaleCallback) {
  var newObstacle,
    obstacleImg;

  obstacleImg = new CAAT.SpriteImage().initialize(this.director.getImage('obstacles'), 3, 3);
  newObstacle = new CAAT.Actor()
    .setBackgroundImage(obstacleImg.getRef(), true)
    .setLocation(this.scene.width, y)
    .setSpriteIndex(Math.ceil(Math.random() * 8));
  newObstacle.id = id;
  newObstacle.getCurrentSpeed = speedCallback;
  newObstacle.getCurrentScale = currentScaleCallback;

  this.obstacles.push(newObstacle);
  this.scene.addChild(newObstacle);
};

sonicDroid.Viewport.prototype.animateScene = function(director, time) {
  var timeDiff = time - this.prevTime,
    keys = this.keys,
    speed = this.speeds.move,
    droid = this.droid,
    scene = this.scene;

  if (this.prevTime !== -1) {
    this.moveObstacles(timeDiff);
    this.animatePickedObstacles(timeDiff);

    // FIX change index only when flame is changed
    droid.setSpriteIndex(this.flame ? 0 : 1);

    if (keys.up && !keys.down) {
      droid.y -= speed * (timeDiff / 1000);
      if (droid.y < 0) {
        droid.y = 0;
      }
    }
    else if (keys.down && !keys.up) {
      droid.y += speed * (timeDiff / 1000);
      if ((droid.y + droid.height) > scene.height) {
        droid.y = scene.height - droid.height;
      }
    }

    if (keys.right && !keys.left) {
      droid.x += speed * (timeDiff / 1000);
      if ((droid.x + droid.width) > scene.width) {
        droid.x = scene.width - droid.width;
      }
    }
    else if (droid.x > 10) {
      droid.x -= speed * 1.5 * (timeDiff / 1000);
      if (droid.x < 10) {
        droid.x = 10;
      }
    }
  }
  this.prevTime = time;

  return CAAT.Scene.prototype.animate.call(this.scene, director, time);
};

sonicDroid.Viewport.prototype.moveObstacles = function(timeDiff) {
  var obstSpeed = this.speeds.obstacles,
    obstacles = this.obstacles,
    obstacle,
    collided,
    droidCoords,
    scale;

  droidCoords = {
    x: this.droid.x - this.droidHeadTolerance,
    y: (this.droid.y + this.droidWingSize),
    width: (this.droid.width - this.droidTailTolerance),
    height: (this.droid.height - this.droidWingSize * 2)
  };
  for (var i = 0; i < obstacles.length; i++) {
    obstacle = obstacles[i];
    obstacle.x -= (obstSpeed + obstacle.getCurrentSpeed(obstacle.id)) * (timeDiff / 1000);
    scale = obstacle.getCurrentScale(obstacle.id);
    obstacle.setScale(scale, scale);
    if (obstacle.x < -obstacle.width || (collided = this.isCollide(droidCoords, obstacle))) {
      obstacles.splice(i, 1);
      if (collided) {
        obstacle.pickingAnimTime = 0;
        this.pickedObstacles.push(obstacle);
        this.incrementScore();
      }
      else {
        this.scene.removeChild(obstacle);
      }
    }
  }
};

sonicDroid.Viewport.prototype.animatePickedObstacles = function(timeDiff) {
  var obstacles = this.pickedObstacles,
    obstacle,
    animCoef,
    scale,
    alpha,
    rotation;

  for (var i = 0; i < obstacles.length; i++) {
    obstacle = obstacles[i];
    obstacle.pickingAnimTime += timeDiff;

    animCoef = Math.min(obstacle.pickingAnimTime / this.maxPickingAnimTime, 1);
    alpha = 1 - animCoef;
    scale = 1 + animCoef * this.maxPickingScale;
    rotation = animCoef * Math.PI;

    obstacle.setScale(scale, scale);
    obstacle.setRotation(rotation);
    obstacle.setAlpha(alpha);
    if (obstacle.pickingAnimTime > this.maxPickingAnimTime) {
      obstacles.splice(i, 1);
      this.scene.removeChild(obstacle);
    }
  }

};

sonicDroid.Viewport.prototype.incrementScore = function() {
  this.score++;
  this.scoreElem.innerHTML = this.score;
};

sonicDroid.Viewport.prototype.isCollide = function(a, b) {
  // TODO bez křídel
  return !(
    ((a.y + a.height) < (b.y)) ||
    (a.y > (b.y + b.height)) ||
    ((a.x + a.width) < b.x) ||
    (a.x > (b.x + b.width))
  );
}

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
    if (action === 'down') {
      this.flame = false;
    }
    event.preventDefault();
    this.keys.left = (action !== 'up');
  }
  if (keyCode === CAAT.Keys.RIGHT) {
    if (action === 'down') {
      this.flame = true;
      this.speeds.move = this.speeds.flamed;
    }
    else {
      this.flame = false;
      this.speeds.move = this.speeds.originalMove;
    }
    event.preventDefault();
    this.keys.right = (action !== 'up');
  }
};

(function() {
  var vp = new sonicDroid.Viewport({
    width: 800,
    height: 480,
    id: 'viewport',
    scoreId: 'score',
    imageUrls: [{
      id: 'droid', url: 'files/img/droid.png'
    }, {
      id: 'obstacles', url: 'files/img/mapa_icon.png'
    }]
  });
  // var angle = 0,
  //   id = 0;
  // window.setInterval(function() {
  //     vp.addObstacle(id, Math.random() * vp.scene.height, function(id) {
  //       return id * 10 % 500;
  //     }, function(id) {
  //       angle += Math.PI / 30;
  //       return 1.8 + Math.sin(angle + id);
  //     });
  //     //vp.addObstacle(100, 0);
  // }, 500);
  window.viewportController = vp;
  window.addEventListener('load', vp.init.bind(vp), false);
})();
