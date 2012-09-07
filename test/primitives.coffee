edn = require "../edn"

#simple unit testing
isVal = (val) -> (comp) -> comp is val
isNotVal = (val) -> (comp) -> comp isnt val
assert = (desc, str, pred) -> 
    if pred edn.parse str
        console.log "[OK]", desc, "\n"
    else
        console.log "[FAIL]", desc, "\n"

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
    '\\newline',
    isVal "\n"

assert '\\space is a space',
    '\\space', 
    isVal " "

#symbols
# begin with a non-numeric character and can 
# contain alphanumeric characters and . * + ! - _ ?. 
# If - or . are the first character, the second character must be non-numeric. 
# Additionally, : # are allowed as constituent characters in symbols but not as the first character.

#keywords
# :fred or :my/fred

#integers
# 0 - 9, optionally prefixed by - to indicate a negative number.
# the suffix N to indicate that arbitrary precision is desired.

#floating point numbers
# integers with frac e.g. 12.32

#lists
# (a b 42)

#vectors
# [a b 42]

#maps
# {:a 1, "foo" :bar, [1 2 3] four}

#sets
# #{a b [1 2 3]}

#tagged elements
# #myapp/Person {:first "Fred" :last "Mertz"}
# #inst "1985-04-12T23:20:50.52Z"
# #uuid "f81d4fae-7dec-11d0-a765-00a0c91e6bf6"

