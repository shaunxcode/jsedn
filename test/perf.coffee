edn = require "../src/reader"
fs = require "fs"
micro = require "microtime"

testJson = (data) -> 
	now = micro.now() 
	JSON.parse data
	end = micro.now()
	console.log "JSON: #{end - now}"

testEdn = (data) -> 
	now = micro.now()
	edn.parse data
	end = micro.now()
	console.log "EDN: #{end - now}"

edn.readFileSync("./performance-json/items.edn").each (file) -> 
	console.log "COMPARE #{file}"
	testJson fs.readFileSync "./performance-json/#{file}.json", "utf-8"
	testEdn fs.readFileSync "./edn-tests/performance/#{file}.edn", "utf-8"

