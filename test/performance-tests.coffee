assertion = require "./assertion"
fs = require "fs"
equals = require "equals"
edn = require "../src/reader"

testDir = "./edn-tests/performance"

fs.readdir testDir, (err, files) -> 
	files.forEach (file) -> 
		fs.readFile "#{testDir}/#{file}", "utf-8", (err, validEdn) ->
			console.log "Reading #{file}"
			start = new Date
			try
				edn.parse validEdn
				stop = new Date
				console.log "Elapsed: #{stop.getTime() - start.getTime()}"
			catch e
				console.log "Error reading #{file}", e
