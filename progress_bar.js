var tools = {};

(function () {
  include('frameworks/uki/src/uki-theamless.js');
  include('frameworks/uki/src/uki-theme/airport.js');
  include('frameworks/uki/src/uki-data/ajax.js');
  include('frameworks/uki/src/uki-data/model.js');
  include('frameworks/uki/src/uki-view/view/canvas.js');
  include('frameworks/uki/src/uki-view/view/flow.js');
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
            view: 'HFlow',
            rect: '0 0 0 300',
            anchors: 'left top',
            background: '#CCC',
            className: 'flow',
            childViews: [{
              view: 'tools.progressBar.canvas',
              rect: '0 0 315 250',
              background: 'black',
              anchors: 'top left right bottom',
              name: 'day',
              style: {
                border: 'dashed 2px #999'
              }
            },
            {
              view: 'tools.progressBar.canvas',
              rect: '0 0 315 250',
              background: 'black',
              anchors: 'top left right bottom',
              name: 'week',
              style: {
                border: 'dashed 2px #999'
              }
            }]
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

    var canvas_0 = progressBar.find('Canvas')[0];
    draw_day(canvas_0);
    var canvas_1 = progressBar.find('Canvas')[1];
    draw_week(canvas_1);
  };

   function make_gauge(canvas, option) {

      var default_option = {
        colors: ['#316DC8', '#DF7510', '#64A8E5', '#00aa00'],
        radius: 0.5,
        scale: 6
      };

      gauge.modify(canvas, uki.extend({}, default_option, option));
  }

  function draw_day(canvas) {
    var ctx = canvas.width(316).height(250).ctx();
    var w = canvas.width();
    var h = canvas.height();

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, w, h);

    document.font_feature = check_textRenderContext(ctx);
    set_textRenderContext(ctx);

    ctx.strokeText('80%', 35, 40 + 150, 32, 200, 100, 90);
    ctx.strokeText('2011-02-20 Sun', 135, 58 + 150, 14, 100, 100, 90);

    make_gauge({ctx: ctx},{
      top: 70,
      left: 8,
      width: 300,
      height: 99,
      values: [43.15, 35, 9.65, 12.2]
    });
  }

  function draw_week(canvas) {
    var ctx = canvas.width(316).height(250).ctx();
    var w = canvas.width();
    var h = canvas.height();
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, w, h);
    var a = [0.7, 0.65, 0.37, 0.48, 0.84, 0.75, 0.92];
    var d = ['Sun', 'Mon', 'Tue', 'Wen', 'Thu', 'Fri', 'Sat'];

    document.font_feature = check_textRenderContext(ctx);
    set_textRenderContext(ctx);

    for (var i = 0; i < 7; i += 1) {
      make_gauge({ctx:ctx}, {
        left: 25+ 40*i,
        top: 20,
        scale: 4,
        vertical: true,
        limit: true,
        gradient: true,
        width: 29,
        height: 200,
        values: [a[i], 1],
        colors: ['#316DC8', '#9E42EE']
      });
      ctx.strokeText(d[i], 25 + 40 * i , 220, 12, 150, 100, 90);
    }
  }

})();