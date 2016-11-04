jsedn
=====

A javascript implementation of [edn](https://github.com/edn-format/edn). To see it in action checkout the [edn playground](https://shaunxcode.github.com/jsedn). If you open your browser console you will have access to a global jsedn object with which you can try things beside JSON encoding. I recommend `jsedn.unify("[?x was always better than ?y]", {x: "sonic", y: "mario"}).jsEncode()`.  

[![Build Status](https://travis-ci.org/shaunxcode/jsedn.svg?branch=master)](https://travis-ci.org/shaunxcode/jsedn)
[![npm version](https://badge.fury.io/js/jsedn.svg)](https://www.npmjs.com/package/jsedn)
[![Coverage Status](https://coveralls.io/repos/github/shaunxcode/jsedn/badge.svg?branch=master)](https://coveralls.io/github/shaunxcode/jsedn?branch=master)


## Getting Started

### Install

```bash
npm install jsedn
```

### Use in a web page directly 
Use `jsedn.js`, which is a standalone version that will provide a global "jsedn".

### Code
```js
var edn = require("jsedn");
var map = edn.parse("{:a 5 [1 2] {:name :mike :age 40}}");
console.log(map.at(new edn.Vector([1, 2])).at(edn.kw(":name")));
```

Will output `"mike"`.

Now the other way:

```js
edn.encode({a: 1, "id": 333});
```

Will output:

```clojure
{"a" 1 "id" 333}
```

Finally lets encode js into edn then back to js:

```js
edn.parse(edn.encode({
	a: 1, 
	b: {
		age: 30, 
		feeling: ["electric", "pink"]
	}
})).at("b").at("feeling").at(0)
```
Will output `"electric"`. Definitely working in both directions. 

###Command Line
If you have installed via `npm` you will have a jsedn script that accepts input via pipe/stdin. Currently takes:

* `-s` flag for "select" which you pass a path separated by space
* `-j` encodes input as JSON
* `-p` indicates pretty print for json output

```bash
> echo "{:a first-item :b [{:name :walter :age 50 :kids [:A :B :C]}]}" | jsedn -s ":b 0 :kids 2"
outputs: :b 0 :kids 2 => :C
```
	
### Testing
I have developed this in a very test driven manner e.g. each test written before the next feature is implemented. Baring that in mind it means any bugs you find it would be awesome if you could edit the tests adding one which clearly indicates the bug/feature request.

```bash
npm install
git submodule update --init
npm test
```
	
## API
#####parse (ednString)
Will turn a valid edn string into a js object structure based upon the classes details below.

```js
edn.parse("{:a-keyword! [1 2 -3.4]}");
```

#####encode (jsObj)
Will encode both native JS and any object providing a ednEncode method.

```js
edn.encode({"a-keyword!": [1,2,-3.4]});
```

#####setTagAction (tag, action)
Will add the tag action to be performed on any data prepended by said tag.

```js
edn.setTagAction(new edn.Tag('myApp', 'tagName'), function(obj) {
	//do stuff with obj here and then return it
	var mutatedObj = thingsHandlerDoes(obj);
	return mutatedObj;
});
```

#####setTokenPattern (tokenName, pattern) 
If for some reason you would like to over-ride or add a new token pattern. 

```js
edn.setTokenPattern()))
```

#####setTokenAction (tokenName, actionCallback)
Allows for customization of token handling upon match. For instance if you decided you would prefer nil to be represented by undefined instead of null (default).

```js
edn.setTokenAction('nil', function(token) { return undefined;});
```

#####setTypeClass (type, class)
This is useful if you want to over-ride the naive implementations of Map etc. 

```js
edn.setTypeClass('List', MyListClass));
```

##### atPath (obj, path)
Simple way to lookup a value in elements returned from parse. 

```js
var parsed = edn.parse("[[{:name :frank :kids [{:eye-color :red} {:eye-color :blue}]}]]");
edn.atPath(parsed, "0 0 :kids 1 :eye-color");
```
	
path is a space separated string which consists of index (remember Array/Set/Vector are all 0 indexed) and key locations. 

##### encodeJson
Provides a json encoding including type information e.g. Vector, List, Set etc. 

```js
console.log(edn.encodeJson(edn.parse("[1 2 3 {:x 5 :y 6}]")));
```
yields:
```js
{"Vector":[1,2,3,{"Map":[{"Keyword": ":x"},5,{"Keyword":":y"},6]}]}
```
	
##### toJS 
Attempts to return a "plain" js object. Bear in mind this will yield poor results if you have any **Map** objects which utilize composite objects as keys. If an object has a **hashId** method it will use that when building the js dict. 

```js
var jsobj = edn.toJS(edn.parse("[1 2 {:name {:first :ray :last :cappo}}]"));
```
yields:
```js
[1, 2, {":name": {":first": ":ray", ":last": ":cappo"}}]
```

Notice that you can not always go back the other direction. In the example above if you were to edn.parse it you would end up with:

```clojure
[1 2 {":name" {":first" ":ray" ":last" ":cappo"}}]
```

In which you have strings for keys instead of keywords. At one point I would "infer" that if a string started with a ":" it would be treated as a keyword. This caused more problems than it resolved which brings us to our next methods. 

##### kw (string)
Interns a valid keyword into an `edn.Keyword` object e.g:

```js
edn.kw(":myns/kw")
```

##### sym (string)
Interns a valid symbol into an `edn.Symbol` object e.g:

```js
edn.sym("?name")
```

##### unify (data, values, [tokenStart])
Unifies the first form with the second. Useful for populating a "data template". It accepts either edn objects or strings as arguments. 

```js
edn.unify("{?key1 ?key1-val ?key2 ?key2-val :all [?key1-val ?key2-val]}", "{key1 :x key1-val 200 key2 :y key2-val 300}");
```
yields:
```clojure
{:x 200 :y 300 :all [200 300]}
```
	
A third argument is expected which can be used to indicate the "tokenStart" first character for unify tokens. This defaults to "?". 

An example with Map as data and js obj as values and changing the tokenStart to $

```js
edn.unify(new edn.Map([edn.kw(":place"), edn.sym("$place")]), {place: "salt lake city"}, "$");
```
yields:
```clojure
{:place "salt lake city"}
```

## Classes/Interfaces

#### Symbol
Used to create symbols from with in js for encoding into edn. 

### Keyword
As above but for keywords. Note that the constructor enforced that keywords start with a ":" character. 

####Iterable [List Vector Set]
List, Vector and Set all implement the following methods:

* `exists (key)` -> boolean indicating existance of key
* `at (key)` -> value at key in collection
* `set (key, val)` -> sets key/index to given value
* `each (iter)` -> iterate overa all members calling iter on each, returns results
* `map (iter)` -> iterate over all members calling iter on each and returning a new instace of self
* `walk (iter)` -> recursively walk the data returning a new instance of self 
	
####Map
Supports any type of object as key. Supports all of the methods listed for Iterable plus `indexOf` which returns the index of the item, which can be 0 and thus non-truthy. 

`each`, `map` and `walk` all accept a callback which takes the value as the first argument and the key as the second. In the case of map and walk if you want to modify the key you must return a `Pair` object e.g. 

```js
edn.parse("{:x 300 y: 800}").map(function(val, key){
	return new edn.Pair(edn.kw("#{key}-squared"), val * val);
});
```
yields:
```clojure
{:x-squared 90000 :y-squared 640000}
```
	
####Tag
Used for defining Tag Actions. Has a constructor which accepts 2..n args where the first arg is your a namespace and the rest are used to categorize the tag. **Tag** provides two methods `ns` and `dn`:

```js
var tag = new edn.Tag('myApp', 'people', 'special', 'stuff');
console.log(tag.ns()); => myApp
console.log(tag.dn()); => myApp/people/special/stuff
```

Constructor also supports being passed single argument delimited by / e.g:
```js
new edn.Tag('myApp/people/special/stuff')
```

####Tagged
If you do not have tag handlers specified for a given tag you will end up with **Tagged** items in your result which have two methods: 

	tag() -> Tag object found
	obj() -> Object to be tagged

**Tagged** pairs can also be used when you want to serialize a js obj into edn w/ said tagging e.g. 
	
```js
edn.encode(new edn.Tagged(new edn.Tag("myApp", "Person"), {name: "walter", age: 300}));
```

outputs: 

```clojure
#myApp/person {"name" "walter" "age" 300}
```

##Conversion Table

| element         | edn                  | jsedn              | js |
| --------------- | -------------------- | ------------------ | --- |
| nil             | ```nil```            | ```null```         | ```null``` | 
| boolean         | ```true false```     | ```true false```   | ```true false``` | 
| character       | ```\c```             | ```"c"```          | ```"c"``` | 
| string          | ```"some string"```  | ```"some string"``` | ```"some string"``` |
| symbol          | ```?sym~b~o!ol```    | ```edn.sym "?sym~b~o!ol"``` | ```"?sym~b~o!ol"``` | 
| keywords        | ```:keyword```       | ```edn.kw ":keyword"```| ```":keyword"``` |  
| integer         | ```666```            | ```666```          | ```666``` | 
| floating point  | ```-6.66```          | ```-6.66```        | ```-6.66``` | 
| list            | ```(a b (c d))```    | ```new edn.List([edn.sym("a"), edn.sym("b"), new edn.List([edn.sym("c"), edn.sym("d")])])``` | ```["a", "b", ["c", "d"]]``` | 
| vector          | ```[a b c]```        | ```new edn.Vector([edn.sym("a"), edn.sym("b"), edn.sym("c")])``` | ```["a", "b", "c"]``` |
| map             | ```{:a 1 :b 2}```    | ```new edn.Map([edn.kw(":a"), 1, edn.kw(":b"), 2])``` | ```{a: 1, b: 2}``` |
| set             | ```#{1 2 3}```       | ```new edn.Set([1, 2, 3])``` | ```[1 2 3]``` | 
| tagged elements | ```#tagName [1 2]``` | ```new edn.Tagged(new edn.Tag("tagName"), new edn.Vector([1, 2]))``` | n/a |
