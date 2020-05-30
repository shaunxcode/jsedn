/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const edn = require("../src/reader");
const fs = require("fs");
const micro = require("microtime");

const testJson = function(data) { 
	const now = micro.now(); 
	JSON.parse(data);
	const end = micro.now();
	return console.log(`JSON: ${end - now}`);
};

const testEdn = function(data) { 
	const now = micro.now();
	edn.parse(data);
	const end = micro.now();
	return console.log(`EDN: ${end - now}`);
};

edn.readFileSync("./test/performance-json/items.edn").each(function(file) { 
	console.log(`COMPARE ${file}`);
	testJson(fs.readFileSync(`./test/performance-json/${file}.json`, "utf-8"));
	return testEdn(fs.readFileSync(`./test/edn-tests/performance/${file}.edn`, "utf-8"));
});

