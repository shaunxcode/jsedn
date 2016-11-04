edn = require "../src/reader"

{assert, logTotals} = require "./assertion"

assert "make sure unification works",
	edn.unify "[?x ?y ?x {?z ?x ?x {?x ?x}}]", x: 1, y: 2, z: 3
	edn.parse "[1 2 1 {3 1 1 {1 1}}]"

assert "make sure keys and values can both be unified", 
	edn.unify "{?key [?val ?val]}", key: edn.kw(":name"), val: edn.sym("tofu")
	edn.parse "{:name [tofu tofu]}"

assert "unify accepts a Map object for data", 
	edn.unify (new edn.Map [edn.sym("?key"), edn.sym("?val")]), key: edn.kw(":lunch-food"), val: "carrot"
	edn.parse "{:lunch-food \"carrot\"}"

assert "unify accepts a Map object for values",
	edn.unify "{?key [?val ?val]}", edn.parse "{\"key\" :lunch-food \"val\" \"carrot\"}"
	edn.parse "{:lunch-food [\"carrot\" \"carrot\"]}"

assert "unify accepts string for data which gets encoded",
	edn.unify "{?key ?val}", "{\"key\" x \"val\" y}"
	edn.parse "{x y}"
	
assert "unify will lookup symbol and keyword if using Map for data",
	edn.unify "{?key [?val {?val ?key}]}", "{key :lunch-food :val [:carrot :tomato :lettuce]}"
	edn.parse "{:lunch-food [[:carrot :tomato :lettuce] {[:carrot :tomato :lettuce] :lunch-food}]}"

assert "unify can handle updating a vector inside of a tagged value", 
	edn.unify "{:db/id #db/id [:db.part/user ?id] :person/name ?name}", id: -1, name: "franklin"
	edn.parse "{:db/id #db/id [:db.part/user -1] :person/name \"franklin\"}"
 
logTotals()
