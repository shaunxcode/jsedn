us = require "underscore"

class Prim
	constructor: (val) ->
		if us.isArray val
			@val = us.filter val, (x) -> not (x instanceof Discard)
		else
			@val = val
			
	value: -> @val
	toString: -> JSON.stringify @val
	
class StringObj extends Prim 
	toString: -> @val
	is: (test) -> @val is test
	
class Tag extends StringObj

class Tagged extends Prim
	tag: -> @val[0]
	obj: -> @val[1]

class Discard
	
class List extends Prim

class Vector extends Prim

class Map extends Prim

class Set extends Prim
	constructor: (val) ->
		@val = us.uniq val
		
		if not us.isEqual val, @val
			throw "set not distinct"

#based on the work of martin keefe: http://martinkeefe.com/dcpl/sexp_lib.html
parens = '()[]{}'
specialChars = parens + ' \t\n\r,'

parenTypes = 
	'(' : closing: ')', class: List
	'[' : closing: ']', class: Vector
	'{' : closing: '}', class: Map

lex = (string) ->
	list = []
	token = ''
	for c in string
		if not in_string? and c is ";"
			in_comment = true
			
		if in_comment
			if c is "\n"
				in_comment = undefined
				if token 
					list.push token
					token = ''
			continue
			
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
			if token is "#_"
				list.push token
				token = ''			
			token += c

				
	if token
		list.push(token)
	list

#based roughly on the work of norvig from his lisp in python
read = (tokens) ->
	read_ahead = (token) ->
		if token is undefined then return

		if paren = parenTypes[token]
			closeParen = paren.closing
			L = []
			while true
				token = tokens.shift()
				if token is undefined then throw 'unexpected end of list'

				if token is paren.closing then return (new paren.class L) else L.push read_ahead token

		else if token in ")]}" then throw "unexpected #{token}"

		else
			handledToken = handle token
			if handledToken instanceof Tag
				token = tokens.shift()
				if token is undefined then throw 'was expecting something to follow a tag'
				tagged = new Tagged [handledToken, read_ahead token]
				if tagged.tag().is("")
					if tagged.obj() instanceof Map
						return new Set tagged.obj().value()
				
				if tagged.tag().is("_")
					return new Discard
					
				return tagged
			else
				return handledToken

	token1 = tokens.shift()
	if token1 is undefined
		return undefined 
	else
		result = read_ahead token1
		if result instanceof Discard 
			return ""
		return result

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
	[/^\:.*$/, handlerActions.keyword = (token) -> token[1..-1]]
	[/^\-?[0-9]*$/, handlerActions.integer = (token) -> parseInt token]
	[/^\-?[0-9]*\.[0-9]*$/, handlerActions.float = (token) -> parseFloat token]
	[/^#.*$/, handlerActions.tagged = (token) -> new Tag token[1..-1]]
]

exports.List = List
exports.Vector = Vector
exports.Map = Map
exports.Set = Set
exports.Tag = Tag
exports.Tagged = Tagged
exports.setHandlerAction = (handler, action) -> handlerActions[handler] = action
exports.parse = (string) -> read lex string