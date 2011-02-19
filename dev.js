/*  Prototype JavaScript framework, version 1.6.0.3
 *  (c) 2005-2008 Sam Stephenson
 *
 *  Prototype is freely distributable under the terms of an MIT-style license.
 *  For details, see the Prototype web site: http://www.prototypejs.org/
 *
 *--------------------------------------------------------------------------*/
(function () {

  var Prototype = {
    Version: '1.6.0.3',

    Browser: {
      IE: !! (window.attachEvent && navigator.userAgent.indexOf('Opera') === -1),
      Opera: navigator.userAgent.indexOf('Opera') > -1,
      WebKit: navigator.userAgent.indexOf('AppleWebKit/') > -1,
      Gecko: navigator.userAgent.indexOf('Gecko') > -1 && navigator.userAgent.indexOf('KHTML') === -1,
      MobileSafari: !! navigator.userAgent.match(/AppleWebKit.*Mobile/)
    },

    BrowserFeatures: {
      SelectorsAPI: !! document.querySelector,
      ElementExtensions: !! window.HTMLElement,
      SpecificElementExtensions: document.createElement('div')['__proto__'] && document.createElement('div')['__proto__'] !== document.createElement('form')['__proto__']
    },

    ScriptFragment: '<script[^>]*>([\\S\\s]*?)<\/script>',
    JSONFilter: /^\/\*-secure-([\s\S]*)\*\/\s*$/,

    emptyFunction: function () {},
    K: function (x) {
      return x
    }
  };

  if (Prototype.Browser.MobileSafari) Prototype.BrowserFeatures.SpecificElementExtensions = false;


  /* Based on Alex Arnell's inheritance implementation. */
  var Class = {
    create: function () {
      var parent = null,
        properties = $A(arguments);
      if (Object.isFunction(properties[0])) parent = properties.shift();

      function klass() {
        this.initialize.apply(this, arguments);
      }

      Object.extend(klass, Class.Methods);
      klass.superclass = parent;
      klass.subclasses = [];

      if (parent) {
        var subclass = function () {};
        subclass.prototype = parent.prototype;
        klass.prototype = new subclass;
        parent.subclasses.push(klass);
      }

      for (var i = 0; i < properties.length; i++)
      klass.addMethods(properties[i]);

      if (!klass.prototype.initialize) klass.prototype.initialize = Prototype.emptyFunction;

      klass.prototype.constructor = klass;

      return klass;
    }
  };

  Class.Methods = {
    addMethods: function (source) {
      var ancestor = this.superclass && this.superclass.prototype;
      var properties = Object.keys(source);

      if (!Object.keys({
        toString: true
      }).length) properties.push("toString", "valueOf");

      for (var i = 0, length = properties.length; i < length; i++) {
        var property = properties[i],
          value = source[property];
        if (ancestor && Object.isFunction(value) && value.argumentNames().first() == "$super") {
          var method = value;
          value = (function (m) {
            return function () {
              return ancestor[m].apply(this, arguments)
            };
          })(property).wrap(method);

          value.valueOf = method.valueOf.bind(method);
          value.toString = method.toString.bind(method);
        }
        this.prototype[property] = value;
      }

      return this;
    }
  };

  var Abstract = {};

  Object.extend = function (destination, source) {
    for (var property in source)
    destination[property] = source[property];
    return destination;
  };

  Object.extend(Object, {
    inspect: function (object) {
      try {
        if (Object.isUndefined(object)) return 'undefined';
        if (object === null) return 'null';
        return object.inspect ? object.inspect() : String(object);
      } catch (e) {
        if (e instanceof RangeError) return '...';
        throw e;
      }
    },

    toJSON: function (object) {
      var type = typeof object;
      switch (type) {
      case 'undefined':
      case 'function':
      case 'unknown':
        return;
      case 'boolean':
        return object.toString();
      }

      if (object === null) return 'null';
      if (object.toJSON) return object.toJSON();
      if (Object.isElement(object)) return;

      var results = [];
      for (var property in object) {
        var value = Object.toJSON(object[property]);
        if (!Object.isUndefined(value)) results.push(property.toJSON() + ': ' + value);
      }

      return '{' + results.join(', ') + '}';
    },

    toQueryString: function (object) {
      return $H(object).toQueryString();
    },

    toHTML: function (object) {
      return object && object.toHTML ? object.toHTML() : String.interpret(object);
    },

    keys: function (object) {
      var keys = [];
      for (var property in object)
      keys.push(property);
      return keys;
    },

    values: function (object) {
      var values = [];
      for (var property in object)
      values.push(object[property]);
      return values;
    },

    clone: function (object) {
      return Object.extend({}, object);
    },

    isElement: function (object) {
      return !!(object && object.nodeType == 1);
    },

    isArray: function (object) {
      return object != null && typeof object == "object" && 'splice' in object && 'join' in object;
    },

    isHash: function (object) {
      return object instanceof Hash;
    },

    isFunction: function (object) {
      return typeof object == "function";
    },

    isString: function (object) {
      return typeof object == "string";
    },

    isNumber: function (object) {
      return typeof object == "number";
    },

    isUndefined: function (object) {
      return typeof object == "undefined";
    }
  });

  Object.extend(Function.prototype, {
    argumentNames: function () {
      var names = this.toString().match(/^[\s\(]*function[^(]*\(([^\)]*)\)/)[1].replace(/\s+/g, '').split(',');
      return names.length == 1 && !names[0] ? [] : names;
    },

    bind: function () {
      if (arguments.length < 2 && Object.isUndefined(arguments[0])) return this;
      var __method = this,
        args = $A(arguments),
        object = args.shift();
      return function () {
        return __method.apply(object, args.concat($A(arguments)));
      }
    },

    bindAsEventListener: function () {
      var __method = this,
        args = $A(arguments),
        object = args.shift();
      return function (event) {
        return __method.apply(object, [event || window.event].concat(args));
      }
    },

    curry: function () {
      if (!arguments.length) return this;
      var __method = this,
        args = $A(arguments);
      return function () {
        return __method.apply(this, args.concat($A(arguments)));
      }
    },

    delay: function () {
      var __method = this,
        args = $A(arguments),
        timeout = args.shift() * 1000;
      return window.setTimeout(function () {
        return __method.apply(__method, args);
      }, timeout);
    },

    defer: function () {
      var args = [0.01].concat($A(arguments));
      return this.delay.apply(this, args);
    },

    wrap: function (wrapper) {
      var __method = this;
      return function () {
        return wrapper.apply(this, [__method.bind(this)].concat($A(arguments)));
      }
    },

    methodize: function () {
      if (this._methodized) return this._methodized;
      var __method = this;
      return this._methodized = function () {
        return __method.apply(null, [this].concat($A(arguments)));
      };
    }
  });

  Date.prototype.toJSON = function () {
    return '"' + this.getUTCFullYear() + '-' + (this.getUTCMonth() + 1).toPaddedString(2) + '-' + this.getUTCDate().toPaddedString(2) + 'T' + this.getUTCHours().toPaddedString(2) + ':' + this.getUTCMinutes().toPaddedString(2) + ':' + this.getUTCSeconds().toPaddedString(2) + 'Z"';
  };

  var Try = {
    these: function () {
      var returnValue;

      for (var i = 0, length = arguments.length; i < length; i++) {
        var lambda = arguments[i];
        try {
          returnValue = lambda();
          break;
        } catch (e) {}
      }

      return returnValue;
    }
  };

  RegExp.prototype.match = RegExp.prototype.test;

  RegExp.escape = function (str) {
    return String(str).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
  };

  /*--------------------------------------------------------------------------*/

  var PeriodicalExecuter = Class.create({
    initialize: function (callback, frequency) {
      this.callback = callback;
      this.frequency = frequency;
      this.currentlyExecuting = false;

      this.registerCallback();
    },

    registerCallback: function () {
      this.timer = setInterval(this.onTimerEvent.bind(this), this.frequency * 1000);
    },

    execute: function () {
      this.callback(this);
    },

    stop: function () {
      if (!this.timer) return;
      clearInterval(this.timer);
      this.timer = null;
    },

    onTimerEvent: function () {
      if (!this.currentlyExecuting) {
        try {
          this.currentlyExecuting = true;
          this.execute();
        } finally {
          this.currentlyExecuting = false;
        }
      }
    }
  });
  Object.extend(String, {
    interpret: function (value) {
      return value == null ? '' : String(value);
    },
    specialChar: {
      '\b': '\\b',
      '\t': '\\t',
      '\n': '\\n',
      '\f': '\\f',
      '\r': '\\r',
      '\\': '\\\\'
    }
  });

  Object.extend(String.prototype, {
    gsub: function (pattern, replacement) {
      var result = '',
        source = this,
        match;
      replacement = arguments.callee.prepareReplacement(replacement);

      while (source.length > 0) {
        if (match = source.match(pattern)) {
          result += source.slice(0, match.index);
          result += String.interpret(replacement(match));
          source = source.slice(match.index + match[0].length);
        } else {
          result += source,
          source = '';
        }
      }
      return result;
    },

    sub: function (pattern, replacement, count) {
      replacement = this.gsub.prepareReplacement(replacement);
      count = Object.isUndefined(count) ? 1 : count;

      return this.gsub(pattern, function (match) {
        if (--count < 0) return match[0];
        return replacement(match);
      });
    },

    scan: function (pattern, iterator) {
      this.gsub(pattern, iterator);
      return String(this);
    },

    truncate: function (length, truncation) {
      length = length || 30;
      truncation = Object.isUndefined(truncation) ? '...' : truncation;
      return this.length > length ? this.slice(0, length - truncation.length) + truncation : String(this);
    },

    strip: function () {
      return this.replace(/^\s+/, '').replace(/\s+$/, '');
    },

    stripTags: function () {
      return this.replace(/<\/?[^>]+>/gi, '');
    },

    stripScripts: function () {
      return this.replace(new RegExp(Prototype.ScriptFragment, 'img'), '');
    },

    extractScripts: function () {
      var matchAll = new RegExp(Prototype.ScriptFragment, 'img');
      var matchOne = new RegExp(Prototype.ScriptFragment, 'im');
      return (this.match(matchAll) || []).map(function (scriptTag) {
        return (scriptTag.match(matchOne) || ['', ''])[1];
      });
    },

    evalScripts: function () {
      return this.extractScripts().map(function (script) {
        return eval(script)
      });
    },

    escapeHTML: function () {
      var self = arguments.callee;
      self.text.data = this;
      return self.div.innerHTML;
    },

    unescapeHTML: function () {
      var div = new Element('div');
      div.innerHTML = this.stripTags();
      return div.childNodes[0] ? (div.childNodes.length > 1 ? $A(div.childNodes).inject('', function (memo, node) {
        return memo + node.nodeValue
      }) : div.childNodes[0].nodeValue) : '';
    },

    toQueryParams: function (separator) {
      var match = this.strip().match(/([^?#]*)(#.*)?$/);
      if (!match) return {};

      return match[1].split(separator || '&').inject({}, function (hash, pair) {
        if ((pair = pair.split('='))[0]) {
          var key = decodeURIComponent(pair.shift());
          var value = pair.length > 1 ? pair.join('=') : pair[0];
          if (value != undefined) value = decodeURIComponent(value);

          if (key in hash) {
            if (!Object.isArray(hash[key])) hash[key] = [hash[key]];
            hash[key].push(value);
          }
          else hash[key] = value;
        }
        return hash;
      });
    },

    toArray: function () {
      return this.split('');
    },

    succ: function () {
      return this.slice(0, this.length - 1) + String.fromCharCode(this.charCodeAt(this.length - 1) + 1);
    },

    times: function (count) {
      return count < 1 ? '' : new Array(count + 1).join(this);
    },

    camelize: function () {
      var parts = this.split('-'),
        len = parts.length;
      if (len == 1) return parts[0];

      var camelized = this.charAt(0) == '-' ? parts[0].charAt(0).toUpperCase() + parts[0].substring(1) : parts[0];

      for (var i = 1; i < len; i++)
      camelized += parts[i].charAt(0).toUpperCase() + parts[i].substring(1);

      return camelized;
    },

    capitalize: function () {
      return this.charAt(0).toUpperCase() + this.substring(1).toLowerCase();
    },

    underscore: function () {
      return this.gsub(/::/, '/').gsub(/([A-Z]+)([A-Z][a-z])/, '#{1}_#{2}').gsub(/([a-z\d])([A-Z])/, '#{1}_#{2}').gsub(/-/, '_').toLowerCase();
    },

    dasherize: function () {
      return this.gsub(/_/, '-');
    },

    inspect: function (useDoubleQuotes) {
      var escapedString = this.gsub(/[\x00-\x1f\\]/, function (match) {
        var character = String.specialChar[match[0]];
        return character ? character : '\\u00' + match[0].charCodeAt().toPaddedString(2, 16);
      });
      if (useDoubleQuotes) return '"' + escapedString.replace(/"/g, '\\"') + '"';
      return "'" + escapedString.replace(/'/g, '\\\'') + "'";
    },

    toJSON: function () {
      return this.inspect(true);
    },

    unfilterJSON: function (filter) {
      return this.sub(filter || Prototype.JSONFilter, '#{1}');
    },

    isJSON: function () {
      var str = this;
      if (str.blank()) return false;
      str = this.replace(/\\./g, '@').replace(/"[^"\\\n\r]*"/g, '');
      return (/^[,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]*$/).test(str);
    },

    evalJSON: function (sanitize) {
      var json = this.unfilterJSON();
      try {
        if (!sanitize || json.isJSON()) return eval('(' + json + ')');
      } catch (e) {}
      throw new SyntaxError('Badly formed JSON string: ' + this.inspect());
    },

    include: function (pattern) {
      return this.indexOf(pattern) > -1;
    },

    startsWith: function (pattern) {
      return this.indexOf(pattern) === 0;
    },

    endsWith: function (pattern) {
      var d = this.length - pattern.length;
      return d >= 0 && this.lastIndexOf(pattern) === d;
    },

    empty: function () {
      return this == '';
    },

    blank: function () {
      return /^\s*$/.test(this);
    },

    interpolate: function (object, pattern) {
      return new Template(this, pattern).evaluate(object);
    }
  });

  if (Prototype.Browser.WebKit || Prototype.Browser.IE) Object.extend(String.prototype, {
    escapeHTML: function () {
      return this.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },
    unescapeHTML: function () {
      return this.stripTags().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    }
  });

  String.prototype.gsub.prepareReplacement = function (replacement) {
    if (Object.isFunction(replacement)) return replacement;
    var template = new Template(replacement);
    return function (match) {
      return template.evaluate(match)
    };
  };

  String.prototype.parseQuery = String.prototype.toQueryParams;

  Object.extend(String.prototype.escapeHTML, {
    div: document.createElement('div'),
    text: document.createTextNode('')
  });

  String.prototype.escapeHTML.div.appendChild(String.prototype.escapeHTML.text);

  var Template = Class.create({
    initialize: function (template, pattern) {
      this.template = template.toString();
      this.pattern = pattern || Template.Pattern;
    },

    evaluate: function (object) {
      if (Object.isFunction(object.toTemplateReplacements)) object = object.toTemplateReplacements();

      return this.template.gsub(this.pattern, function (match) {
        if (object == null) return '';

        var before = match[1] || '';
        if (before == '\\') return match[2];

        var ctx = object,
          expr = match[3];
        var pattern = /^([^.[]+|\[((?:.*?[^\\])?)\])(\.|\[|$)/;
        match = pattern.exec(expr);
        if (match == null) return before;

        while (match != null) {
          var comp = match[1].startsWith('[') ? match[2].gsub('\\\\]', ']') : match[1];
          ctx = ctx[comp];
          if (null == ctx || '' == match[3]) break;
          expr = expr.substring('[' == match[3] ? match[1].length : match[0].length);
          match = pattern.exec(expr);
        }

        return before + String.interpret(ctx);
      });
    }
  });
  Template.Pattern = /(^|.|\r|\n)(#\{(.*?)\})/;

  var $break = {};

  var Enumerable = {
    each: function (iterator, context) {
      var index = 0;
      try {
        this._each(function (value) {
          iterator.call(context, value, index++);
        });
      } catch (e) {
        if (e != $break) throw e;
      }
      return this;
    },

    eachSlice: function (number, iterator, context) {
      var index = -number,
        slices = [],
        array = this.toArray();
      if (number < 1) return array;
      while ((index += number) < array.length)
      slices.push(array.slice(index, index + number));
      return slices.collect(iterator, context);
    },

    all: function (iterator, context) {
      iterator = iterator || Prototype.K;
      var result = true;
      this.each(function (value, index) {
        result = result && !! iterator.call(context, value, index);
        if (!result) throw $break;
      });
      return result;
    },

    any: function (iterator, context) {
      iterator = iterator || Prototype.K;
      var result = false;
      this.each(function (value, index) {
        if (result = !! iterator.call(context, value, index)) throw $break;
      });
      return result;
    },

    collect: function (iterator, context) {
      iterator = iterator || Prototype.K;
      var results = [];
      this.each(function (value, index) {
        results.push(iterator.call(context, value, index));
      });
      return results;
    },

    detect: function (iterator, context) {
      var result;
      this.each(function (value, index) {
        if (iterator.call(context, value, index)) {
          result = value;
          throw $break;
        }
      });
      return result;
    },

    findAll: function (iterator, context) {
      var results = [];
      this.each(function (value, index) {
        if (iterator.call(context, value, index)) results.push(value);
      });
      return results;
    },

    grep: function (filter, iterator, context) {
      iterator = iterator || Prototype.K;
      var results = [];

      if (Object.isString(filter)) filter = new RegExp(filter);

      this.each(function (value, index) {
        if (filter.match(value)) results.push(iterator.call(context, value, index));
      });
      return results;
    },

    include: function (object) {
      if (Object.isFunction(this.indexOf)) if (this.indexOf(object) != -1) return true;

      var found = false;
      this.each(function (value) {
        if (value == object) {
          found = true;
          throw $break;
        }
      });
      return found;
    },

    inGroupsOf: function (number, fillWith) {
      fillWith = Object.isUndefined(fillWith) ? null : fillWith;
      return this.eachSlice(number, function (slice) {
        while (slice.length < number) slice.push(fillWith);
        return slice;
      });
    },

    inject: function (memo, iterator, context) {
      this.each(function (value, index) {
        memo = iterator.call(context, memo, value, index);
      });
      return memo;
    },

    invoke: function (method) {
      var args = $A(arguments).slice(1);
      return this.map(function (value) {
        return value[method].apply(value, args);
      });
    },

    max: function (iterator, context) {
      iterator = iterator || Prototype.K;
      var result;
      this.each(function (value, index) {
        value = iterator.call(context, value, index);
        if (result == null || value >= result) result = value;
      });
      return result;
    },

    min: function (iterator, context) {
      iterator = iterator || Prototype.K;
      var result;
      this.each(function (value, index) {
        value = iterator.call(context, value, index);
        if (result == null || value < result) result = value;
      });
      return result;
    },

    partition: function (iterator, context) {
      iterator = iterator || Prototype.K;
      var trues = [],
        falses = [];
      this.each(function (value, index) {
        (iterator.call(context, value, index) ? trues : falses).push(value);
      });
      return [trues, falses];
    },

    pluck: function (property) {
      var results = [];
      this.each(function (value) {
        results.push(value[property]);
      });
      return results;
    },

    reject: function (iterator, context) {
      var results = [];
      this.each(function (value, index) {
        if (!iterator.call(context, value, index)) results.push(value);
      });
      return results;
    },

    sortBy: function (iterator, context) {
      return this.map(function (value, index) {
        return {
          value: value,
          criteria: iterator.call(context, value, index)
        };
      }).sort(function (left, right) {
        var a = left.criteria,
          b = right.criteria;
        return a < b ? -1 : a > b ? 1 : 0;
      }).pluck('value');
    },

    toArray: function () {
      return this.map();
    },

    zip: function () {
      var iterator = Prototype.K,
        args = $A(arguments);
      if (Object.isFunction(args.last())) iterator = args.pop();

      var collections = [this].concat(args).map($A);
      return this.map(function (value, index) {
        return iterator(collections.pluck(index));
      });
    },

    size: function () {
      return this.toArray().length;
    },

    inspect: function () {
      return '#<Enumerable:' + this.toArray().inspect() + '>';
    }
  };

  Object.extend(Enumerable, {
    map: Enumerable.collect,
    find: Enumerable.detect,
    select: Enumerable.findAll,
    filter: Enumerable.findAll,
    member: Enumerable.include,
    entries: Enumerable.toArray,
    every: Enumerable.all,
    some: Enumerable.any
  });

  function $A(iterable) {
    if (!iterable) return [];
    if (iterable.toArray) return iterable.toArray();
    var length = iterable.length || 0,
      results = new Array(length);
    while (length--) results[length] = iterable[length];
    return results;
  }

  if (Prototype.Browser.WebKit) {
    $A = function (iterable) {
      if (!iterable) return [];
      // In Safari, only use the `toArray` method if it's not a NodeList.
      // A NodeList is a function, has an function `item` property, and a numeric
      // `length` property. Adapted from Google Doctype.
      if (!(typeof iterable === 'function' && typeof iterable.length === 'number' && typeof iterable.item === 'function') && iterable.toArray) return iterable.toArray();
      var length = iterable.length || 0,
        results = new Array(length);
      while (length--) results[length] = iterable[length];
      return results;
    };
  }

  Array.from = $A;

  Object.extend(Array.prototype, Enumerable);

  if (!Array.prototype._reverse) Array.prototype._reverse = Array.prototype.reverse;

  Object.extend(Array.prototype, {
    _each: function (iterator) {
      for (var i = 0, length = this.length; i < length; i++)
      iterator(this[i]);
    },

    clear: function () {
      this.length = 0;
      return this;
    },

    first: function () {
      return this[0];
    },

    last: function () {
      return this[this.length - 1];
    },

    compact: function () {
      return this.select(function (value) {
        return value != null;
      });
    },

    flatten: function () {
      return this.inject([], function (array, value) {
        return array.concat(Object.isArray(value) ? value.flatten() : [value]);
      });
    },

    without: function () {
      var values = $A(arguments);
      return this.select(function (value) {
        return !values.include(value);
      });
    },

    reverse: function (inline) {
      return (inline !== false ? this : this.toArray())._reverse();
    },

    reduce: function () {
      return this.length > 1 ? this : this[0];
    },

    uniq: function (sorted) {
      return this.inject([], function (array, value, index) {
        if (0 == index || (sorted ? array.last() != value : !array.include(value))) array.push(value);
        return array;
      });
    },

    intersect: function (array) {
      return this.uniq().findAll(function (item) {
        return array.detect(function (value) {
          return item === value
        });
      });
    },

    clone: function () {
      return [].concat(this);
    },

    size: function () {
      return this.length;
    },

    inspect: function () {
      return '[' + this.map(Object.inspect).join(', ') + ']';
    },

    toJSON: function () {
      var results = [];
      this.each(function (object) {
        var value = Object.toJSON(object);
        if (!Object.isUndefined(value)) results.push(value);
      });
      return '[' + results.join(', ') + ']';
    }
  });

  // use native browser JS 1.6 implementation if available
  if (Object.isFunction(Array.prototype.forEach)) Array.prototype._each = Array.prototype.forEach;

  if (!Array.prototype.indexOf) Array.prototype.indexOf = function (item, i) {
    i || (i = 0);
    var length = this.length;
    if (i < 0) i = length + i;
    for (; i < length; i++)
    if (this[i] === item) return i;
    return -1;
  };

  if (!Array.prototype.lastIndexOf) Array.prototype.lastIndexOf = function (item, i) {
    i = isNaN(i) ? this.length : (i < 0 ? this.length + i : i) + 1;
    var n = this.slice(0, i).reverse().indexOf(item);
    return (n < 0) ? n : i - n - 1;
  };

  Array.prototype.toArray = Array.prototype.clone;

  function $w(string) {
    if (!Object.isString(string)) return [];
    string = string.strip();
    return string ? string.split(/\s+/) : [];
  }

  if (Prototype.Browser.Opera) {
    Array.prototype.concat = function () {
      var array = [];
      for (var i = 0, length = this.length; i < length; i++) array.push(this[i]);
      for (var i = 0, length = arguments.length; i < length; i++) {
        if (Object.isArray(arguments[i])) {
          for (var j = 0, arrayLength = arguments[i].length; j < arrayLength; j++)
          array.push(arguments[i][j]);
        } else {
          array.push(arguments[i]);
        }
      }
      return array;
    };
  }
  Object.extend(Number.prototype, {
    toColorPart: function () {
      return this.toPaddedString(2, 16);
    },

    succ: function () {
      return this + 1;
    },

    times: function (iterator, context) {
      $R(0, this, true).each(iterator, context);
      return this;
    },

    toPaddedString: function (length, radix) {
      var string = this.toString(radix || 10);
      return '0'.times(length - string.length) + string;
    },

    toJSON: function () {
      return isFinite(this) ? this.toString() : 'null';
    }
  });

  $w('abs round ceil floor').each(function (method) {
    Number.prototype[method] = Math[method].methodize();
  });

  function $H(object) {
    return new Hash(object);
  };

  var Hash = Class.create(Enumerable, (function () {

    function toQueryPair(key, value) {
      if (Object.isUndefined(value)) return key;
      return key + '=' + encodeURIComponent(String.interpret(value));
    }

    return {
      initialize: function (object) {
        this._object = Object.isHash(object) ? object.toObject() : Object.clone(object);
        for (var key in this._object) {
          if (this._object.hasOwnProperty(key)) {
            this[key] = this._object[key];
          }
        }
      },

      _each: function (iterator) {
        for (var key in this._object) {
          var value = this._object[key],
            pair = [key, value];
          pair.key = key;
          pair.value = value;
          iterator(pair);
        }
      },

      set: function (key, value) {
        return this._object[key] = value;
      },

      get: function (key) {
        // simulating poorly supported hasOwnProperty
        if (this._object[key] !== Object.prototype[key]) return this._object[key];
      },

      unset: function (key) {
        var value = this._object[key];
        delete this._object[key];
        return value;
      },

      toObject: function () {
        return Object.clone(this._object);
      },

      keys: function () {
        return this.pluck('key');
      },

      values: function () {
        return this.pluck('value');
      },

      index: function (value) {
        var match = this.detect(function (pair) {
          return pair.value === value;
        });
        return match && match.key;
      },

      merge: function (object) {
        return this.clone().update(object);
      },

      update: function (object) {
        return new Hash(object).inject(this, function (result, pair) {
          result.set(pair.key, pair.value);
          return result;
        });
      },

      toQueryString: function () {
        return this.inject([], function (results, pair) {
          var key = encodeURIComponent(pair.key),
            values = pair.value;

          if (values && typeof values == 'object') {
            if (Object.isArray(values)) return results.concat(values.map(toQueryPair.curry(key)));
          } else results.push(toQueryPair(key, values));
          return results;
        }).join('&');
      },

      inspect: function () {
        return '#<Hash:{' + this.map(function (pair) {
          return pair.map(Object.inspect).join(': ');
        }).join(', ') + '}>';
      },

      toJSON: function () {
        return Object.toJSON(this.toObject());
      },

      clone: function () {
        return new Hash(this);
      }
    }
  })());

  Hash.prototype.toTemplateReplacements = Hash.prototype.toObject;
  Hash.from = $H;
  var ObjectRange = Class.create(Enumerable, {
    initialize: function (start, end, exclusive) {
      this.start = start;
      this.end = end;
      this.exclusive = exclusive;
    },

    _each: function (iterator) {
      var value = this.start;
      while (this.include(value)) {
        iterator(value);
        value = value.succ();
      }
    },

    include: function (value) {
      if (value < this.start) return false;
      if (this.exclusive) return value < this.end;
      return value <= this.end;
    }
  });

  var $R = function (start, end, exclusive) {
    return new ObjectRange(start, end, exclusive);
  };

  var Ajax = {
    getTransport: function () {
      return Try.these(

      function () {
        return new XMLHttpRequest()
      }, function () {
        return new ActiveXObject('Msxml2.XMLHTTP')
      }, function () {
        return new ActiveXObject('Microsoft.XMLHTTP')
      }) || false;
    },

    activeRequestCount: 0
  };

  Ajax.Responders = {
    responders: [],

    _each: function (iterator) {
      this.responders._each(iterator);
    },

    register: function (responder) {
      if (!this.include(responder)) this.responders.push(responder);
    },

    unregister: function (responder) {
      this.responders = this.responders.without(responder);
    },

    dispatch: function (callback, request, transport, json) {
      this.each(function (responder) {
        if (Object.isFunction(responder[callback])) {
          try {
            responder[callback].apply(responder, [request, transport, json]);
          } catch (e) {}
        }
      });
    }
  };

  Object.extend(Ajax.Responders, Enumerable);

  Ajax.Responders.register({
    onCreate: function () {
      Ajax.activeRequestCount++
    },
    onComplete: function () {
      Ajax.activeRequestCount--
    }
  });

  Ajax.Base = Class.create({
    initialize: function (options) {
      this.options = {
        method: 'post',
        asynchronous: true,
        contentType: 'application/x-www-form-urlencoded',
        encoding: 'UTF-8',
        parameters: '',
        evalJSON: true,
        evalJS: true
      };
      Object.extend(this.options, options || {});

      this.options.method = this.options.method.toLowerCase();

      if (Object.isString(this.options.parameters)) this.options.parameters = this.options.parameters.toQueryParams();
      else if (Object.isHash(this.options.parameters)) this.options.parameters = this.options.parameters.toObject();
    }
  });

  Ajax.Request = Class.create(Ajax.Base, {
    _complete: false,

    initialize: function ($super, url, options) {
      $super(options);
      this.transport = Ajax.getTransport();
      this.request(url);
    },

    asyn: function () {
      return this.options.asynchronous;
    },

    request: function (url) {
      this.url = url;
      this.method = this.options.method;
      var params = Object.clone(this.options.parameters);

      if (!['get', 'post'].include(this.method)) {
        // simulate other verbs over post
        params['_method'] = this.method;
        this.method = 'post';
      }

      this.parameters = params;

      if (params = Object.toQueryString(params)) {
        // when GET, append parameters to URL
        if (this.method == 'get') this.url += (this.url.include('?') ? '&' : '?') + params;
        else if (/Konqueror|Safari|KHTML/.test(navigator.userAgent)) params += '&_=';
      }

      try {
        var response = new Ajax.Response(this);
        if (this.options.onCreate) this.options.onCreate(response);
        Ajax.Responders.dispatch('onCreate', this, response);

        this.transport.open(this.method.toUpperCase(), this.url, this.asyn());

        if (this.asyn()) this.respondToReadyState.bind(this).defer(1);

        this.transport.onreadystatechange = this.onStateChange.bind(this);
        this.setRequestHeaders();

        this.body = this.method == 'post' ? (this.options.postBody || params) : null;
        this.transport.send(this.body);

        /* Force Firefox to handle ready state 4 for synchronous requests */
        if (!this.asyn() && this.transport.overrideMimeType) this.onStateChange();

      }
      catch (e) {
        this.dispatchException(e);
      }
    },

    onStateChange: function () {
      var readyState = this.transport.readyState;
      if (readyState > 1 && !((readyState == 4) && this._complete)) this.respondToReadyState(this.transport.readyState);
    },

    setRequestHeaders: function () {
      var headers = {
        'X-Requested-With': 'XMLHttpRequest',
        'X-Prototype-Version': Prototype.Version,
        'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
      };

      if (this.method == 'post') {
        headers['Content-type'] = this.options.contentType + (this.options.encoding ? '; charset=' + this.options.encoding : '');

        /* Force "Connection: close" for older Mozilla browsers to work
         * around a bug where XMLHttpRequest sends an incorrect
         * Content-length header. See Mozilla Bugzilla #246651.
         */
        if (this.transport.overrideMimeType && (navigator.userAgent.match(/Gecko\/(\d{4})/) || [0, 2005])[1] < 2005) headers['Connection'] = 'close';
      }

      // user-defined headers
      if (typeof this.options.requestHeaders == 'object') {
        var extras = this.options.requestHeaders;

        if (Object.isFunction(extras.push)) for (var i = 0, length = extras.length; i < length; i += 2) headers[extras[i]] = extras[i + 1];
        else $H(extras).each(function (pair) {
          headers[pair.key] = pair.value
        });
      }

      for (var name in headers)
      this.transport.setRequestHeader(name, headers[name]);
    },

    success: function () {
      var status = this.getStatus();
      return !status || (status >= 200 && status < 300);
    },

    getStatus: function () {
      try {
        return this.transport.status || 0;
      } catch (e) {
        return 0
      }
    },

    respondToReadyState: function (readyState) {
      var state = Ajax.Request.Events[readyState],
        response = new Ajax.Response(this);

      if (state == 'Complete') {
        try {
          this._complete = true;
          (this.options['on' + response.status] || this.options['on' + (this.success() ? 'Success' : 'Failure')] || Prototype.emptyFunction)(response, response.headerJSON);
        } catch (e) {
          this.dispatchException(e);
        }

        var contentType = response.getHeader('Content-type');
        if (this.options.evalJS == 'force' || (this.options.evalJS && this.isSameOrigin() && contentType && contentType.match(/^\s*(text|application)\/(x-)?(java|ecma)script(;.*)?\s*$/i))) this.evalResponse();
      }

      try {
        (this.options['on' + state] || Prototype.emptyFunction)(response, response.headerJSON);
        Ajax.Responders.dispatch('on' + state, this, response, response.headerJSON);
      } catch (e) {
        this.dispatchException(e);
      }

      if (state == 'Complete') {
        // avoid memory leak in MSIE: clean up
        this.transport.onreadystatechange = Prototype.emptyFunction;
      }
    },

    isSameOrigin: function () {
      var m = this.url.match(/^\s*https?:\/\/[^\/]*/);
      return !m || (m[0] == '#{protocol}//#{domain}#{port}'.interpolate({
        protocol: location.protocol,
        domain: document.domain,
        port: location.port ? ':' + location.port : ''
      }));
    },

    getHeader: function (name) {
      try {
        return this.transport.getResponseHeader(name) || null;
      } catch (e) {
        return null
      }
    },

    evalResponse: function () {
      try {
        return eval((this.transport.responseText || '').unfilterJSON());
      } catch (e) {
        this.dispatchException(e);
      }
    },

    dispatchException: function (exception) {
      (this.options.onException || Prototype.emptyFunction)(this, exception);
      Ajax.Responders.dispatch('onException', this, exception);
    }
  });

  Ajax.Request.Events = ['Uninitialized', 'Loading', 'Loaded', 'Interactive', 'Complete'];

  Ajax.Response = Class.create({
    initialize: function (request) {
      this.request = request;
      var transport = this.transport = request.transport,
        readyState = this.readyState = transport.readyState;

      if ((readyState > 2 && !Prototype.Browser.IE) || readyState == 4) {
        this.status = this.getStatus();
        this.statusText = this.getStatusText();
        this.responseText = String.interpret(transport.responseText);
        this.headerJSON = this._getHeaderJSON();
      }

      if (readyState == 4) {
        var xml = transport.responseXML;
        this.responseXML = Object.isUndefined(xml) ? null : xml;
        this.responseJSON = this._getResponseJSON();
      }
    },

    status: 0,
    statusText: '',

    getStatus: Ajax.Request.prototype.getStatus,

    getStatusText: function () {
      try {
        return this.transport.statusText || '';
      } catch (e) {
        return ''
      }
    },

    getHeader: Ajax.Request.prototype.getHeader,

    getAllHeaders: function () {
      try {
        return this.getAllResponseHeaders();
      } catch (e) {
        return null
      }
    },

    getResponseHeader: function (name) {
      return this.transport.getResponseHeader(name);
    },

    getAllResponseHeaders: function () {
      return this.transport.getAllResponseHeaders();
    },

    _getHeaderJSON: function () {
      var json = this.getHeader('X-JSON');
      if (!json) return null;
      json = decodeURIComponent(escape(json));
      try {
        return json.evalJSON(this.request.options.sanitizeJSON || !this.request.isSameOrigin());
      } catch (e) {
        this.request.dispatchException(e);
      }
    },

    _getResponseJSON: function () {
      var options = this.request.options;
      if (!options.evalJSON || (options.evalJSON != 'force' && !(this.getHeader('Content-type') || '').include('application/json')) || this.responseText.blank()) return null;
      try {
        return this.responseText.evalJSON(options.sanitizeJSON || !this.request.isSameOrigin());
      } catch (e) {
        this.request.dispatchException(e);
      }
    }
  });

  Ajax.Updater = Class.create(Ajax.Request, {
    initialize: function ($super, container, url, options) {
      this.container = {
        success: (container.success || container),
        failure: (container.failure || (container.success ? null : container))
      };

      options = Object.clone(options);
      var onComplete = options.onComplete;
      options.onComplete = (function (response, json) {
        this.updateContent(response.responseText);
        if (Object.isFunction(onComplete)) onComplete(response, json);
      }).bind(this);

      $super(url, options);
    },

    updateContent: function (responseText) {
      var receiver = this.container[this.success() ? 'success' : 'failure'],
        options = this.options;

      if (!options.evalScripts) responseText = responseText.stripScripts();

      if (receiver = $(receiver)) {
        if (options.insertion) {
          if (Object.isString(options.insertion)) {
            var insertion = {};
            insertion[options.insertion] = responseText;
            receiver.insert(insertion);
          }
          else options.insertion(receiver, responseText);
        }
        else receiver.update(responseText);
      }
    }
  });

  Ajax.PeriodicalUpdater = Class.create(Ajax.Base, {
    initialize: function ($super, container, url, options) {
      $super(options);
      this.onComplete = this.options.onComplete;

      this.frequency = (this.options.frequency || 2);
      this.decay = (this.options.decay || 1);

      this.updater = {};
      this.container = container;
      this.url = url;

      this.start();
    },

    start: function () {
      this.options.onComplete = this.updateComplete.bind(this);
      this.onTimerEvent();
    },

    stop: function () {
      this.updater.options.onComplete = undefined;
      clearTimeout(this.timer);
      (this.onComplete || Prototype.emptyFunction).apply(this, arguments);
    },

    updateComplete: function (response) {
      if (this.options.decay) {
        this.decay = (response.responseText == this.lastText ? this.decay * this.options.decay : 1);

        this.lastText = response.responseText;
      }
      this.timer = this.onTimerEvent.bind(this).delay(this.decay * this.frequency);
    },

    onTimerEvent: function () {
      this.updater = new Ajax.Updater(this.container, this.url, this.options);
    }
  });

  function $(element) {
    if (arguments.length > 1) {
      for (var i = 0, elements = [], length = arguments.length; i < length; i++)
      elements.push($(arguments[i]));
      return elements;
    }
    if (Object.isString(element)) element = document.getElementById(element);
    return Element.extend(element);
  }

  /*--------------------------------------------------------------------------*/

  // if (!window.Node)
  var Node = {};

  if (!Node.ELEMENT_NODE) {
    // DOM level 2 ECMAScript Language Binding
    Object.extend(Node, {
      ELEMENT_NODE: 1,
      ATTRIBUTE_NODE: 2,
      TEXT_NODE: 3,
      CDATA_SECTION_NODE: 4,
      ENTITY_REFERENCE_NODE: 5,
      ENTITY_NODE: 6,
      PROCESSING_INSTRUCTION_NODE: 7,
      COMMENT_NODE: 8,
      DOCUMENT_NODE: 9,
      DOCUMENT_TYPE_NODE: 10,
      DOCUMENT_FRAGMENT_NODE: 11,
      NOTATION_NODE: 12
    });
  }

  (function () {
    var element = this.Element;
    this.Element = function (tagName, attributes) {
      attributes = attributes || {};
      tagName = tagName.toLowerCase();
      var cache = Element.cache;
      if (Prototype.Browser.IE && attributes.name) {
        tagName = '<' + tagName + ' name="' + attributes.name + '">';
        delete attributes.name;
        return Element.writeAttribute(document.createElement(tagName), attributes);
      }
      if (!cache[tagName]) cache[tagName] = Element.extend(document.createElement(tagName));
      return Element.writeAttribute(cache[tagName].cloneNode(false), attributes);
    };
    Object.extend(this.Element, element || {});
    if (element) this.Element.prototype = element.prototype;
  }).call(window);

  Element.cache = {};

  Element.Methods = {
    visible: function (element) {
      return $(element).style.display != 'none';
    },

    toggle: function (element) {
      element = $(element);
      Element[Element.visible(element) ? 'hide' : 'show'](element);
      return element;
    },

    hide: function (element) {
      element = $(element);
      element.style.display = 'none';
      return element;
    },

    show: function (element) {
      element = $(element);
      element.style.display = '';
      return element;
    },

    remove: function (element) {
      element = $(element);
      element.parentNode.removeChild(element);
      return element;
    },

    update: function (element, content) {
      element = $(element);
      if (content && content.toElement) content = content.toElement();
      if (Object.isElement(content)) return element.update().insert(content);
      content = Object.toHTML(content);
      element.innerHTML = content.stripScripts();
      content.evalScripts.bind(content).defer();
      return element;
    },

    replace: function (element, content) {
      element = $(element);
      if (content && content.toElement) content = content.toElement();
      else if (!Object.isElement(content)) {
        content = Object.toHTML(content);
        var range = element.ownerDocument.createRange();
        range.selectNode(element);
        content.evalScripts.bind(content).defer();
        content = range.createContextualFragment(content.stripScripts());
      }
      element.parentNode.replaceChild(content, element);
      return element;
    },

    insert: function (element, insertions) {
      element = $(element);

      if (Object.isString(insertions) || Object.isNumber(insertions) || Object.isElement(insertions) || (insertions && (insertions.toElement || insertions.toHTML))) insertions = {
        bottom: insertions
      };

      var content, insert, tagName, childNodes;

      for (var position in insertions) {
        content = insertions[position];
        position = position.toLowerCase();
        insert = Element._insertionTranslations[position];

        if (content && content.toElement) content = content.toElement();
        if (Object.isElement(content)) {
          insert(element, content);
          continue;
        }

        content = Object.toHTML(content);

        tagName = ((position == 'before' || position == 'after') ? element.parentNode : element).tagName.toUpperCase();

        childNodes = Element._getContentFromAnonymousElement(tagName, content.stripScripts());

        if (position == 'top' || position == 'after') childNodes.reverse();
        childNodes.each(insert.curry(element));

        content.evalScripts.bind(content).defer();
      }

      return element;
    },

    wrap: function (element, wrapper, attributes) {
      element = $(element);
      if (Object.isElement(wrapper)) $(wrapper).writeAttribute(attributes || {});
      else if (Object.isString(wrapper)) wrapper = new Element(wrapper, attributes);
      else wrapper = new Element('div', wrapper);
      if (element.parentNode) element.parentNode.replaceChild(wrapper, element);
      wrapper.appendChild(element);
      return wrapper;
    },

    inspect: function (element) {
      element = $(element);
      var result = '<' + element.tagName.toLowerCase();
      $H({
        'id': 'id',
        'className': 'class'
      }).each(function (pair) {
        var property = pair.first(),
          attribute = pair.last();
        var value = (element[property] || '').toString();
        if (value) result += ' ' + attribute + '=' + value.inspect(true);
      });
      return result + '>';
    },

    recursivelyCollect: function (element, property) {
      element = $(element);
      var elements = [];
      while (element = element[property])
      if (element.nodeType == 1) elements.push(Element.extend(element));
      return elements;
    },

    ancestors: function (element) {
      return $(element).recursivelyCollect('parentNode');
    },

    descendants: function (element) {
      return $(element).select("*");
    },

    firstDescendant: function (element) {
      element = $(element).firstChild;
      while (element && element.nodeType != 1) element = element.nextSibling;
      return $(element);
    },

    immediateDescendants: function (element) {
      if (!(element = $(element).firstChild)) return [];
      while (element && element.nodeType != 1) element = element.nextSibling;
      if (element) return [element].concat($(element).nextSiblings());
      return [];
    },

    previousSiblings: function (element) {
      return $(element).recursivelyCollect('previousSibling');
    },

    nextSiblings: function (element) {
      return $(element).recursivelyCollect('nextSibling');
    },

    siblings: function (element) {
      element = $(element);
      return element.previousSiblings().reverse().concat(element.nextSiblings());
    },

    match: function (element, selector) {
      if (Object.isString(selector)) selector = new Selector(selector);
      return selector.match($(element));
    },

    up: function (element, expression, index) {
      element = $(element);
      if (arguments.length == 1) return $(element.parentNode);
      var ancestors = element.ancestors();
      return Object.isNumber(expression) ? ancestors[expression] : Selector.findElement(ancestors, expression, index);
    },

    down: function (element, expression, index) {
      element = $(element);
      if (arguments.length == 1) return element.firstDescendant();
      return Object.isNumber(expression) ? element.descendants()[expression] : Element.select(element, expression)[index || 0];
    },

    previous: function (element, expression, index) {
      element = $(element);
      if (arguments.length == 1) return $(Selector.handlers.previousElementSibling(element));
      var previousSiblings = element.previousSiblings();
      return Object.isNumber(expression) ? previousSiblings[expression] : Selector.findElement(previousSiblings, expression, index);
    },

    next: function (element, expression, index) {
      element = $(element);
      if (arguments.length == 1) return $(Selector.handlers.nextElementSibling(element));
      var nextSiblings = element.nextSiblings();
      return Object.isNumber(expression) ? nextSiblings[expression] : Selector.findElement(nextSiblings, expression, index);
    },

    select: function () {
      var args = $A(arguments),
        element = $(args.shift());
      return Selector.findChildElements(element, args);
    },

    adjacent: function () {
      var args = $A(arguments),
        element = $(args.shift());
      return Selector.findChildElements(element.parentNode, args).without(element);
    },

    identify: function (element) {
      element = $(element);
      var id = element.readAttribute('id'),
        self = arguments.callee;
      if (id) return id;
      do {
        id = 'anonymous_element_' + self.counter++
      } while ($(id));
      element.writeAttribute('id', id);
      return id;
    },

    readAttribute: function (element, name) {
      element = $(element);
      if (Prototype.Browser.IE) {
        var t = Element._attributeTranslations.read;
        if (t.values[name]) return t.values[name](element, name);
        if (t.names[name]) name = t.names[name];
        if (name.include(':')) {
          return (!element.attributes || !element.attributes[name]) ? null : element.attributes[name].value;
        }
      }
      return element.getAttribute(name);
    },

    writeAttribute: function (element, name, value) {
      element = $(element);
      var attributes = {},
        t = Element._attributeTranslations.write;

      if (typeof name == 'object') attributes = name;
      else attributes[name] = Object.isUndefined(value) ? true : value;

      for (var attr in attributes) {
        name = t.names[attr] || attr;
        value = attributes[attr];
        if (t.values[attr]) name = t.values[attr](element, value);
        if (value === false || value === null) element.removeAttribute(name);
        else if (value === true) element.setAttribute(name, name);
        else element.setAttribute(name, value);
      }
      return element;
    },

    getHeight: function (element) {
      return $(element).getDimensions().height;
    },

    getWidth: function (element) {
      return $(element).getDimensions().width;
    },

    classNames: function (element) {
      return new Element.ClassNames(element);
    },

    hasClassName: function (element, className) {
      if (!(element = $(element))) return;
      var elementClassName = element.className;
      return (elementClassName.length > 0 && (elementClassName == className || new RegExp("(^|\\s)" + className + "(\\s|$)").test(elementClassName)));
    },

    addClassName: function (element, className) {
      if (!(element = $(element))) return;
      if (!element.hasClassName(className)) element.className += (element.className ? ' ' : '') + className;
      return element;
    },

    removeClassName: function (element, className) {
      if (!(element = $(element))) return;
      element.className = element.className.replace(
      new RegExp("(^|\\s+)" + className + "(\\s+|$)"), ' ').strip();
      return element;
    },

    toggleClassName: function (element, className) {
      if (!(element = $(element))) return;
      return element[element.hasClassName(className) ? 'removeClassName' : 'addClassName'](className);
    },

    // removes whitespace-only text node children
    cleanWhitespace: function (element) {
      element = $(element);
      var node = element.firstChild;
      while (node) {
        var nextNode = node.nextSibling;
        if (node.nodeType == 3 && !/\S/.test(node.nodeValue)) element.removeChild(node);
        node = nextNode;
      }
      return element;
    },

    empty: function (element) {
      return $(element).innerHTML.blank();
    },

    descendantOf: function (element, ancestor) {
      element = $(element),
      ancestor = $(ancestor);

      if (element.compareDocumentPosition) return (element.compareDocumentPosition(ancestor) & 8) === 8;

      if (ancestor.contains) return ancestor.contains(element) && ancestor !== element;

      while (element = element.parentNode)
      if (element == ancestor) return true;

      return false;
    },

    scrollTo: function (element) {
      element = $(element);
      var pos = element.cumulativeOffset();
      window.scrollTo(pos[0], pos[1]);
      return element;
    },

    getStyle: function (element, style) {
      element = $(element);
      style = style == 'float' ? 'cssFloat' : style.camelize();
      var value = element.style[style];
      if (!value || value == 'auto') {
        var css = document.defaultView.getComputedStyle(element, null);
        value = css ? css[style] : null;
      }
      if (style == 'opacity') return value ? parseFloat(value) : 1.0;
      return value == 'auto' ? null : value;
    },

    getOpacity: function (element) {
      return $(element).getStyle('opacity');
    },

    setStyle: function (element, styles) {
      element = $(element);
      var elementStyle = element.style,
        match;
      if (Object.isString(styles)) {
        element.style.cssText += ';' + styles;
        return styles.include('opacity') ? element.setOpacity(styles.match(/opacity:\s*(\d?\.?\d*)/)[1]) : element;
      }
      for (var property in styles)
      if (property == 'opacity') element.setOpacity(styles[property]);
      else elementStyle[(property == 'float' || property == 'cssFloat') ? (Object.isUndefined(elementStyle.styleFloat) ? 'cssFloat' : 'styleFloat') : property] = styles[property];

      return element;
    },

    setOpacity: function (element, value) {
      element = $(element);
      element.style.opacity = (value == 1 || value === '') ? '' : (value < 0.00001) ? 0 : value;
      return element;
    },

    getDimensions: function (element) {
      element = $(element);
      var display = element.getStyle('display');
      if (display != 'none' && display != null) // Safari bug
      return {
        width: element.offsetWidth,
        height: element.offsetHeight
      };

      // All *Width and *Height properties give 0 on elements with display none,
      // so enable the element temporarily
      var els = element.style;
      var originalVisibility = els.visibility;
      var originalPosition = els.position;
      var originalDisplay = els.display;
      els.visibility = 'hidden';
      els.position = 'absolute';
      els.display = 'block';
      var originalWidth = element.clientWidth;
      var originalHeight = element.clientHeight;
      els.display = originalDisplay;
      els.position = originalPosition;
      els.visibility = originalVisibility;
      return {
        width: originalWidth,
        height: originalHeight
      };
    },

    makePositioned: function (element) {
      element = $(element);
      var pos = Element.getStyle(element, 'position');
      if (pos == 'static' || !pos) {
        element._madePositioned = true;
        element.style.position = 'relative';
        // Opera returns the offset relative to the positioning context, when an
        // element is position relative but top and left have not been defined
        if (Prototype.Browser.Opera) {
          element.style.top = 0;
          element.style.left = 0;
        }
      }
      return element;
    },

    undoPositioned: function (element) {
      element = $(element);
      if (element._madePositioned) {
        element._madePositioned = undefined;
        element.style.position =
        element.style.top =
        element.style.left =
        element.style.bottom =
        element.style.right = '';
      }
      return element;
    },

    makeClipping: function (element) {
      element = $(element);
      if (element._overflow) return element;
      element._overflow = Element.getStyle(element, 'overflow') || 'auto';
      if (element._overflow !== 'hidden') element.style.overflow = 'hidden';
      return element;
    },

    undoClipping: function (element) {
      element = $(element);
      if (!element._overflow) return element;
      element.style.overflow = element._overflow == 'auto' ? '' : element._overflow;
      element._overflow = null;
      return element;
    },

    cumulativeOffset: function (element) {
      var valueT = 0,
        valueL = 0;
      do {
        valueT += element.offsetTop || 0;
        valueL += element.offsetLeft || 0;
        element = element.offsetParent;
      } while (element);
      return Element._returnOffset(valueL, valueT);
    },

    positionedOffset: function (element) {
      var valueT = 0,
        valueL = 0;
      do {
        valueT += element.offsetTop || 0;
        valueL += element.offsetLeft || 0;
        element = element.offsetParent;
        if (element) {
          if (element.tagName.toUpperCase() == 'BODY') break;
          var p = Element.getStyle(element, 'position');
          if (p !== 'static') break;
        }
      } while (element);
      return Element._returnOffset(valueL, valueT);
    },

    absolutize: function (element) {
      element = $(element);
      if (element.getStyle('position') == 'absolute') return element;
      // Position.prepare(); // To be done manually by Scripty when it needs it.
      var offsets = element.positionedOffset();
      var top = offsets[1];
      var left = offsets[0];
      var width = element.clientWidth;
      var height = element.clientHeight;

      element._originalLeft = left - parseFloat(element.style.left || 0);
      element._originalTop = top - parseFloat(element.style.top || 0);
      element._originalWidth = element.style.width;
      element._originalHeight = element.style.height;

      element.style.position = 'absolute';
      element.style.top = top + 'px';
      element.style.left = left + 'px';
      element.style.width = width + 'px';
      element.style.height = height + 'px';
      return element;
    },

    relativize: function (element) {
      element = $(element);
      if (element.getStyle('position') == 'relative') return element;
      // Position.prepare(); // To be done manually by Scripty when it needs it.
      element.style.position = 'relative';
      var top = parseFloat(element.style.top || 0) - (element._originalTop || 0);
      var left = parseFloat(element.style.left || 0) - (element._originalLeft || 0);

      element.style.top = top + 'px';
      element.style.left = left + 'px';
      element.style.height = element._originalHeight;
      element.style.width = element._originalWidth;
      return element;
    },

    cumulativeScrollOffset: function (element) {
      var valueT = 0,
        valueL = 0;
      do {
        valueT += element.scrollTop || 0;
        valueL += element.scrollLeft || 0;
        element = element.parentNode;
      } while (element);
      return Element._returnOffset(valueL, valueT);
    },

    getOffsetParent: function (element) {
      if (element.offsetParent) return $(element.offsetParent);
      if (element == document.body) return $(element);

      while ((element = element.parentNode) && element != document.body)
      if (Element.getStyle(element, 'position') != 'static') return $(element);

      return $(document.body);
    },

    viewportOffset: function (forElement) {
      var valueT = 0,
        valueL = 0;

      var element = forElement;
      do {
        valueT += element.offsetTop || 0;
        valueL += element.offsetLeft || 0;

        // Safari fix
        if (element.offsetParent == document.body && Element.getStyle(element, 'position') == 'absolute') break;

      } while (element = element.offsetParent);

      element = forElement;
      do {
        if (!Prototype.Browser.Opera || (element.tagName && (element.tagName.toUpperCase() == 'BODY'))) {
          valueT -= element.scrollTop || 0;
          valueL -= element.scrollLeft || 0;
        }
      } while (element = element.parentNode);

      return Element._returnOffset(valueL, valueT);
    },

    clonePosition: function (element, source) {
      var options = Object.extend({
        setLeft: true,
        setTop: true,
        setWidth: true,
        setHeight: true,
        offsetTop: 0,
        offsetLeft: 0
      }, arguments[2] || {});

      // find page position of source
      source = $(source);
      var p = source.viewportOffset();

      // find coordinate system to use
      element = $(element);
      var delta = [0, 0];
      var parent = null;
      // delta [0,0] will do fine with position: fixed elements,
      // position:absolute needs offsetParent deltas
      if (Element.getStyle(element, 'position') == 'absolute') {
        parent = element.getOffsetParent();
        delta = parent.viewportOffset();
      }

      // correct by body offsets (fixes Safari)
      if (parent == document.body) {
        delta[0] -= document.body.offsetLeft;
        delta[1] -= document.body.offsetTop;
      }

      // set position
      if (options.setLeft) element.style.left = (p[0] - delta[0] + options.offsetLeft) + 'px';
      if (options.setTop) element.style.top = (p[1] - delta[1] + options.offsetTop) + 'px';
      if (options.setWidth) element.style.width = source.offsetWidth + 'px';
      if (options.setHeight) element.style.height = source.offsetHeight + 'px';
      return element;
    }
  };

  Element.Methods.identify.counter = 1;

  Object.extend(Element.Methods, {
    getElementsBySelector: Element.Methods.select,
    childElements: Element.Methods.immediateDescendants
  });

  Element._attributeTranslations = {
    write: {
      names: {
        className: 'class',
        htmlFor: 'for'
      },
      values: {}
    }
  };

  if (Prototype.Browser.Opera) {
    Element.Methods.getStyle = Element.Methods.getStyle.wrap(

    function (proceed, element, style) {
      switch (style) {
      case 'left':
      case 'top':
      case 'right':
      case 'bottom':
        if (proceed(element, 'position') === 'static') return null;
      case 'height':
      case 'width':
        // returns '0px' for hidden elements; we want it to return null
        if (!Element.visible(element)) return null;

        // returns the border-box dimensions rather than the content-box
        // dimensions, so we subtract padding and borders from the value
        var dim = parseInt(proceed(element, style), 10);

        if (dim !== element['offset' + style.capitalize()]) return dim + 'px';

        var properties;
        if (style === 'height') {
          properties = ['border-top-width', 'padding-top', 'padding-bottom', 'border-bottom-width'];
        }
        else {
          properties = ['border-left-width', 'padding-left', 'padding-right', 'border-right-width'];
        }
        return properties.inject(dim, function (memo, property) {
          var val = proceed(element, property);
          return val === null ? memo : memo - parseInt(val, 10);
        }) + 'px';
      default:
        return proceed(element, style);
      }
    });

    Element.Methods.readAttribute = Element.Methods.readAttribute.wrap(

    function (proceed, element, attribute) {
      if (attribute === 'title') return element.title;
      return proceed(element, attribute);
    });
  }

  else if (Prototype.Browser.IE) {
    // IE doesn't report offsets correctly for static elements, so we change them
    // to "relative" to get the values, then change them back.
    Element.Methods.getOffsetParent = Element.Methods.getOffsetParent.wrap(

    function (proceed, element) {
      element = $(element);
      // IE throws an error if element is not in document
      try {
        element.offsetParent
      }
      catch (e) {
        return $(document.body)
      }
      var position = element.getStyle('position');
      if (position !== 'static') return proceed(element);
      element.setStyle({
        position: 'relative'
      });
      var value = proceed(element);
      element.setStyle({
        position: position
      });
      return value;
    });

    $w('positionedOffset viewportOffset').each(function (method) {
      Element.Methods[method] = Element.Methods[method].wrap(

      function (proceed, element) {
        element = $(element);
        try {
          element.offsetParent
        }
        catch (e) {
          return Element._returnOffset(0, 0)
        }
        var position = element.getStyle('position');
        if (position !== 'static') return proceed(element);
        // Trigger hasLayout on the offset parent so that IE6 reports
        // accurate offsetTop and offsetLeft values for position: fixed.
        var offsetParent = element.getOffsetParent();
        if (offsetParent && offsetParent.getStyle('position') === 'fixed') offsetParent.setStyle({
          zoom: 1
        });
        element.setStyle({
          position: 'relative'
        });
        var value = proceed(element);
        element.setStyle({
          position: position
        });
        return value;
      });
    });

    Element.Methods.cumulativeOffset = Element.Methods.cumulativeOffset.wrap(

    function (proceed, element) {
      try {
        element.offsetParent
      }
      catch (e) {
        return Element._returnOffset(0, 0)
      }
      return proceed(element);
    });

    Element.Methods.getStyle = function (element, style) {
      element = $(element);
      style = (style == 'float' || style == 'cssFloat') ? 'styleFloat' : style.camelize();
      var value = element.style[style];
      if (!value && element.currentStyle) value = element.currentStyle[style];

      if (style == 'opacity') {
        if (value = (element.getStyle('filter') || '').match(/alpha\(opacity=(.*)\)/)) if (value[1]) return parseFloat(value[1]) / 100;
        return 1.0;
      }

      if (value == 'auto') {
        if ((style == 'width' || style == 'height') && (element.getStyle('display') != 'none')) return element['offset' + style.capitalize()] + 'px';
        return null;
      }
      return value;
    };

    Element.Methods.setOpacity = function (element, value) {
      function stripAlpha(filter) {
        return filter.replace(/alpha\([^\)]*\)/gi, '');
      }
      element = $(element);
      var currentStyle = element.currentStyle;
      if ((currentStyle && !currentStyle.hasLayout) || (!currentStyle && element.style.zoom == 'normal')) element.style.zoom = 1;

      var filter = element.getStyle('filter'),
        style = element.style;
      if (value == 1 || value === '') {
        (filter = stripAlpha(filter)) ? style.filter = filter : style.removeAttribute('filter');
        return element;
      } else if (value < 0.00001) value = 0;
      style.filter = stripAlpha(filter) + 'alpha(opacity=' + (value * 100) + ')';
      return element;
    };

    Element._attributeTranslations = {
      read: {
        names: {
          'class': 'className',
          'for': 'htmlFor'
        },
        values: {
          _getAttr: function (element, attribute) {
            return element.getAttribute(attribute, 2);
          },
          _getAttrNode: function (element, attribute) {
            var node = element.getAttributeNode(attribute);
            return node ? node.value : "";
          },
          _getEv: function (element, attribute) {
            attribute = element.getAttribute(attribute);
            return attribute ? attribute.toString().slice(23, -2) : null;
          },
          _flag: function (element, attribute) {
            return $(element).hasAttribute(attribute) ? attribute : null;
          },
          style: function (element) {
            return element.style.cssText.toLowerCase();
          },
          title: function (element) {
            return element.title;
          }
        }
      }
    };

    Element._attributeTranslations.write = {
      names: Object.extend({
        cellpadding: 'cellPadding',
        cellspacing: 'cellSpacing'
      }, Element._attributeTranslations.read.names),
      values: {
        checked: function (element, value) {
          element.checked = !! value;
        },

        style: function (element, value) {
          element.style.cssText = value ? value : '';
        }
      }
    };

    Element._attributeTranslations.has = {};

    $w('colSpan rowSpan vAlign dateTime accessKey tabIndex ' + 'encType maxLength readOnly longDesc frameBorder').each(function (attr) {
      Element._attributeTranslations.write.names[attr.toLowerCase()] = attr;
      Element._attributeTranslations.has[attr.toLowerCase()] = attr;
    });

    (function (v) {
      Object.extend(v, {
        href: v._getAttr,
        src: v._getAttr,
        type: v._getAttr,
        action: v._getAttrNode,
        disabled: v._flag,
        checked: v._flag,
        readonly: v._flag,
        multiple: v._flag,
        onload: v._getEv,
        onunload: v._getEv,
        onclick: v._getEv,
        ondblclick: v._getEv,
        onmousedown: v._getEv,
        onmouseup: v._getEv,
        onmouseover: v._getEv,
        onmousemove: v._getEv,
        onmouseout: v._getEv,
        onfocus: v._getEv,
        onblur: v._getEv,
        onkeypress: v._getEv,
        onkeydown: v._getEv,
        onkeyup: v._getEv,
        onsubmit: v._getEv,
        onreset: v._getEv,
        onselect: v._getEv,
        onchange: v._getEv
      });
    })(Element._attributeTranslations.read.values);
  }

  else if (Prototype.Browser.Gecko && /rv:1\.8\.0/.test(navigator.userAgent)) {
    Element.Methods.setOpacity = function (element, value) {
      element = $(element);
      element.style.opacity = (value == 1) ? 0.999999 : (value === '') ? '' : (value < 0.00001) ? 0 : value;
      return element;
    };
  }

  else if (Prototype.Browser.WebKit) {
    Element.Methods.setOpacity = function (element, value) {
      element = $(element);
      element.style.opacity = (value == 1 || value === '') ? '' : (value < 0.00001) ? 0 : value;

      if (value == 1) if (element.tagName.toUpperCase() == 'IMG' && element.width) {
        element.width++;
        element.width--;
      } else try {
        var n = document.createTextNode(' ');
        element.appendChild(n);
        element.removeChild(n);
      } catch (e) {}

      return element;
    };

    // Safari returns margins on body which is incorrect if the child is absolutely
    // positioned.  For performance reasons, redefine Element#cumulativeOffset for
    // KHTML/WebKit only.
    Element.Methods.cumulativeOffset = function (element) {
      var valueT = 0,
        valueL = 0;
      do {
        valueT += element.offsetTop || 0;
        valueL += element.offsetLeft || 0;
        if (element.offsetParent == document.body) if (Element.getStyle(element, 'position') == 'absolute') break;

        element = element.offsetParent;
      } while (element);

      return Element._returnOffset(valueL, valueT);
    };
  }

  if (Prototype.Browser.IE || Prototype.Browser.Opera) {
    // IE and Opera are missing .innerHTML support for TABLE-related and SELECT elements
    Element.Methods.update = function (element, content) {
      element = $(element);

      if (content && content.toElement) content = content.toElement();
      if (Object.isElement(content)) return element.update().insert(content);

      content = Object.toHTML(content);
      var tagName = element.tagName.toUpperCase();

      if (tagName in Element._insertionTranslations.tags) {
        $A(element.childNodes).each(function (node) {
          element.removeChild(node)
        });
        Element._getContentFromAnonymousElement(tagName, content.stripScripts()).each(function (node) {
          element.appendChild(node)
        });
      }
      else element.innerHTML = content.stripScripts();

      content.evalScripts.bind(content).defer();
      return element;
    };
  }

  if ('outerHTML' in document.createElement('div')) {
    Element.Methods.replace = function (element, content) {
      element = $(element);

      if (content && content.toElement) content = content.toElement();
      if (Object.isElement(content)) {
        element.parentNode.replaceChild(content, element);
        return element;
      }

      content = Object.toHTML(content);
      var parent = element.parentNode,
        tagName = parent.tagName.toUpperCase();

      if (Element._insertionTranslations.tags[tagName]) {
        var nextSibling = element.next();
        var fragments = Element._getContentFromAnonymousElement(tagName, content.stripScripts());
        parent.removeChild(element);
        if (nextSibling) fragments.each(function (node) {
          parent.insertBefore(node, nextSibling)
        });
        else fragments.each(function (node) {
          parent.appendChild(node)
        });
      }
      else element.outerHTML = content.stripScripts();

      content.evalScripts.bind(content).defer();
      return element;
    };
  }

  Element._returnOffset = function (l, t) {
    var result = [l, t];
    result.left = l;
    result.top = t;
    return result;
  };

  Element._getContentFromAnonymousElement = function (tagName, html) {
    var div = new Element('div'),
      t = Element._insertionTranslations.tags[tagName];
    if (t) {
      div.innerHTML = t[0] + html + t[1];
      t[2].times(function () {
        div = div.firstChild
      });
    } else div.innerHTML = html;
    return $A(div.childNodes);
  };

  Element._insertionTranslations = {
    before: function (element, node) {
      element.parentNode.insertBefore(node, element);
    },
    top: function (element, node) {
      element.insertBefore(node, element.firstChild);
    },
    bottom: function (element, node) {
      element.appendChild(node);
    },
    after: function (element, node) {
      element.parentNode.insertBefore(node, element.nextSibling);
    },
    tags: {
      TABLE: ['<table>', '</table>', 1],
      TBODY: ['<table><tbody>', '</tbody></table>', 2],
      TR: ['<table><tbody><tr>', '</tr></tbody></table>', 3],
      TD: ['<table><tbody><tr><td>', '</td></tr></tbody></table>', 4],
      SELECT: ['<select>', '</select>', 1]
    }
  };

  (function () {
    Object.extend(this.tags, {
      THEAD: this.tags.TBODY,
      TFOOT: this.tags.TBODY,
      TH: this.tags.TD
    });
  }).call(Element._insertionTranslations);

  Element.Methods.Simulated = {
    hasAttribute: function (element, attribute) {
      attribute = Element._attributeTranslations.has[attribute] || attribute;
      var node = $(element).getAttributeNode(attribute);
      return !!(node && node.specified);
    }
  };

  Element.Methods.ByTag = {};

  Object.extend(Element, Element.Methods);

  if (!Prototype.BrowserFeatures.ElementExtensions && document.createElement('div')['__proto__']) {
    window.HTMLElement = {};
    window.HTMLElement.prototype = document.createElement('div')['__proto__'];
    Prototype.BrowserFeatures.ElementExtensions = true;
  }

  Element.extend = (function () {
    if (Prototype.BrowserFeatures.SpecificElementExtensions) return Prototype.K;

    var Methods = {},
      ByTag = Element.Methods.ByTag;

    var extend = Object.extend(function (element) {
      if (!element || element._extendedByPrototype || element.nodeType != 1 || element == window) return element;

      var methods = Object.clone(Methods),
        tagName = element.tagName.toUpperCase(),
        property, value;

      // extend methods for specific tags
      if (ByTag[tagName]) Object.extend(methods, ByTag[tagName]);

      for (property in methods) {
        value = methods[property];
        if (Object.isFunction(value) && !(property in element)) element[property] = value.methodize();
      }

      element._extendedByPrototype = Prototype.emptyFunction;
      return element;

    }, {
      refresh: function () {
        // extend methods for all tags (Safari doesn't need this)
        if (!Prototype.BrowserFeatures.ElementExtensions) {
          Object.extend(Methods, Element.Methods);
          Object.extend(Methods, Element.Methods.Simulated);
        }
      }
    });

    extend.refresh();
    return extend;
  })();

  Element.hasAttribute = function (element, attribute) {
    if (element.hasAttribute) return element.hasAttribute(attribute);
    return Element.Methods.Simulated.hasAttribute(element, attribute);
  };

  Element.addMethods = function (methods) {
    var F = Prototype.BrowserFeatures,
      T = Element.Methods.ByTag;

    if (!methods) {
      Object.extend(Form, Form.Methods);
      Object.extend(Form.Element, Form.Element.Methods);
      Object.extend(Element.Methods.ByTag, {
        "FORM": Object.clone(Form.Methods),
        "INPUT": Object.clone(Form.Element.Methods),
        "SELECT": Object.clone(Form.Element.Methods),
        "TEXTAREA": Object.clone(Form.Element.Methods)
      });
    }

    if (arguments.length == 2) {
      var tagName = methods;
      methods = arguments[1];
    }

    if (!tagName) Object.extend(Element.Methods, methods || {});
    else {
      if (Object.isArray(tagName)) tagName.each(extend);
      else extend(tagName);
    }

    function extend(tagName) {
      tagName = tagName.toUpperCase();
      if (!Element.Methods.ByTag[tagName]) Element.Methods.ByTag[tagName] = {};
      Object.extend(Element.Methods.ByTag[tagName], methods);
    }

    function copy(methods, destination, onlyIfAbsent) {
      onlyIfAbsent = onlyIfAbsent || false;
      for (var property in methods) {
        var value = methods[property];
        if (!Object.isFunction(value)) continue;
        if (!onlyIfAbsent || !(property in destination)) destination[property] = value.methodize();
      }
    }

    function findDOMClass(tagName) {
      var klass;
      var trans = {
        "OPTGROUP": "OptGroup",
        "TEXTAREA": "TextArea",
        "P": "Paragraph",
        "FIELDSET": "FieldSet",
        "UL": "UList",
        "OL": "OList",
        "DL": "DList",
        "DIR": "Directory",
        "H1": "Heading",
        "H2": "Heading",
        "H3": "Heading",
        "H4": "Heading",
        "H5": "Heading",
        "H6": "Heading",
        "Q": "Quote",
        "INS": "Mod",
        "DEL": "Mod",
        "A": "Anchor",
        "IMG": "Image",
        "CAPTION": "TableCaption",
        "COL": "TableCol",
        "COLGROUP": "TableCol",
        "THEAD": "TableSection",
        "TFOOT": "TableSection",
        "TBODY": "TableSection",
        "TR": "TableRow",
        "TH": "TableCell",
        "TD": "TableCell",
        "FRAMESET": "FrameSet",
        "IFRAME": "IFrame"
      };
      if (trans[tagName]) klass = 'HTML' + trans[tagName] + 'Element';
      if (window[klass]) return window[klass];
      klass = 'HTML' + tagName + 'Element';
      if (window[klass]) return window[klass];
      klass = 'HTML' + tagName.capitalize() + 'Element';
      if (window[klass]) return window[klass];

      window[klass] = {};
      window[klass].prototype = document.createElement(tagName)['__proto__'];
      return window[klass];
    }

    if (F.ElementExtensions) {
      copy(Element.Methods, HTMLElement.prototype);
      copy(Element.Methods.Simulated, HTMLElement.prototype, true);
    }

    if (F.SpecificElementExtensions) {
      for (var tag in Element.Methods.ByTag) {
        var klass = findDOMClass(tag);
        if (Object.isUndefined(klass)) continue;
        copy(T[tag], klass.prototype);
      }
    }

    Object.extend(Element, Element.Methods);
    delete Element.ByTag;

    if (Element.extend.refresh) Element.extend.refresh();
    Element.cache = {};
  };

  document.viewport = {
    getDimensions: function () {
      var dimensions = {},
        B = Prototype.Browser;
      $w('width height').each(function (d) {
        var D = d.capitalize();
        if (B.WebKit && !document.evaluate) {
          // Safari <3.0 needs self.innerWidth/Height
          dimensions[d] = self['inner' + D];
        } else if (B.Opera && parseFloat(window.opera.version()) < 9.5) {
          // Opera <9.5 needs document.body.clientWidth/Height
          dimensions[d] = document.body['client' + D]
        } else {
          dimensions[d] = document.documentElement['client' + D];
        }
      });
      return dimensions;
    },

    getWidth: function () {
      return this.getDimensions().width;
    },

    getHeight: function () {
      return this.getDimensions().height;
    },

    getScrollOffsets: function () {
      return Element._returnOffset(
      window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft, window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop);
    }
  };
  /* Portions of the Selector class are derived from Jack Slocum's DomQuery,
   * part of YUI-Ext version 0.40, distributed under the terms of an MIT-style
   * license.  Please see http://www.yui-ext.com/ for more information. */

  var Selector = Class.create({
    initialize: function (expression) {
      this.expression = expression.strip();

      if (this.shouldUseSelectorsAPI()) {
        this.mode = 'selectorsAPI';
      } else {
        this.mode = "normal";
        this.compileMatcher();
      }

    },

    shouldUseSelectorsAPI: function () {
      if (!Prototype.BrowserFeatures.SelectorsAPI) return false;

      if (!Selector._div) Selector._div = new Element('div');

      // Make sure the browser treats the selector as valid. Test on an
      // isolated element to minimize cost of this check.
      try {
        Selector._div.querySelector(this.expression);
      } catch (e) {
        return false;
      }

      return true;
    },

    compileMatcher: function () {
      var e = this.expression,
        ps = Selector.patterns,
        h = Selector.handlers,
        c = Selector.criteria,
        le, p, m;

      if (Selector._cache[e]) {
        this.matcher = Selector._cache[e];
        return;
      }

      this.matcher = ["this.matcher = function(root) {", "var r = root, h = Selector.handlers, c = false, n;"];

      while (e && le != e && (/\S/).test(e)) {
        le = e;
        for (var i in ps) {
          p = ps[i];
          if (m = e.match(p)) {
            this.matcher.push(Object.isFunction(c[i]) ? c[i](m) : new Template(c[i]).evaluate(m));
            e = e.replace(m[0], '');
            break;
          }
        }
      }

      this.matcher.push("return h.unique(n);\n}");
      eval(this.matcher.join('\n'));
      Selector._cache[this.expression] = this.matcher;
    },

    findElements: function (root) {
      root = root || document;
      var e = this.expression,
        results;

      switch (this.mode) {
      case 'selectorsAPI':
        // querySelectorAll queries document-wide, then filters to descendants
        // of the context element. That's not what we want.
        // Add an explicit context to the selector if necessary.
        if (root !== document) {
          var oldId = root.id,
            id = $(root).identify();
          e = "#" + id + " " + e;
        }

        results = $A(root.querySelectorAll(e)).map(Element.extend);
        root.id = oldId;

        return results;
      default:
        return this.matcher(root);
      }
    },

    match: function (element) {
      this.tokens = [];

      var e = this.expression,
        ps = Selector.patterns,
        as = Selector.assertions;
      var le, p, m;

      while (e && le !== e && (/\S/).test(e)) {
        le = e;
        for (var i in ps) {
          p = ps[i];
          if (m = e.match(p)) {
            // use the Selector.assertions methods unless the selector
            // is too complex.
            if (as[i]) {
              this.tokens.push([i, Object.clone(m)]);
              e = e.replace(m[0], '');
            } else {
              // reluctantly do a document-wide search
              // and look for a match in the array
              return this.findElements(document).include(element);
            }
          }
        }
      }

      var match = true,
        name, matches;
      for (var i = 0, token; token = this.tokens[i]; i++) {
        name = token[0],
        matches = token[1];
        if (!Selector.assertions[name](element, matches)) {
          match = false;
          break;
        }
      }

      return match;
    },

    toString: function () {
      return this.expression;
    },

    inspect: function () {
      return "#<Selector:" + this.expression.inspect() + ">";
    }
  });

  Object.extend(Selector, {
    _cache: {},

    criteria: {
      tagName: 'n = h.tagName(n, r, "#{1}", c);      c = false;',
      className: 'n = h.className(n, r, "#{1}", c);    c = false;',
      id: 'n = h.id(n, r, "#{1}", c);           c = false;',
      attrPresence: 'n = h.attrPresence(n, r, "#{1}", c); c = false;',
      attr: function (m) {
        m[3] = (m[5] || m[6]);
        return new Template('n = h.attr(n, r, "#{1}", "#{3}", "#{2}", c); c = false;').evaluate(m);
      },
      pseudo: function (m) {
        if (m[6]) m[6] = m[6].replace(/"/g, '\\"');
        return new Template('n = h.pseudo(n, "#{1}", "#{6}", r, c); c = false;').evaluate(m);
      },
      descendant: 'c = "descendant";',
      child: 'c = "child";',
      adjacent: 'c = "adjacent";',
      laterSibling: 'c = "laterSibling";'
    },

    patterns: {
      // combinators must be listed first
      // (and descendant needs to be last combinator)
      laterSibling: /^\s*~\s*/,
      child: /^\s*>\s*/,
      adjacent: /^\s*\+\s*/,
      descendant: /^\s/,

      // selectors follow
      tagName: /^\s*(\*|[\w\-]+)(\b|$)?/,
      id: /^#([\w\-\*]+)(\b|$)/,
      className: /^\.([\w\-\*]+)(\b|$)/,
      pseudo: /^:((first|last|nth|nth-last|only)(-child|-of-type)|empty|checked|(en|dis)abled|not)(\((.*?)\))?(\b|$|(?=\s|[:+~>]))/,
      attrPresence: /^\[((?:[\w]+:)?[\w]+)\]/,
      attr: /\[((?:[\w-]*:)?[\w-]+)\s*(?:([!^$*~|]?=)\s*((['"])([^\4]*?)\4|([^'"][^\]]*?)))?\]/
    },

    // for Selector.match and Element#match
    assertions: {
      tagName: function (element, matches) {
        return matches[1].toUpperCase() == element.tagName.toUpperCase();
      },

      className: function (element, matches) {
        return Element.hasClassName(element, matches[1]);
      },

      id: function (element, matches) {
        return element.id === matches[1];
      },

      attrPresence: function (element, matches) {
        return Element.hasAttribute(element, matches[1]);
      },

      attr: function (element, matches) {
        var nodeValue = Element.readAttribute(element, matches[1]);
        return nodeValue && Selector.operators[matches[2]](nodeValue, matches[5] || matches[6]);
      }
    },

    handlers: {
      // UTILITY FUNCTIONS
      // joins two collections
      concat: function (a, b) {
        for (var i = 0, node; node = b[i]; i++)
        a.push(node);
        return a;
      },

      // marks an array of nodes for counting
      mark: function (nodes) {
        var _true = Prototype.emptyFunction;
        for (var i = 0, node; node = nodes[i]; i++)
        node._countedByPrototype = _true;
        return nodes;
      },

      unmark: function (nodes) {
        for (var i = 0, node; node = nodes[i]; i++)
        node._countedByPrototype = undefined;
        return nodes;
      },

      // mark each child node with its position (for nth calls)
      // "ofType" flag indicates whether we're indexing for nth-of-type
      // rather than nth-child
      index: function (parentNode, reverse, ofType) {
        parentNode._countedByPrototype = Prototype.emptyFunction;
        if (reverse) {
          for (var nodes = parentNode.childNodes, i = nodes.length - 1, j = 1; i >= 0; i--) {
            var node = nodes[i];
            if (node.nodeType == 1 && (!ofType || node._countedByPrototype)) node.nodeIndex = j++;
          }
        } else {
          for (var i = 0, j = 1, nodes = parentNode.childNodes; node = nodes[i]; i++)
          if (node.nodeType == 1 && (!ofType || node._countedByPrototype)) node.nodeIndex = j++;
        }
      },

      // filters out duplicates and extends all nodes
      unique: function (nodes) {
        if (nodes.length == 0) return nodes;
        var results = [],
          n;
        for (var i = 0, l = nodes.length; i < l; i++)
        if (!(n = nodes[i])._countedByPrototype) {
          n._countedByPrototype = Prototype.emptyFunction;
          results.push(Element.extend(n));
        }
        return Selector.handlers.unmark(results);
      },

      // COMBINATOR FUNCTIONS
      descendant: function (nodes) {
        var h = Selector.handlers;
        for (var i = 0, results = [], node; node = nodes[i]; i++)
        h.concat(results, node.getElementsByTagName('*'));
        return results;
      },

      child: function (nodes) {
        var h = Selector.handlers;
        for (var i = 0, results = [], node; node = nodes[i]; i++) {
          for (var j = 0, child; child = node.childNodes[j]; j++)
          if (child.nodeType == 1 && child.tagName != '!') results.push(child);
        }
        return results;
      },

      adjacent: function (nodes) {
        for (var i = 0, results = [], node; node = nodes[i]; i++) {
          var next = this.nextElementSibling(node);
          if (next) results.push(next);
        }
        return results;
      },

      laterSibling: function (nodes) {
        var h = Selector.handlers;
        for (var i = 0, results = [], node; node = nodes[i]; i++)
        h.concat(results, Element.nextSiblings(node));
        return results;
      },

      nextElementSibling: function (node) {
        while (node = node.nextSibling)
        if (node.nodeType == 1) return node;
        return null;
      },

      previousElementSibling: function (node) {
        while (node = node.previousSibling)
        if (node.nodeType == 1) return node;
        return null;
      },

      // TOKEN FUNCTIONS
      tagName: function (nodes, root, tagName, combinator) {
        var uTagName = tagName.toUpperCase();
        var results = [],
          h = Selector.handlers;
        if (nodes) {
          if (combinator) {
            // fastlane for ordinary descendant combinators
            if (combinator == "descendant") {
              for (var i = 0, node; node = nodes[i]; i++)
              h.concat(results, node.getElementsByTagName(tagName));
              return results;
            } else nodes = this[combinator](nodes);
            if (tagName == "*") return nodes;
          }
          for (var i = 0, node; node = nodes[i]; i++)
          if (node.tagName.toUpperCase() === uTagName) results.push(node);
          return results;
        } else return root.getElementsByTagName(tagName);
      },

      id: function (nodes, root, id, combinator) {
        var targetNode = $(id),
          h = Selector.handlers;
        if (!targetNode) return [];
        if (!nodes && root == document) return [targetNode];
        if (nodes) {
          if (combinator) {
            if (combinator == 'child') {
              for (var i = 0, node; node = nodes[i]; i++)
              if (targetNode.parentNode == node) return [targetNode];
            } else if (combinator == 'descendant') {
              for (var i = 0, node; node = nodes[i]; i++)
              if (Element.descendantOf(targetNode, node)) return [targetNode];
            } else if (combinator == 'adjacent') {
              for (var i = 0, node; node = nodes[i]; i++)
              if (Selector.handlers.previousElementSibling(targetNode) == node) return [targetNode];
            } else nodes = h[combinator](nodes);
          }
          for (var i = 0, node; node = nodes[i]; i++)
          if (node == targetNode) return [targetNode];
          return [];
        }
        return (targetNode && Element.descendantOf(targetNode, root)) ? [targetNode] : [];
      },

      className: function (nodes, root, className, combinator) {
        if (nodes && combinator) nodes = this[combinator](nodes);
        return Selector.handlers.byClassName(nodes, root, className);
      },

      byClassName: function (nodes, root, className) {
        if (!nodes) nodes = Selector.handlers.descendant([root]);
        var needle = ' ' + className + ' ';
        for (var i = 0, results = [], node, nodeClassName; node = nodes[i]; i++) {
          nodeClassName = node.className;
          if (nodeClassName.length == 0) continue;
          if (nodeClassName == className || (' ' + nodeClassName + ' ').include(needle)) results.push(node);
        }
        return results;
      },

      attrPresence: function (nodes, root, attr, combinator) {
        if (!nodes) nodes = root.getElementsByTagName("*");
        if (nodes && combinator) nodes = this[combinator](nodes);
        var results = [];
        for (var i = 0, node; node = nodes[i]; i++)
        if (Element.hasAttribute(node, attr)) results.push(node);
        return results;
      },

      attr: function (nodes, root, attr, value, operator, combinator) {
        if (!nodes) nodes = root.getElementsByTagName("*");
        if (nodes && combinator) nodes = this[combinator](nodes);
        var handler = Selector.operators[operator],
          results = [];
        for (var i = 0, node; node = nodes[i]; i++) {
          var nodeValue = Element.readAttribute(node, attr);
          if (nodeValue === null) continue;
          if (handler(nodeValue, value)) results.push(node);
        }
        return results;
      },

      pseudo: function (nodes, name, value, root, combinator) {
        if (nodes && combinator) nodes = this[combinator](nodes);
        if (!nodes) nodes = root.getElementsByTagName("*");
        return Selector.pseudos[name](nodes, value, root);
      }
    },

    operators: {
      '=': function (nv, v) {
        return nv == v;
      },
      '!=': function (nv, v) {
        return nv != v;
      },
      '^=': function (nv, v) {
        return nv == v || nv && nv.startsWith(v);
      },
      '$=': function (nv, v) {
        return nv == v || nv && nv.endsWith(v);
      },
      '*=': function (nv, v) {
        return nv == v || nv && nv.include(v);
      },
      '$=': function (nv, v) {
        return nv.endsWith(v);
      },
      '*=': function (nv, v) {
        return nv.include(v);
      },
      '~=': function (nv, v) {
        return (' ' + nv + ' ').include(' ' + v + ' ');
      },
      '|=': function (nv, v) {
        return ('-' + (nv || "").toUpperCase() + '-').include('-' + (v || "").toUpperCase() + '-');
      }
    },

    split: function (expression) {
      var expressions = [];
      expression.scan(/(([\w#:.~>+()\s-]+|\*|\[.*?\])+)\s*(,|$)/, function (m) {
        expressions.push(m[1].strip());
      });
      return expressions;
    },

    matchElements: function (elements, expression) {
      var matches = $$(expression),
        h = Selector.handlers;
      h.mark(matches);
      for (var i = 0, results = [], element; element = elements[i]; i++)
      if (element._countedByPrototype) results.push(element);
      h.unmark(matches);
      return results;
    },

    findElement: function (elements, expression, index) {
      if (Object.isNumber(expression)) {
        index = expression;
        expression = false;
      }
      return Selector.matchElements(elements, expression || '*')[index || 0];
    },

    findChildElements: function (element, expressions) {
      expressions = Selector.split(expressions.join(','));
      var results = [],
        h = Selector.handlers;
      for (var i = 0, l = expressions.length, selector; i < l; i++) {
        selector = new Selector(expressions[i].strip());
        h.concat(results, selector.findElements(element));
      }
      return (l > 1) ? h.unique(results) : results;
    }
  });

  if (Prototype.Browser.IE) {
    Object.extend(Selector.handlers, {
      // IE returns comment nodes on getElementsByTagName("*").
      // Filter them out.
      concat: function (a, b) {
        for (var i = 0, node; node = b[i]; i++)
        if (node.tagName !== "!") a.push(node);
        return a;
      },

      // IE improperly serializes _countedByPrototype in (inner|outer)HTML.
      unmark: function (nodes) {
        for (var i = 0, node; node = nodes[i]; i++)
        node.removeAttribute('_countedByPrototype');
        return nodes;
      }
    });
  }

  function $$() {
    return Selector.findChildElements(document, $A(arguments));
  }
  var Form = {
    reset: function (form) {
      $(form).reset();
      return form;
    },

    serializeElements: function (elements, options) {
      if (typeof options != 'object') options = {
        hash: !! options
      };
      else if (Object.isUndefined(options.hash)) options.hash = true;
      var key, value, submitted = false,
        submit = options.submit;

      var data = elements.inject({}, function (result, element) {
        if (!element.disabled && element.name) {
          key = element.name;
          value = $(element).getValue();
          if (value != null && element.type != 'file' && (element.type != 'submit' || (!submitted && submit !== false && (!submit || key == submit) && (submitted = true)))) {
            if (key in result) {
              // a key is already present; construct an array of values
              if (!Object.isArray(result[key])) result[key] = [result[key]];
              result[key].push(value);
            }
            else result[key] = value;
          }
        }
        return result;
      });

      return options.hash ? data : Object.toQueryString(data);
    }
  };

  Form.Methods = {
    serialize: function (form, options) {
      return Form.serializeElements(Form.getElements(form), options);
    },

    getElements: function (form) {
      return $A($(form).getElementsByTagName('*')).inject([], function (elements, child) {
        if (Form.Element.Serializers[child.tagName.toLowerCase()]) elements.push(Element.extend(child));
        return elements;
      });
    },

    getInputs: function (form, typeName, name) {
      form = $(form);
      var inputs = form.getElementsByTagName('input');

      if (!typeName && !name) return $A(inputs).map(Element.extend);

      for (var i = 0, matchingInputs = [], length = inputs.length; i < length; i++) {
        var input = inputs[i];
        if ((typeName && input.type != typeName) || (name && input.name != name)) continue;
        matchingInputs.push(Element.extend(input));
      }

      return matchingInputs;
    },

    disable: function (form) {
      form = $(form);
      Form.getElements(form).invoke('disable');
      return form;
    },

    enable: function (form) {
      form = $(form);
      Form.getElements(form).invoke('enable');
      return form;
    },

    findFirstElement: function (form) {
      var elements = $(form).getElements().findAll(function (element) {
        return 'hidden' != element.type && !element.disabled;
      });
      var firstByIndex = elements.findAll(function (element) {
        return element.hasAttribute('tabIndex') && element.tabIndex >= 0;
      }).sortBy(function (element) {
        return element.tabIndex
      }).first();

      return firstByIndex ? firstByIndex : elements.find(function (element) {
        return ['input', 'select', 'textarea'].include(element.tagName.toLowerCase());
      });
    },

    focusFirstElement: function (form) {
      form = $(form);
      form.findFirstElement().activate();
      return form;
    },

    request: function (form, options) {
      form = $(form),
      options = Object.clone(options || {});

      var params = options.parameters,
        action = form.readAttribute('action') || '';
      if (action.blank()) action = window.location.href;
      options.parameters = form.serialize(true);

      if (params) {
        if (Object.isString(params)) params = params.toQueryParams();
        Object.extend(options.parameters, params);
      }

      if (form.hasAttribute('method') && !options.method) options.method = form.method;

      return new Ajax.Request(action, options);
    }
  };

  /*--------------------------------------------------------------------------*/

  Form.Element = {
    focus: function (element) {
      $(element).focus();
      return element;
    },

    select: function (element) {
      $(element).select();
      return element;
    }
  };

  Form.Element.Methods = {
    serialize: function (element) {
      element = $(element);
      if (!element.disabled && element.name) {
        var value = element.getValue();
        if (value != undefined) {
          var pair = {};
          pair[element.name] = value;
          return Object.toQueryString(pair);
        }
      }
      return '';
    },

    getValue: function (element) {
      element = $(element);
      var method = element.tagName.toLowerCase();
      return Form.Element.Serializers[method](element);
    },

    setValue: function (element, value) {
      element = $(element);
      var method = element.tagName.toLowerCase();
      Form.Element.Serializers[method](element, value);
      return element;
    },

    clear: function (element) {
      $(element).value = '';
      return element;
    },

    present: function (element) {
      return $(element).value != '';
    },

    activate: function (element) {
      element = $(element);
      try {
        element.focus();
        if (element.select && (element.tagName.toLowerCase() != 'input' || !['button', 'reset', 'submit'].include(element.type))) element.select();
      } catch (e) {}
      return element;
    },

    disable: function (element) {
      element = $(element);
      element.disabled = true;
      return element;
    },

    enable: function (element) {
      element = $(element);
      element.disabled = false;
      return element;
    }
  };

  /*--------------------------------------------------------------------------*/

  var Field = Form.Element;
  var $F = Form.Element.Methods.getValue;

  /*--------------------------------------------------------------------------*/

  Form.Element.Serializers = {
    input: function (element, value) {
      switch (element.type.toLowerCase()) {
      case 'checkbox':
      case 'radio':
        return Form.Element.Serializers.inputSelector(element, value);
      default:
        return Form.Element.Serializers.textarea(element, value);
      }
    },

    inputSelector: function (element, value) {
      if (Object.isUndefined(value)) return element.checked ? element.value : null;
      else element.checked = !! value;
    },

    textarea: function (element, value) {
      if (Object.isUndefined(value)) return element.value;
      else element.value = value;
    },

    select: function (element, value) {
      if (Object.isUndefined(value)) return this[element.type == 'select-one' ? 'selectOne' : 'selectMany'](element);
      else {
        var opt, currentValue, single = !Object.isArray(value);
        for (var i = 0, length = element.length; i < length; i++) {
          opt = element.options[i];
          currentValue = this.optionValue(opt);
          if (single) {
            if (currentValue == value) {
              opt.selected = true;
              return;
            }
          }
          else opt.selected = value.include(currentValue);
        }
      }
    },

    selectOne: function (element) {
      var index = element.selectedIndex;
      return index >= 0 ? this.optionValue(element.options[index]) : null;
    },

    selectMany: function (element) {
      var values, length = element.length;
      if (!length) return null;

      for (var i = 0, values = []; i < length; i++) {
        var opt = element.options[i];
        if (opt.selected) values.push(this.optionValue(opt));
      }
      return values;
    },

    optionValue: function (opt) {
      // extend element because hasAttribute may not be native
      return Element.extend(opt).hasAttribute('value') ? opt.value : opt.text;
    }
  };

  /*--------------------------------------------------------------------------*/

  Abstract.TimedObserver = Class.create(PeriodicalExecuter, {
    initialize: function ($super, element, frequency, callback) {
      $super(callback, frequency);
      this.element = $(element);
      this.lastValue = this.getValue();
    },

    execute: function () {
      var value = this.getValue();
      if (Object.isString(this.lastValue) && Object.isString(value) ? this.lastValue != value : String(this.lastValue) != String(value)) {
        this.callback(this.element, value);
        this.lastValue = value;
      }
    }
  });

  Form.Element.Observer = Class.create(Abstract.TimedObserver, {
    getValue: function () {
      return Form.Element.getValue(this.element);
    }
  });

  Form.Observer = Class.create(Abstract.TimedObserver, {
    getValue: function () {
      return Form.serialize(this.element);
    }
  });

  /*--------------------------------------------------------------------------*/

  Abstract.EventObserver = Class.create({
    initialize: function (element, callback) {
      this.element = $(element);
      this.callback = callback;

      this.lastValue = this.getValue();
      if (this.element.tagName.toLowerCase() == 'form') this.registerFormCallbacks();
      else this.registerCallback(this.element);
    },

    onElementEvent: function () {
      var value = this.getValue();
      if (this.lastValue != value) {
        this.callback(this.element, value);
        this.lastValue = value;
      }
    },

    registerFormCallbacks: function () {
      Form.getElements(this.element).each(this.registerCallback, this);
    },

    registerCallback: function (element) {
      if (element.type) {
        switch (element.type.toLowerCase()) {
        case 'checkbox':
        case 'radio':
          Event.observe(element, 'click', this.onElementEvent.bind(this));
          break;
        default:
          Event.observe(element, 'change', this.onElementEvent.bind(this));
          break;
        }
      }
    }
  });

  Form.Element.EventObserver = Class.create(Abstract.EventObserver, {
    getValue: function () {
      return Form.Element.getValue(this.element);
    }
  });

  Form.EventObserver = Class.create(Abstract.EventObserver, {
    getValue: function () {
      return Form.serialize(this.element);
    }
  });
  var Event = {};

  Object.extend(Event, {
    KEY_BACKSPACE: 8,
    KEY_TAB: 9,
    KEY_RETURN: 13,
    KEY_ESC: 27,
    KEY_LEFT: 37,
    KEY_UP: 38,
    KEY_RIGHT: 39,
    KEY_DOWN: 40,
    KEY_DELETE: 46,
    KEY_HOME: 36,
    KEY_END: 35,
    KEY_PAGEUP: 33,
    KEY_PAGEDOWN: 34,
    KEY_INSERT: 45,

    cache: {},

    relatedTarget: function (event) {
      var element;
      switch (event.type) {
      case 'mouseover':
        element = event.fromElement;
        break;
      case 'mouseout':
        element = event.toElement;
        break;
      default:
        return null;
      }
      return Element.extend(element);
    }
  });

  Event.Methods = (function () {
    var isButton;

    if (Prototype.Browser.IE) {
      var buttonMap = {
        0: 1,
        1: 4,
        2: 2
      };
      isButton = function (event, code) {
        return event.button == buttonMap[code];
      };

    } else if (Prototype.Browser.WebKit) {
      isButton = function (event, code) {
        switch (code) {
        case 0:
          return event.which == 1 && !event.metaKey;
        case 1:
          return event.which == 1 && event.metaKey;
        default:
          return false;
        }
      };

    } else {
      isButton = function (event, code) {
        return event.which ? (event.which === code + 1) : (event.button === code);
      };
    }

    return {
      isLeftClick: function (event) {
        return isButton(event, 0)
      },
      isMiddleClick: function (event) {
        return isButton(event, 1)
      },
      isRightClick: function (event) {
        return isButton(event, 2)
      },

      element: function (event) {
        event = Event.extend(event);

        var node = event.target,
          type = event.type,
          currentTarget = event.currentTarget;

        if (currentTarget && currentTarget.tagName) {
          // Firefox screws up the "click" event when moving between radio buttons
          // via arrow keys. It also screws up the "load" and "error" events on images,
          // reporting the document as the target instead of the original image.
          if (type === 'load' || type === 'error' || (type === 'click' && currentTarget.tagName.toLowerCase() === 'input' && currentTarget.type === 'radio')) node = currentTarget;
        }
        if (node.nodeType == Node.TEXT_NODE) node = node.parentNode;
        return Element.extend(node);
      },

      findElement: function (event, expression) {
        var element = Event.element(event);
        if (!expression) return element;
        var elements = [element].concat(element.ancestors());
        return Selector.findElement(elements, expression, 0);
      },

      pointer: function (event) {
        var docElement = document.documentElement,
          body = document.body || {
          scrollLeft: 0,
          scrollTop: 0
        };
        return {
          x: event.pageX || (event.clientX + (docElement.scrollLeft || body.scrollLeft) - (docElement.clientLeft || 0)),
          y: event.pageY || (event.clientY + (docElement.scrollTop || body.scrollTop) - (docElement.clientTop || 0))
        };
      },

      pointerX: function (event) {
        return Event.pointer(event).x
      },
      pointerY: function (event) {
        return Event.pointer(event).y
      },

      stop: function (event) {
        Event.extend(event);
        event.preventDefault();
        event.stopPropagation();
        event.stopped = true;
      }
    };
  })();

  Event.extend = (function () {
    var methods = Object.keys(Event.Methods).inject({}, function (m, name) {
      m[name] = Event.Methods[name].methodize();
      return m;
    });

    if (Prototype.Browser.IE) {
      Object.extend(methods, {
        stopPropagation: function () {
          this.cancelBubble = true
        },
        preventDefault: function () {
          this.returnValue = false
        },
        inspect: function () {
          return "[object Event]"
        }
      });

      return function (event) {
        if (!event) return false;
        if (event._extendedByPrototype) return event;

        event._extendedByPrototype = Prototype.emptyFunction;
        var pointer = Event.pointer(event);
        Object.extend(event, {
          target: event.srcElement,
          relatedTarget: Event.relatedTarget(event),
          pageX: pointer.x,
          pageY: pointer.y
        });
        return Object.extend(event, methods);
      };

    } else {
      Event.prototype = Event.prototype || document.createEvent("HTMLEvents")['__proto__'];
      Object.extend(Event.prototype, methods);
      return Prototype.K;
    }
  })();

  Object.extend(Event, (function () {
    var cache = Event.cache;

    function getEventID(element) {
      if (element._prototypeEventID) return element._prototypeEventID[0];
      arguments.callee.id = arguments.callee.id || 1;
      return element._prototypeEventID = [++arguments.callee.id];
    }

    function getDOMEventName(eventName) {
      if (eventName && eventName.include(':')) return "dataavailable";
      return eventName;
    }

    function getCacheForID(id) {
      return cache[id] = cache[id] || {};
    }

    function getWrappersForEventName(id, eventName) {
      var c = getCacheForID(id);
      return c[eventName] = c[eventName] || [];
    }

    function createWrapper(element, eventName, handler) {
      var id = getEventID(element);
      var c = getWrappersForEventName(id, eventName);
      if (c.pluck("handler").include(handler)) return false;

      var wrapper = function (event) {
        if (!Event || !Event.extend || (event.eventName && event.eventName != eventName)) return false;

        Event.extend(event);
        handler.call(element, event);
      };

      wrapper.handler = handler;
      c.push(wrapper);
      return wrapper;
    }

    function findWrapper(id, eventName, handler) {
      var c = getWrappersForEventName(id, eventName);
      return c.find(function (wrapper) {
        return wrapper.handler == handler
      });
    }

    function destroyWrapper(id, eventName, handler) {
      var c = getCacheForID(id);
      if (!c[eventName]) return false;
      c[eventName] = c[eventName].without(findWrapper(id, eventName, handler));
    }

    function destroyCache() {
      for (var id in cache)
      for (var eventName in cache[id])
      cache[id][eventName] = null;
    }


    // Internet Explorer needs to remove event handlers on page unload
    // in order to avoid memory leaks.
    if (window.attachEvent) {
      window.attachEvent("onunload", destroyCache);
    }

    // Safari has a dummy event handler on page unload so that it won't
    // use its bfcache. Safari <= 3.1 has an issue with restoring the "document"
    // object when page is returned to via the back button using its bfcache.
    if (Prototype.Browser.WebKit) {
      window.addEventListener('unload', Prototype.emptyFunction, false);
    }

    return {
      observe: function (element, eventName, handler) {
        element = $(element);
        var name = getDOMEventName(eventName);

        var wrapper = createWrapper(element, eventName, handler);
        if (!wrapper) return element;

        if (element.addEventListener) {
          element.addEventListener(name, wrapper, false);
        } else {
          element.attachEvent("on" + name, wrapper);
        }

        return element;
      },

      stopObserving: function (element, eventName, handler) {
        element = $(element);
        var id = getEventID(element),
          name = getDOMEventName(eventName);

        if (!handler && eventName) {
          getWrappersForEventName(id, eventName).each(function (wrapper) {
            element.stopObserving(eventName, wrapper.handler);
          });
          return element;

        } else if (!eventName) {
          Object.keys(getCacheForID(id)).each(function (eventName) {
            element.stopObserving(eventName);
          });
          return element;
        }

        var wrapper = findWrapper(id, eventName, handler);
        if (!wrapper) return element;

        if (element.removeEventListener) {
          element.removeEventListener(name, wrapper, false);
        } else {
          element.detachEvent("on" + name, wrapper);
        }

        destroyWrapper(id, eventName, handler);

        return element;
      },

      fire: function (element, eventName, memo) {
        element = $(element);
        if (element == document && document.createEvent && !element.dispatchEvent) element = document.documentElement;

        var event;
        if (document.createEvent) {
          event = document.createEvent("HTMLEvents");
          event.initEvent("dataavailable", true, true);
        } else {
          event = document.createEventObject();
          event.eventType = "ondataavailable";
        }

        event.eventName = eventName;
        event.memo = memo || {};

        if (document.createEvent) {
          element.dispatchEvent(event);
        } else {
          element.fireEvent(event.eventType, event);
        }

        return Event.extend(event);
      }
    };
  })());

  Object.extend(Event, Event.Methods);

  Element.addMethods({
    fire: Event.fire,
    observe: Event.observe,
    stopObserving: Event.stopObserving
  });

  Object.extend(document, {
    fire: Element.Methods.fire.methodize(),
    observe: Element.Methods.observe.methodize(),
    stopObserving: Element.Methods.stopObserving.methodize(),
    loaded: false
  });

  (function () {
    /* Support for the DOMContentLoaded event is based on work by Dan Webb,
     Matthias Miller, Dean Edwards and John Resig. */

    var timer;

    function fireContentLoadedEvent() {
      if (document.loaded) return;
      if (timer) window.clearInterval(timer);
      document.fire("dom:loaded");
      document.loaded = true;
    }

    if (document.addEventListener) {
      if (Prototype.Browser.WebKit) {
        timer = window.setInterval(function () {
          if (/loaded|complete/.test(document.readyState)) fireContentLoadedEvent();
        }, 0);

        Event.observe(window, "load", fireContentLoadedEvent);

      } else {
        document.addEventListener("DOMContentLoaded", fireContentLoadedEvent, false);
      }

    } else {
      document.write("<script id=__onDOMContentLoaded defer src=//:><\/script>");
      $("__onDOMContentLoaded").onreadystatechange = function () {
        if (this.readyState == "complete") {
          this.onreadystatechange = null;
          fireContentLoadedEvent();
        }
      };
    }
  })();


  Element.ClassNames = Class.create();
  Element.ClassNames.prototype = {
    initialize: function (element) {
      this.element = $(element);
    },

    _each: function (iterator) {
      this.element.className.split(/\s+/).select(function (name) {
        return name.length > 0;
      })._each(iterator);
    },

    set: function (className) {
      this.element.className = className;
    },

    add: function (classNameToAdd) {
      if (this.include(classNameToAdd)) return;
      this.set($A(this).concat(classNameToAdd).join(' '));
    },

    remove: function (classNameToRemove) {
      if (!this.include(classNameToRemove)) return;
      this.set($A(this).without(classNameToRemove).join(' '));
    },

    toString: function () {
      return $A(this).join(' ');
    }
  };


  Object.extend(Element.ClassNames.prototype, Enumerable);

  /*--------------------------------------------------------------------------*/

  Element.addMethods();

  var Pusher = {
    Version: '1.0'
  };

  /*
   File: Math.uuid.js
   Version: 1.3
   Change History:
   v1.0 - first release
   v1.1 - less code and 2x performance boost (by minimizing calls to Math.random())
   v1.2 - Add support for generating non-standard uuids of arbitrary length
   v1.3 - Fixed IE7 bug (can't use []'s to access string chars.  Thanks, Brian R.)
   v1.4 - Changed method to be "Math.uuid". Added support for radix argument.  Use module pattern for better encapsulation.

   Latest version:   http://www.broofa.com/Tools/Math.uuid.js
   Information:      http://www.broofa.com/blog/?p=151
   Contact:          robert@broofa.com
   ----
   Copyright (c) 2008, Robert Kieffer
   All rights reserved.

   Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

   * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
   * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
   * Neither the name of Robert Kieffer nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

   THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   */

  /*
   * Generate a random uuid.
   *
   * USAGE: Math.uuid(length, radix)
   *   length - the desired number of characters
   *   radix  - the number of allowable values for each character.
   *
   * EXAMPLES:
   *   // No arguments  - returns RFC4122, version 4 ID
   *   >>> Math.uuid()
   *   "92329D39-6F5C-4520-ABFC-AAB64544E172"
   *
   *   // One argument - returns ID of the specified length
   *   >>> Math.uuid(15)     // 15 character ID (default base=62)
   *   "VcydxgltxrVZSTV"
   *
   *   // Two arguments - returns ID of the specified length, and radix. (Radix must be <= 62)
   *   >>> Math.uuid(8, 2)  // 8 character ID (base=2)
   *   "01001010"
   *   >>> Math.uuid(8, 10) // 8 character ID (base=10)
   *   "47473046"
   *   >>> Math.uuid(8, 16) // 8 character ID (base=16)
   *   "098F4D35"
   */
  Math.uuid = (function () {
    var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

    return function (len, radix) {
      var chars = CHARS,
        uuid = [],
        rnd = Math.random;
      radix = radix || chars.length;

      if (len) {
        for (var i = 0; i < len; i++) uuid[i] = chars[0 | rnd() * radix];
      } else {
        var r;

        uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
        uuid[14] = '4';

        for (var i = 0; i < 36; i++) {
          if (!uuid[i]) {
            r = 0 | rnd() * 16;
            uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r & 0xf];
          }
        }
      }

      return uuid.join('');
    };
  })();

  var randomUUID = Math.uuid;
  Pusher.Transport = Class.create({
    CONNECT_DELAY: 0.5,
    //sec
    RECONNECT_DELAY: 3,
    //sec
    initialize: function (url, channelId, callback) {
      this.sessionId = Math.uuid(12);
      this.channelId = channelId;
      this.stop_reconnection = false;
      var params = Object.toQueryString({
        transport: this.name,
        channel_id: this.channelId,
        session_id: this.sessionId
      });
      this.url = url + (url.include('?') ? '&' : '?') + params;

      this.callback = callback;
      this.connect.bind(this).delay(this.CONNECT_DELAY);
    },

    name: null,

    connect: Prototype.emptyFunction,

    reconnect: function () {
      if(! this.stop_reconnection) {
        this.connect.bind(this).delay(this.RECONNECT_DELAY);
      }
    }
  });

  Pusher.LongPoll = Class.create(Pusher.Transport, {
    name: "long_poll",

    connect: function () {
      var self = this;

      new Ajax.Request(this.url, {
        method: 'get',

        onCreate: function (response) {
          if (Prototype.Browser.WebKit) response.request.transport.onerror = self.reconnect.bind(self);
        },

        onComplete: function (transport) {
          if (transport.status == 0) {
            self.reconnect();
          } else {
            var data = transport.responseText.strip();
            if (data.length > 0) self.callback(data);
            self.connect.bind(self).defer();
          }
        }
      });
    }
  });
  Pusher.XhrStream = Class.create(Pusher.Transport, {
    name: "xhr_stream",
    failure: 0,

    connect: function () {
      var len = 0;
      var self = this;

      var c = new Ajax.Request(this.url, {
        method: 'get',

        onCreate: function (response) {
          if (Prototype.Browser.WebKit) {
            // response.request.transport.onerror = self.reconnect.bind(self);
          }
        },

        onInteractive: function (transport) {
          var data = transport.responseText.slice(len).strip();
          len = transport.responseText.length;
          if (data.length > 0) {
            self.callback(data);
          }
        },

        onComplete: function () {
          self.reconnect();
        }
      });

      c.transport.onerror = function () {
         self.failure += 1;
         if (self.failure > 20) {
           self.stop_reconnection = true;
         }
      };

    }
  });
  Pusher.SSE = Class.create(Pusher.Transport, {
    name: "sse",

    connect: function () {
      var tag = document.createElement('event-source');
      tag.setAttribute("src", this.url);

      if (opera.version() < 9.5) {
        document.body.appendChild(tag);
      }

      var self = this;
      $(tag).observe("message", function (e) {
        var data = e.data.strip();
        if (data.length > 0) self.callback(data);
      })
    }
  });
  Pusher.HtmlFile = Class.create(Pusher.Transport, {
    name: "html_file",

    connect: function () {
      alert("Not working on IE yet!");
    }
  });

  if (Prototype.Browser.WebKit || Prototype.Browser.Gecko || Prototype.Browser.MobileSafari) {
    Pusher.Client = Pusher.XhrStream;
  } else if (Prototype.Browser.Opera) {
    Pusher.Client = Pusher.SSE;
  } else if (Prototype.Browser.IE) {
    Pusher.Client = Pusher.HtmlFile;
  } else {
    Pusher.Client = Pusher.LongPoll;
  }
  // JSpec - Core - Copyright TJ Holowaychuk <tj@vision-media.ca> (MIT Licensed)
  /*jslint evil: true */

  (function () {

    JSpec = {
      version: '3.3.2',
      assert: true,
      cache: {},
      suites: [],
      modules: [],
      allSuites: [],
      matchers: {},
      stubbed: [],
      options: {},
      request: 'XMLHttpRequest' in this ? XMLHttpRequest : null,
      stats: {
        hooks: 0,
        specs: 0,
        assertions: 0,
        failures: 0,
        passes: 0,
        specsFinished: 0,
        suitesFinished: 0
      },

      /**
       * Default context in which bodies are evaluated.
       *
       * Replace context simply by setting JSpec.context
       * to your own like below:
       *
       * JSpec.context = { foo : 'bar' }
       *
       * Contexts can be changed within any body, this can be useful
       * in order to provide specific helper methods to specific suites.
       *
       * To reset (usually in after hook) simply set to null like below:
       *
       * JSpec.context = null
       *
       */

      defaultContext: {

        /**
         * Return an object used for proxy assertions.
         * This object is used to indicate that an object
         * should be an instance of _object_, not the constructor
         * itself.
         *
         * @param  {function} constructor
         * @return {hash}
         * @api public
         */

        an_instance_of: function (constructor) {
          return {
            an_instance_of: constructor
          };
        },

        /**
         * Load fixture at _path_.
         *
         * Fixtures are resolved as:
         *
         *  - <path>
         *  - <path>.html
         *
         * @param  {string} path
         * @return {string}
         * @api public
         */

        fixture: function (path) {
          if (JSpec.cache[path]) {
            return JSpec.cache[path];
          }
          var ourl = JSpec.options.fixturePath + '/' + path;
          var purl = JSpec.options.fixturePath + '/' + path + '.html';
          JSpec.cache[path] = JSpec.tryLoading(ourl) || JSpec.tryLoading(purl);
          return JSpec.cache[path];
        }
      },

      // --- Objects
      reporters: {


        /**
         * Report to server.
         *
         * Options:
         *  - uri           specific uri to report to.
         *  - verbose       weither or not to output messages
         *  - failuresOnly  output failure messages only
         *
         * @api public
         */

        Server: function (results, options) {
          var uri = options.uri || 'http://' + window.location.host + '/results';
          JSpec.post(uri, {
            stats: JSpec.stats,
            options: options,
            results: map(results.allSuites, function (suite) {
              if (suite.hasSpecs()) {
                return {
                  description: suite.description,
                  specs: map(suite.specs, function (spec) {
                    var passed = spec.passed() ? 'pass' : 'fail';
                    return {
                      description: spec.description,
                      message: !spec.passed() ? spec.failure().message : null,
                      status: spec.requiresImplementation() ? 'pending' : passed,
                      assertions: map(spec.assertions, function (assertion) {
                        return {
                          passed: assertion.passed
                        };
                      })
                    };
                  })
                };
              }
            })
          });

          if ('close' in main) {
            main.close();
          }
        },

        /**
         * Default reporter, outputting to the DOM.
         *
         * Options:
         *   - reportToId    defaults to 'jspec'
         *   - failuresOnly  displays only suites with failing specs
         *
         * @api public
         */

        DOM: function (results, options) {
          var id = option('reportToId') || 'jspec',
            report = document.getElementById(id),
            failuresOnly = option('failuresOnly'),
            classes = results.stats.failures ? 'has-failures' : '';
          if (!report) {
            throw 'JSpec requires the element #' + id + ' to output its reports';
          }

          function bodyContents(body) {
            return JSpec.
            escape(JSpec.contentsOf(body)).
            replace(/^ */gm, function (a) {
              return (new Array(Math.round(a.length / 3))).join(' ');
            }).
            replace(/\r\n|\r|\n/gm, '<br/>');
          }
          var report_head = [];
          report_head[0] = '<div id="jspec-report" class="';
          report_head[1] = classes;
          report_head[2] = '"><div class="heading">  ';
          report_head[3] = '<span class="passes">Passes: <em>';
          report_head[4] = results.stats.passes;
          report_head[5] = '</em></span><span class="failures">Failures: <em>';
          report_head[6] = results.stats.failures;
          report_head[7] = '<p>';
          report_head[8] = '</em></span> <span class="passes">Duration: <em>';
          report_head[9] = results.duration;
          report_head[10] = '</em> ms</span></p>';
          report_head[11] = ' </div><table class="suites">';
          var report_html_head = report_head.join('');

          function failuremsg(a) {
            return '<em>' + escape(a.message) + '</em>';
          }

          function suitemsg(i, spec) {
            var suite = [];
            suite[0] = '<tr class="';
            suite[1] = i % 2 ? 'odd' : 'even';
            suite[2] = '">';
            if (spec.requiresImplementation()) {
              var s = [];
              s[0] = '<td class="requires-implementation" colspan="2">';
              s[1] = escape(spec.description);
              s[2] = '</td>';
              suite[3] = s.join('');
            } else {
              if (spec.passed() && !failuresOnly) {
                var sub = [];
                sub[0] = '<td class="pass">';
                sub[1] = escape(spec.description);
                sub[2] = '</td><td>';
                sub[3] = spec.assertionsGraph();
                sub[4] = '</td>';
                suite[3] = sub.join('');
              } else {
                if (!spec.passed()) {
                  var str = [];
                  str[0] = '<td class="fail">';
                  str[1] = escape(spec.description);
                  str[2] = map(spec.failures(), failuremsg).join('');
                  str[3] = '</td><td>';
                  str[4] = spec.assertionsGraph();
                  str[5] = '</td>';
                  suite[3] = str.join('');
                } else {
                  suite[3] = '';
                }
              }
            }
            suite[4] = '<tr class="body"><td colspan="2"><pre>';
            suite[5] = bodyContents(spec.body);
            suite[6] = '</pre></td></tr>';
            return suite.join('');
          }

          function resultmsg(suite) {
            var displaySuite;
            if (failuresOnly) {
              displaySuite = suite.ran && !suite.passed();
            } else {
              displaySuite = suite.ran;
            }

            if (displaySuite && suite.hasSpecs()) {
              var result = [];
              result[0] = '<tr class="description"><td colspan="2">';
              result[1] = escape(suite.description);
              result[2] = '</td></tr>';
              result[3] = map(suite.specs, suitemsg).join('');
              result[4] = '</tr>';
              return result.join('');
            } else {
              return '';
            }
          }
          var report_html_content = map(results.allSuites, resultmsg).join('');
          var report_html = [];
          report_html[0] = report_html_head;
          report_html[1] = report_html_content;
          report_html[2] = '</table></div>';
          report.innerHTML = report_html.join('');
        },

        /**
         * Terminal reporter.
         *
         * @api public
         */

        Terminal: function (results, options) {
          var failuresOnly = option('failuresOnly');
          var term = [];
          term[0] = color("\n Passes: ", 'bold');
          term[1] = color(results.stats.passes, 'green');
          term[2] = color(" Failures: ", 'bold');
          term[3] = color(results.stats.failures, 'red');
          term[4] = color(" Duration: ", 'bold');
          term[5] = color(results.duration, 'green');
          term[6] = " ms \n";
          print(term.join(''));

          function indent(string) {
            return string.replace(/^(.)/gm, '  $1');
          }

          function graphassert(graph, assertion) {
            return graph + color('.', assertion.passed ? 'green' : 'red');
          }

          each(results.allSuites, function (suite) {
            var displaySuite;
            if (failuresOnly) {
              displaySuite = suite.ran && !suite.passed();
            } else {
              displaySuite = suite.ran;
            }


            if (displaySuite && suite.hasSpecs()) {
              print(color(' ' + suite.description, 'bold'));
              each(suite.specs, function (spec) {
                var assertionsGraph = inject(spec.assertions, '', graphassert);
                if (spec.requiresImplementation()) {
                  print(color('  ' + spec.description, 'blue') + assertionsGraph);
                }
                else if (spec.passed() && !failuresOnly) {
                  print(color('  ' + spec.description, 'green') + assertionsGraph);
                }
                else if (!spec.passed()) {
                  var s = [];
                  s[0] = color('  ' + spec.description, 'red');
                  s[1] = assertionsGraph;
                  s[2] = "\n";
                  s[3] = indent(map(spec.failures(), function (a) {
                    return a.message;
                  }).join("\n"));
                  s[4] = "\n";
                  print(s.join(''));
                }
              });
              print("");
            }
          });
          quit(results.stats.failures);
        }
      },

      Assertion: function (matcher, actual, expected, negate) {
        extend(this, {
          message: '',
          passed: false,
          actual: actual,
          negate: negate,
          matcher: matcher,
          expected: expected,

          // Report assertion results
          report: function () {
            if (JSpec.assert) {
              if (this.passed) {
                JSpec.stats.passes += 1;
              } else {
                JSpec.stats.failures += 1;
              }
            }
            return this;
          },

          // Run the assertion
          run: function () {
            // TODO: remove unshifting
            expected.unshift(actual);
            this.result = matcher.match.apply(this, expected);
            this.passed = negate ? !this.result : this.result;
            if (!this.passed) {
              this.message = matcher.message.call(this, actual, expected, negate, matcher.name);
            }
            return this;
          }
        });
      },

      ProxyAssertion: function (object, method, times, negate) {
        var self = this;
        var old = object[method];

        // Proxy
        object[method] = function () {
          args = toArray(arguments);
          result = old.apply(object, args);
          self.calls.push({
            args: args,
            result: result
          });
          return result;
        };

        // Times
        this.times = {
          once: 1,
          twice: 2
        }[times] || times || 1;

        extend(this, {
          calls: [],
          message: '',
          defer: true,
          passed: false,
          negate: negate,
          object: object,
          method: method,

          // Proxy return value
          and_return: function (result) {
            this.expectedResult = result;
            return this;
          },

          // Proxy arguments passed
          with_args: function () {
            this.expectedArgs = toArray(arguments);
            return this;
          },

          // Sprite based assertions graph
          assertionsGraph: function () {
            return map(this.assertions, function (assertion) {
              var s = [];
              s[0] = '<span class="assertion ';
              s[1] = assertion.passed ? 'passed' : 'failed';
              s[2] = '"></span>';
              return s.join('');
            }).join('');
          }
        });
      },

      /**
       * Specification Suite block object.
       *
       * @param {string} description
       * @param {function} body
       * @api private
       */

      Suite: function (description, body) {
        var self = this;
        extend(this, {
          body: body,
          description: description,
          suites: [],
          specs: [],
          ran: false,
          hooks: {
            'before': [],
            'after': [],
            'before_each': [],
            'after_each': []
          },

          // Add a spec to the suite
          addSpec: function (description, body) {
            if (!this.ran) {
              var spec = new JSpec.Spec(description, body);
              this.specs.push(spec);
              JSpec.stats.specs += 1; // TODO: abstract
              spec.suite = this;
            }
          },

          // Add a hook to the suite
          addHook: function (hook, body) {
            this.hooks[hook].push(body);
          },

          // Add a nested suite
          addSuite: function (description, body) {
            if (!this.ran) {
              var suite = new JSpec.Suite(description, body);
              JSpec.allSuites.push(suite);
              suite.name = suite.description;
              suite.description = this.description + ' ' + suite.description;
              this.suites.push(suite);
              suite.suite = this;
            }
          },

          // Invoke a hook in context to this suite
          hook: function (hook) {
            // if (this.suite) {
            //   this.suite.hook(hook);
            // }
            each(this.hooks[hook], function (body) {
              var s = [];
              s[0] = "Error in hook '";
              s[1] = hook;
              s[2] = "', suite '";
              s[3] = self.description;
              s[4] = "': ";
              JSpec.evalBody(body, s.join(''));
            });
          },

          // Check if nested suites are present
          hasSuites: function () {
            return this.suites.length;
          },

          // Check if this suite has specs
          hasSpecs: function () {
            return this.specs.length;
          },

          // Check if the entire suite passed
          passed: function () {
            return !any(this.specs, function (spec) {
              return !spec.passed();
            });
          }
        });
      },

      /**
       * Specification block object.
       *
       * @param {string} description
       * @param {function} body
       * @api private
       */

      Spec: function (description, body) {
        extend(this, {
          body: body,
          description: description,
          assertions: [],

          // Add passing assertion
          pass: function (message) {
            this.assertions.push({
              passed: true,
              message: message
            });
            if (JSpec.assert) {
              JSpec.stats.passes += 1;
            }
          },

          // Add failing assertion
          fail: function (message) {
            this.assertions.push({
              passed: false,
              message: message
            });
            if (JSpec.assert) {
              JSpec.stats.failures += 1;
            }
          },

          // Run deferred assertions
          runDeferredAssertions: function () {
            each(this.assertions, function (assertion) {
              if (assertion.defer) {
                assertion.run().report();
                // hook('afterAssertion', assertion);
              }
            });
          },

          // Find first failing assertion
          failure: function () {
            return find(this.assertions, function (assertion) {
              return !assertion.passed;
            });
          },

          // Find all failing assertions
          failures: function () {
            return select(this.assertions, function (assertion) {
              return !assertion.passed;
            });
          },

          // Weither or not the spec passed
          passed: function () {
            return !this.failure();
          },

          // Weither or not the spec requires implementation (no assertions)
          requiresImplementation: function () {
            return this.assertions.length === 0;
          },

          // Sprite based assertions graph
          assertionsGraph: function () {
            return map(this.assertions, function (assertion) {
              var s = [];
              s[0] = '<span class="assertion ';
              s[1] = assertion.passed ? 'passed' : 'failed';
              s[2] = '"></span>';
              return s.join('');
            }).join('');
          }
        });
      },

      Module: function (methods) {
        extend(this, methods);
      },

      JSON: {

        /**
         * Generic sequences.
         */

        meta: {
          '\b': '\\b',
          '\t': '\\t',
          '\n': '\\n',
          '\f': '\\f',
          '\r': '\\r',
          '"': '\\"',
          '\\': '\\\\'
        },

        /**
         * Escapable sequences.
         */

        escapable: /[\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,

        /**
         * JSON encode _object_.
         *
         * @param  {mixed} object
         * @return {string}
         * @api private
         */

        encode: function (object) {
          function enc(a) {
            if (typeof self.meta[a] === 'string') {
              return self.meta[a];
            } else {
              return '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            }

          }
          var self = this;
          if (object === undefined || object === null) {
            return 'null';
          }
          if (object === true) {
            return 'true';
          }
          if (object === false) {
            return 'false';
          }
          switch (typeof object) {
          case 'number':
            return object;
          case 'string':
            if (this.escapable.test(object)) {
              return '"' + object.replace(this.escapable, enc(a)) + '"';
            } else {
              return '"' + object + '"';
            }
            break;
          case 'object':
            if (object.constructor === Array) {
              return '[' + map(object, function (val) {
                return self.encode(val);
              }).join(', ') + ']';
            }
            else if (object) {
              return '{' + map(object, function (key, val) {
                return self.encode(key) + ':' + self.encode(val);
              }).join(', ') + '}';
            }
          }
          return 'null';
        }
      },

      // --- DSLs
      DSLs: {
        snake: {
          describe: function (description, body) {
            return JSpec.currentSuite.addSuite(description, body);
          },

          it: function (description, body) {
            return JSpec.currentSuite.addSpec(description, body);
          },

          before: function (body) {
            return JSpec.currentSuite.addHook('before', body);
          },

          after: function (body) {
            return JSpec.currentSuite.addHook('after', body);
          },

          before_each: function (body) {
            return JSpec.currentSuite.addHook('before_each', body);
          },

          after_each: function (body) {
            return JSpec.currentSuite.addHook('after_each', body);
          },

          should_behave_like: function (description) {
            return JSpec.shareBehaviorsOf(description);
          }
        }
      },
      // --- Methods
      /**
       * Check if _value_ is 'stop'. For use as a
       * utility callback function.
       *
       * @param  {mixed} value
       * @return {bool}
       * @api public
       */

      haveStopped: function (value) {
        return value === 'stop';
      },

      /**
       * Include _object_ which may be a hash or Module instance.
       *
       * @param  {hash, Module} object
       * @return {JSpec}
       * @api public
       */

      include: function (object) {
        var module;
        if (object.constructor === JSpec.Module) {
          module = object;
        } else {
          module = new JSpec.Module(object);
        }

        this.modules.push(module);
        if ('init' in module) {
          module.init();
        }
        if ('utilities' in module) {
          extend(this.defaultContext, module.utilities);
        }
        if ('matchers' in module) {
          this.addMatchers(module.matchers);
        }
        if ('reporters' in module) {
          extend(this.reporters, module.reporters);
        }
        if ('DSLs' in module) {
          each(module.DSLs, function (name, methods) {
            JSpec.DSLs[name] = JSpec.DSLs[name] || {};
            extend(JSpec.DSLs[name], methods);
          });
        }
        return this;
      },

      /**
       * Add a module hook _name_, which is immediately
       * called per module with the _args_ given. An array of
       * hook return values is returned.
       *
       * @param  {name} string
       * @param  {...} args
       * @return {array}
       * @api private
       */

      hook: function (name, args) {
        JSpec.stats.hooks += 1;
        args = toArray(arguments, 1);
        return inject(JSpec.modules, [], function (results, module) {
          if (typeof module[name] === 'function') {
            results.push(JSpec.evalHook(module, name, args));
          }
        });
      },

      /**
       * Eval _module_ hook _name_ with _args_. Evaluates in context
       * to the module itself, JSpec, and JSpec.context.
       *
       * @param  {Module} module
       * @param  {string} name
       * @param  {array} args
       * @return {mixed}
       * @api private
       */

      evalHook: function (module, name, args) {
        try {
          return module[name].apply(module, args);
        }
        catch (e) {
          error('Error in hook ' + module.name + '.' + name + ': ', e);
        }
      },

      /**
       * Same as hook() however accepts only one _arg_ which is
       * considered immutable. This function passes the arg
       * to the first module, then passes the return value of the last
       * module called, to the following module.
       *
       * @param  {string} name
       * @param  {mixed} arg
       * @return {mixed}
       * @api private
       */

      hookImmutable: function (name, arg) {
        return inject(JSpec.modules, arg, function (result, module) {
          if (typeof module[name] === 'function') {
            return JSpec.evalHook(module, name, [result]);
          }
        });
      },

      /**
       * Find a suite by its description or name.
       *
       * @param  {string} description
       * @return {Suite}
       * @api private
       */

      findSuite: function (description) {
        return find(this.allSuites, function (suite) {
          return suite.name === description || suite.description === description;
        });
      },

      /**
       * Share behaviors (specs) of the given suite with
       * the current suite.
       *
       * @param  {string} description
       * @api public
       */

      shareBehaviorsOf: function (description) {
        var suite = this.findSuite(description);
        if (suite) {
          this.copySpecs(suite, this.currentSuite);
        } else {
          var s = [];
          s[0] = 'failed to share behaviors. ';
          s[1] = puts(description);
          s[2] = ' is not a valid Suite name';
          throw s.join('');
        }
      },

      /**
       * Copy specs from one suite to another.
       *
       * @param  {Suite} fromSuite
       * @param  {Suite} toSuite
       * @api public
       */

      copySpecs: function (fromSuite, toSuite) {
        each(fromSuite.specs, function (spec) {
          var newSpec = {};
          extend(newSpec, spec);
          newSpec.assertions = [];
          toSuite.specs.push(newSpec);
        });
      },

      /**
       * Convert arguments to an array.
       *
       * @param  {object} arguments
       * @param  {int} offset
       * @return {array}
       * @api public
       */

      toArray: function (args, offset) {
        return Array.prototype.slice.call(args, offset || 0);
      },

      /**
       * Return ANSI-escaped colored string.
       *
       * @param  {string} string
       * @param  {string} color
       * @return {string}
       * @api public
       */

      color: function (string, color) {
        return "\u001B[" + {
          bold: 1,
          black: 30,
          red: 31,
          green: 32,
          yellow: 33,
          blue: 34,
          magenta: 35,
          cyan: 36,
          white: 37
        }[color] + 'm' + string + '\u001B[0m';
      },

      /**
       * Default matcher message callback.
       *
       * @api private
       */

      defaultMatcherMessage: function (actual, expected, negate, name) {
        var s = [];
        s[0] = 'expected ';
        s[1] = puts(actual);
        s[2] = ' to ';
        s[3] = negate ? 'not ' : '';
        s[4] = name.replace(/_/g, ' ');
        s[5] = ' ';
        s[6] = expected.length > 1 ? puts.apply(this, expected.slice(1)) : '';
        return s.join('');
      },

      /**
       * Normalize a matcher message.
       *
       * When no messge callback is present the defaultMatcherMessage
       * will be assigned, will suffice for most matchers.
       *
       * @param  {hash} matcher
       * @return {hash}
       * @api public
       */

      normalizeMatcherMessage: function (matcher) {
        if (typeof matcher.message !== 'function') {
          matcher.message = this.defaultMatcherMessage;
        }
        return matcher;
      },

      /**
       * Normalize a matcher body
       *
       * This process allows the following conversions until
       * the matcher is in its final normalized hash state.
       *
       * - '==' becomes 'actual == expected'
       * - 'actual == expected' becomes 'return actual == expected'
       * - function(actual, expected) { return actual == expected } becomes
       *   { match : function(actual, expected) { return actual == expected }}
       *
       * @param  {mixed} body
       * @return {hash}
       * @api public
       */

      normalizeMatcherBody: function (body) {
        switch (body.constructor) {
        case String:
          var captures = body.match(/^alias (\w+)/);
          if (captures) {
            return JSpec.matchers[last(captures)];
          }
          if (body.length < 4) {
            body = 'actual ' + body + ' expected';
          }
          return {
            match: function (actual, expected) {
              return eval(body);
            }
          };

        case Function:
          return {
            match: body
          };

        default:
          return body;
        }
      },

      /**
       * Get option value. This method first checks if
       * the option key has been set via the query string,
       * otherwise returning the options hash value.
       *
       * @param  {string} key
       * @return {mixed}
       * @api public
       */

      option: function (key) {
        return (value = query(key)) !== null ? value : JSpec.options[key] || null;
      },

      /**
       * Check if object _a_, is equal to object _b_.
       *
       * @param  {object} a
       * @param  {object} b
       * @return {bool}
       * @api private
       */

      equal: function (a, b) {
        if (typeof a !== typeof b) {
          return;
        }
        if (a === b) {
          return true;
        }
        if (a instanceof RegExp) {
          return a.toString() === b.toString();
        }
        if (a instanceof Date) {
          return Number(a) === Number(b);
        }
        if (typeof a !== 'object') {
          return;
        }
        if (a.length !== undefined) {
          if (a.length !== b.length) {
            return;
          }
          else {
            for (var i = 0, len = a.length; i < len; i += 1) {
              if (!equal(a[i], b[i])) {
                return;
              }
            }
          }
        }
        for (var key in a) {
          if (!equal(a[key], b[key])) {
            return;
          }
        }
        return true;
      },

      /**
       * Return last element of an array.
       *
       * @param  {array} array
       * @return {object}
       * @api public
       */

      last: function (array) {
        return array[array.length - 1];
      },

      /**
       * Convert object(s) to a print-friend string.
       *
       * @param  {...} object
       * @return {string}
       * @api public
       */

      puts: function (object) {
        if (arguments.length > 1) {
          return map(toArray(arguments), function (arg) {
            return puts(arg);
          }).join(', ');
        }
        if (object === undefined) {
          return 'undefined';
        }
        if (object === null) {
          return 'null';
        }
        if (object === true) {
          return 'true';
        }
        if (object === false) {
          return 'false';
        }
        if (object.an_instance_of) {
          return 'an instance of ' + object.an_instance_of.name;
        }
        if (object.jquery && object.selector.length > 0) {
          return 'selector ' + puts(object.selector);
        }
        if (object.jquery) {
          return object.get(0).outerHTML;
        }
        if (object.nodeName) {
          return object.outerHTML;
        }
        switch (object.constructor) {
        case Function:
          return object.name || object;
        case String:
          object = object.replace(/"/g, '\\"');
          object = object.replace(/\n/g, '\\n').replace(/\t/g, '\\t');
          return '"' + object + '"';
        case Array:
          return inject(object, '[', function (b, v) {
            return b + ', ' + puts(v);
          }).replace('[,', '[') + ' ]';
        case Object:
          object.__hit__ = true;
          return inject(object, '{', function (b, k, v) {
            if (k === '__hit__') {
              return b;
            }
            var s = [];
            s[0] = b;
            s[1] = ', ';
            s[2] = k;
            s[3] = ': ';
            s[4] = v && v.__hit__ ? '<circular reference>' : puts(v);
            return s.join('');
          }).replace('{,', '{') + ' }';
        default:
          return object.toString();
        }
      },

      /**
       * Escape HTML.
       *
       * @param  {string} html
       * @return {string}
       * @api public
       */

      escape: function (html) {
        var html_str = html.toString();
        html_str = html_str.replace(/&/gmi, '&amp;');
        html_str = html_str.replace(/"/gmi, '&quot;');
        html_str = html_str.replace(/>/gmi, '&gt;');
        html_str = html_str.replace(/</gmi, '&lt;');
        return html_str;
      },

      /**
       * Perform an assertion without reporting.
       *
       * This method is primarily used for internal
       * matchers in order retain DRYness. May be invoked
       * like below:
       *
       *   does('foo', 'eql', 'foo')
       *   does([1,2], 'include', 1, 2)
       *
       * External hooks are not run for internal assertions
       * performed by does().
       *
       * @param  {mixed} actual
       * @param  {string} matcher
       * @param  {...} expected
       * @return {mixed}
       * @api private
       */

      does: function (actual, matcher, expected) {
        var m = JSpec.matchers[matcher];
        var assertion = new JSpec.Assertion(m, actual, toArray(arguments, 2));
        return assertion.run().result;
      },

      /**
       * Perform an assertion.
       *
       *   expect(true).to('be', true)
       *   expect('foo').not_to('include', 'bar')
       *   expect([1, [2]]).to('include', 1, [2])
       *
       * @param  {mixed} actual
       * @return {hash}
       * @api public
       */

      expect: function (actual) {
        function assert(matcher, args, negate) {
          var expected = toArray(args, 1);
          matcher.negate = negate;
          assertion = new JSpec.Assertion(matcher, actual, expected, negate);
          if (matcher.defer) {
            assertion.run();
          }
          else {
            JSpec.currentSpec.assertions.push(assertion.run().report());
          }
          return assertion.result;
        }

        function to(matcher) {
          return assert(matcher, arguments, false);
        }

        function not_to(matcher) {
          return assert(matcher, arguments, true);
        }

        return {
          to: to,
          should: to,
          not_to: not_to,
          should_not: not_to
        };
      },

      /**
       * Strim whitespace or chars.
       *
       * @param  {string} string
       * @param  {string} chars
       * @return {string}
       * @api public
       */

      strip: function (string, chars) {
        return string.
        replace(new RegExp('[' + (chars || '\\s') + ']*$'), '').
        replace(new RegExp('^[' + (chars || '\\s') + ']*'), '');
      },

      /**
       * Call an iterator callback with arguments a, or b
       * depending on the arity of the callback.
       *
       * @param  {function} callback
       * @param  {mixed} a
       * @param  {mixed} b
       * @return {mixed}
       * @api private
       */

      callIterator: function (callback, a, b) {
        return callback.length === 1 ? callback(b) : callback(a, b);
      },

      /**
       * Extend an object with another.
       *
       * @param  {object} object
       * @param  {object} other
       * @api public
       */

      extend: function (object, other) {
        each(other, function (property, value) {
          object[property] = value;
        });
      },

      /**
       * Iterate an object, invoking the given callback.
       *
       * @param  {hash, array} object
       * @param  {function} callback
       * @return {JSpec}
       * @api public
       */

      each: function (object, callback) {
        if (object.constructor === Array) {
          for (var i = 0, len = object.length; i < len; i += 1) {
            callIterator(callback, i, object[i]);
          }
        } else {
          for (var key in object) {
            if (object.hasOwnProperty(key)) {
              callIterator(callback, key, object[key]);
            }
          }
        }
      },

      /**
       * Iterate with memo.
       *
       * @param  {hash, array} object
       * @param  {object} memo
       * @param  {function} callback
       * @return {object}
       * @api public
       */

      inject: function (object, memo, callback) {
        each(object, function (key, value) {
          var memo_one;
          if (callback.length === 2) {
            memo_one = callback(memo, value);
          } else {
            memo_one = callback(memo, key, value);
          }
          memo = memo_one || memo;
        });
        return memo;
      },

      /**
       * Destub _object_'s _method_. When no _method_ is passed
       * all stubbed methods are destubbed. When no arguments
       * are passed every object found in JSpec.stubbed will be
       * destubbed.
       *
       * @param  {mixed} object
       * @param  {string} method
       * @api public
       */

      destub: function (object, method) {
        if (method) {
          if (object['__prototype__' + method]) {
            delete object[method];
          }
          else {
            object[method] = object['__original__' + method];
          }

          delete object['__prototype__' + method];
          delete object['__original____' + method];
        }
        else if (object) {
          for (var key in object) {
            if (object.hasOwnProperty(key)) {
              var captures = key.match(/^(?:__prototype__|__original__)(.*)/);
              if (captures) {
                destub(object, captures[1]);
              }
            }
          }
        }
        else {
          while (JSpec.stubbed.length) {
            destub(JSpec.stubbed.shift());
          }
        }
      },

      /**
       * Stub _object_'s _method_.
       *
       * stub(foo, 'toString').and_return('bar')
       *
       * @param  {mixed} object
       * @param  {string} method
       * @return {hash}
       * @api public
       */

      stub: function (object, method) {
        hook('stubbing', object, method);
        JSpec.stubbed.push(object);
        var type;
        if (object.hasOwnProperty(method)) {
          type = '__original__';
        } else {
          type = '__prototype__';
        }

        object[type + method] = object[method];
        object[method] = function () {};
        return {
          and_return: function (value) {
            if (typeof value === 'function') {
              object[method] = value;
            }
            else {
              object[method] = function () {
                return value;
              };
            }
          }
        };
      },

      /**
       * Map callback return values.
       *
       * @param  {hash, array} object
       * @param  {function} callback
       * @return {array}
       * @api public
       */

      map: function (object, callback) {
        return inject(object, [], function (memo, key, value) {
          memo.push(callIterator(callback, key, value));
        });
      },

      /**
       * Returns the first matching expression or null.
       *
       * @param  {hash, array} object
       * @param  {function} callback
       * @return {mixed}
       * @api public
       */

      any: function (object, callback) {
        return inject(object, null, function (state, key, value) {
          if (state === null) {
            return callIterator(callback, key, value) ? value : state;
          }
        });
      },

      /**
       * Returns an array of values collected when the callback
       * given evaluates to true.
       *
       * @param  {hash, array} object
       * @return {function} callback
       * @return {array}
       * @api public
       */

      select: function (object, callback) {
        return inject(object, [], function (selected, key, value) {
          if (callIterator(callback, key, value)) {
            selected.push(value);
          }
        });
      },

      /**
       * Define matchers.
       *
       * @param  {hash} matchers
       * @api public
       */

      addMatchers: function (matchers) {
        each(matchers, function (name, body) {
          JSpec.addMatcher(name, body);
        });
      },

      /**
       * Define a matcher.
       *
       * @param  {string} name
       * @param  {hash, function, string} body
       * @api public
       */

      addMatcher: function (name, body) {
        if (name.indexOf(' ') !== -1) {
          var matchers = name.split(/\s+/);
          var prefix = matchers.shift();
          each(matchers, function (name) {
            JSpec.addMatcher(prefix + '_' + name, body(name));
          });
        }
        var n = this.normalizeMatcherMessage(this.normalizeMatcherBody(body));
        this.matchers[name] = n;
        this.matchers[name].name = name;
      },

      /**
       * Add a root suite to JSpec.
       *
       * @param  {string} description
       * @param  {body} function
       * @api public
       */

      describe: function (description, body) {
        var suite = new JSpec.Suite(description, body);
        this.allSuites.push(suite);
        this.suites.push(suite);
      },

      /**
       * Return the contents of a function body.
       *
       * @param  {function} body
       * @return {string}
       * @api public
       */

      contentsOf: function (body) {
        return body.toString().match(/^[^\{]*\{((.*\n*)*)}/m)[1];
      },

      /**
       * Evaluate a JSpec capture body.
       *
       * @param  {function} body
       * @param  {string} errorMessage (optional)
       * @return {Type}
       * @api private
       */

      evalBody: function (body, errorMessage) {
        var dsl = this.DSL || this.DSLs.snake;
        var matchers = this.matchers;
        var context = this.context || this.defaultContext;
        var contents = this.contentsOf(body);
        try {
          with(JSpec) {
            with(dsl) {
              with(context) {
                with(matchers) {
                  eval(contents);
                }
              }
            }
          }
        }
        catch (e) {
          error(errorMessage, e);
        }
      },

      /**
       * Pre-process a string of JSpec.
       *
       * @param  {string} input
       * @return {string}
       * @api private
       */

      preprocess: function (input) {
        return input;
      },


      /**
       * Create a range string which can be evaluated to a native array.
       *
       * @param  {int} start
       * @param  {int} end
       * @return {string}
       * @api public
       */

      range: function (start, end) {
        var current = parseInt(start, 10);
        end = parseInt(end, 10);
        var values = [current];
        if (end > current) {
          for (current += 1; current <= end; current += 1) {
            values.push(current);
          }
        }
        else {
          for (current -= 1; current <= end; current -= 1) {
            values.push(current);
          }
        }
        return '[' + values + ']';
      },

      /**
       * Report on the results.
       *
       * @api public
       */

      report: function () {
        this.duration = Number(new Date()) - this.start;
        JSpec.options.reporter(JSpec, JSpec.options);
      },

      /**
       * Run the spec suites. Options are merged
       * with JSpec options when present.
       *
       * @param  {hash} options
       * @return {JSpec}
       * @api public
       */

      run: function (options) {
        if (any(hook('running'), haveStopped)) {
          return this;
        }
        if (options) {
          extend(this.options, options);
        }
        this.start = Number(new Date());
        each(this.suites, function (suite) {
          JSpec.runSuite(suite);
        });
        return this;
      },

      /**
       * Run a suite.
       *
       * @param  {Suite} suite
       * @api public
       */

      runSuite: function (suite) {
        this.currentSuite = suite;
        this.evalBody(suite.body);
        hook('beforeSuite', suite);
        suite.hook('before');
        each(suite.specs, function (spec) {
          hook('beforeSpec', spec);
          suite.hook('before_each');
          JSpec.runSpec(spec);
          hook('afterSpec', spec);
          suite.hook('after_each');
        });
        if (suite.hasSuites()) {
          each(suite.suites, function (suite) {
            JSpec.runSuite(suite);
          });
        }
        hook('afterSuite', suite);
        suite.hook('after');
        this.stats.suitesFinished += 1;
        suite.ran = true;
      },

      /**
       * Report a failure for the current spec.
       *
       * @param  {string} message
       * @api public
       */

      fail: function (message) {
        JSpec.currentSpec.fail(message);
      },

      /**
       * Report a passing assertion for the current spec.
       *
       * @param  {string} message
       * @api public
       */

      pass: function (message) {
        JSpec.currentSpec.pass(message);
      },

      /**
       * Run a spec.
       *
       * @param  {Spec} spec
       * @api public
       */

      runSpec: function (spec) {
        this.currentSpec = spec;
        try {
          this.evalBody(spec.body);
        }
        catch (e) {
          fail(e);
        }
        spec.runDeferredAssertions();
        destub();
        this.stats.specsFinished += 1;
        this.stats.assertions += spec.assertions.length;
      },

      /**
       * Require a dependency, with optional message.
       *
       * @param  {string} dependency
       * @param  {string} message (optional)
       * @return {JSpec}
       * @api public
       */

      requires: function (dependency, message) {
        try {
          eval(dependency);
        }
        catch (e) {
          throw 'JSpec depends on ' + dependency + ' ' + message;
        }
        return this;
      },

      /**
       * Query against the current query strings keys
       * or the queryString specified.
       *
       * @param  {string} key
       * @param  {string} queryString
       * @return {string, null}
       * @api private
       */

      query: function (key, queryString) {
        var search = main.location ? main.location.search : null;
        queryString = (queryString || search || '').substring(1);
        return inject(queryString.split('&'), null, function (value, pair) {
          parts = pair.split('=');
          return parts[0] === key ? parts[1].replace(/%20|\+/gmi, ' ') : value;
        });
      },

      /**
       * Throw a JSpec related error.
       *
       * @param {string} message
       * @param {Exception} e
       * @api public
       */

      error: function (message, e) {
        var s = [];
        s[0] = message ? message : '';
        s[1] = e.toString();
        s[2] = e.line ? ' near line ' + e.line : '';
        throw s.join('');
      },

      /**
       * Ad-hoc POST request for JSpec server usage.
       *
       * @param  {string} uri
       * @param  {string} data
       * @api private
       */

      post: function (uri, data) {
        if (any(hook('posting', uri, data), haveStopped)) {
          return;
        }
        var request = this.xhr();
        request.open('POST', uri, false);
        request.setRequestHeader('Content-Type', 'application/json');
        request.send(JSpec.JSON.encode(data));
      },

      /**
       * Instantiate an XMLHttpRequest.
       *
       * Here we utilize IE's lame ActiveXObjects first which
       * allow IE access serve files via the file: protocol, otherwise
       * we then default to XMLHttpRequest.
       *
       * @return {XMLHttpRequest, ActiveXObject}
       * @api private
       */

      xhr: function () {
        return this.ieXhr() || new JSpec.request();
      },

      /**
       * Return Microsoft piece of crap ActiveXObject.
       *
       * @return {ActiveXObject}
       * @api public
       */

      ieXhr: function () {
        function object(str) {
          try {
            return new ActiveXObject(str);
          } catch (e) {}
        }
        return object('Msxml2.XMLHTTP.6.0') || object('Msxml2.XMLHTTP.3.0') || object('Msxml2.XMLHTTP') || object('Microsoft.XMLHTTP');
      },

      /**
       * Check for HTTP request support.
       *
       * @return {bool}
       * @api private
       */

      hasXhr: function () {
        return JSpec.request || 'ActiveXObject' in main;
      },

      /**
       * Try loading _file_ returning the contents
       * string or null. Chain to locate / read a file.
       *
       * @param  {string} file
       * @return {string}
       * @api public
       */

      tryLoading: function (file) {
        try {
          return JSpec.load(file);
        } catch (e) {}
      },

      /**
       * Load a _file_'s contents.
       *
       * @param  {string} file
       * @param  {function} callback
       * @return {string}
       * @api public
       */

      load: function (file, callback) {
        if (any(hook('loading', file), haveStopped)) {
          return;
        }
        if ('readFile' in main) {
          return readFile(file);
        }
        else if (this.hasXhr()) {
          var request = this.xhr();
          request.open('GET', file, false);
          request.send(null);
          if (request.readyState === 4 && (request.status === 0 || request.status.toString().charAt(0) === '2')) {
            return request.responseText;
          }
        }
        else {
          error("failed to load `" + file + "'");
        }
      },

      /**
       * Load, pre-process, and evaluate a file.
       *
       * @param {string} file
       * @param {JSpec}
       * @api public
       */

      exec: function (file) {
        if (any(hook('executing', file), haveStopped)) {
          return this;
        }
        eval('with (JSpec){' + this.preprocess(this.load(file)) + '}');
        return this;
      }
    };

    // --- Node.js support
    if (typeof GLOBAL === 'object' && typeof exports === 'object') {
      quit = process.exit;
      print = require('sys').puts;
      readFile = require('fs').readFileSync;
    }

    // --- Utility functions
    var main = this,
      find = JSpec.any,
      utils = 'haveStopped stub hookImmutable hook destub map any last pass fail range each option inject select error escape extend puts query strip color does addMatchers callIterator toArray equal'.split(/\s+/);
    while (utils.length) {
      eval('var ' + utils[0] + ' = JSpec.' + utils.shift());
    }
    if (!main.setTimeout) {
      main.setTimeout = function (callback) {
        callback();
      };
    }

    // --- Matchers
    addMatchers({
      equal: "===",
      eql: "equal(actual, expected)",
      be: "alias equal",
      be_greater_than: ">",
      be_less_than: "<",
      be_at_least: ">=",
      be_at_most: "<=",
      be_a: "actual.constructor == expected",
      be_an: "alias be_a",
      be_an_instance_of: "actual instanceof expected",
      be_null: "actual == null",
      be_true: "actual == true",
      be_false: "actual == false",
      be_undefined: "typeof actual == 'undefined'",
      be_type: "typeof actual == expected",
      match: "typeof actual == 'string' ? actual.match(expected) : false",
      respond_to: "typeof actual[expected] == 'function'",
      have_length: "actual.length == expected",
      be_within: "actual >= expected[0] && actual <= last(expected)",
      have_length_within: "actual.length >= expected[0] && actual.length <= last(expected)",

      receive: {
        defer: true,
        match: function (actual, method, times) {
          proxy = new JSpec.ProxyAssertion(actual, method, times, this.negate);
          JSpec.currentSpec.assertions.push(proxy);
          return proxy;
        }
      },

      be_empty: function (actual) {
        if (actual.constructor === Object && actual.length === undefined) {
          for (var key in actual) {
            if (actual.hasOwnProperty(key)) {
              return false;
            }
          }
        }
        return !actual.length;
      },

      include: function (actual) {
        for (state = true, i = 1; i < arguments.length; i += 1) {
          arg = arguments[i];
          switch (actual.constructor) {
          case String:
          case Number:
          case RegExp:
          case Function:
            state = actual.toString().indexOf(arg) !== -1;
            break;

          case Object:
            state = arg in actual;
            break;

          case Array:
            state = any(actual, function (value) {
              return equal(value, arg);
            });
            break;
          }
          if (!state) {
            return false;
          }
        }
        return true;
      },

      throw_error: {
        match: function (actual, expected, message) {
          try {
            actual();
          }
          catch (e) {
            this.e = e;
            var assert = function (arg) {
              switch (arg.constructor) {
              case RegExp:
                return arg.test(e.message || e.toString());
              case String:
                return arg === (e.message || e.toString());
              case Function:
                return e instanceof arg || e.name === arg.name;
              }
            };
            if (message) {
              return assert(expected) && assert(message);
            } else {
              return expected ? assert(expected) : true;
            }
          }
        },
        message: function (actual, expected, negate) {
          // TODO: refactor when actual is not in expected [0]
          var message_for = function (i) {
            if (expected[i] === undefined) {
              return 'exception';
            }
            switch (expected[i].constructor) {
            case RegExp:
              return 'exception matching ' + puts(expected[i]);
            case String:
              return 'exception of ' + puts(expected[i]);
            case Function:
              return expected[i].name || 'Error';
            }
          };
          if (expected[2]) {
            exception = message_for(1) + ' and ' + message_for(2);
          } else {
            exception = message_for(1);
          }
          var s = [];
          s[0] = 'expected ';
          s[1] = exception;
          s[2] = negate ? ' not ' : '';
          s[3] = ' to be thrown, but ';
          s[4] = this.e ? 'got ' + puts(this.e) : 'nothing wasf';
          return s.join('');
        }
      },

      have: function (actual, length, property) {
        return actual[property].length === length;
      },

      have_at_least: function (actual, length, property) {
        return actual[property].length >= length;
      },

      have_at_most: function (actual, length, property) {
        return actual[property].length <= length;
      },

      have_within: function (actual, range, property) {
        length = actual[property].length;
        return length >= range.shift() && length <= range.pop();
      },

      have_prop: function (actual, property, value) {
        return actual[property] === null || actual[property] instanceof Function ? false : value === null ? true : does(actual[property], 'eql', value);
      },

      have_property: function (actual, property, value) {
        return actual[property] === null || actual[property] instanceof Function ? false : value === null ? true : value === actual[property];
      }
    });
  })();
  JSpec.include({
    name: 'Repeat Run',
    beforeSpec: function (s) {
      s.assertions = [];
    }
  });


  JSpec.include({
    name: 'prototype_matcher',

    matchers: {
      has_tag: "$(actual).tagName === expected",
      has_child: "$(actual).childElementCount === 1",
      has_children: "$(actual).childElementCount > 1",
      has_class: "$(actual).hasClassName(expected)",

      be_visible: function (actual) {
        var ds = $(actual).getStyle('display');
        var zs = $(actual).getStyle('z-index');
        return ds !== 'none' || (zs === '1' && ds === 'block');
      },

      be_hidden: function (actual) {
        var ds = $(actual).getStyle('display');
        var zs = $(actual).getStyle('z-index');
        return ds === 'none' || (zs === '0' && ds === 'block');
      },

      has_classes: function (actual) {
        return !JSpec.any(JSpec.toArray(arguments, 1), function (arg) {
          return !JSpec.does(actual, 'has_class', arg);
        });
      },

      has_attr: function (actual, attr, value) {
        return value ? $(actual).hasAttribute(attr) && $(actual).getAttribute(attr) === value : $(actual).hasAttribute(attr);
      }
    }
  });

  var dev = {
    run: function (suite) {
      $('bubble').style.display = 'none';
      $('jspec').style.display = 'none';
      JSpec.runSuite(suite);
      JSpec.report();
      $('bubble').style.display = 'inline-block';
      $('jspec').show();
    },
    exesuite: function (name) {
      JSpec.options.reporter = JSpec.reporters.DOM;
      JSpec.options.failuresOnly = true;
      JSpec.options.fixturePath = '/spec/fixtures';
      JSpec.start = Number(new Date());
      var s = JSpec.findSuite(name);
      if (s !== null) {
        this.run(s);
      } else {
        JSpec.exec('/spec/' + name + '.spec.js');
        var si = JSpec.findSuite(name);
        if (si !== null) {
          this.run(si);
        }
      }
    }
  };
  var pusher = new Pusher.Client("/pusher", "cmd", function (cmd) {
    this.request = 'XMLHttpRequest' in window ? XMLHttpRequest : null;

    this.ieXhr = function () {
      function object(str) {
        try {
          return new ActiveXObject(str);
        } catch (e) {}
      }
      return object('Msxml2.XMLHTTP.6.0') || object('Msxml2.XMLHTTP.3.0') || object('Msxml2.XMLHTTP') || object('Microsoft.XMLHTTP');
    };

    this.hasXhr = function () {
      return this.request || 'ActiveXObject' in this;
    };

    this.xhr = function () {
      return this.ieXhr() || new this.request();
    };

    if (cmd.match(/\.js/)) {
      if (this.hasXhr()) {
        var request = this.xhr();
        request.open('GET', cmd, false);
        request.send(null);
        if (request.readyState === 4 && (request.status === 0 || request.status.toString().charAt(0) === '2')) {
          eval(request.responseText);
        }
      }
    } else {
      eval(cmd);
    }
  });

})();