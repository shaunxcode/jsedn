{assert, logTotals} = require "./assertion"
fs = require "fs"
equals = require "equals"
edn = require "../src/reader"

testDir = "./test/edn-tests/valid-edn"
jsDir = "./test/edn-tests/platforms/js"

files = fs.readdirSync "./test/edn-tests/valid-edn"
files.forEach (file) -> 
	validEdn = fs.readFileSync "#{testDir}/#{file}", "utf-8"
	expectedJs = fs.readFileSync "#{jsDir}/#{file.replace(/\..+$/, '.js')}", "utf-8"
	expected = eval "(function(){return #{expectedJs}})()"
	parsedToJs = edn.toJS edn.parse validEdn
	assert file, parsedToJs, expected

logTotals()
