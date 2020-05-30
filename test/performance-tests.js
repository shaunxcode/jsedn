/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const assertion = require("./assertion");
const fs = require("fs");
const equals = require("equals");
const edn = require("../src/reader");

const testDir = "./test/edn-tests/performance";

const files = fs.readdirSync(testDir);
files.forEach(function(file) { 
	const validEdn = fs.readFileSync(`${testDir}/${file}`, "utf-8");
	console.log(`Reading ${file}`);
	const start = new Date;
	try {
		edn.parse(validEdn);
		const stop = new Date;
		return console.log(`Elapsed: ${stop.getTime() - start.getTime()}`);
	} catch (e) {
		return console.log(`Error reading ${file}`, e);
	}
});
