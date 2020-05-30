/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const edn = require("../src/reader");
const us = require("underscore");

let passed = 0;
let failed = 0;
let skipped = 0;

const isVal = val => comp => us.isEqual(comp, val);

const isNotVal = val => comp => !us.isEqual(comp, val);

const assert = function(desc, result, pred) {
	if (!us.isFunction(pred)) {
		pred = isVal(pred);
	}

	if (pred(result)) {
		passed++;
		return console.log("[OK]", desc);
	} else {
		failed++;
		console.log("[FAIL]", desc);
		return console.log("we got:", (result.jsEncode != null) ? result.jsEncode() : result);
	}
};

const assertParse = function(desc, str, pred) {
	let result;
	try {	 
		result = edn.parse(str);
	} catch (e) { 
		result = e;
	}

	return assert(desc, result, pred);
};

const assertNotParse = function(desc, str) { 
	let result;
	try { 
		edn.parse(str);
		result = false;
	} catch (e) {
		result = true;
	}

	return assert(desc, str, () => result);
};

const assertEncode = (desc, obj, pred) => assert(desc, (edn.encode(obj)), pred);
	
const assertSkip = function(desc) {
	skipped++;
	return console.log("[SKIP]", desc);
};

const totalString = () => `PASSED: ${passed}/${passed + failed}` +
(skipped ? `, SKIPPED: ${skipped}` : "");

const logTotals = function() {
	console.log(totalString(), "\n");
	if (failed > 0) {
		return process.exit(1);
	}
};
	
module.exports = {isVal, isNotVal, assert, assertParse, assertNotParse, assertEncode, assertSkip, logTotals};