var tools = {};

(function () {
  include('frameworks/uki/src/uki-theamless.js');
  include('frameworks/uki/src/uki-theme/airport.js');
  include('frameworks/uki/src/uki-data/ajax.js');
  include('frameworks/uki/src/uki-data/model.js');
  include('frameworks/uki/src/uki-view/view/canvas.js');
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
          rect: '280 10 100 22',
          anchors: 'top right',
          text: 'Day',
          name: 'Day'
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
    var canvas = p.find('Canvas')[0];
    var ctx = canvas.width(800).height(600).ctx();
    var w = canvas.width();
    var h = canvas.height();
    ctx.fillStyle = 'grey';
    ctx.fillRect(0, 0, w, h);

    return p;
  };

})();