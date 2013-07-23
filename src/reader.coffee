type = require "./type"
{Prim, Symbol, Keyword, StringObj, Char, Discard, BigInt, char, kw, sym ,bigInt} = require "./atoms"
{Iterable, List, Vector, Set, Pair, Map} = require "./collections"
{Tag, Tagged, tagActions} = require "./tags"
{encodeHandlers, encode, encodeJson} = require "./encode"
{handleToken, tokenHandlers} = require "./tokens"

typeClasses = {Map, List, Vector, Set, Discard, Tag, Tagged, StringObj}
parens = '()[]{}'
specialChars = parens + ' \t\n\r,'
escapeChar = '\\'
parenTypes = 
	'(' : closing: ')', class: "List"
	'[' : closing: ']', class: "Vector"
	'{' : closing: '}', class: "Map"

#based on the work of martin keefe: http://martinkeefe.com/dcpl/sexp_lib.html
lex = (string) ->
	list = []
	lines = []
	line = 1
	token = ''
	for c in string
		if c in ["\n", "\r"] then line++

		if not in_string? and c is ";" and not escaping?
			in_comment = true
			
		if in_comment
			if c is "\n"
				in_comment = undefined
				if token 
					list.push token
					lines.push line 
					token = ''
			continue
			
		if c is '"' and not escaping?
			if in_string?
				list.push (new StringObj in_string)
				lines.push line 
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
				if c in ["t", "n", "f", "r"] 
					in_string += escapeChar

			in_string += c
		else if c in specialChars and not escaping?
			if token
				list.push token
				lines.push line 
				token = ''
			if c in parens
				list.push c
				lines.push line 
		else
			if escaping
				escaping = undefined
			else if c is escapeChar
				escaping = true
			
			if token is "#_"
				list.push token
				lines.push line
				token = ''
			token += c

	if token
		list.push(token)
		lines.push line 
	{tokens: list, tokenLines: lines}

#based roughly on the work of norvig from his lisp in python
read = (ast) ->
	{tokens, tokenLines} = ast

	read_ahead = (token, tokenIndex = 0, expectSet = false) ->
		if token is undefined then return

		if (not (token instanceof StringObj)) and paren = parenTypes[token]
			closeParen = paren.closing
			L = []
			while true
				token = tokens.shift()

				if token is undefined then throw "unexpected end of list at line #{tokenLines[tokenIndex]}"

				tokenIndex++
				if token is paren.closing
					return new typeClasses[if expectSet then "Set" else paren.class] L
				else 
					L.push read_ahead token, tokenIndex

		else if token in ")]}"
			throw "unexpected #{token} at line #{tokenLines[tokenIndex]}"
		else
			handledToken = handleToken token
			if handledToken instanceof Tag
				token = tokens.shift()
				tokenIndex++

				if token is undefined then throw "was expecting something to follow a tag at line #{tokenLines[tokenIndex]}"

				tagged = new typeClasses.Tagged handledToken, read_ahead token, tokenIndex, handledToken.dn() is ""

				if handledToken.dn() is ""
					if tagged.obj() instanceof typeClasses.Set
						return tagged.obj()
					else
						throw "Exepected a set but did not get one at line #{tokenLines[tokenIndex]}"
					
				if tagged.tag().dn() is "_"
					return new typeClasses.Discard
				
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
		if result instanceof typeClasses.Discard 
			return ""
		return result
		
parse = (string) -> read lex string 

module.exports = 
	Char: Char
	char: char
	Iterable: Iterable
	Symbol: Symbol
	sym: sym	
	Keyword: Keyword
	kw: kw
	BigInt: BigInt
	bigInt: bigInt 
	List: List
	Vector: Vector
	Pair: Pair
	Map: Map
	Set: Set
	Tag: Tag
	Tagged: Tagged

	setTypeClass: (typeName, klass) -> 
		if typeClasses[typeName]?
			module.exports[typeName] = klass 
			typeClasses[typeName] = klass
			
	setTagAction: (tag, action) -> tagActions[tag.dn()] = tag: tag, action: action
	setTokenHandler: (handler, pattern, action) -> tokenHandlers[handler] = {pattern, action}
	setTokenPattern: (handler, pattern) -> tokenHandlers[handler].pattern = pattern
	setTokenAction: (handler, action) -> tokenHandlers[handler].action = action
	setEncodeHandler: (handler, test, action) -> encodeHandlers[handler] = {test, action}
	setEncodeTest: (type, test) -> encodeHandlers[type].test = test
	setEncodeAction: (type, action) -> encodeHandlers[type].action = action
	parse: parse
	encode: encode
	encodeJson: encodeJson
	toJS: (obj) -> if obj?.jsEncode? then obj.jsEncode() else obj
	atPath: require "./atPath"
	unify: require("./unify")(parse)
	compile: require "./compile"

if typeof window is "undefined"
	fs = require "fs"
	module.exports.readFile = (file, cb) -> 
		fs.readFile file, "utf-8", (err, data) -> 
			if err then throw err
			cb parse data

	module.exports.readFileSync = (file) -> 
		parse fs.readFileSync file, "utf-8"
