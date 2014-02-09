(function (window, undefined) {

var document   = window.document
  , _briickless   = window.briickless
  , _$         = window.$
  , idExp      = /^#([\w\-]*)$/
  , classExp   = /^\.([\w\-]*)$/
  , tagNameExp = /^[\w\-]+$/
  , tagExp     = /^<([\w:]+)/
  , slice      = [].slice
  , splice     = [].splice
  , noop       = function () {};

try {
  slice.call(document.childNodes);
} catch(e) {
  slice = function (i, e) {
    i = i || 0;
    var el, results = [];
    for (; (el = this[i]); i++) {
      if (i === e) break;
      results.push(el);
    }
    return results;
  };
}

var briickless = function (selector, context) {
  return new briickless.fn.find(selector, context);
};

briickless.fn = briickless.prototype = {

  length: 0,

  extend: function (o) {
    for (var k in o) {
      this[k] = o[k];
    }
  },

  each: function(target, callback) {
    var i, key;

    if (typeof target === 'function') {
      callback = target;
      target = this;
    }

    if (target === this || target instanceof Array) {
      for (i = 0; i < target.length; ++i) {
        if (callback.call(target[i], i, target[i]) === false) break;
      }
    } else {
      if (target instanceof briickless) {
        return briickless.each(slice.call(target), callback);
      } else if (briickless.isObject(target)) {
        for (key in target) {
          if (target.hasOwnProperty(key) && callback.call(target[key], key, target[key]) === false) break;
        }
      }
    }

    return target;
  },

  set: function (elements) {
    var i = 0, set = briickless();
    set.selector = this.selector;
    set.context = this.context;
    for (; i < elements.length; i++) {
      set[i] = elements[i];
    }
    set.length = i;
    return set;
  },

  find: function (selector, context) {
    var els = [], attrs;

    if (!selector) {
      return this;
    }

    if (briickless.isFunction(selector)) {
      return briickless.ready(selector);
    }

    if (selector.nodeType) {
      this.selector = '';
      this.context = selector;
      return this.set([selector]);
    }

    if (selector.length === 1 && selector[0].nodeType) {
      this.selector = this.context = selector[0];
      return this.set(selector);
    }

    context = this.context ? this.context : (context || document);

    if (briickless.isPlainObject(context)) {
      attrs = context;
      context = document;
    }

    if (context instanceof briickless) {
      context = context.context;
    }

    if (briickless.isString(selector)) {
      this.selector = selector;
      if (idExp.test(selector) && context.nodeType === context.DOCUMENT_NODE) {
        els = (els = context.getElementById(selector.substr(1))) ? [els] : [];
      } else if (context.nodeType !== 1 && context.nodeType !== 9) {
        els = [];
      } else if (tagExp.test(selector)) {
        briickless.each(normalize(selector), function () {
          els.push(this);
        });
      } else {
        els = slice.call(
          classExp.test(selector) && context.getElementsByClassName !== undefined ? context.getElementsByClassName(selector.substr(1)) :
          tagNameExp.test(selector) ? context.getElementsByTagName(selector) :
          context.querySelectorAll(selector)
        );
      }
    } else if (selector.nodeName || selector === window) {
      els = [selector];
    } else if (briickless.isArray(selector)) {
      els = selector;
    }

    if (selector.selector !== undefined) {
      this.selector = selector.selector;
      this.context = selector.context;
    } else if (this.context === undefined) {
      if (els[0] !== undefined && !briickless.isString(els[0])) {
        this.context = els[0];
      } else {
        this.context = document;
      }
    }

    return this.set(els).each(function () {
      return attrs && briickless(this).attr(attrs);
    });
  }
};

briickless.extend = function () {
  var target = arguments[0] || {};

  if (typeof target !== 'object' && typeof target !== 'function') {
    target = {};
  }

  if (arguments.length === 1) target = this;

  briickless.fn.each(slice.call(arguments), function (i, value) {
    for (var key in value) {
      if (target[key] !== value[key]) target[key] = value[key];
    }
  });

  return target;
};

briickless.fn.find.prototype = briickless.fn;

briickless.extend({

  each: briickless.fn.each,

  isFunction: function (obj) {
    return typeof obj === 'function';
  },

  isArray: function (obj) {
    return obj instanceof Array;
  },

  isString: function (obj) {
    return typeof obj === 'string';
  },

  isNumeric: function (obj) {
    return typeof obj === 'number';
  },

  isObject: function (obj) {
    return obj instanceof Object && !this.isArray(obj) && !this.isFunction(obj) && !this.isWindow(obj);
  },

  isPlainObject: function (obj) {
    if (!obj || !this.isObject(obj) || this.isWindow(obj) || obj.nodeType) {
      return false;
    } else if (obj.__proto__ === Object.prototype) {
      return true;
    } else {
      var key;
      for (key in obj) {}
      return key === undefined || {}.hasOwnProperty.call(obj, key);
    }
  },

  isWindow: function (obj) {
    return obj !== null && obj !== undefined && (obj === obj.window || 'setInterval' in obj);
  },

  inArray: function (val, arr, i) {
    return Array.prototype.indexOf ? arr.indexOf(val, i) : function () {
        var l = arr.length;
        i = i ? i < 0 ? Math.max(0, l + i) : i : 0;
        for (; i < l; i++) if (i in arr && arr[i] === val) return true;
        return -1;
      }();
  },

  contains: function (parent, node) {
    return parent.contains ? parent != node && parent.contains(node) : !!(parent.compareDocumentPosition(node) & 16);
  },

  matches: function (el, selector) {
    if (!el || el.nodeType !== 1) return false;
    var matchesSelector = el.webkitMatchesSelector || el.mozMatchesSelector || el.oMatchesSelector || el.matchesSelector;
    if (matchesSelector) {
      return matchesSelector.call(el, selector);
    }
    if (document.querySelectorAll !== undefined) {
      var nodes = el.parentNode.querySelectorAll(selector);

      for (var i = 0; i < nodes.length; i++) {
        if (nodes[i] === el) return true;
      }
    }

    return false;
  },

  parseJSON: function (str) {
    if (!this.isString(str) || !str) {
      return null;
    }

    str = this.trim(str);

    if (window.JSON && window.JSON.parse) {
      return window.JSON.parse(str);
    }

    try { return (new Function('return ' + str))(); }
    catch (e) { return null; }
  },

  noConflict: function (name) {
    if (name) {
      window.briickless = _briickless;
    }

    window.$ = _$;
    return briickless;
  },

  pluck: function (prop) {
    var result = [];
    this.each(function () {
      if (this[prop]) result.push(this[prop]);
    });
    return result;
  },

  trim: function (str) {
    return str == null ? '' : str.trim ? str.trim() : ('' + str).replace(/^\s+|\s+$/g, '');
  }

});