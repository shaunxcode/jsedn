{assertNotParse, assertSkip, logTotals} = require "./assertion"
fs = require "fs"
equals = require "equals"
edn = require "../src/reader"

testDir = "./test/edn-tests/invalid-edn"

skipTests = [
    "brace-mismatch-nested-2.edn",
    "curly-unopened.edn",
    "hash-keyword.edn"
]

files = fs.readdirSync testDir
files.forEach (file) ->
    if skipTests.indexOf(file) == -1
        invalidEdn = fs.readFileSync "#{testDir}/#{file}", "utf-8"
        assertNotParse file, invalidEdn
    else
        assertSkip file

logTotals()
