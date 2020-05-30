/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const type = require("./type");
const memo = require("./memo");

class Prim {
	constructor(val) {
		if (type(val) === "array") {
			this.val = ((() => {
				const result = [];
				for (let x of Array.from(val)) { 					if (!(x instanceof Discard)) {
						result.push(x);
					}
				}
				return result;
			})());
		} else {
			this.val = val;
		}
	}
			
	value() { return this.val; }
	toString() { return JSON.stringify(this.val); }
}

class BigInt extends Prim { 
	ednEncode() { return this.val; }
	
	jsEncode() { return this.val; }
	
	jsonEncode() { return {BigInt: this.val}; } 
}

class StringObj extends Prim { 
	toString() { return this.val; }
	is(test) { return this.val === test; }
}

const charMap = {newline: "\n", return: "\r", space: " ", tab: "\t", formfeed: "\f"};
	
class Char extends StringObj {
	ednEncode() { return `\\${this.val}`; }
	
	jsEncode() { return charMap[this.val] || this.val; }
	
	jsonEncode() { return {Char: this.val}; } 
	
	constructor(val) {
		{
		  // Hack: trick Babel/TypeScript into allowing this before super.
		  if (false) { super(); }
		  let thisFn = (() => { return this; }).toString();
		  let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
		  eval(`${thisName} = this;`);
		}
		if (charMap[val] || (val.length === 1)) {
			this.val = val;
		} else {
			throw `Char may only be newline, return, space, tab, formfeed or a single character - you gave [${val}]`;
		}
	}
}

class Discard {}
	
class Symbol extends Prim {
	static initClass() {
	
		this.prototype.validRegex = /[0-9A-Za-z.*+!\-_?$%&=:#></]+/;
	
		this.prototype.invalidFirstChars = [":", "#", "/"]; 
	}

	valid(word) { 

		if (__guard__(word.match(this.validRegex), x => x[0]) !== word) {
			throw `provided an invalid symbol ${word}`;
		}

		if ((word.length === 1) && (word[0] !== "/")) {
			if (Array.from(this.invalidFirstChars).includes(word[0])) { 
				throw `Invalid first character in symbol ${word[0]}`;
			}
		}

		if (["-", "+", "."].includes(word[0]) && (word[1] != null) && word[1].match(/[0-9]/)) {
			throw `If first char is ${word[0]} the second char can not be numeric. You had ${word[1]}`;
		}

		if (word[0].match(/[0-9]/)) {
			throw `first character may not be numeric. You provided ${word[0]}`;
		}

		return true; 
	}

	constructor(...args) {		
		{
		  // Hack: trick Babel/TypeScript into allowing this before super.
		  if (false) { super(); }
		  let thisFn = (() => { return this; }).toString();
		  let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
		  eval(`${thisName} = this;`);
		}
		switch (args.length) {
			case 1:
				if (args[0] === "/") {
					this.ns = null;
					this.name = "/";
				} else {
					const parts = args[0].split("/");
					//e.g. new Symbol ?cat
					if (parts.length === 1) { 
						this.ns = null;
						this.name = parts[0];
						if (this.name === ":") {
							throw "can not have a symbol of only :";
						}
					//e.g. new Symbol ":myPets.cats/cordelia"
					} else if (parts.length === 2) {
						this.ns = parts[0];
						if (this.ns === "") {
							throw "can not have a slash at start of symbol";
						}
						if (this.ns === ":") {
							throw "can not have a namespace of :";
						}
						this.name = parts[1];
						if (this.name.length === 0) { 
							throw "symbol may not end with a slash.";
						}
					} else {
						throw "Can not have more than 1 forward slash in a symbol";
					}
				}
				break;
					
			//e.g. new Symbol ":myPets.cats", "margaret"
			case 2:
				this.ns = args[0];
				this.name = args[1];
				break;
		}
				
		if (this.name.length === 0) { 
			throw "Symbol can not be empty";
		}
		
		this.val = `${this.ns ? `${this.ns}/` : ""}${this.name}`;
		this.valid(this.val); 
	}

	toString() { return this.val; } 
		
	ednEncode() { return this.val; }

	jsEncode() { return this.val; } 

	jsonEncode() { 
		return {Symbol: this.val};
	}
}
Symbol.initClass(); 

class Keyword extends Symbol {
	static initClass() {
		this.prototype.invalidFirstChars = ["#", "/"];
	}

	constructor() {
		super(...arguments);
		if (this.val[0] !== ":") { throw "keyword must start with a :"; }
		if ((this.val[1] != null) === "/") { throw "keyword can not have a slash with out a namespace"; }
	}

	jsonEncode() {
		return {Keyword: this.val};
	}
}
Keyword.initClass();

const char = memo(Char);
const kw = memo(Keyword);
const sym = memo(Symbol);
const bigInt = memo(BigInt);
	
module.exports = {Prim, Symbol, Keyword, StringObj, Char, Discard, BigInt, char, kw, sym, bigInt};

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}