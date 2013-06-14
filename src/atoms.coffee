type = require "./type"

class Prim
	constructor: (val) ->
		if type(val) is "array"
			@val = (x for x in val when (not (x instanceof Discard)))
		else
			@val = val
			
	value: -> @val
	toString: -> JSON.stringify @val

class StringObj extends Prim 
	toString: -> @val
	is: (test) -> @val is test

class Discard
	
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
		
		if /^[0-9]/.test @name[0]
			throw "Symbol cannot start with a number"

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
	
keywords = {}
kw = (word) -> 
	if not keywords[word]? then keywords[word] = new Keyword word
	keywords[word]

symbols = {}
sym = (val) -> 
	if not symbols[val]? then symbols[val] = new Symbol val
	symbols[val]
	
module.exports = {Prim, Symbol, Keyword, StringObj, Discard, kw, sym}