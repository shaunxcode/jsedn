/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {Prim} = require("./atoms");
const type = require("./type");

class Tag {
	constructor(namespace, ...rest) {
		this.namespace = namespace;
		[...this.name] = Array.from(rest);
		if (arguments.length === 1) {
			[this.namespace, ...this.name] = Array.from(arguments[0].split('/'));
		}
	}
			
	ns() { return this.namespace; }
	dn() { return [this.namespace].concat(this.name).join('/'); }
}
	
class Tagged extends Prim {
	constructor(_tag, _obj) {
		{
		  // Hack: trick Babel/TypeScript into allowing this before super.
		  if (false) { super(); }
		  let thisFn = (() => { return this; }).toString();
		  let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
		  eval(`${thisName} = this;`);
		}
		this._tag = _tag;
		this._obj = _obj;
	}

	jsEncode() { 
		return {tag: this.tag().dn(), value: this.obj().jsEncode()};
	}

	ednEncode() {
		return `\#${this.tag().dn()} ${require("./encode").encode(this.obj())}`;
	}

	jsonEncode() {
		return {Tagged: [this.tag().dn(), (this.obj().jsonEncode != null) ? this.obj().jsonEncode() : this.obj()]};
	}
		
	tag() { return this._tag; }
	obj() { return this._obj; }

	walk(iter) {
		return new Tagged(this._tag, type(this._obj.walk) === "function" ? this._obj.walk(iter) : iter(this._obj));
	}
}
		
const tagActions = {
	uuid: { tag: (new Tag("uuid")), action(obj) { return obj; }
},
	inst: { tag: (new Tag("inst")), action(obj) { return new Date(Date.parse(obj)); }
}
};
	
module.exports = {Tag, Tagged, tagActions};
