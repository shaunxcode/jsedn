edn = require "../edn.coffee"
us = require "underscore"

#simple unit testing
passed = 0
failed = 0

isVal = (val) -> (comp) -> us.isEqual comp, val

isNotVal = (val) -> (comp) -> not us.isEqual comp, val

assert = (desc, result, pred) ->
	if not us.isFunction pred
		pred = isVal pred

	if pred result
		passed++
		console.log "[OK]", desc
	else
		failed++
		console.log "[FAIL]", desc
		console.log "we got:", JSON.stringify result

assertParse = (desc, str, pred) ->
	try	 
		result = edn.parse str
	catch e 
		result = e
		
	assert desc, result, pred

assertEncode = (desc, obj, pred) ->
	assert desc, (edn.encode obj), pred
#nil
# nil represents nil, null or nothing. It should be read as an object with similar meaning on the target platform.

assertParse "nil should be null",
	"nil"
	null

assertParse "nil should not match nilnil",
	"nilnil"
	isNotVal null

#booleans
# true and false should be mapped to booleans.

assertParse "true should be true",
	"true"
	true

assertParse "false should be false",
	"false"
	false

assertParse "truefalse should not be true",
	"truefalse"
	isNotVal true

#strings
# "double quotes". 
# May span multiple lines. 
# Standard C/Java escape characters \t \r \n are supported.

assertParse 'a "string like this" should be "string like this"',
	'"a string like this"',
	"a string like this"

assertParse 'a string "nil" should not be null',
	'"nil"'
	isNotVal null

#characters
# \a \b \c ... \z. 
# \newline, \space and \tab yield the corresponding characters.

assertParse 'basic \\c characters should be string',
	'\\c'
	"c"

assertParse '\\tab is a tab',
	'\\tab'
	"\t"

assertParse '\\newline is a newline',
	'\\newline'
	"\n"

assertParse '\\space is a space',
	'\\space' 
	" "

#symbols
# begin with a non-numeric character and can 
# contain alphanumeric characters and . * + ! - _ ?. 
# If - or . are the first character, the second character must be non-numeric. 
# Additionally, : # are allowed as constituent characters in symbols but not as the first character.
assertParse "basic symbol 'cat' should be 'cat'",
	'cat'
	'cat'

assertParse "symbol with special characters 'cat*rat-bat'",
	'cat*rat-bat'
	'cat*rat-bat'

assertParse "symbol with colon and hash in middle 'cat:rat#bat'",
	'cat:rat#bat'
	'cat:rat#bat'

#keywords
# :fred or :my/fred
assertParse "keyword starts with colon :fred is fred",
	':fred'
	'fred'


assertParse "keyword can have slash :community/name", 
	':community/name'
	'community/name'

#integers
# 0 - 9, optionally prefixed by - to indicate a negative number.
# the suffix N to indicate that arbitrary precision is desired.
assertParse "0 is 0",
	'0'
	0

assertParse "9923 is 9923",
	'9923'
	9923

assertParse "-9923 is -9923",
	'-9923'
	-9923

#floating point numbers
# integers with frac e.g. 12.32
assertParse "12.32 is 12.32",
	'12.32'
	12.32

assertParse "-12.32 is -12.32",
	'-12.32'
	-12.32

#lists
# (a b 42)
assertParse "basic list (a b 42) works",
	'(a b 42)'
	new edn.List ['a', 'b', 42]

assertParse "nested list (a (b 42 (c d)))",
	'(a (b 42 (c d)))'
	new edn.List ['a', new edn.List ['b', 42, new edn.List ['c', 'd']]]

#vectors
# [a b 42]
assertParse "vector works [a b c]",
	'[a b c]'
	new edn.Vector ['a', 'b', 'c']

#maps
# {:a 1, "foo" :bar, [1 2 3] four}
assertParse "kv pairs in map work {:a 1 :b 2}",
	'{:a 1 :b 2}'
	new edn.Map ["a", 1, "b", 2] 

assertParse "anything can be a key",
	'{[1 2 3] "some numbers"}'
	new edn.Map [(new edn.Vector [1, 2, 3]), "some numbers"]

assertParse "even a map can be a key",
	'{{:name "blue" :type "color"} [ocean sky moon]}'
	new edn.Map [(new edn.Map ["name", "blue", "type", "color"]), new edn.Vector ["ocean", "sky", "moon"]]

#sets
# #{a b [1 2 3]}
assertParse "basic set \#{1 2 3}",
	'\#{1 2 3}'
	new edn.Set [1, 2, 3]

assertParse "a set is distinct",
	'\#{1 1 2 3}'
	'set not distinct'

#tagged elements
# #myapp/Person {:first "Fred" :last "Mertz"}
# #inst "1985-04-12T23:20:50.52Z"
# #uuid "f81d4fae-7dec-11d0-a765-00a0c91e6bf6"
assertParse 'basic tags work #myapp/Person {:first "Fred" :last "Mertz"}',
	'#myapp/Person {:first "Fred" :last "Mertz"}'
	new edn.Tagged (new edn.Tag "myapp", "Person"), new edn.Map ["first", "Fred", "last", "Mertz"]

assertParse "unhandled tagged pair works",
	'#some/inst "1985-04-12T23:20:50.52Z"'
	new edn.Tagged (new edn.Tag "some", "inst"), "1985-04-12T23:20:50.52Z"

assertParse "tagged elements in a vector",
	"[a b #animal/cat rodger c d]"
	new edn.Vector ["a", "b", (new edn.Tagged (new edn.Tag "animal", "cat"), "rodger"), "c", "d"]

edn.setTagAction new edn.Tag("myApp", "Person"), (obj) -> 
	obj.set "age", obj.at("age") + 100

assertParse "tag actions are recognized", 
	"#myApp/Person {:name :walter :age 500}"
	new edn.Map ["name", "walter", "age", 600]

#Comments
#If a ; character is encountered outside of a string, that character 
#and all subsequent characters to the next newline should be ignored.
assertParse "there can be comments in a vector",
	"[valid vector\n;;comment in vector\nmore vector items]"
	new edn.Vector ["valid", "vector", "more", "vector", "items"]

assertParse "there can be inline comments",
	"[valid ;comment\n more items]"
	new edn.Vector ["valid", "more", "items"]

assertParse "whitespace does not affect comments",
	"[valid;touching trailing comment\nmore items]"
	new edn.Vector ["valid", "more", "items"]
	
#Discard
#If the sequence #_ is encountered outside of a string, symbol or keyword, 
#the next element should be read and discarded. Note that the next element 
#must still be a readable element. A reader should not call user-supplied 
#tag handlers during the processing of the element to be discarded.
assertParse "discarding item in vector",
	"[a b #_ c d]"
	new edn.Vector ["a", "b", "d"]

assertParse "discard an item outside of form",
	"#_ a"
	""
	
assertParse "discard touches an item",
	"[a b #_c d]"
	new edn.Vector ["a", "b", "d"]

assertParse "discard an entire form",
	"[a b #_ [a b] c d]"
	new edn.Vector ["a", "b", "c", "d"]

assertParse "discard with a comment",
	"[a #_ ;we are discarding what comes next\n c d]"
	new edn.Vector ["a", "d"]

#Whitespace
#commas are whitespace 
assertParse "no one cares about commas",
	"[a ,,,,,, b,,,,,c ,d]"
	new edn.Vector ["a", "b", "c", "d"]

#Map Instances
assertParse "can lookup key",
	"{:a 1 :b 2}"
	(m) -> m.at('a') is 1

assertParse "can lookup by other object",
	'{[1 2] "rabbit moon"}'
	(m) -> m.at(new edn.Vector [1, 2]) is "rabbit moon"
	
#encoding
assertEncode "can encode basic map",
	{a: 1, b: 2}
	"{:a 1 :b 2}"

assertEncode "can encode map with numeric keys",
	{1: 1, 200: 2}
	"{1 1 200 2}"

assertEncode "can encode a list",
	[1, 2, 3]
	"(1 2 3)"
	
assertEncode "can encode single element list",
	[1]
	"(1)"
	
assertEncode "can encode a nested list",
	[1, 2, 3, [4, 5, 6, [7, 8, 9, [10]]]]
	"(1 2 3 (4 5 6 (7 8 9 (10))))"
	
assertEncode "can encode list of strings",
	["a", "b", "c", "words that are strings"]
	"(\"a\" \"b\" \"c\" \"words that are strings\")"
	
assertEncode "can encode list of maps",
	[{name: "walter", age: 30}, {name: "tony", age: 50, kids: ["a", "b", "c"]}]
	"({:name \"walter\" :age 30} {:name \"tony\" :age 50 :kids (\"a\" \"b\" \"c\")})"

assertEncode "can encode tagged items",
	new edn.Tagged(new edn.Tag('myApp', 'Person'), {name: "walter", age: 30})
	"#myApp/Person {:name \"walter\" :age 30}"

assertEncode "can handle keys that start with colon",
	new edn.Vector [':a', 'b']
	"[:a \"b\"]"

console.log "PASSED: #{passed}/#{passed + failed}"
