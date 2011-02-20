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

  tools.progressBar.canvas = uki.newClass(uki.view.Canvas, new function () {
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

    draw('canvas_container');
  };

  function draw(container) {

    var canvas_id = gauge.add(document.getElementById(container), {
     width: 300,
     height: 99,
     radius: 0.5,
     values: [43.15, 35, 9.65, 12.2],
     colors: ['#316DC8', '#DF7510', '#64A8E5', '#00aa00']
   });

    var canvas = document.getElementById(canvas_id);
    var ctx = canvas.ctx;

    document.font_feature = check_textRenderContext(ctx);
    set_textRenderContext(ctx);

    ctx.strokeText('240%,', 10, 60, 32, 150, 150, 100);
    ctx.strokeText('hey', 175, 60, 24, 50, 100, 100);

  }


})();