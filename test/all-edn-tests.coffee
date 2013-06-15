assertion = require "./assertion"
fs = require "fs"
equals = require "equals"
edn = require "../src/reader"

testDir = "./edn-tests/valid-edn"

fs.readdir "./edn-tests/valid-edn", (err, files) -> 
	files.forEach (file) -> 
		fs.readFile "#{testDir}/#{file}", "utf-8", (err, validEdn) ->
			fs.readFile "./edn-tests/platforms/js/#{file.split(".").shift()}.js", "utf-8", (err, expectedJs) ->
				expected = eval "(function(){return #{expectedJs}})()"
				parsedToJs = edn.toJS edn.parse validEdn
				correct = equals expected, parsedToJs
				if expectedJs? 
					console.log "[#{if correct then "OK" else "ERROR"}] #{file}"
					if not correct then console.log {file, expectedJs, expected, validEdn, parsedToJs, correct}
				else
					console.log "MISSING", file, "for JS: ", validEdn

