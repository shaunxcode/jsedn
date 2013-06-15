;(function(){

/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module.exports) {
    module.exports = {};
    module.client = module.component = true;
    module.call(this, module.exports, require.relative(resolved), module);
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);
  var index = path + '/index.js';

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
  }

  if (require.aliases.hasOwnProperty(index)) {
    return require.aliases[index];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("jkroso-type/index.js", function(exports, require, module){

/**
 * refs
 */

var toString = Object.prototype.toString;

/**
 * Return the type of `val`.
 *
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

module.exports = function(v){
  // .toString() is slow so try avoid it
  return typeof v === 'object'
    ? types[toString.call(v)]
    : typeof v
};

var types = {
  '[object Function]': 'function',
  '[object Date]': 'date',
  '[object RegExp]': 'regexp',
  '[object Arguments]': 'arguments',
  '[object Array]': 'array',
  '[object String]': 'string',
  '[object Null]': 'null',
  '[object Undefined]': 'undefined',
  '[object Number]': 'number',
  '[object Boolean]': 'boolean',
  '[object Object]': 'object',
  '[object Text]': 'textnode',
  '[object Uint8Array]': '8bit-array',
  '[object Uint16Array]': '16bit-array',
  '[object Uint32Array]': '32bit-array',
  '[object Uint8ClampedArray]': '8bit-array',
  '[object Error]': 'error'
}

if (typeof window != 'undefined') {
  for (var el in window) if (/^HTML\w+Element$/.test(el)) {
    types['[object '+el+']'] = 'element'
  }
}

module.exports.types = types

});
require.register("jkroso-equals/index.js", function(exports, require, module){

var type = require('type')

/**
 * assert all values are equal
 *
 * @param {Any} [...]
 * @return {Boolean}
 */

module.exports = function(){
	var i = arguments.length - 1
	while (i > 0) {
		if (!compare(arguments[i], arguments[--i])) return false
	}
	return true
}

// (any, any, [array]) -> boolean
function compare(a, b, memos){
	// All identical values are equivalent
	if (a === b) return true
	var fnA = types[type(a)]
	if (fnA !== types[type(b)]) return false
	return fnA ? fnA(a, b, memos) : false
}

var types = {}

// (Number) -> boolean
types.number = function(a){
	// NaN check
	return a !== a
}

// (function, function, array) -> boolean
types.function = function(a, b, memos){
	return a.toString() === b.toString()
		// Functions can act as objects
	  && types.object(a, b, memos) 
		&& compare(a.prototype, b.prototype)
}

// (date, date) -> boolean
types.date = function(a, b){
	return +a === +b
}

// (regexp, regexp) -> boolean
types.regexp = function(a, b){
	return a.toString() === b.toString()
}

// (DOMElement, DOMElement) -> boolean
types.element = function(a, b){
	return a.outerHTML === b.outerHTML
}

// (textnode, textnode) -> boolean
types.textnode = function(a, b){
	return a.textContent === b.textContent
}

// decorate `fn` to prevent it re-checking objects
// (function) -> function
function memoGaurd(fn){
	return function(a, b, memos){
		if (!memos) return fn(a, b, [])
		var i = memos.length, memo
		while (memo = memos[--i]) {
			if (memo[0] === a && memo[1] === b) return true
		}
		return fn(a, b, memos)
	}
}

types.arguments =
types.array = memoGaurd(compareArrays)

// (array, array, array) -> boolean
function compareArrays(a, b, memos){
	var i = a.length
	if (i !== b.length) return false
	memos.push([a, b])
	while (i--) {
		if (!compare(a[i], b[i], memos)) return false
	}
	return true
}

types.object = memoGaurd(compareObjects)

// (object, object, array) -> boolean
function compareObjects(a, b, memos) {
	var ka = getEnumerableProperties(a)
	var kb = getEnumerableProperties(b)
	var i = ka.length

	// same number of properties
	if (i !== kb.length) return false

	// although not necessarily the same order
	ka.sort()
	kb.sort()

	// cheap key test
	while (i--) if (ka[i] !== kb[i]) return false

	// remember
	memos.push([a, b])

	// iterate again this time doing a thorough check
	i = ka.length
	while (i--) {
		var key = ka[i]
		if (!compare(a[key], b[key], memos)) return false
	}

	return true
}

// (object) -> array
function getEnumerableProperties (object) {
	var result = []
	for (var k in object) if (k !== 'constructor') {
		result.push(k)
	}
	return result
}

module.exports.object = types.object
module.exports.compare = compare

});
require.register("component-type/index.js", function(exports, require, module){

/**
 * toString ref.
 */

var toString = Object.prototype.toString;

/**
 * Return the type of `val`.
 *
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

module.exports = function(val){
  switch (toString.call(val)) {
    case '[object Function]': return 'function';
    case '[object Date]': return 'date';
    case '[object RegExp]': return 'regexp';
    case '[object Arguments]': return 'arguments';
    case '[object Array]': return 'array';
    case '[object String]': return 'string';
  }

  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (val && val.nodeType === 1) return 'element';
  if (val === Object(val)) return 'object';

  return typeof val;
};

});
require.register("jsedn/index.js", function(exports, require, module){
module.exports = require("./lib/reader.js");
});
require.register("jsedn/lib/atoms.js", function(exports, require, module){
// Generated by CoffeeScript 1.6.2
(function() {
  var Char, Discard, Keyword, Prim, StringObj, Symbol, char, charMap, kw, memo, sym, type, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  type = require("./type");

  memo = require("./memo");

  Prim = (function() {
    function Prim(val) {
      var x;

      if (type(val) === "array") {
        this.val = (function() {
          var _i, _len, _results;

          _results = [];
          for (_i = 0, _len = val.length; _i < _len; _i++) {
            x = val[_i];
            if (!(x instanceof Discard)) {
              _results.push(x);
            }
          }
          return _results;
        })();
      } else {
        this.val = val;
      }
    }

    Prim.prototype.value = function() {
      return this.val;
    };

    Prim.prototype.toString = function() {
      return JSON.stringify(this.val);
    };

    return Prim;

  })();

  StringObj = (function(_super) {
    __extends(StringObj, _super);

    function StringObj() {
      _ref = StringObj.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    StringObj.prototype.toString = function() {
      return this.val;
    };

    StringObj.prototype.is = function(test) {
      return this.val === test;
    };

    return StringObj;

  })(Prim);

  charMap = {
    newline: "\n",
    "return": "\r",
    space: " ",
    tab: "\t",
    formfeed: "\f"
  };

  Char = (function(_super) {
    __extends(Char, _super);

    Char.prototype.ednEncode = function() {
      return "\\" + this.val;
    };

    Char.prototype.jsEncode = function() {
      return charMap[this.val] || this.val;
    };

    Char.prototype.jsonEncode = function() {
      return {
        Char: this.val
      };
    };

    function Char(val) {
      if (charMap[val] || val.length === 1) {
        this.val = val;
      } else {
        throw "Char may only be newline, return, space, tab, formfeed or a single character - you gave [" + val + "]";
      }
    }

    return Char;

  })(StringObj);

  Discard = (function() {
    function Discard() {}

    return Discard;

  })();

  Symbol = (function(_super) {
    __extends(Symbol, _super);

    function Symbol() {
      var args, parts;

      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      switch (args.length) {
        case 1:
          if (args[0] === "/") {
            this.ns = null;
            this.name = "/";
          } else {
            parts = args[0].split("/");
            if (parts.length === 1) {
              this.ns = null;
              this.name = parts[0];
            } else if (parts.length === 2) {
              this.ns = parts[0];
              this.name = parts[1];
            } else {
              throw "Can not have more than 1 forward slash in a symbol";
            }
          }
          break;
        case 2:
          this.ns = args[0];
          this.name = args[1];
      }
      if (this.name.length === 0) {
        throw "Length of Symbol name can not be empty";
      }
      if (/^[0-9]/.test(this.name[0])) {
        throw "Symbol cannot start with a number";
      }
      this.val = "" + (this.ns ? "" + this.ns + "/" : "") + this.name;
    }

    Symbol.prototype.toString = function() {
      return this.val;
    };

    Symbol.prototype.ednEncode = function() {
      return this.val;
    };

    Symbol.prototype.jsEncode = function() {
      return this.val;
    };

    Symbol.prototype.jsonEncode = function() {
      return {
        Symbol: this.val
      };
    };

    return Symbol;

  })(Prim);

  Keyword = (function(_super) {
    __extends(Keyword, _super);

    function Keyword() {
      Keyword.__super__.constructor.apply(this, arguments);
      if (this.val[0] !== ":") {
        throw "keyword must start with a :";
      }
    }

    Keyword.prototype.jsonEncode = function() {
      return {
        Keyword: this.val
      };
    };

    return Keyword;

  })(Symbol);

  char = memo(Char);

  kw = memo(Keyword);

  sym = memo(Symbol);

  module.exports = {
    Prim: Prim,
    Symbol: Symbol,
    Keyword: Keyword,
    StringObj: StringObj,
    Char: Char,
    Discard: Discard,
    char: char,
    kw: kw,
    sym: sym
  };

}).call(this);

});
require.register("jsedn/lib/atPath.js", function(exports, require, module){
// Generated by CoffeeScript 1.6.2
(function() {
  var kw;

  kw = require("./atoms").kw;

  module.exports = function(obj, path) {
    var part, value, _i, _len;

    path = path.trim().replace(/[ ]{2,}/g, ' ').split(' ');
    value = obj;
    for (_i = 0, _len = path.length; _i < _len; _i++) {
      part = path[_i];
      if (part[0] === ":") {
        part = kw(part);
      }
      if (value.exists) {
        if (value.exists(part) != null) {
          value = value.at(part);
        } else {
          throw "Could not find " + part;
        }
      } else {
        throw "Not a composite object";
      }
    }
    return value;
  };

}).call(this);

});
require.register("jsedn/lib/collections.js", function(exports, require, module){
// Generated by CoffeeScript 1.6.2
(function() {
  var Iterable, List, Map, Pair, Prim, Set, Vector, encode, equals, type, _ref, _ref1, _ref2,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  type = require("./type");

  equals = require("equals");

  Prim = require("./atoms").Prim;

  encode = require("./encode").encode;

  Iterable = (function(_super) {
    __extends(Iterable, _super);

    function Iterable() {
      _ref = Iterable.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Iterable.prototype.hashId = function() {
      return this.ednEncode();
    };

    Iterable.prototype.ednEncode = function() {
      return (this.map(function(i) {
        return encode(i);
      })).val.join(" ");
    };

    Iterable.prototype.jsonEncode = function() {
      return this.map(function(i) {
        if (i.jsonEncode != null) {
          return i.jsonEncode();
        } else {
          return i;
        }
      });
    };

    Iterable.prototype.jsEncode = function() {
      return (this.map(function(i) {
        if ((i != null ? i.jsEncode : void 0) != null) {
          return i.jsEncode();
        } else {
          return i;
        }
      })).val;
    };

    Iterable.prototype.exists = function(index) {
      return this.val[index] != null;
    };

    Iterable.prototype.each = function(iter) {
      var i, _i, _len, _ref1, _results;

      _ref1 = this.val;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        i = _ref1[_i];
        _results.push(iter(i));
      }
      return _results;
    };

    Iterable.prototype.map = function(iter) {
      return this.each(iter);
    };

    Iterable.prototype.walk = function(iter) {
      return this.map(function(i) {
        if ((i.walk != null) && type(i.walk) === "function") {
          return i.walk(iter);
        } else {
          return iter(i);
        }
      });
    };

    Iterable.prototype.at = function(index) {
      if (this.exists(index)) {
        return this.val[index];
      }
    };

    Iterable.prototype.set = function(index, val) {
      this.val[index] = val;
      return this;
    };

    return Iterable;

  })(Prim);

  List = (function(_super) {
    __extends(List, _super);

    function List() {
      _ref1 = List.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    List.prototype.ednEncode = function() {
      return "(" + (List.__super__.ednEncode.call(this)) + ")";
    };

    List.prototype.jsonEncode = function() {
      return {
        List: List.__super__.jsonEncode.call(this)
      };
    };

    List.prototype.map = function(iter) {
      return new List(this.each(iter));
    };

    return List;

  })(Iterable);

  Vector = (function(_super) {
    __extends(Vector, _super);

    function Vector() {
      _ref2 = Vector.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    Vector.prototype.ednEncode = function() {
      return "[" + (Vector.__super__.ednEncode.call(this)) + "]";
    };

    Vector.prototype.jsonEncode = function() {
      return {
        Vector: Vector.__super__.jsonEncode.call(this)
      };
    };

    Vector.prototype.map = function(iter) {
      return new Vector(this.each(iter));
    };

    return Vector;

  })(Iterable);

  Set = (function(_super) {
    __extends(Set, _super);

    Set.prototype.ednEncode = function() {
      return "\#{" + (Set.__super__.ednEncode.call(this)) + "}";
    };

    Set.prototype.jsonEncode = function() {
      return {
        Set: Set.__super__.jsonEncode.call(this)
      };
    };

    function Set(val) {
      var item, _i, _len;

      Set.__super__.constructor.call(this);
      this.val = [];
      for (_i = 0, _len = val.length; _i < _len; _i++) {
        item = val[_i];
        if (__indexOf.call(this.val, item) >= 0) {
          throw "set not distinct";
        } else {
          this.val.push(item);
        }
      }
    }

    Set.prototype.map = function(iter) {
      return new Set(this.each(iter));
    };

    return Set;

  })(Iterable);

  Pair = (function() {
    function Pair(key, val) {
      this.key = key;
      this.val = val;
    }

    return Pair;

  })();

  Map = (function() {
    Map.prototype.hashId = function() {
      return this.ednEncode();
    };

    Map.prototype.ednEncode = function() {
      var i;

      return "{" + (((function() {
        var _i, _len, _ref3, _results;

        _ref3 = this.value();
        _results = [];
        for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
          i = _ref3[_i];
          _results.push(encode(i));
        }
        return _results;
      }).call(this)).join(" ")) + "}";
    };

    Map.prototype.jsonEncode = function() {
      var i;

      return {
        Map: (function() {
          var _i, _len, _ref3, _results;

          _ref3 = this.value();
          _results = [];
          for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
            i = _ref3[_i];
            _results.push(i.jsonEncode != null ? i.jsonEncode() : i);
          }
          return _results;
        }).call(this)
      };
    };

    Map.prototype.jsEncode = function() {
      var hashId, i, k, result, _i, _len, _ref3, _ref4;

      result = {};
      _ref3 = this.keys;
      for (i = _i = 0, _len = _ref3.length; _i < _len; i = ++_i) {
        k = _ref3[i];
        hashId = (k != null ? k.hashId : void 0) != null ? k.hashId() : k;
        result[hashId] = ((_ref4 = this.vals[i]) != null ? _ref4.jsEncode : void 0) != null ? this.vals[i].jsEncode() : this.vals[i];
      }
      return result;
    };

    function Map(val) {
      var i, v, _i, _len, _ref3;

      this.val = val != null ? val : [];
      this.keys = [];
      this.vals = [];
      _ref3 = this.val;
      for (i = _i = 0, _len = _ref3.length; _i < _len; i = ++_i) {
        v = _ref3[i];
        if (i % 2 === 0) {
          this.keys.push(v);
        } else {
          this.vals.push(v);
        }
      }
      this.val = false;
    }

    Map.prototype.value = function() {
      var i, result, v, _i, _len, _ref3;

      result = [];
      _ref3 = this.keys;
      for (i = _i = 0, _len = _ref3.length; _i < _len; i = ++_i) {
        v = _ref3[i];
        result.push(v);
        if (this.vals[i] !== void 0) {
          result.push(this.vals[i]);
        }
      }
      return result;
    };

    Map.prototype.indexOf = function(key) {
      var i, k, _i, _len, _ref3;

      _ref3 = this.keys;
      for (i = _i = 0, _len = _ref3.length; _i < _len; i = ++_i) {
        k = _ref3[i];
        if (equals(k, key)) {
          return i;
        }
      }
      return void 0;
    };

    Map.prototype.exists = function(key) {
      return this.indexOf(key) != null;
    };

    Map.prototype.at = function(key) {
      var id;

      if ((id = this.indexOf(key)) != null) {
        return this.vals[id];
      } else {
        throw "key does not exist";
      }
    };

    Map.prototype.set = function(key, val) {
      var id;

      if ((id = this.indexOf(key)) != null) {
        this.vals[id] = val;
      } else {
        this.keys.push(key);
        this.vals.push(val);
      }
      return this;
    };

    Map.prototype.each = function(iter) {
      var k, _i, _len, _ref3, _results;

      _ref3 = this.keys;
      _results = [];
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        k = _ref3[_i];
        _results.push(iter(this.at(k), k));
      }
      return _results;
    };

    Map.prototype.map = function(iter) {
      var result;

      result = new Map;
      this.each(function(v, k) {
        var nv, _ref3;

        nv = iter(v, k);
        if (nv instanceof Pair) {
          _ref3 = [nv.key, nv.val], k = _ref3[0], nv = _ref3[1];
        }
        return result.set(k, nv);
      });
      return result;
    };

    Map.prototype.walk = function(iter) {
      return this.map(function(v, k) {
        if (type(v.walk) === "function") {
          return iter(v.walk(iter), k);
        } else {
          return iter(v, k);
        }
      });
    };

    return Map;

  })();

  module.exports = {
    Iterable: Iterable,
    List: List,
    Vector: Vector,
    Set: Set,
    Pair: Pair,
    Map: Map
  };

}).call(this);

});
require.register("jsedn/lib/compile.js", function(exports, require, module){
// Generated by CoffeeScript 1.6.2
(function() {
  module.exports = function(string) {
    return "return require('jsedn').parse(\"" + (string.replace(/"/g, '\\"').replace(/\n/g, " ").trim()) + "\")";
  };

}).call(this);

});
require.register("jsedn/lib/encode.js", function(exports, require, module){
// Generated by CoffeeScript 1.6.2
(function() {
  var encode, encodeHandlers, encodeJson, tokenHandlers, type;

  type = require("./type");

  tokenHandlers = require("./tokens").tokenHandlers;

  encodeHandlers = {
    array: {
      test: function(obj) {
        return type(obj) === "array";
      },
      action: function(obj) {
        var v;

        return "[" + (((function() {
          var _i, _len, _results;

          _results = [];
          for (_i = 0, _len = obj.length; _i < _len; _i++) {
            v = obj[_i];
            _results.push(encode(v));
          }
          return _results;
        })()).join(" ")) + "]";
      }
    },
    integer: {
      test: function(obj) {
        return type(obj) === "number" && tokenHandlers.integer.pattern.test(obj);
      },
      action: function(obj) {
        return parseInt(obj);
      }
    },
    float: {
      test: function(obj) {
        return type(obj) === "number" && tokenHandlers.float.pattern.test(obj);
      },
      action: function(obj) {
        return parseFloat(obj);
      }
    },
    string: {
      test: function(obj) {
        return type(obj) === "string";
      },
      action: function(obj) {
        return "\"" + (obj.toString().replace(/"/g, '\\"')) + "\"";
      }
    },
    boolean: {
      test: function(obj) {
        return type(obj) === "boolean";
      },
      action: function(obj) {
        if (obj) {
          return "true";
        } else {
          return "false";
        }
      }
    },
    "null": {
      test: function(obj) {
        return type(obj) === "null";
      },
      action: function(obj) {
        return "nil";
      }
    },
    date: {
      test: function(obj) {
        return type(obj) === "date";
      },
      action: function(obj) {
        return "#inst \"" + (obj.toISOString()) + "\"";
      }
    },
    object: {
      test: function(obj) {
        return type(obj) === "object";
      },
      action: function(obj) {
        var k, result, v;

        result = [];
        for (k in obj) {
          v = obj[k];
          result.push(encode(k));
          result.push(encode(v));
        }
        return "{" + (result.join(" ")) + "}";
      }
    }
  };

  encode = function(obj) {
    var handler, name;

    if ((obj != null ? obj.ednEncode : void 0) != null) {
      return obj.ednEncode();
    }
    for (name in encodeHandlers) {
      handler = encodeHandlers[name];
      if (handler.test(obj)) {
        return handler.action(obj);
      }
    }
    throw "unhandled encoding for " + (JSON.stringify(obj));
  };

  encodeJson = function(obj, prettyPrint) {
    if (obj.jsonEncode != null) {
      return encodeJson(obj.jsonEncode(), prettyPrint);
    }
    if (prettyPrint) {
      return JSON.stringify(obj, null, 4);
    } else {
      return JSON.stringify(obj);
    }
  };

  module.exports = {
    encodeHandlers: encodeHandlers,
    encode: encode,
    encodeJson: encodeJson
  };

}).call(this);

});
require.register("jsedn/lib/memo.js", function(exports, require, module){
// Generated by CoffeeScript 1.6.2
(function() {
  var memo;

  module.exports = memo = function(klass) {
    memo[klass] = {};
    return function(val) {
      if (memo[klass][val] == null) {
        memo[klass][val] = new klass(val);
      }
      return memo[klass][val];
    };
  };

}).call(this);

});
require.register("jsedn/lib/reader.js", function(exports, require, module){
// Generated by CoffeeScript 1.6.2
(function() {
  var Char, Discard, Iterable, Keyword, List, Map, Pair, Prim, Set, StringObj, Symbol, Tag, Tagged, Vector, char, encode, encodeHandlers, encodeJson, escapeChar, fs, handleToken, kw, lex, parenTypes, parens, parse, read, specialChars, sym, tagActions, tokenHandlers, type, typeClasses, _ref, _ref1, _ref2, _ref3, _ref4,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  type = require("./type");

  _ref = require("./atoms"), Prim = _ref.Prim, Symbol = _ref.Symbol, Keyword = _ref.Keyword, StringObj = _ref.StringObj, Char = _ref.Char, Discard = _ref.Discard, char = _ref.char, kw = _ref.kw, sym = _ref.sym;

  _ref1 = require("./collections"), Iterable = _ref1.Iterable, List = _ref1.List, Vector = _ref1.Vector, Set = _ref1.Set, Pair = _ref1.Pair, Map = _ref1.Map;

  _ref2 = require("./tags"), Tag = _ref2.Tag, Tagged = _ref2.Tagged, tagActions = _ref2.tagActions;

  _ref3 = require("./encode"), encodeHandlers = _ref3.encodeHandlers, encode = _ref3.encode, encodeJson = _ref3.encodeJson;

  _ref4 = require("./tokens"), handleToken = _ref4.handleToken, tokenHandlers = _ref4.tokenHandlers;

  typeClasses = {
    Map: Map,
    List: List,
    Vector: Vector,
    Set: Set,
    Discard: Discard,
    Tag: Tag,
    Tagged: Tagged,
    StringObj: StringObj
  };

  parens = '()[]{}';

  specialChars = parens + ' \t\n\r,';

  escapeChar = '\\';

  parenTypes = {
    '(': {
      closing: ')',
      "class": "List"
    },
    '[': {
      closing: ']',
      "class": "Vector"
    },
    '{': {
      closing: '}',
      "class": "Map"
    }
  };

  lex = function(string) {
    var c, escaping, in_comment, in_string, list, token, _i, _len;

    list = [];
    token = '';
    for (_i = 0, _len = string.length; _i < _len; _i++) {
      c = string[_i];
      if ((typeof in_string === "undefined" || in_string === null) && c === ";" && (typeof escaping === "undefined" || escaping === null)) {
        in_comment = true;
      }
      if (in_comment) {
        if (c === "\n") {
          in_comment = void 0;
          if (token) {
            list.push(token);
            token = '';
          }
        }
        continue;
      }
      if (c === '"' && (typeof escaping === "undefined" || escaping === null)) {
        if (typeof in_string !== "undefined" && in_string !== null) {
          list.push(new StringObj(in_string));
          in_string = void 0;
        } else {
          in_string = '';
        }
        continue;
      }
      if (in_string != null) {
        if (c === escapeChar && (typeof escaping === "undefined" || escaping === null)) {
          escaping = true;
          continue;
        }
        if (escaping != null) {
          escaping = void 0;
        }
        in_string += c;
      } else if (__indexOf.call(specialChars, c) >= 0 && (escaping == null)) {
        if (token) {
          list.push(token);
          token = '';
        }
        if (__indexOf.call(parens, c) >= 0) {
          list.push(c);
        }
      } else {
        if (escaping) {
          escaping = void 0;
        } else if (c === escapeChar) {
          escaping = true;
        }
        if (token === "#_") {
          list.push(token);
          token = '';
        }
        token += c;
      }
    }
    if (token) {
      list.push(token);
    }
    return list;
  };

  read = function(tokens) {
    var read_ahead, result, token1;

    read_ahead = function(token) {
      var L, closeParen, handledToken, paren, tagged;

      if (token === void 0) {
        return;
      }
      if (paren = parenTypes[token]) {
        closeParen = paren.closing;
        L = [];
        while (true) {
          token = tokens.shift();
          if (token === void 0) {
            throw 'unexpected end of list';
          }
          if (token === paren.closing) {
            return new typeClasses[paren["class"]](L);
          } else {
            L.push(read_ahead(token));
          }
        }
      } else if (__indexOf.call(")]}", token) >= 0) {
        throw "unexpected " + token;
      } else {
        handledToken = handleToken(token);
        if (handledToken instanceof Tag) {
          token = tokens.shift();
          if (token === void 0) {
            throw 'was expecting something to follow a tag';
          }
          tagged = new typeClasses.Tagged(handledToken, read_ahead(token));
          if (tagged.tag().dn() === "") {
            if (tagged.obj() instanceof typeClasses.Map) {
              return new typeClasses.Set(tagged.obj().value());
            }
          }
          if (tagged.tag().dn() === "_") {
            return new typeClasses.Discard;
          }
          if (tagActions[tagged.tag().dn()] != null) {
            return tagActions[tagged.tag().dn()].action(tagged.obj());
          }
          return tagged;
        } else {
          return handledToken;
        }
      }
    };
    token1 = tokens.shift();
    if (token1 === void 0) {
      return void 0;
    } else {
      result = read_ahead(token1);
      if (result instanceof typeClasses.Discard) {
        return "";
      }
      return result;
    }
  };

  parse = function(string) {
    return read(lex(string));
  };

  module.exports = {
    Char: Char,
    char: char,
    Iterable: Iterable,
    Symbol: Symbol,
    sym: sym,
    Keyword: Keyword,
    kw: kw,
    List: List,
    Vector: Vector,
    Pair: Pair,
    Map: Map,
    Set: Set,
    Tag: Tag,
    Tagged: Tagged,
    setTypeClass: function(typeName, klass) {
      if (typeClasses[typeName] != null) {
        module.exports[typeName] = klass;
        return typeClasses[typeName] = klass;
      }
    },
    setTagAction: function(tag, action) {
      return tagActions[tag.dn()] = {
        tag: tag,
        action: action
      };
    },
    setTokenHandler: function(handler, pattern, action) {
      return tokenHandlers[handler] = {
        pattern: pattern,
        action: action
      };
    },
    setTokenPattern: function(handler, pattern) {
      return tokenHandlers[handler].pattern = pattern;
    },
    setTokenAction: function(handler, action) {
      return tokenHandlers[handler].action = action;
    },
    setEncodeHandler: function(handler, test, action) {
      return encodeHandlers[handler] = {
        test: test,
        action: action
      };
    },
    setEncodeTest: function(type, test) {
      return encodeHandlers[type].test = test;
    },
    setEncodeAction: function(type, action) {
      return encodeHandlers[type].action = action;
    },
    parse: parse,
    encode: encode,
    encodeJson: encodeJson,
    toJS: function(obj) {
      if ((obj != null ? obj.jsEncode : void 0) != null) {
        return obj.jsEncode();
      } else {
        return obj;
      }
    },
    atPath: require("./atPath"),
    unify: require("./unify")(parse),
    compile: require("./compile")
  };

  if (typeof window === "undefined") {
    fs = require("fs");
    module.exports.readFile = function(file, cb) {
      return fs.readFile(file, "utf-8", function(err, data) {
        if (err) {
          throw err;
        }
        return cb(parse(data));
      });
    };
    module.exports.readFileSync = function(file) {
      return parse(fs.readFileSync(file, "utf-8"));
    };
  }

}).call(this);

});
require.register("jsedn/lib/tags.js", function(exports, require, module){
// Generated by CoffeeScript 1.6.2
(function() {
  var Prim, Tag, Tagged, tagActions,
    __slice = [].slice,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Prim = require("./atoms").Prim;

  Tag = (function() {
    function Tag() {
      var name, namespace, _ref;

      namespace = arguments[0], name = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      this.namespace = namespace;
      this.name = name;
      if (arguments.length === 1) {
        _ref = arguments[0].split('/'), this.namespace = _ref[0], this.name = 2 <= _ref.length ? __slice.call(_ref, 1) : [];
      }
    }

    Tag.prototype.ns = function() {
      return this.namespace;
    };

    Tag.prototype.dn = function() {
      return [this.namespace].concat(this.name).join('/');
    };

    return Tag;

  })();

  Tagged = (function(_super) {
    __extends(Tagged, _super);

    function Tagged(_tag, _obj) {
      this._tag = _tag;
      this._obj = _obj;
    }

    Tagged.prototype.ednEncode = function() {
      return "\#" + (this.tag().dn()) + " " + (require("./encode").encode(this.obj()));
    };

    Tagged.prototype.jsonEncode = function() {
      return {
        Tagged: [this.tag().dn(), this.obj().jsonEncode != null ? this.obj().jsonEncode() : this.obj()]
      };
    };

    Tagged.prototype.tag = function() {
      return this._tag;
    };

    Tagged.prototype.obj = function() {
      return this._obj;
    };

    return Tagged;

  })(Prim);

  tagActions = {
    uuid: {
      tag: new Tag("uuid"),
      action: function(obj) {
        return obj;
      }
    },
    inst: {
      tag: new Tag("inst"),
      action: function(obj) {
        return new Date(Date.parse(obj));
      }
    }
  };

  module.exports = {
    Tag: Tag,
    Tagged: Tagged,
    tagActions: tagActions
  };

}).call(this);

});
require.register("jsedn/lib/tokens.js", function(exports, require, module){
// Generated by CoffeeScript 1.6.2
(function() {
  var Char, StringObj, Tag, handleToken, kw, sym, tokenHandlers, _ref;

  _ref = require("./atoms"), Char = _ref.Char, StringObj = _ref.StringObj, kw = _ref.kw, sym = _ref.sym;

  Tag = require("./tags").Tag;

  handleToken = function(token) {
    var handler, name;

    if (token instanceof StringObj) {
      return token.toString();
    }
    for (name in tokenHandlers) {
      handler = tokenHandlers[name];
      if (handler.pattern.test(token)) {
        return handler.action(token);
      }
    }
    return sym(token);
  };

  tokenHandlers = {
    nil: {
      pattern: /^nil$/,
      action: function(token) {
        return null;
      }
    },
    boolean: {
      pattern: /^true$|^false$/,
      action: function(token) {
        return token === "true";
      }
    },
    keyword: {
      pattern: /^[\:].*$/,
      action: function(token) {
        return kw(token);
      }
    },
    char: {
      pattern: /^\\.*$/,
      action: function(token) {
        return new Char(token.slice(1));
      }
    },
    integer: {
      pattern: /^[\-\+]?[0-9]+N?$/,
      action: function(token) {
        return parseInt(token === "-0" ? "0" : token);
      }
    },
    float: {
      pattern: /^[\-\+]?[0-9]+(\.[0-9]*)?([eE][-+]?[0-9]+)?M?$/,
      action: function(token) {
        return parseFloat(token);
      }
    },
    tagged: {
      pattern: /^#.*$/,
      action: function(token) {
        return new Tag(token.slice(1));
      }
    }
  };

  module.exports = {
    handleToken: handleToken,
    tokenHandlers: tokenHandlers
  };

}).call(this);

});
require.register("jsedn/lib/type.js", function(exports, require, module){
// Generated by CoffeeScript 1.6.2
(function() {
  module.exports = typeof window === "undefined" ? require("type-component") : require("type");

}).call(this);

});
require.register("jsedn/lib/unify.js", function(exports, require, module){
// Generated by CoffeeScript 1.6.2
(function() {
  var Map, Pair, Symbol, kw, sym, type, _ref, _ref1;

  type = require("./type");

  _ref = require("./collections"), Map = _ref.Map, Pair = _ref.Pair;

  _ref1 = require("./atoms"), Symbol = _ref1.Symbol, kw = _ref1.kw, sym = _ref1.sym;

  module.exports = function(parse) {
    return function(data, values, tokenStart) {
      var unifyToken, valExists;

      if (tokenStart == null) {
        tokenStart = "?";
      }
      if (type(data) === "string") {
        data = parse(data);
      }
      if (type(values) === "string") {
        values = parse(values);
      }
      valExists = function(v) {
        if (values instanceof Map) {
          if (values.exists(v)) {
            return values.at(v);
          } else if (values.exists(sym(v))) {
            return values.at(sym(v));
          } else if (values.exists(kw(":" + v))) {
            return values.at(kw(":" + v));
          }
        } else {
          return values[v];
        }
      };
      unifyToken = function(t) {
        var val;

        if (t instanceof Symbol && ("" + t)[0] === tokenStart && ((val = valExists(("" + t).slice(1))) != null)) {
          return val;
        } else {
          return t;
        }
      };
      return data.walk(function(v, k) {
        if (k != null) {
          return new Pair(unifyToken(k), unifyToken(v));
        } else {
          return unifyToken(v);
        }
      });
    };
  };

}).call(this);

});
require.alias("jkroso-equals/index.js", "jsedn/deps/equals/index.js");
require.alias("jkroso-equals/index.js", "equals/index.js");
require.alias("jkroso-type/index.js", "jkroso-equals/deps/type/index.js");

require.alias("component-type/index.js", "jsedn/deps/type/index.js");
require.alias("component-type/index.js", "type/index.js");

if (typeof exports == "object") {
  module.exports = require("jsedn");
} else if (typeof define == "function" && define.amd) {
  define(function(){ return require("jsedn"); });
} else {
  this["jsedn"] = require("jsedn");
}})();