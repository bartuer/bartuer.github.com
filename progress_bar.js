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
          rect: '0 0 3200 600',
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
              name: 'monthview',
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

  function make_gauge(canvas, option) {


    var default_option = {
      colors: ['#316DC8', '#DF7510', '#64A8E5', '#00aa00'],
      radius: 0.5,
      scale: 6
    };

    gauge.modify(canvas, uki.extend({}, default_option, option));
  }

  function draw_month(canvas) {
    var green_line = 'rgba(90, 182, 90, 1)';
    var blue_line = 'rgba(131, 169, 204, 1)';
    var green_dot = 'rgba(90, 182, 90, 0.6)';
    var blue_dot = 'rgba(131, 169, 204, 0.6)';
    var ctx = canvas.width(316).height(250).ctx();
    var w = canvas.width();
    var h = canvas.height();

    document.font_feature = check_textRenderContext(ctx);
    set_textRenderContext(ctx);

    function draw_dot(ctx, x, y, c) {
      ctx.save();
      ctx.shadowOffsetX = -2;
      ctx.shadowOffsetY = -2;
      ctx.shadowBlur = 3;
      ctx.shadowColor = 'black';
      ctx.lineWidth = 2;
      ctx.strokeStyle = c;
      ctx.beginPath();
      ctx.arc(x, y, 5, Math.PI * 0.75, -Math.PI * 0.25, true);
      ctx.stroke();

      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.shadowColor = 'black';
      ctx.shadowBlur = 2;
      ctx.strokeStyle = c;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2, true);
      ctx.stroke();
      ctx.restore();

    }

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    ctx.shadowBlur = 6;
    ctx.shadowColor = 'black';

    ctx.strokeStyle = green_line;
    ctx.lineWidth = 7;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'bevel';

    ctx.beginPath();
    ctx.moveTo(20, 200);
    ctx.lineTo(30, 160);
    ctx.lineTo(50, 160);
    ctx.lineTo(70, 140);
    ctx.lineTo(120, 100);
    ctx.lineTo(150, 110);
    ctx.lineTo(160, 130);
    ctx.lineTo(200, 170);
    ctx.stroke();
    ctx.closePath();

    draw_dot(ctx, 20, 200, green_dot);
    draw_dot(ctx, 30, 160, green_dot);
    draw_dot(ctx, 50, 160, green_dot);
    draw_dot(ctx, 70, 140, green_dot);
    draw_dot(ctx, 120, 100, green_dot);
    draw_dot(ctx, 150, 110, green_dot);
    draw_dot(ctx, 160, 130, green_dot);
    draw_dot(ctx, 200, 170, green_dot);
    ctx.restore();

    ctx.save();
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    ctx.shadowBlur = 6;
    ctx.shadowColor = 'black';

    ctx.strokeStyle = blue_line;
    ctx.lineWidth = 7;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'bevel';

    ctx.beginPath();
    ctx.moveTo(20 + 20, 200);
    ctx.lineTo(30 + 20, 160);
    ctx.lineTo(40 + 20, 160);
    ctx.lineTo(80 + 20, 140);
    ctx.lineTo(120 + 20, 100);
    ctx.lineTo(150 + 20, 110);
    ctx.stroke();
    ctx.closePath();

    draw_dot(ctx, 20 + 20, 200, blue_dot);
    draw_dot(ctx, 30 + 20, 160, blue_dot);
    draw_dot(ctx, 40 + 20, 160, blue_dot);
    draw_dot(ctx, 80 + 20, 140, blue_dot);
    draw_dot(ctx, 120 + 20, 100, blue_dot);
    draw_dot(ctx, 150 + 20, 110, blue_dot);

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 0;
    ctx.strokeText('20%', 200, 40, 32, 200, 100, 90);

    var months = ['March', 'Apr', 'May', 'June'];
    ctx.strokeStyle = 'black';
    for (var i = 0; i < 4; i += 1) {
      ctx.strokeText(months[i], 20 + 80 * i, 220, 12, 150, 100, 90);
    }

    ctx.restore();

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

    make_gauge({
      ctx: ctx
    }, {
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
      make_gauge({
        ctx: ctx
      }, {
        left: 25 + 40 * i,
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
      ctx.strokeText(d[i], 25 + 40 * i, 220, 12, 150, 100, 90);
    }
  }

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
    var weekcanvas = uki({
      view: 'tools.progressBar.canvas',
      rect: '0 0 315 250',
      background: 'black',
      anchors: 'top left right bottom',
      name: 'weekview',
      style: {
        border: 'dashed 2px #999'
      }
    });
    uki('HFlow').append(weekcanvas);

    for (var j = 0; j < 7; j += 1) {
      uki('HFlow').append(uki({
        view: 'tools.progressBar.canvas',
        rect: '0 0 315 250',
        background: 'black',
        anchors: 'top left right bottom',
        name: 'dayview',
        style: {
          border: 'dashed 2px #999'
        }
      }));
    }

    for (var day_canvas = progressBar.find('[name=dayview]'), i = 0; i < day_canvas.length; i += 1) {
      draw_day(day_canvas[i]);
    }
    var canvas_1 = progressBar.find('[name=weekview]')[0];
    draw_week(canvas_1);
    var canvas_2 = progressBar.find('[name=monthview]')[0];
    draw_month(canvas_2);
  };


})();