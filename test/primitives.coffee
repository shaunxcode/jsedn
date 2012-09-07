edn = require "../edn"
us = require "underscore"

#simple unit testing
passed = 0
failed = 0

isVal = (val) -> (comp) -> us.isEqual comp, val

isNotVal = (val) -> (comp) -> not us.isEqual comp, val

assert = (desc, str, pred) ->
    try  
        result = edn.parse str
    catch e 
        result = e

    if pred result
        passed++
        console.log "[OK]", desc
    else
        failed++
        console.log "[FAIL]", desc
        console.log "we got:", JSON.stringify result
#nil
# nil represents nil, null or nothing. It should be read as an object with similar meaning on the target platform.

assert "nil should be null",
    "nil"
    isVal null

assert "nil should not match nilnil",
    "nilnil"
    isNotVal null

#booleans
# true and false should be mapped to booleans.

assert "true should be true",
    "true"
    isVal true

assert "false should be false",
    "false"
    isVal false

assert "truefalse should not be true",
    "truefalse"
    isNotVal true

#strings
# "double quotes". 
# May span multiple lines. 
# Standard C/Java escape characters \t \r \n are supported.

assert 'a "string like this" should be "string like this"',
    '"a string like this"',
    isVal "a string like this"

assert 'a string "nil" should not be null',
    '"nil"'
    isNotVal null

#characters
# \a \b \c ... \z. 
# \newline, \space and \tab yield the corresponding characters.

assert 'basic \\c characters should be string',
    '\\c'
    isVal "c"

assert '\\tab is a tab',
    '\\tab'
    isVal "\t"

assert '\\newline is a newline',
    '\\newline'
    isVal "\n"

assert '\\space is a space',
    '\\space' 
    isVal " "

#symbols
# begin with a non-numeric character and can 
# contain alphanumeric characters and . * + ! - _ ?. 
# If - or . are the first character, the second character must be non-numeric. 
# Additionally, : # are allowed as constituent characters in symbols but not as the first character.
assert "basic symbol 'cat' should be 'cat'",
    'cat'
    isVal 'cat'

assert "symbol with special characters 'cat*rat-bat'",
    'cat*rat-bat'
    isVal 'cat*rat-bat'

assert "symbol with colon and hash in middle 'cat:rat#bat'",
    'cat:rat#bat'
    isVal 'cat:rat#bat'

#keywords
# :fred or :my/fred
assert "keyword starts with colon :fred is fred",
    ':fred'
    isVal 'fred'


assert "keyword can have slash :community/name", 
    ':community/name'
    isVal 'community/name'

#integers
# 0 - 9, optionally prefixed by - to indicate a negative number.
# the suffix N to indicate that arbitrary precision is desired.
assert "0 is 0",
    '0'
    isVal 0

assert "9923 is 9923",
    '9923'
    isVal 9923

assert "-9923 is -9923",
    '-9923'
    isVal -9923

#floating point numbers
# integers with frac e.g. 12.32
assert "12.32 is 12.32",
    '12.32'
    isVal 12.32

assert "-12.32 is -12.32",
    '-12.32'
    isVal -12.32

#lists
# (a b 42)
assert "basic list (a b 42) works",
    '(a b 42)'
    isVal new edn.List ['a', 'b', 42]

assert "nested list (a (b 42 (c d)))",
    '(a (b 42 (c d)))'
    isVal new edn.List ['a', new edn.List ['b', 42, new edn.List ['c', 'd']]]

#vectors
# [a b 42]
assert "vector works [a b c]",
    '[a b c]'
    isVal new edn.Vector ['a', 'b', 'c']

#maps
# {:a 1, "foo" :bar, [1 2 3] four}
assert "kv pairs in map work {:a 1 :b 2}",
    '{:a 1 :b 2}'
    isVal new edn.Map ["a", 1, "b", 2] 

assert "anything can be a key",
    '{[1 2 3] "some numbers"}'
    isVal new edn.Map [(new edn.Vector [1, 2, 3]), "some numbers"]

assert "even a map can be a key",
    '{{:name "blue" :type "color"} [ocean sky moon]}'
    isVal new edn.Map [(new edn.Map ["name", "blue", "type", "color"]), new edn.Vector ["ocean", "sky", "moon"]]

#sets
# #{a b [1 2 3]}
assert "basic set \#{1 2 3}",
    '\#{1 2 3}'
    isVal new edn.Set [1, 2, 3]

assert "a set is distinct",
    '\#{1 1 2 3}'
    isVal 'set not distinct'

#tagged elements
# #myapp/Person {:first "Fred" :last "Mertz"}
# #inst "1985-04-12T23:20:50.52Z"
# #uuid "f81d4fae-7dec-11d0-a765-00a0c91e6bf6"
assert 'basic tags work #myapp/Person {:first "Fred" :last "Mertz"}',
    '#myapp/Person {:first "Fred" :last "Mertz"}'
    isVal new edn.Tagged [(new edn.Tag "myapp/Person"), new edn.Map ["first", "Fred", "last", "Mertz"]]

assert "bare tagged pair works",
    '#inst "1985-04-12T23:20:50.52Z"'
    isVal new edn.Tagged [(new edn.Tag "inst"), "1985-04-12T23:20:50.52Z"]

console.log "PASSED: #{passed}/#{passed + failed}"
