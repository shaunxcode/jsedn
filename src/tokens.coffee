{StringObj, kw, sym} = require "./atoms"
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
	character: pattern: /^\\[A-z0-9]$/,        action: (token) -> token[-1..-1]
	tab:       pattern: /^\\tab$/,             action: (token) -> "\t"
	newLine:   pattern: /^\\newline$/,         action: (token) -> "\n"
	space:     pattern: /^\\space$/,           action: (token) -> " "
	keyword:   pattern: /^[\:].*$/,            action: (token) -> kw token
	integer:   pattern: /^[\-\+]?[0-9]+N?$/,   action: (token) -> parseInt if token is "-0" then "0" else token
	float:     pattern: /^[\-\+]?[0-9]+(\.[0-9]*)?([eE][-+]?[0-9]+)?M?$/, action: (token) -> parseFloat token
	tagged:    pattern: /^#.*$/,               action: (token) -> new Tag token[1..-1]

module.exports = {handleToken, tokenHandlers}