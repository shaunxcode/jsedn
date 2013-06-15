module.exports = memo = (klass) -> 
	memo[klass] = {}
	(val) -> 
		if not memo[klass][val]? then memo[klass][val] = new klass val 
		memo[klass][val]