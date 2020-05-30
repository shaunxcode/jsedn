/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const type = require("./type");
const {Prim, Symbol, Keyword, StringObj, Char, Discard, BigInt, char, kw, sym ,bigInt} = require("./atoms");
const {Iterable, List, Vector, Set, Pair, Map} = require("./collections");
const {Tag, Tagged, tagActions} = require("./tags");
const {encodeHandlers, encode, encodeJson} = require("./encode");
const {handleToken, tokenHandlers} = require("./tokens");

const typeClasses = {Map, List, Vector, Set, Discard, Tag, Tagged, StringObj};
const parens = '()[]{}';
const specialChars = parens + ' \t\n\r,';
const escapeChar = '\\';
const parenTypes = { 
	'(' : { closing: ')', class: "List"
},
	'[' : { closing: ']', class: "Vector"
},
	'{' : { closing: '}', class: "Map"
}
};

//based on the work of martin keefe: http://martinkeefe.com/dcpl/sexp_lib.html
const lex = function(string) {
	const list = [];
	const lines = [];
	let line = 1;
	let token = '';
	for (let c of Array.from(string)) {
		var escaping, in_comment, in_string;
		if (["\n", "\r"].includes(c)) { line++; }

		if ((in_string == null) && (c === ";") && (escaping == null)) {
			in_comment = true;
		}
			
		if (in_comment) {
			if (c === "\n") {
				in_comment = undefined;
				if (token) { 
					list.push(token);
					lines.push(line); 
					token = '';
				}
			}
			continue;
		}
			
		if ((c === '"') && (escaping == null)) {
			if (in_string != null) {
				list.push((new StringObj(in_string)));
				lines.push(line); 
				in_string = undefined;
			} else {
				in_string = '';
			}
			continue;
		}

		if (in_string != null) {
			if ((c === escapeChar) && (escaping == null)) {
				escaping = true;
				continue;
			}

			if (escaping != null) { 
				escaping = undefined;
				if (["t", "n", "f", "r"].includes(c)) { 
					in_string += escapeChar;
				}
			}

			in_string += c;
		} else if (Array.from(specialChars).includes(c) && (escaping == null)) {
			if (token) {
				list.push(token);
				lines.push(line); 
				token = '';
			}
			if (Array.from(parens).includes(c)) {
				list.push(c);
				lines.push(line); 
			}
		} else {
			if (escaping) {
				escaping = undefined;
			} else if (c === escapeChar) {
				escaping = true;
			}
			
			if (token === "#_") {
				list.push(token);
				lines.push(line);
				token = '';
			}
			token += c;
		}
	}

	if (token) {
		list.push(token);
		lines.push(line); 
	}
	return {tokens: list, tokenLines: lines};
};

//based roughly on the work of norvig from his lisp in python
const read = function(ast) {
	const {tokens, tokenLines} = ast;

	var read_ahead = function(token, tokenIndex, expectSet) {
		let paren;
		if (tokenIndex == null) { tokenIndex = 0; }
		if (expectSet == null) { expectSet = false; }
		if (token === undefined) { return; }

		if ((!(token instanceof StringObj)) && (paren = parenTypes[token])) {
			const closeParen = paren.closing;
			const L = [];
			while (true) {
				token = tokens.shift();

				if (token === undefined) { throw `unexpected end of list at line ${tokenLines[tokenIndex]}`; }

				tokenIndex++;
				if (token === paren.closing) {
					return new (typeClasses[expectSet ? "Set" : paren.class])(L);
				} else { 
					L.push(read_ahead(token, tokenIndex));
				}
			}

		} else if (Array.from(")]}").includes(token)) {
			throw `unexpected ${token} at line ${tokenLines[tokenIndex]}`;
		} else {
			const handledToken = handleToken(token);
			if (handledToken instanceof Tag) {
				token = tokens.shift();
				tokenIndex++;

				if (token === undefined) { throw `was expecting something to follow a tag at line ${tokenLines[tokenIndex]}`; }

				const tagged = new typeClasses.Tagged(handledToken, read_ahead(token, tokenIndex, handledToken.dn() === ""));

				if (handledToken.dn() === "") {
					if (tagged.obj() instanceof typeClasses.Set) {
						return tagged.obj();
					} else {
						throw `Exepected a set but did not get one at line ${tokenLines[tokenIndex]}`;
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

	const token1 = tokens.shift();
	if (token1 === undefined) {
		return undefined; 
	} else {
		const result = read_ahead(token1);
		if (result instanceof typeClasses.Discard) { 
			return "";
		}
		return result;
	}
};
		
const parse = string => read(lex(string)); 

module.exports = { 
	Char,
	char,
	Iterable,
	Symbol,
	sym,	
	Keyword,
	kw,
	BigInt,
	bigInt, 
	List,
	Vector,
	Pair,
	Map,
	Set,
	Tag,
	Tagged,

	setTypeClass(typeName, klass) { 
		if (typeClasses[typeName] != null) {
			module.exports[typeName] = klass; 
			return typeClasses[typeName] = klass;
		}
	},
			
	setTagAction(tag, action) { return tagActions[tag.dn()] = {tag, action}; },
	setTokenHandler(handler, pattern, action) { return tokenHandlers[handler] = {pattern, action}; },
	setTokenPattern(handler, pattern) { return tokenHandlers[handler].pattern = pattern; },
	setTokenAction(handler, action) { return tokenHandlers[handler].action = action; },
	setEncodeHandler(handler, test, action) { return encodeHandlers[handler] = {test, action}; },
	setEncodeTest(type, test) { return encodeHandlers[type].test = test; },
	setEncodeAction(type, action) { return encodeHandlers[type].action = action; },
	parse,
	encode,
	encodeJson,
	toJS(obj) { if ((obj != null ? obj.jsEncode : undefined) != null) { return obj.jsEncode(); } else { return obj; } },
	atPath: require("./atPath"),
	unify: require("./unify")(parse),
	compile: require("./compile")
};

if (typeof window === "undefined") {
	const fs = require("fs");
	module.exports.readFile = (file, cb) => fs.readFile(file, "utf-8", function(err, data) { 
        if (err) { throw err; }
        return cb(parse(data));
    });

	module.exports.readFileSync = file => parse(fs.readFileSync(file, "utf-8"));
}
