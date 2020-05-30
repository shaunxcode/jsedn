/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {assertNotParse, assertSkip, logTotals} = require("./assertion");
const fs = require("fs");
const equals = require("equals");
const edn = require("../src/reader");

const testDir = "./test/edn-tests/invalid-edn";

const skipTests = [
    "brace-mismatch-nested-2.edn",
    "curly-unopened.edn",
    "hash-keyword.edn"
];

const files = fs.readdirSync(testDir);
files.forEach(function(file) {
    if (skipTests.indexOf(file) === -1) {
        const invalidEdn = fs.readFileSync(`${testDir}/${file}`, "utf-8");
        return assertNotParse(file, invalidEdn);
    } else {
        return assertSkip(file);
    }
});

logTotals();
