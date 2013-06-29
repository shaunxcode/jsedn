type = require "./type"
equals = require "equals"
{Prim} = require "./atoms"
{encode} = require "./encode"

class Iterable extends Prim
	hashId: -> 
		@ednEncode()

	ednEncode: ->
		(@map (i) -> encode i).val.join " "
	
	jsonEncode: ->
		(@map (i) -> if i.jsonEncode? then i.jsonEncode() else i)
	
	jsEncode: ->
		(@map (i) -> if i?.jsEncode? then i.jsEncode() else i).val
		
	exists: (index) ->
		@val[index]?

	each: (iter) ->
		(iter i for i in @val)

	map: (iter) ->
		@each iter 

	walk: (iter) -> 
		@map (i) -> 
			if i.walk? and type(i.walk) is "function" 
				i.walk iter
			else
				iter i
		
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
	
	map: (iter) -> 
		new List @each iter
	
class Vector extends Iterable
	ednEncode: ->
		"[#{super()}]"

	jsonEncode: ->
		Vector: super()
	
	map: (iter) -> 
		new Vector @each iter
	
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

	map: (iter) -> 
		new Set @each iter

class Pair
	constructor: (@key, @val) -> 

class Map
	hashId: -> 
		@ednEncode()
		
	ednEncode: ->
		"{#{(encode i for i in @value()).join " "}}"
	
	jsonEncode: -> 
		{Map: ((if i.jsonEncode? then i.jsonEncode() else i) for i in @value())}

	jsEncode: ->
		result = {}
		for k, i in @keys
			hashId = if k?.hashId? then k.hashId() else k 
			result[hashId] = if @vals[i]?.jsEncode? then @vals[i].jsEncode() else @vals[i]

		result
		
	constructor: (@val = []) ->
		if @val.length and @val.length % 2 isnt 0 
			throw "Map accepts an array with an even number of items. You provided #{@val.length} items"
 
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
		
	indexOf: (key) -> 
		for k, i in @keys
			if equals k, key
				return i
		return undefined
		
	exists: (key) ->
		@indexOf(key)?
		
	at: (key) ->
		if (id = @indexOf key)?
			@vals[id]
		else
			throw "key does not exist"

	set: (key, val) ->
		if (id = @indexOf key)?
			@vals[id] = val
		else
			@keys.push key
			@vals.push val

		this
	each: (iter) -> 
		((iter (@at k), k) for k in @keys)

	map: (iter) ->
		result = new Map
		@each (v, k) -> 
			nv = iter v, k
			if nv instanceof Pair then [k, nv] = [nv.key, nv.val] 
			result.set k, nv
		result

	walk: (iter) -> 
		@map (v, k) ->  	
			if type(v.walk) is "function"
				iter (v.walk iter), k
			else
				iter v, k
				
module.exports = {Iterable, List, Vector, Set, Pair, Map}
