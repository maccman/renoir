var Renoir = new SuperClass();

(function($){
  
var Sprite = new SuperClass();
var Vector = new SuperClass();
var Coord  = new SuperClass();
var Animation = new SuperClass();
Renoir.Sprite = Sprite;
Sprite.className = "Sprite";
Renoir.Vector = Vector;
Renoir.Coord  = Coord;
Renoir.Animation = Animation;
  
Coord.include({
  x: 0, y: 0,
  
  init: function(x, y){
    this.x = x || 0;
    this.y = y || 0;
  }
});

Vector.include({
  x: 0, y: 0,
  
  init: function(x, y){
    this.x = x || 0;
    this.y = y || 0;
  },
  
  reset: function(){
    this.init();
  },
  
  dup: function(){
    return(new this._class(this.x, this.y));
  },
  
  minus: function(v){
    return(this.dup().minusEquals(v));
  },
  
  plus: function(v){
    return(this.dup().plusEquals(v));
  },
  
  multi: function(num){
    return(this.dup().multiEquals(num));
  },
  
  plusEquals: function(v){
    this.x += v.x;
    this.y += v.y;
    return this;
  },
  
  minusEquals: function(v){
    this.x -= v.x;
    this.y -= v.y;
    return this;
  },
  
  multiEquals: function(num){
    this.x *= num;
    this.y *= num;
    return this;
  },
  
  replace: function(v){
    this.x = v.x;
    this.y = v.y;
    return this;
  }  
});

Renoir.extend({
  installed: function(){
    return(!!$("<canvas />")[0].getContext);
  }
});

Renoir.include({
  children: [],
  force:    new Vector(0, 0),
  fps:      45,
  
  init: function(element, options){
    this.options  = options || {};
    this.canvas   = $(element);
    this.context  = this.canvas[0].getContext("2d");
    this.dt       = this.options.dt || 0.25;
    this.timeStep = this.dt * this.dt;    
    $($.proxy(this.startLoop, this));
  },
  
  addChild: function(child){
    this.children.push(child);
  },
  
  removeChild: function(child){
    var index = this.children.indexOf(child);
    this.children.splice(index, 1);
  },
  
  addForce: function(vector){
    this.force.plusEquals(vector);
  },
  
  paintCanvas: function(){
    var fillStyle = this.options.fillStyle || 
                    this.options.background;
    if (fillStyle) {
      this.context.fillStyle = fillStyle;
      this.context.fillRect(
        0, 0, 
        this.canvas.width(), 
        this.canvas.height()
      );
    }
  },
  
  paint: function(){
    this.clear();
    this.paintCanvas();
    for(var i in this.children) {
      var child = this.children[i];
      child.addForce(this.force);
      child.step();
      child.integrate(this.timeStep);
      if (child.inViewport(this.dimensions)) child.paint(this);
    }
  },
  
  getDimensions: function(){
    return(new Coord(
      this.canvas.width(), 
      this.canvas.height())
    );
  },
  
  clear: function(){
    this.context.clearRect(
      0, 0, 
      this.canvas.width(), 
      this.canvas.height()
    );
  },
  
  containsPoint: function(coord){
    for(var i in this.children) {
      var success = this.children[i].containsPoint(coord);
      if (success) return this.children[i];
    }
    return false;
  },
  
  collidable: function(){
    var sprites = $.makeArray(arguments);
    // TODO
  },
  
  startLoop: function(){
    var milli = (1000 / parseInt(this.fps, 10)) | 0;
    this.loop = setInterval($.proxy(this.paint, this), milli);
  },
  
  stopLoop: function(){
    clearInterval(this.loop);
  }
});

Sprite.include({
  init: function(options){
    this.force = new Vector;
    this.curr  = new Vector;
    this.prev  = new Vector;
    this.animations = [];
    
    this.options = options || {}
    this.fillStyle = this.options.fillStyle || 
                     this.options.background;
    this.fixed = this.options.fixed || false;
    this.x = this.options.x || 0;
    this.y = this.options.y || 0;
  },
  
  getVelocity: function(){
    return(this.curr.minus(this.prev));
  },
  
  setVelocity: function(vector){
    this.prev = this.curr.minus(vector);
  },
  
  getPosition: function(){
    return(this.curr.dup());
  },
  
  getX: function(){
    return this.curr.x;
  },
  
  getY: function(){
    return this.curr.y;
  },
  
  setX: function(val){
    this.prev.x = val;
    this.curr.x = val;
  },
  
  setY: function(val){
    this.prev.y = val;
    this.curr.y = val;  
  },
  
  containsPoint: function(){ return false; },
  
  inViewport:    function(coord){ 
    return(this.x > 0 && this.x < coord.x ||
          (this.y > 0 && this.y < coord.y));
  },
  
  addForce: function(force){
    this.force.plusEquals(force);
  },
  
  integrate: function(dt2){
    if (this.fixed) return;
    
    var temp  = this.curr.dup();
    var nv    = this.velocity.plus(this.force.multiEquals(dt2));
    // Dampen
		this.curr.plusEquals(nv.multiEquals(0.99));
    this.prev.replace(temp);
    this.force.reset();
  },
  
  draw: function(context){
    throw "Override me";
  },
  
  step: function(){
    for(var i in this.animations) {
      var step = this.animations[i].step(this);
      if (step == false) this.removeAnimation(this.animations[i]);
    }
  },
  
  paint: function(renoir){
    renoir.context.save();
    renoir.context.fillStyle = this.fillStyle;
    this.draw(renoir.context);
    renoir.context.restore();
  },
  
  // props, length, ease, callback
  animate: function(){
    var animation = new Animation.apply(Animation, arguments);
    this.addAnimation(animation);
    animation.start();
  },
  
  addAnimation: function(animation){
    this.animations.push(animation);
  },
  
  removeAnimation: function(ani){
    var index = this.animations.indexOf(ani);
    this.animations.splice(index, 1);
  }
});

// Animation.include({  
//   force: 0,
//   // state: 0,
//   first: 0,
//   difference: 1,  
//   // Needs to remove the forces it's added to the sprite once finished
//   // Every step, needs to add a little bit of force to the sprite
//   
//   init: function(props, duration, ease, callback){
//     this.sprite   = sprite;
//     this.props    = props;
//     this.duration = duration || 5000;
//     this.ease     = ease;
//     if (typeof ease == 'string')
//       this.ease = $.easing[this.ease];
//     this.callback = callback;
//   },
//   
//   start: function(){
//     this.startTime = this.now();
//   },
//   
//   getRunning: function(){
//     return(!!this.startTime);
//   },
//   
//   // JQuery FX args:
//   // * current animation length divided by duration
//   // * current animation length
//   // * first number
//   // * step difference
//   // * duration
//   step: function(sprite){
//     if (!this.running) return;
//     
//     var t = this.now;
//     
//     if (t >= this.duration + this.startTime) {
//       // Finish up
//       if (this.callback)
//         this.callback();
//       
//       for(var key in this.props) {
//         sprite[key] -= this.force;
//       }
//      
// 
//       return false;
//       
//     } else {
//       var n = t - this.startTime;
//      var state = n / this.duration;
//      var pos   = this.ease(this.state, n, this.first, this.difference, this.duration);
//      
//      this.force += pos;
//      
//      this.props
//      
//      for(var key in this.props) {
//        sprite[key] += pos;
//      }
//     }    
//   },
//     
//   getNow: function(){
//     return (new Date).getTime();
//   }
// });

Renoir.Rectangle = new SuperClass(Sprite);
Renoir.Rectangle.className = "Rectangle";
Renoir.Rectangle.include({
  width:  0,
  height: 0,
  
  init: function(width, height, options){
    this._super(options);
    this.width  = width;
    this.height = height;
  },
  
  getOuterX: function(){
    return this.x + this.width;
  },
  
  getOuterY: function(){
    return this.y + this.height;
  },
  
  containsPoint: function(coord){
    return(coord.x > this.x && coord.x < this.outerX &&
          (coord.y > this.y && coord.y < this.outerY));
  },
  
  draw: function(ctx){
    ctx.fillRect(
      this.x, 
      this.y, 
      this.width, 
      this.height
    );
  }
});

Renoir.Circle = new SuperClass(Sprite);
Renoir.Circle.include({  
  init: function(radius, options){
    this._super(options);
    this.radius = radius;
  },
  
  getDiameter: function(){
    return(this.radius * 2);
  },
  
  containsPoint: function(coord){
    var squareDist = Math.pow((this.x - coord.x), 2) + Math.pos((this.y - coord.y), 2);
    return(squareDist <= Math.pow(this.radius, 2));
  },
  
  getOuterX: function(){
    return(this.x + this.diameter);
  },
  
  getOuterY: function(){
    return(this.y + this.diameter);
  },
    
  draw: function(ctx){
    ctx.beginPath();
    ctx.arc(
      this.x + this.radius, 
      this.y + this.radius, 
      this.radius,
      0, 
      Math.PI * 2,
      true
    );
    ctx.closePath();
    ctx.fill();
  }
});

Renoir.Image = new SuperClass(Renoir.Rectangle);
Renoir.Image.className = "Image";
Renoir.Image.include({  
  init: function(width, height, src, options){
    this._super(width, height, options);
    
    this.loaded = false;
    this.element = new Image();
    this.element.onload = $.proxy(function(){
      this.loaded = true;
    }, this);
    this.element.src = src;
  },
  
  draw: function(ctx){
    if (!this.loaded) return;
    ctx.drawImage(
      this.element,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }
});

})(jQuery);

$R = Renoir;