{kw} = require "./atoms"

module.exports = (obj, path) -> 
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