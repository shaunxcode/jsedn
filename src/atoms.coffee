type = require "./type"
memo = require "./memo"

class Prim
	constructor: (val) ->
		if type(val) is "array"
			@val = (x for x in val when (not (x instanceof Discard)))
		else
			@val = val
			
	value: -> @val
	toString: -> JSON.stringify @val

class BigInt extends Prim 
	ednEncode: -> @val
	
	jsEncode: -> @val
	
	jsonEncode: -> BigInt: @val 

class StringObj extends Prim 
	toString: -> @val
	is: (test) -> @val is test

charMap = newline: "\n", return: "\r", space: " ", tab: "\t", formfeed: "\f"
	
class Char extends StringObj
	ednEncode: -> "\\#{@val}"
	
	jsEncode: -> charMap[@val] or @val
	
	jsonEncode: -> Char: @val 
	
	constructor: (val) ->
		if charMap[val] or val.length is 1
			@val = val
		else
			throw "Char may only be newline, return, space, tab, formfeed or a single character - you gave [#{val}]"

class Discard
	
class Symbol extends Prim

	validRegex: /[0-9A-Za-z.*+!\-_?$%&=:#/]+/

	invalidFirstChars: [":", "#", "/"] 

	valid: (word) -> 

		if word.match(@validRegex)?[0] isnt word
			throw "provided an invalid symbol #{word}"

		if word.length is 1 and word[0] isnt "/"
			if word[0] in @invalidFirstChars 
				throw "Invalid first character in symbol #{word[0]}"

		if word[0] in ["-", "+", "."] and word[1]? and word[1].match /[0-9]/
			throw "If first char is #{word[0]} the second char can not be numeric. You had #{word[1]}"

		if word[0].match /[0-9]/
			throw "first character may not be numeric. You provided #{word[0]}"

		true 

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
						if @name is ":"
							throw "can not have a symbol of only :"
					#e.g. new Symbol ":myPets.cats/cordelia"
					else if parts.length is 2
						@ns = parts[0]
						if @ns is ""
							throw "can not have a slash at start of symbol"
						if @ns is ":"
							throw "can not have a namespace of :"
						@name = parts[1]
						if @name.length is 0 
							throw "symbol may not end with a slash."
					else
						throw "Can not have more than 1 forward slash in a symbol"
					
			#e.g. new Symbol ":myPets.cats", "margaret"
			when 2
				@ns = args[0]
				@name = args[1]
				
		if @name.length is 0 
			throw "Symbol can not be empty"
		
		@val = "#{if @ns then "#{@ns}/" else ""}#{@name}"
		@valid @val 

	toString: -> @val 
		
	ednEncode: -> @val

	jsEncode: -> @val 

	jsonEncode: -> 
		Symbol: @val 

class Keyword extends Symbol
	invalidFirstChars: ["#", "/"]

	constructor: ->
		super
		if @val[0] isnt ":" then throw "keyword must start with a :"
		if @val[1]? is "/" then throw "keyword can not have a slash with out a namespace"

	jsonEncode: ->
		Keyword: @val

char = memo Char
kw = memo Keyword
sym = memo Symbol
bigInt = memo BigInt
	
module.exports = {Prim, Symbol, Keyword, StringObj, Char, Discard, BigInt, char, kw, sym, bigInt}
