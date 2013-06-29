assertion = require "./assertion"
fs = require "fs"
equals = require "equals"
edn = require "../src/reader"

testDir = "./edn-tests/invalid-edn"

fs.readdir testDir, (err, files) -> 
	files.forEach (file) -> 
		fs.readFile "#{testDir}/#{file}", "utf-8", (err, invalidEdn) ->
			try
				r = edn.parse invalidEdn
				console.log "[FAIL] #{file} was parsed\n\tPARSED: #{invalidEdn}\n\tINTO: #{r}"
			catch e
				console.log "[OK] #{invalidEdn} was NOT parsed - which is a good thing\n\tGOT: #{e}"

