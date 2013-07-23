{Char, StringObj, char, kw, sym, bigInt} = require "./atoms"
{Tag} = require "./tags"

handleToken = (token) ->
	if token instanceof StringObj
		return token.toString()
		
	for name, handler of tokenHandlers
		if handler.pattern.test token
			return handler.action token

	sym token

tokenHandlers =
	nil:       pattern: /^nil$/,               action: (token) -> null
	boolean:   pattern: /^true$|^false$/,      action: (token) -> token is "true"
	keyword:   pattern: /^[\:].*$/,            action: (token) -> kw token
	char:      pattern: /^\\.*$/,              action: (token) -> char token[1..-1]
	integer:   pattern: /^[\-\+]?[0-9]+N?$/,   action: (token) -> 
		#allows for numbers larger than js can handle
		#we purposely "box" it so that an error will occur
		#if someone attempts to treat it as a normal number
		if /\d{15,}/.test token then return bigInt token
		
		parseInt if token is "-0" then "0" else token
	float:     pattern: /^[\-\+]?[0-9]+(\.[0-9]*)?([eE][-+]?[0-9]+)?M?$/, action: (token) -> parseFloat token
	tagged:    pattern: /^#.*$/,               action: (token) -> new Tag token[1..-1]

module.exports = {handleToken, tokenHandlers}
