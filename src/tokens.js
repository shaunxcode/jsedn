/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {Char, StringObj, char, kw, sym, bigInt} = require("./atoms");
const {Tag} = require("./tags");

const handleToken = function(token) {
	if (token instanceof StringObj) {
		return token.toString();
	}
		
	for (let name in tokenHandlers) {
		const handler = tokenHandlers[name];
		if (handler.pattern.test(token)) {
			return handler.action(token);
		}
	}

	return sym(token);
};

var tokenHandlers = {
	nil: {       pattern: /^nil$/,               action(token) { return null; }
},
	boolean: {   pattern: /^true$|^false$/,      action(token) { return token === "true"; }
},
	keyword: {   pattern: /^[\:].*$/,            action(token) { return kw(token); }
},
	char: {      pattern: /^\\.*$/,              action(token) { return char(token.slice(1)); }
},
	integer: {   pattern: /^[\-\+]?[0-9]+N?$/,   action(token) { 
		//allows for numbers larger than js can handle
		//we purposely "box" it so that an error will occur
		//if someone attempts to treat it as a normal number
		if (/\d{15,}/.test(token)) { return bigInt(token); }
		
		return parseInt(token === "-0" ? "0" : token);
	}
},
	float: {     pattern: /^[\-\+]?[0-9]+(\.[0-9]*)?([eE][-+]?[0-9]+)?M?$/, action(token) { return parseFloat(token); }
},
	tagged: {    pattern: /^#.*$/,               action(token) { return new Tag(token.slice(1)); }
}
};

module.exports = {handleToken, tokenHandlers};
