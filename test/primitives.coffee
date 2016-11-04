edn = require "../src/reader"
us = require "underscore"

{isVal, isNotVal, assert, assertParse, assertNotParse, assertEncode, logTotals} = require "./assertion"

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

assertParse "+ by itself is a valid symbol atom",
	"+"
	edn.sym "+"

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


assertParse 'a string should handle escaped quote chars',
	'"this is a string \\"and this should be escaped\\" mid string"'
	'this is a string \"and this should be escaped\" mid string'
	

assertParse 'a string can contain escaped backslash itself',
	'"this is a string with \\\\ a backslash escaped"'
	'this is a string with \\ a backslash escaped'
	
#characters
# \a \b \c ... \z. 
# \newline, \space and \tab yield the corresponding characters.

assertParse 'basic \\c characters should be string',
	'\\c'
	edn.char("c", "second arg")

assertParse '\\tab is a tab',
	'\\tab'
	edn.char "tab"

assertParse '\\newline is a newline',
	'\\newline'
	edn.char "newline"

assertParse '\\space is a space',
	'\\space' 
	edn.char "space"

assertParse "can read escaped paren",
	"\\)"
	edn.char ")"
	
#symbols
# begin with a non-numeric character and can 
# contain alphanumeric characters and . * + ! - _ ?. 
# If - or . are the first character, the second character must be non-numeric. 
# Additionally, : # are allowed as constituent characters in symbols but not as the first character.

assertNotParse "do not allow symbols to start with ~",
	"~cat"

assertNotParse "do not allow symbols to start with @",
	"@cat"

assertNotParse "do not allow non-numeric starting character",
	"0xy" 

assertParse "basic symbol 'cat' should be 'cat'",
	'cat'
	edn.sym 'cat'

assertParse "symbol with special characters 'cat*rat-bat'",
	'cat*rat-bat'
	edn.sym 'cat*rat-bat'

assertParse "symbol with colon and hash in middle 'cat:rat#bat'",
	'cat:rat#bat'
	edn.sym 'cat:rat#bat'

assertParse "symbol can start with ?",
	"?x"
	edn.sym "?x"

#keywords
# :fred or :my/fred
assertParse "keyword starts with colon :fred is edn.Keyword :fred",
	':fred'
	edn.kw ':fred'

assertParse "keyword can have slash :community/name", 
	':community/name'
	edn.kw ':community/name'

#integers
# 0 - 9, optionally prefixed by - to indicate a negative number.
# the suffix N to indicate that arbitrary precision is desired.
assertParse "0 is 0",
	'0'
	0

assertParse "-0 is 0",
	"-0"
	0
	
assertParse "9923 is 9923",
	'9923'
	9923

assertParse "-9923 is -9923",
	'-9923'
	-9923

assertParse "+9923 is 9923", 
	'+9923'
	9923 

assertParse "N for aritrary precision",
	"432N"
	432

assertParse "Very big ints remain as strings which user can deal with how they please",
	"191561942608236107294793378084303638130997321548169216"
	edn.bigInt "191561942608236107294793378084303638130997321548169216"

#floating point numbers
# integers with frac e.g. 12.32
assertParse "12.32 is 12.32",
	'12.32'
	12.32

assertParse "-12.32 is -12.32",
	'-12.32'
	-12.32

assertParse "+9923.23 is 9923.23",
	"+9923.23"
	9923.23
	
assertParse "M suffix on float",
	"223.230M"
	223.230

assertParse "E+ supported for float",
	"45.4E+43M"
	4.54e+44
	
assertParse "e+ supported for float",
	"45.4e+43M"
	4.54e+44
	
assertParse "e+ supported for float no decimal",
	"45e+43"
	4.5e44
	
#lists
# (a b 42)
assertParse "basic list (a b 42) works",
	'(a b 42)'
	new edn.List [(edn.sym 'a'), (edn.sym 'b'), 42]

assertParse "nested list (a (b 42 (c d)))",
	'(a (b 42 (c d)))'
	new edn.List [(edn.sym 'a'), new edn.List [(edn.sym 'b'), 42, new edn.List [(edn.sym 'c'), (edn.sym 'd')]]]

#vectors
# [a b 42]
assertParse "vector works [a b c]",
	'[a b c]'
	new edn.Vector [(edn.sym 'a'), (edn.sym 'b'), (edn.sym 'c')]

#maps
# {:a 1, "foo" :bar, [1 2 3] four}
assertParse "kv pairs in map work {:a 1 :b 2}",
	'{:a 1 :b 2}'
	new edn.Map [(edn.kw ":a"), 1, (edn.kw ":b"), 2] 

assertParse "anything can be a key",
	'{[1 2 3] "some numbers"}'
	new edn.Map [(new edn.Vector [1, 2, 3]), "some numbers"]

assertParse "even a map can be a key",
	'{{:name "blue" :type "color"} [ocean sky moon]}'
	new edn.Map [(new edn.Map [(edn.kw ":name"), "blue", (edn.kw ":type"), "color"]), new edn.Vector [(edn.sym "ocean"), (edn.sym "sky"), (edn.sym "moon")]]

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
assertParse "inst is handled by default",
	'#inst "1985-04-12T23:20:50.52Z"'
	new Date Date.parse "1985-04-12T23:20:50.52Z"

# #uuid "f81d4fae-7dec-11d0-a765-00a0c91e6bf6"
assertParse 'basic tags work #myapp/Person {:first "Fred" :last "Mertz"}',
	'#myapp/Person {:first "Fred" :last "Mertz"}'
	new edn.Tagged (new edn.Tag "myapp", "Person"), new edn.Map [(edn.kw ":first"), "Fred", (edn.kw ":last"), "Mertz"]

assertParse "unhandled tagged pair works",
	'#some/inst "1985-04-12T23:20:50.52Z"'
	new edn.Tagged (new edn.Tag "some", "inst"), "1985-04-12T23:20:50.52Z"

assertParse "tagged elements in a vector",
	"[a b #animal/cat rodger c d]"
	new edn.Vector [(edn.sym "a"), (edn.sym "b"), (new edn.Tagged (new edn.Tag "animal", "cat"), (edn.sym "rodger")), (edn.sym "c"), (edn.sym "d")]

edn.setTagAction new edn.Tag("myApp", "Person"), (obj) -> 
	obj.set (edn.kw ":age"), obj.at(edn.kw ":age") + 100

assertParse "tag actions are recognized", 
	"#myApp/Person {:name :walter :age 500}"
	new edn.Map [(edn.kw ":name"), (edn.kw ":walter"), (edn.kw ":age"), 600]

#Comments
#If a ; character is encountered outside of a string, that character 
#and all subsequent characters to the next newline should be ignored.
assertParse "there can be comments in a vector",
	"[valid vector\n;;comment in vector\nmore vector items]"
	new edn.Vector [(edn.sym "valid"), (edn.sym "vector"), (edn.sym "more"), (edn.sym "vector"), (edn.sym "items")]

assertParse "there can be inline comments",
	"[valid ;comment\n more items]"
	new edn.Vector [(edn.sym "valid"), (edn.sym "more"), (edn.sym "items")]

assertParse "whitespace does not affect comments",
	"[valid;touching trailing comment\nmore items]"
	new edn.Vector [(edn.sym "valid"), (edn.sym "more"), (edn.sym "items")]
	
#Discard
#If the sequence #_ is encountered outside of a string, symbol or keyword, 
#the next element should be read and discarded. Note that the next element 
#must still be a readable element. A reader should not call user-supplied 
#tag handlers during the processing of the element to be discarded.
assertParse "discarding item in vector",
	"[a b #_ c d]"
	new edn.Vector [(edn.sym "a"), (edn.sym "b"), (edn.sym "d")]

assertParse "discard an item outside of form",
	"#_ a"
	""
	
assertParse "discard touches an item",
	"[a b #_c d]"
	new edn.Vector [(edn.sym "a"), (edn.sym "b"), (edn.sym "d")]

assertParse "discard an entire form",
	"[a b #_ [a b] c d]"
	new edn.Vector [(edn.sym "a"), (edn.sym "b"), (edn.sym "c"), (edn.sym "d")]

assertParse "discard with a comment",
	"[a #_ ;we are discarding what comes next\n c d]"
	new edn.Vector [(edn.sym "a"), (edn.sym "d")]

#Whitespace
#commas are whitespace 
assertParse "no one cares about commas",
	"[a ,,,,,, b,,,,,c ,d]"
	new edn.Vector [(edn.sym "a"), (edn.sym "b"), (edn.sym "c"), (edn.sym "d")]

#Map Instances
assertParse "can lookup key",
	"{:a 1 :b 2}"
	(m) -> m.at(edn.kw ':a') is 1

assertParse "can lookup by other object",
	'{[1 2] "rabbit moon"}'
	(m) -> m.at(new edn.Vector [1, 2]) is "rabbit moon"
	
#encoding
assertEncode "can encode basic map",
	{a: 1, b: 2}
	"{\"a\" 1 \"b\" 2}"

###
This can not work from a js obj a keys are coerced to strings regardless of your intention
If a user wants numeric keys they need to use an edn.Map directly. 
assertEncode "can encode map with numeric keys",
	{1: 1, 200: 2}
	"{1 1 200 2}"
###

assertEncode "can encode a list",
	[1, 2, 3]
	"[1 2 3]"
	
assertEncode "can encode single element list",
	[1]
	"[1]"

assertEncode "Can encode nil in hash map", 
	new edn.Map [edn.kw(":x"), 1, edn.kw(":y"), null]
	"{:x 1 :y nil}"
	
assertEncode "can encode a nested list",
	[1, 2, 3, [4, 5, 6, [7, 8, 9, [10]]]]
	"[1 2 3 [4 5 6 [7 8 9 [10]]]]"
	
assertEncode "can encode list of strings",
	["a", "b", "c", "words that are strings"]
	"[\"a\" \"b\" \"c\" \"words that are strings\"]"
	
assertEncode "can encode list of maps",
	[{name: "walter", age: 30}, {name: "tony", age: 50, kids: ["a", "b", "c"]}]
	"[{\"name\" \"walter\" \"age\" 30} {\"name\" \"tony\" \"age\" 50 \"kids\" [\"a\" \"b\" \"c\"]}]"

assertEncode "can encode tagged items",
	new edn.Tagged(new edn.Tag('myApp', 'Person'), {name: "walter", age: 30})
	"#myApp/Person {\"name\" \"walter\" \"age\" 30}"

assertEncode "can handle string that start with colon",
	new edn.Vector [':a', 'b']
	"[\":a\" \"b\"]"

assertParse "can parse and look up nested item",
	"{:cat [{:hair :orange}]}"
	(r) -> edn.atPath(r, ":cat 0 :hair") is (edn.kw ":orange")
	

assertParse "can handle vector of symbols starting with ?",
	"[?x ?y ?z]"
	new edn.Vector [edn.sym("?x"), edn.sym("?y"), edn.sym("?z")]

assertEncode "can handle question marks for keywords",
	[(edn.kw ":find"), (edn.sym "?m"), (edn.kw ":where"), [(edn.sym "?m"), (edn.kw ":movie/title")]]
	"[:find ?m :where [?m :movie/title]]"


assertEncode "can handle bare _ as symbol",
	[(edn.sym "_"), (edn.kw ":likes"), (edn.sym "?x")]
	"[_ :likes ?x]"

assertEncode "can handle null",
	null
	"nil"

assertParse "reading files works as expected",
	edn.encode edn.readFileSync "#{__dirname}/test.edn" 
	new edn.Map [(edn.kw ":key"), "val", (edn.kw ":key2"), new edn.Vector [1, 2, 3]]

assertEncode "do not coerce numeric strings into numbers",
	{a: "1"}
	"{\"a\" \"1\"}"

assertEncode "encoding stringified json string handles quoting correctly",
	edn.encode JSON.stringify a: "1"
	'"\\"{\\\\\\"a\\\\\\":\\\\\\"1\\\\\\"}\\""'

assert "json decoding an encoded json stringifed object...",
	(JSON.parse edn.parse edn.encode JSON.stringify a: "1")
	a: "1"

assert "two keywords are eqaul",
	(edn.kw ":cat") is (edn.kw ":cat")
	true

assert "toJS works with nil as null",
	edn.toJS edn.parse "nil"
	null

assert "vector should handle nil",
	edn.toJS edn.parse "[nil nil nil]"
	[null, null, null]

assert "map should handle nil values",
	edn.toJS edn.parse "{x nil nil nil}"
	do -> x = x: null; x[null] = null; x


logTotals()
