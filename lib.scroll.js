/**
 *
 * Find more about the scrolling function at
 * http://cubiq.org/scrolling-div-for-mobile-webkit-turns-3/16
 *
 * Copyright (c) 2009 Matteo Spinelli, http://cubiq.org/
 * Released under MIT license
 * http://cubiq.org/dropbox/mit-license.txt
 *
 * Version 3.1beta1 - Last updated: 2010.05.06
 *
 */

function Scroller(el, options) {
  this.element = typeof el === 'object' ? el : document.getElementById(el);

  var p = this.element.parentNode;
  if (Element.hasAttribute(p, 'scroll_wrapper')) {
    this.wrapper = p;
  } else {
    this.wrapper = Element.wrap(this.element, 'div', {scroll_wrapper:"true"});
  }

  this.wrapper.style.height = options.height;
  this.wrapper.style.overflow = 'hidden';
  this.wrapper.style.position = 'relative';
  this.wrapper.style.zIndex = '1';
  this.wrapper.style.width = '100%';
  this.wrapper.style.border = '1px';
  this.wrapper.style.borderTopStyle = 'hidden';
  this.wrapper.style.borderLeftStyle = 'hidden';
  this.wrapper.style.borderRightStyle = 'hidden';
  this.wrapper.style.borderBottomStyle = 'solid';
  this.wrapper.style.borderColor = 'gray';
  if (options.antiFloat)  {
    this.element.style.height = this.wrapper.parentNode.offsetHeight + 'px';
  }
  this.element.style.webkitTransitionProperty = '-webkit-transform';
  this.element.style.webkitTransitionTimingFunction = 'cubic-bezier(0,0,0.25,1)';
  this.element.style.webkitTransitionDuration = '0';
  this.element.style.webkitTransform = 'translate3d(0,0,0)';
  // Get options
  this.options = {
    bounce: true
  };

  if (typeof options === 'object') {
     for (var i in options) {
       if ( options.hasOwnProperty(i)) {
         this.options[i] = options[i];
       }
     }
  }
  this.verticalMargin = 192;
  this.refresh();
  this.element.addEventListener('touchstart', this);
  this.element.addEventListener('touchmove', this);
  this.element.addEventListener('touchend', this);
}

Scroller.prototype = {
  x: 0,
  y: 0,

  handleEvent: function (e) {
    switch (e.type) {
    case 'touchstart':
      this.onTouchStart(e);
      break;
    case 'touchmove':
      this.onTouchMove(e);
      break;
    case 'touchend':
      this.onTouchEnd(e);
      break;
    case 'webkitTransitionEnd':
      this.onTransitionEnd(e);
      break;
    }
  },

  refresh: function () {
    this.element.style.webkitTransitionDuration = '0';
    this.scrollWidth = this.wrapper.clientWidth;
    this.scrollHeight = this.wrapper.clientHeight;
    this.maxScrollX = this.scrollWidth - this.element.offsetWidth;
    this.maxScrollY = this.scrollHeight - this.element.offsetHeight - this.verticalMargin;
    this.momentumX = -this.maxScrollX;
    this.momentumY = this.verticalMargin > this.element.offsetHeight ? -this.maxScrollY - this.element.offsetHeight : -this.maxScrollY;

    var resetX = this.x,
      resetY = this.y;
    if (this.scrollX && this.x < this.maxScrollX) {
      resetX = this.maxScrollX;
    }
    if (this.scrollY && this.y < this.maxScrollY) {
      resetY = this.maxScrollY;
    }
    this.scrollTo(resetX, resetY, '0');

    this.scrollX = this.element.offsetWidth > this.scrollWidth ? true : false;
    this.scrollY = this.element.offsetHeight > this.scrollHeight ? true : false;
  },

  setPosition: function (x, y) {
    this.x = x !== null ? x : this.x;
    this.y = y !== null ? y : this.y;

    this.element.style.webkitTransform = 'translate3d(' + this.x + 'px,' + this.y + 'px,0)';
  },

  show: function (element) {
    if (element !== null) {
      var pos = Element.cumulativeOffset(element);
      var wrappery = Element.cumulativeOffset(this.wrapper)[1];
      var h = Element.getHeight(element);
      var y = wrappery + h - pos[1];
      this.setPosition(0, y > 0 ? 0 : y);
    }
  },

  onTouchStart: function (e) {
    if (e.targetTouches.length !== 1) {
      return false;
    }

    e.preventDefault();
    e.stopPropagation();

    this.element.style.webkitTransitionDuration = '0';

    // Check if elem is really where it should be
    var theTransform = new WebKitCSSMatrix(window.getComputedStyle(this.element).webkitTransform);
    if (theTransform.m41 !== this.x || theTransform.m42 !== this.y) {
      this.setPosition(theTransform.m41, theTransform.m42);
    }

    this.touchStartX = e.touches[0].pageX;
    this.scrollStartX = this.x;

    this.touchStartY = e.touches[0].pageY;
    this.scrollStartY = this.y;

    this.scrollStartTime = e.timeStamp;
    this.moved = false;
    return true;
  },

  onTouchMove: function (e) {
    if (e.targetTouches.length !== 1) {
      return false;
    }

    var leftDelta = this.scrollX === true ? e.touches[0].pageX - this.touchStartX : 0;
    var topDelta = this.scrollY === true ? e.touches[0].pageY - this.touchStartY : 0;

    if (this.x > 0 || this.x < this.maxScrollX) {
      leftDelta = Math.round(leftDelta / 4); // Slow down if outside of the boundaries
    }

    if (this.y > 0 || this.y < this.maxScrollY) {
      topDelta = Math.round(topDelta / 4); // Slow down if outside of the boundaries
    }

    this.setPosition(this.x + leftDelta, this.y + topDelta);

    this.touchStartX = e.touches[0].pageX;
    this.touchStartY = e.touches[0].pageY;
    this.moved = true;


    // Prevent slingshot effect
    if (e.timeStamp - this.scrollStartTime > 250) {
      this.scrollStartX = this.x;
      this.scrollStartY = this.y;
      this.scrollStartTime = e.timeStamp;
    }
    return true;
  },

  momentum: function (time, scrolly) {
    var r = {
      dist: 0.0,
      time: 0.0
    },
    speed2dist = 500,
    speed2time = 700,
    protect_dist = 45;

    var dist, speed, beg_brake_dist, end_brake_dist;
    if (this.scrollX && !scrolly) {
      dist = this.x - this.scrollStartX;
      speed = Math.abs(dist) / time;
      beg_brake_dist = protect_dist - this.x;
      end_brake_dist = protect_dist + this.x + this.momentumX;
    }

    if (this.scrollY && scrolly) {
      dist = this.y - this.scrollStartY;
      speed = Math.abs(dist) / time;
      beg_brake_dist = protect_dist - this.y;
      end_brake_dist = protect_dist + this.y + this.momentumY;
    }

    r.dist = speed * speed * speed2dist;
    if (dist > 0 && r.dist > beg_brake_dist) {
      speed = speed * Math.abs(beg_brake_dist / r.dist);
      r.dist = beg_brake_dist;
    }
    if (dist < 0 && r.dist > end_brake_dist) {
      speed = speed * Math.abs(end_brake_dist / r.dist);
      r.dist = end_brake_dist;
    }
    r.dist = r.dist * (dist < 0 ? -1 : 1);

    r.time = speed * speed2time;
    r.time = r.time < 1 ? 1 : r.time;
    return {
      dist: Math.round(r.dist),
      time: Math.round(r.time)
    };
  },

  onTouchEnd: function (e) {
    if (e.targetTouches.length > 0) {
      return false;
    }

    if (!this.moved) {
      var theEvent = document.createEvent('MouseEvents');
      theEvent.initMouseEvent("click", true, true, document.defaultView, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null);
      e.changedTouches[0].target.dispatchEvent(theEvent);
      return false;
    }

    var time = e.timeStamp - this.scrollStartTime,
      scroll_x = this.x,
      scroll_y = this.y,
      m = {
        dist: 0.0,
        time: 0.0
      };

    if (this.scrollY) {
      m = this.momentum(time, true);
      scroll_y += m.dist;
    }
    if (this.scrollX) {
      m = this.momentum(time, false);
      scroll_x += m.dist;
    }

    if (!m.dist) {
      this.onTransitionEnd(); // todo lame
      return false;
    }


    this.element.addEventListener('webkitTransitionEnd', this);
    this.scrollTo(scroll_x, scroll_y, m.time + 'ms');

    if (document.viewport.getScrollOffsets()[1] > 0) {
      window.scrollTo(0, 0);
    }
    return true;
  },

  onTransitionEnd: function () {
    this.element.removeEventListener('webkitTransitionEnd', this);
    this.resetPosition();
  },

  resetPosition: function () {
    var resetX = null;
    var resetY = null;
    if (this.x > 0 || this.x < this.maxScrollX) {
      resetX = this.x >= 0 ? 0 : this.maxScrollX;
    }

    if (this.y > 0 || this.y < this.maxScrollY) {
      resetY = this.y >= 0 ? 0 : this.maxScrollY;
    }

    if (resetX !== null || resetY !== null) {
      this.scrollTo(resetX, resetY, '500ms');
    }
  },

  scrollTo: function (destX, destY, runtime) {
    this.element.style.webkitTransitionDuration = runtime || '400ms';
    this.setPosition(destX, destY);
  }

};

function make_scroller(id, option) {
  document[id + '_scroller'] = new Scroller(id, option);
}