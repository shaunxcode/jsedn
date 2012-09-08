jsedn
=====

javascript implementation of [edn](https://github.com/richhickey/edn). 


### Install
	npm install jsedn

### Use
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

### Testing
I have developed this in a very test driven manner e.g. each test written  before the next feature is implemented. Baring that in mind it means any bugs you find it would be awesome if you could edit the tests adding one which clearly indicates the bug/feature request.

	coffee tests/primitives.coffee
	
###API
#####parse (ednString)
Will turn a valid edn string into a js object structure based upon the classes details below.

	edn.parse("{:a-keyword! [1 2 -3.4]}");


#####encode (jsObj)
Will encode both native JS and any object providing a ednEncode method.

	edn.encode({"a-keyword!": [1,2,-3.4]});

Currently the choice has been made that any string it encounters will be marshalled into a keyword if it can e.g. it does not have spaces in it and does not start with any prohibited characters. Thus:

	edn.encode({a: 1, b:2}) #outputs: "{:a 1 :b 2}"

#####setTagHandler (tagName, handlerCallback)

	edn.setTagHandler


#####setTokenPattern (tokenName, pattern) 
If for some reason you would like to over-ride or add a new token pattern. 

	edn.setTokenPattern()))

#####setTokenAction (tokenName, actionCallback)
Allows for customization of token handling upon match. For instance if you decided you would prefer nil to be represented by undefined instead of null (default).

	edn.setTokenAction('nil', function(token) { return undefined;});

#####setTypeClass (type, class)
This is useful if you want to over-ride the naive implementations of Map etc. 

	edn.setTypeClass('List', MyListClass));

###Classes/Interfaces

#####Pattern
	test (token)
Usually this is just a regular expression (which thus has a test method)

#####List
Most of the underscore.js collection methods

#####Vector
As above

#####Set
Like list/vector but requires unique entires on creation.

#####Map
	exists (key)
	at (key)
	
Supports any type of key/value pairs. This version is immutable and thus only has 

#####Tag

#####Tagged

###Caveats
When serialzing from edn to js we can not actually return anonymous object as edn allows for any type atom to be a key - with out much prototype.toString trickey to emulate hashing this is not a "done thing" in js. 