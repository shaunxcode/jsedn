type = require "./type"
{tokenHandlers} = require "./tokens"

encodeHandlers = 
	array:
		test: (obj) -> type(obj) is "array"
		action: (obj) -> "[#{(encode v for v in obj).join " "}]"
	integer: 
		test: (obj) -> type(obj) is "number" and tokenHandlers.integer.pattern.test obj
		action: (obj) -> parseInt obj
	float:
		test: (obj) -> type(obj) is "number" and tokenHandlers.float.pattern.test obj
		action: (obj) -> parseFloat obj
	string:  
		test: (obj) -> type(obj) is "string"
		action: (obj) ->  "\"#{obj.toString().replace /"|\\/g, '\\$&'}\""
	boolean: 
		test: (obj) -> type(obj) is "boolean"
		action: (obj) -> if obj then "true" else "false"
	null:    
		test: (obj) -> type(obj) is "null"
		action: (obj) -> "nil"
	date:
		test: (obj) -> type(obj) is "date" 
		action: (obj) -> "#inst \"#{obj.toISOString()}\""
	object:  
		test: (obj) -> type(obj) is "object"
		action: (obj) -> 
			result = []
			for k, v of obj
				result.push encode k
				result.push encode v
			"{#{result.join " "}}"

encode = (obj) ->
	return obj.ednEncode() if obj?.ednEncode?

	for name, handler of encodeHandlers
		if handler.test obj
			return handler.action obj

	throw "unhandled encoding for #{JSON.stringify obj}"

encodeJson = (obj, prettyPrint) ->
	return (encodeJson obj.jsonEncode(), prettyPrint) if obj.jsonEncode?

	return if prettyPrint then (JSON.stringify obj, null, 4) else JSON.stringify obj

module.exports = {encodeHandlers, encode, encodeJson}