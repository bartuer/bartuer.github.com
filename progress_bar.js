var tools = {};

(function () {
  include('frameworks/uki/src/uki-theamless.js');
  include('frameworks/uki/src/uki-theme/airport.js');
  include('frameworks/uki/src/uki-data/ajax.js');
  include('frameworks/uki/src/uki-data/model.js');
  include('frameworks/uki/src/uki-view/view/canvas.js');
  include('dev.js');
  include('lib.scroll.js');
  include('strokeText.js');
  include('gauge.js');
  tools.progressBar = {};

  tools.progressBar.canvas = uki.newClass(uki.view.Canvas, new

  function () {
    var Base = uki.view.Canvas.prototype;
    this._createDom = function () {
      Base._createDom.call(this);
      this._dom.style.cssText += ';text-align:center;line-height:20px;white-space:no-wrap;font-size:12px;color:#333;-moz-border-radius:3px;-webkit-border-radius:3px;';
      this._dom.style.border = '1px dashed #999';
    };
  });

  tools.progressBar.build = function () {
    var p = uki({
      view: 'Box',
      rect: '0 0 400 400',
      anchors: 'top left right bottom',
      background: 'white',
      childViews: [{
        view: 'Box',
        rect: '0 0 400 50',
        anchors: 'top left right',
        background: 'theme(panel)',
        childViews: [{
          view: 'Box',
          rect: '10 0 330 46',
          anchors: 'left rigth top',
          childViews: []
        },
        {
          view: 'Button',
          rect: '90 10 80 30',
          anchors: 'top right',
          text: 'Month',
          name: 'month'
        },
        {
          view: 'Button',
          rect: '200 10 80 30',
          anchors: 'top right',
          text: 'Week',
          name: 'week'
        },
        {
          view: 'Button',
          rect: '310 10 80 30',
          anchors: 'top right',
          text: 'Day',
          name: 'day'
        }]
      },
      {
        view: 'ScrollPane',
        rect: '0 51 400 347',
        anchors: 'left top right bottom',
        scrollV: true,
        scrollH: true,
        childViews: [{
          view: 'Box',
          id: 'canvas_container',
          rect: '0 0 800 600',
          anchors: 'left top right bottom',
          childViews: [{
            view: 'tools.progressBar.canvas',
            rect: '0 0 800 600',
            background: 'black',
            anchors: 'top left right bottom',
            style: {
              border: 'dashed 2px #999'
            }

          }]

        }]
      }]
    });


    return p;
  };

  window.onload = function () {
    var progressBar = tools.progressBar.build();
    maindiv = document.getElementById('main');
    progressBar.attachTo(window, '400 400');

    document.canvas_scroller = new Scroller('canvas_container', {
      scrollY: true,
      scrollX: true,
      height: 200,
      width: 200
    });

    var canvas = progressBar.find('Canvas')[0];
    draw(canvas);
    draw(canvas);
  };

  var img_cache = {};

  function make_gauge(option) {

    var width = option.width;
    var height = option.height;
    var values = option.values;
    var values_str = '';
    for (var i = 0; i < values.length; i += 1) {
      values_str += values[i].toString(10);
    }
    var key = width.toString(16) + height.toString(16) + values_str;
    if (img_cache[key] === undefined) {

      var gauge_container = document.createElement('div');
      gauge_container.id = 'gauge_container';
      var mount_point = document.getElementById('canvas_container');
      mount_point.appendChild(gauge_container);

      var canvas_id = gauge.add(gauge_container, {
        scale: 6,
        width: option.width,
        height: option.height,
        radius: 0.5,
        values: option.values,
        colors: ['#316DC8', '#DF7510', '#64A8E5', '#00aa00']
      });

      var gcanvas = document.getElementById(canvas_id);

      var img = uki.createElement('img');
      img.src = gcanvas.toDataURL();
      img_cache[key] = img;
    }
    return img_cache[key];
  }

  function draw(canvas) {
    var ctx = canvas.width(400).height(300).ctx();
    var w = canvas.width();
    var h = canvas.height();
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, w, h);

    document.font_feature = check_textRenderContext(ctx);
    set_textRenderContext(ctx);

    ctx.strokeText('80%', 50, 80, 32, 200, 100, 90);
    ctx.strokeText('2011-02-20 Sun', 185, 90, 14, 100, 100, 90);

    ctx.drawImage(make_gauge({
      width: 300,
      height: 99,
      values: [43.15, 35, 9.65, 12.2]
    }), 50, 150);
  }


})();