us = require "underscore"
fs = require "fs"
	
class Prim
	constructor: (val) ->
		if us.isArray val
			@val = us.filter val, (x) -> not (x instanceof Discard)
		else
			@val = val
			
	value: -> @val
	toString: -> JSON.stringify @val

class Symbol extends Prim
	ednEncode: -> @val

class StringObj extends Prim 
	toString: -> @val
	is: (test) -> @val is test
	
class Tag
	constructor: (@namespace, @name...) ->
		if arguments.length is 1
			[@namespace, @name...] = arguments[0].split('/')
			
	ns: -> @namespace
	dn: -> [@namespace].concat(@name).join('/')
	
class Tagged extends Prim
	constructor: (@_tag, @_obj) ->

	ednEncode: ->
		"\##{@tag().dn()} #{encode @obj()}"

	jsonEncode: ->
		Tagged: [@tag().dn(), if @obj().jsonEncode? then @obj().jsonEncode() else @obj()]
		
	tag: -> @_tag
	obj: -> @_obj

class Discard

class Iterable extends Prim
	ednEncode: ->
		(@map (i) -> encode i).join " "
	
	jsonEncode: ->
		(@map (i) -> if i.jsonEncode? then i.jsonEncode() else i)
	
	jsEncode: ->
		(@map (i) -> if i.jsEncode? then i.jsEncode() else i)
		
	exists: (index) ->
		@val[index]?

	at: (index) ->
		if @exists index then @val[index]

	set: (index, val) ->
		@val[index] = val
		
		this
		
methods = [
	'forEach', 'each', 'map', 'reduce', 'reduceRight', 'find'
	'detect', 'filter', 'select', 'reject', 'every', 'all', 'some', 'any'
	'include', 'contains', 'invoke', 'max', 'min', 'sortBy', 'sortedIndex'
	'toArray', 'size', 'first', 'initial', 'rest', 'last', 'without', 'indexOf'
	'shuffle', 'lastIndexOf', 'isEmpty', 'groupBy'
]
	
for method in methods
	do (method) ->
		Iterable.prototype[method] = -> 
			us[method].apply us, [@val].concat(us.toArray arguments)

for method in ['concat', 'join', 'slice']
	do (method) ->
		Iterable.prototype[method] = ->
			Array.prototype[method].apply @val, arguments

class List extends Iterable
	ednEncode: ->
		"(#{super()})"

	jsonEncode: ->
		List: super()
		
class Vector extends Iterable
	ednEncode: ->
		"[#{super()}]"

	jsonEncode: ->
		Vector: super()
		
class Set extends Iterable
	ednEncode: ->
		"\#{#{super()}}"

	jsonEncode: ->
		Set: super()

	constructor: (val) ->
		super()
		@val = us.uniq val

		if not us.isEqual val, @val
			throw "set not distinct"

class Map
	ednEncode: ->
		"{#{(encode i for i in @value()).join " "}}"
	
	jsonEncode: -> 
		{Map: ((if i.jsonEncode? then i.jsonEncode() else i) for i in @value())}

	jsEncode: ->
		result = {}
		for k, i in @keys
			hashId = if k.hashId? then k.hashId() else k 
			result[hashId] = if @vals[i].jsEncode? then @vals[i].jsEncode() else @vals[i]

		result
		
	constructor: (@val) ->
		@keys = []
		@vals = []
		
		for v, i in @val
			if i % 2 is 0
				@keys.push v
			else
				@vals.push v

		@val = false
	
	value: -> 
		result = []
		for v, i in @keys
			result.push v
			if @vals[i]? then result.push @vals[i]
		result
		
	exists: (key) ->
		for k, i in @keys
			if us.isEqual k, key
				return i
				
		return undefined
		
	at: (key) ->
		if (id = @exists key)?
			@vals[id]
		else
			throw "key does not exist"

	set: (key, val) ->
		if (id = @exists key)?
			@vals[id] = val
		else
			@keys.push key
			@vals.push val

		this

#based on the work of martin keefe: http://martinkeefe.com/dcpl/sexp_lib.html
parens = '()[]{}'
specialChars = parens + ' \t\n\r,'
escapeChar = '\\'
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
			
		if c is '"' and not escaping?
			if in_string?
				list.push (new StringObj in_string)
				in_string = undefined
			else
				in_string = ''
			continue

		if in_string?
			if c is escapeChar and not escaping?
				escaping = true
				continue

			if escaping? 
				escaping = undefined

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
				tagged = new Tagged handledToken, read_ahead token
				if tagged.tag().dn() is ""
					if tagged.obj() instanceof Map
						return new Set tagged.obj().value()
				
				if tagged.tag().dn() is "_"
					return new Discard
				
				if tagActions[tagged.tag().dn()]?
					return tagActions[tagged.tag().dn()].action tagged.obj()
				
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
		
	for name, handler of tokenHandlers
		if handler.pattern.test token
			return handler.action token
	token

tokenHandlers =
	nil:       pattern: /^nil$/,               action: (token) -> null
	boolean:   pattern: /^true$|^false$/,      action: (token) -> token is "true"
	character: pattern: /^\\[A-z0-9]$/,        action: (token) -> token[-1..-1]
	tab:       pattern: /^\\tab$/,             action: (token) -> "\t"
	newLine:   pattern: /^\\newline$/,         action: (token) -> "\n"
	space:     pattern: /^\\space$/,           action: (token) -> " "
	keyword:   pattern: /^[\:\?].*$/,          action: (token) -> token[1..-1]
	integer:   pattern: /^\-?[0-9]*$/,         action: (token) -> parseInt token
	float:     pattern: /^\-?[0-9]*\.[0-9]*$/, action: (token) -> parseFloat token
	tagged:    pattern: /^#.*$/,               action: (token) -> new Tag token[1..-1]

tagActions = 
	uuid: tag: (new Tag "uuid"), action: (obj) -> obj
	inst: tag: (new Tag "inst"), action: (obj) -> obj

encodeHandlers = 
	array:
		test: (obj) -> us.isArray obj
		action: (obj) -> "[#{(encode v for v in obj).join " "}]"
	integer: 
		test: (obj) -> us.isNumber(obj) and tokenHandlers.integer.pattern.test obj
		action: (obj) -> parseInt obj
	float:
		test: (obj) -> us.isNumber(obj) and tokenHandlers.float.pattern.test obj
		action: (obj) -> parseFloat obj
	keyword: 
		test: (obj) -> (us.isString obj) and (" " not in obj) and (tokenHandlers.keyword.pattern.test obj)
		action: (obj) -> obj
	string:  
		test: (obj) -> us.isString obj
		action: (obj) ->  "\"#{obj.toString().replace /"/g, '\\"'}\""
	boolean: 
		test: (obj) -> us.isBoolean obj
		action: (obj) -> if obj then "true" else "false"
	null:    
		test: (obj) -> us.isNull obj
		action: (obj) -> "nil"
	object:  
		test: (obj) -> us.isObject obj
		action: (obj) -> 
			result = []
			for k, v of obj
				result.push encode ":#{k}"
				result.push encode v
			"{#{result.join " "}}"

#ENCODING
encode = (obj) ->
	return obj.ednEncode() if obj?.ednEncode?

	for name, handler of encodeHandlers
		if handler.test obj
			return handler.action obj
	
	throw "unhandled encoding for #{JSON.stringify obj}"

encodeJson = (obj, prettyPrint) ->
	return (encodeJson obj.jsonEncode(), prettyPrint) if obj.jsonEncode?

	return if prettyPrint then (JSON.stringify obj, null, 4) else JSON.stringify obj

atPath = (obj, path) -> 
	path = path.trim().replace(/[ ]{2,}/g, ' ').split(' ')
	value = obj
	for part in path
		if value.exists
			if value.exists(part)?
				value = value.at part 
			else
				throw "Could not find " + part
		else
			throw "Not a composite object"
	value

exports.Symbol = Symbol
exports.List = List
exports.Vector = Vector
exports.Map = Map
exports.Set = Set
exports.Tag = Tag
exports.Tagged = Tagged
exports.setTagAction = (tag, action) -> tagActions[tag.dn()] = tag: tag, action: action
exports.setTokenHandler = (handler, pattern, action) -> tokenHandlers[handler] = {pattern, action}
exports.setTokenPattern = (handler, pattern) -> tokenHandlers[handler].pattern = pattern
exports.setTokenAction = (handler, action) -> tokenHandlers[handler].action = action
exports.setEncodeHandler = (handler, test, action) -> encodeHandlers[handler] = {test, action}
exports.setEncodeTest = (type, test) -> encodeHandlers[type].test = test
exports.setEncodeAction = (type, action) -> encodeHandlers[type].action = action
exports.parse = (string) -> read lex string 
exports.encode = encode
exports.encodeJson = encodeJson
exports.atPath = atPath
exports.toJS = (obj) -> if obj.jsEncode? then obj.jsEncode() else	obj
exports.readFile = (file, cb) -> 
	fs.readFile file, "utf-8", (err, data) -> 
		if err then throw err
		cb exports.parse data

exports.compile = (string) ->
	"return require('jsedn').parse(\"#{string.replace(/"/g, '\\"').replace(/\n/g, " ").trim()}\")"
exports.readFileSync = (file) -> 
	exports.parse fs.readFileSync file, "utf-8"
