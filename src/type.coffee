module.exports = if typeof window is "undefined"
		require "type-component"
	else
		require "type"