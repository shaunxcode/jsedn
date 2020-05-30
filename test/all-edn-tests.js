/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {assert, logTotals} = require("./assertion");
const fs = require("fs");
const equals = require("equals");
const edn = require("../src/reader");

const testDir = "./test/edn-tests/valid-edn";
const jsDir = "./test/edn-tests/platforms/js";

const files = fs.readdirSync("./test/edn-tests/valid-edn");
files.forEach(function(file) { 
	const validEdn = fs.readFileSync(`${testDir}/${file}`, "utf-8");
	const expectedJs = fs.readFileSync(`${jsDir}/${file.replace(/\..+$/, '.js')}`, "utf-8");
	const expected = eval(`(function(){return ${expectedJs}})()`);
	const parsedToJs = edn.toJS(edn.parse(validEdn));
	return assert(file, parsedToJs, expected);
});

logTotals();
