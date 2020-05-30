/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const type = require("./type");
const {tokenHandlers} = require("./tokens");

const encodeHandlers = { 
	array: {
		test(obj) { return type(obj) === "array"; },
		action(obj) { return `[${(Array.from(obj).map((v) => encode(v))).join(" ")}]`; }
	},
	integer: { 
		test(obj) { return (type(obj) === "number") && tokenHandlers.integer.pattern.test(obj); },
		action(obj) { return parseInt(obj); }
	},
	float: {
		test(obj) { return (type(obj) === "number") && tokenHandlers.float.pattern.test(obj); },
		action(obj) { return parseFloat(obj); }
	},
	string: {  
		test(obj) { return type(obj) === "string"; },
		action(obj) {  return `\"${obj.toString().replace(/"|\\/g, '\\$&')}\"`; }
	},
	boolean: { 
		test(obj) { return type(obj) === "boolean"; },
		action(obj) { if (obj) { return "true"; } else { return "false"; } }
	},
	null: {    
		test(obj) { return type(obj) === "null"; },
		action(obj) { return "nil"; }
	},
	date: {
		test(obj) { return type(obj) === "date"; }, 
		action(obj) { return `#inst \"${obj.toISOString()}\"`; }
	},
	object: {  
		test(obj) { return type(obj) === "object"; },
		action(obj) { 
			const result = [];
			for (let k in obj) {
				const v = obj[k];
				result.push(encode(k));
				result.push(encode(v));
			}
			return `{${result.join(" ")}}`;
		}
	}
};

var encode = function(obj) {
	if ((obj != null ? obj.ednEncode : undefined) != null) { return obj.ednEncode(); }

	for (let name in encodeHandlers) {
		const handler = encodeHandlers[name];
		if (handler.test(obj)) {
			return handler.action(obj);
		}
	}

	throw `unhandled encoding for ${JSON.stringify(obj)}`;
};

var encodeJson = function(obj, prettyPrint) {
	if (obj.jsonEncode != null) { return (encodeJson(obj.jsonEncode(), prettyPrint)); }

	if (prettyPrint) { return (JSON.stringify(obj, null, 4)); } else { return JSON.stringify(obj); }
};

module.exports = {encodeHandlers, encode, encodeJson};