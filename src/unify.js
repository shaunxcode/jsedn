/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const type = require("./type");
const {Map, Pair} = require("./collections");
const {Symbol, kw, sym} = require("./atoms");

module.exports = parse => (function(data, values, tokenStart) {
	if (tokenStart == null) { tokenStart = "?"; }
	if (type(data) === "string") { data = parse(data); } 
	if (type(values) === "string") { values = parse(values); }
	
	const valExists = function(v) { 
		if (values instanceof Map) { 
			if (values.exists(v)) { return values.at(v);
			} else if (values.exists(sym(v))) { return values.at(sym(v));
			} else if (values.exists(kw(`:${v}`))) { return values.at(kw(`:${v}`)); }
		} else {
			return values[v];
		}
	};

	const unifyToken = function(t) { 
		let val;
		if (t instanceof Symbol && (`${t}`[0] === tokenStart) && ((val = valExists(`${t}`.slice(1))) != null)) { return val; } else { return t; }
	};

	return data.walk(function(v, k) { 
		if (k != null) { return new Pair(unifyToken(k), unifyToken(v)); } else { return unifyToken(v); }
	});
});