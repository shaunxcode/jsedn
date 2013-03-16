jsedn
=====

A javascript implementation of [edn](https://github.com/edn-format/edn). 

## Getting Started

### Install
	npm install jsedn

### Code
	var edn = require("jsedn");
	var map = edn.parse("{:a 5 [1 2] {:name :mike :age 40}}");
	console.log(map.at(new edn.Vector([1, 2])).at("name"));

Will output ```"mike"```.

Now the other way:

	edn.encode({a: 1, "country/id": 333});

Will output ```{:a 1 :country/id 333}```. Finally lets encode js into edn then back to js:

	edn.parse(edn.encode({
		a: 1, 
		b: {
			age: 30, 
			feeling: ["electric", "pink"]
		}
	})).at("b").at("feeling")
Will output ```["electric", "pink"]```. Definitely working in both directions. 

###Command Line
If you have installed via npm you will have a jsedn script that accepts input via pipe/stdin. Currently takes -s flag for "select" which you pass a path separated by space. -j encodes input as JSON. -p indicates pretty print for json output.

	> echo "{:a first-item :b [{:name :walter :age 50 :kids [:A :B :C]}]}" | jsedn -s "b 0 kids 2"
	outputs: b 0 kids 2 => :C
	
### Testing
I have developed this in a very test driven manner e.g. each test written  before the next feature is implemented. Baring that in mind it means any bugs you find it would be awesome if you could edit the tests adding one which clearly indicates the bug/feature request.

	coffee tests/primitives.coffee
	
## API
#####parse (ednString)
Will turn a valid edn string into a js object structure based upon the classes details below.

	edn.parse("{:a-keyword! [1 2 -3.4]}");


#####encode (jsObj)
Will encode both native JS and any object providing a ednEncode method.

	edn.encode({"a-keyword!": [1,2,-3.4]});

Currently the choice has been made that any string it encounters will be marshalled into a keyword if it can e.g. it does not have spaces in it and does not start with any prohibited characters. Thus:

	edn.encode({a: 1, b:2}) #outputs: "{:a 1 :b 2}"

#####setTagAction (tag, action)
Will add the tag action to be performed on any data prepended by said tag.

	edn.setTagAction(new edn.Tag('myApp', 'tagName'), function(obj) {
		//do stuff with obj here and then return it
		var mutatedObj = thingsHandlerDoes(obj);
		return mutatedObj;
	});

#####setTokenPattern (tokenName, pattern) 
If for some reason you would like to over-ride or add a new token pattern. 

	edn.setTokenPattern()))

#####setTokenAction (tokenName, actionCallback)
Allows for customization of token handling upon match. For instance if you decided you would prefer nil to be represented by undefined instead of null (default).

	edn.setTokenAction('nil', function(token) { return undefined;});

#####setTypeClass (type, class)
This is useful if you want to over-ride the naive implementations of Map etc. 

	edn.setTypeClass('List', MyListClass));

##### atPath (obj, path)
Simple way to lookup a value in elements returned from parse. 

	var parsed = edn.parse("[[{:name :frank :kids [{:eye-color :red} {:eye-color :blue}]}]]");
	edn.atPath(parsed, "0 0 kids 1 eye-color");
	
path is a space separated string which consists of index (remember Array/Set/Vector are all 0 indexed) and key locations. 

##### encodeJson
Provides a json encoding including type information e.g. Vector, List, Set etc. 

	console.log(edn.encodeJson(edn.parse("[1 2 3 {:x 5 :y 6}]")));
	#yields
	{"Vector":[1,2,3,{"Map":["x",5,"y",6]}]}
	
##### toJS 
Attempts to return a "plain" js object. Bare in mind this will yield poor results if you have any **Map** objects which utilize composite objects as keys. If an object has a **hashId** method it will use that when building the js dict. 

	var jsobj = edn.toJS(edn.parse("[1 2 {:name {:first :ray :last :cappo}}]"));
	#yields
	[1, 2, {name: {first: "ray", last: "cappo"}}]


## Classes/Interfaces

####Pattern
	test (token)
Usually this is just a regular expression (which thus has a test method)

####Iterable [List Vector Set]
All the above support methods ```exists``` and ```at```. 

	exists (key) -> boolean indicating existance of key
	at (key) -> value at key in collection
	set (key, val) -> sets key/index to given value
	
Also supports the following methods mixed in from [underscore.js](http://www.underscorejs.org):
 
	forEach, each, map, reduce, reduceRight, find, detect, filter, select, reject, every
	all, some, any, include, contains, invoke, max, min, sortBy, sortedIndex, toArray, size
	first, initial, rest, last, without, indexOf, shuffle, lastIndexOf, isEmpty, groupBy

####Map
Supports any type of object as key. Like Iterable **Map** provides ```exists``` and ```at```. With the difference being that ```exists``` now returns the index of the item instead of boolean. 

####Tag
Used for defining Tag Actions. Has a constructor which accepts 2..n args where the first arg is your a namespace and the rest are used to categorize the tag. **Tag** provides two methods ```ns``` and ````dn```:

	var tag = new edn.Tag('myApp', 'people', 'special', 'stuff');
	console.log(tag.ns()); => myApp
	console.log(tag.dn()); => myApp/people/special/stuff

Constructor also supports being passed single argument delimited by / e.g. ```new edn.Tag('myApp/people/special/stuff')```. 

####Tagged
If you do not have tag handlers specified for a given tag you will end up with **Tagged** items in your result which have two methods: 

	tag() -> Tag object found
	obj() -> Object to be tagged

**Tagged** pairs can also be used when you want to serialize a js obj into edn w/ said tagging e.g. 
	
	edn.encode(new edn.Tagged(new edn.Tag("myApp", "Person"), {name: "walter", age: 300}));

outputs: 
	
	#myApp/person {:name :walter :age 300}

Note that ```"walter"``` becomes ```:walter``` as any string which can be a symbol is treated as such.

##Conversion Table

| element         | edn                  | jsedn              | js |
| --------------- | -------------------- | ------------------ | --- |
| nil             | ```nil```            | ```null```         | ```null``` | 
| boolean         | ```true false```     | ```true false```   | ```true false``` | 
| character       | ```\c```             | ```"c"```          | ```"c"``` | 
| string          | ```"some string"```  | ```"some string"``` | ```"some string"``` |
| symbol          | ```:sym~b~o!ol```    | ```"sym~b~o!ol"``` | ```"sym~b~o!ol"``` | 
| integer         | ```666```            | ```666```          | ```666``` | 
| floating point  | ```-6.66```          | ```-6.66```        | ```-6.66``` | 
| list            | ```(a b (c d))```    | ```new edn.List(["a", "b", new edn.List(["c", "d"])])``` | ```["a", "b", ["c", "d"]]``` | 
| vector          | ```[a b c]```        | ```new edn.Vector(["a", "b", "c"])``` | ```["a", "b", "c"]``` |
| map             | ```{:a 1 :b 2}```    | ```new edn.Map(["a", 1, "b", 2])``` | ```{a: 1, b: 2}``` |
| set             | ```#{1 2 3}```       | ```new edn.Set([1, 2, 3])``` | ```[1 2 3]``` | 
| tagged elements | ```#tagName [1 2]``` | ```new edn.Tagged(new edn.Tag("tagName"), new end.Vector([1, 2]))``` | n/a |




