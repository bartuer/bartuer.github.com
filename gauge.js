/**
 * gauge.js 1.4 (10-Aug-2010) (c) by Christian Effenberger
 * All Rights Reserved. Source: gauge.netzgesta.de
 * Distributed under Netzgestade Software License Agreement.
 * This license permits free of charge use on non-commercial
 * and private web sites only under special conditions.
 * Read more at... http://www.netzgesta.de/cvi/LICENSE.txt
 * syntax:

 gauge.defaultWidth        = 400;        //INT 48|8-n (px canvas|var width)
 gauge.defaultHeight       = 30;         //INT 12|48-n (px canvas|var height) (should be dividable by 3)
 gauge.defaultName         = null;       //STR (canvas|var name|id)
 gauge.defaultVertical     = false;      //BOOLEAN (vertical orientation)
 gauge.defaultReflex       = 0.5;        //FLT 0.0-1.0 (transparency of the reflection)
 gauge.defaultRadius       = 1.0;        //FLT 0.0-1.0 (radius of the corners)
 gauge.defaultOpacity      = 0.25;       //FLT 0.0-1.0 (opacity - only visible with limit==true)
 gauge.defaultLimit        = false;      //BOOLEAN (limited value mode)
 gauge.defaultGradient     = false;      //BOOLEAN (color gradient for limit==true and values length==2)
 gauge.defaultNoscale      = false;      //BOOLEAN (no vertical tick marks)
 gauge.defaultScale        = null;       //INT 2-n null==auto (number of scale areas)
 gauge.defaultValues       = null;       //OBJ (array of number values)
 gauge.defaultEmpty        = '#cccccc';  //STR (empty area color)
 gauge.defaultColors       = ['#3765D9','#9EDE7C','#9E42EE','#EC7612','#00aaaa','#cc0000','#aaaa00','#008000']; //OBJ (array of colors)

 *
 **/

var gauge = {
  version: 1.4,
  released: '2010-08-10 12:00:00',
  defaultWidth: 400,
  defaultHeight: 30,
  defaultReflex: 0.5,
  defaultOpacity: 0.25,
  defaultLimit: false,
  defaultNoscale: false,
  defaultGradient: false,
  defaultVertical: false,
  defaultRadius: 1.0,
  defaultScale: null,
  defaultEmpty: '#cccccc',
  defaultName: null,
  defaultValues: null,
  defaultColors: ['#3765d9', '#9ede7c', '#9e42ee', '#ec7612', '#00aaaa', '#cc0000', '#aaaa00', '#008000'],

  modify: function (self, options) {
    var i, q, g, c, n, a, z, l, t = 0,
      j = 0,
      m = 0,
      s = 0,
      e = 0,
      y = 0,
      x = 0,
      v = (options.width < options.height ? 1 : 0),
      r = parseInt(v ? options.width / 2 : options.height / 3, 10),
      h = v ? options.height - r : r * 2,
      w = options.width,
      b = parseInt((v ? w : h) * 1.1, 10),
      k = Math.round(((v ? h : w) - (2 * r)) / b);

    function hex2rgb(val) {
      function h2d(v) {
        return (Math.max(0, Math.min(parseInt(v, 16), 255)));
      }
      return h2d(val.substr(1, 2)) + ',' + h2d(val.substr(3, 2)) + ',' + h2d(val.substr(5, 2));
    }

    function pick(i) {
      var p = self.cl.concat(gauge.defaultColors),
        k = p.length - 1,
        t = i;
      if (t > k) {
        t = (i % k) - 1;
      }
      return p[t];
    }

    function face(a, z, v, q) {
      var r, g, b, x, y, l = 1 - v;

      function h2d(h) {
        return (Math.max(0, Math.min(parseInt(h, 16), 255)));
      }

      function d2h(v) {
        v = Math.round(Math.min(Math.max(0, v), 255));
        return ("0123456789ABCDEF".charAt((v - v % 16) / 16) + "0123456789ABCDEF".charAt(v % 16));
      }
      x = h2d(a.substr(1, 2));
      y = h2d(z.substr(1, 2));
      r = Math.max(0, Math.min(255, parseInt((x * l) + (y * v), 10)));
      x = h2d(a.substr(3, 2));
      y = h2d(z.substr(3, 2));
      g = Math.max(0, Math.min(255, parseInt((x * l) + (y * v), 10)));
      x = h2d(a.substr(5, 2));
      y = h2d(z.substr(5, 2));
      b = Math.max(0, Math.min(255, parseInt((x * l) + (y * v), 10)));
      if (!q) {
        return ('#' + d2h(r) + d2h(g) + d2h(b));
      } else {
        return (r + ',' + g + ',' + b);
      }
    }

    function fill(x, y, w, h) {
      self.ctx.fillRect(x + self.left, y + self.top, w, h);
    }

    self.lineTo = function( x, y ) {
      this.ctx.lineTo( x + self.left, y + self.top);
    };

    self.moveTo = function( x, y ) {
      this.ctx.moveTo( x + this.left, y + this.top);
    };

    self.quadraticCurveTo = function( cx, cy, x, y ) {
      this.ctx.quadraticCurveTo( cx + this.left, cy + this.top, x + this.left, y + this.top);
    };

    self.createLinearGradient = function( x1, y1, x2, y2 ) {
      return this.ctx.createLinearGradient( x1 + this.left, y1 + this.top, x2 + this.left, y2 + this.top);
    };

    function configure(self, options) {
      var vo, width, height, defopts = {
        "width": gauge.defaultWidth,
        "height": gauge.defaultHeight,
        "name": gauge.defaultName,
        "limit": gauge.defaultLimit,
        "vertical": gauge.defaultVertical,
        "noscale": gauge.defaultNoscale,
        "gradient": gauge.defaultGradient,
        "scale": gauge.defaultScale,
        "reflex": gauge.defaultReflex,
        "opacity": gauge.defaultOpacity,
        "empty": gauge.defaultEmpty,
        "radius": gauge.defaultRadius,
        "colors": gauge.defaultColors,
        "values": gauge.defaultValues
      };
      if (options) {
        for (var i in defopts) {
          if (!options[i]) {
            options[i] = defopts[i];
          }
        }
      } else {
        options = defopts;
      }
      vo = (typeof options.vertical === 'boolean' ? options.vertical : self.options.vertical);
      width = Math.max((typeof options.width === 'number' ? options.width : gauge.defaultWidth), (vo ? 8 : 48));
      height = Math.max((typeof options.height === 'number' ? options.height : gauge.defaultHeight), (vo ? 48 : 12));
      if (!vo && width < (height * 3)) {
        width = (height * 3);
      }
      if (vo && height < (width * 3)) {
        height = (width * 3);
      }

      self.options = options;
      self.height = height;
      self.width = width;
      self.top = options.top;
      self.left = options.left;

      self.cc = (typeof options.empty === 'string' ? options.empty : self.options.empty);
      self.cc = self.cc.match(/^#[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]$/i) ? self.cc : gauge.defaultEmpty;
      self.options.empty = self.cc;
      self.dc = hex2rgb(self.cc);
      self.ty = Math.min(Math.max((typeof options.reflex === 'number' ? options.reflex : self.options.reflex), 0.001), 1.0);
      self.options.reflex = self.ty;
      self.op = Math.min(Math.max((typeof options.opacity === 'number' ? options.opacity : self.options.opacity), 0.001), 1.0);
      self.options.opacity = self.op;
      self.cr = Math.min(Math.max((typeof options.radius === 'number' ? options.radius : self.options.radius), 0.001), 1.0);
      self.options.radius = self.cr;
      self.cl = (typeof options.colors === 'object' ? options.colors : self.options.colors);
      self.options.colors = self.cl;
      self.vl = (typeof options.values === 'object' ? options.values : self.options.values);
      self.options.values = self.vl;
      self.gr = (typeof options.gradient === 'boolean' ? options.gradient : self.options.gradient);
      self.options.gradient = self.gr;
      self.lv = (typeof options.limit === 'boolean' ? options.limit : self.options.limit);
      self.options.limit = self.lv;
      self.ns = (typeof options.noscale === 'boolean' ? options.noscale : self.options.noscale);
      self.options.noscale = self.ns;
      self.vo = (self.width < self.height ? 1 : 0);

      if (options.scale !== null) {
        self.sn = Math.min(Math.max((typeof options.scale === 'number' ? options.scale : self.options.scale), 2), parseInt((v ? h : w) / 8, 10));
        self.options.scale = self.sn;
      }
      if (self.sn !== null) {
        b = parseInt((v ? h : w) / self.sn, 10);
        k = Math.round((v ? h : w) / b) - 1;
      }
      q = parseInt(r * self.cr, 10);
      if (self.timer) {
        window.clearInterval(self.timer);
      }

    }

    function paint(self) {

      g = self.createLinearGradient(0, 0, (v ? w : 0), (v ? 0 : h));
      g.addColorStop(0, 'rgba(255,255,255,0.75)');
      g.addColorStop(0.05, 'rgba(255,255,255,0.5)');
      g.addColorStop(0.5, 'rgba(127,127,127,0.4)');
      g.addColorStop(0.95, 'rgba(0,0,0,0.55)');
      g.addColorStop(1, 'rgba(0,0,0,' + (v ? 0.66 : 0.8) + ')');
      self.ctx.lineWidth = 0.25;
      self.ctx.lineCap = 'butt';
      self.ctx.save();
      self.ctx.beginPath();
      self.moveTo(0, h - q);
      self.quadraticCurveTo(0, h, q, h);
      self.quadraticCurveTo(0, h, 0, h + q);
      self.lineTo(0, h + r);
      self.lineTo(w, h + r);
      self.lineTo(w, h + q);
      self.quadraticCurveTo(w, h, w - q, h);
      self.quadraticCurveTo(w, h, w, h - q);
      self.lineTo(w, q);
      self.quadraticCurveTo(w, 0, w - q, 0);
      self.lineTo(q, 0);
      self.quadraticCurveTo(0, 0, 0, q);
      self.ctx.closePath();
      self.ctx.clip();

      if (self.vl) {
        l = self.vl.length - (self.lv && self.vl.length >= 2 ? 1 : 0);
        for (i = 0; i < l; i += 1) {
          m += Math.abs(self.vl[i]);
        }
        m = Math.max(m, Math.abs(self.vl[self.vl.length - 1]));
        if (self.lv && self.gr && l === 1) {
          s = (v ? h : w) * (Math.abs(self.vl[0]) / m);
          a = pick(0);
          z = pick(1);
          c = self.createLinearGradient(0, 0, (v ? 0 : w), (v ? h : 0));
          c.addColorStop((v ? 1 : 0), 'rgba(' + hex2rgb(a) + ',1)');
          c.addColorStop((v ? 0 : 1), 'rgba(' + hex2rgb(z) + ',1)');
          x = x + e;
          y = h - s;
          e = s;
          self.ctx.fillStyle = c;
          if (v) {
            fill(0, y, w, s);
          } else {
            fill(x, 0, s, self.height);
          }
        }
        else {
          if (v) {
            y = h;
            for (i = 0; i < l; i += 1) {
              c = pick(i);
              s = h * (Math.abs(self.vl[i]) / m);
              y = y - s;
              e = s;
              self.ctx.fillStyle = c;
              fill(0, y, w, s);
            }
          } else {
            for (i = 0; i < l; i += 1) {
              c = pick(i);
              s = w * (Math.abs(self.vl[i]) / m);
              x = x + e;
              e = s;
              self.ctx.fillStyle = c;
              fill(x, 0, s, self.height);
            }
          }
        }
        if ((v && y > 0.25) || (!v && (x + s) < w)) {
          x = x + e;
          s = w - x;
          self.ctx.fillStyle = "rgba(" + self.dc + "," + self.op + ")";
          if (v) {
            fill(0, 0, w, y);
          } else {
            fill(x, 0, s, self.height);
          }
        }
        if (v) {
          self.ctx.fillStyle = "rgba(" + (self.lv && Math.abs(self.vl[0]) <= 0 ? self.dc : hex2rgb(pick(0))) + "," + self.op + ")";
          fill(0, h, w, w);
        }
      } else {
        self.ctx.fillStyle = "rgba(" + self.dc + "," + self.op + ")";
        fill(0, 0, self.width, self.height);
      }
      self.ctx.fillStyle = g;
      fill(0, 0, w, h);
      if (!self.ns) {
        g = self.createLinearGradient((v ? 0.5 : 0), (v ? 0 : 0.5), (v ? w : 0), (v ? 0 : h));
        g.addColorStop(0, "rgba(254,254,254,1)");
        g.addColorStop(0.66, "rgba(254,254,254,0.8)");
        g.addColorStop(1, "rgba(254,254,254,0)");
        if (v) {
          for (i = 0; i < k; i += 1) {
            self.ctx.beginPath();
            self.moveTo(0.5, h - (b + (i * b) + 0.5));
            self.lineTo(w, h - (b + (i * b) + 0.5));
            self.ctx.strokeStyle = 'rgba(0,0,0,0.75)';
            self.ctx.stroke();
            self.ctx.beginPath();
            self.moveTo(0.5, h - (b + (i * b)));
            self.lineTo(w, h - (b + (i * b)));
            self.ctx.strokeStyle = g;
            self.ctx.stroke();
          }
        }
        else {
          for (i = 0; i < k; i += 1) {
            self.ctx.beginPath();
            self.moveTo(b + (i * b), 0.5);
            self.lineTo(b + (i * b), h + r);
            self.ctx.strokeStyle = 'rgba(0,0,0,0.75)';
            self.ctx.stroke();
            self.ctx.beginPath();
            self.moveTo(b + (i * b) + 0.5, 0.5);
            self.lineTo(b + (i * b) + 0.5, h);
            self.ctx.strokeStyle = g;
            self.ctx.stroke();
          }
        }
      }

      g1 = self.createLinearGradient(0, h, 0, h + r);
      g1.addColorStop(0, "rgba(255,255,255,0.5)");
      g1.addColorStop(1, "rgba(255,255,255,1)");
      self.ctx.fillStyle = g1;
      fill(0, h, w, h + r);
      self.ctx.globalCompositeOperation = "destination-out";
      g = self.createLinearGradient(0, h, 0, h + r);
      g.addColorStop(0, "rgba(0,0,0,1)");
      g.addColorStop(0.1, "rgba(0,0,0,0.5)");
      g.addColorStop(0.5, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      self.ctx.fillStyle = g;
      fill(0, h, w, h + r);
      self.ctx.restore();
    }

    configure(self, options);
    paint(self);
  }
};