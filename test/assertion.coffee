edn = require "../src/reader"
us = require "underscore"

passed = 0
failed = 0
skipped = 0

isVal = (val) -> (comp) -> us.isEqual comp, val

isNotVal = (val) -> (comp) -> not us.isEqual comp, val

assert = (desc, result, pred) ->
	if not us.isFunction pred
		pred = isVal pred

	if pred result
		passed++
		console.log "[OK]", desc
	else
		failed++
		console.log "[FAIL]", desc
		console.log "we got:", if result.jsEncode? then result.jsEncode() else result

assertParse = (desc, str, pred) ->
	try	 
		result = edn.parse str
	catch e 
		result = e

	assert desc, result, pred

assertNotParse = (desc, str) -> 
	try 
		edn.parse str
		result = false
	catch e
		result = true

	assert desc, str, -> result

assertEncode = (desc, obj, pred) ->
	assert desc, (edn.encode obj), pred
	
assertSkip = (desc) ->
	skipped++
	console.log "[SKIP]", desc

totalString = -> 
	"PASSED: #{passed}/#{passed + failed}" +
	(if skipped then ", SKIPPED: #{skipped}" else "")

logTotals = ->
	console.log totalString(), "\n"
	if failed > 0
		process.exit 1
	
module.exports = {isVal, isNotVal, assert, assertParse, assertNotParse, assertEncode, assertSkip, logTotals}