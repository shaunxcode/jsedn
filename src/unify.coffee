type = require "./type"
{Map, Pair} = require "./collections"
{Symbol, kw, sym} = require "./atoms"

module.exports = (parse) -> (data, values, tokenStart = "?") ->
	if type(data) is "string" then data = parse data 
	if type(values) is "string" then values = parse values
	
	valExists = (v) -> 
		if values instanceof Map 
			if values.exists v then values.at v
			else if values.exists sym(v) then values.at sym(v)
			else if values.exists kw(":#{v}") then values.at kw(":#{v}")
		else
			values[v]

	unifyToken = (t) -> 
		if t instanceof Symbol and "#{t}"[0] is tokenStart and (val = valExists "#{t}"[1..-1])? then return val else t

	data.walk (v, k) -> 
		if k? then new Pair(unifyToken(k), unifyToken(v)) else unifyToken v