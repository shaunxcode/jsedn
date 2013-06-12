if typeof window is "undefined"
	type = require "type-component"
else
	type = require "type"

equals = require "equals"
	
class Prim
	constructor: (val) ->
		if type(val) is "array"
			@val = (x for x in val when (not (x instanceof Discard)))
		else
			@val = val
			
	value: -> @val
	toString: -> JSON.stringify @val

class Symbol extends Prim	
	constructor: (args...) ->
		switch args.length
			when 1
				if args[0] is "/"
					@ns = null
					@name = "/"
				else
					parts = args[0].split "/"
					#e.g. new Symbol ?cat
					if parts.length is 1 
						@ns = null
						@name = parts[0]
					#e.g. new Symbol ":myPets.cats/cordelia"
					else if parts.length is 2
						@ns = parts[0]
						@name = parts[1]
					else
						throw "Can not have more than 1 forward slash in a symbol"
					
			#e.g. new Symbol ":myPets.cats", "margaret"
			when 2
				@ns = args[0]
				@name = args[1]
				
		if @name.length is 0 
			throw "Length of Symbol name can not be empty"
			
		@val = "#{if @ns then "#{@ns}/" else ""}#{@name}"

	toString: -> 
		@val 
		
	ednEncode: -> @val

	jsEncode: -> 
		@val 

	jsonEncode: -> 
		Symbol: @val 

class Keyword extends Symbol
	constructor: ->
		super
		if @val[0] isnt ":" then throw "keyword must start with a :"

	jsonEncode: ->
		Keyword: @val

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

	each: (iter) ->
		(iter i for i in @val)

	map: (iter) ->
		@each iter 
		
	at: (index) ->
		if @exists index then @val[index]

	set: (index, val) ->
		@val[index] = val
		
		this
		
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
		@val = []
		for item in val
			if item in @val 
				throw "set not distinct"
			else
				@val.push item 

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
		
	constructor: (@val = []) ->
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
			if @vals[i] isnt undefined then result.push @vals[i]
		result
		
	exists: (key) ->
		for k, i in @keys
			if equals k, key
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

	map: (iter) ->
		result = new Map
		@each (k, v) -> result.set k, iter k, v
		result

	each: (iter) -> 
		((iter k, @at k) for k in @keys)

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

	sym token

tokenHandlers =
	nil:       pattern: /^nil$/,               action: (token) -> null
	boolean:   pattern: /^true$|^false$/,      action: (token) -> token is "true"
	character: pattern: /^\\[A-z0-9]$/,        action: (token) -> token[-1..-1]
	tab:       pattern: /^\\tab$/,             action: (token) -> "\t"
	newLine:   pattern: /^\\newline$/,         action: (token) -> "\n"
	space:     pattern: /^\\space$/,           action: (token) -> " "
	keyword:   pattern: /^[\:\?].*$/,          action: (token) -> kw token
	integer:   pattern: /^[\-\+]?[0-9]+N?$/,   action: (token) -> parseInt if token is "-0" then "0" else token
	float:     pattern: /^[\-\+]?[0-9]+(\.[0-9]*)?([eE][-+]?[0-9]+)?M?$/, action: (token) -> parseFloat token
	tagged:    pattern: /^#.*$/,               action: (token) -> new Tag token[1..-1]

tagActions = 
	uuid: tag: (new Tag "uuid"), action: (obj) -> obj
	inst: tag: (new Tag "inst"), action: (obj) -> new Date Date.parse obj

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
		action: (obj) ->  "\"#{obj.toString().replace /"/g, '\\"'}\""
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
		if part[0] is ":" 
			part = kw part 
			
		if value.exists
			if value.exists(part)?
				value = value.at part 
			else
				throw "Could not find " + part
		else
			throw "Not a composite object"
	value

symbols = {}
sym = (val) -> 
	if not symbols[val]? then symbols[val] = new Symbol val
	symbols[val]
	
keywords = {}
kw = (word) -> 
	if not keywords[word]? then keywords[word] = new Keyword word
	keywords[word]

exports.Symbol = Symbol
exports.sym = sym	
exports.Keyword = Keyword
exports.kw = kw 
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
exports.toJS = (obj) -> if obj?.jsEncode? then obj.jsEncode() else obj

if typeof window is "undefined"
	fs = require "fs"
	exports.readFile = (file, cb) -> 
		fs.readFile file, "utf-8", (err, data) -> 
			if err then throw err
			cb exports.parse data

	exports.readFileSync = (file) -> 
		exports.parse fs.readFileSync file, "utf-8"

exports.compile = (string) ->
	"return require('jsedn').parse(\"#{string.replace(/"/g, '\\"').replace(/\n/g, " ").trim()}\")"


