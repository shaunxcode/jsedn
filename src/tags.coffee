{Prim} = require "./atoms"
type = require "./type"

class Tag
	constructor: (@namespace, @name...) ->
		if arguments.length is 1
			[@namespace, @name...] = arguments[0].split('/')
			
	ns: -> @namespace
	dn: -> [@namespace].concat(@name).join('/')
	
class Tagged extends Prim
	constructor: (@_tag, @_obj) ->

	jsEncode: -> 
		tag: @tag().dn(), value: @obj().jsEncode()

	ednEncode: ->
		"\##{@tag().dn()} #{require("./encode").encode @obj()}"

	jsonEncode: ->
		Tagged: [@tag().dn(), if @obj().jsonEncode? then @obj().jsonEncode() else @obj()]
		
	tag: -> @_tag
	obj: -> @_obj

	walk: (iter) ->
		new Tagged @_tag, if type(@_obj.walk) is "function" then @_obj.walk iter else iter @_obj
		
tagActions =
	uuid: tag: (new Tag "uuid"), action: (obj) -> obj
	inst: tag: (new Tag "inst"), action: (obj) -> new Date Date.parse obj
	
module.exports = {Tag, Tagged, tagActions}
