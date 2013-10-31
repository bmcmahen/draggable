
/**
 * dependencies.
 */

var emitter = require('emitter');
var mouse = require('mouse');
var events = require('events');
var translate = require('translate');
var classes = require('classes');
var debounce = require('debounce');

/**
 * export `Draggable`.
 */

module.exports = function(el){
  return new Draggable(el);
};

/**
 * initialize new `Draggable`.
 *
 * @param {Element} el
 * @param {Object} opts
 */

function Draggable(el){
  this._xAxis = true;
  this._yAxis = true;
  this.el = el;
}

/**
 * mixins.
 */

emitter(Draggable.prototype);

/**
 * build draggable.
 *
 * @return {Draggable}
 */

Draggable.prototype.build = function(){
  var el = this._handle || this.el;
  this.touch = events(el, this);
  this.touch.bind('touchstart', 'onmousedown');
  this.touch.bind('touchmove', 'onmousemove');
  this.touch.bind('touchend', 'onmouseup');
  this.mouse = mouse(el, this);
  this.mouse.bind();
  return this;
};

/**
 * on-mousedown
 */

Draggable.prototype.onmousedown = function(e){
  e.preventDefault();
  if (e.touches) e = e.touches[0];
  this.getCurrentPosition();
  this.x = e.pageX - this.ox;
  this.y = e.pageY - this.oy;
  classes(this.el).add('dragging');
  this.emit('start');
};

Draggable.prototype.getCurrentPosition = function(){
  var rect = this.el.getBoundingClientRect();
  var parentRect = this.el.parentNode.getBoundingClientRect();
  this.ox = rect.left - parentRect.left;
  this.oy = rect.top - parentRect.top;
  return {x : this.ox, y: this.oy };
};


var debouncedPause = debounce(function(x, y){
  if (this.dragging) this.emit('pause', x, y);
}, 350);

/**
 * on-mousemove
 */

Draggable.prototype.onmousemove = function(e){
  if (e.touches) e = e.touches[0];
  var x = this._xAxis ? (e.pageX - this.x) : this.ox;
  var y = this._yAxis ? (e.pageY - this.y) : this.oy;
  var o, el, halfHeight, halfWidth, rel = this.el;
  this.dragging = true;

  // support containment
  if (el = this._containment) {
    o = { y: y + rel.clientHeight };
    o.x = x + rel.clientWidth;
    o.height = el.clientHeight;
    o.width = el.clientWidth;
    o.h = o.height - rel.clientHeight;
    o.w = o.width - rel.clientWidth;
    halfWidth = rel.clientWidth / 2;
    halfHeight = rel.clientHeight / 2;

    // optionally contain to the middle of the element
    // x-axis
    if (this._containMiddleX){
      if (-halfWidth >=x) x = -halfWidth;
      if (o.x >= o.width + halfWidth) x = o.w + halfWidth;
    } else {
      if (0 >= x) x = 0;
      if (o.x >= o.width) x = o.w;
    }

    
    if (this._containMiddleY){
      if (-halfHeight >= y) y = -halfHeight;
      if (o.y >= o.height + halfHeight) y = o.h + halfHeight;
    } else {
      if (0 >= y) y = 0;
      if (o.y >= o.height) y = o.h;
    }
  }

  // move draggable.
  // translate(this.el, x, y);
  this.moveTo(x, y);

  // all done.
  this.emit('drag', x, y);

  // call debounced pause
  debouncedPause.call(this, x, y);
};

/**
 * on-mouseup
 */


Draggable.prototype.onmouseup = function(e){
  classes(this.el).remove('dragging');
  this.dragging = false;
  this.getCurrentPosition();
  this.emit('end');
};

/**
 * destroy draggable.
 */

Draggable.prototype.destroy = function(){
  if (this.mouse) this.mouse.unbind();
  this.mouse = null;
  if (this.touch) this.touch.unbind();
  this.touch = null;
  return this;
};

/**
 * Disable x-axis movement.
 * @return {Draggable} 
 */

Draggable.prototype.disableXAxis = function(){
  this._xAxis = false;
  return this;
};

/**
 * Disable y-axis movement.
 * @return {Draggable}
 */

Draggable.prototype.disableYAxis = function(){
  this._yAxis = false;
  return this;
};

/**
 * Set a containment element.
 * @param  {Element} el 
 * @return {Draggable}    
 */

Draggable.prototype.containment = function(el, options){
  // Sometimes you only want the draggable element contained to its 
  // middle, such as when making a slider. This is kinda an icky
  // api. 
  options = options || {};
  if (options.middleX) this._containMiddleX = true;
  if (options.middleY) this._containMiddleY = true;
  this._containment = el;
  return this;
};

/**
 * Set a handle.
 * @param  {Element} el 
 * @return {Draggable}    
 */

Draggable.prototype.handle = function(el){
  this._handle = el;
  return this;
};


/**
 * moveTo a specific spot.
 * @param  {Number} x 
 * @param  {Number} y 
 * @return {Draggable}   
 */

Draggable.prototype.moveTo = function(x, y){
  translate(this.el, x, y);
  return this;
};
