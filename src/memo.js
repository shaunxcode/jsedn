/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let memo;
module.exports = (memo = function(klass) { 
	memo[klass] = {};
	return function(val) { 
		if ((memo[klass][val] == null)) { memo[klass][val] = new klass(val); } 
		return memo[klass][val];
	};
});