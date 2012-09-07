#based on the work of martin keefe: http://martinkeefe.com/dcpl/sexp_lib.html
specialChars = '() \t\n\r'
parens = '()'
openParen = '('
closeParen = ')'

class StringObj 
	constructor: (@val) -> 
	toString: -> @val
	
lex = (string) ->
	list = []
	token = ''
	for c in string

		if c is '"'
			if in_string?
				list.push (new StringObj in_string)
				in_string = undefined
			else
				in_string = ''
			continue

		if in_string?
			in_string += c
		else if c in specialChars
			if token
				list.push token
				token = ''
			if c in parens
				list.push c
		else
			token += c
	if token
		list.push(token)
	list

#based roughly on the work of norvig from his lisp in python
read = (tokens) ->
	console.log JSON.stringify tokens
	read_ahead = (token) ->
		if token is undefined then return

		if token is openParen
			L = []
			while true
				token = tokens.shift()
				if token is undefined then throw 'unexpected end of list'

				if token is closeParen then return L else L.push read_ahead token

		else if token is closeParen then throw 'unexpected )'

		else return handle token

	token1 = tokens.shift()
	if token1 is undefined then return undefined else return read_ahead token1

handle = (token) ->
	if token instanceof StringObj
		return token.toString()
		
	for handler in handlers
		[rxp, action] = handler
		if rxp.test token
			return action token
	token

handlerActions = {}
handlers = [
	[/^nil$/, handlerActions.nil = (token) -> null]
	[/^true$|^false$/, handlerActions.boolean = (token) -> token is "true"]
	[/^\\[A-z0-9]$/, handlerActions.character = (token) -> token[-1..-1]]
	[/^\\tab$/, handlerActions.tab = (token) -> "\t"]
	[/^\\newline$/, handlerActions.newLine = (token) -> "\n"]
	[/^\\space$/, handlerActions.space = (token) -> " "]
]

exports.setHandlerAction = (handler, action) -> handlerActions[handler] = action
exports.parse = (string) -> read lex string