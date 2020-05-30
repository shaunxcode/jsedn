/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const type = require("./type");
const equals = require("equals");
const {Prim} = require("./atoms");
const {encode} = require("./encode");

class Iterable extends Prim {
	hashId() { 
		return this.ednEncode();
	}

	ednEncode() {
		return (this.map(i => encode(i))).val.join(" ");
	}
	
	jsonEncode() {
		return (this.map(function(i) { if (i.jsonEncode != null) { return i.jsonEncode(); } else { return i; } }));
	}
	
	jsEncode() {
		return (this.map(function(i) { if ((i != null ? i.jsEncode : undefined) != null) { return i.jsEncode(); } else { return i; } })).val;
	}
		
	exists(index) {
		return (this.val[index] != null);
	}

	each(iter) {
		return (Array.from(this.val).map((i) => iter(i)));
	}

	map(iter) {
		return this.each(iter); 
	}

	walk(iter) { 
		return this.map(function(i) { 
			if ((i.walk != null) && (type(i.walk) === "function")) { 
				return i.walk(iter);
			} else {
				return iter(i);
			}
		});
	}
		
	at(index) {
		if (this.exists(index)) { return this.val[index]; }
	}

	set(index, val) {
		this.val[index] = val;
		
		return this;
	}
}
		
class List extends Iterable {
	ednEncode() {
		return `(${super.ednEncode()})`;
	}

	jsonEncode() {
		return {List: super.jsonEncode()};
	}
	
	map(iter) { 
		return new List(this.each(iter));
	}
}
	
class Vector extends Iterable {
	ednEncode() {
		return `[${super.ednEncode()}]`;
	}

	jsonEncode() {
		return {Vector: super.jsonEncode()};
	}
	
	map(iter) { 
		return new Vector(this.each(iter));
	}
}
	
class Set extends Iterable {
	ednEncode() {
		return `\#{${super.ednEncode()}}`;
	}

	jsonEncode() {
		return {Set: super.jsonEncode()};
	}

	constructor(val) {
		super();
		this.val = [];
		for (let item of Array.from(val)) {
			if (Array.from(this.val).includes(item)) { 
				throw "set not distinct";
			} else {
				this.val.push(item); 
			}
		}
	}

	map(iter) { 
		return new Set(this.each(iter));
	}
}

class Pair {
	constructor(key, val) {
		this.key = key;
		this.val = val; 
	}
}

class Map {
	hashId() { 
		return this.ednEncode();
	}
		
	ednEncode() {
		return `{${(Array.from(this.value()).map((i) => encode(i))).join(" ")}}`;
	}
	
	jsonEncode() { 
		return {Map: (Array.from(this.value()).map((i) => ((i.jsonEncode != null) ? i.jsonEncode() : i)))};
	}

	jsEncode() {
		const result = {};
		for (let i = 0; i < this.keys.length; i++) {
			const k = this.keys[i];
			const hashId = ((k != null ? k.hashId : undefined) != null) ? k.hashId() : k; 
			result[hashId] = ((this.vals[i] != null ? this.vals[i].jsEncode : undefined) != null) ? this.vals[i].jsEncode() : this.vals[i];
		}

		return result;
	}
		
	constructor(val) {
		if (val == null) { val = []; }
		this.val = val;
		if (this.val.length && ((this.val.length % 2) !== 0)) { 
			throw `Map accepts an array with an even number of items. You provided ${this.val.length} items`;
		}
 
		this.keys = [];
		this.vals = [];
		
		for (let i = 0; i < this.val.length; i++) {
			const v = this.val[i];
			if ((i % 2) === 0) {
				this.keys.push(v);
			} else {
				this.vals.push(v);
			}
		}

		this.val = false;
	}
	
	value() { 
		const result = [];
		for (let i = 0; i < this.keys.length; i++) {
			const v = this.keys[i];
			result.push(v);
			if (this.vals[i] !== undefined) { result.push(this.vals[i]); }
		}
		return result;
	}
		
	indexOf(key) { 
		for (let i = 0; i < this.keys.length; i++) {
			const k = this.keys[i];
			if (equals(k, key)) {
				return i;
			}
		}
		return undefined;
	}
		
	exists(key) {
		return (this.indexOf(key) != null);
	}
		
	at(key) {
		let id;
		if ((id = this.indexOf(key)) != null) {
			return this.vals[id];
		} else {
			throw "key does not exist";
		}
	}

	set(key, val) {
		let id;
		if ((id = this.indexOf(key)) != null) {
			this.vals[id] = val;
		} else {
			this.keys.push(key);
			this.vals.push(val);
		}

		return this;
	}
	each(iter) { 
		return (Array.from(this.keys).map((k) => (iter((this.at(k)), k))));
	}

	map(iter) {
		const result = new Map;
		this.each(function(v, k) { 
			let nv = iter(v, k);
			if (nv instanceof Pair) { [k, nv] = Array.from([nv.key, nv.val]); } 
			return result.set(k, nv);
		});
		return result;
	}

	walk(iter) { 
		return this.map(function(v, k) {  	
			if (type(v.walk) === "function") {
				return iter((v.walk(iter)), k);
			} else {
				return iter(v, k);
			}
		});
	}
}
				
module.exports = {Iterable, List, Vector, Set, Pair, Map};
