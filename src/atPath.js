/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {kw} = require("./atoms");

module.exports = function(obj, path) { 
	path = path.trim().replace(/[ ]{2,}/g, ' ').split(' ');
	let value = obj;
	for (let part of Array.from(path)) {
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