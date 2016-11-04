assertion = require "./assertion"
fs = require "fs"
equals = require "equals"
edn = require "../src/reader"

testDir = "./test/edn-tests/performance"

files = fs.readdirSync testDir
files.forEach (file) -> 
	validEdn = fs.readFileSync "#{testDir}/#{file}", "utf-8"
	console.log "Reading #{file}"
	start = new Date
	try
		edn.parse validEdn
		stop = new Date
		console.log "Elapsed: #{stop.getTime() - start.getTime()}"
	catch e
		console.log "Error reading #{file}", e
