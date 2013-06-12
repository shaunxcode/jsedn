;(function(){
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(p, parent, orig){
  var path = require.resolve(p)
    , mod = require.modules[path];

  // lookup failed
  if (null == path) {
    orig = orig || p;
    parent = parent || 'root';
    throw new Error('failed to require "' + orig + '" from "' + parent + '"');
  }

  // perform real require()
  // by invoking the module's
  // registered function
  if (!mod.exports) {
    mod.exports = {};
    mod.client = mod.component = true;
    mod.call(this, mod, mod.exports, require.relative(path));
  }

  return mod.exports;
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

require.resolve = function(path){
  var orig = path
    , reg = path + '.js'
    , regJSON = path + '.json'
    , index = path + '/index.js'
    , indexJSON = path + '/index.json';

  return require.modules[reg] && reg
    || require.modules[regJSON] && regJSON
    || require.modules[index] && index
    || require.modules[indexJSON] && indexJSON
    || require.modules[orig] && orig
    || require.aliases[index];
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
 * Register module at `path` with callback `fn`.
 *
 * @param {String} path
 * @param {Function} fn
 * @api private
 */

require.register = function(path, fn){
  require.modules[path] = fn;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to){
  var fn = require.modules[from];
  if (!fn) throw new Error('failed to alias "' + from + '", it does not exist');
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

  function lastIndexOf(arr, obj){
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function fn(path){
    var orig = path;
    path = fn.resolve(path);
    return require(path, parent, orig);
  }

  /**
   * Resolve relative to the parent.
   */

  fn.resolve = function(path){
    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    if ('.' != path.charAt(0)) {
      var segs = parent.split('/');
      var i = lastIndexOf(segs, 'deps') + 1;
      if (!i) i = 0;
      path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
      return path;
    }
    return require.normalize(p, path);
  };

  /**
   * Check if module is defined at `path`.
   */

  fn.exists = function(path){
    return !! require.modules[fn.resolve(path)];
  };

  return fn;
};require.register("jkroso-type/index.js", function(module, exports, require){

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
require.register("jkroso-equals/index.js", function(module, exports, require){

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
types['function'] = function(a, b, memos){
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

types['arguments'] =
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

// expose compare
module.exports.compare = compare

});
require.register("component-type/index.js", function(module, exports, require){

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
require.register("jsedn/index.js", function(module, exports, require){
// Generated by CoffeeScript 1.6.1
(function() {
  var Discard, Iterable, Keyword, List, Map, Prim, Set, StringObj, Symbol, Tag, Tagged, Vector, atPath, encode, encodeHandlers, encodeJson, equals, escapeChar, fs, handle, keywords, kw, lex, parenTypes, parens, read, specialChars, sym, symbols, tagActions, tokenHandlers, type,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  if (typeof window === "undefined") {
    type = require("type-component");
  } else {
    type = require("type");
  }

  equals = require("equals");

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

  StringObj = (function(_super) {

    __extends(StringObj, _super);

    function StringObj() {
      return StringObj.__super__.constructor.apply(this, arguments);
    }

    StringObj.prototype.toString = function() {
      return this.val;
    };

    StringObj.prototype.is = function(test) {
      return this.val === test;
    };

    return StringObj;

  })(Prim);

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
      return "\#" + (this.tag().dn()) + " " + (encode(this.obj()));
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

  Discard = (function() {

    function Discard() {}

    return Discard;

  })();

  Iterable = (function(_super) {

    __extends(Iterable, _super);

    function Iterable() {
      return Iterable.__super__.constructor.apply(this, arguments);
    }

    Iterable.prototype.ednEncode = function() {
      return (this.map(function(i) {
        return encode(i);
      })).join(" ");
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
      return this.map(function(i) {
        if ((i != null ? i.jsEncode : void 0) != null) {
          return i.jsEncode();
        } else {
          return i;
        }
      });
    };

    Iterable.prototype.exists = function(index) {
      return this.val[index] != null;
    };

    Iterable.prototype.each = function(iter) {
      var i, _i, _len, _ref, _results;
      _ref = this.val;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        i = _ref[_i];
        _results.push(iter(i));
      }
      return _results;
    };

    Iterable.prototype.map = function(iter) {
      return this.each(iter);
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
      return List.__super__.constructor.apply(this, arguments);
    }

    List.prototype.ednEncode = function() {
      return "(" + (List.__super__.ednEncode.call(this)) + ")";
    };

    List.prototype.jsonEncode = function() {
      return {
        List: List.__super__.jsonEncode.call(this)
      };
    };

    return List;

  })(Iterable);

  Vector = (function(_super) {

    __extends(Vector, _super);

    function Vector() {
      return Vector.__super__.constructor.apply(this, arguments);
    }

    Vector.prototype.ednEncode = function() {
      return "[" + (Vector.__super__.ednEncode.call(this)) + "]";
    };

    Vector.prototype.jsonEncode = function() {
      return {
        Vector: Vector.__super__.jsonEncode.call(this)
      };
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

    return Set;

  })(Iterable);

  Map = (function() {

    Map.prototype.ednEncode = function() {
      var i;
      return "{" + (((function() {
        var _i, _len, _ref, _results;
        _ref = this.value();
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          i = _ref[_i];
          _results.push(encode(i));
        }
        return _results;
      }).call(this)).join(" ")) + "}";
    };

    Map.prototype.jsonEncode = function() {
      var i;
      return {
        Map: (function() {
          var _i, _len, _ref, _results;
          _ref = this.value();
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            i = _ref[_i];
            _results.push(i.jsonEncode != null ? i.jsonEncode() : i);
          }
          return _results;
        }).call(this)
      };
    };

    Map.prototype.jsEncode = function() {
      var hashId, i, k, result, _i, _len, _ref, _ref1;
      result = {};
      _ref = this.keys;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        k = _ref[i];
        hashId = (k != null ? k.hashId : void 0) != null ? k.hashId() : k;
        result[hashId] = ((_ref1 = this.vals[i]) != null ? _ref1.jsEncode : void 0) != null ? this.vals[i].jsEncode() : this.vals[i];
      }
      return result;
    };

    function Map(val) {
      var i, v, _i, _len, _ref;
      this.val = val != null ? val : [];
      this.keys = [];
      this.vals = [];
      _ref = this.val;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        v = _ref[i];
        if (i % 2 === 0) {
          this.keys.push(v);
        } else {
          this.vals.push(v);
        }
      }
      this.val = false;
    }

    Map.prototype.value = function() {
      var i, result, v, _i, _len, _ref;
      result = [];
      _ref = this.keys;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        v = _ref[i];
        result.push(v);
        if (this.vals[i] !== void 0) {
          result.push(this.vals[i]);
        }
      }
      return result;
    };

    Map.prototype.exists = function(key) {
      var i, k, _i, _len, _ref;
      _ref = this.keys;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        k = _ref[i];
        if (equals(k, key)) {
          return i;
        }
      }
      return void 0;
    };

    Map.prototype.at = function(key) {
      var id;
      if ((id = this.exists(key)) != null) {
        return this.vals[id];
      } else {
        throw "key does not exist";
      }
    };

    Map.prototype.set = function(key, val) {
      var id;
      if ((id = this.exists(key)) != null) {
        this.vals[id] = val;
      } else {
        this.keys.push(key);
        this.vals.push(val);
      }
      return this;
    };

    Map.prototype.map = function(iter) {
      var result;
      result = new Map;
      this.each(function(k, v) {
        return result.set(k, iter(k, v));
      });
      return result;
    };

    Map.prototype.each = function(iter) {
      var k, _i, _len, _ref, _results;
      _ref = this.keys;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        k = _ref[_i];
        _results.push(iter(k, this.at(k)));
      }
      return _results;
    };

    return Map;

  })();

  parens = '()[]{}';

  specialChars = parens + ' \t\n\r,';

  escapeChar = '\\';

  parenTypes = {
    '(': {
      closing: ')',
      "class": List
    },
    '[': {
      closing: ']',
      "class": Vector
    },
    '{': {
      closing: '}',
      "class": Map
    }
  };

  lex = function(string) {
    var c, escaping, in_comment, in_string, list, token, _i, _len;
    list = [];
    token = '';
    for (_i = 0, _len = string.length; _i < _len; _i++) {
      c = string[_i];
      if ((typeof in_string === "undefined" || in_string === null) && c === ";") {
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
      } else if (__indexOf.call(specialChars, c) >= 0) {
        if (token) {
          list.push(token);
          token = '';
        }
        if (__indexOf.call(parens, c) >= 0) {
          list.push(c);
        }
      } else {
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
            return new paren["class"](L);
          } else {
            L.push(read_ahead(token));
          }
        }
      } else if (__indexOf.call(")]}", token) >= 0) {
        throw "unexpected " + token;
      } else {
        handledToken = handle(token);
        if (handledToken instanceof Tag) {
          token = tokens.shift();
          if (token === void 0) {
            throw 'was expecting something to follow a tag';
          }
          tagged = new Tagged(handledToken, read_ahead(token));
          if (tagged.tag().dn() === "") {
            if (tagged.obj() instanceof Map) {
              return new Set(tagged.obj().value());
            }
          }
          if (tagged.tag().dn() === "_") {
            return new Discard;
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
      if (result instanceof Discard) {
        return "";
      }
      return result;
    }
  };

  handle = function(token) {
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
    character: {
      pattern: /^\\[A-z0-9]$/,
      action: function(token) {
        return token.slice(-1);
      }
    },
    tab: {
      pattern: /^\\tab$/,
      action: function(token) {
        return "\t";
      }
    },
    newLine: {
      pattern: /^\\newline$/,
      action: function(token) {
        return "\n";
      }
    },
    space: {
      pattern: /^\\space$/,
      action: function(token) {
        return " ";
      }
    },
    keyword: {
      pattern: /^[\:\?].*$/,
      action: function(token) {
        return kw(token);
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

  atPath = function(obj, path) {
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

  symbols = {};

  sym = function(val) {
    if (symbols[val] == null) {
      symbols[val] = new Symbol(val);
    }
    return symbols[val];
  };

  keywords = {};

  kw = function(word) {
    if (keywords[word] == null) {
      keywords[word] = new Keyword(word);
    }
    return keywords[word];
  };

  exports.Symbol = Symbol;

  exports.sym = sym;

  exports.Keyword = Keyword;

  exports.kw = kw;

  exports.List = List;

  exports.Vector = Vector;

  exports.Map = Map;

  exports.Set = Set;

  exports.Tag = Tag;

  exports.Tagged = Tagged;

  exports.setTagAction = function(tag, action) {
    return tagActions[tag.dn()] = {
      tag: tag,
      action: action
    };
  };

  exports.setTokenHandler = function(handler, pattern, action) {
    return tokenHandlers[handler] = {
      pattern: pattern,
      action: action
    };
  };

  exports.setTokenPattern = function(handler, pattern) {
    return tokenHandlers[handler].pattern = pattern;
  };

  exports.setTokenAction = function(handler, action) {
    return tokenHandlers[handler].action = action;
  };

  exports.setEncodeHandler = function(handler, test, action) {
    return encodeHandlers[handler] = {
      test: test,
      action: action
    };
  };

  exports.setEncodeTest = function(type, test) {
    return encodeHandlers[type].test = test;
  };

  exports.setEncodeAction = function(type, action) {
    return encodeHandlers[type].action = action;
  };

  exports.parse = function(string) {
    return read(lex(string));
  };

  exports.encode = encode;

  exports.encodeJson = encodeJson;

  exports.atPath = atPath;

  exports.toJS = function(obj) {
    if ((obj != null ? obj.jsEncode : void 0) != null) {
      return obj.jsEncode();
    } else {
      return obj;
    }
  };

  if (typeof window === "undefined") {
    fs = require("fs");
    exports.readFile = function(file, cb) {
      return fs.readFile(file, "utf-8", function(err, data) {
        if (err) {
          throw err;
        }
        return cb(exports.parse(data));
      });
    };
    exports.readFileSync = function(file) {
      return exports.parse(fs.readFileSync(file, "utf-8"));
    };
  }

  exports.compile = function(string) {
    return "return require('jsedn').parse(\"" + (string.replace(/"/g, '\\"').replace(/\n/g, " ").trim()) + "\")";
  };

}).call(this);

});
require.alias("jkroso-equals/index.js", "jsedn/deps/equals/index.js");
require.alias("jkroso-type/index.js", "jkroso-equals/deps/type/index.js");

require.alias("component-type/index.js", "jsedn/deps/type/index.js");
  if ("undefined" == typeof module) {
    window.jsedn = require("jsedn");
  } else {
    module.exports = require("jsedn");
  }
})();