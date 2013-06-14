module.exports = (string) ->
	"return require('jsedn').parse(\"#{string.replace(/"/g, '\\"').replace(/\n/g, " ").trim()}\")"