/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/*globals Gun */
	/*
	    |----------------|
	    |   1    |    2  |
	    |--------+-------|
	    |   3    |    4  |
	    |----------------|
	    
	    Push initial data, subscribing
	    to changes. If the player is
	    not taken, claim the spot.
	    
	    Once each spot is taken, begin the game.
	*/
	var Gun = Gun || __webpack_require__(1);
	var gun = Gun({
	    level: {
	        blaze: 'game-state'
	    }
	});
	// require('./setup');

	function setPlayers(collection) {
	    // set the players
	    return gun.get(collection).set()
	        .path('players').put({
	            1: {
	                num: 1
	            },
	            2: {
	                num: 2
	            },
	            3: {
	                num: 3
	            },
	            4: {
	                num: 4
	            }
	        });
	}

	module.exports = setPlayers;

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(2);

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	;(function(){
		console.log("Hello wonderful person! :) I'm mark@gunDB.io, message me for help or with hatemail. I want to hear from you! <3");
		var Gun = __webpack_require__(3);
		__webpack_require__(4);
		__webpack_require__(135);
		__webpack_require__(148);
		module.exports = Gun;
	}());


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	;(function(){
		function Gun(opt){ // the starting point to using GUN! Should be called once per page load.
			var gun = this;
			if(!Gun.is(gun)){ // if this is not a GUN instance,
				return new Gun(opt); // then make it so.
			}
			if(Gun.is(opt)){ // if opt is a GUN instance,
				return gun; // then return a new chain, reusing the existing options.
			}
			return gun.opt(opt); // update the instance's options.
		}
		Gun._ = { // some reserved key words, these are not the only ones.
			soul: '#' // a soul is a UUID of a node but it always points to the "latest" data known.
			,meta: '_' // all metadata of the node is stored in the meta property on the node.
			,HAM: '>' // other than the soul, we store HAM metadata.
		}
		;(function(Gun){ // GUN specific utilities.
			Util(Gun); // initialize standard javascript utilities.
			Gun.version = 0.2; // does Travis allow us to dynamically update package.json and npm publish?
			Gun.is = function(gun){ return (gun instanceof Gun)? true : false } // check to see if it is a GUN instance.
			Gun.is.value = function(v){ // Valid values are a subset of JSON: null, binary, number (!Infinity), text, or a soul relation. Arrays need special algorithms to handle concurrency, so they are not supported directly. Use an extension that supports them if needed but research their problems first.
				if(v === null){ return true } // "deletes", nulling out fields.
				if(v === Infinity){ return false } // we want this to be, but JSON does not support it, sad face.
				if(Gun.bi.is(v) // by "binary" we mean boolean.
				|| Gun.num.is(v)
				|| Gun.text.is(v)){ // by "text" we mean strings.
					return true; // simple values are valid.
				}
				return Gun.is.soul(v) || false; // is the value a soul relation? Then it is valid and return it. If not, everything else remaining is an invalid data type. Custom extensions can be built on top of these primitives to support other types.
			}
			Gun.is.value.as = function(v){ // check if it is a valid value and return the value if so,
				return Gun.is.value(v)? v : null; // else return null.
			}
			Gun.is.soul = function(v){ // this defines whether an object is a soul relation or not, they look like this: {'#': 'UUID'}
				if(Gun.obj.is(v)){ // must be an object.
					var id;
					Gun.obj.map(v, function(soul, field){ // map over the object...
						if(id){ return id = false } // if ID is already defined AND we're still looping through the object, it is considered invalid.
						if(field == Gun._.soul && Gun.text.is(soul)){ // the field should be '#' and have a text value.
							id = soul; // we found the soul!
						} else {
							return id = false; // if there exists anything else on the object that isn't the soul, then it is considered invalid.
						}
					});
					if(id){ // a valid id was found.
						return id; // yay! Return it.
					}
				}
				return false; // the value was not a valid soul relation.
			}
			Gun.is.soul.on = function(n){ return (n && n._ && n._[Gun._.soul]) || false } // convenience function to check to see if there is a soul on a node and return it.
			Gun.is.node = function(node, cb, t){ // checks to see if an object is a valid node.
				var soul;
				if(!Gun.obj.is(node)){ return false } // must be an object.
				if(soul = Gun.is.soul.on(node)){ // must have a soul on it.
					return !Gun.obj.map(node, function(value, field){ // we invert this because the way we check for this is via a negation.
						if(field == Gun._.meta){ return } // skip over the metadata.
						if(!Gun.is.value(value)){ return true } // it is true that this is an invalid node.
						if(cb){ cb.call(t, value, field, node._, soul) } // optionally callback each field/value.
					});
				}
				return false; // nope! This was not a valid node.
			}
			Gun.is.graph = function(graph, cb, fn, t){ // checks to see if an object is a valid graph.
				var exist = false;
				if(!Gun.obj.is(graph)){ return false } // must be an object.
				return !Gun.obj.map(graph, function(node, soul){ // we invert this because the way we check for this is via a negation.
					if(!node || soul !== Gun.is.soul.on(node) || !Gun.is.node(node, fn)){ return true } // it is true that this is an invalid graph.				 
					(cb || function(){}).call(t, node, soul, function(fn){ // optional callback for each node.
						if(fn){ Gun.is.node(node, fn, t) } // where we then have an optional callback for each field/value.
					});
					exist = true;
				}) && exist; // makes sure it wasn't an empty object.
			}
			// Gun.ify // the serializer is too long for right here, it has been relocated towards the bottom.
			Gun.union = function(gun, prime, cb){ // merge two graphs into the first.
				var ctx = {count: 0, cb: function(){ cb = cb? cb() && null : null }};
				ctx.graph = gun.__.graph;
				if(!ctx.graph){ ctx.err = {err: Gun.log("No graph!") } }
				if(!prime){ ctx.err = {err: Gun.log("No data to merge!") } }
				if(ctx.soul = Gun.is.soul.on(prime)){
					ctx.tmp = {};
					ctx.tmp[ctx.soul] = prime;
					prime = ctx.tmp;
				}
				Gun.is.graph(prime, null, function(val, field, meta){
					if(!meta || !(meta = meta[Gun._.HAM]) || !Gun.num.is(meta[field])){ 
						return ctx.err = {err: Gun.log("No state on " + field + "!") } 
					}
				});
				if(ctx.err){ return ctx }
				(function union(graph, prime){
					ctx.count += 1;
					Gun.obj.map(prime, function(node, soul){
						soul = Gun.is.soul.on(node);
						if(!soul){ return }
						ctx.count += 1;
						var vertex = graph[soul];
						if(!vertex){ // disjoint // TODO: Maybe not correct? BUG, probably.
							Gun.on('union').emit(gun, graph[soul] = node);
							gun.__.on('union').emit(node);
							gun.__.on(soul).emit(node);
							ctx.count -= 1;
							return;
						}
						Gun.HAM(vertex, node, function(){}, function(vertex, field, value){
							if(!vertex){ return }
							var change = {};
							change._ = change._ || {};
							change._[Gun._.soul] = Gun.is.soul.on(vertex);
							if(field){
								change._[Gun._.HAM] = change._[Gun._.HAM] || {};
								vertex[field] = change[field] = value;
								(vertex._[Gun._.HAM] = vertex._[Gun._.HAM] || {})[field] = change._[Gun._.HAM][field] = node._[Gun._.HAM][field];
							}
							//context.nodes[change._[Gun._.soul]] = change;
							//context('change').fire(change);
							Gun.on('union').emit(gun, change);
							gun.__.on('union').emit(change);
							gun.__.on(Gun.is.soul.on(change)).emit(change);
						}, function(){})(function(){
							if(!(ctx.count -= 1)){ ctx.cb() }
						});
					});
					ctx.count -= 1;
				})(ctx.graph, prime);
				if(!ctx.count){ ctx.cb() }
				return ctx;
			}
			Gun.union.pseudo = function(soul, graph, vertex){
				var c = 0, s;
				((vertex = vertex || {})._ = {})[Gun._.soul] = soul;
				Gun.is.graph(graph, function(node, ss){
					c += 1; s = ss;
					Gun.HAM(vertex, node, function(){}, function(vertex, field, value){
						(vertex._[Gun._.HAM] = vertex._[Gun._.HAM] || {})[field] = (node._[Gun._.HAM] = node._[Gun._.HAM] || {})[field];
						vertex[field] = value;
					}, function(){});
				});
				if(1 == c){ return }
				return vertex;
			}
			Gun.HAM = function(vertex, delta, lower, now, upper){
				upper.max = -Infinity;
				now.end = true;
				Gun.obj.map(delta, function update(incoming, field){
					if(field === Gun._.meta){ return }
					now.end = false;
					var ctx = {incoming: {}, current: {}}, state;
					ctx.drift = Gun.time.now(); //(ctx.drift = Gun.time.is()) > (Gun.time.now.last || -Infinity)? ctx.drift : Gun.time.now.last;
					ctx.incoming.value = Gun.is.soul(incoming) || incoming;
					ctx.current.value = Gun.is.soul(vertex[field]) || vertex[field];
					ctx.incoming.state = Gun.num.is(ctx.tmp = ((delta._||{})[Gun._.HAM]||{})[field])? ctx.tmp : -Infinity;
					ctx.current.state = Gun.num.is(ctx.tmp = ((vertex._||{})[Gun._.HAM]||{})[field])? ctx.tmp : -Infinity;
					upper.max = ctx.incoming.state > upper.max? ctx.incoming.state : upper.max;
					state = HAM(ctx.drift, ctx.incoming.state, ctx.current.state, ctx.incoming.value, ctx.current.value);
					if(state.err){
						root.console.log(".!HYPOTHETICAL AMNESIA MACHINE ERR!.", state.err); // this error should never happen.
						return;
					}
					if(state.state || state.quarantineState || state.current){
						lower.call(state, vertex, field, incoming);
						return;
					}
					if(state.incoming){
						now.call(state, vertex, field, incoming);
						return;
					}
					if(state.amnesiaQuarantine){
						upper.wait = true;
						upper.call(state, vertex, field, incoming); // signals that there are still future modifications.
						Gun.schedule(ctx.incoming.state, function(){
							update(incoming, field);
							if(ctx.incoming.state === upper.max){ (upper.last || function(){})() }
						});
					}
				});
				if(now.end){ now.call({}, vertex) } // TODO: Should HAM handle empty updates? YES.
				function HAM(machineState, incomingState, currentState, incomingValue, currentValue){ // TODO: Lester's comments on roll backs could be vulnerable to divergence, investigate!
					if(machineState < incomingState){
						// the incoming value is outside the boundary of the machine's state, it must be reprocessed in another state.
						return {amnesiaQuarantine: true};
					}
					if(incomingState < currentState){
						// the incoming value is within the boundary of the machine's state, but not within the range.
						return {quarantineState: true};
					}
					if(currentState < incomingState){
						// the incoming value is within both the boundary and the range of the machine's state.
						return {converge: true, incoming: true};
					}
					if(incomingState === currentState){
						if(incomingValue === currentValue){ // Note: while these are practically the same, the deltas could be technically different
							return {state: true};
						}
						/*
							The following is a naive implementation, but will always work.
							Never change it unless you have specific needs that absolutely require it.
							If changed, your data will diverge unless you guarantee every peer's algorithm has also been changed to be the same.
							As a result, it is highly discouraged to modify despite the fact that it is naive,
							because convergence (data integrity) is generally more important.
							Any difference in this algorithm must be given a new and different name.
						*/
						if(String(incomingValue) < String(currentValue)){ // String only works on primitive values!
							return {converge: true, current: true};
						}
						if(String(currentValue) < String(incomingValue)){ // String only works on primitive values!
							return {converge: true, incoming: true};
						}
					}
					return {err: "you have not properly handled recursion through your data or filtered it as JSON"};
				}
				return function(fn){
					upper.last = fn || function(){};
					if(!upper.wait){ upper.last() }
				}
			}
			;Gun.on = (function(){
				// events are fundamentally different, being synchronously 1 to N fan out,
				// than req/res/callback/promise flow, which are asynchronously 1 to 1 into a sink.
				function On(where){ return where? (On.event = On.event || On.create())(where) : On.create() }
				On.is = function(on){ return (On instanceof on)? true : false }
				On.create = function(){
					var chain = new On.chain();
					return chain.$ = function(where){
						chain.where = where;
						return chain;
					}
				}
				On.sort = Gun.list.sort('i');
				;On.chain=(function(){
					function Chain(){
						if(!(this instanceof Chain)){
							return new Chain();
						}
					}
					Chain.chain = Chain.prototype;
					Chain.chain.emit = function(what){
						var me = this
						,	where = me.where
						,	args = arguments
						, on = (me._ = me._ || {})[where] = me._[where] || [];
						if(!(me._[where] = Gun.list.map(on, function(hear, i, map){
							if(!hear || !hear.as){ return }
							map(hear);
							hear.as.apply(hear, args);
						}))){ Gun.obj.del(on, where) }
					}
					Chain.chain.event = function(as, i){
						if(!as){ return }
						var me = this
						,	where = me.where
						,	args = arguments
						, 	on = (me._ = me._ || {})[where] = me._[where] || []
						,	e = {as: as, i: i || 0, off: function(){ return !(e.as = false) }};
						return on.push(e), on.sort(On.sort), e;
					}
					Chain.chain.once = function(as, i){
						var me = this
						,	once = function(){
							this.off();
							as.apply(this, arguments)
						}
						return me.event(once, i)
					}
					return Chain;
				}());
				return On;
			}());
			Gun.roulette = function(l, c){
				var gun = Gun.is(this)? this : {};
				if(gun._ && gun.__.opt && gun.__.opt.uuid){
					if(Gun.fns.is(gun.__.opt.uuid)){
						return gun.__.opt.uuid(l, c);
					}
					l = l || gun.__.opt.uuid.length;
				}
				return Gun.text.random(l, c);
			}
		}(Gun));
		;(function(Chain){
			Chain.opt = function(opt, stun){ // idempotently update or put options
				var gun = this;
				gun._ = gun._ || {};
				gun.__ = gun.__ || {};
				opt = opt || {};
				gun.__.opt = gun.__.opt || {};
				gun.__.flag = gun.__.flag || {start: {}, end: {}};
				gun.__.key = gun.__.key || {s: {}, ed: {}};
				gun.__.graph = gun.__.graph || {};
				gun.__.on = gun.__.on || Gun.on.create();
				gun.__.meta = gun.__.meta || function(s){ return gun.__.meta[s] = gun.__.meta[s] || {} }
				if(Gun.text.is(opt)){ opt = {peers: opt} }
				if(Gun.list.is(opt)){ opt = {peers: opt} }
				if(Gun.text.is(opt.peers)){ opt.peers = [opt.peers] }
				if(Gun.list.is(opt.peers)){ opt.peers = Gun.obj.map(opt.peers, function(n,f,m){ m(n,{}) }) }
				gun.__.opt.peers = opt.peers || gun.__.opt.peers || {};
				gun.__.opt.uuid = opt.uuid || gun.__.opt.uuid || {};
				gun.__.opt.cb = gun.__.opt.cb || function(){};
				gun.__.opt.hooks = gun.__.opt.hooks || {};
				Gun.obj.map(opt.hooks, function(h, f){
					if(!Gun.fns.is(h)){ return }
					gun.__.opt.hooks[f] = h;
				});
				if(!stun){ Gun.on('opt').emit(gun, opt) }
				return gun;
			}
			Gun.chain.chain = function(from){
				from = from || this;
				var gun = Gun(from); // create a gun chain from this GUN instance.
				gun.back = from; // back link it.
				gun.__ = from.__; // inherit the instance level configurations.
				gun._ = {on: Gun.on.create()}; // create an event emitter for this new chain.
				gun._.at = function(e){
					var proxy = function(cb, i, chain){
						var on = gun._.on(e), at; // TODO: BUG! the on event emitter should be passed as the this, apparently it isn't. :(
						if(at = ((on = gun._.on(e)).e = on.e || {})[e]){ setTimeout(function(){cb.call(on, at)},0) }
						on[chain](function(at){
							cb.call(on, at);
						}, i);
					}
					proxy.event = function(cb, i){ return proxy(cb, i, 'event') };
					proxy.once = function(cb, i){ return proxy(cb, i, 'once') };
					proxy.emit = function(at, on){ // emit immediately, not async.
						((on = gun._.on(e)).e = on.e || {})[e] = at;
						gun._.on(e).emit(at);
					};
					return proxy;
				}
				return gun;
			}
			Chain.get = function(key, cb, opt){ // get opens up a reference to a node and loads it.
				var gun = this.chain(), ctx = {}; // create the new chain and have a scoped context.
				if(!key){ return cb.call(gun, {err: Gun.log("No key or relation to get!") }), gun }
				ctx.key = Gun.text.is(key) && key; // if key is text, then key, else false.
				ctx.soul = Gun.is.soul(key); // if key is a soul, then the soul, else false.
				cb = cb || function(){};
				opt = opt || {};
				
				if(opt.force){ load(key) } else // force a load regardless of whether it is a key or soul!
				if(ctx.soul){ // if we have a soul that is...
					if(ctx.node = gun.__.graph[ctx.soul]){ // in memory, then
						(ctx.graph = {})[ctx.soul] = ctx.node; // add it to our graph context.
						cb.call(gun, null, Gun.obj.copy(ctx.graph)); // call the callback with a copy of the graph.
						(ctx.graph = {})[ctx.soul] = Gun.union.pseudo(ctx.soul); // override our context with empty nodes as end markers, per the wire protocol.
						cb.call(gun, null, ctx.graph); cb.call(gun, null, {}); // call the end nodes, and wire end.
					} else { load(key) } // not in memory, then load it.
					ctx.node = gun.__.graph[ctx.soul] = gun.__.graph[ctx.soul] || Gun.union.pseudo(ctx.soul); // either way we know the soul, so make sure it is in our graph so it can be referenced.
					gun._.at('soul').emit({soul: ctx.soul, GET: 'SOUL'}); // emit the soul to the chain!
				} else 
				if(ctx.key){ // if it is a key, then
					function get(soul){ // once we have a soul
						var graph = gun.__.key.s[ctx.key], end = {}; // grab the graph corresponding to the key.
						Gun.is.graph(graph, function(node, soul){ // iterate over each node
							end[soul] = Gun.union.pseudo(soul); // put empty nodes as an end marker, per the wire protocol.
							gun._.at('soul').emit({soul: soul, key: ctx.key, GET: 'SOUL'}); // emit each soul to the chain!
						});
						cb.call(gun, null, Gun.obj.copy(graph)); cb.call(gun, null, end); cb.call(gun, null, {}); // and finally, call the graph, the end nodes, and the wire end.
					}
					if(gun.__.key.s[ctx.key]){ get() } // check if it is in memory, else
					else if(ctx.flag = gun.__.flag.start[ctx.key]){ // if it will be in memory, then TODO: convert this to use the meta system instead if possible, seems cleaner.
						ctx.flag.once(get); // subscribe to when that happens.
					} else { load(key) } // else it is not in memory, load it.
				} else { cb.call(gun, {err: Gun.log("No key or relation to get!")}) }
				
				function load(key){ // load a key or soul.
					if(Gun.fns.is(ctx.hook = gun.__.opt.hooks.get)){ // if we have a hook...
						ctx.hook(key, function(err, data){ // listen to callbacks, which will be called multiple times.
							console.log("chain.get ", key, "from hook", err, data, '\n');
							if(err){ return cb.call(gun, err, null) } // if error, call it and be done. TODO: emit error!
							if(!data){ // if there is no data...
								if(ctx.data){ return } // make sure we don't have context data, if we do, don't go further.
								cb.call(gun, null, null); // call that we have null data, since nodejs callback style does not differentiate between error, null, and data.
								return gun.__.flag.end[ctx.key || ctx.soul] = gun.__.flag.end[ctx.key || ctx.soul] || function($){ // set the end marker. TODO: convert this to use the meta system instead if possible, seems cleaner.
									// TODO: cover all edge cases, uniqueness?
									delete gun.__.flag.end[ctx.key || ctx.soul]; // once called, clear out our flag.
									gun._.at('soul').emit($); // emit the soul to the chain.
								}, gun._.at('null').emit({key: ctx.key, soul: ctx.soul, GET: 'NULL'}); // emit the null to the chain!
							}
							var dat = ctx.data = {}; // create a data context.
							if(Gun.obj.empty(data)){ return cb.call(gun, null, data) } // call the wire end and be done.
							if(!Gun.is.graph(data, function(node, soul, map){ // iterate over each node in the data graph
								if(err = Gun.union(gun, node).err){ return cb.call(gun, err, data) } // union it, or error.
								if(ctx.key){ (gun.__.key.s[ctx.key] = gun.__.key.s[ctx.key] || {})[soul] = gun.__.graph[soul] } // if it was on a key, then add this node to the key graph.
								gun._.at('soul').emit({soul: soul, key: ctx.key, GET: 'SOUL'}); // and emit each soul to the chain!
							})){ return cb.call(gun, {err: Gun.log('Not a valid graph!') }, data) } // if the data isn't a graph, error out.
							cb.call(gun, null, data); // TODO: Hmm, this should be called before the chain emit, but I don't want to do 2 map operations. As long as union is called before, does this matter that it is after?
						}, opt);
					} else { // if there is no hook...
						console.Log("Warning! You have no persistence layer to get from!"); // politely notify people.
						cb.call(gun, null, null); // Technically no error, but no way we can get data.
						gun._.at('null').emit({key: ctx.key, GET: 'NULL'}); // and emit the null to the chain!
					}
				}
				return gun;
			}
			Chain.key = function(key, cb, opt){
				var gun = this, ctx = {};
				if(!key){ return cb.call(gun, {err: Gun.log('No key!')}), gun }
				if(!gun.back){ gun = gun.chain() }
				if(gun.__.key.s[key]){ console.Log("Warning! Key already used!") } // TODO: Have opt that will aggregate.
				cb = cb || function(){};
				opt = Gun.text.is(opt)? {soul: opt} : opt || {};
				opt.soul = opt.soul || opt[Gun._.soul];
				if(opt.soul){ // force inject // TODO: BUG! WRITE A TEST FOR THIS!
					if(!gun.__.graph[opt.soul]){
						((gun.__.graph[opt.soul] = {})._ = {})[Gun._.soul] = opt.soul;
					}
					(gun.__.key.s[key] = gun.__.key.s[key] || {})[opt.soul] = gun.__.graph[opt.soul];
					if(gun.__.flag.end[key]){ // TODO: Ought this be fulfilled from self as well?
						gun.__.flag.end[key]({soul: opt.soul});
					}
					index({soul: opt.soul});
				} else { // will be injected via a put
					(gun.__.flag.start[key] = gun._.at('soul')).once(function($){
						console.log("chain.key", key, '\n');
						(gun.__.key.s[key] = gun.__.key.s[key] || {})[$.soul] = gun.__.graph[$.soul];
						delete gun.__.flag.start[key];
					}, -1);
					gun._.at('soul').event(index);
				}
				function index($){ // TODO: once per soul in graph. (?)
					if(Gun.fns.is(ctx.hook = gun.__.opt.hooks.key)){
						ctx.hook(key, $.soul, function(err, data){
							return cb.call(gun, err, data);
						}, opt);
					} else {
						console.Log("Warning! You have no key hook!");
						cb.call(gun, null); // This is in memory success, hardly "success" at all.
					}
				}
				return gun;
			}
			Chain.all = function(key, cb){
				var gun = this.chain();
				return gun; // TODO: BUG! We need to create all!
				cb = cb || function(){};
				gun.shot.next(function(next){
					Gun.obj.map(gun.__.key.s, function(node, key){ // TODO: BUG!! Need to handle souls too!
						if(node = Gun.is.soul.on(node)){
							(cb.vode = cb.vode || {})[key] = {};
							cb.vode[key][Gun._.soul] = node;
						} 
					});
					if(cb.vode){
						gun._.node = cb.vode; // assign it to this virtual node.
						cb.call(gun, null, Gun.obj.copy(gun._.node)), next(); // frozen copy
					} else
					if(Gun.fns.is(gun.__.opt.hooks.all)){
						gun.__.opt.hooks.all(function(err, data){ // call the hook
							// this is multiple
						});
					} else {
						console.Log("Warning! You have no all hook!");
						return cb.call(gun), next();
					}
				});
				return gun;
			}
			/*
				how many different ways can we return something? ONLY THE FIRST ONE IS SUPPORTED, the others might become plugins.
				Find via a singular path
					.path('blah').val(blah);
				Find via multiple paths with the callback getting called many times
					.path('foo', 'bar').val(fooOrBar);
				Find via multiple paths with the callback getting called once with matching arguments
					.path('foo', 'bar').val(foo, bar)
				Find via multiple paths with the result aggregated into an object of pre-given fields
					.path('foo', 'bar').val({foo: foo, bar: bar}) || .path({a: 'foo', b: 'bar'}).val({a: foo, b: bar})
				Find via multiple paths where the fields and values must match
					.path({foo: val, bar: val}).val({})
				Path ultimately should call .val each time, individually, for what it finds.
				Things that wait and merge many things together should be an abstraction ontop of path.
			*/
			Chain.path = function(path, cb, opt){
				var gun = this.chain();
				cb = cb || function(){};
				opt = opt || {};
				if(!Gun.text.is(path = Gun.text.is(path)? path || null : Gun.num.is(path)? (path + '') : Gun.list.is(path)? path.join('.') : path)){ return cb.call(gun, {err: Gun.log("Invalid path '" + path + "'!")}), gun }
				if(!gun.back._.at){ return cb.call(gun, {err: Gun.log("No context!")}), gun }
				gun.back.on(function($, node){
					if(!(node = node || gun.__.graph[$.soul])){ return }
					var chain = this || gun, src = opt.src || gun;
					var ctx = {path: path.split('.')}, field = Gun.text.ify(ctx.path.shift());
					var val = node[field], soul = Gun.is.soul(val);
					if(!field && !ctx.path.length){
						cb.call(chain, null, node, field);
						return opt.step? src._.at('soul').emit({soul: $.soul, field: null, from: opt.step.soul, at: opt.step.field, gun: chain, PATH: 'SOUL'})
						:	src._.at('soul').emit({soul: $.soul, field: null, gun: chain, PATH: 'SOUL'});
					}
					if(!Gun.obj.has(node, field)){
						if(opt.end || (!ctx.path.length && gun.__.meta($.soul).end)){ // TODO: Make it so you can adjust how many terminations!
							// TODO: BUG! `chain` here is incorrect on unknowns. This has been fixed at an API level.
							cb.call(chain, null, null, field);
							src._.at('null').emit({soul: $.soul, field: field, gun: chain, PATH: 'NULL'});
						}
						return;
					}
					if(soul){
						return gun.get(val, function(err, data){
							if(err){ return cb.call(chain, err) }
						}).path(ctx.path, cb, {src: src, step: {soul: $.soul, field: field}, path: path});
					}
					cb.call(chain, null, val, field);
					return src._.at('soul').emit({soul: $.soul, field: field, gun: chain, PATH: 'SOUL'});
				}, {raw: true});
				
				return gun;
			}
			Chain.val = (function(){
				Gun.on('union').event(function(gun, data, end){
					if(!Gun.obj.empty(data, Gun._.meta)){ return }
					(end = gun.__.meta(Gun.is.soul.on(data))).end = (end.end || 0) + 1;
					gun.__.on(Gun.is.soul.on(data) + '.end').emit(data);
				});
				return function(cb, opt){
					var gun = this, ctx = {};
					cb = cb || function(val, field){ root.console.log(field + ':', val) }
					opt = opt || {};
					
					gun.on(function($, delta, on){
						var node = gun.__.graph[$.soul];
						if(ctx[$.soul + '.end']){ return ctx[$.soul + '.end'](node, $) }
						//(on = on || {off:function(){}}).off();
						ctx[$.soul + '.end'] = function(data, $$){
							$$ = $$ || $;					
							var soul, field;
							if(!$$.field && $$.from){ // if the current node is a child of the parent that we were subscribing to a field on.
								soul = $$.from;
								field = $$.at;
							} else {
								soul = $$.soul;
								field = $$.field || '';
							}
							var hash = soul + field;
							var node = gun.__.graph[$$.soul] || data || node; //on = (this || {off:function(){}}); // TODO: BUG? is var node = thing || node safe in old IE?
							if($$.key){
								// TODO: BUG! Shouldn't `.val` pseudo union check that each node in the key graph is ended? Current thought: Not necessarily! Since `.val` is first come first serve until we provide configurable end options.
								node = Gun.union.pseudo($.key, gun.__.key.s[$.key]) || node;
							}
							if($$.field){
								if(!Gun.obj.has(node, $$.field) || ctx[hash] || Gun.is.soul(node[$$.field])){ return }
								ctx[hash] = true; //on.off(); // TODO: Fix the bug with at for this to be on.
								return cb.call($$.gun || gun, node[$$.field], $$.field);
							}
							if(!gun.__.meta($$.soul).end || (ctx[hash] || ($$.key && ctx[$$.key]))){ return } // TODO: Add opt to change number of terminations.
							ctx[hash] = ctx[$$.soul] = ctx[$$.key] = true; //on.off(); // TODO: Fix the bug with at for this to be on.
							cb.call($$.gun || gun, Gun.obj.copy(node), field);
						}
						if(gun.__.meta($.soul).end){
							if(!$.field || Gun.obj.has(node, $.field)){ return ctx[$.soul + '.end'](node, $) }
						}
						gun.__.on($.soul + '.end').event(ctx[$.soul + '.end']);
					}, {raw: true});
					
					return gun;
				}
			}());
			Chain.on = function(cb, opt){ // on subscribes to any changes related to the chain.
				var gun = this, ctx = {}; // reuse the current chain and have a scoped context.
				opt = Gun.obj.is(opt)? opt : {change: opt}; // .on(fn, true) gives you delta pairs.
				cb = cb || function(){};
				gun._.at('soul').event(function($){ // subscribe to soul events on the chain.
					if(ctx[$.soul]){ // check to see if we have a root level listener for changes on this soul.
						if(opt.raw){ // then do nothing, unless the options request all raw events.
							ctx[$.soul].call(this, gun.__.graph[$.soul], $); // call it with the node and the event. TODO: we get duplicate ons, once here and once from HAM.
						}
					} else { // if there isn't a root level listener for changes on the soul, then
						(ctx[$.soul] = function(delta, $$){ // mark that we are adding one.
							$$ = $$ || $; var node = gun.__.graph[$$.soul], soul; // use the pass event or reuse the the chain's event.
							if(delta && $$.soul != Gun.is.soul.on(delta)){ return } // just make sure that things match for safety purposes.
							if($$.field && (soul = Gun.is.soul(node[$$.field]))){ // if the chain is on a field, then check if the field value is a relation.
								(ctx[$$.soul + $$.field] || {off:function(){}}).off(); // why do we do this again? To prevent recursion or something I think?
								ctx[$$.soul + $$.field] = gun.__.on(soul).event(function(delta){ // subscribe to root level emitter for the soul.
									ctx[$$.soul](delta, {soul: soul, field: null, from: $$.soul, at: $$.field}); // call ourselves.
								});
								// TODO: do we need to load it? what about that $.gun context?
								return;
							}
							if(opt.raw){ return cb.call($$.gun || gun, $$, delta, this) } // if raw events are requested, call it with all the pieces we have.
							if(!opt.end && Gun.obj.empty(delta, Gun._.meta)){ return } // ignore end nodes unless otherwise requested.
							if($$.key){ node = Gun.union.pseudo($.key, gun.__.key.s[$.key]) || node } // if there are multiple nodes on the key, then do a pseudo union across all nodes in the key graph to create a temporary abstract form of the data.
							if(opt.change){ node = delta || node } // if we want only the change, prioritize the delta over the node.
							cb.call($$.gun || gun, Gun.obj.copy($$.field? node[$$.field] : node), $$.field || $$.at); // call the callback with a snapshot of the data!
						}).call(this, gun.__.graph[$.soul], $); // call ourselves immediately!
						if(!opt.once){ gun.__.on($.soul).event(ctx[$.soul]) } // and finally, actually subscribe to the root level emitter for this soul.
					}
				});
				
				return gun;
			}
			/*
				ACID compliant? Unfortunately the vocabulary is vague, as such the following is an explicit definition:
				A - Atomic, if you put a full node, or nodes of nodes, if any value is in error then nothing will be put.
					If you want puts to be independent of each other, you need to put each piece of the data individually.
				C - Consistency, if you use any reserved symbols or similar, the operation will be rejected as it could lead to an invalid read and thus an invalid state.
				I - Isolation, the conflict resolution algorithm guarantees idempotent transactions, across every peer, regardless of any partition,
					including a peer acting by itself or one having been disconnected from the network.
				D - Durability, if the acknowledgement receipt is received, then the state at which the final persistence hook was called on is guaranteed to have been written.
					The live state at point of confirmation may or may not be different than when it was called.
					If this causes any application-level concern, it can compare against the live data by immediately reading it, or accessing the logs if enabled.
			*/
			Chain.put = function(val, cb, opt){ // TODO: handle case where val is a gun context!
				var gun = this.chain(), call = function($){
					gun.back._.at('soul').emit({soul: $.soul || Gun.is.soul.on(val) || Gun.roulette.call(gun), field: $.field, empty: true, gun: $.gun, PUT: 'SOUL'}); // TODO: refactor Gun.roulette!
				}, drift = Gun.time.now(); // TODO: every instance of gun maybe should have their own version of time.
				cb = cb || function(){};
				opt = opt || {};
				if(!gun.back.back){
					gun = gun.chain();
					call({});
				}
				if(gun.back.not){ gun.back.not(call, {raw: true}) }
				
				gun.back._.at('soul').event(function($){
					var chain = $.gun || gun; 
					var ctx = {}, obj = val, $ = Gun.obj.copy($);
					var hash = $.field? $.soul + $.field : ($.from? $.from + ($.at || '') : $.soul);
					//var hash = $.from? ($.from + ($.at || '')) : ($.soul + ($.field || ''));
					if(call[hash]){ return }
					call[hash] = true;
					console.log("chain.put", val, '\n');
					if(Gun.is.value(obj)){
						if($.from && $.at){
							$.soul = $.from;
							$.field = $.at;
						} // no else!
						if(!$.field){
							return cb.call(gun, {err: Gun.log("No field exists for " + (typeof obj) + "!")});
						} else
						if(gun.__.graph[$.soul]){
							ctx.tmp = {};
							ctx.tmp[ctx.field = $.field] = obj;
							obj = ctx.tmp;
						} else {
							return cb.call(gun, {err: Gun.log("No node exists to put " + (typeof obj) + " in!")});
						}
					}
					if(Gun.obj.is(obj)){
						if($.field && !ctx.field){
							ctx.tmp = {};
							ctx.tmp[ctx.field = $.field] = obj;
							obj = ctx.tmp;
						}
						Gun.ify(obj, function(env, cb){
							var at;
							if(!env || !(at = env.at) || !env.at.node){ return }
							if(!at.node._){
								at.node._ = {};
							}
							if(!Gun.is.soul.on(at.node)){
								if(obj === at.obj){
									env.graph[at.node._[Gun._.soul] = at.soul = $.soul] = at.node;
									cb(at, at.soul);
								} else {
									function path(err, data){
										if(at.soul){ return }
										at.soul = Gun.is.soul.on(data) || Gun.is.soul.on(at.obj) || Gun.roulette.call(gun); // TODO: refactor Gun.roulette!
										env.graph[at.node._[Gun._.soul] = at.soul] = at.node;
										cb(at, at.soul);
									};
									($.empty && !$.field)? path() : chain.back.path(at.path || [], path, {once: true, end: true}); // TODO: clean this up.
								}
							}
							if(!at.node._[Gun._.HAM]){
								at.node._[Gun._.HAM] = {};
							}
							if(!at.field){ return }
							at.node._[Gun._.HAM][at.field] = drift;
						})(function(err, ify){
							console.log("chain.put PUT <----", ify.graph, '\n');
							if(err || ify.err){ return cb.call(gun, err || ify.err) }
							if(err = Gun.union(gun, ify.graph).err){ return cb.call(gun, err) }
							if($.from = Gun.is.soul(ify.root[$.field])){ $.soul = $.from; $.field = null }
							Gun.obj.map(ify.graph, function(node, soul){ Gun.union(gun, Gun.union.pseudo(soul)) });
							gun._.at('soul').emit({soul: $.soul, field: $.field, key: $.key, PUT: 'SOUL', WAS: 'ON'}); // WAS ON
							if(Gun.fns.is(ctx.hook = gun.__.opt.hooks.put)){
								ctx.hook(ify.graph, function(err, data){ // now iterate through those nodes to a persistence layer and get a callback once all are saved
									if(err){ return cb.call(gun, err) }
									return cb.call(gun, null, data);
								}, opt);
							} else {
								console.Log("Warning! You have no persistence layer to save to!");
								cb.call(gun, null); // This is in memory success, hardly "success" at all.
							}
						});
					}
				});
				
				return gun;
			}
			Chain.map = function(cb, opt){
				var gun = this.chain(), ctx = {};
				opt = (Gun.obj.is(opt)? opt : (opt? {node: true} : {}));
				cb = cb || function(){};
				
				gun.back.on(function(node){
					var soul = Gun.is.soul.on(node);
					console.log("chain.map", node, '\n');
					Gun.is.node(node, function(val, field){ // maybe filter against known fields. Huh?
						var s = Gun.is.soul(val);
						if(s){
							// TODO: BUG? What if we re-assign a field to a different soul or value? Shouldn't we disable the previous listener? Do we need to check if we already made a listener so we don't recursively add up more and more listeners that get called? Etc. ?
							ctx[s] = gun.get(val).on(function(d, f){
								cb.call(this, d, f || field);
								gun._.at('soul').emit({soul: s, field: null, from: soul, at: field, MAP: 'SOUL', gun: this})
							});
						} else {
							if(opt.node){ return } // {node: true} maps over only sub nodes.
							cb.call(this, val, field);
							gun._.at('soul').emit({soul: soul, field: field, MAP: 'SOUL'});
						}
					}, this || gun);
				}, true);
				
				return gun;
			}
			Chain.set = function(val, cb, opt){
				var gun = this, ctx = {}, drift = Gun.text.ify(Gun.time.now()||0).replace('.','D'); // TODO: every gun instance should maybe have their own version of time.
				cb = cb || function(){};
				opt = opt || {};
				
				if(!gun.back){ gun = gun.put({}) }
				gun = gun.not(function(key){ return key? this.put({}).key(key) : this.put({}) });
				if(!val && !Gun.is.value(val)){ return gun }
				var obj = {}, index = 'I' + drift + 'R' + Gun.text.random(5); // TODO: Make this configurable!
				obj[index] = val;
				return Gun.is.value(val)? gun.put(obj, cb) : gun.put(obj, cb).path(index);
			}
			Chain.not = function(cb, opt){
				var gun = this, ctx = {};
				cb = cb || function(){};
				opt = opt || {};
				
				gun._.at('null').once(function($){
					if($.key && ($.soul || gun.__.key.s[$.key])){ return }
					if($.field && Gun.obj.has(gun.__.graph[$.soul], $.field)){ return }
					// TODO: BUG? Removed a start flag check and tests passed, but is that an edge case?
					var kick = function(next){
						if(++c){ return Gun.log("Warning! Multiple `not` resumes!"); }
						next._.at('soul').once(function($){ $.N0T = 'KICK SOUL'; gun._.at('soul').emit($) });
					}, chain = gun.chain(), next = cb.call(chain, opt.raw? $ : ($.field || $.key), kick), c = -1;
					if(Gun.is(next)){ kick(next) }
					gun.__.graph[kick.soul = $.soul || Gun.roulette.call(chain)] = gun.__.graph[kick.soul] || Gun.union.pseudo(kick.soul); // TODO: refactor Gun.roulette
					chain._.at('soul').emit({soul: kick.soul, empty: true, key: $.key, field: $.field, N0T: 'SOUL', WAS: 'ON'}); // WAS ON! 
				});
				
				return gun;
			}
			Chain.err = function(dud){ // WARNING: dud was depreciated.
				this._.err = Gun.fns.is(dud)? dud : function(){};
				return this;
			}
		}(Gun.chain = Gun.prototype));
		;function Util(Util){
			Util.fns = {};
			Util.fns.is = function(fn){ return (fn instanceof Function)? true : false }
			Util.fns.sum = function(done){ // combine with Util.obj.map for some easy parallel async operations!
				var context = {task: {}, data: {}};
				context.end = function(e,v){ return done(e,v), done = function(){} };
				context.add = function(fn, id){
					context.task[id = id || (Gun.text.is(fn)? fn : Gun.text.random())] = false;
					var each = function(err, val){
						context.task[id] = true;
						if(err){ (context.err = context.err || {})[id] = err }
						context.data[id] = val;
						if(!Gun.obj.map(context.task, function(val){ if(!val){ return true } })){ // it is true if we are NOT done yet, then invert.
							done(context.err, context.data);
						}
					}, c = context;
					return Gun.fns.is(fn)? function(){ return fn.apply({task: c.task, data: c.data, end: c.end, done: each}, arguments) } : each;
				}
				return context;
			}
			Util.bi = {};
			Util.bi.is = function(b){ return (b instanceof Boolean || typeof b == 'boolean')? true : false }
			Util.num = {};
			Util.num.is = function(n){
				return !Util.list.is(n) && (Infinity === n || n - parseFloat(n) + 1 >= 0); // jquery doesn't check for Infinity.
			}
			Util.text = {};
			Util.text.is = function(t){ return typeof t == 'string'? true : false }
			Util.text.ify = function(t){
				if(Util.text.is(t)){ return t }
				if(JSON){ return JSON.stringify(t) }
				return (t && t.toString)? t.toString() : t;
			}
			Util.text.random = function(l, c){
				var s = '';
				l = l || 24; // you are not going to make a 0 length random number, so no need to check type
				c = c || '0123456789ABCDEFGHIJKLMNOPQRSTUVWXZabcdefghiklmnopqrstuvwxyz';
				while(l > 0){ s += c.charAt(Math.floor(Math.random() * c.length)); l-- }
				return s;
			}
			Util.list = {};
			Util.list.is = function(l){ return (l instanceof Array)? true : false }
			Util.list.slit = Array.prototype.slice;
			Util.list.sort = function(k){ // creates a new sort function based off some field
				return function(A,B){
					if(!A || !B){ return 0 } A = A[k]; B = B[k];
					if(A < B){ return -1 }else if(A > B){ return 1 }
					else { return 0 }
				}
			}
			Util.list.map = function(l, c, _){ return Util.obj.map(l, c, _) }
			Util.list.index = 1; // change this to 0 if you want non-logical, non-mathematical, non-matrix, non-convenient array notation
			Util.obj = {};
			Util.obj.is = function(o){ return (o instanceof Object && !Util.list.is(o) && !Util.fns.is(o))? true : false }
			Util.obj.del = function(o, k){
				if(!o){ return }
				o[k] = null;
				delete o[k];
				return true;
			}
			Util.obj.ify = function(o){
				if(Util.obj.is(o)){ return o }
				try{o = JSON.parse(o);
				}catch(e){o={}};
				return o;
			}
			Util.obj.copy = function(o){ // because http://web.archive.org/web/20140328224025/http://jsperf.com/cloning-an-object/2
				return !o? o : JSON.parse(JSON.stringify(o)); // is shockingly faster than anything else, and our data has to be a subset of JSON anyways!
			}
			Util.obj.has = function(o, t){ return o && Object.prototype.hasOwnProperty.call(o, t) }
			Util.obj.empty = function(o, n){
				if(!o){ return true }
				return Util.obj.map(o,function(v,i){
					if(n && (i === n || (Util.obj.is(n) && Util.obj.has(n, i)))){ return }
					if(i){ return true }
				})? false : true;
			}
			Util.obj.map = function(l, c, _){
				var u, i = 0, ii = 0, x, r, rr, f = Util.fns.is(c),
				t = function(k,v){
					if(v !== u){
						rr = rr || {};
						rr[k] = v;
						return;
					} rr = rr || [];
					rr.push(k);
				};
				if(Util.list.is(l)){
					x = l.length;
					for(;i < x; i++){
						ii = (i + Util.list.index);
						if(f){
							r = _? c.call(_, l[i], ii, t) : c(l[i], ii, t);
							if(r !== u){ return r }
						} else {
							//if(Util.test.is(c,l[i])){ return ii } // should implement deep equality testing!
							if(c === l[i]){ return ii } // use this for now
						}
					}
				} else {
					for(i in l){
						if(f){
							if(Util.obj.has(l,i)){
								r = _? c.call(_, l[i], i, t) : c(l[i], i, t);
								if(r !== u){ return r }
							}
						} else {
							//if(a.test.is(c,l[i])){ return i } // should implement deep equality testing!
							if(c === l[i]){ return i } // use this for now
						}
					}
				}
				return f? rr : Util.list.index? 0 : -1;
			}
			Util.time = {};
			Util.time.is = function(t){ return t? t instanceof Date : (+new Date().getTime()) }
			Util.time.now = function(t){
				return ((t=t||Util.time.is()) > (Util.time.now.last || -Infinity)? (Util.time.now.last = t) : Util.time.now(t + 1)) + (Util.time.now.drift || 0);
			};
		};
		;(function(schedule){ // maybe use lru-cache
			schedule.waiting = [];
			schedule.soonest = Infinity;
			schedule.sort = Gun.list.sort('when');
			schedule.set = function(future){
				if(Infinity <= (schedule.soonest = future)){ return }
				var now = Gun.time.now(); // WAS time.is() TODO: Hmmm, this would make it hard for every gun instance to have their own version of time.
				future = (future <= now)? 0 : (future - now);
				clearTimeout(schedule.id);
				schedule.id = setTimeout(schedule.check, future);
			}
			schedule.check = function(){
				var now = Gun.time.now(), soonest = Infinity; // WAS time.is() TODO: Same as above about time. Hmmm.
				schedule.waiting.sort(schedule.sort);
				schedule.waiting = Gun.list.map(schedule.waiting, function(wait, i, map){
					if(!wait){ return }
					if(wait.when <= now){
						if(Gun.fns.is(wait.event)){
							setTimeout(function(){ wait.event() },0);
						}
					} else {
						soonest = (soonest < wait.when)? soonest : wait.when;
						map(wait);
					}
				}) || [];
				schedule.set(soonest);
			}
			Gun.schedule = function(state, cb){
				schedule.waiting.push({when: state, event: cb || function(){}});
				if(schedule.soonest < state){ return }
				schedule.set(state);
			}
		}({}));
		;Gun.ify=(function(Serializer){
			function ify(data, cb, opt){
				opt = opt || {};
				cb = cb || function(env, cb){ cb(env.at, Gun.roulette()) }; // TODO: refactor Gun.roulette
				var end = function(fn){
					ctx.end = fn || function(){};
					if(ctx.err){ return ctx.end(ctx.err, ctx), ctx.end = function(){} }
					unique(ctx);
				}, ctx = {at: {path: [], obj: data}, root: {}, graph: {}, queue: [], seen: [], loop: true};
				if(!data){ return ctx.err = Gun.log('Serializer does not have correct parameters.'), end }
				ctx.at.node = ctx.root;
				while(ctx.loop && !ctx.err){
					seen(ctx, ctx.at);
					map(ctx, cb);
					if(ctx.queue.length){
						ctx.at = ctx.queue.shift();
					} else {
						ctx.loop = false;
					}
				}
				return end;
			}
			function map(ctx, cb){
				var rel = function(at, soul){
					at.soul = at.soul || soul;
					Gun.list.map(at.back, function(rel){
						rel[Gun._.soul] = at.soul;
					});
					unique(ctx); // could we remove the setTimeot?
				}, it;
				Gun.obj.map(ctx.at.obj, function(val, field){
					ctx.at.val = val;
					ctx.at.field = field;
					it = cb(ctx, rel) || true;
					if(field === Gun._.meta){
						ctx.at.node[field] = Gun.obj.copy(val); // TODO: BUG! Is this correct?
						return;
					}
					if(false){ // TODO: BUG! Do later for ACID "consistency" guarantee.
						return ctx.err = {err: Gun.log('Invalid field name on ' + ctx.at.path.join('.'))};
					}
					if(!Gun.is.value(val)){
						var at = {obj: val, node: {}, back: [], path: [field]}, tmp = {}, was;
						at.path = (ctx.at.path||[]).concat(at.path || []);
						if(!Gun.obj.is(val)){
							return ctx.err = {err: Gun.log('Invalid value at ' + at.path.join('.') + '!' )};
						}
						if(was = seen(ctx, at)){
							tmp[Gun._.soul] = Gun.is.soul.on(was.node) || null;
							(was.back = was.back || []).push(ctx.at.node[field] = tmp);
						} else {
							ctx.queue.push(at);
							tmp[Gun._.soul] = null;
							at.back.push(ctx.at.node[field] = tmp);
						}
					} else {
						ctx.at.node[field] = Gun.obj.copy(val);
					}
				});
				if(!it){ cb(ctx, rel) }
			}
			function unique(ctx){
				if(ctx.err || !Gun.list.map(ctx.seen, function(at){
					if(!at.soul){ return true }
				}) && !ctx.loop){ return ctx.end(ctx.err, ctx), ctx.end = function(){} }
			}
			function seen(ctx, at){
				return Gun.list.map(ctx.seen, function(has){
					if(at.obj === has.obj){ return has }
				}) || (ctx.seen.push(at) && false);
			}
			return ify;
		}({}));
		if(typeof window !== "undefined"){
			window.Gun = Gun;
		} else {
			module.exports = Gun;
		}
		var root = this || {}; // safe for window, global, root, and 'use strict'.
		root.console = root.console || {log: function(s){ return s }}; // safe for old browsers
		var console = {
			log: Gun.log = function(s){return (Gun.log.verbose && root.console.log.apply(root.console, arguments)), s},
			Log: function(s){return (!Gun.log.squelch && root.console.log.apply(root.console, arguments)), s}
		};
	}({}));

	;(function(tab){
		if(!this.Gun){ return }
		if(!window.JSON){ throw new Error("Include JSON first: ajax.cdnjs.com/ajax/libs/json2/20110223/json2.js") } // for old IE use
		Gun.on('opt').event(function(gun, opt){
			opt = opt || {};
			var tab = gun.tab = gun.tab || {};
			tab.store = tab.store || store;
			tab.request = tab.request || request;
			tab.headers = opt.headers || {};
			tab.headers['gun-sid'] = tab.headers['gun-sid'] || Gun.text.random(); // stream id
			tab.prefix = tab.prefix || opt.prefix || 'gun/';
			tab.prekey = tab.prekey || opt.prekey || '';
			tab.prenode = tab.prenode || opt.prenode || '_/nodes/';
			tab.get = tab.get || function(key, cb, opt){
				if(!key){ return }
				cb = cb || function(){};
				cb.GET = true;
				(opt = opt || {}).url = opt.url || {};
				opt.headers = Gun.obj.copy(tab.headers);
				if(Gun.is.soul(key)){
					opt.url.query = key;
				} else {
					opt.url.pathname = '/' + key;
				}
				Gun.log("tab get --->", key);
				(function local(key, cb){
					var path = (path = Gun.is.soul(key))? tab.prefix + tab.prenode + path
						: tab.prefix + tab.prekey + key, node = tab.store.get(path), graph, soul;
					if(Gun.is.node(node)){
						(cb.graph = cb.graph || {}
						)[soul = Gun.is.soul.on(node)] = (graph = {})[soul] = cb.node = node;
						cb(null, graph); 
						(graph = {})[soul] = Gun.union.pseudo(soul); // end.
						return cb(null, graph);
					} else 
					if(Gun.obj.is(node)){
						Gun.obj.map(node, function(rel){ if(Gun.is.soul(rel)){ local(rel, cb) } });
						cb(null, {});
					}
				}(key, cb));
				if(!(cb.local = opt.local)){
					Gun.obj.map(opt.peers || gun.__.opt.peers, function(peer, url){ var p = {};
						tab.request(url, null, tab.error(cb, "Error: Get failed through " + url, function(reply){
							if(!p.graph && !Gun.obj.empty(cb.graph)){ // if we have local data
								tab.put(p.graph = cb.graph, function(e,r){ // then sync it if we haven't already
									Gun.log("Stateless handshake sync:", e, r);
								}, {peers: tab.peers(url)}); // to the peer. // TODO: This forces local to flush again, not necessary.
							}
							if(!Gun.is.soul(key)){
								Gun.is.graph(reply.body || gun.__.key.s[key], function(node, soul){ // make sure for each received node or nodes of our key
									tab.key(key, soul, function(){}); // that the key points to it.
								});
							}
							setTimeout(function(){ tab.put(reply.body, function(){}, {local: true}) },1); // and flush the in memory nodes of this graph to localStorage after we've had a chance to union on it.
						}), opt);
						cb.peers = true;
					});
				} tab.peers(cb);
			}
			tab.put = tab.put || function(graph, cb, opt){
				cb = cb || function(){};
				opt = opt || {};
				Gun.is.graph(graph, function(node, soul){
					if(!opt.local){ gun.__.on(soul).emit(node) } // TODO: Should this be in core?
					if(!gun.__.graph[soul]){ return }
					tab.store.put(tab.prefix + tab.prenode + soul, gun.__.graph[soul]);
				});
				if(!(cb.local = opt.local)){
					Gun.obj.map(opt.peers || gun.__.opt.peers, function(peer, url){
						tab.request(url, graph, tab.error(cb, "Error: Put failed on " + url), {headers: tab.headers});
						cb.peers = true;
					});
				} tab.peers(cb);
			}
			tab.key = tab.key || function(key, soul, cb, opt){
				var meta = {};
				opt = opt || {};
				cb = cb || function(){};
				meta[Gun._.soul] = soul = Gun.is.soul(soul) || soul;
				if(!soul){ return cb({err: Gun.log("No soul!")}) }
				(function(souls){
					(souls = tab.store.get(tab.prefix + tab.prekey + key) || {})[soul] = meta;
					tab.store.put(tab.prefix + tab.prekey + key, souls);
				}());
				if(!(cb.local = opt.local || opt.soul)){
					Gun.obj.map(opt.peers || gun.__.opt.peers, function(peer, url){
						tab.request(url, meta, tab.error(cb, "Error: Key failed to be made on " + url), {url: {pathname: '/' + key }, headers: tab.headers});
						cb.peers = true;
					}); 
				} tab.peers(cb);
			}
			tab.error = function(cb, error, fn){
				return function(err, reply){
					reply.body = reply.body || reply.chunk || reply.end || reply.write;
					if(err || !reply || (err = reply.body && reply.body.err)){
						return cb({err: Gun.log(err || error) });
					}
					if(fn){ fn(reply) }
					cb(null, reply.body);
				}
			}
			tab.peers = function(cb, o){
				if(Gun.text.is(cb)){ return (o = {})[cb] = {}, o }
				if(cb && !cb.peers){ setTimeout(function(){
					if(!cb.local){ console.log("Warning! You have no peers to connect to!") }
					if(!(cb.graph || cb.node)){ cb() }
				},1)}
			}
			tab.server = tab.server || function(req, res){
				if(!req || !res || !req.url || !req.method){ return }
				req.url = req.url.href? req.url : document.createElement('a');
				req.url.href = req.url.href || req.url;
				req.url.key = (req.url.pathname||'').replace(tab.server.regex,'').replace(/^\//i,'') || '';
				req.method = req.body? 'put' : 'get';
				if('get' == req.method){ return tab.server.get(req, res) }
				if('put' == req.method || 'post' == req.method){ return tab.server.put(req, res) }
			}
			tab.server.json = 'application/json';
			tab.server.regex = gun.__.opt.route = gun.__.opt.route || opt.route || /^\/gun/i;
			tab.server.get = function(){}
			tab.server.put = function(req, cb){
				var reply = {headers: {'Content-Type': tab.server.json}};
				if(!req.body){ return cb({headers: reply.headers, body: {err: "No body"}}) }
				// TODO: Re-emit message to other peers if we have any non-overlaping ones.
				if(tab.server.put.key(req, cb)){ return }
				if(Gun.is.node(req.body) || Gun.is.graph(req.body, function(node, soul){
					gun.__.flag.end[soul] = true; // TODO: Put this in CORE not in TAB driver?
				})){
					//console.log("tran.put", req.body);					
					if(req.err = Gun.union(gun, req.body, function(err, ctx){
						if(err){ return cb({headers: reply.headers, body: {err: err || "Union failed."}}) }
						var ctx = ctx || {}; ctx.graph = {};
						Gun.is.graph(req.body, function(node, soul){ ctx.graph[soul] = gun.__.graph[soul] });
						gun.__.opt.hooks.put(ctx.graph, function(err, ok){
							if(err){ return cb({headers: reply.headers, body: {err: err || "Failed."}}) }
							cb({headers: reply.headers, body: {ok: ok || "Persisted."}});
						}, {local: true});
					}).err){ cb({headers: reply.headers, body: {err: req.err || "Union failed."}}) }
				}
			}
			tab.server.put.key = function(req, cb){
				if(!req || !req.url || !req.url.key || !Gun.obj.has(req.body, Gun._.soul)){ return }
				var index = req.url.key, soul = Gun.is.soul(req.body);
				//console.log("tran.key", index, req.body);
				gun.key(index, function(err, reply){
					if(err){ return cb({headers: {'Content-Type': tab.server.json}, body: {err: err}}) }
					cb({headers: {'Content-Type': tab.server.json}, body: reply}); // TODO: Fix so we know what the reply is.
				}, soul);
				return true;
			}
			Gun.obj.map(gun.__.opt.peers, function(){ // only create server if peers and do it once by returning immediately.
				return (tab.server.able = tab.server.able || tab.request.createServer(tab.server) || true);
			});
			gun.__.opt.hooks.get = gun.__.opt.hooks.get || tab.get;
			gun.__.opt.hooks.put = gun.__.opt.hooks.put || tab.put;
			gun.__.opt.hooks.key = gun.__.opt.hooks.key || tab.key;
		});
		var store = (function(){
			function s(){}
			var store = window.localStorage || {setItem: function(){}, removeItem: function(){}, getItem: function(){}};
			s.put = function(key, val){ return store.setItem(key, Gun.text.ify(val)) }
			s.get = function(key){ return Gun.obj.ify(store.getItem(key) || null) }
			s.del = function(key){ return store.removeItem(key) }
			return s;
		}());
		var request = (function(){
			function r(base, body, cb, opt){
				opt = opt || (base.length? {base: base} : base);
				opt.base = opt.base || base;
				opt.body = opt.body || body;
				if(!opt.base){ return }
				r.transport(opt, cb);
			}
			r.createServer = function(fn){ r.createServer.s.push(fn) }
			r.createServer.ing = function(req, cb){
				var i = r.createServer.s.length;
				while(i--){ (r.createServer.s[i] || function(){})(req, cb) }
			}
			r.createServer.s = [];
			r.transport = function(opt, cb){
				//Gun.log("TRANSPORT:", opt);
				if(r.ws(opt, cb)){ return }
				r.jsonp(opt, cb);
			}
			r.ws = function(opt, cb){
				var ws, WS = window.WebSocket || window.mozWebSocket || window.webkitWebSocket;
				if(!WS){ return }
				if(ws = r.ws.peers[opt.base]){
					if(!ws.readyState){ return setTimeout(function(){ r.ws(opt, cb) },10), true }
					var req = {};
					if(opt.headers){ req.headers = opt.headers }
					if(opt.body){ req.body = opt.body }
					if(opt.url){ req.url = opt.url }
					req.headers = req.headers || {};
					r.ws.cbs[req.headers['ws-rid'] = 'WS' + (+ new Date()) + '.' + Math.floor((Math.random()*65535)+1)] = function(err,res){
						if(res.body || res.end){ delete r.ws.cbs[req.headers['ws-rid']] }
						cb(err,res);
					}
					ws.send(JSON.stringify(req));
					return true;
				}
				if(ws === false){ return }
				ws = r.ws.peers[opt.base] = new WS(opt.base.replace('http','ws'));
				ws.onopen = function(o){ r.ws(opt, cb) };
				ws.onclose = window.onbeforeunload = function(c){
					if(!c){ return }
					if(ws && ws.close instanceof Function){ ws.close() }
					if(1006 === c.code){ // websockets cannot be used
						ws = r.ws.peers[opt.base] = false;
						r.transport(opt, cb);
						return;
					}
					ws = r.ws.peers[opt.base] = null; // this will make the next request try to reconnect
					setTimeout(function(){
						console.log("!!!!! WEBSOCKET DICONNECTED !!!!!! ATTEMPTING INFINITE RETRY WITH NO BACKOFF !!!!!!!");
						r.ws(opt, function(){}); // opt here is a race condition, is it not? Does this matter?
					}, 50) // make this an exponential backoff.
				};
				ws.onmessage = function(m){
					if(!m || !m.data){ return }
					var res;
					try{res = JSON.parse(m.data);
					}catch(e){ return }
					if(!res){ return }
					res.headers = res.headers || {};
					if(res.headers['ws-rid']){ return (r.ws.cbs[res.headers['ws-rid']]||function(){})(null, res) }
					Gun.log("We have a pushed message!", res);
					if(res.body){ r.createServer.ing(res, function(){}) } // emit extra events.
				};
				ws.onerror = function(e){ console.log("!!!! WEBSOCKET ERROR !!!!", e); Gun.log(e); };
				return true;
			}
			r.ws.peers = {};
			r.ws.cbs = {};
			r.jsonp = function(opt, cb){
				//Gun.log("jsonp send", opt);
				r.jsonp.ify(opt, function(url){
					//Gun.log(url);
					if(!url){ return }
					r.jsonp.send(url, function(reply){
						//Gun.log("jsonp reply", reply);
						cb(null, reply);
						r.jsonp.poll(opt, reply);
					}, opt.jsonp);
				});
			}
			r.jsonp.send = function(url, cb, id){
				var js = document.createElement('script');
				js.src = url;
				window[js.id = id] = function(res){
					cb(res);
					cb.id = js.id;
					js.parentNode.removeChild(js);
					window[cb.id] = null; // TODO: BUG: This needs to handle chunking!
					try{delete window[cb.id];
					}catch(e){}
				}
				js.async = true;
				document.getElementsByTagName('head')[0].appendChild(js);
				return js;
			}
			r.jsonp.poll = function(opt, res){
				if(!opt || !opt.base || !res || !res.headers || !res.headers.poll){ return }
				(r.jsonp.poll.s = r.jsonp.poll.s || {})[opt.base] = r.jsonp.poll.s[opt.base] || setTimeout(function(){ // TODO: Need to optimize for Chrome's 6 req limit?
					//Gun.log("polling again");
					var o = {base: opt.base, headers: {pull: 1}};
					r.each(opt.headers, function(v,i){ o.headers[i] = v })
					r.jsonp(o, function(err, reply){
						delete r.jsonp.poll.s[opt.base];
						while(reply.body && reply.body.length && reply.body.shift){ // we're assuming an array rather than chunk encoding. :(
							var res = reply.body.shift();
							//Gun.log("-- go go go", res);
							if(res && res.body){ r.createServer.ing(res, function(){}) } // emit extra events.
						}
					});
				}, res.headers.poll);
			}
			r.jsonp.ify = function(opt, cb){
				var uri = encodeURIComponent, q = '?';
				if(opt.url && opt.url.pathname){ q = opt.url.pathname + q; }
				q = opt.base + q;
				r.each((opt.url||{}).query, function(v, i){ q += uri(i) + '=' + uri(v) + '&' });
				if(opt.headers){ q += uri('`') + '=' + uri(JSON.stringify(opt.headers)) + '&' }
				if(r.jsonp.max < q.length){ return cb() }
				q += uri('jsonp') + '=' + uri(opt.jsonp = 'P'+Math.floor((Math.random()*65535)+1));
				if(opt.body){
					q += '&';
					var w = opt.body, wls = function(w,l,s){
						return uri('%') + '=' + uri(w+'-'+(l||w)+'/'+(s||w))  + '&' + uri('$') + '=';
					}
					if(typeof w != 'string'){
						w = JSON.stringify(w);
						q += uri('^') + '=' + uri('json') + '&';
					}
					w = uri(w);
					var i = 0, l = w.length
					, s = r.jsonp.max - (q.length + wls(l.toString()).length);
					if(s < 0){ return cb() }
					while(w){
						cb(q + wls(i, (i = i + s), l) + w.slice(0, i));
						w = w.slice(i);
					}
				} else {
					cb(q);
				}
			}
			r.jsonp.max = 2000;
			r.each = function(obj, cb){
				if(!obj || !cb){ return }
				for(var i in obj){
					if(obj.hasOwnProperty(i)){
						cb(obj[i], i);
					}
				}
			}
			return r;
		}());
	}({}));

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	;(function(){
		var Gun = __webpack_require__(3);
		var S3 = __webpack_require__(5);

		Gun.on('opt').event(function(gun, opt){
			if(!opt.s3){ return } // don't use S3 if it isn't specified.
			opt.s3 = opt.s3 || {};
			var s3 = gun.__.opt.s3 = gun.__.opt.s3 || S3(opt && opt.s3);
			s3.prefix = s3.prefix || opt.s3.prefix || '';
			s3.prekey = s3.prekey || opt.s3.prekey || '';
			s3.prenode = s3.prenode || opt.s3.prenode || '_/nodes/';
			gun.__.opt.batch = opt.batch || gun.__.opt.batch || 10;
			gun.__.opt.throttle = opt.throttle || gun.__.opt.throttle || 15;
			gun.__.opt.disconnect = opt.disconnect || gun.__.opt.disconnect || 5;
			s3.get = s3.get || function(key, cb, opt){
				if(!key){ return }
				cb = cb || function(){};
				(opt = opt || {}).ctx = opt.ctx || {};
				opt.ctx.load = opt.ctx.load || {};
				if(key[Gun._.soul]){
					key = s3.prefix + s3.prenode + Gun.is.soul(key);
				} else {
					key = s3.prefix + s3.prekey + key;
				}
				s3.GET(key, function(err, data, text, meta){
					Gun.log('via s3', key, err);
					if(err && err.statusCode == 404){
						err = null; // we want a difference between 'unfound' (data is null) and 'error' (auth is wrong).
					}
					// TODO: optimize KEY command to not write data if there is only one soul (which is common).
					if(meta && (meta.key || meta[Gun._.soul])){
						if(err){ return cb(err) }
						if(meta.key && Gun.obj.is(data) && !Gun.is.node(data)){
							return Gun.obj.map(data, function(rel, soul){
								if(!(soul = Gun.is.soul(rel))){ return }
								opt.ctx.load[soul] = false;
								s3.get(rel, cb, {next: 's3', ctx: opt.ctx}); // TODO: way faster if you use cache.
							});
						}
						if(meta[Gun._.soul]){
							return s3.get(meta, cb); // TODO: way faster if you use cache.
						}
						return cb({err: Gun.log('Cannot determine S3 key data!')});
					}
					if(data){
						meta.soul = Gun.is.soul.on(data);
						if(!meta.soul){
							err = {err: Gun.log('No soul on node S3 data!')};
						}
					} else {
						return cb(err, null);
					}
					if(err){ return cb(err) }
					opt.ctx.load[meta.soul] = true;
					var graph = {};
					graph[meta.soul] = data;
					cb(null, graph);
					(graph = {})[meta.soul] = Gun.union.pseudo(meta.soul);
					cb(null, graph);
					if(Gun.obj.map(opt.ctx.load, function(loaded, soul){
						if(!loaded){ return true }
					})){ return } // return IF we have nodes still loading.
					cb(null, {});
				});
			}
			s3.put = s3.put || function(nodes, cb){
				s3.batching += 1;
				cb = cb || function(){};
				cb.count = 0;
				var next = s3.next
				, ack = Gun.text.random(8)
				, batch = s3.batch[next] = s3.batch[next] || {};
				s3.on(ack).once(cb);
				Gun.obj.map(nodes, function(node, soul){
					cb.count += 1;
					batch[soul] = (batch[soul] || 0) + 1;
					//Gun.log("put listener for", next + ':' + soul, batch[soul], cb.count);
					s3.on(next + ':' + soul).event(function(){
						cb.count -= 1;
						//Gun.log("transaction", cb.count);
						if(!cb.count){
							s3.on(ack).emit();
							this.off(); // MEMORY LEAKS EVERYWHERE!!!!!!!!!!!!!!!! FIX THIS!!!!!!!!!
						}
					});
				});
				if(gun.__.opt.batch < s3.batching){
					return s3.put.now();
				}
				if(!gun.__.opt.throttle){
					return s3.put.now();
				}
				s3.wait = s3.wait || setTimeout(s3.put.now, gun.__.opt.throttle * 1000); // in seconds
			}
			s3.put.now = s3.put.now || function(){
				clearTimeout(s3.wait);
				s3.batching = 0;
				s3.wait = null;
				var now = s3.next
				, batch = s3.batch[s3.next];
				s3.next = Gun.time.is();
				Gun.obj.map(batch, function put(exists, soul){
					var node = gun.__.graph[soul]; // the batch does not actually have the nodes, but what happens when we do cold data? Could this be gone?
					s3.PUT(s3.prefix + s3.prenode + soul, node, function(err, reply){
						Gun.log("s3 put reply", soul, err, reply);
						if(err || !reply){
							put(exists, soul); // naive implementation of retry TODO: BUG: need backoff and anti-infinite-loop!
							return;
						}
						s3.on(now + ':' + soul).emit(200);
					});
				});
			}
			s3.next = s3.next || Gun.time.is();
			s3.on = s3.on || Gun.on.create();
			s3.batching = s3.batching || 0;
			s3.batched = s3.batched || {};
			s3.batch = s3.batch || {};
			s3.persisted = s3.persisted || {};
			s3.wait = s3.wait || null;

			s3.key = s3.key || function(key, soul, cb){
				if(!key){
					return cb({err: "No key!"});
				}
				if(!soul){
					return cb({err: "No soul!"});
				}
				var path = s3.prefix + s3.prekey + key, meta = {key: '0.2'}, rel = {};
				meta[Gun._.soul] = rel[Gun._.soul] = soul = Gun.is.soul(soul) || soul;
				s3.GET(path, function(err, data, text, _){
					var souls = data || {};
					souls[soul] = rel;
					s3.PUT(path, souls, function(err, reply){
						Gun.log("s3 key reply", soul, err, reply);
						if(err || !reply){
							return s3.key(key, soul, cb); // naive implementation of retry TODO: BUG: need backoff and anti-infinite-loop!
						}
						cb();
					}, {Metadata: meta});
				});
			}

			opt.hooks = opt.hooks || {};
			gun.opt({hooks: {
				get: opt.hooks.get || s3.get
				,put: opt.hooks.put || s3.put
				,key: opt.hooks.key || s3.key
			}}, true);
		});
	}());


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {;module.exports = (function(a, own){

		function s3(opt){
			if(!(a.fns.is(this) || this instanceof s3)){
				return new s3(opt);
			}
			var s = this;
			s.on = a.on.create();
			s.AWS = __webpack_require__(7);
			s.config = {};
			opt = opt || {};
			s.AWS.config.bucket = s.config.bucket = opt.bucket || opt.Bucket || s.config.bucket || process.env.AWS_S3_BUCKET;
			s.AWS.config.region = s.config.region = opt.region || s.config.region || process.env.AWS_REGION || "us-east-1";
			s.AWS.config.accessKeyId = s.config.accessKeyId = opt.key = opt.key || opt.accessKeyId || s.config.accessKeyId || process.env.AWS_ACCESS_KEY_ID;
			s.AWS.config.secretAccessKey = s.config.secretAccessKey = opt.secret || opt.secretAccessKey || s.config.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY;
			if(s.config.fakes3 = s.config.fakes3 || opt.fakes3 || process.env.fakes3){
				s.AWS.config.endpoint = s.config.endpoint = opt.fakes3 || s.config.fakes3 || process.env.fakes3;
				s.AWS.config.sslEnabled = s.config.sslEnabled = false;
				s.AWS.config.bucket = s.config.bucket = s.config.bucket.replace('.','p');
			}
			s.AWS.config.update(s.config);
			s.S3 = function(){
				var s = new this.AWS.S3();
				if(this.config.fakes3){
					s.endpoint = config.endpoint;
				}
				return s;
			}
			return s;
		};
		s3.id = function(m){ return m.Bucket +'/'+ m.Key }
		s3.chain = s3.prototype;
		s3.chain.PUT = function(key, o, cb, m){
			if(!key){ return }
			m = m || {}
			m.Bucket = m.Bucket || this.config.bucket;
			m.Key = m.Key || key;
			if(a.obj.is(o) || a.list.is(o)){
				m.Body = a.text.ify(o);
				m.ContentType = 'application/json';
			} else {
				m.Body = a.text.is(o)? o : a.text.ify(o);
			}
			this.S3().putObject(m, function(e,r){
				//a.log('saved', e,r);
				if(!cb){ return }
				cb(e,r);
			});
			return this;
		}
		s3.chain.GET = function(key, cb, o){
			if(!key){ return }
			var s = this
			, m = {
				Bucket: s.config.bucket
				,Key: key
			}, id = s3.id(m);
			s.on(id).once(function(e,d,t,m,r){
				delete s.batch[id];
				if(!a.fns.is(cb)){ return }
				try{ cb(e,d,t,m,r);
				}catch(e){
					console.log(e);
				}
			});
			s.batch = s.batch || {};
			if(s.batch[id]){ return s }
			s.batch[id] = (s.batch[id] || 0) + 1;
			a.log("no batch!");
			s.S3().getObject(m, function(e,r){
				var d, t, m;
				r = r || (this && this.httpResponse);
				if(e || !r){ return s.on(id).emit(e) }
				r.Text = r.text = t = (r.Body||r.body||'').toString('utf8');
				r.Type = r.type = r.ContentType || (r.headers||{})['content-type'];
				if(r.type && 'application/json' === r.type){
					d = a.obj.ify(t);
				}
				m = r.Metadata;
				s.on(id).emit(e, d, t, m, r); // Warning about the r parameter, is is the raw response and may result in stupid SAX errors.
			});
			return s;
		}
		s3.chain.del = function(key, cb){
			if(!key){ return }
			var m = {
				Bucket: this.config.bucket
				,Key: key
			}
			this.S3().deleteObject(m, function(e,r){
				if(!cb){ return }
				cb(e, r);
			});
			return this;
		}
		s3.chain.dbs = function(o, cb){
			cb = cb || o;
			var m = {}
			this.S3().listBuckets(m, function(e,r){
				//a.log('dbs',e);
				a.list.map((r||{}).Contents, function(v){console.log(v);});
				//a.log('---end list---');
				if(!a.fns.is(cb)) return;
				cb(e,r);
			});
			return this;
		}
		s3.chain.keys = function(from, upto, cb){
			cb = cb || upto || from;
			var m = {
				Bucket: this.config.bucket
			}
			if(a.text.is(from)){
				m.Prefix = from;
			}
			if(a.text.is(upto)){
				m.Delimiter = upto;
			}
			this.S3().listObjects(m, function(e,r){
				//a.log('list',e);
				a.list.map((r||{}).Contents, function(v){console.log(v)});
				//a.log('---end list---');
				if(!a.fns.is(cb)) return;
				cb(e,r);
			});
			return this;
		}
		return s3;
	})(__webpack_require__(3), {});
	/**
	Knox S3 Config is:
	knox.createClient({
	    key: ''
	  , secret: ''
	  , bucket: ''
	  , endpoint: 'us-standard'
	  , port: 0
	  , secure: true
	  , token: ''
	  , style: ''
	  , agent: ''
	});

	aws-sdk for s3 is:
	{ "accessKeyId": "akid", "secretAccessKey": "secret", "region": "us-west-2" }
	AWS.config.loadFromPath('./config.json');
	 {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID = ''
		,secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY = ''
		,Bucket: process.env.s3Bucket = ''
		,region: process.env.AWS_REGION = "us-east-1"
		,sslEnabled: ''
	}
	**/

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)))

/***/ },
/* 6 */
/***/ function(module, exports) {

	// shim for using process in browser

	var process = module.exports = {};
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;

	function cleanUpNextTick() {
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}

	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = setTimeout(cleanUpNextTick);
	    draining = true;

	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    clearTimeout(timeout);
	}

	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        setTimeout(drainQueue, 0);
	    }
	};

	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};

	function noop() {}

	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;

	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};

	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var AWS = __webpack_require__(8);

	// Load browser API loader
	AWS.apiLoader = function(svc, version) {
	  return AWS.apiLoader.services[svc][version];
	};

	/**
	 * @api private
	 */
	AWS.apiLoader.services = {};

	// Load the DOMParser XML parser
	AWS.XML.Parser = __webpack_require__(127);

	// Load the XHR HttpClient
	__webpack_require__(107);

	if (typeof window !== 'undefined') window.AWS = AWS;
	if (true) module.exports = AWS;


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * The main AWS namespace
	 */
	var AWS = { util: __webpack_require__(9) };

	/**
	 * @api private
	 * @!macro [new] nobrowser
	 *   @note This feature is not supported in the browser environment of the SDK.
	 */
	var _hidden = {}; _hidden.toString(); // hack to parse macro

	module.exports = AWS;

	AWS.util.update(AWS, {

	  /**
	   * @constant
	   */
	  VERSION: '2.0.31',

	  /**
	   * @api private
	   */
	  Signers: {},

	  /**
	   * @api private
	   */
	  Protocol: {
	    Json: __webpack_require__(99),
	    Query: __webpack_require__(105),
	    Rest: __webpack_require__(102),
	    RestJson: __webpack_require__(103),
	    RestXml: __webpack_require__(104)
	  },

	  /**
	   * @api private
	   */
	  XML: {
	    Builder: __webpack_require__(128),
	    Parser: null // conditionally set based on environment
	  },

	  /**
	   * @api private
	   */
	  JSON: {
	    Builder: __webpack_require__(100),
	    Parser: __webpack_require__(101)
	  },

	  /**
	   * @api private
	   */
	  Model: {
	    Api: __webpack_require__(108),
	    Operation: __webpack_require__(109),
	    Shape: __webpack_require__(37),
	    Paginator: __webpack_require__(110),
	    ResourceWaiter: __webpack_require__(111)
	  },

	  util: __webpack_require__(9),

	  /**
	   * @api private
	   */
	  apiLoader: function() { throw new Error('No API loader set'); }
	});

	__webpack_require__(119);

	__webpack_require__(91);
	__webpack_require__(92);
	__webpack_require__(95);
	__webpack_require__(96);
	__webpack_require__(93);
	__webpack_require__(94);

	__webpack_require__(90);
	__webpack_require__(60);
	__webpack_require__(98);
	__webpack_require__(97);
	__webpack_require__(115);
	__webpack_require__(118);
	__webpack_require__(117);
	__webpack_require__(121);
	__webpack_require__(112);

	/**
	 * @readonly
	 * @return [AWS.SequentialExecutor] a collection of global event listeners that
	 *   are attached to every sent request.
	 * @see AWS.Request AWS.Request for a list of events to listen for
	 * @example Logging the time taken to send a request
	 *   AWS.events.on('send', function startSend(resp) {
	 *     resp.startTime = new Date().getTime();
	 *   }).on('complete', function calculateTime(resp) {
	 *     var time = (new Date().getTime() - resp.startTime) / 1000;
	 *     console.log('Request took ' + time + ' seconds');
	 *   });
	 *
	 *   new AWS.S3().listBuckets(); // prints 'Request took 0.285 seconds'
	 */
	AWS.events = new AWS.SequentialExecutor();


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {/* eslint guard-for-in:0 */

	var cryptoLib = __webpack_require__(10);
	var Buffer = __webpack_require__(11).Buffer;
	var AWS;

	/**
	 * A set of utility methods for use with the AWS SDK.
	 *
	 * @!attribute abort
	 *   Return this value from an iterator function {each} or {arrayEach}
	 *   to break out of the iteration.
	 *   @example Breaking out of an iterator function
	 *     AWS.util.each({a: 1, b: 2, c: 3}, function(key, value) {
	 *       if (key == 'b') return AWS.util.abort;
	 *     });
	 *   @see each
	 *   @see arrayEach
	 * @api private
	 */
	var util = {
	  engine: function engine() {
	    if (util.isBrowser() && typeof navigator !== 'undefined') {
	      return navigator.userAgent;
	    } else {
	      return process.platform + '/' + process.version;
	    }
	  },

	  userAgent: function userAgent() {
	    var name = util.isBrowser() ? 'js' : 'nodejs';
	    var agent = 'aws-sdk-' + name + '/' + __webpack_require__(8).VERSION;
	    if (name === 'nodejs') agent += ' ' + util.engine();
	    return agent;
	  },

	  isBrowser: function isBrowser() { return process && process.browser; },
	  isNode: function isNode() { return !util.isBrowser(); },
	  nodeRequire: function nodeRequire(module) {
	    if (util.isNode()) return __webpack_require__(32)(module);
	  },
	  multiRequire: function multiRequire(module1, module2) {
	    return __webpack_require__(32)(util.isNode() ? module1 : module2);
	  },

	  uriEscape: function uriEscape(string) {
	    var output = encodeURIComponent(string);
	    output = output.replace(/[^A-Za-z0-9_.~\-%]+/g, escape);

	    // AWS percent-encodes some extra non-standard characters in a URI
	    output = output.replace(/[*]/g, function(ch) {
	      return '%' + ch.charCodeAt(0).toString(16).toUpperCase();
	    });

	    return output;
	  },

	  uriEscapePath: function uriEscapePath(string) {
	    var parts = [];
	    util.arrayEach(string.split('/'), function (part) {
	      parts.push(util.uriEscape(part));
	    });
	    return parts.join('/');
	  },

	  urlParse: function urlParse(url) {
	    return __webpack_require__(67).parse(url);
	  },

	  urlFormat: function urlFormat(url) {
	    return __webpack_require__(67).format(url);
	  },

	  queryStringParse: function queryStringParse(qs) {
	    return __webpack_require__(132).parse(qs);
	  },

	  queryParamsToString: function queryParamsToString(params) {
	    var items = [];
	    var escape = util.uriEscape;
	    var sortedKeys = Object.keys(params).sort();

	    util.arrayEach(sortedKeys, function(name) {
	      var value = params[name];
	      var ename = escape(name);
	      var result = ename + '=';
	      if (Array.isArray(value)) {
	        var vals = [];
	        util.arrayEach(value, function(item) { vals.push(escape(item)); });
	        result = ename + '=' + vals.sort().join('&' + ename + '=');
	      } else if (value !== undefined && value !== null) {
	        result = ename + '=' + escape(value);
	      }
	      items.push(result);
	    });

	    return items.join('&');
	  },

	  readFileSync: function readFileSync(path) {
	    if (typeof window !== 'undefined') return null;
	    return util.nodeRequire('fs').readFileSync(path, 'utf-8');
	  },

	  base64: {

	    encode: function encode64(string) {
	      return new Buffer(string).toString('base64');
	    },

	    decode: function decode64(string) {
	      return new Buffer(string, 'base64');
	    }

	  },

	  Buffer: Buffer,

	  buffer: {
	    toStream: function toStream(buffer) {
	      if (!util.Buffer.isBuffer(buffer)) buffer = new util.Buffer(buffer);

	      var readable = new (util.nodeRequire('stream').Readable)();
	      var pos = 0;
	      readable._read = function(size) {
	        if (pos >= buffer.length) return readable.push(null);

	        var end = pos + size;
	        if (end > buffer.length) end = buffer.length;
	        readable.push(buffer.slice(pos, end));
	        pos = end;
	      };

	      return readable;
	    },

	    /**
	     * Concatenates a list of Buffer objects.
	     */
	    concat: function(buffers) {
	      var length = 0,
	          offset = 0,
	          buffer = null, i;

	      for (i = 0; i < buffers.length; i++) {
	        length += buffers[i].length;
	      }

	      buffer = new Buffer(length);

	      for (i = 0; i < buffers.length; i++) {
	        buffers[i].copy(buffer, offset);
	        offset += buffers[i].length;
	      }

	      return buffer;
	    }
	  },

	  string: {
	    byteLength: function byteLength(string) {
	      if (string === null || string === undefined) return 0;
	      if (typeof string === 'string') string = new Buffer(string);

	      if (typeof string.byteLength === 'number') {
	        return string.byteLength;
	      } else if (typeof string.length === 'number') {
	        return string.length;
	      } else if (typeof string.size === 'number') {
	        return string.size;
	      } else if (typeof string.path === 'string') {
	        return util.nodeRequire('fs').lstatSync(string.path).size;
	      } else {
	        throw util.error(new Error('Cannot determine length of ' + string),
	          { object: string });
	      }
	    },

	    upperFirst: function upperFirst(string) {
	      return string[0].toUpperCase() + string.substr(1);
	    },

	    lowerFirst: function lowerFirst(string) {
	      return string[0].toLowerCase() + string.substr(1);
	    }
	  },

	  ini: {
	    parse: function string(ini) {
	      var currentSection, map = {};
	      util.arrayEach(ini.split(/\r?\n/), function(line) {
	        line = line.split(/(^|\s);/)[0]; // remove comments
	        var section = line.match(/^\s*\[([^\[\]]+)\]\s*$/);
	        if (section) {
	          currentSection = section[1];
	        } else if (currentSection) {
	          var item = line.match(/^\s*(.+?)\s*=\s*(.+)\s*$/);
	          if (item) {
	            map[currentSection] = map[currentSection] || {};
	            map[currentSection][item[1]] = item[2];
	          }
	        }
	      });

	      return map;
	    }
	  },

	  fn: {
	    noop: function(){},

	    /**
	     * Turn a synchronous function into as "async" function by making it call
	     * a callback. The underlying function is called with all but the last argument,
	     * which is treated as the callback. The callback is passed passed a first argument
	     * of null on success to mimick standard node callbacks.
	     */
	    makeAsync: function makeAsync(fn, expectedArgs) {
	      if (expectedArgs && expectedArgs <= fn.length) {
	        return fn;
	      }

	      return function() {
	        var args = Array.prototype.slice.call(arguments, 0);
	        var callback = args.pop();
	        var result = fn.apply(null, args);
	        callback(result);
	      };
	    }
	  },

	  jamespath: {
	    query: function query(expression, data) {
	      if (!data) return [];

	      var results = [];
	      var expressions = expression.split(/\s+\|\|\s+/);
	      util.arrayEach.call(this, expressions, function (expr) {
	        var objects = [data];
	        var tokens = expr.split('.');
	        util.arrayEach.call(this, tokens, function (token) {
	          var match = token.match('^(.+?)(?:\\[(-?\\d+|\\*|)\\])?$');
	          var newObjects = [];
	          util.arrayEach.call(this, objects, function (obj) {
	            if (match[1] === '*') {
	              util.arrayEach.call(this, obj, function (value) {
	                newObjects.push(value);
	              });
	            } else if (obj.hasOwnProperty(match[1])) {
	              newObjects.push(obj[match[1]]);
	            }
	          });
	          objects = newObjects;

	          // handle indexing (token[0], token[-1])
	          if (match[2] !== undefined) {
	            newObjects = [];
	            util.arrayEach.call(this, objects, function (obj) {
	              if (Array.isArray(obj)) {
	                if (match[2] === '*' || match[2] === '') {
	                  newObjects = newObjects.concat(obj);
	                } else {
	                  var idx = parseInt(match[2], 10);
	                  if (idx < 0) idx = obj.length + idx; // negative indexing
	                  newObjects.push(obj[idx]);
	                }
	              }
	            });
	            objects = newObjects;
	          }

	          if (objects.length === 0) return util.abort;
	        });

	        if (objects.length > 0) {
	          results = objects;
	          return util.abort;
	        }
	      });

	      return results;
	    },

	    find: function find(expression, data) {
	      return util.jamespath.query(expression, data)[0];
	    }
	  },

	  /**
	   * Date and time utility functions.
	   */
	  date: {

	    /**
	     * @return [Date] the current JavaScript date object. Since all
	     *   AWS services rely on this date object, you can override
	     *   this function to provide a special time value to AWS service
	     *   requests.
	     */
	    getDate: function getDate() {
	      if (!AWS) AWS = __webpack_require__(8);
	      if (AWS.config.systemClockOffset) { // use offset when non-zero
	        return new Date(new Date().getTime() + AWS.config.systemClockOffset);
	      } else {
	        return new Date();
	      }
	    },

	    /**
	     * @return [String] the date in ISO-8601 format
	     */
	    iso8601: function iso8601(date) {
	      if (date === undefined) { date = util.date.getDate(); }
	      return date.toISOString();
	    },

	    /**
	     * @return [String] the date in RFC 822 format
	     */
	    rfc822: function rfc822(date) {
	      if (date === undefined) { date = util.date.getDate(); }
	      return date.toUTCString();
	    },

	    /**
	     * @return [Integer] the UNIX timestamp value for the current time
	     */
	    unixTimestamp: function unixTimestamp(date) {
	      if (date === undefined) { date = util.date.getDate(); }
	      return date.getTime() / 1000;
	    },

	    /**
	     * @param [String,number,Date] date
	     * @return [Date]
	     */
	    from: function format(date) {
	      if (typeof date === 'number') {
	        return new Date(date * 1000); // unix timestamp
	      } else {
	        return new Date(date);
	      }
	    },

	    /**
	     * Given a Date or date-like value, this function formats the
	     * date into a string of the requested value.
	     * @param [String,number,Date] date
	     * @param [String] formatter Valid formats are:
	     #   * 'iso8601'
	     #   * 'rfc822'
	     #   * 'unixTimestamp'
	     * @return [String]
	     */
	    format: function format(date, formatter) {
	      if (!formatter) formatter = 'iso8601';
	      return util.date[formatter](util.date.from(date));
	    },

	    parseTimestamp: function parseTimestamp(value) {
	      if (typeof value === 'number') { // unix timestamp (number)
	        return new Date(value * 1000);
	      } else if (value.match(/^\d+$/)) { // unix timestamp
	        return new Date(value * 1000);
	      } else if (value.match(/^\d{4}/)) { // iso8601
	        return new Date(value);
	      } else if (value.match(/^\w{3},/)) { // rfc822
	        return new Date(value);
	      } else {
	        throw util.error(
	          new Error('unhandled timestamp format: ' + value),
	          {code: 'TimestampParserError'});
	      }
	    }

	  },

	  crypto: {
	    crc32Table: [
	     0x00000000, 0x77073096, 0xEE0E612C, 0x990951BA, 0x076DC419,
	     0x706AF48F, 0xE963A535, 0x9E6495A3, 0x0EDB8832, 0x79DCB8A4,
	     0xE0D5E91E, 0x97D2D988, 0x09B64C2B, 0x7EB17CBD, 0xE7B82D07,
	     0x90BF1D91, 0x1DB71064, 0x6AB020F2, 0xF3B97148, 0x84BE41DE,
	     0x1ADAD47D, 0x6DDDE4EB, 0xF4D4B551, 0x83D385C7, 0x136C9856,
	     0x646BA8C0, 0xFD62F97A, 0x8A65C9EC, 0x14015C4F, 0x63066CD9,
	     0xFA0F3D63, 0x8D080DF5, 0x3B6E20C8, 0x4C69105E, 0xD56041E4,
	     0xA2677172, 0x3C03E4D1, 0x4B04D447, 0xD20D85FD, 0xA50AB56B,
	     0x35B5A8FA, 0x42B2986C, 0xDBBBC9D6, 0xACBCF940, 0x32D86CE3,
	     0x45DF5C75, 0xDCD60DCF, 0xABD13D59, 0x26D930AC, 0x51DE003A,
	     0xC8D75180, 0xBFD06116, 0x21B4F4B5, 0x56B3C423, 0xCFBA9599,
	     0xB8BDA50F, 0x2802B89E, 0x5F058808, 0xC60CD9B2, 0xB10BE924,
	     0x2F6F7C87, 0x58684C11, 0xC1611DAB, 0xB6662D3D, 0x76DC4190,
	     0x01DB7106, 0x98D220BC, 0xEFD5102A, 0x71B18589, 0x06B6B51F,
	     0x9FBFE4A5, 0xE8B8D433, 0x7807C9A2, 0x0F00F934, 0x9609A88E,
	     0xE10E9818, 0x7F6A0DBB, 0x086D3D2D, 0x91646C97, 0xE6635C01,
	     0x6B6B51F4, 0x1C6C6162, 0x856530D8, 0xF262004E, 0x6C0695ED,
	     0x1B01A57B, 0x8208F4C1, 0xF50FC457, 0x65B0D9C6, 0x12B7E950,
	     0x8BBEB8EA, 0xFCB9887C, 0x62DD1DDF, 0x15DA2D49, 0x8CD37CF3,
	     0xFBD44C65, 0x4DB26158, 0x3AB551CE, 0xA3BC0074, 0xD4BB30E2,
	     0x4ADFA541, 0x3DD895D7, 0xA4D1C46D, 0xD3D6F4FB, 0x4369E96A,
	     0x346ED9FC, 0xAD678846, 0xDA60B8D0, 0x44042D73, 0x33031DE5,
	     0xAA0A4C5F, 0xDD0D7CC9, 0x5005713C, 0x270241AA, 0xBE0B1010,
	     0xC90C2086, 0x5768B525, 0x206F85B3, 0xB966D409, 0xCE61E49F,
	     0x5EDEF90E, 0x29D9C998, 0xB0D09822, 0xC7D7A8B4, 0x59B33D17,
	     0x2EB40D81, 0xB7BD5C3B, 0xC0BA6CAD, 0xEDB88320, 0x9ABFB3B6,
	     0x03B6E20C, 0x74B1D29A, 0xEAD54739, 0x9DD277AF, 0x04DB2615,
	     0x73DC1683, 0xE3630B12, 0x94643B84, 0x0D6D6A3E, 0x7A6A5AA8,
	     0xE40ECF0B, 0x9309FF9D, 0x0A00AE27, 0x7D079EB1, 0xF00F9344,
	     0x8708A3D2, 0x1E01F268, 0x6906C2FE, 0xF762575D, 0x806567CB,
	     0x196C3671, 0x6E6B06E7, 0xFED41B76, 0x89D32BE0, 0x10DA7A5A,
	     0x67DD4ACC, 0xF9B9DF6F, 0x8EBEEFF9, 0x17B7BE43, 0x60B08ED5,
	     0xD6D6A3E8, 0xA1D1937E, 0x38D8C2C4, 0x4FDFF252, 0xD1BB67F1,
	     0xA6BC5767, 0x3FB506DD, 0x48B2364B, 0xD80D2BDA, 0xAF0A1B4C,
	     0x36034AF6, 0x41047A60, 0xDF60EFC3, 0xA867DF55, 0x316E8EEF,
	     0x4669BE79, 0xCB61B38C, 0xBC66831A, 0x256FD2A0, 0x5268E236,
	     0xCC0C7795, 0xBB0B4703, 0x220216B9, 0x5505262F, 0xC5BA3BBE,
	     0xB2BD0B28, 0x2BB45A92, 0x5CB36A04, 0xC2D7FFA7, 0xB5D0CF31,
	     0x2CD99E8B, 0x5BDEAE1D, 0x9B64C2B0, 0xEC63F226, 0x756AA39C,
	     0x026D930A, 0x9C0906A9, 0xEB0E363F, 0x72076785, 0x05005713,
	     0x95BF4A82, 0xE2B87A14, 0x7BB12BAE, 0x0CB61B38, 0x92D28E9B,
	     0xE5D5BE0D, 0x7CDCEFB7, 0x0BDBDF21, 0x86D3D2D4, 0xF1D4E242,
	     0x68DDB3F8, 0x1FDA836E, 0x81BE16CD, 0xF6B9265B, 0x6FB077E1,
	     0x18B74777, 0x88085AE6, 0xFF0F6A70, 0x66063BCA, 0x11010B5C,
	     0x8F659EFF, 0xF862AE69, 0x616BFFD3, 0x166CCF45, 0xA00AE278,
	     0xD70DD2EE, 0x4E048354, 0x3903B3C2, 0xA7672661, 0xD06016F7,
	     0x4969474D, 0x3E6E77DB, 0xAED16A4A, 0xD9D65ADC, 0x40DF0B66,
	     0x37D83BF0, 0xA9BCAE53, 0xDEBB9EC5, 0x47B2CF7F, 0x30B5FFE9,
	     0xBDBDF21C, 0xCABAC28A, 0x53B39330, 0x24B4A3A6, 0xBAD03605,
	     0xCDD70693, 0x54DE5729, 0x23D967BF, 0xB3667A2E, 0xC4614AB8,
	     0x5D681B02, 0x2A6F2B94, 0xB40BBE37, 0xC30C8EA1, 0x5A05DF1B,
	     0x2D02EF8D],

	    crc32: function crc32(data) {
	      var tbl = util.crypto.crc32Table;
	      var crc = 0 ^ -1;

	      if (typeof data === 'string') {
	        data = new Buffer(data);
	      }

	      for (var i = 0; i < data.length; i++) {
	        var code = data.readUInt8(i);
	        crc = (crc >>> 8) ^ tbl[(crc ^ code) & 0xFF];
	      }
	      return (crc ^ -1) >>> 0;
	    },

	    hmac: function hmac(key, string, digest, fn) {
	      if (!digest) digest = 'binary';
	      if (digest === 'buffer') { digest = undefined; }
	      if (!fn) fn = 'sha256';
	      if (typeof string === 'string') string = new Buffer(string);
	      return cryptoLib.createHmac(fn, key).update(string).digest(digest);
	    },

	    md5: function md5(data, digest, callback) {
	      return util.crypto.hash('md5', data, digest, callback);
	    },

	    sha256: function sha256(data, digest, callback) {
	      return util.crypto.hash('sha256', data, digest, callback);
	    },

	    hash: function(algorithm, data, digest, callback) {
	      var hash = util.crypto.createHash(algorithm);
	      if (!digest) { digest = 'binary'; }
	      if (digest === 'buffer') { digest = undefined; }
	      if (typeof data === 'string') data = new Buffer(data);
	      var isBuffer = Buffer.isBuffer(data);

	      if (callback && typeof data === 'object' &&
	          typeof data.on === 'function' && !isBuffer) {
	        data.on('data', function(chunk) { hash.update(chunk); });
	        data.on('error', function(err) { callback(err); });
	        data.on('end', function() { callback(null, hash.digest(digest)); });
	      } else if (callback && data.slice === 'function'
	          && !isBuffer && typeof FileReader !== 'undefined') {
	        // this might be a File/Blob
	        var index = 0, size = 1024 * 512;
	        var reader = new FileReader();
	        reader.onerror = function() {
	          callback(new Error('Failed to read data.'));
	        };
	        reader.onload = function() {
	          var buf = new Buffer(new Uint8Array(reader.result));
	          hash.update(buf);
	          index += buf.length;
	          reader._continueReading();
	        };
	        reader._continueReading = function() {
	          if (index >= data.size) {
	            callback(null, hash.digest(digest));
	            return;
	          }

	          var back = index + size;
	          if (back > data.size) back = data.size;
	          reader.readAsArrayBuffer(data.slice(index, back));
	        };

	        reader._continueReading();
	      } else {
	        if (AWS.util.isBrowser() && typeof data === 'object' && !isBuffer) {
	          data = new Buffer(new Uint8Array(data));
	        }
	        var out = hash.update(data).digest(digest);
	        if (callback) callback(null, out);
	        return out;
	      }
	    },

	    toHex: function toHex(data) {
	      var out = [];
	      for (var i = 0; i < data.length; i++) {
	        out.push(('0' + data.charCodeAt(i).toString(16)).substr(-2, 2));
	      }
	      return out.join('');
	    },

	    createHash: function createHash(algorithm) {
	      return cryptoLib.createHash(algorithm);
	    }

	  },

	  /** @!ignore */

	  /* Abort constant */
	  abort: {},

	  each: function each(object, iterFunction) {
	    for (var key in object) {
	      if (object.hasOwnProperty(key)) {
	        var ret = iterFunction.call(this, key, object[key]);
	        if (ret === util.abort) break;
	      }
	    }
	  },

	  arrayEach: function arrayEach(array, iterFunction) {
	    for (var idx in array) {
	      if (array.hasOwnProperty(idx)) {
	        var ret = iterFunction.call(this, array[idx], parseInt(idx, 10));
	        if (ret === util.abort) break;
	      }
	    }
	  },

	  update: function update(obj1, obj2) {
	    util.each(obj2, function iterator(key, item) {
	      obj1[key] = item;
	    });
	    return obj1;
	  },

	  merge: function merge(obj1, obj2) {
	    return util.update(util.copy(obj1), obj2);
	  },

	  copy: function copy(object) {
	    if (object === null || object === undefined) return object;
	    var dupe = {};
	    // jshint forin:false
	    for (var key in object) {
	      dupe[key] = object[key];
	    }
	    return dupe;
	  },

	  isEmpty: function isEmpty(obj) {
	    for (var prop in obj) {
	      if (obj.hasOwnProperty(prop)) {
	        return false;
	      }
	    }
	    return true;
	  },

	  isType: function isType(obj, type) {
	    // handle cross-"frame" objects
	    if (typeof type === 'function') type = util.typeName(type);
	    return Object.prototype.toString.call(obj) === '[object ' + type + ']';
	  },

	  typeName: function typeName(type) {
	    if (type.hasOwnProperty('name')) return type.name;
	    var str = type.toString();
	    var match = str.match(/^\s*function (.+)\(/);
	    return match ? match[1] : str;
	  },

	  error: function error(err, options) {
	    var originalError = null;
	    if (typeof err.message === 'string' && err.message !== '') {
	      if (typeof options === 'string' || (options && options.message)) {
	        originalError = util.copy(err);
	        originalError.message = err.message;
	      }
	    }
	    err.message = err.message || null;

	    if (typeof options === 'string') {
	      err.message = options;
	    } else {
	      util.update(err, options);
	    }

	    if (typeof Object.defineProperty === 'function') {
	      Object.defineProperty(err, 'name', {writable: true, enumerable: false});
	      Object.defineProperty(err, 'message', {enumerable: true});
	    }

	    err.name = err.name || err.code || 'Error';
	    err.time = new Date();

	    if (originalError) err.originalError = originalError;

	    return err;
	  },

	  /**
	   * @api private
	   */
	  inherit: function inherit(klass, features) {
	    var newObject = null;
	    if (features === undefined) {
	      features = klass;
	      klass = Object;
	      newObject = {};
	    } else {
	      var ctor = function ConstructorWrapper() {};
	      ctor.prototype = klass.prototype;
	      newObject = new ctor();
	    }

	    // constructor not supplied, create pass-through ctor
	    if (features.constructor === Object) {
	      features.constructor = function() {
	        if (klass !== Object) {
	          return klass.apply(this, arguments);
	        }
	      };
	    }

	    features.constructor.prototype = newObject;
	    util.update(features.constructor.prototype, features);
	    features.constructor.__super__ = klass;
	    return features.constructor;
	  },

	  /**
	   * @api private
	   */
	  mixin: function mixin() {
	    var klass = arguments[0];
	    for (var i = 1; i < arguments.length; i++) {
	      // jshint forin:false
	      for (var prop in arguments[i].prototype) {
	        var fn = arguments[i].prototype[prop];
	        if (prop !== 'constructor') {
	          klass.prototype[prop] = fn;
	        }
	      }
	    }
	    return klass;
	  },

	  /**
	   * @api private
	   */
	  hideProperties: function hideProperties(obj, props) {
	    if (typeof Object.defineProperty !== 'function') return;

	    util.arrayEach(props, function (key) {
	      Object.defineProperty(obj, key, {
	        enumerable: false, writable: true, configurable: true });
	    });
	  },

	  /**
	   * @api private
	   */
	  property: function property(obj, name, value, enumerable, isValue) {
	    var opts = {
	      configurable: true,
	      enumerable: enumerable !== undefined ? enumerable : true
	    };
	    if (typeof value === 'function' && !isValue) {
	      opts.get = value;
	    }
	    else {
	      opts.value = value; opts.writable = true;
	    }

	    Object.defineProperty(obj, name, opts);
	  },

	  /**
	   * @api private
	   */
	  memoizedProperty: function memoizedProperty(obj, name, get, enumerable) {
	    var cachedValue = null;

	    // build enumerable attribute for each value with lazy accessor.
	    util.property(obj, name, function() {
	      if (cachedValue === null) {
	        cachedValue = get();
	      }
	      return cachedValue;
	    }, enumerable);
	  }
	};

	module.exports = util;

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)))

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var rng = __webpack_require__(15)

	function error () {
	  var m = [].slice.call(arguments).join(' ')
	  throw new Error([
	    m,
	    'we accept pull requests',
	    'http://github.com/dominictarr/crypto-browserify'
	    ].join('\n'))
	}

	exports.createHash = __webpack_require__(17)

	exports.createHmac = __webpack_require__(29)

	exports.randomBytes = function(size, callback) {
	  if (callback && callback.call) {
	    try {
	      callback.call(this, undefined, new Buffer(rng(size)))
	    } catch (err) { callback(err) }
	  } else {
	    return new Buffer(rng(size))
	  }
	}

	function each(a, f) {
	  for(var i in a)
	    f(a[i], i)
	}

	exports.getHashes = function () {
	  return ['sha1', 'sha256', 'sha512', 'md5', 'rmd160']
	}

	var p = __webpack_require__(30)(exports)
	exports.pbkdf2 = p.pbkdf2
	exports.pbkdf2Sync = p.pbkdf2Sync


	// the least I can do is make error messages for the rest of the node.js/crypto api.
	each(['createCredentials'
	, 'createCipher'
	, 'createCipheriv'
	, 'createDecipher'
	, 'createDecipheriv'
	, 'createSign'
	, 'createVerify'
	, 'createDiffieHellman'
	], function (name) {
	  exports[name] = function () {
	    error('sorry,', name, 'is not implemented yet')
	  }
	})

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(11).Buffer))

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer, global) {/*!
	 * The buffer module from node.js, for the browser.
	 *
	 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
	 * @license  MIT
	 */
	/* eslint-disable no-proto */

	var base64 = __webpack_require__(12)
	var ieee754 = __webpack_require__(13)
	var isArray = __webpack_require__(14)

	exports.Buffer = Buffer
	exports.SlowBuffer = SlowBuffer
	exports.INSPECT_MAX_BYTES = 50
	Buffer.poolSize = 8192 // not used by this implementation

	var rootParent = {}

	/**
	 * If `Buffer.TYPED_ARRAY_SUPPORT`:
	 *   === true    Use Uint8Array implementation (fastest)
	 *   === false   Use Object implementation (most compatible, even IE6)
	 *
	 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
	 * Opera 11.6+, iOS 4.2+.
	 *
	 * Due to various browser bugs, sometimes the Object implementation will be used even
	 * when the browser supports typed arrays.
	 *
	 * Note:
	 *
	 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
	 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
	 *
	 *   - Safari 5-7 lacks support for changing the `Object.prototype.constructor` property
	 *     on objects.
	 *
	 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
	 *
	 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
	 *     incorrect length in some situations.

	 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
	 * get the Object implementation, which is slower but behaves correctly.
	 */
	Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
	  ? global.TYPED_ARRAY_SUPPORT
	  : typedArraySupport()

	function typedArraySupport () {
	  function Bar () {}
	  try {
	    var arr = new Uint8Array(1)
	    arr.foo = function () { return 42 }
	    arr.constructor = Bar
	    return arr.foo() === 42 && // typed array instances can be augmented
	        arr.constructor === Bar && // constructor can be set
	        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
	        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
	  } catch (e) {
	    return false
	  }
	}

	function kMaxLength () {
	  return Buffer.TYPED_ARRAY_SUPPORT
	    ? 0x7fffffff
	    : 0x3fffffff
	}

	/**
	 * Class: Buffer
	 * =============
	 *
	 * The Buffer constructor returns instances of `Uint8Array` that are augmented
	 * with function properties for all the node `Buffer` API functions. We use
	 * `Uint8Array` so that square bracket notation works as expected -- it returns
	 * a single octet.
	 *
	 * By augmenting the instances, we can avoid modifying the `Uint8Array`
	 * prototype.
	 */
	function Buffer (arg) {
	  if (!(this instanceof Buffer)) {
	    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
	    if (arguments.length > 1) return new Buffer(arg, arguments[1])
	    return new Buffer(arg)
	  }

	  this.length = 0
	  this.parent = undefined

	  // Common case.
	  if (typeof arg === 'number') {
	    return fromNumber(this, arg)
	  }

	  // Slightly less common case.
	  if (typeof arg === 'string') {
	    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8')
	  }

	  // Unusual.
	  return fromObject(this, arg)
	}

	function fromNumber (that, length) {
	  that = allocate(that, length < 0 ? 0 : checked(length) | 0)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) {
	    for (var i = 0; i < length; i++) {
	      that[i] = 0
	    }
	  }
	  return that
	}

	function fromString (that, string, encoding) {
	  if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8'

	  // Assumption: byteLength() return value is always < kMaxLength.
	  var length = byteLength(string, encoding) | 0
	  that = allocate(that, length)

	  that.write(string, encoding)
	  return that
	}

	function fromObject (that, object) {
	  if (Buffer.isBuffer(object)) return fromBuffer(that, object)

	  if (isArray(object)) return fromArray(that, object)

	  if (object == null) {
	    throw new TypeError('must start with number, buffer, array or string')
	  }

	  if (typeof ArrayBuffer !== 'undefined') {
	    if (object.buffer instanceof ArrayBuffer) {
	      return fromTypedArray(that, object)
	    }
	    if (object instanceof ArrayBuffer) {
	      return fromArrayBuffer(that, object)
	    }
	  }

	  if (object.length) return fromArrayLike(that, object)

	  return fromJsonObject(that, object)
	}

	function fromBuffer (that, buffer) {
	  var length = checked(buffer.length) | 0
	  that = allocate(that, length)
	  buffer.copy(that, 0, 0, length)
	  return that
	}

	function fromArray (that, array) {
	  var length = checked(array.length) | 0
	  that = allocate(that, length)
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}

	// Duplicate of fromArray() to keep fromArray() monomorphic.
	function fromTypedArray (that, array) {
	  var length = checked(array.length) | 0
	  that = allocate(that, length)
	  // Truncating the elements is probably not what people expect from typed
	  // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
	  // of the old Buffer constructor.
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}

	function fromArrayBuffer (that, array) {
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    array.byteLength
	    that = Buffer._augment(new Uint8Array(array))
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    that = fromTypedArray(that, new Uint8Array(array))
	  }
	  return that
	}

	function fromArrayLike (that, array) {
	  var length = checked(array.length) | 0
	  that = allocate(that, length)
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}

	// Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
	// Returns a zero-length buffer for inputs that don't conform to the spec.
	function fromJsonObject (that, object) {
	  var array
	  var length = 0

	  if (object.type === 'Buffer' && isArray(object.data)) {
	    array = object.data
	    length = checked(array.length) | 0
	  }
	  that = allocate(that, length)

	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}

	if (Buffer.TYPED_ARRAY_SUPPORT) {
	  Buffer.prototype.__proto__ = Uint8Array.prototype
	  Buffer.__proto__ = Uint8Array
	}

	function allocate (that, length) {
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    that = Buffer._augment(new Uint8Array(length))
	    that.__proto__ = Buffer.prototype
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    that.length = length
	    that._isBuffer = true
	  }

	  var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1
	  if (fromPool) that.parent = rootParent

	  return that
	}

	function checked (length) {
	  // Note: cannot use `length < kMaxLength` here because that fails when
	  // length is NaN (which is otherwise coerced to zero.)
	  if (length >= kMaxLength()) {
	    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
	                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
	  }
	  return length | 0
	}

	function SlowBuffer (subject, encoding) {
	  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)

	  var buf = new Buffer(subject, encoding)
	  delete buf.parent
	  return buf
	}

	Buffer.isBuffer = function isBuffer (b) {
	  return !!(b != null && b._isBuffer)
	}

	Buffer.compare = function compare (a, b) {
	  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
	    throw new TypeError('Arguments must be Buffers')
	  }

	  if (a === b) return 0

	  var x = a.length
	  var y = b.length

	  var i = 0
	  var len = Math.min(x, y)
	  while (i < len) {
	    if (a[i] !== b[i]) break

	    ++i
	  }

	  if (i !== len) {
	    x = a[i]
	    y = b[i]
	  }

	  if (x < y) return -1
	  if (y < x) return 1
	  return 0
	}

	Buffer.isEncoding = function isEncoding (encoding) {
	  switch (String(encoding).toLowerCase()) {
	    case 'hex':
	    case 'utf8':
	    case 'utf-8':
	    case 'ascii':
	    case 'binary':
	    case 'base64':
	    case 'raw':
	    case 'ucs2':
	    case 'ucs-2':
	    case 'utf16le':
	    case 'utf-16le':
	      return true
	    default:
	      return false
	  }
	}

	Buffer.concat = function concat (list, length) {
	  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')

	  if (list.length === 0) {
	    return new Buffer(0)
	  }

	  var i
	  if (length === undefined) {
	    length = 0
	    for (i = 0; i < list.length; i++) {
	      length += list[i].length
	    }
	  }

	  var buf = new Buffer(length)
	  var pos = 0
	  for (i = 0; i < list.length; i++) {
	    var item = list[i]
	    item.copy(buf, pos)
	    pos += item.length
	  }
	  return buf
	}

	function byteLength (string, encoding) {
	  if (typeof string !== 'string') string = '' + string

	  var len = string.length
	  if (len === 0) return 0

	  // Use a for loop to avoid recursion
	  var loweredCase = false
	  for (;;) {
	    switch (encoding) {
	      case 'ascii':
	      case 'binary':
	      // Deprecated
	      case 'raw':
	      case 'raws':
	        return len
	      case 'utf8':
	      case 'utf-8':
	        return utf8ToBytes(string).length
	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return len * 2
	      case 'hex':
	        return len >>> 1
	      case 'base64':
	        return base64ToBytes(string).length
	      default:
	        if (loweredCase) return utf8ToBytes(string).length // assume utf8
	        encoding = ('' + encoding).toLowerCase()
	        loweredCase = true
	    }
	  }
	}
	Buffer.byteLength = byteLength

	// pre-set for values that may exist in the future
	Buffer.prototype.length = undefined
	Buffer.prototype.parent = undefined

	function slowToString (encoding, start, end) {
	  var loweredCase = false

	  start = start | 0
	  end = end === undefined || end === Infinity ? this.length : end | 0

	  if (!encoding) encoding = 'utf8'
	  if (start < 0) start = 0
	  if (end > this.length) end = this.length
	  if (end <= start) return ''

	  while (true) {
	    switch (encoding) {
	      case 'hex':
	        return hexSlice(this, start, end)

	      case 'utf8':
	      case 'utf-8':
	        return utf8Slice(this, start, end)

	      case 'ascii':
	        return asciiSlice(this, start, end)

	      case 'binary':
	        return binarySlice(this, start, end)

	      case 'base64':
	        return base64Slice(this, start, end)

	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return utf16leSlice(this, start, end)

	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = (encoding + '').toLowerCase()
	        loweredCase = true
	    }
	  }
	}

	Buffer.prototype.toString = function toString () {
	  var length = this.length | 0
	  if (length === 0) return ''
	  if (arguments.length === 0) return utf8Slice(this, 0, length)
	  return slowToString.apply(this, arguments)
	}

	Buffer.prototype.equals = function equals (b) {
	  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
	  if (this === b) return true
	  return Buffer.compare(this, b) === 0
	}

	Buffer.prototype.inspect = function inspect () {
	  var str = ''
	  var max = exports.INSPECT_MAX_BYTES
	  if (this.length > 0) {
	    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
	    if (this.length > max) str += ' ... '
	  }
	  return '<Buffer ' + str + '>'
	}

	Buffer.prototype.compare = function compare (b) {
	  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
	  if (this === b) return 0
	  return Buffer.compare(this, b)
	}

	Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
	  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
	  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
	  byteOffset >>= 0

	  if (this.length === 0) return -1
	  if (byteOffset >= this.length) return -1

	  // Negative offsets start from the end of the buffer
	  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

	  if (typeof val === 'string') {
	    if (val.length === 0) return -1 // special case: looking for empty string always fails
	    return String.prototype.indexOf.call(this, val, byteOffset)
	  }
	  if (Buffer.isBuffer(val)) {
	    return arrayIndexOf(this, val, byteOffset)
	  }
	  if (typeof val === 'number') {
	    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
	      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
	    }
	    return arrayIndexOf(this, [ val ], byteOffset)
	  }

	  function arrayIndexOf (arr, val, byteOffset) {
	    var foundIndex = -1
	    for (var i = 0; byteOffset + i < arr.length; i++) {
	      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
	        if (foundIndex === -1) foundIndex = i
	        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
	      } else {
	        foundIndex = -1
	      }
	    }
	    return -1
	  }

	  throw new TypeError('val must be string, number or Buffer')
	}

	// `get` is deprecated
	Buffer.prototype.get = function get (offset) {
	  console.log('.get() is deprecated. Access using array indexes instead.')
	  return this.readUInt8(offset)
	}

	// `set` is deprecated
	Buffer.prototype.set = function set (v, offset) {
	  console.log('.set() is deprecated. Access using array indexes instead.')
	  return this.writeUInt8(v, offset)
	}

	function hexWrite (buf, string, offset, length) {
	  offset = Number(offset) || 0
	  var remaining = buf.length - offset
	  if (!length) {
	    length = remaining
	  } else {
	    length = Number(length)
	    if (length > remaining) {
	      length = remaining
	    }
	  }

	  // must be an even number of digits
	  var strLen = string.length
	  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

	  if (length > strLen / 2) {
	    length = strLen / 2
	  }
	  for (var i = 0; i < length; i++) {
	    var parsed = parseInt(string.substr(i * 2, 2), 16)
	    if (isNaN(parsed)) throw new Error('Invalid hex string')
	    buf[offset + i] = parsed
	  }
	  return i
	}

	function utf8Write (buf, string, offset, length) {
	  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
	}

	function asciiWrite (buf, string, offset, length) {
	  return blitBuffer(asciiToBytes(string), buf, offset, length)
	}

	function binaryWrite (buf, string, offset, length) {
	  return asciiWrite(buf, string, offset, length)
	}

	function base64Write (buf, string, offset, length) {
	  return blitBuffer(base64ToBytes(string), buf, offset, length)
	}

	function ucs2Write (buf, string, offset, length) {
	  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
	}

	Buffer.prototype.write = function write (string, offset, length, encoding) {
	  // Buffer#write(string)
	  if (offset === undefined) {
	    encoding = 'utf8'
	    length = this.length
	    offset = 0
	  // Buffer#write(string, encoding)
	  } else if (length === undefined && typeof offset === 'string') {
	    encoding = offset
	    length = this.length
	    offset = 0
	  // Buffer#write(string, offset[, length][, encoding])
	  } else if (isFinite(offset)) {
	    offset = offset | 0
	    if (isFinite(length)) {
	      length = length | 0
	      if (encoding === undefined) encoding = 'utf8'
	    } else {
	      encoding = length
	      length = undefined
	    }
	  // legacy write(string, encoding, offset, length) - remove in v0.13
	  } else {
	    var swap = encoding
	    encoding = offset
	    offset = length | 0
	    length = swap
	  }

	  var remaining = this.length - offset
	  if (length === undefined || length > remaining) length = remaining

	  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
	    throw new RangeError('attempt to write outside buffer bounds')
	  }

	  if (!encoding) encoding = 'utf8'

	  var loweredCase = false
	  for (;;) {
	    switch (encoding) {
	      case 'hex':
	        return hexWrite(this, string, offset, length)

	      case 'utf8':
	      case 'utf-8':
	        return utf8Write(this, string, offset, length)

	      case 'ascii':
	        return asciiWrite(this, string, offset, length)

	      case 'binary':
	        return binaryWrite(this, string, offset, length)

	      case 'base64':
	        // Warning: maxLength not taken into account in base64Write
	        return base64Write(this, string, offset, length)

	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return ucs2Write(this, string, offset, length)

	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = ('' + encoding).toLowerCase()
	        loweredCase = true
	    }
	  }
	}

	Buffer.prototype.toJSON = function toJSON () {
	  return {
	    type: 'Buffer',
	    data: Array.prototype.slice.call(this._arr || this, 0)
	  }
	}

	function base64Slice (buf, start, end) {
	  if (start === 0 && end === buf.length) {
	    return base64.fromByteArray(buf)
	  } else {
	    return base64.fromByteArray(buf.slice(start, end))
	  }
	}

	function utf8Slice (buf, start, end) {
	  end = Math.min(buf.length, end)
	  var res = []

	  var i = start
	  while (i < end) {
	    var firstByte = buf[i]
	    var codePoint = null
	    var bytesPerSequence = (firstByte > 0xEF) ? 4
	      : (firstByte > 0xDF) ? 3
	      : (firstByte > 0xBF) ? 2
	      : 1

	    if (i + bytesPerSequence <= end) {
	      var secondByte, thirdByte, fourthByte, tempCodePoint

	      switch (bytesPerSequence) {
	        case 1:
	          if (firstByte < 0x80) {
	            codePoint = firstByte
	          }
	          break
	        case 2:
	          secondByte = buf[i + 1]
	          if ((secondByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
	            if (tempCodePoint > 0x7F) {
	              codePoint = tempCodePoint
	            }
	          }
	          break
	        case 3:
	          secondByte = buf[i + 1]
	          thirdByte = buf[i + 2]
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
	            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
	              codePoint = tempCodePoint
	            }
	          }
	          break
	        case 4:
	          secondByte = buf[i + 1]
	          thirdByte = buf[i + 2]
	          fourthByte = buf[i + 3]
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
	            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
	              codePoint = tempCodePoint
	            }
	          }
	      }
	    }

	    if (codePoint === null) {
	      // we did not generate a valid codePoint so insert a
	      // replacement char (U+FFFD) and advance only 1 byte
	      codePoint = 0xFFFD
	      bytesPerSequence = 1
	    } else if (codePoint > 0xFFFF) {
	      // encode to utf16 (surrogate pair dance)
	      codePoint -= 0x10000
	      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
	      codePoint = 0xDC00 | codePoint & 0x3FF
	    }

	    res.push(codePoint)
	    i += bytesPerSequence
	  }

	  return decodeCodePointsArray(res)
	}

	// Based on http://stackoverflow.com/a/22747272/680742, the browser with
	// the lowest limit is Chrome, with 0x10000 args.
	// We go 1 magnitude less, for safety
	var MAX_ARGUMENTS_LENGTH = 0x1000

	function decodeCodePointsArray (codePoints) {
	  var len = codePoints.length
	  if (len <= MAX_ARGUMENTS_LENGTH) {
	    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
	  }

	  // Decode in chunks to avoid "call stack size exceeded".
	  var res = ''
	  var i = 0
	  while (i < len) {
	    res += String.fromCharCode.apply(
	      String,
	      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
	    )
	  }
	  return res
	}

	function asciiSlice (buf, start, end) {
	  var ret = ''
	  end = Math.min(buf.length, end)

	  for (var i = start; i < end; i++) {
	    ret += String.fromCharCode(buf[i] & 0x7F)
	  }
	  return ret
	}

	function binarySlice (buf, start, end) {
	  var ret = ''
	  end = Math.min(buf.length, end)

	  for (var i = start; i < end; i++) {
	    ret += String.fromCharCode(buf[i])
	  }
	  return ret
	}

	function hexSlice (buf, start, end) {
	  var len = buf.length

	  if (!start || start < 0) start = 0
	  if (!end || end < 0 || end > len) end = len

	  var out = ''
	  for (var i = start; i < end; i++) {
	    out += toHex(buf[i])
	  }
	  return out
	}

	function utf16leSlice (buf, start, end) {
	  var bytes = buf.slice(start, end)
	  var res = ''
	  for (var i = 0; i < bytes.length; i += 2) {
	    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
	  }
	  return res
	}

	Buffer.prototype.slice = function slice (start, end) {
	  var len = this.length
	  start = ~~start
	  end = end === undefined ? len : ~~end

	  if (start < 0) {
	    start += len
	    if (start < 0) start = 0
	  } else if (start > len) {
	    start = len
	  }

	  if (end < 0) {
	    end += len
	    if (end < 0) end = 0
	  } else if (end > len) {
	    end = len
	  }

	  if (end < start) end = start

	  var newBuf
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    newBuf = Buffer._augment(this.subarray(start, end))
	  } else {
	    var sliceLen = end - start
	    newBuf = new Buffer(sliceLen, undefined)
	    for (var i = 0; i < sliceLen; i++) {
	      newBuf[i] = this[i + start]
	    }
	  }

	  if (newBuf.length) newBuf.parent = this.parent || this

	  return newBuf
	}

	/*
	 * Need to make sure that buffer isn't trying to write out of bounds.
	 */
	function checkOffset (offset, ext, length) {
	  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
	  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
	}

	Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)

	  var val = this[offset]
	  var mul = 1
	  var i = 0
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul
	  }

	  return val
	}

	Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) {
	    checkOffset(offset, byteLength, this.length)
	  }

	  var val = this[offset + --byteLength]
	  var mul = 1
	  while (byteLength > 0 && (mul *= 0x100)) {
	    val += this[offset + --byteLength] * mul
	  }

	  return val
	}

	Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length)
	  return this[offset]
	}

	Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  return this[offset] | (this[offset + 1] << 8)
	}

	Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  return (this[offset] << 8) | this[offset + 1]
	}

	Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return ((this[offset]) |
	      (this[offset + 1] << 8) |
	      (this[offset + 2] << 16)) +
	      (this[offset + 3] * 0x1000000)
	}

	Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return (this[offset] * 0x1000000) +
	    ((this[offset + 1] << 16) |
	    (this[offset + 2] << 8) |
	    this[offset + 3])
	}

	Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)

	  var val = this[offset]
	  var mul = 1
	  var i = 0
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul
	  }
	  mul *= 0x80

	  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

	  return val
	}

	Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)

	  var i = byteLength
	  var mul = 1
	  var val = this[offset + --i]
	  while (i > 0 && (mul *= 0x100)) {
	    val += this[offset + --i] * mul
	  }
	  mul *= 0x80

	  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

	  return val
	}

	Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length)
	  if (!(this[offset] & 0x80)) return (this[offset])
	  return ((0xff - this[offset] + 1) * -1)
	}

	Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  var val = this[offset] | (this[offset + 1] << 8)
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	}

	Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  var val = this[offset + 1] | (this[offset] << 8)
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	}

	Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return (this[offset]) |
	    (this[offset + 1] << 8) |
	    (this[offset + 2] << 16) |
	    (this[offset + 3] << 24)
	}

	Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return (this[offset] << 24) |
	    (this[offset + 1] << 16) |
	    (this[offset + 2] << 8) |
	    (this[offset + 3])
	}

	Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)
	  return ieee754.read(this, offset, true, 23, 4)
	}

	Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)
	  return ieee754.read(this, offset, false, 23, 4)
	}

	Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length)
	  return ieee754.read(this, offset, true, 52, 8)
	}

	Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length)
	  return ieee754.read(this, offset, false, 52, 8)
	}

	function checkInt (buf, value, offset, ext, max, min) {
	  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
	  if (value > max || value < min) throw new RangeError('value is out of bounds')
	  if (offset + ext > buf.length) throw new RangeError('index out of range')
	}

	Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

	  var mul = 1
	  var i = 0
	  this[offset] = value & 0xFF
	  while (++i < byteLength && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

	  var i = byteLength - 1
	  var mul = 1
	  this[offset + i] = value & 0xFF
	  while (--i >= 0 && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
	  this[offset] = (value & 0xff)
	  return offset + 1
	}

	function objectWriteUInt16 (buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffff + value + 1
	  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
	    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
	      (littleEndian ? i : 1 - i) * 8
	  }
	}

	Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	  } else {
	    objectWriteUInt16(this, value, offset, true)
	  }
	  return offset + 2
	}

	Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8)
	    this[offset + 1] = (value & 0xff)
	  } else {
	    objectWriteUInt16(this, value, offset, false)
	  }
	  return offset + 2
	}

	function objectWriteUInt32 (buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffffffff + value + 1
	  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
	    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
	  }
	}

	Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset + 3] = (value >>> 24)
	    this[offset + 2] = (value >>> 16)
	    this[offset + 1] = (value >>> 8)
	    this[offset] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, true)
	  }
	  return offset + 4
	}

	Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24)
	    this[offset + 1] = (value >>> 16)
	    this[offset + 2] = (value >>> 8)
	    this[offset + 3] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, false)
	  }
	  return offset + 4
	}

	Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1)

	    checkInt(this, value, offset, byteLength, limit - 1, -limit)
	  }

	  var i = 0
	  var mul = 1
	  var sub = value < 0 ? 1 : 0
	  this[offset] = value & 0xFF
	  while (++i < byteLength && (mul *= 0x100)) {
	    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1)

	    checkInt(this, value, offset, byteLength, limit - 1, -limit)
	  }

	  var i = byteLength - 1
	  var mul = 1
	  var sub = value < 0 ? 1 : 0
	  this[offset + i] = value & 0xFF
	  while (--i >= 0 && (mul *= 0x100)) {
	    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
	  if (value < 0) value = 0xff + value + 1
	  this[offset] = (value & 0xff)
	  return offset + 1
	}

	Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	  } else {
	    objectWriteUInt16(this, value, offset, true)
	  }
	  return offset + 2
	}

	Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8)
	    this[offset + 1] = (value & 0xff)
	  } else {
	    objectWriteUInt16(this, value, offset, false)
	  }
	  return offset + 2
	}

	Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	    this[offset + 2] = (value >>> 16)
	    this[offset + 3] = (value >>> 24)
	  } else {
	    objectWriteUInt32(this, value, offset, true)
	  }
	  return offset + 4
	}

	Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
	  if (value < 0) value = 0xffffffff + value + 1
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24)
	    this[offset + 1] = (value >>> 16)
	    this[offset + 2] = (value >>> 8)
	    this[offset + 3] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, false)
	  }
	  return offset + 4
	}

	function checkIEEE754 (buf, value, offset, ext, max, min) {
	  if (value > max || value < min) throw new RangeError('value is out of bounds')
	  if (offset + ext > buf.length) throw new RangeError('index out of range')
	  if (offset < 0) throw new RangeError('index out of range')
	}

	function writeFloat (buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
	  }
	  ieee754.write(buf, value, offset, littleEndian, 23, 4)
	  return offset + 4
	}

	Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, true, noAssert)
	}

	Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, false, noAssert)
	}

	function writeDouble (buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
	  }
	  ieee754.write(buf, value, offset, littleEndian, 52, 8)
	  return offset + 8
	}

	Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, true, noAssert)
	}

	Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, false, noAssert)
	}

	// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
	Buffer.prototype.copy = function copy (target, targetStart, start, end) {
	  if (!start) start = 0
	  if (!end && end !== 0) end = this.length
	  if (targetStart >= target.length) targetStart = target.length
	  if (!targetStart) targetStart = 0
	  if (end > 0 && end < start) end = start

	  // Copy 0 bytes; we're done
	  if (end === start) return 0
	  if (target.length === 0 || this.length === 0) return 0

	  // Fatal error conditions
	  if (targetStart < 0) {
	    throw new RangeError('targetStart out of bounds')
	  }
	  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
	  if (end < 0) throw new RangeError('sourceEnd out of bounds')

	  // Are we oob?
	  if (end > this.length) end = this.length
	  if (target.length - targetStart < end - start) {
	    end = target.length - targetStart + start
	  }

	  var len = end - start
	  var i

	  if (this === target && start < targetStart && targetStart < end) {
	    // descending copy from end
	    for (i = len - 1; i >= 0; i--) {
	      target[i + targetStart] = this[i + start]
	    }
	  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
	    // ascending copy from start
	    for (i = 0; i < len; i++) {
	      target[i + targetStart] = this[i + start]
	    }
	  } else {
	    target._set(this.subarray(start, start + len), targetStart)
	  }

	  return len
	}

	// fill(value, start=0, end=buffer.length)
	Buffer.prototype.fill = function fill (value, start, end) {
	  if (!value) value = 0
	  if (!start) start = 0
	  if (!end) end = this.length

	  if (end < start) throw new RangeError('end < start')

	  // Fill 0 bytes; we're done
	  if (end === start) return
	  if (this.length === 0) return

	  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
	  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

	  var i
	  if (typeof value === 'number') {
	    for (i = start; i < end; i++) {
	      this[i] = value
	    }
	  } else {
	    var bytes = utf8ToBytes(value.toString())
	    var len = bytes.length
	    for (i = start; i < end; i++) {
	      this[i] = bytes[i % len]
	    }
	  }

	  return this
	}

	/**
	 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
	 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
	 */
	Buffer.prototype.toArrayBuffer = function toArrayBuffer () {
	  if (typeof Uint8Array !== 'undefined') {
	    if (Buffer.TYPED_ARRAY_SUPPORT) {
	      return (new Buffer(this)).buffer
	    } else {
	      var buf = new Uint8Array(this.length)
	      for (var i = 0, len = buf.length; i < len; i += 1) {
	        buf[i] = this[i]
	      }
	      return buf.buffer
	    }
	  } else {
	    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
	  }
	}

	// HELPER FUNCTIONS
	// ================

	var BP = Buffer.prototype

	/**
	 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
	 */
	Buffer._augment = function _augment (arr) {
	  arr.constructor = Buffer
	  arr._isBuffer = true

	  // save reference to original Uint8Array set method before overwriting
	  arr._set = arr.set

	  // deprecated
	  arr.get = BP.get
	  arr.set = BP.set

	  arr.write = BP.write
	  arr.toString = BP.toString
	  arr.toLocaleString = BP.toString
	  arr.toJSON = BP.toJSON
	  arr.equals = BP.equals
	  arr.compare = BP.compare
	  arr.indexOf = BP.indexOf
	  arr.copy = BP.copy
	  arr.slice = BP.slice
	  arr.readUIntLE = BP.readUIntLE
	  arr.readUIntBE = BP.readUIntBE
	  arr.readUInt8 = BP.readUInt8
	  arr.readUInt16LE = BP.readUInt16LE
	  arr.readUInt16BE = BP.readUInt16BE
	  arr.readUInt32LE = BP.readUInt32LE
	  arr.readUInt32BE = BP.readUInt32BE
	  arr.readIntLE = BP.readIntLE
	  arr.readIntBE = BP.readIntBE
	  arr.readInt8 = BP.readInt8
	  arr.readInt16LE = BP.readInt16LE
	  arr.readInt16BE = BP.readInt16BE
	  arr.readInt32LE = BP.readInt32LE
	  arr.readInt32BE = BP.readInt32BE
	  arr.readFloatLE = BP.readFloatLE
	  arr.readFloatBE = BP.readFloatBE
	  arr.readDoubleLE = BP.readDoubleLE
	  arr.readDoubleBE = BP.readDoubleBE
	  arr.writeUInt8 = BP.writeUInt8
	  arr.writeUIntLE = BP.writeUIntLE
	  arr.writeUIntBE = BP.writeUIntBE
	  arr.writeUInt16LE = BP.writeUInt16LE
	  arr.writeUInt16BE = BP.writeUInt16BE
	  arr.writeUInt32LE = BP.writeUInt32LE
	  arr.writeUInt32BE = BP.writeUInt32BE
	  arr.writeIntLE = BP.writeIntLE
	  arr.writeIntBE = BP.writeIntBE
	  arr.writeInt8 = BP.writeInt8
	  arr.writeInt16LE = BP.writeInt16LE
	  arr.writeInt16BE = BP.writeInt16BE
	  arr.writeInt32LE = BP.writeInt32LE
	  arr.writeInt32BE = BP.writeInt32BE
	  arr.writeFloatLE = BP.writeFloatLE
	  arr.writeFloatBE = BP.writeFloatBE
	  arr.writeDoubleLE = BP.writeDoubleLE
	  arr.writeDoubleBE = BP.writeDoubleBE
	  arr.fill = BP.fill
	  arr.inspect = BP.inspect
	  arr.toArrayBuffer = BP.toArrayBuffer

	  return arr
	}

	var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

	function base64clean (str) {
	  // Node strips out invalid characters like \n and \t from the string, base64-js does not
	  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
	  // Node converts strings with length < 2 to ''
	  if (str.length < 2) return ''
	  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
	  while (str.length % 4 !== 0) {
	    str = str + '='
	  }
	  return str
	}

	function stringtrim (str) {
	  if (str.trim) return str.trim()
	  return str.replace(/^\s+|\s+$/g, '')
	}

	function toHex (n) {
	  if (n < 16) return '0' + n.toString(16)
	  return n.toString(16)
	}

	function utf8ToBytes (string, units) {
	  units = units || Infinity
	  var codePoint
	  var length = string.length
	  var leadSurrogate = null
	  var bytes = []

	  for (var i = 0; i < length; i++) {
	    codePoint = string.charCodeAt(i)

	    // is surrogate component
	    if (codePoint > 0xD7FF && codePoint < 0xE000) {
	      // last char was a lead
	      if (!leadSurrogate) {
	        // no lead yet
	        if (codePoint > 0xDBFF) {
	          // unexpected trail
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	          continue
	        } else if (i + 1 === length) {
	          // unpaired lead
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	          continue
	        }

	        // valid lead
	        leadSurrogate = codePoint

	        continue
	      }

	      // 2 leads in a row
	      if (codePoint < 0xDC00) {
	        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	        leadSurrogate = codePoint
	        continue
	      }

	      // valid surrogate pair
	      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
	    } else if (leadSurrogate) {
	      // valid bmp char, but last char was a lead
	      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	    }

	    leadSurrogate = null

	    // encode utf8
	    if (codePoint < 0x80) {
	      if ((units -= 1) < 0) break
	      bytes.push(codePoint)
	    } else if (codePoint < 0x800) {
	      if ((units -= 2) < 0) break
	      bytes.push(
	        codePoint >> 0x6 | 0xC0,
	        codePoint & 0x3F | 0x80
	      )
	    } else if (codePoint < 0x10000) {
	      if ((units -= 3) < 0) break
	      bytes.push(
	        codePoint >> 0xC | 0xE0,
	        codePoint >> 0x6 & 0x3F | 0x80,
	        codePoint & 0x3F | 0x80
	      )
	    } else if (codePoint < 0x110000) {
	      if ((units -= 4) < 0) break
	      bytes.push(
	        codePoint >> 0x12 | 0xF0,
	        codePoint >> 0xC & 0x3F | 0x80,
	        codePoint >> 0x6 & 0x3F | 0x80,
	        codePoint & 0x3F | 0x80
	      )
	    } else {
	      throw new Error('Invalid code point')
	    }
	  }

	  return bytes
	}

	function asciiToBytes (str) {
	  var byteArray = []
	  for (var i = 0; i < str.length; i++) {
	    // Node's code seems to be doing this and not & 0x7F..
	    byteArray.push(str.charCodeAt(i) & 0xFF)
	  }
	  return byteArray
	}

	function utf16leToBytes (str, units) {
	  var c, hi, lo
	  var byteArray = []
	  for (var i = 0; i < str.length; i++) {
	    if ((units -= 2) < 0) break

	    c = str.charCodeAt(i)
	    hi = c >> 8
	    lo = c % 256
	    byteArray.push(lo)
	    byteArray.push(hi)
	  }

	  return byteArray
	}

	function base64ToBytes (str) {
	  return base64.toByteArray(base64clean(str))
	}

	function blitBuffer (src, dst, offset, length) {
	  for (var i = 0; i < length; i++) {
	    if ((i + offset >= dst.length) || (i >= src.length)) break
	    dst[i + offset] = src[i]
	  }
	  return i
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(11).Buffer, (function() { return this; }())))

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

	;(function (exports) {
		'use strict';

	  var Arr = (typeof Uint8Array !== 'undefined')
	    ? Uint8Array
	    : Array

		var PLUS   = '+'.charCodeAt(0)
		var SLASH  = '/'.charCodeAt(0)
		var NUMBER = '0'.charCodeAt(0)
		var LOWER  = 'a'.charCodeAt(0)
		var UPPER  = 'A'.charCodeAt(0)
		var PLUS_URL_SAFE = '-'.charCodeAt(0)
		var SLASH_URL_SAFE = '_'.charCodeAt(0)

		function decode (elt) {
			var code = elt.charCodeAt(0)
			if (code === PLUS ||
			    code === PLUS_URL_SAFE)
				return 62 // '+'
			if (code === SLASH ||
			    code === SLASH_URL_SAFE)
				return 63 // '/'
			if (code < NUMBER)
				return -1 //no match
			if (code < NUMBER + 10)
				return code - NUMBER + 26 + 26
			if (code < UPPER + 26)
				return code - UPPER
			if (code < LOWER + 26)
				return code - LOWER + 26
		}

		function b64ToByteArray (b64) {
			var i, j, l, tmp, placeHolders, arr

			if (b64.length % 4 > 0) {
				throw new Error('Invalid string. Length must be a multiple of 4')
			}

			// the number of equal signs (place holders)
			// if there are two placeholders, than the two characters before it
			// represent one byte
			// if there is only one, then the three characters before it represent 2 bytes
			// this is just a cheap hack to not do indexOf twice
			var len = b64.length
			placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

			// base64 is 4/3 + up to two characters of the original data
			arr = new Arr(b64.length * 3 / 4 - placeHolders)

			// if there are placeholders, only get up to the last complete 4 chars
			l = placeHolders > 0 ? b64.length - 4 : b64.length

			var L = 0

			function push (v) {
				arr[L++] = v
			}

			for (i = 0, j = 0; i < l; i += 4, j += 3) {
				tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
				push((tmp & 0xFF0000) >> 16)
				push((tmp & 0xFF00) >> 8)
				push(tmp & 0xFF)
			}

			if (placeHolders === 2) {
				tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
				push(tmp & 0xFF)
			} else if (placeHolders === 1) {
				tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
				push((tmp >> 8) & 0xFF)
				push(tmp & 0xFF)
			}

			return arr
		}

		function uint8ToBase64 (uint8) {
			var i,
				extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
				output = "",
				temp, length

			function encode (num) {
				return lookup.charAt(num)
			}

			function tripletToBase64 (num) {
				return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
			}

			// go through the array every three bytes, we'll deal with trailing stuff later
			for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
				temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
				output += tripletToBase64(temp)
			}

			// pad the end with zeros, but make sure to not forget the extra bytes
			switch (extraBytes) {
				case 1:
					temp = uint8[uint8.length - 1]
					output += encode(temp >> 2)
					output += encode((temp << 4) & 0x3F)
					output += '=='
					break
				case 2:
					temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
					output += encode(temp >> 10)
					output += encode((temp >> 4) & 0x3F)
					output += encode((temp << 2) & 0x3F)
					output += '='
					break
			}

			return output
		}

		exports.toByteArray = b64ToByteArray
		exports.fromByteArray = uint8ToBase64
	}( false ? (this.base64js = {}) : exports))


/***/ },
/* 13 */
/***/ function(module, exports) {

	exports.read = function (buffer, offset, isLE, mLen, nBytes) {
	  var e, m
	  var eLen = nBytes * 8 - mLen - 1
	  var eMax = (1 << eLen) - 1
	  var eBias = eMax >> 1
	  var nBits = -7
	  var i = isLE ? (nBytes - 1) : 0
	  var d = isLE ? -1 : 1
	  var s = buffer[offset + i]

	  i += d

	  e = s & ((1 << (-nBits)) - 1)
	  s >>= (-nBits)
	  nBits += eLen
	  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

	  m = e & ((1 << (-nBits)) - 1)
	  e >>= (-nBits)
	  nBits += mLen
	  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

	  if (e === 0) {
	    e = 1 - eBias
	  } else if (e === eMax) {
	    return m ? NaN : ((s ? -1 : 1) * Infinity)
	  } else {
	    m = m + Math.pow(2, mLen)
	    e = e - eBias
	  }
	  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
	}

	exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
	  var e, m, c
	  var eLen = nBytes * 8 - mLen - 1
	  var eMax = (1 << eLen) - 1
	  var eBias = eMax >> 1
	  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
	  var i = isLE ? 0 : (nBytes - 1)
	  var d = isLE ? 1 : -1
	  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

	  value = Math.abs(value)

	  if (isNaN(value) || value === Infinity) {
	    m = isNaN(value) ? 1 : 0
	    e = eMax
	  } else {
	    e = Math.floor(Math.log(value) / Math.LN2)
	    if (value * (c = Math.pow(2, -e)) < 1) {
	      e--
	      c *= 2
	    }
	    if (e + eBias >= 1) {
	      value += rt / c
	    } else {
	      value += rt * Math.pow(2, 1 - eBias)
	    }
	    if (value * c >= 2) {
	      e++
	      c /= 2
	    }

	    if (e + eBias >= eMax) {
	      m = 0
	      e = eMax
	    } else if (e + eBias >= 1) {
	      m = (value * c - 1) * Math.pow(2, mLen)
	      e = e + eBias
	    } else {
	      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
	      e = 0
	    }
	  }

	  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

	  e = (e << mLen) | m
	  eLen += mLen
	  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

	  buffer[offset + i - d] |= s * 128
	}


/***/ },
/* 14 */
/***/ function(module, exports) {

	var toString = {}.toString;

	module.exports = Array.isArray || function (arr) {
	  return toString.call(arr) == '[object Array]';
	};


/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global, Buffer) {(function() {
	  var g = ('undefined' === typeof window ? global : window) || {}
	  _crypto = (
	    g.crypto || g.msCrypto || __webpack_require__(16)
	  )
	  module.exports = function(size) {
	    // Modern Browsers
	    if(_crypto.getRandomValues) {
	      var bytes = new Buffer(size); //in browserify, this is an extended Uint8Array
	      /* This will not work in older browsers.
	       * See https://developer.mozilla.org/en-US/docs/Web/API/window.crypto.getRandomValues
	       */
	    
	      _crypto.getRandomValues(bytes);
	      return bytes;
	    }
	    else if (_crypto.randomBytes) {
	      return _crypto.randomBytes(size)
	    }
	    else
	      throw new Error(
	        'secure random number generation not supported by this browser\n'+
	        'use chrome, FireFox or Internet Explorer 11'
	      )
	  }
	}())

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(11).Buffer))

/***/ },
/* 16 */
/***/ function(module, exports) {

	/* (ignored) */

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var createHash = __webpack_require__(18)

	var md5 = toConstructor(__webpack_require__(26))
	var rmd160 = toConstructor(__webpack_require__(28))

	function toConstructor (fn) {
	  return function () {
	    var buffers = []
	    var m= {
	      update: function (data, enc) {
	        if(!Buffer.isBuffer(data)) data = new Buffer(data, enc)
	        buffers.push(data)
	        return this
	      },
	      digest: function (enc) {
	        var buf = Buffer.concat(buffers)
	        var r = fn(buf)
	        buffers = null
	        return enc ? r.toString(enc) : r
	      }
	    }
	    return m
	  }
	}

	module.exports = function (alg) {
	  if('md5' === alg) return new md5()
	  if('rmd160' === alg) return new rmd160()
	  return createHash(alg)
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(11).Buffer))

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	var exports = module.exports = function (alg) {
	  var Alg = exports[alg]
	  if(!Alg) throw new Error(alg + ' is not supported (we accept pull requests)')
	  return new Alg()
	}

	var Buffer = __webpack_require__(11).Buffer
	var Hash   = __webpack_require__(19)(Buffer)

	exports.sha1 = __webpack_require__(20)(Buffer, Hash)
	exports.sha256 = __webpack_require__(24)(Buffer, Hash)
	exports.sha512 = __webpack_require__(25)(Buffer, Hash)


/***/ },
/* 19 */
/***/ function(module, exports) {

	module.exports = function (Buffer) {

	  //prototype class for hash functions
	  function Hash (blockSize, finalSize) {
	    this._block = new Buffer(blockSize) //new Uint32Array(blockSize/4)
	    this._finalSize = finalSize
	    this._blockSize = blockSize
	    this._len = 0
	    this._s = 0
	  }

	  Hash.prototype.init = function () {
	    this._s = 0
	    this._len = 0
	  }

	  Hash.prototype.update = function (data, enc) {
	    if ("string" === typeof data) {
	      enc = enc || "utf8"
	      data = new Buffer(data, enc)
	    }

	    var l = this._len += data.length
	    var s = this._s = (this._s || 0)
	    var f = 0
	    var buffer = this._block

	    while (s < l) {
	      var t = Math.min(data.length, f + this._blockSize - (s % this._blockSize))
	      var ch = (t - f)

	      for (var i = 0; i < ch; i++) {
	        buffer[(s % this._blockSize) + i] = data[i + f]
	      }

	      s += ch
	      f += ch

	      if ((s % this._blockSize) === 0) {
	        this._update(buffer)
	      }
	    }
	    this._s = s

	    return this
	  }

	  Hash.prototype.digest = function (enc) {
	    // Suppose the length of the message M, in bits, is l
	    var l = this._len * 8

	    // Append the bit 1 to the end of the message
	    this._block[this._len % this._blockSize] = 0x80

	    // and then k zero bits, where k is the smallest non-negative solution to the equation (l + 1 + k) === finalSize mod blockSize
	    this._block.fill(0, this._len % this._blockSize + 1)

	    if (l % (this._blockSize * 8) >= this._finalSize * 8) {
	      this._update(this._block)
	      this._block.fill(0)
	    }

	    // to this append the block which is equal to the number l written in binary
	    // TODO: handle case where l is > Math.pow(2, 29)
	    this._block.writeInt32BE(l, this._blockSize - 4)

	    var hash = this._update(this._block) || this._hash()

	    return enc ? hash.toString(enc) : hash
	  }

	  Hash.prototype._update = function () {
	    throw new Error('_update must be implemented by subclass')
	  }

	  return Hash
	}


/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	/*
	 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
	 * in FIPS PUB 180-1
	 * Version 2.1a Copyright Paul Johnston 2000 - 2002.
	 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
	 * Distributed under the BSD License
	 * See http://pajhome.org.uk/crypt/md5 for details.
	 */

	var inherits = __webpack_require__(21).inherits

	module.exports = function (Buffer, Hash) {

	  var A = 0|0
	  var B = 4|0
	  var C = 8|0
	  var D = 12|0
	  var E = 16|0

	  var W = new (typeof Int32Array === 'undefined' ? Array : Int32Array)(80)

	  var POOL = []

	  function Sha1 () {
	    if(POOL.length)
	      return POOL.pop().init()

	    if(!(this instanceof Sha1)) return new Sha1()
	    this._w = W
	    Hash.call(this, 16*4, 14*4)

	    this._h = null
	    this.init()
	  }

	  inherits(Sha1, Hash)

	  Sha1.prototype.init = function () {
	    this._a = 0x67452301
	    this._b = 0xefcdab89
	    this._c = 0x98badcfe
	    this._d = 0x10325476
	    this._e = 0xc3d2e1f0

	    Hash.prototype.init.call(this)
	    return this
	  }

	  Sha1.prototype._POOL = POOL
	  Sha1.prototype._update = function (X) {

	    var a, b, c, d, e, _a, _b, _c, _d, _e

	    a = _a = this._a
	    b = _b = this._b
	    c = _c = this._c
	    d = _d = this._d
	    e = _e = this._e

	    var w = this._w

	    for(var j = 0; j < 80; j++) {
	      var W = w[j] = j < 16 ? X.readInt32BE(j*4)
	        : rol(w[j - 3] ^ w[j -  8] ^ w[j - 14] ^ w[j - 16], 1)

	      var t = add(
	        add(rol(a, 5), sha1_ft(j, b, c, d)),
	        add(add(e, W), sha1_kt(j))
	      )

	      e = d
	      d = c
	      c = rol(b, 30)
	      b = a
	      a = t
	    }

	    this._a = add(a, _a)
	    this._b = add(b, _b)
	    this._c = add(c, _c)
	    this._d = add(d, _d)
	    this._e = add(e, _e)
	  }

	  Sha1.prototype._hash = function () {
	    if(POOL.length < 100) POOL.push(this)
	    var H = new Buffer(20)
	    //console.log(this._a|0, this._b|0, this._c|0, this._d|0, this._e|0)
	    H.writeInt32BE(this._a|0, A)
	    H.writeInt32BE(this._b|0, B)
	    H.writeInt32BE(this._c|0, C)
	    H.writeInt32BE(this._d|0, D)
	    H.writeInt32BE(this._e|0, E)
	    return H
	  }

	  /*
	   * Perform the appropriate triplet combination function for the current
	   * iteration
	   */
	  function sha1_ft(t, b, c, d) {
	    if(t < 20) return (b & c) | ((~b) & d);
	    if(t < 40) return b ^ c ^ d;
	    if(t < 60) return (b & c) | (b & d) | (c & d);
	    return b ^ c ^ d;
	  }

	  /*
	   * Determine the appropriate additive constant for the current iteration
	   */
	  function sha1_kt(t) {
	    return (t < 20) ?  1518500249 : (t < 40) ?  1859775393 :
	           (t < 60) ? -1894007588 : -899497514;
	  }

	  /*
	   * Add integers, wrapping at 2^32. This uses 16-bit operations internally
	   * to work around bugs in some JS interpreters.
	   * //dominictarr: this is 10 years old, so maybe this can be dropped?)
	   *
	   */
	  function add(x, y) {
	    return (x + y ) | 0
	  //lets see how this goes on testling.
	  //  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
	  //  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
	  //  return (msw << 16) | (lsw & 0xFFFF);
	  }

	  /*
	   * Bitwise rotate a 32-bit number to the left.
	   */
	  function rol(num, cnt) {
	    return (num << cnt) | (num >>> (32 - cnt));
	  }

	  return Sha1
	}


/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global, process) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	var formatRegExp = /%[sdj%]/g;
	exports.format = function(f) {
	  if (!isString(f)) {
	    var objects = [];
	    for (var i = 0; i < arguments.length; i++) {
	      objects.push(inspect(arguments[i]));
	    }
	    return objects.join(' ');
	  }

	  var i = 1;
	  var args = arguments;
	  var len = args.length;
	  var str = String(f).replace(formatRegExp, function(x) {
	    if (x === '%%') return '%';
	    if (i >= len) return x;
	    switch (x) {
	      case '%s': return String(args[i++]);
	      case '%d': return Number(args[i++]);
	      case '%j':
	        try {
	          return JSON.stringify(args[i++]);
	        } catch (_) {
	          return '[Circular]';
	        }
	      default:
	        return x;
	    }
	  });
	  for (var x = args[i]; i < len; x = args[++i]) {
	    if (isNull(x) || !isObject(x)) {
	      str += ' ' + x;
	    } else {
	      str += ' ' + inspect(x);
	    }
	  }
	  return str;
	};


	// Mark that a method should not be used.
	// Returns a modified function which warns once by default.
	// If --no-deprecation is set, then it is a no-op.
	exports.deprecate = function(fn, msg) {
	  // Allow for deprecating things in the process of starting up.
	  if (isUndefined(global.process)) {
	    return function() {
	      return exports.deprecate(fn, msg).apply(this, arguments);
	    };
	  }

	  if (process.noDeprecation === true) {
	    return fn;
	  }

	  var warned = false;
	  function deprecated() {
	    if (!warned) {
	      if (process.throwDeprecation) {
	        throw new Error(msg);
	      } else if (process.traceDeprecation) {
	        console.trace(msg);
	      } else {
	        console.error(msg);
	      }
	      warned = true;
	    }
	    return fn.apply(this, arguments);
	  }

	  return deprecated;
	};


	var debugs = {};
	var debugEnviron;
	exports.debuglog = function(set) {
	  if (isUndefined(debugEnviron))
	    debugEnviron = process.env.NODE_DEBUG || '';
	  set = set.toUpperCase();
	  if (!debugs[set]) {
	    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
	      var pid = process.pid;
	      debugs[set] = function() {
	        var msg = exports.format.apply(exports, arguments);
	        console.error('%s %d: %s', set, pid, msg);
	      };
	    } else {
	      debugs[set] = function() {};
	    }
	  }
	  return debugs[set];
	};


	/**
	 * Echos the value of a value. Trys to print the value out
	 * in the best way possible given the different types.
	 *
	 * @param {Object} obj The object to print out.
	 * @param {Object} opts Optional options object that alters the output.
	 */
	/* legacy: obj, showHidden, depth, colors*/
	function inspect(obj, opts) {
	  // default options
	  var ctx = {
	    seen: [],
	    stylize: stylizeNoColor
	  };
	  // legacy...
	  if (arguments.length >= 3) ctx.depth = arguments[2];
	  if (arguments.length >= 4) ctx.colors = arguments[3];
	  if (isBoolean(opts)) {
	    // legacy...
	    ctx.showHidden = opts;
	  } else if (opts) {
	    // got an "options" object
	    exports._extend(ctx, opts);
	  }
	  // set default options
	  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
	  if (isUndefined(ctx.depth)) ctx.depth = 2;
	  if (isUndefined(ctx.colors)) ctx.colors = false;
	  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
	  if (ctx.colors) ctx.stylize = stylizeWithColor;
	  return formatValue(ctx, obj, ctx.depth);
	}
	exports.inspect = inspect;


	// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
	inspect.colors = {
	  'bold' : [1, 22],
	  'italic' : [3, 23],
	  'underline' : [4, 24],
	  'inverse' : [7, 27],
	  'white' : [37, 39],
	  'grey' : [90, 39],
	  'black' : [30, 39],
	  'blue' : [34, 39],
	  'cyan' : [36, 39],
	  'green' : [32, 39],
	  'magenta' : [35, 39],
	  'red' : [31, 39],
	  'yellow' : [33, 39]
	};

	// Don't use 'blue' not visible on cmd.exe
	inspect.styles = {
	  'special': 'cyan',
	  'number': 'yellow',
	  'boolean': 'yellow',
	  'undefined': 'grey',
	  'null': 'bold',
	  'string': 'green',
	  'date': 'magenta',
	  // "name": intentionally not styling
	  'regexp': 'red'
	};


	function stylizeWithColor(str, styleType) {
	  var style = inspect.styles[styleType];

	  if (style) {
	    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
	           '\u001b[' + inspect.colors[style][1] + 'm';
	  } else {
	    return str;
	  }
	}


	function stylizeNoColor(str, styleType) {
	  return str;
	}


	function arrayToHash(array) {
	  var hash = {};

	  array.forEach(function(val, idx) {
	    hash[val] = true;
	  });

	  return hash;
	}


	function formatValue(ctx, value, recurseTimes) {
	  // Provide a hook for user-specified inspect functions.
	  // Check that value is an object with an inspect function on it
	  if (ctx.customInspect &&
	      value &&
	      isFunction(value.inspect) &&
	      // Filter out the util module, it's inspect function is special
	      value.inspect !== exports.inspect &&
	      // Also filter out any prototype objects using the circular check.
	      !(value.constructor && value.constructor.prototype === value)) {
	    var ret = value.inspect(recurseTimes, ctx);
	    if (!isString(ret)) {
	      ret = formatValue(ctx, ret, recurseTimes);
	    }
	    return ret;
	  }

	  // Primitive types cannot have properties
	  var primitive = formatPrimitive(ctx, value);
	  if (primitive) {
	    return primitive;
	  }

	  // Look up the keys of the object.
	  var keys = Object.keys(value);
	  var visibleKeys = arrayToHash(keys);

	  if (ctx.showHidden) {
	    keys = Object.getOwnPropertyNames(value);
	  }

	  // IE doesn't make error fields non-enumerable
	  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
	  if (isError(value)
	      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
	    return formatError(value);
	  }

	  // Some type of object without properties can be shortcutted.
	  if (keys.length === 0) {
	    if (isFunction(value)) {
	      var name = value.name ? ': ' + value.name : '';
	      return ctx.stylize('[Function' + name + ']', 'special');
	    }
	    if (isRegExp(value)) {
	      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
	    }
	    if (isDate(value)) {
	      return ctx.stylize(Date.prototype.toString.call(value), 'date');
	    }
	    if (isError(value)) {
	      return formatError(value);
	    }
	  }

	  var base = '', array = false, braces = ['{', '}'];

	  // Make Array say that they are Array
	  if (isArray(value)) {
	    array = true;
	    braces = ['[', ']'];
	  }

	  // Make functions say that they are functions
	  if (isFunction(value)) {
	    var n = value.name ? ': ' + value.name : '';
	    base = ' [Function' + n + ']';
	  }

	  // Make RegExps say that they are RegExps
	  if (isRegExp(value)) {
	    base = ' ' + RegExp.prototype.toString.call(value);
	  }

	  // Make dates with properties first say the date
	  if (isDate(value)) {
	    base = ' ' + Date.prototype.toUTCString.call(value);
	  }

	  // Make error with message first say the error
	  if (isError(value)) {
	    base = ' ' + formatError(value);
	  }

	  if (keys.length === 0 && (!array || value.length == 0)) {
	    return braces[0] + base + braces[1];
	  }

	  if (recurseTimes < 0) {
	    if (isRegExp(value)) {
	      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
	    } else {
	      return ctx.stylize('[Object]', 'special');
	    }
	  }

	  ctx.seen.push(value);

	  var output;
	  if (array) {
	    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
	  } else {
	    output = keys.map(function(key) {
	      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
	    });
	  }

	  ctx.seen.pop();

	  return reduceToSingleString(output, base, braces);
	}


	function formatPrimitive(ctx, value) {
	  if (isUndefined(value))
	    return ctx.stylize('undefined', 'undefined');
	  if (isString(value)) {
	    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
	                                             .replace(/'/g, "\\'")
	                                             .replace(/\\"/g, '"') + '\'';
	    return ctx.stylize(simple, 'string');
	  }
	  if (isNumber(value))
	    return ctx.stylize('' + value, 'number');
	  if (isBoolean(value))
	    return ctx.stylize('' + value, 'boolean');
	  // For some reason typeof null is "object", so special case here.
	  if (isNull(value))
	    return ctx.stylize('null', 'null');
	}


	function formatError(value) {
	  return '[' + Error.prototype.toString.call(value) + ']';
	}


	function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
	  var output = [];
	  for (var i = 0, l = value.length; i < l; ++i) {
	    if (hasOwnProperty(value, String(i))) {
	      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
	          String(i), true));
	    } else {
	      output.push('');
	    }
	  }
	  keys.forEach(function(key) {
	    if (!key.match(/^\d+$/)) {
	      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
	          key, true));
	    }
	  });
	  return output;
	}


	function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
	  var name, str, desc;
	  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
	  if (desc.get) {
	    if (desc.set) {
	      str = ctx.stylize('[Getter/Setter]', 'special');
	    } else {
	      str = ctx.stylize('[Getter]', 'special');
	    }
	  } else {
	    if (desc.set) {
	      str = ctx.stylize('[Setter]', 'special');
	    }
	  }
	  if (!hasOwnProperty(visibleKeys, key)) {
	    name = '[' + key + ']';
	  }
	  if (!str) {
	    if (ctx.seen.indexOf(desc.value) < 0) {
	      if (isNull(recurseTimes)) {
	        str = formatValue(ctx, desc.value, null);
	      } else {
	        str = formatValue(ctx, desc.value, recurseTimes - 1);
	      }
	      if (str.indexOf('\n') > -1) {
	        if (array) {
	          str = str.split('\n').map(function(line) {
	            return '  ' + line;
	          }).join('\n').substr(2);
	        } else {
	          str = '\n' + str.split('\n').map(function(line) {
	            return '   ' + line;
	          }).join('\n');
	        }
	      }
	    } else {
	      str = ctx.stylize('[Circular]', 'special');
	    }
	  }
	  if (isUndefined(name)) {
	    if (array && key.match(/^\d+$/)) {
	      return str;
	    }
	    name = JSON.stringify('' + key);
	    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
	      name = name.substr(1, name.length - 2);
	      name = ctx.stylize(name, 'name');
	    } else {
	      name = name.replace(/'/g, "\\'")
	                 .replace(/\\"/g, '"')
	                 .replace(/(^"|"$)/g, "'");
	      name = ctx.stylize(name, 'string');
	    }
	  }

	  return name + ': ' + str;
	}


	function reduceToSingleString(output, base, braces) {
	  var numLinesEst = 0;
	  var length = output.reduce(function(prev, cur) {
	    numLinesEst++;
	    if (cur.indexOf('\n') >= 0) numLinesEst++;
	    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
	  }, 0);

	  if (length > 60) {
	    return braces[0] +
	           (base === '' ? '' : base + '\n ') +
	           ' ' +
	           output.join(',\n  ') +
	           ' ' +
	           braces[1];
	  }

	  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
	}


	// NOTE: These type checking functions intentionally don't use `instanceof`
	// because it is fragile and can be easily faked with `Object.create()`.
	function isArray(ar) {
	  return Array.isArray(ar);
	}
	exports.isArray = isArray;

	function isBoolean(arg) {
	  return typeof arg === 'boolean';
	}
	exports.isBoolean = isBoolean;

	function isNull(arg) {
	  return arg === null;
	}
	exports.isNull = isNull;

	function isNullOrUndefined(arg) {
	  return arg == null;
	}
	exports.isNullOrUndefined = isNullOrUndefined;

	function isNumber(arg) {
	  return typeof arg === 'number';
	}
	exports.isNumber = isNumber;

	function isString(arg) {
	  return typeof arg === 'string';
	}
	exports.isString = isString;

	function isSymbol(arg) {
	  return typeof arg === 'symbol';
	}
	exports.isSymbol = isSymbol;

	function isUndefined(arg) {
	  return arg === void 0;
	}
	exports.isUndefined = isUndefined;

	function isRegExp(re) {
	  return isObject(re) && objectToString(re) === '[object RegExp]';
	}
	exports.isRegExp = isRegExp;

	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}
	exports.isObject = isObject;

	function isDate(d) {
	  return isObject(d) && objectToString(d) === '[object Date]';
	}
	exports.isDate = isDate;

	function isError(e) {
	  return isObject(e) &&
	      (objectToString(e) === '[object Error]' || e instanceof Error);
	}
	exports.isError = isError;

	function isFunction(arg) {
	  return typeof arg === 'function';
	}
	exports.isFunction = isFunction;

	function isPrimitive(arg) {
	  return arg === null ||
	         typeof arg === 'boolean' ||
	         typeof arg === 'number' ||
	         typeof arg === 'string' ||
	         typeof arg === 'symbol' ||  // ES6 symbol
	         typeof arg === 'undefined';
	}
	exports.isPrimitive = isPrimitive;

	exports.isBuffer = __webpack_require__(22);

	function objectToString(o) {
	  return Object.prototype.toString.call(o);
	}


	function pad(n) {
	  return n < 10 ? '0' + n.toString(10) : n.toString(10);
	}


	var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
	              'Oct', 'Nov', 'Dec'];

	// 26 Feb 16:19:34
	function timestamp() {
	  var d = new Date();
	  var time = [pad(d.getHours()),
	              pad(d.getMinutes()),
	              pad(d.getSeconds())].join(':');
	  return [d.getDate(), months[d.getMonth()], time].join(' ');
	}


	// log is just a thin wrapper to console.log that prepends a timestamp
	exports.log = function() {
	  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
	};


	/**
	 * Inherit the prototype methods from one constructor into another.
	 *
	 * The Function.prototype.inherits from lang.js rewritten as a standalone
	 * function (not on Function.prototype). NOTE: If this file is to be loaded
	 * during bootstrapping this function needs to be rewritten using some native
	 * functions as prototype setup using normal JavaScript does not work as
	 * expected during bootstrapping (see mirror.js in r114903).
	 *
	 * @param {function} ctor Constructor function which needs to inherit the
	 *     prototype.
	 * @param {function} superCtor Constructor function to inherit prototype from.
	 */
	exports.inherits = __webpack_require__(23);

	exports._extend = function(origin, add) {
	  // Don't do anything if add isn't an object
	  if (!add || !isObject(add)) return origin;

	  var keys = Object.keys(add);
	  var i = keys.length;
	  while (i--) {
	    origin[keys[i]] = add[keys[i]];
	  }
	  return origin;
	};

	function hasOwnProperty(obj, prop) {
	  return Object.prototype.hasOwnProperty.call(obj, prop);
	}

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(6)))

/***/ },
/* 22 */
/***/ function(module, exports) {

	module.exports = function isBuffer(arg) {
	  return arg && typeof arg === 'object'
	    && typeof arg.copy === 'function'
	    && typeof arg.fill === 'function'
	    && typeof arg.readUInt8 === 'function';
	}

/***/ },
/* 23 */
/***/ function(module, exports) {

	if (typeof Object.create === 'function') {
	  // implementation from standard node.js 'util' module
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    ctor.prototype = Object.create(superCtor.prototype, {
	      constructor: {
	        value: ctor,
	        enumerable: false,
	        writable: true,
	        configurable: true
	      }
	    });
	  };
	} else {
	  // old school shim for old browsers
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    var TempCtor = function () {}
	    TempCtor.prototype = superCtor.prototype
	    ctor.prototype = new TempCtor()
	    ctor.prototype.constructor = ctor
	  }
	}


/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * A JavaScript implementation of the Secure Hash Algorithm, SHA-256, as defined
	 * in FIPS 180-2
	 * Version 2.2-beta Copyright Angel Marin, Paul Johnston 2000 - 2009.
	 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
	 *
	 */

	var inherits = __webpack_require__(21).inherits

	module.exports = function (Buffer, Hash) {

	  var K = [
	      0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5,
	      0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
	      0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3,
	      0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
	      0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC,
	      0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
	      0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7,
	      0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
	      0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13,
	      0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
	      0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3,
	      0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
	      0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5,
	      0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
	      0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208,
	      0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2
	    ]

	  var W = new Array(64)

	  function Sha256() {
	    this.init()

	    this._w = W //new Array(64)

	    Hash.call(this, 16*4, 14*4)
	  }

	  inherits(Sha256, Hash)

	  Sha256.prototype.init = function () {

	    this._a = 0x6a09e667|0
	    this._b = 0xbb67ae85|0
	    this._c = 0x3c6ef372|0
	    this._d = 0xa54ff53a|0
	    this._e = 0x510e527f|0
	    this._f = 0x9b05688c|0
	    this._g = 0x1f83d9ab|0
	    this._h = 0x5be0cd19|0

	    this._len = this._s = 0

	    return this
	  }

	  function S (X, n) {
	    return (X >>> n) | (X << (32 - n));
	  }

	  function R (X, n) {
	    return (X >>> n);
	  }

	  function Ch (x, y, z) {
	    return ((x & y) ^ ((~x) & z));
	  }

	  function Maj (x, y, z) {
	    return ((x & y) ^ (x & z) ^ (y & z));
	  }

	  function Sigma0256 (x) {
	    return (S(x, 2) ^ S(x, 13) ^ S(x, 22));
	  }

	  function Sigma1256 (x) {
	    return (S(x, 6) ^ S(x, 11) ^ S(x, 25));
	  }

	  function Gamma0256 (x) {
	    return (S(x, 7) ^ S(x, 18) ^ R(x, 3));
	  }

	  function Gamma1256 (x) {
	    return (S(x, 17) ^ S(x, 19) ^ R(x, 10));
	  }

	  Sha256.prototype._update = function(M) {

	    var W = this._w
	    var a, b, c, d, e, f, g, h
	    var T1, T2

	    a = this._a | 0
	    b = this._b | 0
	    c = this._c | 0
	    d = this._d | 0
	    e = this._e | 0
	    f = this._f | 0
	    g = this._g | 0
	    h = this._h | 0

	    for (var j = 0; j < 64; j++) {
	      var w = W[j] = j < 16
	        ? M.readInt32BE(j * 4)
	        : Gamma1256(W[j - 2]) + W[j - 7] + Gamma0256(W[j - 15]) + W[j - 16]

	      T1 = h + Sigma1256(e) + Ch(e, f, g) + K[j] + w

	      T2 = Sigma0256(a) + Maj(a, b, c);
	      h = g; g = f; f = e; e = d + T1; d = c; c = b; b = a; a = T1 + T2;
	    }

	    this._a = (a + this._a) | 0
	    this._b = (b + this._b) | 0
	    this._c = (c + this._c) | 0
	    this._d = (d + this._d) | 0
	    this._e = (e + this._e) | 0
	    this._f = (f + this._f) | 0
	    this._g = (g + this._g) | 0
	    this._h = (h + this._h) | 0

	  };

	  Sha256.prototype._hash = function () {
	    var H = new Buffer(32)

	    H.writeInt32BE(this._a,  0)
	    H.writeInt32BE(this._b,  4)
	    H.writeInt32BE(this._c,  8)
	    H.writeInt32BE(this._d, 12)
	    H.writeInt32BE(this._e, 16)
	    H.writeInt32BE(this._f, 20)
	    H.writeInt32BE(this._g, 24)
	    H.writeInt32BE(this._h, 28)

	    return H
	  }

	  return Sha256

	}


/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	var inherits = __webpack_require__(21).inherits

	module.exports = function (Buffer, Hash) {
	  var K = [
	    0x428a2f98, 0xd728ae22, 0x71374491, 0x23ef65cd,
	    0xb5c0fbcf, 0xec4d3b2f, 0xe9b5dba5, 0x8189dbbc,
	    0x3956c25b, 0xf348b538, 0x59f111f1, 0xb605d019,
	    0x923f82a4, 0xaf194f9b, 0xab1c5ed5, 0xda6d8118,
	    0xd807aa98, 0xa3030242, 0x12835b01, 0x45706fbe,
	    0x243185be, 0x4ee4b28c, 0x550c7dc3, 0xd5ffb4e2,
	    0x72be5d74, 0xf27b896f, 0x80deb1fe, 0x3b1696b1,
	    0x9bdc06a7, 0x25c71235, 0xc19bf174, 0xcf692694,
	    0xe49b69c1, 0x9ef14ad2, 0xefbe4786, 0x384f25e3,
	    0x0fc19dc6, 0x8b8cd5b5, 0x240ca1cc, 0x77ac9c65,
	    0x2de92c6f, 0x592b0275, 0x4a7484aa, 0x6ea6e483,
	    0x5cb0a9dc, 0xbd41fbd4, 0x76f988da, 0x831153b5,
	    0x983e5152, 0xee66dfab, 0xa831c66d, 0x2db43210,
	    0xb00327c8, 0x98fb213f, 0xbf597fc7, 0xbeef0ee4,
	    0xc6e00bf3, 0x3da88fc2, 0xd5a79147, 0x930aa725,
	    0x06ca6351, 0xe003826f, 0x14292967, 0x0a0e6e70,
	    0x27b70a85, 0x46d22ffc, 0x2e1b2138, 0x5c26c926,
	    0x4d2c6dfc, 0x5ac42aed, 0x53380d13, 0x9d95b3df,
	    0x650a7354, 0x8baf63de, 0x766a0abb, 0x3c77b2a8,
	    0x81c2c92e, 0x47edaee6, 0x92722c85, 0x1482353b,
	    0xa2bfe8a1, 0x4cf10364, 0xa81a664b, 0xbc423001,
	    0xc24b8b70, 0xd0f89791, 0xc76c51a3, 0x0654be30,
	    0xd192e819, 0xd6ef5218, 0xd6990624, 0x5565a910,
	    0xf40e3585, 0x5771202a, 0x106aa070, 0x32bbd1b8,
	    0x19a4c116, 0xb8d2d0c8, 0x1e376c08, 0x5141ab53,
	    0x2748774c, 0xdf8eeb99, 0x34b0bcb5, 0xe19b48a8,
	    0x391c0cb3, 0xc5c95a63, 0x4ed8aa4a, 0xe3418acb,
	    0x5b9cca4f, 0x7763e373, 0x682e6ff3, 0xd6b2b8a3,
	    0x748f82ee, 0x5defb2fc, 0x78a5636f, 0x43172f60,
	    0x84c87814, 0xa1f0ab72, 0x8cc70208, 0x1a6439ec,
	    0x90befffa, 0x23631e28, 0xa4506ceb, 0xde82bde9,
	    0xbef9a3f7, 0xb2c67915, 0xc67178f2, 0xe372532b,
	    0xca273ece, 0xea26619c, 0xd186b8c7, 0x21c0c207,
	    0xeada7dd6, 0xcde0eb1e, 0xf57d4f7f, 0xee6ed178,
	    0x06f067aa, 0x72176fba, 0x0a637dc5, 0xa2c898a6,
	    0x113f9804, 0xbef90dae, 0x1b710b35, 0x131c471b,
	    0x28db77f5, 0x23047d84, 0x32caab7b, 0x40c72493,
	    0x3c9ebe0a, 0x15c9bebc, 0x431d67c4, 0x9c100d4c,
	    0x4cc5d4be, 0xcb3e42b6, 0x597f299c, 0xfc657e2a,
	    0x5fcb6fab, 0x3ad6faec, 0x6c44198c, 0x4a475817
	  ]

	  var W = new Array(160)

	  function Sha512() {
	    this.init()
	    this._w = W

	    Hash.call(this, 128, 112)
	  }

	  inherits(Sha512, Hash)

	  Sha512.prototype.init = function () {

	    this._a = 0x6a09e667|0
	    this._b = 0xbb67ae85|0
	    this._c = 0x3c6ef372|0
	    this._d = 0xa54ff53a|0
	    this._e = 0x510e527f|0
	    this._f = 0x9b05688c|0
	    this._g = 0x1f83d9ab|0
	    this._h = 0x5be0cd19|0

	    this._al = 0xf3bcc908|0
	    this._bl = 0x84caa73b|0
	    this._cl = 0xfe94f82b|0
	    this._dl = 0x5f1d36f1|0
	    this._el = 0xade682d1|0
	    this._fl = 0x2b3e6c1f|0
	    this._gl = 0xfb41bd6b|0
	    this._hl = 0x137e2179|0

	    this._len = this._s = 0

	    return this
	  }

	  function S (X, Xl, n) {
	    return (X >>> n) | (Xl << (32 - n))
	  }

	  function Ch (x, y, z) {
	    return ((x & y) ^ ((~x) & z));
	  }

	  function Maj (x, y, z) {
	    return ((x & y) ^ (x & z) ^ (y & z));
	  }

	  Sha512.prototype._update = function(M) {

	    var W = this._w
	    var a, b, c, d, e, f, g, h
	    var al, bl, cl, dl, el, fl, gl, hl

	    a = this._a | 0
	    b = this._b | 0
	    c = this._c | 0
	    d = this._d | 0
	    e = this._e | 0
	    f = this._f | 0
	    g = this._g | 0
	    h = this._h | 0

	    al = this._al | 0
	    bl = this._bl | 0
	    cl = this._cl | 0
	    dl = this._dl | 0
	    el = this._el | 0
	    fl = this._fl | 0
	    gl = this._gl | 0
	    hl = this._hl | 0

	    for (var i = 0; i < 80; i++) {
	      var j = i * 2

	      var Wi, Wil

	      if (i < 16) {
	        Wi = W[j] = M.readInt32BE(j * 4)
	        Wil = W[j + 1] = M.readInt32BE(j * 4 + 4)

	      } else {
	        var x  = W[j - 15*2]
	        var xl = W[j - 15*2 + 1]
	        var gamma0  = S(x, xl, 1) ^ S(x, xl, 8) ^ (x >>> 7)
	        var gamma0l = S(xl, x, 1) ^ S(xl, x, 8) ^ S(xl, x, 7)

	        x  = W[j - 2*2]
	        xl = W[j - 2*2 + 1]
	        var gamma1  = S(x, xl, 19) ^ S(xl, x, 29) ^ (x >>> 6)
	        var gamma1l = S(xl, x, 19) ^ S(x, xl, 29) ^ S(xl, x, 6)

	        // W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16]
	        var Wi7  = W[j - 7*2]
	        var Wi7l = W[j - 7*2 + 1]

	        var Wi16  = W[j - 16*2]
	        var Wi16l = W[j - 16*2 + 1]

	        Wil = gamma0l + Wi7l
	        Wi  = gamma0  + Wi7 + ((Wil >>> 0) < (gamma0l >>> 0) ? 1 : 0)
	        Wil = Wil + gamma1l
	        Wi  = Wi  + gamma1  + ((Wil >>> 0) < (gamma1l >>> 0) ? 1 : 0)
	        Wil = Wil + Wi16l
	        Wi  = Wi  + Wi16 + ((Wil >>> 0) < (Wi16l >>> 0) ? 1 : 0)

	        W[j] = Wi
	        W[j + 1] = Wil
	      }

	      var maj = Maj(a, b, c)
	      var majl = Maj(al, bl, cl)

	      var sigma0h = S(a, al, 28) ^ S(al, a, 2) ^ S(al, a, 7)
	      var sigma0l = S(al, a, 28) ^ S(a, al, 2) ^ S(a, al, 7)
	      var sigma1h = S(e, el, 14) ^ S(e, el, 18) ^ S(el, e, 9)
	      var sigma1l = S(el, e, 14) ^ S(el, e, 18) ^ S(e, el, 9)

	      // t1 = h + sigma1 + ch + K[i] + W[i]
	      var Ki = K[j]
	      var Kil = K[j + 1]

	      var ch = Ch(e, f, g)
	      var chl = Ch(el, fl, gl)

	      var t1l = hl + sigma1l
	      var t1 = h + sigma1h + ((t1l >>> 0) < (hl >>> 0) ? 1 : 0)
	      t1l = t1l + chl
	      t1 = t1 + ch + ((t1l >>> 0) < (chl >>> 0) ? 1 : 0)
	      t1l = t1l + Kil
	      t1 = t1 + Ki + ((t1l >>> 0) < (Kil >>> 0) ? 1 : 0)
	      t1l = t1l + Wil
	      t1 = t1 + Wi + ((t1l >>> 0) < (Wil >>> 0) ? 1 : 0)

	      // t2 = sigma0 + maj
	      var t2l = sigma0l + majl
	      var t2 = sigma0h + maj + ((t2l >>> 0) < (sigma0l >>> 0) ? 1 : 0)

	      h  = g
	      hl = gl
	      g  = f
	      gl = fl
	      f  = e
	      fl = el
	      el = (dl + t1l) | 0
	      e  = (d + t1 + ((el >>> 0) < (dl >>> 0) ? 1 : 0)) | 0
	      d  = c
	      dl = cl
	      c  = b
	      cl = bl
	      b  = a
	      bl = al
	      al = (t1l + t2l) | 0
	      a  = (t1 + t2 + ((al >>> 0) < (t1l >>> 0) ? 1 : 0)) | 0
	    }

	    this._al = (this._al + al) | 0
	    this._bl = (this._bl + bl) | 0
	    this._cl = (this._cl + cl) | 0
	    this._dl = (this._dl + dl) | 0
	    this._el = (this._el + el) | 0
	    this._fl = (this._fl + fl) | 0
	    this._gl = (this._gl + gl) | 0
	    this._hl = (this._hl + hl) | 0

	    this._a = (this._a + a + ((this._al >>> 0) < (al >>> 0) ? 1 : 0)) | 0
	    this._b = (this._b + b + ((this._bl >>> 0) < (bl >>> 0) ? 1 : 0)) | 0
	    this._c = (this._c + c + ((this._cl >>> 0) < (cl >>> 0) ? 1 : 0)) | 0
	    this._d = (this._d + d + ((this._dl >>> 0) < (dl >>> 0) ? 1 : 0)) | 0
	    this._e = (this._e + e + ((this._el >>> 0) < (el >>> 0) ? 1 : 0)) | 0
	    this._f = (this._f + f + ((this._fl >>> 0) < (fl >>> 0) ? 1 : 0)) | 0
	    this._g = (this._g + g + ((this._gl >>> 0) < (gl >>> 0) ? 1 : 0)) | 0
	    this._h = (this._h + h + ((this._hl >>> 0) < (hl >>> 0) ? 1 : 0)) | 0
	  }

	  Sha512.prototype._hash = function () {
	    var H = new Buffer(64)

	    function writeInt64BE(h, l, offset) {
	      H.writeInt32BE(h, offset)
	      H.writeInt32BE(l, offset + 4)
	    }

	    writeInt64BE(this._a, this._al, 0)
	    writeInt64BE(this._b, this._bl, 8)
	    writeInt64BE(this._c, this._cl, 16)
	    writeInt64BE(this._d, this._dl, 24)
	    writeInt64BE(this._e, this._el, 32)
	    writeInt64BE(this._f, this._fl, 40)
	    writeInt64BE(this._g, this._gl, 48)
	    writeInt64BE(this._h, this._hl, 56)

	    return H
	  }

	  return Sha512

	}


/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	/*
	 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
	 * Digest Algorithm, as defined in RFC 1321.
	 * Version 2.1 Copyright (C) Paul Johnston 1999 - 2002.
	 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
	 * Distributed under the BSD License
	 * See http://pajhome.org.uk/crypt/md5 for more info.
	 */

	var helpers = __webpack_require__(27);

	/*
	 * Calculate the MD5 of an array of little-endian words, and a bit length
	 */
	function core_md5(x, len)
	{
	  /* append padding */
	  x[len >> 5] |= 0x80 << ((len) % 32);
	  x[(((len + 64) >>> 9) << 4) + 14] = len;

	  var a =  1732584193;
	  var b = -271733879;
	  var c = -1732584194;
	  var d =  271733878;

	  for(var i = 0; i < x.length; i += 16)
	  {
	    var olda = a;
	    var oldb = b;
	    var oldc = c;
	    var oldd = d;

	    a = md5_ff(a, b, c, d, x[i+ 0], 7 , -680876936);
	    d = md5_ff(d, a, b, c, x[i+ 1], 12, -389564586);
	    c = md5_ff(c, d, a, b, x[i+ 2], 17,  606105819);
	    b = md5_ff(b, c, d, a, x[i+ 3], 22, -1044525330);
	    a = md5_ff(a, b, c, d, x[i+ 4], 7 , -176418897);
	    d = md5_ff(d, a, b, c, x[i+ 5], 12,  1200080426);
	    c = md5_ff(c, d, a, b, x[i+ 6], 17, -1473231341);
	    b = md5_ff(b, c, d, a, x[i+ 7], 22, -45705983);
	    a = md5_ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
	    d = md5_ff(d, a, b, c, x[i+ 9], 12, -1958414417);
	    c = md5_ff(c, d, a, b, x[i+10], 17, -42063);
	    b = md5_ff(b, c, d, a, x[i+11], 22, -1990404162);
	    a = md5_ff(a, b, c, d, x[i+12], 7 ,  1804603682);
	    d = md5_ff(d, a, b, c, x[i+13], 12, -40341101);
	    c = md5_ff(c, d, a, b, x[i+14], 17, -1502002290);
	    b = md5_ff(b, c, d, a, x[i+15], 22,  1236535329);

	    a = md5_gg(a, b, c, d, x[i+ 1], 5 , -165796510);
	    d = md5_gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
	    c = md5_gg(c, d, a, b, x[i+11], 14,  643717713);
	    b = md5_gg(b, c, d, a, x[i+ 0], 20, -373897302);
	    a = md5_gg(a, b, c, d, x[i+ 5], 5 , -701558691);
	    d = md5_gg(d, a, b, c, x[i+10], 9 ,  38016083);
	    c = md5_gg(c, d, a, b, x[i+15], 14, -660478335);
	    b = md5_gg(b, c, d, a, x[i+ 4], 20, -405537848);
	    a = md5_gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
	    d = md5_gg(d, a, b, c, x[i+14], 9 , -1019803690);
	    c = md5_gg(c, d, a, b, x[i+ 3], 14, -187363961);
	    b = md5_gg(b, c, d, a, x[i+ 8], 20,  1163531501);
	    a = md5_gg(a, b, c, d, x[i+13], 5 , -1444681467);
	    d = md5_gg(d, a, b, c, x[i+ 2], 9 , -51403784);
	    c = md5_gg(c, d, a, b, x[i+ 7], 14,  1735328473);
	    b = md5_gg(b, c, d, a, x[i+12], 20, -1926607734);

	    a = md5_hh(a, b, c, d, x[i+ 5], 4 , -378558);
	    d = md5_hh(d, a, b, c, x[i+ 8], 11, -2022574463);
	    c = md5_hh(c, d, a, b, x[i+11], 16,  1839030562);
	    b = md5_hh(b, c, d, a, x[i+14], 23, -35309556);
	    a = md5_hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
	    d = md5_hh(d, a, b, c, x[i+ 4], 11,  1272893353);
	    c = md5_hh(c, d, a, b, x[i+ 7], 16, -155497632);
	    b = md5_hh(b, c, d, a, x[i+10], 23, -1094730640);
	    a = md5_hh(a, b, c, d, x[i+13], 4 ,  681279174);
	    d = md5_hh(d, a, b, c, x[i+ 0], 11, -358537222);
	    c = md5_hh(c, d, a, b, x[i+ 3], 16, -722521979);
	    b = md5_hh(b, c, d, a, x[i+ 6], 23,  76029189);
	    a = md5_hh(a, b, c, d, x[i+ 9], 4 , -640364487);
	    d = md5_hh(d, a, b, c, x[i+12], 11, -421815835);
	    c = md5_hh(c, d, a, b, x[i+15], 16,  530742520);
	    b = md5_hh(b, c, d, a, x[i+ 2], 23, -995338651);

	    a = md5_ii(a, b, c, d, x[i+ 0], 6 , -198630844);
	    d = md5_ii(d, a, b, c, x[i+ 7], 10,  1126891415);
	    c = md5_ii(c, d, a, b, x[i+14], 15, -1416354905);
	    b = md5_ii(b, c, d, a, x[i+ 5], 21, -57434055);
	    a = md5_ii(a, b, c, d, x[i+12], 6 ,  1700485571);
	    d = md5_ii(d, a, b, c, x[i+ 3], 10, -1894986606);
	    c = md5_ii(c, d, a, b, x[i+10], 15, -1051523);
	    b = md5_ii(b, c, d, a, x[i+ 1], 21, -2054922799);
	    a = md5_ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
	    d = md5_ii(d, a, b, c, x[i+15], 10, -30611744);
	    c = md5_ii(c, d, a, b, x[i+ 6], 15, -1560198380);
	    b = md5_ii(b, c, d, a, x[i+13], 21,  1309151649);
	    a = md5_ii(a, b, c, d, x[i+ 4], 6 , -145523070);
	    d = md5_ii(d, a, b, c, x[i+11], 10, -1120210379);
	    c = md5_ii(c, d, a, b, x[i+ 2], 15,  718787259);
	    b = md5_ii(b, c, d, a, x[i+ 9], 21, -343485551);

	    a = safe_add(a, olda);
	    b = safe_add(b, oldb);
	    c = safe_add(c, oldc);
	    d = safe_add(d, oldd);
	  }
	  return Array(a, b, c, d);

	}

	/*
	 * These functions implement the four basic operations the algorithm uses.
	 */
	function md5_cmn(q, a, b, x, s, t)
	{
	  return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s),b);
	}
	function md5_ff(a, b, c, d, x, s, t)
	{
	  return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
	}
	function md5_gg(a, b, c, d, x, s, t)
	{
	  return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
	}
	function md5_hh(a, b, c, d, x, s, t)
	{
	  return md5_cmn(b ^ c ^ d, a, b, x, s, t);
	}
	function md5_ii(a, b, c, d, x, s, t)
	{
	  return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
	}

	/*
	 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
	 * to work around bugs in some JS interpreters.
	 */
	function safe_add(x, y)
	{
	  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
	  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
	  return (msw << 16) | (lsw & 0xFFFF);
	}

	/*
	 * Bitwise rotate a 32-bit number to the left.
	 */
	function bit_rol(num, cnt)
	{
	  return (num << cnt) | (num >>> (32 - cnt));
	}

	module.exports = function md5(buf) {
	  return helpers.hash(buf, core_md5, 16);
	};


/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var intSize = 4;
	var zeroBuffer = new Buffer(intSize); zeroBuffer.fill(0);
	var chrsz = 8;

	function toArray(buf, bigEndian) {
	  if ((buf.length % intSize) !== 0) {
	    var len = buf.length + (intSize - (buf.length % intSize));
	    buf = Buffer.concat([buf, zeroBuffer], len);
	  }

	  var arr = [];
	  var fn = bigEndian ? buf.readInt32BE : buf.readInt32LE;
	  for (var i = 0; i < buf.length; i += intSize) {
	    arr.push(fn.call(buf, i));
	  }
	  return arr;
	}

	function toBuffer(arr, size, bigEndian) {
	  var buf = new Buffer(size);
	  var fn = bigEndian ? buf.writeInt32BE : buf.writeInt32LE;
	  for (var i = 0; i < arr.length; i++) {
	    fn.call(buf, arr[i], i * 4, true);
	  }
	  return buf;
	}

	function hash(buf, fn, hashSize, bigEndian) {
	  if (!Buffer.isBuffer(buf)) buf = new Buffer(buf);
	  var arr = fn(toArray(buf, bigEndian), buf.length * chrsz);
	  return toBuffer(arr, hashSize, bigEndian);
	}

	module.exports = { hash: hash };

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(11).Buffer))

/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {
	module.exports = ripemd160



	/*
	CryptoJS v3.1.2
	code.google.com/p/crypto-js
	(c) 2009-2013 by Jeff Mott. All rights reserved.
	code.google.com/p/crypto-js/wiki/License
	*/
	/** @preserve
	(c) 2012 by Cédric Mesnil. All rights reserved.

	Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

	    - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
	    - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	*/

	// Constants table
	var zl = [
	    0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15,
	    7,  4, 13,  1, 10,  6, 15,  3, 12,  0,  9,  5,  2, 14, 11,  8,
	    3, 10, 14,  4,  9, 15,  8,  1,  2,  7,  0,  6, 13, 11,  5, 12,
	    1,  9, 11, 10,  0,  8, 12,  4, 13,  3,  7, 15, 14,  5,  6,  2,
	    4,  0,  5,  9,  7, 12,  2, 10, 14,  1,  3,  8, 11,  6, 15, 13];
	var zr = [
	    5, 14,  7,  0,  9,  2, 11,  4, 13,  6, 15,  8,  1, 10,  3, 12,
	    6, 11,  3,  7,  0, 13,  5, 10, 14, 15,  8, 12,  4,  9,  1,  2,
	    15,  5,  1,  3,  7, 14,  6,  9, 11,  8, 12,  2, 10,  0,  4, 13,
	    8,  6,  4,  1,  3, 11, 15,  0,  5, 12,  2, 13,  9,  7, 10, 14,
	    12, 15, 10,  4,  1,  5,  8,  7,  6,  2, 13, 14,  0,  3,  9, 11];
	var sl = [
	     11, 14, 15, 12,  5,  8,  7,  9, 11, 13, 14, 15,  6,  7,  9,  8,
	    7, 6,   8, 13, 11,  9,  7, 15,  7, 12, 15,  9, 11,  7, 13, 12,
	    11, 13,  6,  7, 14,  9, 13, 15, 14,  8, 13,  6,  5, 12,  7,  5,
	      11, 12, 14, 15, 14, 15,  9,  8,  9, 14,  5,  6,  8,  6,  5, 12,
	    9, 15,  5, 11,  6,  8, 13, 12,  5, 12, 13, 14, 11,  8,  5,  6 ];
	var sr = [
	    8,  9,  9, 11, 13, 15, 15,  5,  7,  7,  8, 11, 14, 14, 12,  6,
	    9, 13, 15,  7, 12,  8,  9, 11,  7,  7, 12,  7,  6, 15, 13, 11,
	    9,  7, 15, 11,  8,  6,  6, 14, 12, 13,  5, 14, 13, 13,  7,  5,
	    15,  5,  8, 11, 14, 14,  6, 14,  6,  9, 12,  9, 12,  5, 15,  8,
	    8,  5, 12,  9, 12,  5, 14,  6,  8, 13,  6,  5, 15, 13, 11, 11 ];

	var hl =  [ 0x00000000, 0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xA953FD4E];
	var hr =  [ 0x50A28BE6, 0x5C4DD124, 0x6D703EF3, 0x7A6D76E9, 0x00000000];

	var bytesToWords = function (bytes) {
	  var words = [];
	  for (var i = 0, b = 0; i < bytes.length; i++, b += 8) {
	    words[b >>> 5] |= bytes[i] << (24 - b % 32);
	  }
	  return words;
	};

	var wordsToBytes = function (words) {
	  var bytes = [];
	  for (var b = 0; b < words.length * 32; b += 8) {
	    bytes.push((words[b >>> 5] >>> (24 - b % 32)) & 0xFF);
	  }
	  return bytes;
	};

	var processBlock = function (H, M, offset) {

	  // Swap endian
	  for (var i = 0; i < 16; i++) {
	    var offset_i = offset + i;
	    var M_offset_i = M[offset_i];

	    // Swap
	    M[offset_i] = (
	        (((M_offset_i << 8)  | (M_offset_i >>> 24)) & 0x00ff00ff) |
	        (((M_offset_i << 24) | (M_offset_i >>> 8))  & 0xff00ff00)
	    );
	  }

	  // Working variables
	  var al, bl, cl, dl, el;
	  var ar, br, cr, dr, er;

	  ar = al = H[0];
	  br = bl = H[1];
	  cr = cl = H[2];
	  dr = dl = H[3];
	  er = el = H[4];
	  // Computation
	  var t;
	  for (var i = 0; i < 80; i += 1) {
	    t = (al +  M[offset+zl[i]])|0;
	    if (i<16){
	        t +=  f1(bl,cl,dl) + hl[0];
	    } else if (i<32) {
	        t +=  f2(bl,cl,dl) + hl[1];
	    } else if (i<48) {
	        t +=  f3(bl,cl,dl) + hl[2];
	    } else if (i<64) {
	        t +=  f4(bl,cl,dl) + hl[3];
	    } else {// if (i<80) {
	        t +=  f5(bl,cl,dl) + hl[4];
	    }
	    t = t|0;
	    t =  rotl(t,sl[i]);
	    t = (t+el)|0;
	    al = el;
	    el = dl;
	    dl = rotl(cl, 10);
	    cl = bl;
	    bl = t;

	    t = (ar + M[offset+zr[i]])|0;
	    if (i<16){
	        t +=  f5(br,cr,dr) + hr[0];
	    } else if (i<32) {
	        t +=  f4(br,cr,dr) + hr[1];
	    } else if (i<48) {
	        t +=  f3(br,cr,dr) + hr[2];
	    } else if (i<64) {
	        t +=  f2(br,cr,dr) + hr[3];
	    } else {// if (i<80) {
	        t +=  f1(br,cr,dr) + hr[4];
	    }
	    t = t|0;
	    t =  rotl(t,sr[i]) ;
	    t = (t+er)|0;
	    ar = er;
	    er = dr;
	    dr = rotl(cr, 10);
	    cr = br;
	    br = t;
	  }
	  // Intermediate hash value
	  t    = (H[1] + cl + dr)|0;
	  H[1] = (H[2] + dl + er)|0;
	  H[2] = (H[3] + el + ar)|0;
	  H[3] = (H[4] + al + br)|0;
	  H[4] = (H[0] + bl + cr)|0;
	  H[0] =  t;
	};

	function f1(x, y, z) {
	  return ((x) ^ (y) ^ (z));
	}

	function f2(x, y, z) {
	  return (((x)&(y)) | ((~x)&(z)));
	}

	function f3(x, y, z) {
	  return (((x) | (~(y))) ^ (z));
	}

	function f4(x, y, z) {
	  return (((x) & (z)) | ((y)&(~(z))));
	}

	function f5(x, y, z) {
	  return ((x) ^ ((y) |(~(z))));
	}

	function rotl(x,n) {
	  return (x<<n) | (x>>>(32-n));
	}

	function ripemd160(message) {
	  var H = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0];

	  if (typeof message == 'string')
	    message = new Buffer(message, 'utf8');

	  var m = bytesToWords(message);

	  var nBitsLeft = message.length * 8;
	  var nBitsTotal = message.length * 8;

	  // Add padding
	  m[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
	  m[(((nBitsLeft + 64) >>> 9) << 4) + 14] = (
	      (((nBitsTotal << 8)  | (nBitsTotal >>> 24)) & 0x00ff00ff) |
	      (((nBitsTotal << 24) | (nBitsTotal >>> 8))  & 0xff00ff00)
	  );

	  for (var i=0 ; i<m.length; i += 16) {
	    processBlock(H, m, i);
	  }

	  // Swap endian
	  for (var i = 0; i < 5; i++) {
	      // Shortcut
	    var H_i = H[i];

	    // Swap
	    H[i] = (((H_i << 8)  | (H_i >>> 24)) & 0x00ff00ff) |
	          (((H_i << 24) | (H_i >>> 8))  & 0xff00ff00);
	  }

	  var digestbytes = wordsToBytes(H);
	  return new Buffer(digestbytes);
	}



	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(11).Buffer))

/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var createHash = __webpack_require__(17)

	var zeroBuffer = new Buffer(128)
	zeroBuffer.fill(0)

	module.exports = Hmac

	function Hmac (alg, key) {
	  if(!(this instanceof Hmac)) return new Hmac(alg, key)
	  this._opad = opad
	  this._alg = alg

	  var blocksize = (alg === 'sha512') ? 128 : 64

	  key = this._key = !Buffer.isBuffer(key) ? new Buffer(key) : key

	  if(key.length > blocksize) {
	    key = createHash(alg).update(key).digest()
	  } else if(key.length < blocksize) {
	    key = Buffer.concat([key, zeroBuffer], blocksize)
	  }

	  var ipad = this._ipad = new Buffer(blocksize)
	  var opad = this._opad = new Buffer(blocksize)

	  for(var i = 0; i < blocksize; i++) {
	    ipad[i] = key[i] ^ 0x36
	    opad[i] = key[i] ^ 0x5C
	  }

	  this._hash = createHash(alg).update(ipad)
	}

	Hmac.prototype.update = function (data, enc) {
	  this._hash.update(data, enc)
	  return this
	}

	Hmac.prototype.digest = function (enc) {
	  var h = this._hash.digest()
	  return createHash(this._alg).update(this._opad).update(h).digest(enc)
	}


	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(11).Buffer))

/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	var pbkdf2Export = __webpack_require__(31)

	module.exports = function (crypto, exports) {
	  exports = exports || {}

	  var exported = pbkdf2Export(crypto)

	  exports.pbkdf2 = exported.pbkdf2
	  exports.pbkdf2Sync = exported.pbkdf2Sync

	  return exports
	}


/***/ },
/* 31 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {module.exports = function(crypto) {
	  function pbkdf2(password, salt, iterations, keylen, digest, callback) {
	    if ('function' === typeof digest) {
	      callback = digest
	      digest = undefined
	    }

	    if ('function' !== typeof callback)
	      throw new Error('No callback provided to pbkdf2')

	    setTimeout(function() {
	      var result

	      try {
	        result = pbkdf2Sync(password, salt, iterations, keylen, digest)
	      } catch (e) {
	        return callback(e)
	      }

	      callback(undefined, result)
	    })
	  }

	  function pbkdf2Sync(password, salt, iterations, keylen, digest) {
	    if ('number' !== typeof iterations)
	      throw new TypeError('Iterations not a number')

	    if (iterations < 0)
	      throw new TypeError('Bad iterations')

	    if ('number' !== typeof keylen)
	      throw new TypeError('Key length not a number')

	    if (keylen < 0)
	      throw new TypeError('Bad key length')

	    digest = digest || 'sha1'

	    if (!Buffer.isBuffer(password)) password = new Buffer(password)
	    if (!Buffer.isBuffer(salt)) salt = new Buffer(salt)

	    var hLen, l = 1, r, T
	    var DK = new Buffer(keylen)
	    var block1 = new Buffer(salt.length + 4)
	    salt.copy(block1, 0, 0, salt.length)

	    for (var i = 1; i <= l; i++) {
	      block1.writeUInt32BE(i, salt.length)

	      var U = crypto.createHmac(digest, password).update(block1).digest()

	      if (!hLen) {
	        hLen = U.length
	        T = new Buffer(hLen)
	        l = Math.ceil(keylen / hLen)
	        r = keylen - (l - 1) * hLen

	        if (keylen > (Math.pow(2, 32) - 1) * hLen)
	          throw new TypeError('keylen exceeds maximum length')
	      }

	      U.copy(T, 0, 0, hLen)

	      for (var j = 1; j < iterations; j++) {
	        U = crypto.createHmac(digest, password).update(U).digest()

	        for (var k = 0; k < hLen; k++) {
	          T[k] ^= U[k]
	        }
	      }

	      var destPos = (i - 1) * hLen
	      var len = (i == l ? r : hLen)
	      T.copy(DK, destPos, 0, len)
	    }

	    return DK
	  }

	  return {
	    pbkdf2: pbkdf2,
	    pbkdf2Sync: pbkdf2Sync
	  }
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(11).Buffer))

/***/ },
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	var map = {
		"./api_loader": 33,
		"./api_loader.js": 33,
		"./aws": 35,
		"./aws.js": 35,
		"./browser": 7,
		"./browser.js": 7,
		"./config": 90,
		"./config.js": 90,
		"./core": 8,
		"./core.js": 8,
		"./credentials": 91,
		"./credentials.js": 91,
		"./credentials/cognito_identity_credentials": 93,
		"./credentials/cognito_identity_credentials.js": 93,
		"./credentials/credential_provider_chain": 92,
		"./credentials/credential_provider_chain.js": 92,
		"./credentials/ec2_metadata_credentials": 85,
		"./credentials/ec2_metadata_credentials.js": 85,
		"./credentials/environment_credentials": 87,
		"./credentials/environment_credentials.js": 87,
		"./credentials/file_system_credentials": 88,
		"./credentials/file_system_credentials.js": 88,
		"./credentials/saml_credentials": 94,
		"./credentials/saml_credentials.js": 94,
		"./credentials/shared_ini_file_credentials": 89,
		"./credentials/shared_ini_file_credentials.js": 89,
		"./credentials/temporary_credentials": 95,
		"./credentials/temporary_credentials.js": 95,
		"./credentials/web_identity_credentials": 96,
		"./credentials/web_identity_credentials.js": 96,
		"./event_listeners": 97,
		"./event_listeners.js": 97,
		"./http": 60,
		"./http.js": 60,
		"./http/node": 59,
		"./http/node.js": 59,
		"./http/xhr": 107,
		"./http/xhr.js": 107,
		"./json/builder": 100,
		"./json/builder.js": 100,
		"./json/parser": 101,
		"./json/parser.js": 101,
		"./metadata_service": 86,
		"./metadata_service.js": 86,
		"./model/api": 108,
		"./model/api.js": 108,
		"./model/collection": 38,
		"./model/collection.js": 38,
		"./model/operation": 109,
		"./model/operation.js": 109,
		"./model/paginator": 110,
		"./model/paginator.js": 110,
		"./model/resource_waiter": 111,
		"./model/resource_waiter.js": 111,
		"./model/shape": 37,
		"./model/shape.js": 37,
		"./param_validator": 112,
		"./param_validator.js": 112,
		"./protocol/json": 99,
		"./protocol/json.js": 99,
		"./protocol/query": 105,
		"./protocol/query.js": 105,
		"./protocol/rest": 102,
		"./protocol/rest.js": 102,
		"./protocol/rest_json": 103,
		"./protocol/rest_json.js": 103,
		"./protocol/rest_xml": 104,
		"./protocol/rest_xml.js": 104,
		"./query/query_param_serializer": 106,
		"./query/query_param_serializer.js": 106,
		"./region_config": 113,
		"./region_config.js": 113,
		"./request": 115,
		"./request.js": 115,
		"./resource_waiter": 117,
		"./resource_waiter.js": 117,
		"./response": 118,
		"./response.js": 118,
		"./sequential_executor": 98,
		"./sequential_executor.js": 98,
		"./service": 119,
		"./service.js": 119,
		"./services": 73,
		"./services.js": 73,
		"./services/cloudsearchdomain": 75,
		"./services/cloudsearchdomain.js": 75,
		"./services/cognitoidentity": 76,
		"./services/cognitoidentity.js": 76,
		"./services/dynamodb": 77,
		"./services/dynamodb.js": 77,
		"./services/ec2": 78,
		"./services/ec2.js": 78,
		"./services/glacier": 79,
		"./services/glacier.js": 79,
		"./services/route53": 80,
		"./services/route53.js": 80,
		"./services/s3": 81,
		"./services/s3.js": 81,
		"./services/sqs": 82,
		"./services/sqs.js": 82,
		"./services/sts": 83,
		"./services/sts.js": 83,
		"./services/swf": 84,
		"./services/swf.js": 84,
		"./signers/presign": 120,
		"./signers/presign.js": 120,
		"./signers/request_signer": 121,
		"./signers/request_signer.js": 121,
		"./signers/s3": 126,
		"./signers/s3.js": 126,
		"./signers/v2": 122,
		"./signers/v2.js": 122,
		"./signers/v3": 123,
		"./signers/v3.js": 123,
		"./signers/v3https": 124,
		"./signers/v3https.js": 124,
		"./signers/v4": 125,
		"./signers/v4.js": 125,
		"./state_machine": 116,
		"./state_machine.js": 116,
		"./util": 9,
		"./util.js": 9,
		"./xml/browser_parser": 127,
		"./xml/browser_parser.js": 127,
		"./xml/builder": 128,
		"./xml/builder.js": 128,
		"./xml/node_parser": 36,
		"./xml/node_parser.js": 36
	};
	function webpackContext(req) {
		return __webpack_require__(webpackContextResolve(req));
	};
	function webpackContextResolve(req) {
		return map[req] || (function() { throw new Error("Cannot find module '" + req + "'.") }());
	};
	webpackContext.keys = function webpackContextKeys() {
		return Object.keys(map);
	};
	webpackContext.resolve = webpackContextResolve;
	module.exports = webpackContext;
	webpackContext.id = 32;


/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(__dirname) {var fs = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"fs\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
	var path = __webpack_require__(34);

	var apiRoot = path.join(__dirname, '..', 'apis');
	var serviceMap = null;
	var serviceIdentifiers = [];
	var serviceNames = [];

	function buildServiceMap() {
	  if (serviceMap !== null) return;

	  // load info file for API metadata
	  serviceMap = __webpack_require__(32)(path.join(apiRoot, 'metadata.json'));

	  var prefixMap = {};
	  Object.keys(serviceMap).forEach(function(identifier) {
	    serviceMap[identifier].prefix = serviceMap[identifier].prefix || identifier;
	    prefixMap[serviceMap[identifier].prefix] = identifier;
	  });

	  fs.readdirSync(apiRoot).forEach(function (file) {
	    var match = file.match(/^(.+?)-(\d+-\d+-\d+)\.(normal|min)\.json$/);
	    if (match) {
	      var id = prefixMap[match[1]], version = match[2];
	      if (serviceMap[id]) {
	        serviceMap[id].versions = serviceMap[id].versions || [];
	        if (serviceMap[id].versions.indexOf(version) < 0) {
	          serviceMap[id].versions.push(version);
	        }
	      }
	    }
	  });

	  Object.keys(serviceMap).forEach(function(identifier) {
	    serviceMap[identifier].versions = serviceMap[identifier].versions.sort();
	    serviceIdentifiers.push(identifier);
	    serviceNames.push(serviceMap[identifier].name);
	  });
	}

	function getServices() {
	  buildServiceMap();
	  return serviceIdentifiers;
	}

	function getServiceNames() {
	  buildServiceMap();
	  return serviceNames;
	}

	function serviceVersions(svc) {
	  buildServiceMap();
	  svc = serviceIdentifier(svc);
	  return serviceMap[svc] ? serviceMap[svc].versions : null;
	}

	function serviceName(svc) {
	  buildServiceMap();
	  svc = serviceIdentifier(svc);
	  return serviceMap[svc] ? serviceMap[svc].name : null;
	}

	function serviceFile(svc, version) {
	  buildServiceMap();
	  svc = serviceIdentifier(svc);
	  if (!serviceMap[svc]) return null;

	  var prefix = serviceMap[svc].prefix || svc;
	  var filePath;
	  ['min', 'api', 'normal'].some(function(testSuffix) {
	    filePath = apiRoot + '/' + prefix.toLowerCase() + '-' + version + '.' +
	           testSuffix + '.json';

	    return fs.existsSync(filePath);
	  });
	  return filePath;
	}

	function paginatorsFile(svc, version) {
	  buildServiceMap();
	  svc = serviceIdentifier(svc);
	  if (!serviceMap[svc]) return null;

	  var prefix = serviceMap[svc].prefix || svc;
	  return apiRoot + '/' + prefix + '-' + version + '.paginators.json';
	}

	function waitersFile(svc, version) {
	  buildServiceMap();
	  svc = serviceIdentifier(svc);
	  if (!serviceMap[svc]) return null;

	  var prefix = serviceMap[svc].prefix || svc;
	  return apiRoot + '/' + prefix + '-' + version + '.waiters.json';
	}

	function load(svc, version) {
	  buildServiceMap();
	  svc = serviceIdentifier(svc);
	  if (version === 'latest') version = null;
	  version = version || serviceMap[svc].versions[serviceMap[svc].versions.length - 1];
	  if (!serviceMap[svc]) return null;

	  var api = __webpack_require__(32)(serviceFile(svc, version));

	  // Try to load paginators
	  if (fs.existsSync(paginatorsFile(svc, version))) {
	    var paginators = __webpack_require__(32)(paginatorsFile(svc, version));
	    api.paginators = paginators.pagination;
	  }

	  // Try to load waiters
	  if (fs.existsSync(waitersFile(svc, version))) {
	    var waiters = __webpack_require__(32)(waitersFile(svc, version));
	    api.waiters = waiters.waiters;
	  }

	  return api;
	}

	function serviceIdentifier(svc) {
	  return svc.toLowerCase();
	}

	module.exports = {
	  serviceVersions: serviceVersions,
	  serviceName: serviceName,
	  serviceIdentifier: serviceIdentifier,
	  serviceFile: serviceFile,
	  load: load
	};

	Object.defineProperty(module.exports, 'services', {
	  enumerable: true, get: getServices
	});

	Object.defineProperty(module.exports, 'serviceNames', {
	  enumerable: true, get: getServiceNames
	});

	/* WEBPACK VAR INJECTION */}.call(exports, "/"))

/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	// resolves . and .. elements in a path array with directory names there
	// must be no slashes, empty elements, or device names (c:\) in the array
	// (so also no leading and trailing slashes - it does not distinguish
	// relative and absolute paths)
	function normalizeArray(parts, allowAboveRoot) {
	  // if the path tries to go above the root, `up` ends up > 0
	  var up = 0;
	  for (var i = parts.length - 1; i >= 0; i--) {
	    var last = parts[i];
	    if (last === '.') {
	      parts.splice(i, 1);
	    } else if (last === '..') {
	      parts.splice(i, 1);
	      up++;
	    } else if (up) {
	      parts.splice(i, 1);
	      up--;
	    }
	  }

	  // if the path is allowed to go above the root, restore leading ..s
	  if (allowAboveRoot) {
	    for (; up--; up) {
	      parts.unshift('..');
	    }
	  }

	  return parts;
	}

	// Split a filename into [root, dir, basename, ext], unix version
	// 'root' is just a slash, or nothing.
	var splitPathRe =
	    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
	var splitPath = function(filename) {
	  return splitPathRe.exec(filename).slice(1);
	};

	// path.resolve([from ...], to)
	// posix version
	exports.resolve = function() {
	  var resolvedPath = '',
	      resolvedAbsolute = false;

	  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
	    var path = (i >= 0) ? arguments[i] : process.cwd();

	    // Skip empty and invalid entries
	    if (typeof path !== 'string') {
	      throw new TypeError('Arguments to path.resolve must be strings');
	    } else if (!path) {
	      continue;
	    }

	    resolvedPath = path + '/' + resolvedPath;
	    resolvedAbsolute = path.charAt(0) === '/';
	  }

	  // At this point the path should be resolved to a full absolute path, but
	  // handle relative paths to be safe (might happen when process.cwd() fails)

	  // Normalize the path
	  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
	    return !!p;
	  }), !resolvedAbsolute).join('/');

	  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
	};

	// path.normalize(path)
	// posix version
	exports.normalize = function(path) {
	  var isAbsolute = exports.isAbsolute(path),
	      trailingSlash = substr(path, -1) === '/';

	  // Normalize the path
	  path = normalizeArray(filter(path.split('/'), function(p) {
	    return !!p;
	  }), !isAbsolute).join('/');

	  if (!path && !isAbsolute) {
	    path = '.';
	  }
	  if (path && trailingSlash) {
	    path += '/';
	  }

	  return (isAbsolute ? '/' : '') + path;
	};

	// posix version
	exports.isAbsolute = function(path) {
	  return path.charAt(0) === '/';
	};

	// posix version
	exports.join = function() {
	  var paths = Array.prototype.slice.call(arguments, 0);
	  return exports.normalize(filter(paths, function(p, index) {
	    if (typeof p !== 'string') {
	      throw new TypeError('Arguments to path.join must be strings');
	    }
	    return p;
	  }).join('/'));
	};


	// path.relative(from, to)
	// posix version
	exports.relative = function(from, to) {
	  from = exports.resolve(from).substr(1);
	  to = exports.resolve(to).substr(1);

	  function trim(arr) {
	    var start = 0;
	    for (; start < arr.length; start++) {
	      if (arr[start] !== '') break;
	    }

	    var end = arr.length - 1;
	    for (; end >= 0; end--) {
	      if (arr[end] !== '') break;
	    }

	    if (start > end) return [];
	    return arr.slice(start, end - start + 1);
	  }

	  var fromParts = trim(from.split('/'));
	  var toParts = trim(to.split('/'));

	  var length = Math.min(fromParts.length, toParts.length);
	  var samePartsLength = length;
	  for (var i = 0; i < length; i++) {
	    if (fromParts[i] !== toParts[i]) {
	      samePartsLength = i;
	      break;
	    }
	  }

	  var outputParts = [];
	  for (var i = samePartsLength; i < fromParts.length; i++) {
	    outputParts.push('..');
	  }

	  outputParts = outputParts.concat(toParts.slice(samePartsLength));

	  return outputParts.join('/');
	};

	exports.sep = '/';
	exports.delimiter = ':';

	exports.dirname = function(path) {
	  var result = splitPath(path),
	      root = result[0],
	      dir = result[1];

	  if (!root && !dir) {
	    // No dirname whatsoever
	    return '.';
	  }

	  if (dir) {
	    // It has a dirname, strip trailing slash
	    dir = dir.substr(0, dir.length - 1);
	  }

	  return root + dir;
	};


	exports.basename = function(path, ext) {
	  var f = splitPath(path)[2];
	  // TODO: make this comparison case-insensitive on windows?
	  if (ext && f.substr(-1 * ext.length) === ext) {
	    f = f.substr(0, f.length - ext.length);
	  }
	  return f;
	};


	exports.extname = function(path) {
	  return splitPath(path)[3];
	};

	function filter (xs, f) {
	    if (xs.filter) return xs.filter(f);
	    var res = [];
	    for (var i = 0; i < xs.length; i++) {
	        if (f(xs[i], i, xs)) res.push(xs[i]);
	    }
	    return res;
	}

	// String.prototype.substr - negative index don't work in IE8
	var substr = 'ab'.substr(-1) === 'b'
	    ? function (str, start, len) { return str.substr(start, len) }
	    : function (str, start, len) {
	        if (start < 0) start = str.length + start;
	        return str.substr(start, len);
	    }
	;

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)))

/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {var AWS = __webpack_require__(8);
	module.exports = AWS;

	// Use default API loader function
	AWS.apiLoader = __webpack_require__(33).load;

	// Load the xml2js XML parser
	AWS.XML.Parser = __webpack_require__(36);

	// Load Node HTTP client
	__webpack_require__(59);

	// Load all service classes
	__webpack_require__(73);

	// Load custom credential providers
	__webpack_require__(85);
	__webpack_require__(87);
	__webpack_require__(88);
	__webpack_require__(89);

	// Setup default chain providers
	AWS.CredentialProviderChain.defaultProviders = [
	  function () { return new AWS.EnvironmentCredentials('AWS'); },
	  function () { return new AWS.EnvironmentCredentials('AMAZON'); },
	  function () { return new AWS.SharedIniFileCredentials(); },
	  function () { return new AWS.EC2MetadataCredentials(); }
	];

	// Update configuration keys
	AWS.util.update(AWS.Config.prototype.keys, {
	  credentials: function () {
	    var credentials = null;
	    new AWS.CredentialProviderChain([
	      function () { return new AWS.EnvironmentCredentials('AWS'); },
	      function () { return new AWS.EnvironmentCredentials('AMAZON'); },
	      function () { return new AWS.SharedIniFileCredentials(); }
	    ]).resolve(function(err, creds) {
	      if (!err) credentials = creds;
	    });
	    return credentials;
	  },
	  credentialProvider: function() {
	    return new AWS.CredentialProviderChain();
	  },
	  region: function() {
	    return process.env.AWS_REGION || process.env.AMAZON_REGION;
	  }
	});

	// Reset configuration
	AWS.config = new AWS.Config();

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)))

/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	var util = __webpack_require__(9);
	var Shape = __webpack_require__(37);

	var xml2js = __webpack_require__(39);

	/**
	 * @api private
	 */
	var options = {  // options passed to xml2js parser
	  explicitCharkey: false, // undocumented
	  trim: false,            // trim the leading/trailing whitespace from text nodes
	  normalize: false,       // trim interior whitespace inside text nodes
	  explicitRoot: false,    // return the root node in the resulting object?
	  emptyTag: null,         // the default value for empty nodes
	  explicitArray: true,    // always put child nodes in an array
	  ignoreAttrs: false,     // ignore attributes, only create text nodes
	  mergeAttrs: false,      // merge attributes and child elements
	  validator: null         // a callable validator
	};

	function NodeXmlParser() { }

	NodeXmlParser.prototype.parse = function(xml, shape) {
	  shape = shape || {};

	  var result = null;
	  var error = null;

	  var parser = new xml2js.Parser(options);
	  parser.parseString(xml, function (e, r) {
	    error = e;
	    result = r;
	  });

	  if (result) {
	    var data = parseXml(result, shape);
	    if (result.ResponseMetadata) {
	      data.ResponseMetadata = parseXml(result.ResponseMetadata[0], {});
	    }
	    return data;
	  } else if (error) {
	    throw util.error(error, {code: 'XMLParserError'});
	  } else { // empty xml document
	    return parseXml({}, shape);
	  }
	};

	function parseXml(xml, shape) {
	  switch (shape.type) {
	    case 'structure': return parseStructure(xml, shape);
	    case 'map': return parseMap(xml, shape);
	    case 'list': return parseList(xml, shape);
	    case undefined: case null: return parseUnknown(xml);
	    default: return parseScalar(xml, shape);
	  }
	}

	function parseStructure(xml, shape) {
	  var data = {};
	  if (xml === null) return data;

	  util.each(shape.members, function(memberName, memberShape) {
	    var xmlName = memberShape.name;
	    if (xml.hasOwnProperty(xmlName) && Array.isArray(xml[xmlName])) {
	      var xmlChild = xml[xmlName];
	      if (!memberShape.flattened) xmlChild = xmlChild[0];

	      data[memberName] = parseXml(xmlChild, memberShape);
	    } else if (memberShape.isXmlAttribute &&
	               xml.$ && xml.$.hasOwnProperty(xmlName)) {
	      data[memberName] = parseScalar(xml.$[xmlName], memberShape);
	    } else if (memberShape.type === 'list') {
	      data[memberName] = memberShape.defaultValue;
	    }
	  });

	  return data;
	}

	function parseMap(xml, shape) {
	  var data = {};
	  var xmlKey = shape.key.name || 'key';
	  var xmlValue = shape.value.name || 'value';
	  var iterable = shape.flattened ? xml : xml.entry;

	  if (Array.isArray(iterable)) {
	    util.arrayEach(iterable, function(child) {
	      data[child[xmlKey][0]] = parseXml(child[xmlValue][0], shape.value);
	    });
	  }

	  return data;
	}

	function parseList(xml, shape) {
	  var data = [];
	  var name = shape.member.name || 'member';
	  if (shape.flattened) {
	    util.arrayEach(xml, function(xmlChild) {
	      data.push(parseXml(xmlChild, shape.member));
	    });
	  } else if (xml && Array.isArray(xml[name])) {
	    util.arrayEach(xml[name], function(child) {
	      data.push(parseXml(child, shape.member));
	    });
	  }

	  return data;
	}

	function parseScalar(text, shape) {
	  if (text && text.$ && text.$.encoding === 'base64') {
	    shape = new Shape.create({type: text.$.encoding});
	  }
	  if (text && text._) text = text._;

	  if (typeof shape.toType === 'function') {
	    return shape.toType(text);
	  } else {
	    return text;
	  }
	}

	function parseUnknown(xml) {
	  if (xml === undefined || xml === null) return '';
	  if (typeof xml === 'string') return xml;

	  // parse a list
	  if (Array.isArray(xml)) {
	    var arr = [];
	    for (i = 0; i < xml.length; i++) {
	      arr.push(parseXml(xml[i], {}));
	    }
	    return arr;
	  }

	  // empty object
	  var keys = Object.keys(xml), i;
	  if (keys.length === 0 || keys === ['$']) {
	    return {};
	  }

	  // object, parse as structure
	  var data = {};
	  for (i = 0; i < keys.length; i++) {
	    var key = keys[i], value = xml[key];
	    if (key === '$') continue;
	    if (value.length > 1) { // this member is a list
	      data[key] = parseList(value, {member: {}});
	    } else { // this member is a single item
	      data[key] = parseXml(value[0], {});
	    }
	  }
	  return data;
	}

	module.exports = NodeXmlParser;


/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	var Collection = __webpack_require__(38);

	var util = __webpack_require__(9);

	function property(obj, name, value) {
	  if (value !== null && value !== undefined) {
	    util.property.apply(this, arguments);
	  }
	}

	function memoizedProperty(obj, name) {
	  if (!obj.constructor.prototype[name]) {
	    util.memoizedProperty.apply(this, arguments);
	  }
	}

	function Shape(shape, options, memberName) {
	  options = options || {};

	  property(this, 'shape', shape.shape);
	  property(this, 'api', options.api, false);
	  property(this, 'type', shape.type);
	  property(this, 'location', shape.location || 'body');
	  property(this, 'name', this.name || shape.xmlName || shape.queryName ||
	    shape.locationName || memberName);
	  property(this, 'isStreaming', shape.streaming || false);
	  property(this, 'isComposite', shape.isComposite || false);
	  property(this, 'isShape', true, false);
	  property(this, 'isQueryName', shape.queryName ? true : false, false);

	  if (options.documentation) {
	    property(this, 'documentation', shape.documentation);
	    property(this, 'documentationUrl', shape.documentationUrl);
	  }

	  if (shape.xmlAttribute) {
	    property(this, 'isXmlAttribute', shape.xmlAttribute || false);
	  }

	  // type conversion and parsing
	  property(this, 'defaultValue', null);
	  this.toWireFormat = function(value) {
	    if (value === null || value === undefined) return '';
	    return value;
	  };
	  this.toType = function(value) { return value; };
	}

	/**
	 * @api private
	 */
	Shape.normalizedTypes = {
	  character: 'string',
	  double: 'float',
	  long: 'integer',
	  short: 'integer',
	  biginteger: 'integer',
	  bigdecimal: 'float',
	  blob: 'binary'
	};

	/**
	 * @api private
	 */
	Shape.types = {
	  'structure': StructureShape,
	  'list': ListShape,
	  'map': MapShape,
	  'boolean': BooleanShape,
	  'timestamp': TimestampShape,
	  'float': FloatShape,
	  'integer': IntegerShape,
	  'string': StringShape,
	  'base64': Base64Shape,
	  'binary': BinaryShape
	};

	Shape.resolve = function resolve(shape, options) {
	  if (shape.shape) {
	    var refShape = options.api.shapes[shape.shape];
	    if (!refShape) {
	      throw new Error('Cannot find shape reference: ' + shape.shape);
	    }

	    return refShape;
	  } else {
	    return null;
	  }
	};

	Shape.create = function create(shape, options, memberName) {
	  if (shape.isShape) return shape;

	  var refShape = Shape.resolve(shape, options);
	  if (refShape) {
	    var filteredKeys = Object.keys(shape);
	    if (!options.documentation) {
	      filteredKeys = filteredKeys.filter(function(name) {
	        return !name.match(/documentation/);
	      });
	    }
	    if (filteredKeys === ['shape']) { // no inline customizations
	      return refShape;
	    }

	    // create an inline shape with extra members
	    var InlineShape = function() {
	      refShape.constructor.call(this, shape, options, memberName);
	    };
	    InlineShape.prototype = refShape;
	    return new InlineShape();
	  } else {
	    // set type if not set
	    if (!shape.type) {
	      if (shape.members) shape.type = 'structure';
	      else if (shape.member) shape.type = 'list';
	      else if (shape.key) shape.type = 'map';
	      else shape.type = 'string';
	    }

	    // normalize types
	    var origType = shape.type;
	    if (Shape.normalizedTypes[shape.type]) {
	      shape.type = Shape.normalizedTypes[shape.type];
	    }

	    if (Shape.types[shape.type]) {
	      return new Shape.types[shape.type](shape, options, memberName);
	    } else {
	      throw new Error('Unrecognized shape type: ' + origType);
	    }
	  }
	};

	function CompositeShape(shape) {
	  Shape.apply(this, arguments);
	  property(this, 'isComposite', true);

	  if (shape.flattened) {
	    property(this, 'flattened', shape.flattened || false);
	  }
	}

	function StructureShape(shape, options) {
	  var requiredMap = null, firstInit = !this.isShape;

	  CompositeShape.apply(this, arguments);

	  if (firstInit) {
	    property(this, 'defaultValue', function() { return {}; });
	    property(this, 'members', {});
	    property(this, 'memberNames', []);
	    property(this, 'required', []);
	    property(this, 'isRequired', function() { return false; });
	  }

	  if (shape.members) {
	    property(this, 'members', new Collection(shape.members, options, function(name, member) {
	      return Shape.create(member, options, name);
	    }));
	    memoizedProperty(this, 'memberNames', function() {
	      return shape.xmlOrder || Object.keys(shape.members);
	    });
	  }

	  if (shape.required) {
	    property(this, 'required', shape.required);
	    property(this, 'isRequired', function(name) {
	      if (!requiredMap) {
	        requiredMap = {};
	        for (var i = 0; i < shape.required.length; i++) {
	          requiredMap[shape.required[i]] = true;
	        }
	      }

	      return requiredMap[name];
	    }, false, true);
	  }

	  property(this, 'resultWrapper', shape.resultWrapper || null);

	  if (shape.payload) {
	    property(this, 'payload', shape.payload);
	  }

	  if (typeof shape.xmlNamespace === 'string') {
	    property(this, 'xmlNamespaceUri', shape.xmlNamespace);
	  } else if (typeof shape.xmlNamespace === 'object') {
	    property(this, 'xmlNamespacePrefix', shape.xmlNamespace.prefix);
	    property(this, 'xmlNamespaceUri', shape.xmlNamespace.uri);
	  }
	}

	function ListShape(shape, options) {
	  var self = this, firstInit = !this.isShape;
	  CompositeShape.apply(this, arguments);

	  if (firstInit) {
	    property(this, 'defaultValue', function() { return []; });
	  }

	  if (shape.member) {
	    memoizedProperty(this, 'member', function() {
	      return Shape.create(shape.member, options);
	    });
	  }

	  if (this.flattened) {
	    var oldName = this.name;
	    memoizedProperty(this, 'name', function() {
	      return self.member.name || oldName;
	    });
	  }
	}

	function MapShape(shape, options) {
	  var firstInit = !this.isShape;
	  CompositeShape.apply(this, arguments);

	  if (firstInit) {
	    property(this, 'defaultValue', function() { return {}; });
	    property(this, 'key', Shape.create({type: 'string'}, options));
	    property(this, 'value', Shape.create({type: 'string'}, options));
	  }

	  if (shape.key) {
	    memoizedProperty(this, 'key', function() {
	      return Shape.create(shape.key, options);
	    });
	  }
	  if (shape.value) {
	    memoizedProperty(this, 'value', function() {
	      return Shape.create(shape.value, options);
	    });
	  }
	}

	function TimestampShape(shape) {
	  var self = this;
	  Shape.apply(this, arguments);

	  if (this.location === 'header') {
	    property(this, 'timestampFormat', 'rfc822');
	  } else if (shape.timestampFormat) {
	    property(this, 'timestampFormat', shape.timestampFormat);
	  } else if (this.api) {
	    if (this.api.timestampFormat) {
	      property(this, 'timestampFormat', this.api.timestampFormat);
	    } else {
	      switch (this.api.protocol) {
	        case 'json':
	        case 'rest-json':
	          property(this, 'timestampFormat', 'unixTimestamp');
	          break;
	        case 'rest-xml':
	        case 'query':
	        case 'ec2':
	          property(this, 'timestampFormat', 'iso8601');
	          break;
	      }
	    }
	  }

	  this.toType = function(value) {
	    if (value === null || value === undefined) return null;
	    if (typeof value.toUTCString === 'function') return value;
	    return typeof value === 'string' || typeof value === 'number' ?
	           util.date.parseTimestamp(value) : null;
	  };

	  this.toWireFormat = function(value) {
	    return util.date.format(value, self.timestampFormat);
	  };
	}

	function StringShape() {
	  Shape.apply(this, arguments);

	  if (this.api) {
	    switch (this.api.protocol) {
	      case 'rest-xml':
	      case 'query':
	      case 'ec2':
	        this.toType = function(value) { return value || ''; };
	    }
	  }
	}

	function FloatShape() {
	  Shape.apply(this, arguments);

	  this.toType = function(value) {
	    if (value === null || value === undefined) return null;
	    return parseFloat(value);
	  };
	  this.toWireFormat = this.toType;
	}

	function IntegerShape() {
	  Shape.apply(this, arguments);

	  this.toType = function(value) {
	    if (value === null || value === undefined) return null;
	    return parseInt(value, 10);
	  };
	  this.toWireFormat = this.toType;
	}

	function BinaryShape() {
	  Shape.apply(this, arguments);
	  this.toType = util.base64.decode;
	  this.toWireFormat = util.base64.encode;
	}

	function Base64Shape() {
	  BinaryShape.apply(this, arguments);
	}

	function BooleanShape() {
	  Shape.apply(this, arguments);

	  this.toType = function(value) {
	    if (typeof value === 'boolean') return value;
	    if (value === null || value === undefined) return null;
	    return value === 'true';
	  };
	}

	/**
	 * @api private
	 */
	Shape.shapes = {
	  StructureShape: StructureShape,
	  ListShape: ListShape,
	  MapShape: MapShape,
	  StringShape: StringShape,
	  BooleanShape: BooleanShape,
	  Base64Shape: Base64Shape
	};

	module.exports = Shape;


/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	var memoizedProperty = __webpack_require__(9).memoizedProperty;

	function memoize(name, value, fn, nameTr) {
	  memoizedProperty(this, nameTr(name), function() {
	    return fn(name, value);
	  });
	}

	function Collection(iterable, options, fn, nameTr) {
	  nameTr = nameTr || String;
	  var self = this;

	  for (var id in iterable) {
	    if (iterable.hasOwnProperty(id)) {
	      memoize.call(self, id, iterable[id], fn, nameTr);
	    }
	  }
	}

	module.exports = Collection;


/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {// Generated by CoffeeScript 1.5.0
	(function() {
	  var events, isEmpty, sax,
	    __hasProp = {}.hasOwnProperty,
	    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
	    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

	  sax = __webpack_require__(40);

	  events = __webpack_require__(42);

	  isEmpty = function(thing) {
	    return typeof thing === "object" && (thing != null) && Object.keys(thing).length === 0;
	  };

	  exports.defaults = {
	    "0.1": {
	      explicitCharkey: false,
	      trim: true,
	      normalize: true,
	      normalizeTags: false,
	      attrkey: "@",
	      charkey: "#",
	      explicitArray: false,
	      ignoreAttrs: false,
	      mergeAttrs: false,
	      explicitRoot: false,
	      validator: null,
	      xmlns: false,
	      explicitChildren: false,
	      childkey: '@@',
	      charsAsChildren: false,
	      async: false
	    },
	    "0.2": {
	      explicitCharkey: false,
	      trim: false,
	      normalize: false,
	      normalizeTags: false,
	      attrkey: "$",
	      charkey: "_",
	      explicitArray: true,
	      ignoreAttrs: false,
	      mergeAttrs: false,
	      explicitRoot: true,
	      validator: null,
	      xmlns: false,
	      explicitChildren: false,
	      childkey: '$$',
	      charsAsChildren: false,
	      async: false
	    }
	  };

	  exports.ValidationError = (function(_super) {

	    __extends(ValidationError, _super);

	    function ValidationError(message) {
	      this.message = message;
	    }

	    return ValidationError;

	  })(Error);

	  exports.Parser = (function(_super) {

	    __extends(Parser, _super);

	    function Parser(opts) {
	      this.parseString = __bind(this.parseString, this);
	      this.reset = __bind(this.reset, this);
	      var key, value, _ref;
	      this.options = {};
	      _ref = exports.defaults["0.2"];
	      for (key in _ref) {
	        if (!__hasProp.call(_ref, key)) continue;
	        value = _ref[key];
	        this.options[key] = value;
	      }
	      for (key in opts) {
	        if (!__hasProp.call(opts, key)) continue;
	        value = opts[key];
	        this.options[key] = value;
	      }
	      if (this.options.xmlns) {
	        this.options.xmlnskey = this.options.attrkey + "ns";
	      }
	      this.reset();
	    }

	    Parser.prototype.reset = function() {
	      var attrkey, charkey, err, stack,
	        _this = this;
	      this.removeAllListeners();
	      this.saxParser = sax.parser(true, {
	        trim: false,
	        normalize: false,
	        xmlns: this.options.xmlns
	      });
	      err = false;
	      this.saxParser.onerror = function(error) {
	        if (!err) {
	          err = true;
	          return _this.emit("error", error);
	        }
	      };
	      this.EXPLICIT_CHARKEY = this.options.explicitCharkey;
	      this.resultObject = null;
	      stack = [];
	      attrkey = this.options.attrkey;
	      charkey = this.options.charkey;
	      this.saxParser.onopentag = function(node) {
	        var key, obj, _ref;
	        obj = {};
	        obj[charkey] = "";
	        if (!_this.options.ignoreAttrs) {
	          _ref = node.attributes;
	          for (key in _ref) {
	            if (!__hasProp.call(_ref, key)) continue;
	            if (!(attrkey in obj) && !_this.options.mergeAttrs) {
	              obj[attrkey] = {};
	            }
	            if (_this.options.mergeAttrs) {
	              obj[key] = node.attributes[key];
	            } else {
	              obj[attrkey][key] = node.attributes[key];
	            }
	          }
	        }
	        obj["#name"] = _this.options.normalizeTags ? node.name.toLowerCase() : node.name;
	        if (_this.options.xmlns) {
	          obj[_this.options.xmlnskey] = {
	            uri: node.uri,
	            local: node.local
	          };
	        }
	        return stack.push(obj);
	      };
	      this.saxParser.onclosetag = function() {
	        var node, nodeName, obj, old, s, xpath;
	        obj = stack.pop();
	        nodeName = obj["#name"];
	        delete obj["#name"];
	        s = stack[stack.length - 1];
	        if (obj[charkey].match(/^\s*$/)) {
	          delete obj[charkey];
	        } else {
	          if (_this.options.trim) {
	            obj[charkey] = obj[charkey].trim();
	          }
	          if (_this.options.normalize) {
	            obj[charkey] = obj[charkey].replace(/\s{2,}/g, " ").trim();
	          }
	          if (Object.keys(obj).length === 1 && charkey in obj && !_this.EXPLICIT_CHARKEY) {
	            obj = obj[charkey];
	          }
	        }
	        if (_this.options.emptyTag !== void 0 && isEmpty(obj)) {
	          obj = _this.options.emptyTag;
	        }
	        if (_this.options.validator != null) {
	          xpath = "/" + ((function() {
	            var _i, _len, _results;
	            _results = [];
	            for (_i = 0, _len = stack.length; _i < _len; _i++) {
	              node = stack[_i];
	              _results.push(node["#name"]);
	            }
	            return _results;
	          })()).concat(nodeName).join("/");
	          try {
	            obj = _this.options.validator(xpath, s && s[nodeName], obj);
	          } catch (err) {
	            _this.emit("error", err);
	          }
	        }
	        if (_this.options.explicitChildren && !_this.options.mergeAttrs && typeof obj === 'object') {
	          node = {};
	          if (_this.options.attrkey in obj) {
	            node[_this.options.attrkey] = obj[_this.options.attrkey];
	            delete obj[_this.options.attrkey];
	          }
	          if (!_this.options.charsAsChildren && _this.options.charkey in obj) {
	            node[_this.options.charkey] = obj[_this.options.charkey];
	            delete obj[_this.options.charkey];
	          }
	          if (Object.getOwnPropertyNames(obj).length > 0) {
	            node[_this.options.childkey] = obj;
	          }
	          obj = node;
	        }
	        if (stack.length > 0) {
	          if (!_this.options.explicitArray) {
	            if (!(nodeName in s)) {
	              return s[nodeName] = obj;
	            } else if (s[nodeName] instanceof Array) {
	              return s[nodeName].push(obj);
	            } else {
	              old = s[nodeName];
	              s[nodeName] = [old];
	              return s[nodeName].push(obj);
	            }
	          } else {
	            if (!(s[nodeName] instanceof Array)) {
	              s[nodeName] = [];
	            }
	            return s[nodeName].push(obj);
	          }
	        } else {
	          if (_this.options.explicitRoot) {
	            old = obj;
	            obj = {};
	            obj[nodeName] = old;
	          }
	          _this.resultObject = obj;
	          return _this.emit("end", _this.resultObject);
	        }
	      };
	      return this.saxParser.ontext = this.saxParser.oncdata = function(text) {
	        var s;
	        s = stack[stack.length - 1];
	        if (s) {
	          return s[charkey] += text;
	        }
	      };
	    };

	    Parser.prototype.parseString = function(str, cb) {
	      if ((cb != null) && typeof cb === "function") {
	        this.on("end", function(result) {
	          this.reset();
	          if (this.options.async) {
	            return process.nextTick(function() {
	              return cb(null, result);
	            });
	          } else {
	            return cb(null, result);
	          }
	        });
	        this.on("error", function(err) {
	          this.reset();
	          if (this.options.async) {
	            return process.nextTick(function() {
	              return cb(err);
	            });
	          } else {
	            return cb(err);
	          }
	        });
	      }
	      if (str.toString().trim() === '') {
	        this.emit("end", null);
	        return true;
	      }
	      return this.saxParser.write(str.toString());
	    };

	    return Parser;

	  })(events.EventEmitter);

	  exports.parseString = function(str, a, b) {
	    var cb, options, parser;
	    if (b != null) {
	      if (typeof b === 'function') {
	        cb = b;
	      }
	      if (typeof a === 'object') {
	        options = a;
	      }
	    } else {
	      if (typeof a === 'function') {
	        cb = a;
	      }
	      options = {};
	    }
	    parser = new exports.Parser(options);
	    return parser.parseString(str, cb);
	  };

	}).call(this);

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)))

/***/ },
/* 40 */
/***/ function(module, exports, __webpack_require__) {

	// wrapper for non-node envs
	;(function (sax) {

	sax.parser = function (strict, opt) { return new SAXParser(strict, opt) }
	sax.SAXParser = SAXParser
	sax.SAXStream = SAXStream
	sax.createStream = createStream

	// When we pass the MAX_BUFFER_LENGTH position, start checking for buffer overruns.
	// When we check, schedule the next check for MAX_BUFFER_LENGTH - (max(buffer lengths)),
	// since that's the earliest that a buffer overrun could occur.  This way, checks are
	// as rare as required, but as often as necessary to ensure never crossing this bound.
	// Furthermore, buffers are only tested at most once per write(), so passing a very
	// large string into write() might have undesirable effects, but this is manageable by
	// the caller, so it is assumed to be safe.  Thus, a call to write() may, in the extreme
	// edge case, result in creating at most one complete copy of the string passed in.
	// Set to Infinity to have unlimited buffers.
	sax.MAX_BUFFER_LENGTH = 64 * 1024

	var buffers = [
	  "comment", "sgmlDecl", "textNode", "tagName", "doctype",
	  "procInstName", "procInstBody", "entity", "attribName",
	  "attribValue", "cdata", "script"
	]

	sax.EVENTS = // for discoverability.
	  [ "text"
	  , "processinginstruction"
	  , "sgmldeclaration"
	  , "doctype"
	  , "comment"
	  , "attribute"
	  , "opentag"
	  , "closetag"
	  , "opencdata"
	  , "cdata"
	  , "closecdata"
	  , "error"
	  , "end"
	  , "ready"
	  , "script"
	  , "opennamespace"
	  , "closenamespace"
	  ]

	function SAXParser (strict, opt) {
	  if (!(this instanceof SAXParser)) return new SAXParser(strict, opt)

	  var parser = this
	  clearBuffers(parser)
	  parser.q = parser.c = ""
	  parser.bufferCheckPosition = sax.MAX_BUFFER_LENGTH
	  parser.opt = opt || {}
	  parser.opt.lowercase = parser.opt.lowercase || parser.opt.lowercasetags;
	  parser.looseCase = parser.opt.lowercase ? "toLowerCase" : "toUpperCase"
	  parser.tags = []
	  parser.closed = parser.closedRoot = parser.sawRoot = false
	  parser.tag = parser.error = null
	  parser.strict = !!strict
	  parser.noscript = !!(strict || parser.opt.noscript)
	  parser.state = S.BEGIN
	  parser.ENTITIES = Object.create(sax.ENTITIES)
	  parser.attribList = []

	  // namespaces form a prototype chain.
	  // it always points at the current tag,
	  // which protos to its parent tag.
	  if (parser.opt.xmlns) parser.ns = Object.create(rootNS)

	  // mostly just for error reporting
	  parser.trackPosition = parser.opt.position !== false
	  if (parser.trackPosition) {
	    parser.position = parser.line = parser.column = 0
	  }
	  emit(parser, "onready")
	}

	if (!Object.create) Object.create = function (o) {
	  function f () { this.__proto__ = o }
	  f.prototype = o
	  return new f
	}

	if (!Object.getPrototypeOf) Object.getPrototypeOf = function (o) {
	  return o.__proto__
	}

	if (!Object.keys) Object.keys = function (o) {
	  var a = []
	  for (var i in o) if (o.hasOwnProperty(i)) a.push(i)
	  return a
	}

	function checkBufferLength (parser) {
	  var maxAllowed = Math.max(sax.MAX_BUFFER_LENGTH, 10)
	    , maxActual = 0
	  for (var i = 0, l = buffers.length; i < l; i ++) {
	    var len = parser[buffers[i]].length
	    if (len > maxAllowed) {
	      // Text/cdata nodes can get big, and since they're buffered,
	      // we can get here under normal conditions.
	      // Avoid issues by emitting the text node now,
	      // so at least it won't get any bigger.
	      switch (buffers[i]) {
	        case "textNode":
	          closeText(parser)
	        break

	        case "cdata":
	          emitNode(parser, "oncdata", parser.cdata)
	          parser.cdata = ""
	        break

	        case "script":
	          emitNode(parser, "onscript", parser.script)
	          parser.script = ""
	        break

	        default:
	          error(parser, "Max buffer length exceeded: "+buffers[i])
	      }
	    }
	    maxActual = Math.max(maxActual, len)
	  }
	  // schedule the next check for the earliest possible buffer overrun.
	  parser.bufferCheckPosition = (sax.MAX_BUFFER_LENGTH - maxActual)
	                             + parser.position
	}

	function clearBuffers (parser) {
	  for (var i = 0, l = buffers.length; i < l; i ++) {
	    parser[buffers[i]] = ""
	  }
	}

	SAXParser.prototype =
	  { end: function () { end(this) }
	  , write: write
	  , resume: function () { this.error = null; return this }
	  , close: function () { return this.write(null) }
	  }

	try {
	  var Stream = __webpack_require__(41).Stream
	} catch (ex) {
	  var Stream = function () {}
	}


	var streamWraps = sax.EVENTS.filter(function (ev) {
	  return ev !== "error" && ev !== "end"
	})

	function createStream (strict, opt) {
	  return new SAXStream(strict, opt)
	}

	function SAXStream (strict, opt) {
	  if (!(this instanceof SAXStream)) return new SAXStream(strict, opt)

	  Stream.apply(me)

	  this._parser = new SAXParser(strict, opt)
	  this.writable = true
	  this.readable = true


	  var me = this

	  this._parser.onend = function () {
	    me.emit("end")
	  }

	  this._parser.onerror = function (er) {
	    me.emit("error", er)

	    // if didn't throw, then means error was handled.
	    // go ahead and clear error, so we can write again.
	    me._parser.error = null
	  }

	  streamWraps.forEach(function (ev) {
	    Object.defineProperty(me, "on" + ev, {
	      get: function () { return me._parser["on" + ev] },
	      set: function (h) {
	        if (!h) {
	          me.removeAllListeners(ev)
	          return me._parser["on"+ev] = h
	        }
	        me.on(ev, h)
	      },
	      enumerable: true,
	      configurable: false
	    })
	  })
	}

	SAXStream.prototype = Object.create(Stream.prototype,
	  { constructor: { value: SAXStream } })

	SAXStream.prototype.write = function (data) {
	  this._parser.write(data.toString())
	  this.emit("data", data)
	  return true
	}

	SAXStream.prototype.end = function (chunk) {
	  if (chunk && chunk.length) this._parser.write(chunk.toString())
	  this._parser.end()
	  return true
	}

	SAXStream.prototype.on = function (ev, handler) {
	  var me = this
	  if (!me._parser["on"+ev] && streamWraps.indexOf(ev) !== -1) {
	    me._parser["on"+ev] = function () {
	      var args = arguments.length === 1 ? [arguments[0]]
	               : Array.apply(null, arguments)
	      args.splice(0, 0, ev)
	      me.emit.apply(me, args)
	    }
	  }

	  return Stream.prototype.on.call(me, ev, handler)
	}



	// character classes and tokens
	var whitespace = "\r\n\t "
	  // this really needs to be replaced with character classes.
	  // XML allows all manner of ridiculous numbers and digits.
	  , number = "0124356789"
	  , letter = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
	  // (Letter | "_" | ":")
	  , nameStart = letter+"_:"
	  , nameBody = nameStart+number+"-."
	  , quote = "'\""
	  , entity = number+letter+"#"
	  , attribEnd = whitespace + ">"
	  , CDATA = "[CDATA["
	  , DOCTYPE = "DOCTYPE"
	  , XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace"
	  , XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/"
	  , rootNS = { xml: XML_NAMESPACE, xmlns: XMLNS_NAMESPACE }

	// turn all the string character sets into character class objects.
	whitespace = charClass(whitespace)
	number = charClass(number)
	letter = charClass(letter)
	nameStart = charClass(nameStart)
	nameBody = charClass(nameBody)
	quote = charClass(quote)
	entity = charClass(entity)
	attribEnd = charClass(attribEnd)

	function charClass (str) {
	  return str.split("").reduce(function (s, c) {
	    s[c] = true
	    return s
	  }, {})
	}

	function is (charclass, c) {
	  return charclass[c]
	}

	function not (charclass, c) {
	  return !charclass[c]
	}

	var S = 0
	sax.STATE =
	{ BEGIN                     : S++
	, TEXT                      : S++ // general stuff
	, TEXT_ENTITY               : S++ // &amp and such.
	, OPEN_WAKA                 : S++ // <
	, SGML_DECL                 : S++ // <!BLARG
	, SGML_DECL_QUOTED          : S++ // <!BLARG foo "bar
	, DOCTYPE                   : S++ // <!DOCTYPE
	, DOCTYPE_QUOTED            : S++ // <!DOCTYPE "//blah
	, DOCTYPE_DTD               : S++ // <!DOCTYPE "//blah" [ ...
	, DOCTYPE_DTD_QUOTED        : S++ // <!DOCTYPE "//blah" [ "foo
	, COMMENT_STARTING          : S++ // <!-
	, COMMENT                   : S++ // <!--
	, COMMENT_ENDING            : S++ // <!-- blah -
	, COMMENT_ENDED             : S++ // <!-- blah --
	, CDATA                     : S++ // <![CDATA[ something
	, CDATA_ENDING              : S++ // ]
	, CDATA_ENDING_2            : S++ // ]]
	, PROC_INST                 : S++ // <?hi
	, PROC_INST_BODY            : S++ // <?hi there
	, PROC_INST_QUOTED          : S++ // <?hi "there
	, PROC_INST_ENDING          : S++ // <?hi "there" ?
	, OPEN_TAG                  : S++ // <strong
	, OPEN_TAG_SLASH            : S++ // <strong /
	, ATTRIB                    : S++ // <a
	, ATTRIB_NAME               : S++ // <a foo
	, ATTRIB_NAME_SAW_WHITE     : S++ // <a foo _
	, ATTRIB_VALUE              : S++ // <a foo=
	, ATTRIB_VALUE_QUOTED       : S++ // <a foo="bar
	, ATTRIB_VALUE_UNQUOTED     : S++ // <a foo=bar
	, ATTRIB_VALUE_ENTITY_Q     : S++ // <foo bar="&quot;"
	, ATTRIB_VALUE_ENTITY_U     : S++ // <foo bar=&quot;
	, CLOSE_TAG                 : S++ // </a
	, CLOSE_TAG_SAW_WHITE       : S++ // </a   >
	, SCRIPT                    : S++ // <script> ...
	, SCRIPT_ENDING             : S++ // <script> ... <
	}

	sax.ENTITIES =
	{ "apos" : "'"
	, "quot" : "\""
	, "amp"  : "&"
	, "gt"   : ">"
	, "lt"   : "<"
	}

	for (var S in sax.STATE) sax.STATE[sax.STATE[S]] = S

	// shorthand
	S = sax.STATE

	function emit (parser, event, data) {
	  parser[event] && parser[event](data)
	}

	function emitNode (parser, nodeType, data) {
	  if (parser.textNode) closeText(parser)
	  emit(parser, nodeType, data)
	}

	function closeText (parser) {
	  parser.textNode = textopts(parser.opt, parser.textNode)
	  if (parser.textNode) emit(parser, "ontext", parser.textNode)
	  parser.textNode = ""
	}

	function textopts (opt, text) {
	  if (opt.trim) text = text.trim()
	  if (opt.normalize) text = text.replace(/\s+/g, " ")
	  return text
	}

	function error (parser, er) {
	  closeText(parser)
	  if (parser.trackPosition) {
	    er += "\nLine: "+parser.line+
	          "\nColumn: "+parser.column+
	          "\nChar: "+parser.c
	  }
	  er = new Error(er)
	  parser.error = er
	  emit(parser, "onerror", er)
	  return parser
	}

	function end (parser) {
	  if (parser.state !== S.TEXT) error(parser, "Unexpected end")
	  closeText(parser)
	  parser.c = ""
	  parser.closed = true
	  emit(parser, "onend")
	  SAXParser.call(parser, parser.strict, parser.opt)
	  return parser
	}

	function strictFail (parser, message) {
	  if (parser.strict) error(parser, message)
	}

	function newTag (parser) {
	  if (!parser.strict) parser.tagName = parser.tagName[parser.looseCase]()
	  var parent = parser.tags[parser.tags.length - 1] || parser
	    , tag = parser.tag = { name : parser.tagName, attributes : {} }

	  // will be overridden if tag contails an xmlns="foo" or xmlns:foo="bar"
	  if (parser.opt.xmlns) tag.ns = parent.ns
	  parser.attribList.length = 0
	}

	function qname (name) {
	  var i = name.indexOf(":")
	    , qualName = i < 0 ? [ "", name ] : name.split(":")
	    , prefix = qualName[0]
	    , local = qualName[1]

	  // <x "xmlns"="http://foo">
	  if (name === "xmlns") {
	    prefix = "xmlns"
	    local = ""
	  }

	  return { prefix: prefix, local: local }
	}

	function attrib (parser) {
	  if (!parser.strict) parser.attribName = parser.attribName[parser.looseCase]()
	  if (parser.opt.xmlns) {
	    var qn = qname(parser.attribName)
	      , prefix = qn.prefix
	      , local = qn.local

	    if (prefix === "xmlns") {
	      // namespace binding attribute; push the binding into scope
	      if (local === "xml" && parser.attribValue !== XML_NAMESPACE) {
	        strictFail( parser
	                  , "xml: prefix must be bound to " + XML_NAMESPACE + "\n"
	                  + "Actual: " + parser.attribValue )
	      } else if (local === "xmlns" && parser.attribValue !== XMLNS_NAMESPACE) {
	        strictFail( parser
	                  , "xmlns: prefix must be bound to " + XMLNS_NAMESPACE + "\n"
	                  + "Actual: " + parser.attribValue )
	      } else {
	        var tag = parser.tag
	          , parent = parser.tags[parser.tags.length - 1] || parser
	        if (tag.ns === parent.ns) {
	          tag.ns = Object.create(parent.ns)
	        }
	        tag.ns[local] = parser.attribValue
	      }
	    }

	    // defer onattribute events until all attributes have been seen
	    // so any new bindings can take effect; preserve attribute order
	    // so deferred events can be emitted in document order
	    parser.attribList.push([parser.attribName, parser.attribValue])
	  } else {
	    // in non-xmlns mode, we can emit the event right away
	    parser.tag.attributes[parser.attribName] = parser.attribValue
	    emitNode( parser
	            , "onattribute"
	            , { name: parser.attribName
	              , value: parser.attribValue } )
	  }

	  parser.attribName = parser.attribValue = ""
	}

	function openTag (parser, selfClosing) {
	  if (parser.opt.xmlns) {
	    // emit namespace binding events
	    var tag = parser.tag

	    // add namespace info to tag
	    var qn = qname(parser.tagName)
	    tag.prefix = qn.prefix
	    tag.local = qn.local
	    tag.uri = tag.ns[qn.prefix] || qn.prefix

	    if (tag.prefix && !tag.uri) {
	      strictFail(parser, "Unbound namespace prefix: "
	                       + JSON.stringify(parser.tagName))
	    }

	    var parent = parser.tags[parser.tags.length - 1] || parser
	    if (tag.ns && parent.ns !== tag.ns) {
	      Object.keys(tag.ns).forEach(function (p) {
	        emitNode( parser
	                , "onopennamespace"
	                , { prefix: p , uri: tag.ns[p] } )
	      })
	    }

	    // handle deferred onattribute events
	    // Note: do not apply default ns to attributes:
	    //   http://www.w3.org/TR/REC-xml-names/#defaulting
	    for (var i = 0, l = parser.attribList.length; i < l; i ++) {
	      var nv = parser.attribList[i]
	      var name = nv[0]
	        , value = nv[1]
	        , qualName = qname(name)
	        , prefix = qualName.prefix
	        , local = qualName.local
	        , uri = prefix == "" ? "" : (tag.ns[prefix] || "")
	        , a = { name: name
	              , value: value
	              , prefix: prefix
	              , local: local
	              , uri: uri
	              }

	      // if there's any attributes with an undefined namespace,
	      // then fail on them now.
	      if (prefix && prefix != "xmlns" && !uri) {
	        strictFail(parser, "Unbound namespace prefix: "
	                         + JSON.stringify(prefix))
	        a.uri = prefix
	      }
	      parser.tag.attributes[name] = a
	      emitNode(parser, "onattribute", a)
	    }
	    parser.attribList.length = 0
	  }

	  // process the tag
	  parser.sawRoot = true
	  parser.tags.push(parser.tag)
	  emitNode(parser, "onopentag", parser.tag)
	  if (!selfClosing) {
	    // special case for <script> in non-strict mode.
	    if (!parser.noscript && parser.tagName.toLowerCase() === "script") {
	      parser.state = S.SCRIPT
	    } else {
	      parser.state = S.TEXT
	    }
	    parser.tag = null
	    parser.tagName = ""
	  }
	  parser.attribName = parser.attribValue = ""
	  parser.attribList.length = 0
	}

	function closeTag (parser) {
	  if (!parser.tagName) {
	    strictFail(parser, "Weird empty close tag.")
	    parser.textNode += "</>"
	    parser.state = S.TEXT
	    return
	  }
	  // first make sure that the closing tag actually exists.
	  // <a><b></c></b></a> will close everything, otherwise.
	  var t = parser.tags.length
	  var tagName = parser.tagName
	  if (!parser.strict) tagName = tagName[parser.looseCase]()
	  var closeTo = tagName
	  while (t --) {
	    var close = parser.tags[t]
	    if (close.name !== closeTo) {
	      // fail the first time in strict mode
	      strictFail(parser, "Unexpected close tag")
	    } else break
	  }

	  // didn't find it.  we already failed for strict, so just abort.
	  if (t < 0) {
	    strictFail(parser, "Unmatched closing tag: "+parser.tagName)
	    parser.textNode += "</" + parser.tagName + ">"
	    parser.state = S.TEXT
	    return
	  }
	  parser.tagName = tagName
	  var s = parser.tags.length
	  while (s --> t) {
	    var tag = parser.tag = parser.tags.pop()
	    parser.tagName = parser.tag.name
	    emitNode(parser, "onclosetag", parser.tagName)

	    var x = {}
	    for (var i in tag.ns) x[i] = tag.ns[i]

	    var parent = parser.tags[parser.tags.length - 1] || parser
	    if (parser.opt.xmlns && tag.ns !== parent.ns) {
	      // remove namespace bindings introduced by tag
	      Object.keys(tag.ns).forEach(function (p) {
	        var n = tag.ns[p]
	        emitNode(parser, "onclosenamespace", { prefix: p, uri: n })
	      })
	    }
	  }
	  if (t === 0) parser.closedRoot = true
	  parser.tagName = parser.attribValue = parser.attribName = ""
	  parser.attribList.length = 0
	  parser.state = S.TEXT
	}

	function parseEntity (parser) {
	  var entity = parser.entity.toLowerCase()
	    , num
	    , numStr = ""
	  if (parser.ENTITIES[entity]) return parser.ENTITIES[entity]
	  if (entity.charAt(0) === "#") {
	    if (entity.charAt(1) === "x") {
	      entity = entity.slice(2)
	      num = parseInt(entity, 16)
	      numStr = num.toString(16)
	    } else {
	      entity = entity.slice(1)
	      num = parseInt(entity, 10)
	      numStr = num.toString(10)
	    }
	  }
	  entity = entity.replace(/^0+/, "")
	  if (numStr.toLowerCase() !== entity) {
	    strictFail(parser, "Invalid character entity")
	    return "&"+parser.entity + ";"
	  }
	  return String.fromCharCode(num)
	}

	function write (chunk) {
	  var parser = this
	  if (this.error) throw this.error
	  if (parser.closed) return error(parser,
	    "Cannot write after close. Assign an onready handler.")
	  if (chunk === null) return end(parser)
	  var i = 0, c = ""
	  while (parser.c = c = chunk.charAt(i++)) {
	    if (parser.trackPosition) {
	      parser.position ++
	      if (c === "\n") {
	        parser.line ++
	        parser.column = 0
	      } else parser.column ++
	    }
	    switch (parser.state) {

	      case S.BEGIN:
	        if (c === "<") parser.state = S.OPEN_WAKA
	        else if (not(whitespace,c)) {
	          // have to process this as a text node.
	          // weird, but happens.
	          strictFail(parser, "Non-whitespace before first tag.")
	          parser.textNode = c
	          parser.state = S.TEXT
	        }
	      continue

	      case S.TEXT:
	        if (parser.sawRoot && !parser.closedRoot) {
	          var starti = i-1
	          while (c && c!=="<" && c!=="&") {
	            c = chunk.charAt(i++)
	            if (c && parser.trackPosition) {
	              parser.position ++
	              if (c === "\n") {
	                parser.line ++
	                parser.column = 0
	              } else parser.column ++
	            }
	          }
	          parser.textNode += chunk.substring(starti, i-1)
	        }
	        if (c === "<") parser.state = S.OPEN_WAKA
	        else {
	          if (not(whitespace, c) && (!parser.sawRoot || parser.closedRoot))
	            strictFail("Text data outside of root node.")
	          if (c === "&") parser.state = S.TEXT_ENTITY
	          else parser.textNode += c
	        }
	      continue

	      case S.SCRIPT:
	        // only non-strict
	        if (c === "<") {
	          parser.state = S.SCRIPT_ENDING
	        } else parser.script += c
	      continue

	      case S.SCRIPT_ENDING:
	        if (c === "/") {
	          emitNode(parser, "onscript", parser.script)
	          parser.state = S.CLOSE_TAG
	          parser.script = ""
	          parser.tagName = ""
	        } else {
	          parser.script += "<" + c
	          parser.state = S.SCRIPT
	        }
	      continue

	      case S.OPEN_WAKA:
	        // either a /, ?, !, or text is coming next.
	        if (c === "!") {
	          parser.state = S.SGML_DECL
	          parser.sgmlDecl = ""
	        } else if (is(whitespace, c)) {
	          // wait for it...
	        } else if (is(nameStart,c)) {
	          parser.startTagPosition = parser.position - 1
	          parser.state = S.OPEN_TAG
	          parser.tagName = c
	        } else if (c === "/") {
	          parser.startTagPosition = parser.position - 1
	          parser.state = S.CLOSE_TAG
	          parser.tagName = ""
	        } else if (c === "?") {
	          parser.state = S.PROC_INST
	          parser.procInstName = parser.procInstBody = ""
	        } else {
	          strictFail(parser, "Unencoded <")
	          parser.textNode += "<" + c
	          parser.state = S.TEXT
	        }
	      continue

	      case S.SGML_DECL:
	        if ((parser.sgmlDecl+c).toUpperCase() === CDATA) {
	          emitNode(parser, "onopencdata")
	          parser.state = S.CDATA
	          parser.sgmlDecl = ""
	          parser.cdata = ""
	        } else if (parser.sgmlDecl+c === "--") {
	          parser.state = S.COMMENT
	          parser.comment = ""
	          parser.sgmlDecl = ""
	        } else if ((parser.sgmlDecl+c).toUpperCase() === DOCTYPE) {
	          parser.state = S.DOCTYPE
	          if (parser.doctype || parser.sawRoot) strictFail(parser,
	            "Inappropriately located doctype declaration")
	          parser.doctype = ""
	          parser.sgmlDecl = ""
	        } else if (c === ">") {
	          emitNode(parser, "onsgmldeclaration", parser.sgmlDecl)
	          parser.sgmlDecl = ""
	          parser.state = S.TEXT
	        } else if (is(quote, c)) {
	          parser.state = S.SGML_DECL_QUOTED
	          parser.sgmlDecl += c
	        } else parser.sgmlDecl += c
	      continue

	      case S.SGML_DECL_QUOTED:
	        if (c === parser.q) {
	          parser.state = S.SGML_DECL
	          parser.q = ""
	        }
	        parser.sgmlDecl += c
	      continue

	      case S.DOCTYPE:
	        if (c === ">") {
	          parser.state = S.TEXT
	          emitNode(parser, "ondoctype", parser.doctype)
	          parser.doctype = true // just remember that we saw it.
	        } else {
	          parser.doctype += c
	          if (c === "[") parser.state = S.DOCTYPE_DTD
	          else if (is(quote, c)) {
	            parser.state = S.DOCTYPE_QUOTED
	            parser.q = c
	          }
	        }
	      continue

	      case S.DOCTYPE_QUOTED:
	        parser.doctype += c
	        if (c === parser.q) {
	          parser.q = ""
	          parser.state = S.DOCTYPE
	        }
	      continue

	      case S.DOCTYPE_DTD:
	        parser.doctype += c
	        if (c === "]") parser.state = S.DOCTYPE
	        else if (is(quote,c)) {
	          parser.state = S.DOCTYPE_DTD_QUOTED
	          parser.q = c
	        }
	      continue

	      case S.DOCTYPE_DTD_QUOTED:
	        parser.doctype += c
	        if (c === parser.q) {
	          parser.state = S.DOCTYPE_DTD
	          parser.q = ""
	        }
	      continue

	      case S.COMMENT:
	        if (c === "-") parser.state = S.COMMENT_ENDING
	        else parser.comment += c
	      continue

	      case S.COMMENT_ENDING:
	        if (c === "-") {
	          parser.state = S.COMMENT_ENDED
	          parser.comment = textopts(parser.opt, parser.comment)
	          if (parser.comment) emitNode(parser, "oncomment", parser.comment)
	          parser.comment = ""
	        } else {
	          parser.comment += "-" + c
	          parser.state = S.COMMENT
	        }
	      continue

	      case S.COMMENT_ENDED:
	        if (c !== ">") {
	          strictFail(parser, "Malformed comment")
	          // allow <!-- blah -- bloo --> in non-strict mode,
	          // which is a comment of " blah -- bloo "
	          parser.comment += "--" + c
	          parser.state = S.COMMENT
	        } else parser.state = S.TEXT
	      continue

	      case S.CDATA:
	        if (c === "]") parser.state = S.CDATA_ENDING
	        else parser.cdata += c
	      continue

	      case S.CDATA_ENDING:
	        if (c === "]") parser.state = S.CDATA_ENDING_2
	        else {
	          parser.cdata += "]" + c
	          parser.state = S.CDATA
	        }
	      continue

	      case S.CDATA_ENDING_2:
	        if (c === ">") {
	          if (parser.cdata) emitNode(parser, "oncdata", parser.cdata)
	          emitNode(parser, "onclosecdata")
	          parser.cdata = ""
	          parser.state = S.TEXT
	        } else if (c === "]") {
	          parser.cdata += "]"
	        } else {
	          parser.cdata += "]]" + c
	          parser.state = S.CDATA
	        }
	      continue

	      case S.PROC_INST:
	        if (c === "?") parser.state = S.PROC_INST_ENDING
	        else if (is(whitespace, c)) parser.state = S.PROC_INST_BODY
	        else parser.procInstName += c
	      continue

	      case S.PROC_INST_BODY:
	        if (!parser.procInstBody && is(whitespace, c)) continue
	        else if (c === "?") parser.state = S.PROC_INST_ENDING
	        else if (is(quote, c)) {
	          parser.state = S.PROC_INST_QUOTED
	          parser.q = c
	          parser.procInstBody += c
	        } else parser.procInstBody += c
	      continue

	      case S.PROC_INST_ENDING:
	        if (c === ">") {
	          emitNode(parser, "onprocessinginstruction", {
	            name : parser.procInstName,
	            body : parser.procInstBody
	          })
	          parser.procInstName = parser.procInstBody = ""
	          parser.state = S.TEXT
	        } else {
	          parser.procInstBody += "?" + c
	          parser.state = S.PROC_INST_BODY
	        }
	      continue

	      case S.PROC_INST_QUOTED:
	        parser.procInstBody += c
	        if (c === parser.q) {
	          parser.state = S.PROC_INST_BODY
	          parser.q = ""
	        }
	      continue

	      case S.OPEN_TAG:
	        if (is(nameBody, c)) parser.tagName += c
	        else {
	          newTag(parser)
	          if (c === ">") openTag(parser)
	          else if (c === "/") parser.state = S.OPEN_TAG_SLASH
	          else {
	            if (not(whitespace, c)) strictFail(
	              parser, "Invalid character in tag name")
	            parser.state = S.ATTRIB
	          }
	        }
	      continue

	      case S.OPEN_TAG_SLASH:
	        if (c === ">") {
	          openTag(parser, true)
	          closeTag(parser)
	        } else {
	          strictFail(parser, "Forward-slash in opening tag not followed by >")
	          parser.state = S.ATTRIB
	        }
	      continue

	      case S.ATTRIB:
	        // haven't read the attribute name yet.
	        if (is(whitespace, c)) continue
	        else if (c === ">") openTag(parser)
	        else if (c === "/") parser.state = S.OPEN_TAG_SLASH
	        else if (is(nameStart, c)) {
	          parser.attribName = c
	          parser.attribValue = ""
	          parser.state = S.ATTRIB_NAME
	        } else strictFail(parser, "Invalid attribute name")
	      continue

	      case S.ATTRIB_NAME:
	        if (c === "=") parser.state = S.ATTRIB_VALUE
	        else if (is(whitespace, c)) parser.state = S.ATTRIB_NAME_SAW_WHITE
	        else if (is(nameBody, c)) parser.attribName += c
	        else strictFail(parser, "Invalid attribute name")
	      continue

	      case S.ATTRIB_NAME_SAW_WHITE:
	        if (c === "=") parser.state = S.ATTRIB_VALUE
	        else if (is(whitespace, c)) continue
	        else {
	          strictFail(parser, "Attribute without value")
	          parser.tag.attributes[parser.attribName] = ""
	          parser.attribValue = ""
	          emitNode(parser, "onattribute",
	                   { name : parser.attribName, value : "" })
	          parser.attribName = ""
	          if (c === ">") openTag(parser)
	          else if (is(nameStart, c)) {
	            parser.attribName = c
	            parser.state = S.ATTRIB_NAME
	          } else {
	            strictFail(parser, "Invalid attribute name")
	            parser.state = S.ATTRIB
	          }
	        }
	      continue

	      case S.ATTRIB_VALUE:
	        if (is(whitespace, c)) continue
	        else if (is(quote, c)) {
	          parser.q = c
	          parser.state = S.ATTRIB_VALUE_QUOTED
	        } else {
	          strictFail(parser, "Unquoted attribute value")
	          parser.state = S.ATTRIB_VALUE_UNQUOTED
	          parser.attribValue = c
	        }
	      continue

	      case S.ATTRIB_VALUE_QUOTED:
	        if (c !== parser.q) {
	          if (c === "&") parser.state = S.ATTRIB_VALUE_ENTITY_Q
	          else parser.attribValue += c
	          continue
	        }
	        attrib(parser)
	        parser.q = ""
	        parser.state = S.ATTRIB
	      continue

	      case S.ATTRIB_VALUE_UNQUOTED:
	        if (not(attribEnd,c)) {
	          if (c === "&") parser.state = S.ATTRIB_VALUE_ENTITY_U
	          else parser.attribValue += c
	          continue
	        }
	        attrib(parser)
	        if (c === ">") openTag(parser)
	        else parser.state = S.ATTRIB
	      continue

	      case S.CLOSE_TAG:
	        if (!parser.tagName) {
	          if (is(whitespace, c)) continue
	          else if (not(nameStart, c)) strictFail(parser,
	            "Invalid tagname in closing tag.")
	          else parser.tagName = c
	        }
	        else if (c === ">") closeTag(parser)
	        else if (is(nameBody, c)) parser.tagName += c
	        else {
	          if (not(whitespace, c)) strictFail(parser,
	            "Invalid tagname in closing tag")
	          parser.state = S.CLOSE_TAG_SAW_WHITE
	        }
	      continue

	      case S.CLOSE_TAG_SAW_WHITE:
	        if (is(whitespace, c)) continue
	        if (c === ">") closeTag(parser)
	        else strictFail("Invalid characters in closing tag")
	      continue

	      case S.TEXT_ENTITY:
	      case S.ATTRIB_VALUE_ENTITY_Q:
	      case S.ATTRIB_VALUE_ENTITY_U:
	        switch(parser.state) {
	          case S.TEXT_ENTITY:
	            var returnState = S.TEXT, buffer = "textNode"
	          break

	          case S.ATTRIB_VALUE_ENTITY_Q:
	            var returnState = S.ATTRIB_VALUE_QUOTED, buffer = "attribValue"
	          break

	          case S.ATTRIB_VALUE_ENTITY_U:
	            var returnState = S.ATTRIB_VALUE_UNQUOTED, buffer = "attribValue"
	          break
	        }
	        if (c === ";") {
	          parser[buffer] += parseEntity(parser)
	          parser.entity = ""
	          parser.state = returnState
	        }
	        else if (is(entity, c)) parser.entity += c
	        else {
	          strictFail("Invalid character entity")
	          parser[buffer] += "&" + parser.entity + c
	          parser.entity = ""
	          parser.state = returnState
	        }
	      continue

	      default:
	        throw new Error(parser, "Unknown state: " + parser.state)
	    }
	  } // while
	  // cdata blocks can get very big under normal conditions. emit and move on.
	  // if (parser.state === S.CDATA && parser.cdata) {
	  //   emitNode(parser, "oncdata", parser.cdata)
	  //   parser.cdata = ""
	  // }
	  if (parser.position >= parser.bufferCheckPosition) checkBufferLength(parser)
	  return parser
	}

	})( false ? sax = {} : exports)


/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	module.exports = Stream;

	var EE = __webpack_require__(42).EventEmitter;
	var inherits = __webpack_require__(43);

	inherits(Stream, EE);
	Stream.Readable = __webpack_require__(44);
	Stream.Writable = __webpack_require__(55);
	Stream.Duplex = __webpack_require__(56);
	Stream.Transform = __webpack_require__(57);
	Stream.PassThrough = __webpack_require__(58);

	// Backwards-compat with node 0.4.x
	Stream.Stream = Stream;



	// old-style streams.  Note that the pipe method (the only relevant
	// part of this class) is overridden in the Readable class.

	function Stream() {
	  EE.call(this);
	}

	Stream.prototype.pipe = function(dest, options) {
	  var source = this;

	  function ondata(chunk) {
	    if (dest.writable) {
	      if (false === dest.write(chunk) && source.pause) {
	        source.pause();
	      }
	    }
	  }

	  source.on('data', ondata);

	  function ondrain() {
	    if (source.readable && source.resume) {
	      source.resume();
	    }
	  }

	  dest.on('drain', ondrain);

	  // If the 'end' option is not supplied, dest.end() will be called when
	  // source gets the 'end' or 'close' events.  Only dest.end() once.
	  if (!dest._isStdio && (!options || options.end !== false)) {
	    source.on('end', onend);
	    source.on('close', onclose);
	  }

	  var didOnEnd = false;
	  function onend() {
	    if (didOnEnd) return;
	    didOnEnd = true;

	    dest.end();
	  }


	  function onclose() {
	    if (didOnEnd) return;
	    didOnEnd = true;

	    if (typeof dest.destroy === 'function') dest.destroy();
	  }

	  // don't leave dangling pipes when there are errors.
	  function onerror(er) {
	    cleanup();
	    if (EE.listenerCount(this, 'error') === 0) {
	      throw er; // Unhandled stream error in pipe.
	    }
	  }

	  source.on('error', onerror);
	  dest.on('error', onerror);

	  // remove all the event listeners that were added.
	  function cleanup() {
	    source.removeListener('data', ondata);
	    dest.removeListener('drain', ondrain);

	    source.removeListener('end', onend);
	    source.removeListener('close', onclose);

	    source.removeListener('error', onerror);
	    dest.removeListener('error', onerror);

	    source.removeListener('end', cleanup);
	    source.removeListener('close', cleanup);

	    dest.removeListener('close', cleanup);
	  }

	  source.on('end', cleanup);
	  source.on('close', cleanup);

	  dest.on('close', cleanup);

	  dest.emit('pipe', source);

	  // Allow for unix-like usage: A.pipe(B).pipe(C)
	  return dest;
	};


/***/ },
/* 42 */
/***/ function(module, exports) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	function EventEmitter() {
	  this._events = this._events || {};
	  this._maxListeners = this._maxListeners || undefined;
	}
	module.exports = EventEmitter;

	// Backwards-compat with node 0.10.x
	EventEmitter.EventEmitter = EventEmitter;

	EventEmitter.prototype._events = undefined;
	EventEmitter.prototype._maxListeners = undefined;

	// By default EventEmitters will print a warning if more than 10 listeners are
	// added to it. This is a useful default which helps finding memory leaks.
	EventEmitter.defaultMaxListeners = 10;

	// Obviously not all Emitters should be limited to 10. This function allows
	// that to be increased. Set to zero for unlimited.
	EventEmitter.prototype.setMaxListeners = function(n) {
	  if (!isNumber(n) || n < 0 || isNaN(n))
	    throw TypeError('n must be a positive number');
	  this._maxListeners = n;
	  return this;
	};

	EventEmitter.prototype.emit = function(type) {
	  var er, handler, len, args, i, listeners;

	  if (!this._events)
	    this._events = {};

	  // If there is no 'error' event listener then throw.
	  if (type === 'error') {
	    if (!this._events.error ||
	        (isObject(this._events.error) && !this._events.error.length)) {
	      er = arguments[1];
	      if (er instanceof Error) {
	        throw er; // Unhandled 'error' event
	      }
	      throw TypeError('Uncaught, unspecified "error" event.');
	    }
	  }

	  handler = this._events[type];

	  if (isUndefined(handler))
	    return false;

	  if (isFunction(handler)) {
	    switch (arguments.length) {
	      // fast cases
	      case 1:
	        handler.call(this);
	        break;
	      case 2:
	        handler.call(this, arguments[1]);
	        break;
	      case 3:
	        handler.call(this, arguments[1], arguments[2]);
	        break;
	      // slower
	      default:
	        args = Array.prototype.slice.call(arguments, 1);
	        handler.apply(this, args);
	    }
	  } else if (isObject(handler)) {
	    args = Array.prototype.slice.call(arguments, 1);
	    listeners = handler.slice();
	    len = listeners.length;
	    for (i = 0; i < len; i++)
	      listeners[i].apply(this, args);
	  }

	  return true;
	};

	EventEmitter.prototype.addListener = function(type, listener) {
	  var m;

	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');

	  if (!this._events)
	    this._events = {};

	  // To avoid recursion in the case that type === "newListener"! Before
	  // adding it to the listeners, first emit "newListener".
	  if (this._events.newListener)
	    this.emit('newListener', type,
	              isFunction(listener.listener) ?
	              listener.listener : listener);

	  if (!this._events[type])
	    // Optimize the case of one listener. Don't need the extra array object.
	    this._events[type] = listener;
	  else if (isObject(this._events[type]))
	    // If we've already got an array, just append.
	    this._events[type].push(listener);
	  else
	    // Adding the second element, need to change to array.
	    this._events[type] = [this._events[type], listener];

	  // Check for listener leak
	  if (isObject(this._events[type]) && !this._events[type].warned) {
	    if (!isUndefined(this._maxListeners)) {
	      m = this._maxListeners;
	    } else {
	      m = EventEmitter.defaultMaxListeners;
	    }

	    if (m && m > 0 && this._events[type].length > m) {
	      this._events[type].warned = true;
	      console.error('(node) warning: possible EventEmitter memory ' +
	                    'leak detected. %d listeners added. ' +
	                    'Use emitter.setMaxListeners() to increase limit.',
	                    this._events[type].length);
	      if (typeof console.trace === 'function') {
	        // not supported in IE 10
	        console.trace();
	      }
	    }
	  }

	  return this;
	};

	EventEmitter.prototype.on = EventEmitter.prototype.addListener;

	EventEmitter.prototype.once = function(type, listener) {
	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');

	  var fired = false;

	  function g() {
	    this.removeListener(type, g);

	    if (!fired) {
	      fired = true;
	      listener.apply(this, arguments);
	    }
	  }

	  g.listener = listener;
	  this.on(type, g);

	  return this;
	};

	// emits a 'removeListener' event iff the listener was removed
	EventEmitter.prototype.removeListener = function(type, listener) {
	  var list, position, length, i;

	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');

	  if (!this._events || !this._events[type])
	    return this;

	  list = this._events[type];
	  length = list.length;
	  position = -1;

	  if (list === listener ||
	      (isFunction(list.listener) && list.listener === listener)) {
	    delete this._events[type];
	    if (this._events.removeListener)
	      this.emit('removeListener', type, listener);

	  } else if (isObject(list)) {
	    for (i = length; i-- > 0;) {
	      if (list[i] === listener ||
	          (list[i].listener && list[i].listener === listener)) {
	        position = i;
	        break;
	      }
	    }

	    if (position < 0)
	      return this;

	    if (list.length === 1) {
	      list.length = 0;
	      delete this._events[type];
	    } else {
	      list.splice(position, 1);
	    }

	    if (this._events.removeListener)
	      this.emit('removeListener', type, listener);
	  }

	  return this;
	};

	EventEmitter.prototype.removeAllListeners = function(type) {
	  var key, listeners;

	  if (!this._events)
	    return this;

	  // not listening for removeListener, no need to emit
	  if (!this._events.removeListener) {
	    if (arguments.length === 0)
	      this._events = {};
	    else if (this._events[type])
	      delete this._events[type];
	    return this;
	  }

	  // emit removeListener for all listeners on all events
	  if (arguments.length === 0) {
	    for (key in this._events) {
	      if (key === 'removeListener') continue;
	      this.removeAllListeners(key);
	    }
	    this.removeAllListeners('removeListener');
	    this._events = {};
	    return this;
	  }

	  listeners = this._events[type];

	  if (isFunction(listeners)) {
	    this.removeListener(type, listeners);
	  } else if (listeners) {
	    // LIFO order
	    while (listeners.length)
	      this.removeListener(type, listeners[listeners.length - 1]);
	  }
	  delete this._events[type];

	  return this;
	};

	EventEmitter.prototype.listeners = function(type) {
	  var ret;
	  if (!this._events || !this._events[type])
	    ret = [];
	  else if (isFunction(this._events[type]))
	    ret = [this._events[type]];
	  else
	    ret = this._events[type].slice();
	  return ret;
	};

	EventEmitter.prototype.listenerCount = function(type) {
	  if (this._events) {
	    var evlistener = this._events[type];

	    if (isFunction(evlistener))
	      return 1;
	    else if (evlistener)
	      return evlistener.length;
	  }
	  return 0;
	};

	EventEmitter.listenerCount = function(emitter, type) {
	  return emitter.listenerCount(type);
	};

	function isFunction(arg) {
	  return typeof arg === 'function';
	}

	function isNumber(arg) {
	  return typeof arg === 'number';
	}

	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}

	function isUndefined(arg) {
	  return arg === void 0;
	}


/***/ },
/* 43 */
/***/ function(module, exports) {

	if (typeof Object.create === 'function') {
	  // implementation from standard node.js 'util' module
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    ctor.prototype = Object.create(superCtor.prototype, {
	      constructor: {
	        value: ctor,
	        enumerable: false,
	        writable: true,
	        configurable: true
	      }
	    });
	  };
	} else {
	  // old school shim for old browsers
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    var TempCtor = function () {}
	    TempCtor.prototype = superCtor.prototype
	    ctor.prototype = new TempCtor()
	    ctor.prototype.constructor = ctor
	  }
	}


/***/ },
/* 44 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(45);
	exports.Stream = __webpack_require__(41);
	exports.Readable = exports;
	exports.Writable = __webpack_require__(51);
	exports.Duplex = __webpack_require__(50);
	exports.Transform = __webpack_require__(53);
	exports.PassThrough = __webpack_require__(54);


/***/ },
/* 45 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	module.exports = Readable;

	/*<replacement>*/
	var isArray = __webpack_require__(46);
	/*</replacement>*/


	/*<replacement>*/
	var Buffer = __webpack_require__(11).Buffer;
	/*</replacement>*/

	Readable.ReadableState = ReadableState;

	var EE = __webpack_require__(42).EventEmitter;

	/*<replacement>*/
	if (!EE.listenerCount) EE.listenerCount = function(emitter, type) {
	  return emitter.listeners(type).length;
	};
	/*</replacement>*/

	var Stream = __webpack_require__(41);

	/*<replacement>*/
	var util = __webpack_require__(47);
	util.inherits = __webpack_require__(48);
	/*</replacement>*/

	var StringDecoder;


	/*<replacement>*/
	var debug = __webpack_require__(49);
	if (debug && debug.debuglog) {
	  debug = debug.debuglog('stream');
	} else {
	  debug = function () {};
	}
	/*</replacement>*/


	util.inherits(Readable, Stream);

	function ReadableState(options, stream) {
	  var Duplex = __webpack_require__(50);

	  options = options || {};

	  // the point at which it stops calling _read() to fill the buffer
	  // Note: 0 is a valid value, means "don't call _read preemptively ever"
	  var hwm = options.highWaterMark;
	  var defaultHwm = options.objectMode ? 16 : 16 * 1024;
	  this.highWaterMark = (hwm || hwm === 0) ? hwm : defaultHwm;

	  // cast to ints.
	  this.highWaterMark = ~~this.highWaterMark;

	  this.buffer = [];
	  this.length = 0;
	  this.pipes = null;
	  this.pipesCount = 0;
	  this.flowing = null;
	  this.ended = false;
	  this.endEmitted = false;
	  this.reading = false;

	  // a flag to be able to tell if the onwrite cb is called immediately,
	  // or on a later tick.  We set this to true at first, because any
	  // actions that shouldn't happen until "later" should generally also
	  // not happen before the first write call.
	  this.sync = true;

	  // whenever we return null, then we set a flag to say
	  // that we're awaiting a 'readable' event emission.
	  this.needReadable = false;
	  this.emittedReadable = false;
	  this.readableListening = false;


	  // object stream flag. Used to make read(n) ignore n and to
	  // make all the buffer merging and length checks go away
	  this.objectMode = !!options.objectMode;

	  if (stream instanceof Duplex)
	    this.objectMode = this.objectMode || !!options.readableObjectMode;

	  // Crypto is kind of old and crusty.  Historically, its default string
	  // encoding is 'binary' so we have to make this configurable.
	  // Everything else in the universe uses 'utf8', though.
	  this.defaultEncoding = options.defaultEncoding || 'utf8';

	  // when piping, we only care about 'readable' events that happen
	  // after read()ing all the bytes and not getting any pushback.
	  this.ranOut = false;

	  // the number of writers that are awaiting a drain event in .pipe()s
	  this.awaitDrain = 0;

	  // if true, a maybeReadMore has been scheduled
	  this.readingMore = false;

	  this.decoder = null;
	  this.encoding = null;
	  if (options.encoding) {
	    if (!StringDecoder)
	      StringDecoder = __webpack_require__(52).StringDecoder;
	    this.decoder = new StringDecoder(options.encoding);
	    this.encoding = options.encoding;
	  }
	}

	function Readable(options) {
	  var Duplex = __webpack_require__(50);

	  if (!(this instanceof Readable))
	    return new Readable(options);

	  this._readableState = new ReadableState(options, this);

	  // legacy
	  this.readable = true;

	  Stream.call(this);
	}

	// Manually shove something into the read() buffer.
	// This returns true if the highWaterMark has not been hit yet,
	// similar to how Writable.write() returns true if you should
	// write() some more.
	Readable.prototype.push = function(chunk, encoding) {
	  var state = this._readableState;

	  if (util.isString(chunk) && !state.objectMode) {
	    encoding = encoding || state.defaultEncoding;
	    if (encoding !== state.encoding) {
	      chunk = new Buffer(chunk, encoding);
	      encoding = '';
	    }
	  }

	  return readableAddChunk(this, state, chunk, encoding, false);
	};

	// Unshift should *always* be something directly out of read()
	Readable.prototype.unshift = function(chunk) {
	  var state = this._readableState;
	  return readableAddChunk(this, state, chunk, '', true);
	};

	function readableAddChunk(stream, state, chunk, encoding, addToFront) {
	  var er = chunkInvalid(state, chunk);
	  if (er) {
	    stream.emit('error', er);
	  } else if (util.isNullOrUndefined(chunk)) {
	    state.reading = false;
	    if (!state.ended)
	      onEofChunk(stream, state);
	  } else if (state.objectMode || chunk && chunk.length > 0) {
	    if (state.ended && !addToFront) {
	      var e = new Error('stream.push() after EOF');
	      stream.emit('error', e);
	    } else if (state.endEmitted && addToFront) {
	      var e = new Error('stream.unshift() after end event');
	      stream.emit('error', e);
	    } else {
	      if (state.decoder && !addToFront && !encoding)
	        chunk = state.decoder.write(chunk);

	      if (!addToFront)
	        state.reading = false;

	      // if we want the data now, just emit it.
	      if (state.flowing && state.length === 0 && !state.sync) {
	        stream.emit('data', chunk);
	        stream.read(0);
	      } else {
	        // update the buffer info.
	        state.length += state.objectMode ? 1 : chunk.length;
	        if (addToFront)
	          state.buffer.unshift(chunk);
	        else
	          state.buffer.push(chunk);

	        if (state.needReadable)
	          emitReadable(stream);
	      }

	      maybeReadMore(stream, state);
	    }
	  } else if (!addToFront) {
	    state.reading = false;
	  }

	  return needMoreData(state);
	}



	// if it's past the high water mark, we can push in some more.
	// Also, if we have no data yet, we can stand some
	// more bytes.  This is to work around cases where hwm=0,
	// such as the repl.  Also, if the push() triggered a
	// readable event, and the user called read(largeNumber) such that
	// needReadable was set, then we ought to push more, so that another
	// 'readable' event will be triggered.
	function needMoreData(state) {
	  return !state.ended &&
	         (state.needReadable ||
	          state.length < state.highWaterMark ||
	          state.length === 0);
	}

	// backwards compatibility.
	Readable.prototype.setEncoding = function(enc) {
	  if (!StringDecoder)
	    StringDecoder = __webpack_require__(52).StringDecoder;
	  this._readableState.decoder = new StringDecoder(enc);
	  this._readableState.encoding = enc;
	  return this;
	};

	// Don't raise the hwm > 128MB
	var MAX_HWM = 0x800000;
	function roundUpToNextPowerOf2(n) {
	  if (n >= MAX_HWM) {
	    n = MAX_HWM;
	  } else {
	    // Get the next highest power of 2
	    n--;
	    for (var p = 1; p < 32; p <<= 1) n |= n >> p;
	    n++;
	  }
	  return n;
	}

	function howMuchToRead(n, state) {
	  if (state.length === 0 && state.ended)
	    return 0;

	  if (state.objectMode)
	    return n === 0 ? 0 : 1;

	  if (isNaN(n) || util.isNull(n)) {
	    // only flow one buffer at a time
	    if (state.flowing && state.buffer.length)
	      return state.buffer[0].length;
	    else
	      return state.length;
	  }

	  if (n <= 0)
	    return 0;

	  // If we're asking for more than the target buffer level,
	  // then raise the water mark.  Bump up to the next highest
	  // power of 2, to prevent increasing it excessively in tiny
	  // amounts.
	  if (n > state.highWaterMark)
	    state.highWaterMark = roundUpToNextPowerOf2(n);

	  // don't have that much.  return null, unless we've ended.
	  if (n > state.length) {
	    if (!state.ended) {
	      state.needReadable = true;
	      return 0;
	    } else
	      return state.length;
	  }

	  return n;
	}

	// you can override either this method, or the async _read(n) below.
	Readable.prototype.read = function(n) {
	  debug('read', n);
	  var state = this._readableState;
	  var nOrig = n;

	  if (!util.isNumber(n) || n > 0)
	    state.emittedReadable = false;

	  // if we're doing read(0) to trigger a readable event, but we
	  // already have a bunch of data in the buffer, then just trigger
	  // the 'readable' event and move on.
	  if (n === 0 &&
	      state.needReadable &&
	      (state.length >= state.highWaterMark || state.ended)) {
	    debug('read: emitReadable', state.length, state.ended);
	    if (state.length === 0 && state.ended)
	      endReadable(this);
	    else
	      emitReadable(this);
	    return null;
	  }

	  n = howMuchToRead(n, state);

	  // if we've ended, and we're now clear, then finish it up.
	  if (n === 0 && state.ended) {
	    if (state.length === 0)
	      endReadable(this);
	    return null;
	  }

	  // All the actual chunk generation logic needs to be
	  // *below* the call to _read.  The reason is that in certain
	  // synthetic stream cases, such as passthrough streams, _read
	  // may be a completely synchronous operation which may change
	  // the state of the read buffer, providing enough data when
	  // before there was *not* enough.
	  //
	  // So, the steps are:
	  // 1. Figure out what the state of things will be after we do
	  // a read from the buffer.
	  //
	  // 2. If that resulting state will trigger a _read, then call _read.
	  // Note that this may be asynchronous, or synchronous.  Yes, it is
	  // deeply ugly to write APIs this way, but that still doesn't mean
	  // that the Readable class should behave improperly, as streams are
	  // designed to be sync/async agnostic.
	  // Take note if the _read call is sync or async (ie, if the read call
	  // has returned yet), so that we know whether or not it's safe to emit
	  // 'readable' etc.
	  //
	  // 3. Actually pull the requested chunks out of the buffer and return.

	  // if we need a readable event, then we need to do some reading.
	  var doRead = state.needReadable;
	  debug('need readable', doRead);

	  // if we currently have less than the highWaterMark, then also read some
	  if (state.length === 0 || state.length - n < state.highWaterMark) {
	    doRead = true;
	    debug('length less than watermark', doRead);
	  }

	  // however, if we've ended, then there's no point, and if we're already
	  // reading, then it's unnecessary.
	  if (state.ended || state.reading) {
	    doRead = false;
	    debug('reading or ended', doRead);
	  }

	  if (doRead) {
	    debug('do read');
	    state.reading = true;
	    state.sync = true;
	    // if the length is currently zero, then we *need* a readable event.
	    if (state.length === 0)
	      state.needReadable = true;
	    // call internal read method
	    this._read(state.highWaterMark);
	    state.sync = false;
	  }

	  // If _read pushed data synchronously, then `reading` will be false,
	  // and we need to re-evaluate how much data we can return to the user.
	  if (doRead && !state.reading)
	    n = howMuchToRead(nOrig, state);

	  var ret;
	  if (n > 0)
	    ret = fromList(n, state);
	  else
	    ret = null;

	  if (util.isNull(ret)) {
	    state.needReadable = true;
	    n = 0;
	  }

	  state.length -= n;

	  // If we have nothing in the buffer, then we want to know
	  // as soon as we *do* get something into the buffer.
	  if (state.length === 0 && !state.ended)
	    state.needReadable = true;

	  // If we tried to read() past the EOF, then emit end on the next tick.
	  if (nOrig !== n && state.ended && state.length === 0)
	    endReadable(this);

	  if (!util.isNull(ret))
	    this.emit('data', ret);

	  return ret;
	};

	function chunkInvalid(state, chunk) {
	  var er = null;
	  if (!util.isBuffer(chunk) &&
	      !util.isString(chunk) &&
	      !util.isNullOrUndefined(chunk) &&
	      !state.objectMode) {
	    er = new TypeError('Invalid non-string/buffer chunk');
	  }
	  return er;
	}


	function onEofChunk(stream, state) {
	  if (state.decoder && !state.ended) {
	    var chunk = state.decoder.end();
	    if (chunk && chunk.length) {
	      state.buffer.push(chunk);
	      state.length += state.objectMode ? 1 : chunk.length;
	    }
	  }
	  state.ended = true;

	  // emit 'readable' now to make sure it gets picked up.
	  emitReadable(stream);
	}

	// Don't emit readable right away in sync mode, because this can trigger
	// another read() call => stack overflow.  This way, it might trigger
	// a nextTick recursion warning, but that's not so bad.
	function emitReadable(stream) {
	  var state = stream._readableState;
	  state.needReadable = false;
	  if (!state.emittedReadable) {
	    debug('emitReadable', state.flowing);
	    state.emittedReadable = true;
	    if (state.sync)
	      process.nextTick(function() {
	        emitReadable_(stream);
	      });
	    else
	      emitReadable_(stream);
	  }
	}

	function emitReadable_(stream) {
	  debug('emit readable');
	  stream.emit('readable');
	  flow(stream);
	}


	// at this point, the user has presumably seen the 'readable' event,
	// and called read() to consume some data.  that may have triggered
	// in turn another _read(n) call, in which case reading = true if
	// it's in progress.
	// However, if we're not ended, or reading, and the length < hwm,
	// then go ahead and try to read some more preemptively.
	function maybeReadMore(stream, state) {
	  if (!state.readingMore) {
	    state.readingMore = true;
	    process.nextTick(function() {
	      maybeReadMore_(stream, state);
	    });
	  }
	}

	function maybeReadMore_(stream, state) {
	  var len = state.length;
	  while (!state.reading && !state.flowing && !state.ended &&
	         state.length < state.highWaterMark) {
	    debug('maybeReadMore read 0');
	    stream.read(0);
	    if (len === state.length)
	      // didn't get any data, stop spinning.
	      break;
	    else
	      len = state.length;
	  }
	  state.readingMore = false;
	}

	// abstract method.  to be overridden in specific implementation classes.
	// call cb(er, data) where data is <= n in length.
	// for virtual (non-string, non-buffer) streams, "length" is somewhat
	// arbitrary, and perhaps not very meaningful.
	Readable.prototype._read = function(n) {
	  this.emit('error', new Error('not implemented'));
	};

	Readable.prototype.pipe = function(dest, pipeOpts) {
	  var src = this;
	  var state = this._readableState;

	  switch (state.pipesCount) {
	    case 0:
	      state.pipes = dest;
	      break;
	    case 1:
	      state.pipes = [state.pipes, dest];
	      break;
	    default:
	      state.pipes.push(dest);
	      break;
	  }
	  state.pipesCount += 1;
	  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

	  var doEnd = (!pipeOpts || pipeOpts.end !== false) &&
	              dest !== process.stdout &&
	              dest !== process.stderr;

	  var endFn = doEnd ? onend : cleanup;
	  if (state.endEmitted)
	    process.nextTick(endFn);
	  else
	    src.once('end', endFn);

	  dest.on('unpipe', onunpipe);
	  function onunpipe(readable) {
	    debug('onunpipe');
	    if (readable === src) {
	      cleanup();
	    }
	  }

	  function onend() {
	    debug('onend');
	    dest.end();
	  }

	  // when the dest drains, it reduces the awaitDrain counter
	  // on the source.  This would be more elegant with a .once()
	  // handler in flow(), but adding and removing repeatedly is
	  // too slow.
	  var ondrain = pipeOnDrain(src);
	  dest.on('drain', ondrain);

	  function cleanup() {
	    debug('cleanup');
	    // cleanup event handlers once the pipe is broken
	    dest.removeListener('close', onclose);
	    dest.removeListener('finish', onfinish);
	    dest.removeListener('drain', ondrain);
	    dest.removeListener('error', onerror);
	    dest.removeListener('unpipe', onunpipe);
	    src.removeListener('end', onend);
	    src.removeListener('end', cleanup);
	    src.removeListener('data', ondata);

	    // if the reader is waiting for a drain event from this
	    // specific writer, then it would cause it to never start
	    // flowing again.
	    // So, if this is awaiting a drain, then we just call it now.
	    // If we don't know, then assume that we are waiting for one.
	    if (state.awaitDrain &&
	        (!dest._writableState || dest._writableState.needDrain))
	      ondrain();
	  }

	  src.on('data', ondata);
	  function ondata(chunk) {
	    debug('ondata');
	    var ret = dest.write(chunk);
	    if (false === ret) {
	      debug('false write response, pause',
	            src._readableState.awaitDrain);
	      src._readableState.awaitDrain++;
	      src.pause();
	    }
	  }

	  // if the dest has an error, then stop piping into it.
	  // however, don't suppress the throwing behavior for this.
	  function onerror(er) {
	    debug('onerror', er);
	    unpipe();
	    dest.removeListener('error', onerror);
	    if (EE.listenerCount(dest, 'error') === 0)
	      dest.emit('error', er);
	  }
	  // This is a brutally ugly hack to make sure that our error handler
	  // is attached before any userland ones.  NEVER DO THIS.
	  if (!dest._events || !dest._events.error)
	    dest.on('error', onerror);
	  else if (isArray(dest._events.error))
	    dest._events.error.unshift(onerror);
	  else
	    dest._events.error = [onerror, dest._events.error];



	  // Both close and finish should trigger unpipe, but only once.
	  function onclose() {
	    dest.removeListener('finish', onfinish);
	    unpipe();
	  }
	  dest.once('close', onclose);
	  function onfinish() {
	    debug('onfinish');
	    dest.removeListener('close', onclose);
	    unpipe();
	  }
	  dest.once('finish', onfinish);

	  function unpipe() {
	    debug('unpipe');
	    src.unpipe(dest);
	  }

	  // tell the dest that it's being piped to
	  dest.emit('pipe', src);

	  // start the flow if it hasn't been started already.
	  if (!state.flowing) {
	    debug('pipe resume');
	    src.resume();
	  }

	  return dest;
	};

	function pipeOnDrain(src) {
	  return function() {
	    var state = src._readableState;
	    debug('pipeOnDrain', state.awaitDrain);
	    if (state.awaitDrain)
	      state.awaitDrain--;
	    if (state.awaitDrain === 0 && EE.listenerCount(src, 'data')) {
	      state.flowing = true;
	      flow(src);
	    }
	  };
	}


	Readable.prototype.unpipe = function(dest) {
	  var state = this._readableState;

	  // if we're not piping anywhere, then do nothing.
	  if (state.pipesCount === 0)
	    return this;

	  // just one destination.  most common case.
	  if (state.pipesCount === 1) {
	    // passed in one, but it's not the right one.
	    if (dest && dest !== state.pipes)
	      return this;

	    if (!dest)
	      dest = state.pipes;

	    // got a match.
	    state.pipes = null;
	    state.pipesCount = 0;
	    state.flowing = false;
	    if (dest)
	      dest.emit('unpipe', this);
	    return this;
	  }

	  // slow case. multiple pipe destinations.

	  if (!dest) {
	    // remove all.
	    var dests = state.pipes;
	    var len = state.pipesCount;
	    state.pipes = null;
	    state.pipesCount = 0;
	    state.flowing = false;

	    for (var i = 0; i < len; i++)
	      dests[i].emit('unpipe', this);
	    return this;
	  }

	  // try to find the right one.
	  var i = indexOf(state.pipes, dest);
	  if (i === -1)
	    return this;

	  state.pipes.splice(i, 1);
	  state.pipesCount -= 1;
	  if (state.pipesCount === 1)
	    state.pipes = state.pipes[0];

	  dest.emit('unpipe', this);

	  return this;
	};

	// set up data events if they are asked for
	// Ensure readable listeners eventually get something
	Readable.prototype.on = function(ev, fn) {
	  var res = Stream.prototype.on.call(this, ev, fn);

	  // If listening to data, and it has not explicitly been paused,
	  // then call resume to start the flow of data on the next tick.
	  if (ev === 'data' && false !== this._readableState.flowing) {
	    this.resume();
	  }

	  if (ev === 'readable' && this.readable) {
	    var state = this._readableState;
	    if (!state.readableListening) {
	      state.readableListening = true;
	      state.emittedReadable = false;
	      state.needReadable = true;
	      if (!state.reading) {
	        var self = this;
	        process.nextTick(function() {
	          debug('readable nexttick read 0');
	          self.read(0);
	        });
	      } else if (state.length) {
	        emitReadable(this, state);
	      }
	    }
	  }

	  return res;
	};
	Readable.prototype.addListener = Readable.prototype.on;

	// pause() and resume() are remnants of the legacy readable stream API
	// If the user uses them, then switch into old mode.
	Readable.prototype.resume = function() {
	  var state = this._readableState;
	  if (!state.flowing) {
	    debug('resume');
	    state.flowing = true;
	    if (!state.reading) {
	      debug('resume read 0');
	      this.read(0);
	    }
	    resume(this, state);
	  }
	  return this;
	};

	function resume(stream, state) {
	  if (!state.resumeScheduled) {
	    state.resumeScheduled = true;
	    process.nextTick(function() {
	      resume_(stream, state);
	    });
	  }
	}

	function resume_(stream, state) {
	  state.resumeScheduled = false;
	  stream.emit('resume');
	  flow(stream);
	  if (state.flowing && !state.reading)
	    stream.read(0);
	}

	Readable.prototype.pause = function() {
	  debug('call pause flowing=%j', this._readableState.flowing);
	  if (false !== this._readableState.flowing) {
	    debug('pause');
	    this._readableState.flowing = false;
	    this.emit('pause');
	  }
	  return this;
	};

	function flow(stream) {
	  var state = stream._readableState;
	  debug('flow', state.flowing);
	  if (state.flowing) {
	    do {
	      var chunk = stream.read();
	    } while (null !== chunk && state.flowing);
	  }
	}

	// wrap an old-style stream as the async data source.
	// This is *not* part of the readable stream interface.
	// It is an ugly unfortunate mess of history.
	Readable.prototype.wrap = function(stream) {
	  var state = this._readableState;
	  var paused = false;

	  var self = this;
	  stream.on('end', function() {
	    debug('wrapped end');
	    if (state.decoder && !state.ended) {
	      var chunk = state.decoder.end();
	      if (chunk && chunk.length)
	        self.push(chunk);
	    }

	    self.push(null);
	  });

	  stream.on('data', function(chunk) {
	    debug('wrapped data');
	    if (state.decoder)
	      chunk = state.decoder.write(chunk);
	    if (!chunk || !state.objectMode && !chunk.length)
	      return;

	    var ret = self.push(chunk);
	    if (!ret) {
	      paused = true;
	      stream.pause();
	    }
	  });

	  // proxy all the other methods.
	  // important when wrapping filters and duplexes.
	  for (var i in stream) {
	    if (util.isFunction(stream[i]) && util.isUndefined(this[i])) {
	      this[i] = function(method) { return function() {
	        return stream[method].apply(stream, arguments);
	      }}(i);
	    }
	  }

	  // proxy certain important events.
	  var events = ['error', 'close', 'destroy', 'pause', 'resume'];
	  forEach(events, function(ev) {
	    stream.on(ev, self.emit.bind(self, ev));
	  });

	  // when we try to consume some more bytes, simply unpause the
	  // underlying stream.
	  self._read = function(n) {
	    debug('wrapped _read', n);
	    if (paused) {
	      paused = false;
	      stream.resume();
	    }
	  };

	  return self;
	};



	// exposed for testing purposes only.
	Readable._fromList = fromList;

	// Pluck off n bytes from an array of buffers.
	// Length is the combined lengths of all the buffers in the list.
	function fromList(n, state) {
	  var list = state.buffer;
	  var length = state.length;
	  var stringMode = !!state.decoder;
	  var objectMode = !!state.objectMode;
	  var ret;

	  // nothing in the list, definitely empty.
	  if (list.length === 0)
	    return null;

	  if (length === 0)
	    ret = null;
	  else if (objectMode)
	    ret = list.shift();
	  else if (!n || n >= length) {
	    // read it all, truncate the array.
	    if (stringMode)
	      ret = list.join('');
	    else
	      ret = Buffer.concat(list, length);
	    list.length = 0;
	  } else {
	    // read just some of it.
	    if (n < list[0].length) {
	      // just take a part of the first list item.
	      // slice is the same for buffers and strings.
	      var buf = list[0];
	      ret = buf.slice(0, n);
	      list[0] = buf.slice(n);
	    } else if (n === list[0].length) {
	      // first list is a perfect match
	      ret = list.shift();
	    } else {
	      // complex case.
	      // we have enough to cover it, but it spans past the first buffer.
	      if (stringMode)
	        ret = '';
	      else
	        ret = new Buffer(n);

	      var c = 0;
	      for (var i = 0, l = list.length; i < l && c < n; i++) {
	        var buf = list[0];
	        var cpy = Math.min(n - c, buf.length);

	        if (stringMode)
	          ret += buf.slice(0, cpy);
	        else
	          buf.copy(ret, c, 0, cpy);

	        if (cpy < buf.length)
	          list[0] = buf.slice(cpy);
	        else
	          list.shift();

	        c += cpy;
	      }
	    }
	  }

	  return ret;
	}

	function endReadable(stream) {
	  var state = stream._readableState;

	  // If we get here before consuming all the bytes, then that is a
	  // bug in node.  Should never happen.
	  if (state.length > 0)
	    throw new Error('endReadable called on non-empty stream');

	  if (!state.endEmitted) {
	    state.ended = true;
	    process.nextTick(function() {
	      // Check that we didn't get one last unshift.
	      if (!state.endEmitted && state.length === 0) {
	        state.endEmitted = true;
	        stream.readable = false;
	        stream.emit('end');
	      }
	    });
	  }
	}

	function forEach (xs, f) {
	  for (var i = 0, l = xs.length; i < l; i++) {
	    f(xs[i], i);
	  }
	}

	function indexOf (xs, x) {
	  for (var i = 0, l = xs.length; i < l; i++) {
	    if (xs[i] === x) return i;
	  }
	  return -1;
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)))

/***/ },
/* 46 */
/***/ function(module, exports) {

	module.exports = Array.isArray || function (arr) {
	  return Object.prototype.toString.call(arr) == '[object Array]';
	};


/***/ },
/* 47 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	// NOTE: These type checking functions intentionally don't use `instanceof`
	// because it is fragile and can be easily faked with `Object.create()`.

	function isArray(arg) {
	  if (Array.isArray) {
	    return Array.isArray(arg);
	  }
	  return objectToString(arg) === '[object Array]';
	}
	exports.isArray = isArray;

	function isBoolean(arg) {
	  return typeof arg === 'boolean';
	}
	exports.isBoolean = isBoolean;

	function isNull(arg) {
	  return arg === null;
	}
	exports.isNull = isNull;

	function isNullOrUndefined(arg) {
	  return arg == null;
	}
	exports.isNullOrUndefined = isNullOrUndefined;

	function isNumber(arg) {
	  return typeof arg === 'number';
	}
	exports.isNumber = isNumber;

	function isString(arg) {
	  return typeof arg === 'string';
	}
	exports.isString = isString;

	function isSymbol(arg) {
	  return typeof arg === 'symbol';
	}
	exports.isSymbol = isSymbol;

	function isUndefined(arg) {
	  return arg === void 0;
	}
	exports.isUndefined = isUndefined;

	function isRegExp(re) {
	  return objectToString(re) === '[object RegExp]';
	}
	exports.isRegExp = isRegExp;

	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}
	exports.isObject = isObject;

	function isDate(d) {
	  return objectToString(d) === '[object Date]';
	}
	exports.isDate = isDate;

	function isError(e) {
	  return (objectToString(e) === '[object Error]' || e instanceof Error);
	}
	exports.isError = isError;

	function isFunction(arg) {
	  return typeof arg === 'function';
	}
	exports.isFunction = isFunction;

	function isPrimitive(arg) {
	  return arg === null ||
	         typeof arg === 'boolean' ||
	         typeof arg === 'number' ||
	         typeof arg === 'string' ||
	         typeof arg === 'symbol' ||  // ES6 symbol
	         typeof arg === 'undefined';
	}
	exports.isPrimitive = isPrimitive;

	exports.isBuffer = Buffer.isBuffer;

	function objectToString(o) {
	  return Object.prototype.toString.call(o);
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(11).Buffer))

/***/ },
/* 48 */
/***/ function(module, exports) {

	if (typeof Object.create === 'function') {
	  // implementation from standard node.js 'util' module
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    ctor.prototype = Object.create(superCtor.prototype, {
	      constructor: {
	        value: ctor,
	        enumerable: false,
	        writable: true,
	        configurable: true
	      }
	    });
	  };
	} else {
	  // old school shim for old browsers
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    var TempCtor = function () {}
	    TempCtor.prototype = superCtor.prototype
	    ctor.prototype = new TempCtor()
	    ctor.prototype.constructor = ctor
	  }
	}


/***/ },
/* 49 */
/***/ function(module, exports) {

	/* (ignored) */

/***/ },
/* 50 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	// a duplex stream is just a stream that is both readable and writable.
	// Since JS doesn't have multiple prototypal inheritance, this class
	// prototypally inherits from Readable, and then parasitically from
	// Writable.

	module.exports = Duplex;

	/*<replacement>*/
	var objectKeys = Object.keys || function (obj) {
	  var keys = [];
	  for (var key in obj) keys.push(key);
	  return keys;
	}
	/*</replacement>*/


	/*<replacement>*/
	var util = __webpack_require__(47);
	util.inherits = __webpack_require__(48);
	/*</replacement>*/

	var Readable = __webpack_require__(45);
	var Writable = __webpack_require__(51);

	util.inherits(Duplex, Readable);

	forEach(objectKeys(Writable.prototype), function(method) {
	  if (!Duplex.prototype[method])
	    Duplex.prototype[method] = Writable.prototype[method];
	});

	function Duplex(options) {
	  if (!(this instanceof Duplex))
	    return new Duplex(options);

	  Readable.call(this, options);
	  Writable.call(this, options);

	  if (options && options.readable === false)
	    this.readable = false;

	  if (options && options.writable === false)
	    this.writable = false;

	  this.allowHalfOpen = true;
	  if (options && options.allowHalfOpen === false)
	    this.allowHalfOpen = false;

	  this.once('end', onend);
	}

	// the no-half-open enforcer
	function onend() {
	  // if we allow half-open state, or if the writable side ended,
	  // then we're ok.
	  if (this.allowHalfOpen || this._writableState.ended)
	    return;

	  // no more data can be written.
	  // But allow more writes to happen in this tick.
	  process.nextTick(this.end.bind(this));
	}

	function forEach (xs, f) {
	  for (var i = 0, l = xs.length; i < l; i++) {
	    f(xs[i], i);
	  }
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)))

/***/ },
/* 51 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	// A bit simpler than readable streams.
	// Implement an async ._write(chunk, cb), and it'll handle all
	// the drain event emission and buffering.

	module.exports = Writable;

	/*<replacement>*/
	var Buffer = __webpack_require__(11).Buffer;
	/*</replacement>*/

	Writable.WritableState = WritableState;


	/*<replacement>*/
	var util = __webpack_require__(47);
	util.inherits = __webpack_require__(48);
	/*</replacement>*/

	var Stream = __webpack_require__(41);

	util.inherits(Writable, Stream);

	function WriteReq(chunk, encoding, cb) {
	  this.chunk = chunk;
	  this.encoding = encoding;
	  this.callback = cb;
	}

	function WritableState(options, stream) {
	  var Duplex = __webpack_require__(50);

	  options = options || {};

	  // the point at which write() starts returning false
	  // Note: 0 is a valid value, means that we always return false if
	  // the entire buffer is not flushed immediately on write()
	  var hwm = options.highWaterMark;
	  var defaultHwm = options.objectMode ? 16 : 16 * 1024;
	  this.highWaterMark = (hwm || hwm === 0) ? hwm : defaultHwm;

	  // object stream flag to indicate whether or not this stream
	  // contains buffers or objects.
	  this.objectMode = !!options.objectMode;

	  if (stream instanceof Duplex)
	    this.objectMode = this.objectMode || !!options.writableObjectMode;

	  // cast to ints.
	  this.highWaterMark = ~~this.highWaterMark;

	  this.needDrain = false;
	  // at the start of calling end()
	  this.ending = false;
	  // when end() has been called, and returned
	  this.ended = false;
	  // when 'finish' is emitted
	  this.finished = false;

	  // should we decode strings into buffers before passing to _write?
	  // this is here so that some node-core streams can optimize string
	  // handling at a lower level.
	  var noDecode = options.decodeStrings === false;
	  this.decodeStrings = !noDecode;

	  // Crypto is kind of old and crusty.  Historically, its default string
	  // encoding is 'binary' so we have to make this configurable.
	  // Everything else in the universe uses 'utf8', though.
	  this.defaultEncoding = options.defaultEncoding || 'utf8';

	  // not an actual buffer we keep track of, but a measurement
	  // of how much we're waiting to get pushed to some underlying
	  // socket or file.
	  this.length = 0;

	  // a flag to see when we're in the middle of a write.
	  this.writing = false;

	  // when true all writes will be buffered until .uncork() call
	  this.corked = 0;

	  // a flag to be able to tell if the onwrite cb is called immediately,
	  // or on a later tick.  We set this to true at first, because any
	  // actions that shouldn't happen until "later" should generally also
	  // not happen before the first write call.
	  this.sync = true;

	  // a flag to know if we're processing previously buffered items, which
	  // may call the _write() callback in the same tick, so that we don't
	  // end up in an overlapped onwrite situation.
	  this.bufferProcessing = false;

	  // the callback that's passed to _write(chunk,cb)
	  this.onwrite = function(er) {
	    onwrite(stream, er);
	  };

	  // the callback that the user supplies to write(chunk,encoding,cb)
	  this.writecb = null;

	  // the amount that is being written when _write is called.
	  this.writelen = 0;

	  this.buffer = [];

	  // number of pending user-supplied write callbacks
	  // this must be 0 before 'finish' can be emitted
	  this.pendingcb = 0;

	  // emit prefinish if the only thing we're waiting for is _write cbs
	  // This is relevant for synchronous Transform streams
	  this.prefinished = false;

	  // True if the error was already emitted and should not be thrown again
	  this.errorEmitted = false;
	}

	function Writable(options) {
	  var Duplex = __webpack_require__(50);

	  // Writable ctor is applied to Duplexes, though they're not
	  // instanceof Writable, they're instanceof Readable.
	  if (!(this instanceof Writable) && !(this instanceof Duplex))
	    return new Writable(options);

	  this._writableState = new WritableState(options, this);

	  // legacy.
	  this.writable = true;

	  Stream.call(this);
	}

	// Otherwise people can pipe Writable streams, which is just wrong.
	Writable.prototype.pipe = function() {
	  this.emit('error', new Error('Cannot pipe. Not readable.'));
	};


	function writeAfterEnd(stream, state, cb) {
	  var er = new Error('write after end');
	  // TODO: defer error events consistently everywhere, not just the cb
	  stream.emit('error', er);
	  process.nextTick(function() {
	    cb(er);
	  });
	}

	// If we get something that is not a buffer, string, null, or undefined,
	// and we're not in objectMode, then that's an error.
	// Otherwise stream chunks are all considered to be of length=1, and the
	// watermarks determine how many objects to keep in the buffer, rather than
	// how many bytes or characters.
	function validChunk(stream, state, chunk, cb) {
	  var valid = true;
	  if (!util.isBuffer(chunk) &&
	      !util.isString(chunk) &&
	      !util.isNullOrUndefined(chunk) &&
	      !state.objectMode) {
	    var er = new TypeError('Invalid non-string/buffer chunk');
	    stream.emit('error', er);
	    process.nextTick(function() {
	      cb(er);
	    });
	    valid = false;
	  }
	  return valid;
	}

	Writable.prototype.write = function(chunk, encoding, cb) {
	  var state = this._writableState;
	  var ret = false;

	  if (util.isFunction(encoding)) {
	    cb = encoding;
	    encoding = null;
	  }

	  if (util.isBuffer(chunk))
	    encoding = 'buffer';
	  else if (!encoding)
	    encoding = state.defaultEncoding;

	  if (!util.isFunction(cb))
	    cb = function() {};

	  if (state.ended)
	    writeAfterEnd(this, state, cb);
	  else if (validChunk(this, state, chunk, cb)) {
	    state.pendingcb++;
	    ret = writeOrBuffer(this, state, chunk, encoding, cb);
	  }

	  return ret;
	};

	Writable.prototype.cork = function() {
	  var state = this._writableState;

	  state.corked++;
	};

	Writable.prototype.uncork = function() {
	  var state = this._writableState;

	  if (state.corked) {
	    state.corked--;

	    if (!state.writing &&
	        !state.corked &&
	        !state.finished &&
	        !state.bufferProcessing &&
	        state.buffer.length)
	      clearBuffer(this, state);
	  }
	};

	function decodeChunk(state, chunk, encoding) {
	  if (!state.objectMode &&
	      state.decodeStrings !== false &&
	      util.isString(chunk)) {
	    chunk = new Buffer(chunk, encoding);
	  }
	  return chunk;
	}

	// if we're already writing something, then just put this
	// in the queue, and wait our turn.  Otherwise, call _write
	// If we return false, then we need a drain event, so set that flag.
	function writeOrBuffer(stream, state, chunk, encoding, cb) {
	  chunk = decodeChunk(state, chunk, encoding);
	  if (util.isBuffer(chunk))
	    encoding = 'buffer';
	  var len = state.objectMode ? 1 : chunk.length;

	  state.length += len;

	  var ret = state.length < state.highWaterMark;
	  // we must ensure that previous needDrain will not be reset to false.
	  if (!ret)
	    state.needDrain = true;

	  if (state.writing || state.corked)
	    state.buffer.push(new WriteReq(chunk, encoding, cb));
	  else
	    doWrite(stream, state, false, len, chunk, encoding, cb);

	  return ret;
	}

	function doWrite(stream, state, writev, len, chunk, encoding, cb) {
	  state.writelen = len;
	  state.writecb = cb;
	  state.writing = true;
	  state.sync = true;
	  if (writev)
	    stream._writev(chunk, state.onwrite);
	  else
	    stream._write(chunk, encoding, state.onwrite);
	  state.sync = false;
	}

	function onwriteError(stream, state, sync, er, cb) {
	  if (sync)
	    process.nextTick(function() {
	      state.pendingcb--;
	      cb(er);
	    });
	  else {
	    state.pendingcb--;
	    cb(er);
	  }

	  stream._writableState.errorEmitted = true;
	  stream.emit('error', er);
	}

	function onwriteStateUpdate(state) {
	  state.writing = false;
	  state.writecb = null;
	  state.length -= state.writelen;
	  state.writelen = 0;
	}

	function onwrite(stream, er) {
	  var state = stream._writableState;
	  var sync = state.sync;
	  var cb = state.writecb;

	  onwriteStateUpdate(state);

	  if (er)
	    onwriteError(stream, state, sync, er, cb);
	  else {
	    // Check if we're actually ready to finish, but don't emit yet
	    var finished = needFinish(stream, state);

	    if (!finished &&
	        !state.corked &&
	        !state.bufferProcessing &&
	        state.buffer.length) {
	      clearBuffer(stream, state);
	    }

	    if (sync) {
	      process.nextTick(function() {
	        afterWrite(stream, state, finished, cb);
	      });
	    } else {
	      afterWrite(stream, state, finished, cb);
	    }
	  }
	}

	function afterWrite(stream, state, finished, cb) {
	  if (!finished)
	    onwriteDrain(stream, state);
	  state.pendingcb--;
	  cb();
	  finishMaybe(stream, state);
	}

	// Must force callback to be called on nextTick, so that we don't
	// emit 'drain' before the write() consumer gets the 'false' return
	// value, and has a chance to attach a 'drain' listener.
	function onwriteDrain(stream, state) {
	  if (state.length === 0 && state.needDrain) {
	    state.needDrain = false;
	    stream.emit('drain');
	  }
	}


	// if there's something in the buffer waiting, then process it
	function clearBuffer(stream, state) {
	  state.bufferProcessing = true;

	  if (stream._writev && state.buffer.length > 1) {
	    // Fast case, write everything using _writev()
	    var cbs = [];
	    for (var c = 0; c < state.buffer.length; c++)
	      cbs.push(state.buffer[c].callback);

	    // count the one we are adding, as well.
	    // TODO(isaacs) clean this up
	    state.pendingcb++;
	    doWrite(stream, state, true, state.length, state.buffer, '', function(err) {
	      for (var i = 0; i < cbs.length; i++) {
	        state.pendingcb--;
	        cbs[i](err);
	      }
	    });

	    // Clear buffer
	    state.buffer = [];
	  } else {
	    // Slow case, write chunks one-by-one
	    for (var c = 0; c < state.buffer.length; c++) {
	      var entry = state.buffer[c];
	      var chunk = entry.chunk;
	      var encoding = entry.encoding;
	      var cb = entry.callback;
	      var len = state.objectMode ? 1 : chunk.length;

	      doWrite(stream, state, false, len, chunk, encoding, cb);

	      // if we didn't call the onwrite immediately, then
	      // it means that we need to wait until it does.
	      // also, that means that the chunk and cb are currently
	      // being processed, so move the buffer counter past them.
	      if (state.writing) {
	        c++;
	        break;
	      }
	    }

	    if (c < state.buffer.length)
	      state.buffer = state.buffer.slice(c);
	    else
	      state.buffer.length = 0;
	  }

	  state.bufferProcessing = false;
	}

	Writable.prototype._write = function(chunk, encoding, cb) {
	  cb(new Error('not implemented'));

	};

	Writable.prototype._writev = null;

	Writable.prototype.end = function(chunk, encoding, cb) {
	  var state = this._writableState;

	  if (util.isFunction(chunk)) {
	    cb = chunk;
	    chunk = null;
	    encoding = null;
	  } else if (util.isFunction(encoding)) {
	    cb = encoding;
	    encoding = null;
	  }

	  if (!util.isNullOrUndefined(chunk))
	    this.write(chunk, encoding);

	  // .end() fully uncorks
	  if (state.corked) {
	    state.corked = 1;
	    this.uncork();
	  }

	  // ignore unnecessary end() calls.
	  if (!state.ending && !state.finished)
	    endWritable(this, state, cb);
	};


	function needFinish(stream, state) {
	  return (state.ending &&
	          state.length === 0 &&
	          !state.finished &&
	          !state.writing);
	}

	function prefinish(stream, state) {
	  if (!state.prefinished) {
	    state.prefinished = true;
	    stream.emit('prefinish');
	  }
	}

	function finishMaybe(stream, state) {
	  var need = needFinish(stream, state);
	  if (need) {
	    if (state.pendingcb === 0) {
	      prefinish(stream, state);
	      state.finished = true;
	      stream.emit('finish');
	    } else
	      prefinish(stream, state);
	  }
	  return need;
	}

	function endWritable(stream, state, cb) {
	  state.ending = true;
	  finishMaybe(stream, state);
	  if (cb) {
	    if (state.finished)
	      process.nextTick(cb);
	    else
	      stream.once('finish', cb);
	  }
	  state.ended = true;
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)))

/***/ },
/* 52 */
/***/ function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	var Buffer = __webpack_require__(11).Buffer;

	var isBufferEncoding = Buffer.isEncoding
	  || function(encoding) {
	       switch (encoding && encoding.toLowerCase()) {
	         case 'hex': case 'utf8': case 'utf-8': case 'ascii': case 'binary': case 'base64': case 'ucs2': case 'ucs-2': case 'utf16le': case 'utf-16le': case 'raw': return true;
	         default: return false;
	       }
	     }


	function assertEncoding(encoding) {
	  if (encoding && !isBufferEncoding(encoding)) {
	    throw new Error('Unknown encoding: ' + encoding);
	  }
	}

	// StringDecoder provides an interface for efficiently splitting a series of
	// buffers into a series of JS strings without breaking apart multi-byte
	// characters. CESU-8 is handled as part of the UTF-8 encoding.
	//
	// @TODO Handling all encodings inside a single object makes it very difficult
	// to reason about this code, so it should be split up in the future.
	// @TODO There should be a utf8-strict encoding that rejects invalid UTF-8 code
	// points as used by CESU-8.
	var StringDecoder = exports.StringDecoder = function(encoding) {
	  this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
	  assertEncoding(encoding);
	  switch (this.encoding) {
	    case 'utf8':
	      // CESU-8 represents each of Surrogate Pair by 3-bytes
	      this.surrogateSize = 3;
	      break;
	    case 'ucs2':
	    case 'utf16le':
	      // UTF-16 represents each of Surrogate Pair by 2-bytes
	      this.surrogateSize = 2;
	      this.detectIncompleteChar = utf16DetectIncompleteChar;
	      break;
	    case 'base64':
	      // Base-64 stores 3 bytes in 4 chars, and pads the remainder.
	      this.surrogateSize = 3;
	      this.detectIncompleteChar = base64DetectIncompleteChar;
	      break;
	    default:
	      this.write = passThroughWrite;
	      return;
	  }

	  // Enough space to store all bytes of a single character. UTF-8 needs 4
	  // bytes, but CESU-8 may require up to 6 (3 bytes per surrogate).
	  this.charBuffer = new Buffer(6);
	  // Number of bytes received for the current incomplete multi-byte character.
	  this.charReceived = 0;
	  // Number of bytes expected for the current incomplete multi-byte character.
	  this.charLength = 0;
	};


	// write decodes the given buffer and returns it as JS string that is
	// guaranteed to not contain any partial multi-byte characters. Any partial
	// character found at the end of the buffer is buffered up, and will be
	// returned when calling write again with the remaining bytes.
	//
	// Note: Converting a Buffer containing an orphan surrogate to a String
	// currently works, but converting a String to a Buffer (via `new Buffer`, or
	// Buffer#write) will replace incomplete surrogates with the unicode
	// replacement character. See https://codereview.chromium.org/121173009/ .
	StringDecoder.prototype.write = function(buffer) {
	  var charStr = '';
	  // if our last write ended with an incomplete multibyte character
	  while (this.charLength) {
	    // determine how many remaining bytes this buffer has to offer for this char
	    var available = (buffer.length >= this.charLength - this.charReceived) ?
	        this.charLength - this.charReceived :
	        buffer.length;

	    // add the new bytes to the char buffer
	    buffer.copy(this.charBuffer, this.charReceived, 0, available);
	    this.charReceived += available;

	    if (this.charReceived < this.charLength) {
	      // still not enough chars in this buffer? wait for more ...
	      return '';
	    }

	    // remove bytes belonging to the current character from the buffer
	    buffer = buffer.slice(available, buffer.length);

	    // get the character that was split
	    charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);

	    // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
	    var charCode = charStr.charCodeAt(charStr.length - 1);
	    if (charCode >= 0xD800 && charCode <= 0xDBFF) {
	      this.charLength += this.surrogateSize;
	      charStr = '';
	      continue;
	    }
	    this.charReceived = this.charLength = 0;

	    // if there are no more bytes in this buffer, just emit our char
	    if (buffer.length === 0) {
	      return charStr;
	    }
	    break;
	  }

	  // determine and set charLength / charReceived
	  this.detectIncompleteChar(buffer);

	  var end = buffer.length;
	  if (this.charLength) {
	    // buffer the incomplete character bytes we got
	    buffer.copy(this.charBuffer, 0, buffer.length - this.charReceived, end);
	    end -= this.charReceived;
	  }

	  charStr += buffer.toString(this.encoding, 0, end);

	  var end = charStr.length - 1;
	  var charCode = charStr.charCodeAt(end);
	  // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
	  if (charCode >= 0xD800 && charCode <= 0xDBFF) {
	    var size = this.surrogateSize;
	    this.charLength += size;
	    this.charReceived += size;
	    this.charBuffer.copy(this.charBuffer, size, 0, size);
	    buffer.copy(this.charBuffer, 0, 0, size);
	    return charStr.substring(0, end);
	  }

	  // or just emit the charStr
	  return charStr;
	};

	// detectIncompleteChar determines if there is an incomplete UTF-8 character at
	// the end of the given buffer. If so, it sets this.charLength to the byte
	// length that character, and sets this.charReceived to the number of bytes
	// that are available for this character.
	StringDecoder.prototype.detectIncompleteChar = function(buffer) {
	  // determine how many bytes we have to check at the end of this buffer
	  var i = (buffer.length >= 3) ? 3 : buffer.length;

	  // Figure out if one of the last i bytes of our buffer announces an
	  // incomplete char.
	  for (; i > 0; i--) {
	    var c = buffer[buffer.length - i];

	    // See http://en.wikipedia.org/wiki/UTF-8#Description

	    // 110XXXXX
	    if (i == 1 && c >> 5 == 0x06) {
	      this.charLength = 2;
	      break;
	    }

	    // 1110XXXX
	    if (i <= 2 && c >> 4 == 0x0E) {
	      this.charLength = 3;
	      break;
	    }

	    // 11110XXX
	    if (i <= 3 && c >> 3 == 0x1E) {
	      this.charLength = 4;
	      break;
	    }
	  }
	  this.charReceived = i;
	};

	StringDecoder.prototype.end = function(buffer) {
	  var res = '';
	  if (buffer && buffer.length)
	    res = this.write(buffer);

	  if (this.charReceived) {
	    var cr = this.charReceived;
	    var buf = this.charBuffer;
	    var enc = this.encoding;
	    res += buf.slice(0, cr).toString(enc);
	  }

	  return res;
	};

	function passThroughWrite(buffer) {
	  return buffer.toString(this.encoding);
	}

	function utf16DetectIncompleteChar(buffer) {
	  this.charReceived = buffer.length % 2;
	  this.charLength = this.charReceived ? 2 : 0;
	}

	function base64DetectIncompleteChar(buffer) {
	  this.charReceived = buffer.length % 3;
	  this.charLength = this.charReceived ? 3 : 0;
	}


/***/ },
/* 53 */
/***/ function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.


	// a transform stream is a readable/writable stream where you do
	// something with the data.  Sometimes it's called a "filter",
	// but that's not a great name for it, since that implies a thing where
	// some bits pass through, and others are simply ignored.  (That would
	// be a valid example of a transform, of course.)
	//
	// While the output is causally related to the input, it's not a
	// necessarily symmetric or synchronous transformation.  For example,
	// a zlib stream might take multiple plain-text writes(), and then
	// emit a single compressed chunk some time in the future.
	//
	// Here's how this works:
	//
	// The Transform stream has all the aspects of the readable and writable
	// stream classes.  When you write(chunk), that calls _write(chunk,cb)
	// internally, and returns false if there's a lot of pending writes
	// buffered up.  When you call read(), that calls _read(n) until
	// there's enough pending readable data buffered up.
	//
	// In a transform stream, the written data is placed in a buffer.  When
	// _read(n) is called, it transforms the queued up data, calling the
	// buffered _write cb's as it consumes chunks.  If consuming a single
	// written chunk would result in multiple output chunks, then the first
	// outputted bit calls the readcb, and subsequent chunks just go into
	// the read buffer, and will cause it to emit 'readable' if necessary.
	//
	// This way, back-pressure is actually determined by the reading side,
	// since _read has to be called to start processing a new chunk.  However,
	// a pathological inflate type of transform can cause excessive buffering
	// here.  For example, imagine a stream where every byte of input is
	// interpreted as an integer from 0-255, and then results in that many
	// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
	// 1kb of data being output.  In this case, you could write a very small
	// amount of input, and end up with a very large amount of output.  In
	// such a pathological inflating mechanism, there'd be no way to tell
	// the system to stop doing the transform.  A single 4MB write could
	// cause the system to run out of memory.
	//
	// However, even in such a pathological case, only a single written chunk
	// would be consumed, and then the rest would wait (un-transformed) until
	// the results of the previous transformed chunk were consumed.

	module.exports = Transform;

	var Duplex = __webpack_require__(50);

	/*<replacement>*/
	var util = __webpack_require__(47);
	util.inherits = __webpack_require__(48);
	/*</replacement>*/

	util.inherits(Transform, Duplex);


	function TransformState(options, stream) {
	  this.afterTransform = function(er, data) {
	    return afterTransform(stream, er, data);
	  };

	  this.needTransform = false;
	  this.transforming = false;
	  this.writecb = null;
	  this.writechunk = null;
	}

	function afterTransform(stream, er, data) {
	  var ts = stream._transformState;
	  ts.transforming = false;

	  var cb = ts.writecb;

	  if (!cb)
	    return stream.emit('error', new Error('no writecb in Transform class'));

	  ts.writechunk = null;
	  ts.writecb = null;

	  if (!util.isNullOrUndefined(data))
	    stream.push(data);

	  if (cb)
	    cb(er);

	  var rs = stream._readableState;
	  rs.reading = false;
	  if (rs.needReadable || rs.length < rs.highWaterMark) {
	    stream._read(rs.highWaterMark);
	  }
	}


	function Transform(options) {
	  if (!(this instanceof Transform))
	    return new Transform(options);

	  Duplex.call(this, options);

	  this._transformState = new TransformState(options, this);

	  // when the writable side finishes, then flush out anything remaining.
	  var stream = this;

	  // start out asking for a readable event once data is transformed.
	  this._readableState.needReadable = true;

	  // we have implemented the _read method, and done the other things
	  // that Readable wants before the first _read call, so unset the
	  // sync guard flag.
	  this._readableState.sync = false;

	  this.once('prefinish', function() {
	    if (util.isFunction(this._flush))
	      this._flush(function(er) {
	        done(stream, er);
	      });
	    else
	      done(stream);
	  });
	}

	Transform.prototype.push = function(chunk, encoding) {
	  this._transformState.needTransform = false;
	  return Duplex.prototype.push.call(this, chunk, encoding);
	};

	// This is the part where you do stuff!
	// override this function in implementation classes.
	// 'chunk' is an input chunk.
	//
	// Call `push(newChunk)` to pass along transformed output
	// to the readable side.  You may call 'push' zero or more times.
	//
	// Call `cb(err)` when you are done with this chunk.  If you pass
	// an error, then that'll put the hurt on the whole operation.  If you
	// never call cb(), then you'll never get another chunk.
	Transform.prototype._transform = function(chunk, encoding, cb) {
	  throw new Error('not implemented');
	};

	Transform.prototype._write = function(chunk, encoding, cb) {
	  var ts = this._transformState;
	  ts.writecb = cb;
	  ts.writechunk = chunk;
	  ts.writeencoding = encoding;
	  if (!ts.transforming) {
	    var rs = this._readableState;
	    if (ts.needTransform ||
	        rs.needReadable ||
	        rs.length < rs.highWaterMark)
	      this._read(rs.highWaterMark);
	  }
	};

	// Doesn't matter what the args are here.
	// _transform does all the work.
	// That we got here means that the readable side wants more data.
	Transform.prototype._read = function(n) {
	  var ts = this._transformState;

	  if (!util.isNull(ts.writechunk) && ts.writecb && !ts.transforming) {
	    ts.transforming = true;
	    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
	  } else {
	    // mark that we need a transform, so that any data that comes in
	    // will get processed, now that we've asked for it.
	    ts.needTransform = true;
	  }
	};


	function done(stream, er) {
	  if (er)
	    return stream.emit('error', er);

	  // if there's nothing in the write buffer, then that means
	  // that nothing more will ever be provided
	  var ws = stream._writableState;
	  var ts = stream._transformState;

	  if (ws.length)
	    throw new Error('calling transform done when ws.length != 0');

	  if (ts.transforming)
	    throw new Error('calling transform done when still transforming');

	  return stream.push(null);
	}


/***/ },
/* 54 */
/***/ function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	// a passthrough stream.
	// basically just the most minimal sort of Transform stream.
	// Every written chunk gets output as-is.

	module.exports = PassThrough;

	var Transform = __webpack_require__(53);

	/*<replacement>*/
	var util = __webpack_require__(47);
	util.inherits = __webpack_require__(48);
	/*</replacement>*/

	util.inherits(PassThrough, Transform);

	function PassThrough(options) {
	  if (!(this instanceof PassThrough))
	    return new PassThrough(options);

	  Transform.call(this, options);
	}

	PassThrough.prototype._transform = function(chunk, encoding, cb) {
	  cb(null, chunk);
	};


/***/ },
/* 55 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(51)


/***/ },
/* 56 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(50)


/***/ },
/* 57 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(53)


/***/ },
/* 58 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(54)


/***/ },
/* 59 */
/***/ function(module, exports, __webpack_require__) {

	var AWS = __webpack_require__(8);
	var Stream = AWS.util.nodeRequire('stream').Stream;
	var WritableStream = AWS.util.nodeRequire('stream').Writable;
	var ReadableStream = AWS.util.nodeRequire('stream').Readable;
	__webpack_require__(60);

	/**
	 * @api private
	 */
	AWS.NodeHttpClient = AWS.util.inherit({
	  handleRequest: function handleRequest(httpRequest, httpOptions, callback, errCallback) {
	    var cbAlreadyCalled = false;
	    var endpoint = httpRequest.endpoint;
	    var pathPrefix = '';
	    if (!httpOptions) httpOptions = {};
	    if (httpOptions.proxy) {
	      pathPrefix = endpoint.protocol + '//' + endpoint.hostname;
	      if (endpoint.port !== 80 && endpoint.port !== 443) {
	        pathPrefix += ':' + endpoint.port;
	      }
	      endpoint = new AWS.Endpoint(httpOptions.proxy);
	    }

	    var useSSL = endpoint.protocol === 'https:';
	    var http = useSSL ? __webpack_require__(61) : __webpack_require__(62);
	    var options = {
	      host: endpoint.hostname,
	      port: endpoint.port,
	      method: httpRequest.method,
	      headers: httpRequest.headers,
	      path: pathPrefix + httpRequest.path
	    };

	    if (useSSL && !httpOptions.agent) {
	      options.agent = this.sslAgent();
	    }

	    AWS.util.update(options, httpOptions);
	    delete options.proxy; // proxy isn't an HTTP option
	    delete options.timeout; // timeout isn't an HTTP option

	    var stream = http.request(options, function (httpResp) {
	      if (cbAlreadyCalled) return; cbAlreadyCalled = true;

	      callback(httpResp);
	      httpResp.emit('headers', httpResp.statusCode, httpResp.headers);
	    });
	    httpRequest.stream = stream; // attach stream to httpRequest

	    // timeout support
	    stream.setTimeout(httpOptions.timeout || 0, function() {
	      if (cbAlreadyCalled) return; cbAlreadyCalled = true;

	      var msg = 'Connection timed out after ' + httpOptions.timeout + 'ms';
	      errCallback(AWS.util.error(new Error(msg), {code: 'TimeoutError'}));
	      stream.abort();
	    });

	    stream.on('error', function() {
	      if (cbAlreadyCalled) return; cbAlreadyCalled = true;
	      errCallback.apply(this, arguments);
	    });

	    this.writeBody(stream, httpRequest);
	    return stream;
	  },

	  writeBody: function writeBody(stream, httpRequest) {
	    var body = httpRequest.body;

	    if (body && WritableStream && ReadableStream) { // progress support
	      if (!(body instanceof Stream)) body = AWS.util.buffer.toStream(body);
	      body.pipe(this.progressStream(stream, httpRequest));
	    }

	    if (body instanceof Stream) {
	      body.pipe(stream);
	    } else if (body) {
	      stream.end(body);
	    } else {
	      stream.end();
	    }
	  },

	  sslAgent: function sslAgent() {
	    var https = __webpack_require__(61);

	    if (!AWS.NodeHttpClient.sslAgent) {
	      AWS.NodeHttpClient.sslAgent = new https.Agent({rejectUnauthorized: true});
	      AWS.NodeHttpClient.sslAgent.setMaxListeners(0);

	      // delegate maxSockets to globalAgent
	      Object.defineProperty(AWS.NodeHttpClient.sslAgent, 'maxSockets', {
	        enumerable: true,
	        get: function() { return https.globalAgent.maxSockets; }
	      });
	    }
	    return AWS.NodeHttpClient.sslAgent;
	  },

	  progressStream: function progressStream(stream, httpRequest) {
	    var numBytes = 0;
	    var totalBytes = httpRequest.headers['Content-Length'];
	    var writer = new WritableStream();
	    writer._write = function(chunk, encoding, callback) {
	      if (chunk) {
	        numBytes += chunk.length;
	        stream.emit('sendProgress', {
	          loaded: numBytes, total: totalBytes
	        });
	      }
	      callback();
	    };
	    return writer;
	  },

	  emitter: null
	});

	/**
	 * @!ignore
	 */

	/**
	 * @api private
	 */
	AWS.HttpClient.prototype = AWS.NodeHttpClient.prototype;

	/**
	 * @api private
	 */
	AWS.HttpClient.streamsApiVersion = ReadableStream ? 2 : 1;


/***/ },
/* 60 */
/***/ function(module, exports, __webpack_require__) {

	var AWS = __webpack_require__(8);
	var inherit = AWS.util.inherit;

	/**
	 * The endpoint that a service will talk to, for example,
	 * `'https://ec2.ap-southeast-1.amazonaws.com'`. If
	 * you need to override an endpoint for a service, you can
	 * set the endpoint on a service by passing the endpoint
	 * object with the `endpoint` option key:
	 *
	 * ```javascript
	 * var ep = new AWS.Endpoint('awsproxy.example.com');
	 * var s3 = new AWS.S3({endpoint: ep});
	 * s3.service.endpoint.hostname == 'awsproxy.example.com'
	 * ```
	 *
	 * Note that if you do not specify a protocol, the protocol will
	 * be selected based on your current {AWS.config} configuration.
	 *
	 * @!attribute protocol
	 *   @return [String] the protocol (http or https) of the endpoint
	 *     URL
	 * @!attribute hostname
	 *   @return [String] the host portion of the endpoint, e.g.,
	 *     example.com
	 * @!attribute host
	 *   @return [String] the host portion of the endpoint including
	 *     the port, e.g., example.com:80
	 * @!attribute port
	 *   @return [Integer] the port of the endpoint
	 * @!attribute href
	 *   @return [String] the full URL of the endpoint
	 */
	AWS.Endpoint = inherit({

	  /**
	   * @overload Endpoint(endpoint)
	   *   Constructs a new endpoint given an endpoint URL. If the
	   *   URL omits a protocol (http or https), the default protocol
	   *   set in the global {AWS.config} will be used.
	   *   @param endpoint [String] the URL to construct an endpoint from
	   */
	  constructor: function Endpoint(endpoint, config) {
	    AWS.util.hideProperties(this, ['slashes', 'auth', 'hash', 'search', 'query']);

	    if (typeof endpoint === 'undefined' || endpoint === null) {
	      throw new Error('Invalid endpoint: ' + endpoint);
	    } else if (typeof endpoint !== 'string') {
	      return AWS.util.copy(endpoint);
	    }

	    if (!endpoint.match(/^http/)) {
	      var useSSL = config && config.sslEnabled !== undefined ?
	        config.sslEnabled : AWS.config.sslEnabled;
	      endpoint = (useSSL ? 'https' : 'http') + '://' + endpoint;
	    }

	    AWS.util.update(this, AWS.util.urlParse(endpoint));

	    // Ensure the port property is set as an integer
	    if (this.port) {
	      this.port = parseInt(this.port, 10);
	    } else {
	      this.port = this.protocol === 'https:' ? 443 : 80;
	    }
	  }

	});

	/**
	 * The low level HTTP request object, encapsulating all HTTP header
	 * and body data sent by a service request.
	 *
	 * @!attribute method
	 *   @return [String] the HTTP method of the request
	 * @!attribute path
	 *   @return [String] the path portion of the URI, e.g.,
	 *     "/list/?start=5&num=10"
	 * @!attribute headers
	 *   @return [map<String,String>]
	 *     a map of header keys and their respective values
	 * @!attribute body
	 *   @return [String] the request body payload
	 * @!attribute endpoint
	 *   @return [AWS.Endpoint] the endpoint for the request
	 * @!attribute region
	 *   @api private
	 *   @return [String] the region, for signing purposes only.
	 */
	AWS.HttpRequest = inherit({

	  /**
	   * @api private
	   */
	  constructor: function HttpRequest(endpoint, region) {
	    endpoint = new AWS.Endpoint(endpoint);
	    this.method = 'POST';
	    this.path = endpoint.path || '/';
	    this.headers = {};
	    this.body = '';
	    this.endpoint = endpoint;
	    this.region = region;
	    this.setUserAgent();
	  },

	  /**
	   * @api private
	   */
	  setUserAgent: function setUserAgent() {
	    var prefix = AWS.util.isBrowser() ? 'X-Amz-' : '';
	    this.headers[prefix + 'User-Agent'] = AWS.util.userAgent();
	  },

	  /**
	   * @return [String] the part of the {path} excluding the
	   *   query string
	   */
	  pathname: function pathname() {
	    return this.path.split('?', 1)[0];
	  },

	  /**
	   * @return [String] the query string portion of the {path}
	   */
	  search: function search() {
	    var query = this.path.split('?', 2)[1];
	    if (query) {
	      query = AWS.util.queryStringParse(query);
	      return AWS.util.queryParamsToString(query);
	    }
	    return '';
	  }

	});

	/**
	 * The low level HTTP response object, encapsulating all HTTP header
	 * and body data returned from the request.
	 *
	 * @!attribute statusCode
	 *   @return [Integer] the HTTP status code of the response (e.g., 200, 404)
	 * @!attribute headers
	 *   @return [map<String,String>]
	 *      a map of response header keys and their respective values
	 * @!attribute body
	 *   @return [String] the response body payload
	 * @!attribute [r] streaming
	 *   @return [Boolean] whether this response is being streamed at a low-level.
	 *     Defaults to `false` (buffered reads). Do not modify this manually, use
	 *     {createUnbufferedStream} to convert the stream to unbuffered mode
	 *     instead.
	 */
	AWS.HttpResponse = inherit({

	  /**
	   * @api private
	   */
	  constructor: function HttpResponse() {
	    this.statusCode = undefined;
	    this.headers = {};
	    this.body = undefined;
	    this.streaming = false;
	    this.stream = null;
	  },

	  /**
	   * Disables buffering on the HTTP response and returns the stream for reading.
	   * @return [Stream, XMLHttpRequest, null] the underlying stream object.
	   *   Use this object to directly read data off of the stream.
	   * @note This object is only available after the {AWS.Request~httpHeaders}
	   *   event has fired. This method must be called prior to
	   *   {AWS.Request~httpData}.
	   * @example Taking control of a stream
	   *   request.on('httpHeaders', function(statusCode, headers) {
	   *     if (statusCode < 300) {
	   *       if (headers.etag === 'xyz') {
	   *         // pipe the stream, disabling buffering
	   *         var stream = this.response.httpResponse.createUnbufferedStream();
	   *         stream.pipe(process.stdout);
	   *       } else { // abort this request and set a better error message
	   *         this.abort();
	   *         this.response.error = new Error('Invalid ETag');
	   *       }
	   *     }
	   *   }).send(console.log);
	   */
	  createUnbufferedStream: function createUnbufferedStream() {
	    this.streaming = true;
	    return this.stream;
	  }
	});


	AWS.HttpClient = inherit({});

	/**
	 * @api private
	 */
	AWS.HttpClient.getInstance = function getInstance() {
	  if (this.singleton === undefined) {
	    this.singleton = new this();
	  }
	  return this.singleton;
	};


/***/ },
/* 61 */
/***/ function(module, exports, __webpack_require__) {

	var http = __webpack_require__(62);

	var https = module.exports;

	for (var key in http) {
	    if (http.hasOwnProperty(key)) https[key] = http[key];
	};

	https.request = function (params, cb) {
	    if (!params) params = {};
	    params.scheme = 'https';
	    return http.request.call(this, params, cb);
	}


/***/ },
/* 62 */
/***/ function(module, exports, __webpack_require__) {

	var http = module.exports;
	var EventEmitter = __webpack_require__(42).EventEmitter;
	var Request = __webpack_require__(63);
	var url = __webpack_require__(67)

	http.request = function (params, cb) {
	    if (typeof params === 'string') {
	        params = url.parse(params)
	    }
	    if (!params) params = {};
	    if (!params.host && !params.port) {
	        params.port = parseInt(window.location.port, 10);
	    }
	    if (!params.host && params.hostname) {
	        params.host = params.hostname;
	    }

	    if (!params.protocol) {
	        if (params.scheme) {
	            params.protocol = params.scheme + ':';
	        } else {
	            params.protocol = window.location.protocol;
	        }
	    }

	    if (!params.host) {
	        params.host = window.location.hostname || window.location.host;
	    }
	    if (/:/.test(params.host)) {
	        if (!params.port) {
	            params.port = params.host.split(':')[1];
	        }
	        params.host = params.host.split(':')[0];
	    }
	    if (!params.port) params.port = params.protocol == 'https:' ? 443 : 80;
	    
	    var req = new Request(new xhrHttp, params);
	    if (cb) req.on('response', cb);
	    return req;
	};

	http.get = function (params, cb) {
	    params.method = 'GET';
	    var req = http.request(params, cb);
	    req.end();
	    return req;
	};

	http.Agent = function () {};
	http.Agent.defaultMaxSockets = 4;

	var xhrHttp = (function () {
	    if (typeof window === 'undefined') {
	        throw new Error('no window object present');
	    }
	    else if (window.XMLHttpRequest) {
	        return window.XMLHttpRequest;
	    }
	    else if (window.ActiveXObject) {
	        var axs = [
	            'Msxml2.XMLHTTP.6.0',
	            'Msxml2.XMLHTTP.3.0',
	            'Microsoft.XMLHTTP'
	        ];
	        for (var i = 0; i < axs.length; i++) {
	            try {
	                var ax = new(window.ActiveXObject)(axs[i]);
	                return function () {
	                    if (ax) {
	                        var ax_ = ax;
	                        ax = null;
	                        return ax_;
	                    }
	                    else {
	                        return new(window.ActiveXObject)(axs[i]);
	                    }
	                };
	            }
	            catch (e) {}
	        }
	        throw new Error('ajax not supported in this browser')
	    }
	    else {
	        throw new Error('ajax not supported in this browser');
	    }
	})();

	http.STATUS_CODES = {
	    100 : 'Continue',
	    101 : 'Switching Protocols',
	    102 : 'Processing',                 // RFC 2518, obsoleted by RFC 4918
	    200 : 'OK',
	    201 : 'Created',
	    202 : 'Accepted',
	    203 : 'Non-Authoritative Information',
	    204 : 'No Content',
	    205 : 'Reset Content',
	    206 : 'Partial Content',
	    207 : 'Multi-Status',               // RFC 4918
	    300 : 'Multiple Choices',
	    301 : 'Moved Permanently',
	    302 : 'Moved Temporarily',
	    303 : 'See Other',
	    304 : 'Not Modified',
	    305 : 'Use Proxy',
	    307 : 'Temporary Redirect',
	    400 : 'Bad Request',
	    401 : 'Unauthorized',
	    402 : 'Payment Required',
	    403 : 'Forbidden',
	    404 : 'Not Found',
	    405 : 'Method Not Allowed',
	    406 : 'Not Acceptable',
	    407 : 'Proxy Authentication Required',
	    408 : 'Request Time-out',
	    409 : 'Conflict',
	    410 : 'Gone',
	    411 : 'Length Required',
	    412 : 'Precondition Failed',
	    413 : 'Request Entity Too Large',
	    414 : 'Request-URI Too Large',
	    415 : 'Unsupported Media Type',
	    416 : 'Requested Range Not Satisfiable',
	    417 : 'Expectation Failed',
	    418 : 'I\'m a teapot',              // RFC 2324
	    422 : 'Unprocessable Entity',       // RFC 4918
	    423 : 'Locked',                     // RFC 4918
	    424 : 'Failed Dependency',          // RFC 4918
	    425 : 'Unordered Collection',       // RFC 4918
	    426 : 'Upgrade Required',           // RFC 2817
	    428 : 'Precondition Required',      // RFC 6585
	    429 : 'Too Many Requests',          // RFC 6585
	    431 : 'Request Header Fields Too Large',// RFC 6585
	    500 : 'Internal Server Error',
	    501 : 'Not Implemented',
	    502 : 'Bad Gateway',
	    503 : 'Service Unavailable',
	    504 : 'Gateway Time-out',
	    505 : 'HTTP Version Not Supported',
	    506 : 'Variant Also Negotiates',    // RFC 2295
	    507 : 'Insufficient Storage',       // RFC 4918
	    509 : 'Bandwidth Limit Exceeded',
	    510 : 'Not Extended',               // RFC 2774
	    511 : 'Network Authentication Required' // RFC 6585
	};

/***/ },
/* 63 */
/***/ function(module, exports, __webpack_require__) {

	var Stream = __webpack_require__(41);
	var Response = __webpack_require__(64);
	var Base64 = __webpack_require__(65);
	var inherits = __webpack_require__(66);

	var Request = module.exports = function (xhr, params) {
	    var self = this;
	    self.writable = true;
	    self.xhr = xhr;
	    self.body = [];
	    
	    self.uri = (params.protocol || 'http:') + '//'
	        + params.host
	        + (params.port ? ':' + params.port : '')
	        + (params.path || '/')
	    ;
	    
	    if (typeof params.withCredentials === 'undefined') {
	        params.withCredentials = true;
	    }

	    try { xhr.withCredentials = params.withCredentials }
	    catch (e) {}
	    
	    if (params.responseType) try { xhr.responseType = params.responseType }
	    catch (e) {}
	    
	    xhr.open(
	        params.method || 'GET',
	        self.uri,
	        true
	    );

	    xhr.onerror = function(event) {
	        self.emit('error', new Error('Network error'));
	    };

	    self._headers = {};
	    
	    if (params.headers) {
	        var keys = objectKeys(params.headers);
	        for (var i = 0; i < keys.length; i++) {
	            var key = keys[i];
	            if (!self.isSafeRequestHeader(key)) continue;
	            var value = params.headers[key];
	            self.setHeader(key, value);
	        }
	    }
	    
	    if (params.auth) {
	        //basic auth
	        this.setHeader('Authorization', 'Basic ' + Base64.btoa(params.auth));
	    }

	    var res = new Response;
	    res.on('close', function () {
	        self.emit('close');
	    });
	    
	    res.on('ready', function () {
	        self.emit('response', res);
	    });

	    res.on('error', function (err) {
	        self.emit('error', err);
	    });
	    
	    xhr.onreadystatechange = function () {
	        // Fix for IE9 bug
	        // SCRIPT575: Could not complete the operation due to error c00c023f
	        // It happens when a request is aborted, calling the success callback anyway with readyState === 4
	        if (xhr.__aborted) return;
	        res.handle(xhr);
	    };
	};

	inherits(Request, Stream);

	Request.prototype.setHeader = function (key, value) {
	    this._headers[key.toLowerCase()] = value
	};

	Request.prototype.getHeader = function (key) {
	    return this._headers[key.toLowerCase()]
	};

	Request.prototype.removeHeader = function (key) {
	    delete this._headers[key.toLowerCase()]
	};

	Request.prototype.write = function (s) {
	    this.body.push(s);
	};

	Request.prototype.destroy = function (s) {
	    this.xhr.__aborted = true;
	    this.xhr.abort();
	    this.emit('close');
	};

	Request.prototype.end = function (s) {
	    if (s !== undefined) this.body.push(s);

	    var keys = objectKeys(this._headers);
	    for (var i = 0; i < keys.length; i++) {
	        var key = keys[i];
	        var value = this._headers[key];
	        if (isArray(value)) {
	            for (var j = 0; j < value.length; j++) {
	                this.xhr.setRequestHeader(key, value[j]);
	            }
	        }
	        else this.xhr.setRequestHeader(key, value)
	    }

	    if (this.body.length === 0) {
	        this.xhr.send('');
	    }
	    else if (typeof this.body[0] === 'string') {
	        this.xhr.send(this.body.join(''));
	    }
	    else if (isArray(this.body[0])) {
	        var body = [];
	        for (var i = 0; i < this.body.length; i++) {
	            body.push.apply(body, this.body[i]);
	        }
	        this.xhr.send(body);
	    }
	    else if (/Array/.test(Object.prototype.toString.call(this.body[0]))) {
	        var len = 0;
	        for (var i = 0; i < this.body.length; i++) {
	            len += this.body[i].length;
	        }
	        var body = new(this.body[0].constructor)(len);
	        var k = 0;
	        
	        for (var i = 0; i < this.body.length; i++) {
	            var b = this.body[i];
	            for (var j = 0; j < b.length; j++) {
	                body[k++] = b[j];
	            }
	        }
	        this.xhr.send(body);
	    }
	    else if (isXHR2Compatible(this.body[0])) {
	        this.xhr.send(this.body[0]);
	    }
	    else {
	        var body = '';
	        for (var i = 0; i < this.body.length; i++) {
	            body += this.body[i].toString();
	        }
	        this.xhr.send(body);
	    }
	};

	// Taken from http://dxr.mozilla.org/mozilla/mozilla-central/content/base/src/nsXMLHttpRequest.cpp.html
	Request.unsafeHeaders = [
	    "accept-charset",
	    "accept-encoding",
	    "access-control-request-headers",
	    "access-control-request-method",
	    "connection",
	    "content-length",
	    "cookie",
	    "cookie2",
	    "content-transfer-encoding",
	    "date",
	    "expect",
	    "host",
	    "keep-alive",
	    "origin",
	    "referer",
	    "te",
	    "trailer",
	    "transfer-encoding",
	    "upgrade",
	    "user-agent",
	    "via"
	];

	Request.prototype.isSafeRequestHeader = function (headerName) {
	    if (!headerName) return false;
	    return indexOf(Request.unsafeHeaders, headerName.toLowerCase()) === -1;
	};

	var objectKeys = Object.keys || function (obj) {
	    var keys = [];
	    for (var key in obj) keys.push(key);
	    return keys;
	};

	var isArray = Array.isArray || function (xs) {
	    return Object.prototype.toString.call(xs) === '[object Array]';
	};

	var indexOf = function (xs, x) {
	    if (xs.indexOf) return xs.indexOf(x);
	    for (var i = 0; i < xs.length; i++) {
	        if (xs[i] === x) return i;
	    }
	    return -1;
	};

	var isXHR2Compatible = function (obj) {
	    if (typeof Blob !== 'undefined' && obj instanceof Blob) return true;
	    if (typeof ArrayBuffer !== 'undefined' && obj instanceof ArrayBuffer) return true;
	    if (typeof FormData !== 'undefined' && obj instanceof FormData) return true;
	};


/***/ },
/* 64 */
/***/ function(module, exports, __webpack_require__) {

	var Stream = __webpack_require__(41);
	var util = __webpack_require__(21);

	var Response = module.exports = function (res) {
	    this.offset = 0;
	    this.readable = true;
	};

	util.inherits(Response, Stream);

	var capable = {
	    streaming : true,
	    status2 : true
	};

	function parseHeaders (res) {
	    var lines = res.getAllResponseHeaders().split(/\r?\n/);
	    var headers = {};
	    for (var i = 0; i < lines.length; i++) {
	        var line = lines[i];
	        if (line === '') continue;
	        
	        var m = line.match(/^([^:]+):\s*(.*)/);
	        if (m) {
	            var key = m[1].toLowerCase(), value = m[2];
	            
	            if (headers[key] !== undefined) {
	            
	                if (isArray(headers[key])) {
	                    headers[key].push(value);
	                }
	                else {
	                    headers[key] = [ headers[key], value ];
	                }
	            }
	            else {
	                headers[key] = value;
	            }
	        }
	        else {
	            headers[line] = true;
	        }
	    }
	    return headers;
	}

	Response.prototype.getResponse = function (xhr) {
	    var respType = String(xhr.responseType).toLowerCase();
	    if (respType === 'blob') return xhr.responseBlob || xhr.response;
	    if (respType === 'arraybuffer') return xhr.response;
	    return xhr.responseText;
	}

	Response.prototype.getHeader = function (key) {
	    return this.headers[key.toLowerCase()];
	};

	Response.prototype.handle = function (res) {
	    if (res.readyState === 2 && capable.status2) {
	        try {
	            this.statusCode = res.status;
	            this.headers = parseHeaders(res);
	        }
	        catch (err) {
	            capable.status2 = false;
	        }
	        
	        if (capable.status2) {
	            this.emit('ready');
	        }
	    }
	    else if (capable.streaming && res.readyState === 3) {
	        try {
	            if (!this.statusCode) {
	                this.statusCode = res.status;
	                this.headers = parseHeaders(res);
	                this.emit('ready');
	            }
	        }
	        catch (err) {}
	        
	        try {
	            this._emitData(res);
	        }
	        catch (err) {
	            capable.streaming = false;
	        }
	    }
	    else if (res.readyState === 4) {
	        if (!this.statusCode) {
	            this.statusCode = res.status;
	            this.emit('ready');
	        }
	        this._emitData(res);
	        
	        if (res.error) {
	            this.emit('error', this.getResponse(res));
	        }
	        else this.emit('end');
	        
	        this.emit('close');
	    }
	};

	Response.prototype._emitData = function (res) {
	    var respBody = this.getResponse(res);
	    if (respBody.toString().match(/ArrayBuffer/)) {
	        this.emit('data', new Uint8Array(respBody, this.offset));
	        this.offset = respBody.byteLength;
	        return;
	    }
	    if (respBody.length > this.offset) {
	        this.emit('data', respBody.slice(this.offset));
	        this.offset = respBody.length;
	    }
	};

	var isArray = Array.isArray || function (xs) {
	    return Object.prototype.toString.call(xs) === '[object Array]';
	};


/***/ },
/* 65 */
/***/ function(module, exports, __webpack_require__) {

	;(function () {

	  var object =  true ? exports : this; // #8: web workers
	  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

	  function InvalidCharacterError(message) {
	    this.message = message;
	  }
	  InvalidCharacterError.prototype = new Error;
	  InvalidCharacterError.prototype.name = 'InvalidCharacterError';

	  // encoder
	  // [https://gist.github.com/999166] by [https://github.com/nignag]
	  object.btoa || (
	  object.btoa = function (input) {
	    for (
	      // initialize result and counter
	      var block, charCode, idx = 0, map = chars, output = '';
	      // if the next input index does not exist:
	      //   change the mapping table to "="
	      //   check if d has no fractional digits
	      input.charAt(idx | 0) || (map = '=', idx % 1);
	      // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
	      output += map.charAt(63 & block >> 8 - idx % 1 * 8)
	    ) {
	      charCode = input.charCodeAt(idx += 3/4);
	      if (charCode > 0xFF) {
	        throw new InvalidCharacterError("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
	      }
	      block = block << 8 | charCode;
	    }
	    return output;
	  });

	  // decoder
	  // [https://gist.github.com/1020396] by [https://github.com/atk]
	  object.atob || (
	  object.atob = function (input) {
	    input = input.replace(/=+$/, '');
	    if (input.length % 4 == 1) {
	      throw new InvalidCharacterError("'atob' failed: The string to be decoded is not correctly encoded.");
	    }
	    for (
	      // initialize result and counters
	      var bc = 0, bs, buffer, idx = 0, output = '';
	      // get next character
	      buffer = input.charAt(idx++);
	      // character found in table? initialize bit storage and add its ascii value;
	      ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
	        // and if not first of each 4 characters,
	        // convert the first 8 bits to one ascii character
	        bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
	    ) {
	      // try to find character in table (0-63, not found => -1)
	      buffer = chars.indexOf(buffer);
	    }
	    return output;
	  });

	}());


/***/ },
/* 66 */
/***/ function(module, exports) {

	if (typeof Object.create === 'function') {
	  // implementation from standard node.js 'util' module
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    ctor.prototype = Object.create(superCtor.prototype, {
	      constructor: {
	        value: ctor,
	        enumerable: false,
	        writable: true,
	        configurable: true
	      }
	    });
	  };
	} else {
	  // old school shim for old browsers
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    var TempCtor = function () {}
	    TempCtor.prototype = superCtor.prototype
	    ctor.prototype = new TempCtor()
	    ctor.prototype.constructor = ctor
	  }
	}


/***/ },
/* 67 */
/***/ function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	var punycode = __webpack_require__(68);

	exports.parse = urlParse;
	exports.resolve = urlResolve;
	exports.resolveObject = urlResolveObject;
	exports.format = urlFormat;

	exports.Url = Url;

	function Url() {
	  this.protocol = null;
	  this.slashes = null;
	  this.auth = null;
	  this.host = null;
	  this.port = null;
	  this.hostname = null;
	  this.hash = null;
	  this.search = null;
	  this.query = null;
	  this.pathname = null;
	  this.path = null;
	  this.href = null;
	}

	// Reference: RFC 3986, RFC 1808, RFC 2396

	// define these here so at least they only have to be
	// compiled once on the first module load.
	var protocolPattern = /^([a-z0-9.+-]+:)/i,
	    portPattern = /:[0-9]*$/,

	    // RFC 2396: characters reserved for delimiting URLs.
	    // We actually just auto-escape these.
	    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

	    // RFC 2396: characters not allowed for various reasons.
	    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

	    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
	    autoEscape = ['\''].concat(unwise),
	    // Characters that are never ever allowed in a hostname.
	    // Note that any invalid chars are also handled, but these
	    // are the ones that are *expected* to be seen, so we fast-path
	    // them.
	    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
	    hostEndingChars = ['/', '?', '#'],
	    hostnameMaxLen = 255,
	    hostnamePartPattern = /^[a-z0-9A-Z_-]{0,63}$/,
	    hostnamePartStart = /^([a-z0-9A-Z_-]{0,63})(.*)$/,
	    // protocols that can allow "unsafe" and "unwise" chars.
	    unsafeProtocol = {
	      'javascript': true,
	      'javascript:': true
	    },
	    // protocols that never have a hostname.
	    hostlessProtocol = {
	      'javascript': true,
	      'javascript:': true
	    },
	    // protocols that always contain a // bit.
	    slashedProtocol = {
	      'http': true,
	      'https': true,
	      'ftp': true,
	      'gopher': true,
	      'file': true,
	      'http:': true,
	      'https:': true,
	      'ftp:': true,
	      'gopher:': true,
	      'file:': true
	    },
	    querystring = __webpack_require__(70);

	function urlParse(url, parseQueryString, slashesDenoteHost) {
	  if (url && isObject(url) && url instanceof Url) return url;

	  var u = new Url;
	  u.parse(url, parseQueryString, slashesDenoteHost);
	  return u;
	}

	Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
	  if (!isString(url)) {
	    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
	  }

	  var rest = url;

	  // trim before proceeding.
	  // This is to support parse stuff like "  http://foo.com  \n"
	  rest = rest.trim();

	  var proto = protocolPattern.exec(rest);
	  if (proto) {
	    proto = proto[0];
	    var lowerProto = proto.toLowerCase();
	    this.protocol = lowerProto;
	    rest = rest.substr(proto.length);
	  }

	  // figure out if it's got a host
	  // user@server is *always* interpreted as a hostname, and url
	  // resolution will treat //foo/bar as host=foo,path=bar because that's
	  // how the browser resolves relative URLs.
	  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
	    var slashes = rest.substr(0, 2) === '//';
	    if (slashes && !(proto && hostlessProtocol[proto])) {
	      rest = rest.substr(2);
	      this.slashes = true;
	    }
	  }

	  if (!hostlessProtocol[proto] &&
	      (slashes || (proto && !slashedProtocol[proto]))) {

	    // there's a hostname.
	    // the first instance of /, ?, ;, or # ends the host.
	    //
	    // If there is an @ in the hostname, then non-host chars *are* allowed
	    // to the left of the last @ sign, unless some host-ending character
	    // comes *before* the @-sign.
	    // URLs are obnoxious.
	    //
	    // ex:
	    // http://a@b@c/ => user:a@b host:c
	    // http://a@b?@c => user:a host:c path:/?@c

	    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
	    // Review our test case against browsers more comprehensively.

	    // find the first instance of any hostEndingChars
	    var hostEnd = -1;
	    for (var i = 0; i < hostEndingChars.length; i++) {
	      var hec = rest.indexOf(hostEndingChars[i]);
	      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
	        hostEnd = hec;
	    }

	    // at this point, either we have an explicit point where the
	    // auth portion cannot go past, or the last @ char is the decider.
	    var auth, atSign;
	    if (hostEnd === -1) {
	      // atSign can be anywhere.
	      atSign = rest.lastIndexOf('@');
	    } else {
	      // atSign must be in auth portion.
	      // http://a@b/c@d => host:b auth:a path:/c@d
	      atSign = rest.lastIndexOf('@', hostEnd);
	    }

	    // Now we have a portion which is definitely the auth.
	    // Pull that off.
	    if (atSign !== -1) {
	      auth = rest.slice(0, atSign);
	      rest = rest.slice(atSign + 1);
	      this.auth = decodeURIComponent(auth);
	    }

	    // the host is the remaining to the left of the first non-host char
	    hostEnd = -1;
	    for (var i = 0; i < nonHostChars.length; i++) {
	      var hec = rest.indexOf(nonHostChars[i]);
	      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
	        hostEnd = hec;
	    }
	    // if we still have not hit it, then the entire thing is a host.
	    if (hostEnd === -1)
	      hostEnd = rest.length;

	    this.host = rest.slice(0, hostEnd);
	    rest = rest.slice(hostEnd);

	    // pull out port.
	    this.parseHost();

	    // we've indicated that there is a hostname,
	    // so even if it's empty, it has to be present.
	    this.hostname = this.hostname || '';

	    // if hostname begins with [ and ends with ]
	    // assume that it's an IPv6 address.
	    var ipv6Hostname = this.hostname[0] === '[' &&
	        this.hostname[this.hostname.length - 1] === ']';

	    // validate a little.
	    if (!ipv6Hostname) {
	      var hostparts = this.hostname.split(/\./);
	      for (var i = 0, l = hostparts.length; i < l; i++) {
	        var part = hostparts[i];
	        if (!part) continue;
	        if (!part.match(hostnamePartPattern)) {
	          var newpart = '';
	          for (var j = 0, k = part.length; j < k; j++) {
	            if (part.charCodeAt(j) > 127) {
	              // we replace non-ASCII char with a temporary placeholder
	              // we need this to make sure size of hostname is not
	              // broken by replacing non-ASCII by nothing
	              newpart += 'x';
	            } else {
	              newpart += part[j];
	            }
	          }
	          // we test again with ASCII char only
	          if (!newpart.match(hostnamePartPattern)) {
	            var validParts = hostparts.slice(0, i);
	            var notHost = hostparts.slice(i + 1);
	            var bit = part.match(hostnamePartStart);
	            if (bit) {
	              validParts.push(bit[1]);
	              notHost.unshift(bit[2]);
	            }
	            if (notHost.length) {
	              rest = '/' + notHost.join('.') + rest;
	            }
	            this.hostname = validParts.join('.');
	            break;
	          }
	        }
	      }
	    }

	    if (this.hostname.length > hostnameMaxLen) {
	      this.hostname = '';
	    } else {
	      // hostnames are always lower case.
	      this.hostname = this.hostname.toLowerCase();
	    }

	    if (!ipv6Hostname) {
	      // IDNA Support: Returns a puny coded representation of "domain".
	      // It only converts the part of the domain name that
	      // has non ASCII characters. I.e. it dosent matter if
	      // you call it with a domain that already is in ASCII.
	      var domainArray = this.hostname.split('.');
	      var newOut = [];
	      for (var i = 0; i < domainArray.length; ++i) {
	        var s = domainArray[i];
	        newOut.push(s.match(/[^A-Za-z0-9_-]/) ?
	            'xn--' + punycode.encode(s) : s);
	      }
	      this.hostname = newOut.join('.');
	    }

	    var p = this.port ? ':' + this.port : '';
	    var h = this.hostname || '';
	    this.host = h + p;
	    this.href += this.host;

	    // strip [ and ] from the hostname
	    // the host field still retains them, though
	    if (ipv6Hostname) {
	      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
	      if (rest[0] !== '/') {
	        rest = '/' + rest;
	      }
	    }
	  }

	  // now rest is set to the post-host stuff.
	  // chop off any delim chars.
	  if (!unsafeProtocol[lowerProto]) {

	    // First, make 100% sure that any "autoEscape" chars get
	    // escaped, even if encodeURIComponent doesn't think they
	    // need to be.
	    for (var i = 0, l = autoEscape.length; i < l; i++) {
	      var ae = autoEscape[i];
	      var esc = encodeURIComponent(ae);
	      if (esc === ae) {
	        esc = escape(ae);
	      }
	      rest = rest.split(ae).join(esc);
	    }
	  }


	  // chop off from the tail first.
	  var hash = rest.indexOf('#');
	  if (hash !== -1) {
	    // got a fragment string.
	    this.hash = rest.substr(hash);
	    rest = rest.slice(0, hash);
	  }
	  var qm = rest.indexOf('?');
	  if (qm !== -1) {
	    this.search = rest.substr(qm);
	    this.query = rest.substr(qm + 1);
	    if (parseQueryString) {
	      this.query = querystring.parse(this.query);
	    }
	    rest = rest.slice(0, qm);
	  } else if (parseQueryString) {
	    // no query string, but parseQueryString still requested
	    this.search = '';
	    this.query = {};
	  }
	  if (rest) this.pathname = rest;
	  if (slashedProtocol[lowerProto] &&
	      this.hostname && !this.pathname) {
	    this.pathname = '/';
	  }

	  //to support http.request
	  if (this.pathname || this.search) {
	    var p = this.pathname || '';
	    var s = this.search || '';
	    this.path = p + s;
	  }

	  // finally, reconstruct the href based on what has been validated.
	  this.href = this.format();
	  return this;
	};

	// format a parsed object into a url string
	function urlFormat(obj) {
	  // ensure it's an object, and not a string url.
	  // If it's an obj, this is a no-op.
	  // this way, you can call url_format() on strings
	  // to clean up potentially wonky urls.
	  if (isString(obj)) obj = urlParse(obj);
	  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
	  return obj.format();
	}

	Url.prototype.format = function() {
	  var auth = this.auth || '';
	  if (auth) {
	    auth = encodeURIComponent(auth);
	    auth = auth.replace(/%3A/i, ':');
	    auth += '@';
	  }

	  var protocol = this.protocol || '',
	      pathname = this.pathname || '',
	      hash = this.hash || '',
	      host = false,
	      query = '';

	  if (this.host) {
	    host = auth + this.host;
	  } else if (this.hostname) {
	    host = auth + (this.hostname.indexOf(':') === -1 ?
	        this.hostname :
	        '[' + this.hostname + ']');
	    if (this.port) {
	      host += ':' + this.port;
	    }
	  }

	  if (this.query &&
	      isObject(this.query) &&
	      Object.keys(this.query).length) {
	    query = querystring.stringify(this.query);
	  }

	  var search = this.search || (query && ('?' + query)) || '';

	  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

	  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
	  // unless they had them to begin with.
	  if (this.slashes ||
	      (!protocol || slashedProtocol[protocol]) && host !== false) {
	    host = '//' + (host || '');
	    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
	  } else if (!host) {
	    host = '';
	  }

	  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
	  if (search && search.charAt(0) !== '?') search = '?' + search;

	  pathname = pathname.replace(/[?#]/g, function(match) {
	    return encodeURIComponent(match);
	  });
	  search = search.replace('#', '%23');

	  return protocol + host + pathname + search + hash;
	};

	function urlResolve(source, relative) {
	  return urlParse(source, false, true).resolve(relative);
	}

	Url.prototype.resolve = function(relative) {
	  return this.resolveObject(urlParse(relative, false, true)).format();
	};

	function urlResolveObject(source, relative) {
	  if (!source) return relative;
	  return urlParse(source, false, true).resolveObject(relative);
	}

	Url.prototype.resolveObject = function(relative) {
	  if (isString(relative)) {
	    var rel = new Url();
	    rel.parse(relative, false, true);
	    relative = rel;
	  }

	  var result = new Url();
	  Object.keys(this).forEach(function(k) {
	    result[k] = this[k];
	  }, this);

	  // hash is always overridden, no matter what.
	  // even href="" will remove it.
	  result.hash = relative.hash;

	  // if the relative url is empty, then there's nothing left to do here.
	  if (relative.href === '') {
	    result.href = result.format();
	    return result;
	  }

	  // hrefs like //foo/bar always cut to the protocol.
	  if (relative.slashes && !relative.protocol) {
	    // take everything except the protocol from relative
	    Object.keys(relative).forEach(function(k) {
	      if (k !== 'protocol')
	        result[k] = relative[k];
	    });

	    //urlParse appends trailing / to urls like http://www.example.com
	    if (slashedProtocol[result.protocol] &&
	        result.hostname && !result.pathname) {
	      result.path = result.pathname = '/';
	    }

	    result.href = result.format();
	    return result;
	  }

	  if (relative.protocol && relative.protocol !== result.protocol) {
	    // if it's a known url protocol, then changing
	    // the protocol does weird things
	    // first, if it's not file:, then we MUST have a host,
	    // and if there was a path
	    // to begin with, then we MUST have a path.
	    // if it is file:, then the host is dropped,
	    // because that's known to be hostless.
	    // anything else is assumed to be absolute.
	    if (!slashedProtocol[relative.protocol]) {
	      Object.keys(relative).forEach(function(k) {
	        result[k] = relative[k];
	      });
	      result.href = result.format();
	      return result;
	    }

	    result.protocol = relative.protocol;
	    if (!relative.host && !hostlessProtocol[relative.protocol]) {
	      var relPath = (relative.pathname || '').split('/');
	      while (relPath.length && !(relative.host = relPath.shift()));
	      if (!relative.host) relative.host = '';
	      if (!relative.hostname) relative.hostname = '';
	      if (relPath[0] !== '') relPath.unshift('');
	      if (relPath.length < 2) relPath.unshift('');
	      result.pathname = relPath.join('/');
	    } else {
	      result.pathname = relative.pathname;
	    }
	    result.search = relative.search;
	    result.query = relative.query;
	    result.host = relative.host || '';
	    result.auth = relative.auth;
	    result.hostname = relative.hostname || relative.host;
	    result.port = relative.port;
	    // to support http.request
	    if (result.pathname || result.search) {
	      var p = result.pathname || '';
	      var s = result.search || '';
	      result.path = p + s;
	    }
	    result.slashes = result.slashes || relative.slashes;
	    result.href = result.format();
	    return result;
	  }

	  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
	      isRelAbs = (
	          relative.host ||
	          relative.pathname && relative.pathname.charAt(0) === '/'
	      ),
	      mustEndAbs = (isRelAbs || isSourceAbs ||
	                    (result.host && relative.pathname)),
	      removeAllDots = mustEndAbs,
	      srcPath = result.pathname && result.pathname.split('/') || [],
	      relPath = relative.pathname && relative.pathname.split('/') || [],
	      psychotic = result.protocol && !slashedProtocol[result.protocol];

	  // if the url is a non-slashed url, then relative
	  // links like ../.. should be able
	  // to crawl up to the hostname, as well.  This is strange.
	  // result.protocol has already been set by now.
	  // Later on, put the first path part into the host field.
	  if (psychotic) {
	    result.hostname = '';
	    result.port = null;
	    if (result.host) {
	      if (srcPath[0] === '') srcPath[0] = result.host;
	      else srcPath.unshift(result.host);
	    }
	    result.host = '';
	    if (relative.protocol) {
	      relative.hostname = null;
	      relative.port = null;
	      if (relative.host) {
	        if (relPath[0] === '') relPath[0] = relative.host;
	        else relPath.unshift(relative.host);
	      }
	      relative.host = null;
	    }
	    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
	  }

	  if (isRelAbs) {
	    // it's absolute.
	    result.host = (relative.host || relative.host === '') ?
	                  relative.host : result.host;
	    result.hostname = (relative.hostname || relative.hostname === '') ?
	                      relative.hostname : result.hostname;
	    result.search = relative.search;
	    result.query = relative.query;
	    srcPath = relPath;
	    // fall through to the dot-handling below.
	  } else if (relPath.length) {
	    // it's relative
	    // throw away the existing file, and take the new path instead.
	    if (!srcPath) srcPath = [];
	    srcPath.pop();
	    srcPath = srcPath.concat(relPath);
	    result.search = relative.search;
	    result.query = relative.query;
	  } else if (!isNullOrUndefined(relative.search)) {
	    // just pull out the search.
	    // like href='?foo'.
	    // Put this after the other two cases because it simplifies the booleans
	    if (psychotic) {
	      result.hostname = result.host = srcPath.shift();
	      //occationaly the auth can get stuck only in host
	      //this especialy happens in cases like
	      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
	      var authInHost = result.host && result.host.indexOf('@') > 0 ?
	                       result.host.split('@') : false;
	      if (authInHost) {
	        result.auth = authInHost.shift();
	        result.host = result.hostname = authInHost.shift();
	      }
	    }
	    result.search = relative.search;
	    result.query = relative.query;
	    //to support http.request
	    if (!isNull(result.pathname) || !isNull(result.search)) {
	      result.path = (result.pathname ? result.pathname : '') +
	                    (result.search ? result.search : '');
	    }
	    result.href = result.format();
	    return result;
	  }

	  if (!srcPath.length) {
	    // no path at all.  easy.
	    // we've already handled the other stuff above.
	    result.pathname = null;
	    //to support http.request
	    if (result.search) {
	      result.path = '/' + result.search;
	    } else {
	      result.path = null;
	    }
	    result.href = result.format();
	    return result;
	  }

	  // if a url ENDs in . or .., then it must get a trailing slash.
	  // however, if it ends in anything else non-slashy,
	  // then it must NOT get a trailing slash.
	  var last = srcPath.slice(-1)[0];
	  var hasTrailingSlash = (
	      (result.host || relative.host) && (last === '.' || last === '..') ||
	      last === '');

	  // strip single dots, resolve double dots to parent dir
	  // if the path tries to go above the root, `up` ends up > 0
	  var up = 0;
	  for (var i = srcPath.length; i >= 0; i--) {
	    last = srcPath[i];
	    if (last == '.') {
	      srcPath.splice(i, 1);
	    } else if (last === '..') {
	      srcPath.splice(i, 1);
	      up++;
	    } else if (up) {
	      srcPath.splice(i, 1);
	      up--;
	    }
	  }

	  // if the path is allowed to go above the root, restore leading ..s
	  if (!mustEndAbs && !removeAllDots) {
	    for (; up--; up) {
	      srcPath.unshift('..');
	    }
	  }

	  if (mustEndAbs && srcPath[0] !== '' &&
	      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
	    srcPath.unshift('');
	  }

	  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
	    srcPath.push('');
	  }

	  var isAbsolute = srcPath[0] === '' ||
	      (srcPath[0] && srcPath[0].charAt(0) === '/');

	  // put the host back
	  if (psychotic) {
	    result.hostname = result.host = isAbsolute ? '' :
	                                    srcPath.length ? srcPath.shift() : '';
	    //occationaly the auth can get stuck only in host
	    //this especialy happens in cases like
	    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
	    var authInHost = result.host && result.host.indexOf('@') > 0 ?
	                     result.host.split('@') : false;
	    if (authInHost) {
	      result.auth = authInHost.shift();
	      result.host = result.hostname = authInHost.shift();
	    }
	  }

	  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

	  if (mustEndAbs && !isAbsolute) {
	    srcPath.unshift('');
	  }

	  if (!srcPath.length) {
	    result.pathname = null;
	    result.path = null;
	  } else {
	    result.pathname = srcPath.join('/');
	  }

	  //to support request.http
	  if (!isNull(result.pathname) || !isNull(result.search)) {
	    result.path = (result.pathname ? result.pathname : '') +
	                  (result.search ? result.search : '');
	  }
	  result.auth = relative.auth || result.auth;
	  result.slashes = result.slashes || relative.slashes;
	  result.href = result.format();
	  return result;
	};

	Url.prototype.parseHost = function() {
	  var host = this.host;
	  var port = portPattern.exec(host);
	  if (port) {
	    port = port[0];
	    if (port !== ':') {
	      this.port = port.substr(1);
	    }
	    host = host.substr(0, host.length - port.length);
	  }
	  if (host) this.hostname = host;
	};

	function isString(arg) {
	  return typeof arg === "string";
	}

	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}

	function isNull(arg) {
	  return arg === null;
	}
	function isNullOrUndefined(arg) {
	  return  arg == null;
	}


/***/ },
/* 68 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(module, global) {/*! https://mths.be/punycode v1.3.2 by @mathias */
	;(function(root) {

		/** Detect free variables */
		var freeExports = typeof exports == 'object' && exports &&
			!exports.nodeType && exports;
		var freeModule = typeof module == 'object' && module &&
			!module.nodeType && module;
		var freeGlobal = typeof global == 'object' && global;
		if (
			freeGlobal.global === freeGlobal ||
			freeGlobal.window === freeGlobal ||
			freeGlobal.self === freeGlobal
		) {
			root = freeGlobal;
		}

		/**
		 * The `punycode` object.
		 * @name punycode
		 * @type Object
		 */
		var punycode,

		/** Highest positive signed 32-bit float value */
		maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

		/** Bootstring parameters */
		base = 36,
		tMin = 1,
		tMax = 26,
		skew = 38,
		damp = 700,
		initialBias = 72,
		initialN = 128, // 0x80
		delimiter = '-', // '\x2D'

		/** Regular expressions */
		regexPunycode = /^xn--/,
		regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
		regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

		/** Error messages */
		errors = {
			'overflow': 'Overflow: input needs wider integers to process',
			'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
			'invalid-input': 'Invalid input'
		},

		/** Convenience shortcuts */
		baseMinusTMin = base - tMin,
		floor = Math.floor,
		stringFromCharCode = String.fromCharCode,

		/** Temporary variable */
		key;

		/*--------------------------------------------------------------------------*/

		/**
		 * A generic error utility function.
		 * @private
		 * @param {String} type The error type.
		 * @returns {Error} Throws a `RangeError` with the applicable error message.
		 */
		function error(type) {
			throw RangeError(errors[type]);
		}

		/**
		 * A generic `Array#map` utility function.
		 * @private
		 * @param {Array} array The array to iterate over.
		 * @param {Function} callback The function that gets called for every array
		 * item.
		 * @returns {Array} A new array of values returned by the callback function.
		 */
		function map(array, fn) {
			var length = array.length;
			var result = [];
			while (length--) {
				result[length] = fn(array[length]);
			}
			return result;
		}

		/**
		 * A simple `Array#map`-like wrapper to work with domain name strings or email
		 * addresses.
		 * @private
		 * @param {String} domain The domain name or email address.
		 * @param {Function} callback The function that gets called for every
		 * character.
		 * @returns {Array} A new string of characters returned by the callback
		 * function.
		 */
		function mapDomain(string, fn) {
			var parts = string.split('@');
			var result = '';
			if (parts.length > 1) {
				// In email addresses, only the domain name should be punycoded. Leave
				// the local part (i.e. everything up to `@`) intact.
				result = parts[0] + '@';
				string = parts[1];
			}
			// Avoid `split(regex)` for IE8 compatibility. See #17.
			string = string.replace(regexSeparators, '\x2E');
			var labels = string.split('.');
			var encoded = map(labels, fn).join('.');
			return result + encoded;
		}

		/**
		 * Creates an array containing the numeric code points of each Unicode
		 * character in the string. While JavaScript uses UCS-2 internally,
		 * this function will convert a pair of surrogate halves (each of which
		 * UCS-2 exposes as separate characters) into a single code point,
		 * matching UTF-16.
		 * @see `punycode.ucs2.encode`
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode.ucs2
		 * @name decode
		 * @param {String} string The Unicode input string (UCS-2).
		 * @returns {Array} The new array of code points.
		 */
		function ucs2decode(string) {
			var output = [],
			    counter = 0,
			    length = string.length,
			    value,
			    extra;
			while (counter < length) {
				value = string.charCodeAt(counter++);
				if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
					// high surrogate, and there is a next character
					extra = string.charCodeAt(counter++);
					if ((extra & 0xFC00) == 0xDC00) { // low surrogate
						output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
					} else {
						// unmatched surrogate; only append this code unit, in case the next
						// code unit is the high surrogate of a surrogate pair
						output.push(value);
						counter--;
					}
				} else {
					output.push(value);
				}
			}
			return output;
		}

		/**
		 * Creates a string based on an array of numeric code points.
		 * @see `punycode.ucs2.decode`
		 * @memberOf punycode.ucs2
		 * @name encode
		 * @param {Array} codePoints The array of numeric code points.
		 * @returns {String} The new Unicode string (UCS-2).
		 */
		function ucs2encode(array) {
			return map(array, function(value) {
				var output = '';
				if (value > 0xFFFF) {
					value -= 0x10000;
					output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
					value = 0xDC00 | value & 0x3FF;
				}
				output += stringFromCharCode(value);
				return output;
			}).join('');
		}

		/**
		 * Converts a basic code point into a digit/integer.
		 * @see `digitToBasic()`
		 * @private
		 * @param {Number} codePoint The basic numeric code point value.
		 * @returns {Number} The numeric value of a basic code point (for use in
		 * representing integers) in the range `0` to `base - 1`, or `base` if
		 * the code point does not represent a value.
		 */
		function basicToDigit(codePoint) {
			if (codePoint - 48 < 10) {
				return codePoint - 22;
			}
			if (codePoint - 65 < 26) {
				return codePoint - 65;
			}
			if (codePoint - 97 < 26) {
				return codePoint - 97;
			}
			return base;
		}

		/**
		 * Converts a digit/integer into a basic code point.
		 * @see `basicToDigit()`
		 * @private
		 * @param {Number} digit The numeric value of a basic code point.
		 * @returns {Number} The basic code point whose value (when used for
		 * representing integers) is `digit`, which needs to be in the range
		 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
		 * used; else, the lowercase form is used. The behavior is undefined
		 * if `flag` is non-zero and `digit` has no uppercase form.
		 */
		function digitToBasic(digit, flag) {
			//  0..25 map to ASCII a..z or A..Z
			// 26..35 map to ASCII 0..9
			return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
		}

		/**
		 * Bias adaptation function as per section 3.4 of RFC 3492.
		 * http://tools.ietf.org/html/rfc3492#section-3.4
		 * @private
		 */
		function adapt(delta, numPoints, firstTime) {
			var k = 0;
			delta = firstTime ? floor(delta / damp) : delta >> 1;
			delta += floor(delta / numPoints);
			for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
				delta = floor(delta / baseMinusTMin);
			}
			return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
		}

		/**
		 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
		 * symbols.
		 * @memberOf punycode
		 * @param {String} input The Punycode string of ASCII-only symbols.
		 * @returns {String} The resulting string of Unicode symbols.
		 */
		function decode(input) {
			// Don't use UCS-2
			var output = [],
			    inputLength = input.length,
			    out,
			    i = 0,
			    n = initialN,
			    bias = initialBias,
			    basic,
			    j,
			    index,
			    oldi,
			    w,
			    k,
			    digit,
			    t,
			    /** Cached calculation results */
			    baseMinusT;

			// Handle the basic code points: let `basic` be the number of input code
			// points before the last delimiter, or `0` if there is none, then copy
			// the first basic code points to the output.

			basic = input.lastIndexOf(delimiter);
			if (basic < 0) {
				basic = 0;
			}

			for (j = 0; j < basic; ++j) {
				// if it's not a basic code point
				if (input.charCodeAt(j) >= 0x80) {
					error('not-basic');
				}
				output.push(input.charCodeAt(j));
			}

			// Main decoding loop: start just after the last delimiter if any basic code
			// points were copied; start at the beginning otherwise.

			for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

				// `index` is the index of the next character to be consumed.
				// Decode a generalized variable-length integer into `delta`,
				// which gets added to `i`. The overflow checking is easier
				// if we increase `i` as we go, then subtract off its starting
				// value at the end to obtain `delta`.
				for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

					if (index >= inputLength) {
						error('invalid-input');
					}

					digit = basicToDigit(input.charCodeAt(index++));

					if (digit >= base || digit > floor((maxInt - i) / w)) {
						error('overflow');
					}

					i += digit * w;
					t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

					if (digit < t) {
						break;
					}

					baseMinusT = base - t;
					if (w > floor(maxInt / baseMinusT)) {
						error('overflow');
					}

					w *= baseMinusT;

				}

				out = output.length + 1;
				bias = adapt(i - oldi, out, oldi == 0);

				// `i` was supposed to wrap around from `out` to `0`,
				// incrementing `n` each time, so we'll fix that now:
				if (floor(i / out) > maxInt - n) {
					error('overflow');
				}

				n += floor(i / out);
				i %= out;

				// Insert `n` at position `i` of the output
				output.splice(i++, 0, n);

			}

			return ucs2encode(output);
		}

		/**
		 * Converts a string of Unicode symbols (e.g. a domain name label) to a
		 * Punycode string of ASCII-only symbols.
		 * @memberOf punycode
		 * @param {String} input The string of Unicode symbols.
		 * @returns {String} The resulting Punycode string of ASCII-only symbols.
		 */
		function encode(input) {
			var n,
			    delta,
			    handledCPCount,
			    basicLength,
			    bias,
			    j,
			    m,
			    q,
			    k,
			    t,
			    currentValue,
			    output = [],
			    /** `inputLength` will hold the number of code points in `input`. */
			    inputLength,
			    /** Cached calculation results */
			    handledCPCountPlusOne,
			    baseMinusT,
			    qMinusT;

			// Convert the input in UCS-2 to Unicode
			input = ucs2decode(input);

			// Cache the length
			inputLength = input.length;

			// Initialize the state
			n = initialN;
			delta = 0;
			bias = initialBias;

			// Handle the basic code points
			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue < 0x80) {
					output.push(stringFromCharCode(currentValue));
				}
			}

			handledCPCount = basicLength = output.length;

			// `handledCPCount` is the number of code points that have been handled;
			// `basicLength` is the number of basic code points.

			// Finish the basic string - if it is not empty - with a delimiter
			if (basicLength) {
				output.push(delimiter);
			}

			// Main encoding loop:
			while (handledCPCount < inputLength) {

				// All non-basic code points < n have been handled already. Find the next
				// larger one:
				for (m = maxInt, j = 0; j < inputLength; ++j) {
					currentValue = input[j];
					if (currentValue >= n && currentValue < m) {
						m = currentValue;
					}
				}

				// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
				// but guard against overflow
				handledCPCountPlusOne = handledCPCount + 1;
				if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
					error('overflow');
				}

				delta += (m - n) * handledCPCountPlusOne;
				n = m;

				for (j = 0; j < inputLength; ++j) {
					currentValue = input[j];

					if (currentValue < n && ++delta > maxInt) {
						error('overflow');
					}

					if (currentValue == n) {
						// Represent delta as a generalized variable-length integer
						for (q = delta, k = base; /* no condition */; k += base) {
							t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
							if (q < t) {
								break;
							}
							qMinusT = q - t;
							baseMinusT = base - t;
							output.push(
								stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
							);
							q = floor(qMinusT / baseMinusT);
						}

						output.push(stringFromCharCode(digitToBasic(q, 0)));
						bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
						delta = 0;
						++handledCPCount;
					}
				}

				++delta;
				++n;

			}
			return output.join('');
		}

		/**
		 * Converts a Punycode string representing a domain name or an email address
		 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
		 * it doesn't matter if you call it on a string that has already been
		 * converted to Unicode.
		 * @memberOf punycode
		 * @param {String} input The Punycoded domain name or email address to
		 * convert to Unicode.
		 * @returns {String} The Unicode representation of the given Punycode
		 * string.
		 */
		function toUnicode(input) {
			return mapDomain(input, function(string) {
				return regexPunycode.test(string)
					? decode(string.slice(4).toLowerCase())
					: string;
			});
		}

		/**
		 * Converts a Unicode string representing a domain name or an email address to
		 * Punycode. Only the non-ASCII parts of the domain name will be converted,
		 * i.e. it doesn't matter if you call it with a domain that's already in
		 * ASCII.
		 * @memberOf punycode
		 * @param {String} input The domain name or email address to convert, as a
		 * Unicode string.
		 * @returns {String} The Punycode representation of the given domain name or
		 * email address.
		 */
		function toASCII(input) {
			return mapDomain(input, function(string) {
				return regexNonASCII.test(string)
					? 'xn--' + encode(string)
					: string;
			});
		}

		/*--------------------------------------------------------------------------*/

		/** Define the public API */
		punycode = {
			/**
			 * A string representing the current Punycode.js version number.
			 * @memberOf punycode
			 * @type String
			 */
			'version': '1.3.2',
			/**
			 * An object of methods to convert from JavaScript's internal character
			 * representation (UCS-2) to Unicode code points, and back.
			 * @see <https://mathiasbynens.be/notes/javascript-encoding>
			 * @memberOf punycode
			 * @type Object
			 */
			'ucs2': {
				'decode': ucs2decode,
				'encode': ucs2encode
			},
			'decode': decode,
			'encode': encode,
			'toASCII': toASCII,
			'toUnicode': toUnicode
		};

		/** Expose `punycode` */
		// Some AMD build optimizers, like r.js, check for specific condition patterns
		// like the following:
		if (
			true
		) {
			!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
				return punycode;
			}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
		} else if (freeExports && freeModule) {
			if (module.exports == freeExports) { // in Node.js or RingoJS v0.8.0+
				freeModule.exports = punycode;
			} else { // in Narwhal or RingoJS v0.7.0-
				for (key in punycode) {
					punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
				}
			}
		} else { // in Rhino or a web browser
			root.punycode = punycode;
		}

	}(this));

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(69)(module), (function() { return this; }())))

/***/ },
/* 69 */
/***/ function(module, exports) {

	module.exports = function(module) {
		if(!module.webpackPolyfill) {
			module.deprecate = function() {};
			module.paths = [];
			// module.parent = undefined by default
			module.children = [];
			module.webpackPolyfill = 1;
		}
		return module;
	}


/***/ },
/* 70 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	exports.decode = exports.parse = __webpack_require__(71);
	exports.encode = exports.stringify = __webpack_require__(72);


/***/ },
/* 71 */
/***/ function(module, exports) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	'use strict';

	// If obj.hasOwnProperty has been overridden, then calling
	// obj.hasOwnProperty(prop) will break.
	// See: https://github.com/joyent/node/issues/1707
	function hasOwnProperty(obj, prop) {
	  return Object.prototype.hasOwnProperty.call(obj, prop);
	}

	module.exports = function(qs, sep, eq, options) {
	  sep = sep || '&';
	  eq = eq || '=';
	  var obj = {};

	  if (typeof qs !== 'string' || qs.length === 0) {
	    return obj;
	  }

	  var regexp = /\+/g;
	  qs = qs.split(sep);

	  var maxKeys = 1000;
	  if (options && typeof options.maxKeys === 'number') {
	    maxKeys = options.maxKeys;
	  }

	  var len = qs.length;
	  // maxKeys <= 0 means that we should not limit keys count
	  if (maxKeys > 0 && len > maxKeys) {
	    len = maxKeys;
	  }

	  for (var i = 0; i < len; ++i) {
	    var x = qs[i].replace(regexp, '%20'),
	        idx = x.indexOf(eq),
	        kstr, vstr, k, v;

	    if (idx >= 0) {
	      kstr = x.substr(0, idx);
	      vstr = x.substr(idx + 1);
	    } else {
	      kstr = x;
	      vstr = '';
	    }

	    k = decodeURIComponent(kstr);
	    v = decodeURIComponent(vstr);

	    if (!hasOwnProperty(obj, k)) {
	      obj[k] = v;
	    } else if (Array.isArray(obj[k])) {
	      obj[k].push(v);
	    } else {
	      obj[k] = [obj[k], v];
	    }
	  }

	  return obj;
	};


/***/ },
/* 72 */
/***/ function(module, exports) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	'use strict';

	var stringifyPrimitive = function(v) {
	  switch (typeof v) {
	    case 'string':
	      return v;

	    case 'boolean':
	      return v ? 'true' : 'false';

	    case 'number':
	      return isFinite(v) ? v : '';

	    default:
	      return '';
	  }
	};

	module.exports = function(obj, sep, eq, name) {
	  sep = sep || '&';
	  eq = eq || '=';
	  if (obj === null) {
	    obj = undefined;
	  }

	  if (typeof obj === 'object') {
	    return Object.keys(obj).map(function(k) {
	      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
	      if (Array.isArray(obj[k])) {
	        return obj[k].map(function(v) {
	          return ks + encodeURIComponent(stringifyPrimitive(v));
	        }).join(sep);
	      } else {
	        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
	      }
	    }).join(sep);

	  }

	  if (!name) return '';
	  return encodeURIComponent(stringifyPrimitive(name)) + eq +
	         encodeURIComponent(stringifyPrimitive(obj));
	};


/***/ },
/* 73 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(__dirname) {var fs = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"fs\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
	var path = __webpack_require__(34);
	var AWS = __webpack_require__(8);
	var apis = __webpack_require__(33);

	// define services using map
	apis.services.forEach(function(identifier) {
	  var name = apis.serviceName(identifier);
	  var versions = apis.serviceVersions(identifier);
	  AWS[name] = AWS.Service.defineService(identifier, versions);

	  // load any customizations from lib/services/<svcidentifier>.js
	  var svcFile = path.join(__dirname, 'services', identifier + '.js');
	  if (fs.existsSync(svcFile)) __webpack_require__(74)("./" + identifier);
	});

	/* WEBPACK VAR INJECTION */}.call(exports, "/"))

/***/ },
/* 74 */
/***/ function(module, exports, __webpack_require__) {

	var map = {
		"./cloudsearchdomain": 75,
		"./cloudsearchdomain.js": 75,
		"./cognitoidentity": 76,
		"./cognitoidentity.js": 76,
		"./dynamodb": 77,
		"./dynamodb.js": 77,
		"./ec2": 78,
		"./ec2.js": 78,
		"./glacier": 79,
		"./glacier.js": 79,
		"./route53": 80,
		"./route53.js": 80,
		"./s3": 81,
		"./s3.js": 81,
		"./sqs": 82,
		"./sqs.js": 82,
		"./sts": 83,
		"./sts.js": 83,
		"./swf": 84,
		"./swf.js": 84
	};
	function webpackContext(req) {
		return __webpack_require__(webpackContextResolve(req));
	};
	function webpackContextResolve(req) {
		return map[req] || (function() { throw new Error("Cannot find module '" + req + "'.") }());
	};
	webpackContext.keys = function webpackContextKeys() {
		return Object.keys(map);
	};
	webpackContext.resolve = webpackContextResolve;
	module.exports = webpackContext;
	webpackContext.id = 74;


/***/ },
/* 75 */
/***/ function(module, exports, __webpack_require__) {

	var AWS = __webpack_require__(8);

	/**
	 * Constructs a service interface object. Each API operation is exposed as a
	 * function on service.
	 *
	 * ### Sending a Request Using CloudSearchDomain
	 *
	 * ```javascript
	 * var csd = new AWS.CloudSearchDomain({endpoint: 'my.host.tld'});
	 * csd.search(params, function (err, data) {
	 *   if (err) console.log(err, err.stack); // an error occurred
	 *   else     console.log(data);           // successful response
	 * });
	 * ```
	 *
	 * ### Locking the API Version
	 *
	 * In order to ensure that the CloudSearchDomain object uses this specific API,
	 * you can construct the object by passing the `apiVersion` option to the
	 * constructor:
	 *
	 * ```javascript
	 * var csd = new AWS.CloudSearchDomain({
	 *   endpoint: 'my.host.tld',
	 *   apiVersion: '2013-01-01'
	 * });
	 * ```
	 *
	 * You can also set the API version globally in `AWS.config.apiVersions` using
	 * the **cloudsearchdomain** service identifier:
	 *
	 * ```javascript
	 * AWS.config.apiVersions = {
	 *   cloudsearchdomain: '2013-01-01',
	 *   // other service API versions
	 * };
	 *
	 * var csd = new AWS.CloudSearchDomain({endpoint: 'my.host.tld'});
	 * ```
	 *
	 * @note You *must* provide an `endpoint` configuration parameter when
	 *   constructing this service. See {constructor} for more information.
	 *
	 * @!method constructor(options = {})
	 *   Constructs a service object. This object has one method for each
	 *   API operation.
	 *
	 *   @example Constructing a CloudSearchDomain object
	 *     var csd = new AWS.CloudSearchDomain({endpoint: 'my.host.tld'});
	 *   @note You *must* provide an `endpoint` when constructing this service.
	 *   @option (see AWS.Config.constructor)
	 *
	 * @service cloudsearchdomain
	 * @version 2013-01-01
	 */
	AWS.util.update(AWS.CloudSearchDomain.prototype, {
	  /**
	   * @api private
	   */
	  validateService: function validateService() {
	    if (!this.config.endpoint || this.config.endpoint.indexOf('{') >= 0) {
	      var msg = 'AWS.CloudSearchDomain requires an explicit ' +
	                '`endpoint\' configuration option.';
	      throw AWS.util.error(new Error(),
	        {name: 'InvalidEndpoint', message: msg});
	    }
	  },

	  /**
	   * @api private
	   */
	  setupRequestListeners: function setupRequestListeners(request) {
	    if (!request.service.config.credentials) {
	      request.removeListener('validate',
	                             AWS.EventListeners.Core.VALIDATE_CREDENTIALS
	                            );
	      request.removeListener('sign', AWS.EventListeners.Core.SIGN);
	    } else {
	      request.addListener('validate', this.updateRegion);
	    }
	  },

	  /**
	   * @api private
	   */
	  updateRegion: function updateRegion(request) {
	    var endpoint = request.httpRequest.endpoint.hostname;
	    var zones = endpoint.split('.');
	    request.httpRequest.region = zones[1] || request.httpRequest.region;
	  }

	});


/***/ },
/* 76 */
/***/ function(module, exports, __webpack_require__) {

	var AWS = __webpack_require__(8);

	AWS.util.update(AWS.CognitoIdentity.prototype, {
	  getOpenIdToken: function getOpenIdToken(params, callback) {
	    return this.makeUnauthenticatedRequest('getOpenIdToken', params, callback);
	  },

	  getId: function getId(params, callback) {
	    return this.makeUnauthenticatedRequest('getId', params, callback);
	  }
	});


/***/ },
/* 77 */
/***/ function(module, exports, __webpack_require__) {

	var AWS = __webpack_require__(8);

	AWS.util.update(AWS.DynamoDB.prototype, {
	  /**
	   * @api private
	   */
	  setupRequestListeners: function setupRequestListeners(request) {
	    if (request.service.config.dynamoDbCrc32) {
	      request.addListener('extractData', this.checkCrc32);
	    }
	  },

	  /**
	   * @api private
	   */
	  checkCrc32: function checkCrc32(resp) {
	    if (!resp.httpResponse.streaming && !resp.request.service.crc32IsValid(resp)) {
	      resp.error = AWS.util.error(new Error(), {
	        code: 'CRC32CheckFailed',
	        message: 'CRC32 integrity check failed',
	        retryable: true
	      });
	    }
	  },

	  /**
	   * @api private
	   */
	  crc32IsValid: function crc32IsValid(resp) {
	    var crc = resp.httpResponse.headers['x-amz-crc32'];
	    if (!crc) return true; // no (valid) CRC32 header
	    return parseInt(crc, 10) === AWS.util.crypto.crc32(resp.httpResponse.body);
	  },

	  /**
	   * @api private
	   */
	  defaultRetryCount: 10,

	  /**
	   * @api private
	   */
	  retryDelays: function retryDelays() {
	    var retryCount = this.numRetries();
	    var delays = [];
	    for (var i = 0; i < retryCount; ++i) {
	      if (i === 0) {
	        delays.push(0);
	      } else {
	        delays.push(50 * Math.pow(2, i - 1));
	      }
	    }
	    return delays;
	  }
	});


/***/ },
/* 78 */
/***/ function(module, exports, __webpack_require__) {

	var AWS = __webpack_require__(8);

	AWS.util.update(AWS.EC2.prototype, {
	  /**
	   * @api private
	   */
	  setupRequestListeners: function setupRequestListeners(request) {
	    request.removeListener('extractError', AWS.EventListeners.Query.EXTRACT_ERROR);
	    request.addListener('extractError', this.extractError);

	    if (request.operation === 'copySnapshot') {
	      request.onAsync('validate', this.buildCopySnapshotPresignedUrl);
	    }
	  },

	  /**
	   * @api private
	   */
	  buildCopySnapshotPresignedUrl: function buildCopySnapshotPresignedUrl(req, done) {
	    if (req.params.PresignedUrl || req._subRequest) {
	      return done();
	    }

	    req.params = AWS.util.copy(req.params);
	    req.params.DestinationRegion = req.service.config.region;

	    var config = AWS.util.copy(req.service.config);
	    delete config.endpoint;
	    config.region = req.params.SourceRegion;
	    var svc = new req.service.constructor(config);
	    var newReq = svc[req.operation](req.params);
	    newReq._subRequest = true;
	    newReq.presign(function(err, url) {
	      if (err) done(err);
	      else {
	        req.params.PresignedUrl = url;
	        done();
	      }
	    });
	  },

	  /**
	   * @api private
	   */
	  extractError: function extractError(resp) {
	    // EC2 nests the error code and message deeper than other AWS Query services.
	    var httpResponse = resp.httpResponse;
	    var data = new AWS.XML.Parser().parse(httpResponse.body.toString() || '');
	    if (data.Errors)
	      resp.error = AWS.util.error(new Error(), {
	        code: data.Errors.Error.Code,
	        message: data.Errors.Error.Message
	      });
	    else
	      resp.error = AWS.util.error(new Error(), {
	        code: httpResponse.statusCode,
	        message: null
	      });
	  }
	});


/***/ },
/* 79 */
/***/ function(module, exports, __webpack_require__) {

	var AWS = __webpack_require__(8);

	AWS.util.update(AWS.Glacier.prototype, {
	  /**
	   * @api private
	   */
	  setupRequestListeners: function setupRequestListeners(request) {
	    if (Array.isArray(request._events.validate)) {
	      request._events.validate.unshift(this.validateAccountId);
	    } else {
	      request.on('validate', this.validateAccountId);
	    }

	    request.on('build', this.addGlacierApiVersion);
	    request.on('build', this.addTreeHashHeaders);
	  },

	  /**
	   * @api private
	   */
	  validateAccountId: function validateAccountId(request) {
	    if (request.params.accountId !== undefined) return;
	    request.params = AWS.util.copy(request.params);
	    request.params.accountId = '-';
	  },

	  /**
	   * @api private
	   */
	  addGlacierApiVersion: function addGlacierApiVersion(request) {
	    var version = request.service.api.apiVersion;
	    request.httpRequest.headers['x-amz-glacier-version'] = version;
	  },

	  /**
	   * @api private
	   */
	  addTreeHashHeaders: function addTreeHashHeaders(request) {
	    if (request.params.body === undefined) return;

	    var hashes = request.service.computeChecksums(request.params.body);
	    request.httpRequest.headers['x-amz-content-sha256'] = hashes.linearHash;

	    if (!request.httpRequest.headers['x-amz-sha256-tree-hash']) {
	      request.httpRequest.headers['x-amz-sha256-tree-hash'] = hashes.treeHash;
	    }
	  },

	  /**
	   * @!group Computing Checksums
	   */

	  /**
	   * Computes the SHA-256 linear and tree hash checksums for a given
	   * block of Buffer data. Pass the tree hash of the computed checksums
	   * as the checksum input to the {completeMultipartUpload} when performing
	   * a multi-part upload.
	   *
	   * @example Calculate checksum of 5.5MB data chunk
	   *   var glacier = new AWS.Glacier();
	   *   var data = new Buffer(5.5 * 1024 * 1024);
	   *   data.fill('0'); // fill with zeros
	   *   var results = glacier.computeChecksums(data);
	   *   // Result: { linearHash: '68aff0c5a9...', treeHash: '154e26c78f...' }
	   * @param data [Buffer, String] data to calculate the checksum for
	   * @return [map<linearHash:String,treeHash:String>] a map containing
	   *   the linearHash and treeHash properties representing hex based digests
	   *   of the respective checksums.
	   * @see completeMultipartUpload
	   */
	  computeChecksums: function computeChecksums(data) {
	    if (!AWS.util.Buffer.isBuffer(data)) data = new AWS.util.Buffer(data);

	    var mb = 1024 * 1024;
	    var hashes = [];
	    var hash = AWS.util.crypto.createHash('sha256');

	    // build leaf nodes in 1mb chunks
	    for (var i = 0; i < data.length; i += mb) {
	      var chunk = data.slice(i, Math.min(i + mb, data.length));
	      hash.update(chunk);
	      hashes.push(AWS.util.crypto.sha256(chunk));
	    }

	    return {
	      linearHash: hash.digest('hex'),
	      treeHash: this.buildHashTree(hashes)
	    };
	  },

	  /**
	   * @api private
	   */
	  buildHashTree: function buildHashTree(hashes) {
	    // merge leaf nodes
	    while (hashes.length > 1) {
	      var tmpHashes = [];
	      for (var i = 0; i < hashes.length; i += 2) {
	        if (hashes[i + 1]) {
	          var tmpHash = new AWS.util.Buffer(64);
	          tmpHash.write(hashes[i], 0, 32, 'binary');
	          tmpHash.write(hashes[i + 1], 32, 32, 'binary');
	          tmpHashes.push(AWS.util.crypto.sha256(tmpHash));
	        } else {
	          tmpHashes.push(hashes[i]);
	        }
	      }
	      hashes = tmpHashes;
	    }

	    return AWS.util.crypto.toHex(hashes[0]);
	  }
	});


/***/ },
/* 80 */
/***/ function(module, exports, __webpack_require__) {

	var AWS = __webpack_require__(8);

	AWS.util.update(AWS.Route53.prototype, {
	  /**
	   * @api private
	   */
	  setupRequestListeners: function setupRequestListeners(request) {
	    request.on('build', this.sanitizeUrl);
	  },

	  /**
	   * @api private
	   */
	  sanitizeUrl: function sanitizeUrl(request) {
	    var path = request.httpRequest.path;
	    request.httpRequest.path = path.replace(/\/%2F\w+%2F/, '/');
	  }
	});


/***/ },
/* 81 */
/***/ function(module, exports, __webpack_require__) {

	var AWS = __webpack_require__(8);

	AWS.util.update(AWS.S3.prototype, {
	  /**
	   * @api private
	   */
	  validateService: function validateService() {
	    // default to us-east-1 when no region is provided
	    if (!this.config.region) this.config.region = 'us-east-1';

	    if (!this.config.endpoint && this.config.s3BucketEndpoint) {
	      var msg = 'An endpoint must be provided when configuring ' +
	                '`s3BucketEndpoint` to true.';
	      throw AWS.util.error(new Error(),
	        {name: 'InvalidEndpoint', message: msg});
	    }
	  },

	  /**
	   * @api private
	   */
	  setupRequestListeners: function setupRequestListeners(request) {
	    request.addListener('validate', this.validateScheme);
	    request.addListener('validate', this.validateBucketEndpoint);
	    request.addListener('build', this.addContentType);
	    request.addListener('build', this.populateURI);
	    request.addListener('build', this.computeContentMd5);
	    request.onAsync('build', this.computeSha256);
	    request.addListener('build', this.computeSseCustomerKeyMd5);
	    request.removeListener('validate',
	      AWS.EventListeners.Core.VALIDATE_REGION);
	    request.addListener('extractError', this.extractError);
	    request.addListener('extractData', this.extractData);
	    request.addListener('beforePresign', this.prepareSignedUrl);
	  },

	  /*
	   * @api private
	   *
	   */
	  validateScheme: function(req) {
	    var params = req.params,
	        scheme = req.httpRequest.endpoint.protocol,
	        sensitive = params.SSECustomerKey || params.CopySourceSSECustomerKey;
	    if (sensitive && scheme !== 'https:') {
	      var msg = 'Cannot send SSE keys over HTTP. Set \'sslEnabled\'' +
	        'to \'true\' in your configuration';
	      throw AWS.util.error(new Error(),
	        { code: 'ConfigError', message: msg });
	    }
	  },

	  /*
	   * @api private
	   *
	   */
	  validateBucketEndpoint: function(req) {
	    if (!req.params.Bucket && req.service.config.s3BucketEndpoint) {
	      var msg = 'Cannot send requests to root API with `s3BucketEndpoint` set.';
	      throw AWS.util.error(new Error(),
	        { code: 'ConfigError', message: msg });
	    }
	  },

	  /**
	   * S3 prefers dns-compatible bucket names to be moved from the uri path
	   * to the hostname as a sub-domain.  This is not possible, even for dns-compat
	   * buckets when using SSL and the bucket name contains a dot ('.').  The
	   * ssl wildcard certificate is only 1-level deep.
	   *
	   * @api private
	   */
	  populateURI: function populateURI(req) {
	    var httpRequest = req.httpRequest;
	    var b = req.params.Bucket;

	    if (b) {
	      if (!req.service.pathStyleBucketName(b)) {
	        if (!req.service.config.s3BucketEndpoint) {
	          httpRequest.endpoint.hostname =
	            b + '.' + httpRequest.endpoint.hostname;

	          var port = httpRequest.endpoint.port;
	          if (port !== 80 && port !== 443) {
	            httpRequest.endpoint.host = httpRequest.endpoint.hostname + ':' +
	              httpRequest.endpoint.port;
	          } else {
	            httpRequest.endpoint.host = httpRequest.endpoint.hostname;
	          }
	        }

	        httpRequest.virtualHostedBucket = b; // needed for signing the request
	        httpRequest.path = httpRequest.path.replace(new RegExp('/' + b), '');
	        if (httpRequest.path[0] !== '/') {
	          httpRequest.path = '/' + httpRequest.path;
	        }
	      }
	    }
	  },

	  /**
	   * Adds a default content type if none is supplied.
	   *
	   * @api private
	   */
	  addContentType: function addContentType(req) {
	    var httpRequest = req.httpRequest;
	    if (httpRequest.method === 'GET' || httpRequest.method === 'HEAD') {
	      // Content-Type is not set in GET/HEAD requests
	      delete httpRequest.headers['Content-Type'];
	      return;
	    }

	    if (!httpRequest.headers['Content-Type']) { // always have a Content-Type
	      httpRequest.headers['Content-Type'] = 'application/octet-stream';
	    }

	    var contentType = httpRequest.headers['Content-Type'];
	    if (AWS.util.isBrowser()) {
	      if (typeof httpRequest.body === 'string' && !contentType.match(/;\s*charset=/)) {
	        var charset = '; charset=UTF-8';
	        httpRequest.headers['Content-Type'] += charset;
	      } else {
	        var replaceFn = function(_, prefix, charset) {
	          return prefix + charset.toUpperCase();
	        };

	        httpRequest.headers['Content-Type'] =
	          contentType.replace(/(;\s*charset=)(.+)$/, replaceFn);
	      }
	    }
	  },

	  /**
	   * @api private
	   */
	  computableChecksumOperations: {
	    putBucketCors: true,
	    putBucketLifecycle: true,
	    putBucketTagging: true,
	    deleteObjects: true
	  },

	  /**
	   * Checks whether checksums should be computed for the request.
	   * If the request requires checksums to be computed, this will always
	   * return true, otherwise it depends on whether {AWS.Config.computeChecksums}
	   * is set.
	   *
	   * @param req [AWS.Request] the request to check against
	   * @return [Boolean] whether to compute checksums for a request.
	   * @api private
	   */
	  willComputeChecksums: function willComputeChecksums(req) {
	    if (this.computableChecksumOperations[req.operation]) return true;
	    if (!this.config.computeChecksums) return false;

	    // TODO: compute checksums for Stream objects
	    if (!AWS.util.Buffer.isBuffer(req.httpRequest.body) &&
	        typeof req.httpRequest.body !== 'string') {
	      return false;
	    }

	    var rules = req.service.api.operations[req.operation].input.members;

	    // V4 signer uses SHA256 signatures so only compute MD5 if it is required
	    if (req.service.getSignerClass(req) === AWS.Signers.V4) {
	      if (rules.ContentMD5 && !rules.ContentMD5.required) return false;
	    }

	    if (rules.ContentMD5 && !req.params.ContentMD5) return true;
	  },

	  /**
	   * A listener that computes the Content-MD5 and sets it in the header.
	   * @see AWS.S3.willComputeChecksums
	   * @api private
	   */
	  computeContentMd5: function computeContentMd5(req) {
	    if (req.service.willComputeChecksums(req)) {
	      var md5 = AWS.util.crypto.md5(req.httpRequest.body, 'base64');
	      req.httpRequest.headers['Content-MD5'] = md5;
	    }
	  },

	  /**
	   * @api private
	   */
	  computeSha256: function computeSha256(req, done) {
	    if (req.service.getSignerClass(req) === AWS.Signers.V4) {
	      var body = req.httpRequest.body || '';

	      if (AWS.util.isNode()) {
	        var Stream = AWS.util.nodeRequire('stream').Stream;
	        var fs = AWS.util.nodeRequire('fs');
	        if (body instanceof Stream) {
	          if (typeof body.path === 'string') { // assume file object
	            body = fs.createReadStream(body.path);
	          } else { // TODO support other stream types
	            done(new Error('Non-file stream objects are ' +
	                           'not supported with SigV4 in AWS.S3'));
	            return;
	          }
	        }
	      }

	      AWS.util.crypto.sha256(body, 'hex', function(err, sha) {
	        if (!err) {
	          req.httpRequest.headers['X-Amz-Content-Sha256'] = sha;
	        }
	        done(err);
	      });
	    } else {
	      done();
	    }
	  },

	  /**
	   * @api private
	   */
	  computeSseCustomerKeyMd5: function computeSseCustomerKeyMd5(req) {
	    var headers = [
	      'x-amz-server-side-encryption-customer-key',
	      'x-amz-copy-source-server-side-encryption-customer-key'
	    ];
	    AWS.util.arrayEach(headers, function(header) {
	      if (req.httpRequest.headers[header]) {
	        var key = req.httpRequest.headers[header];
	        var md5header = header + '-MD5';

	        req.httpRequest.headers[header] = AWS.util.base64.encode(key);
	        if (!req.httpRequest.headers[md5header]) {
	          var value = AWS.util.crypto.md5(key, 'base64');
	          req.httpRequest.headers[md5header] = AWS.util.base64.encode(value);
	        }

	      }
	    });
	  },

	  /**
	   * Returns true if the bucket name should be left in the URI path for
	   * a request to S3.  This function takes into account the current
	   * endpoint protocol (e.g. http or https).
	   *
	   * @api private
	   */
	  pathStyleBucketName: function pathStyleBucketName(bucketName) {
	    // user can force path style requests via the configuration
	    if (this.config.s3ForcePathStyle) return true;
	    if (this.config.s3BucketEndpoint) return false;

	    if (this.dnsCompatibleBucketName(bucketName)) {
	      return (this.config.sslEnabled && bucketName.match(/\./)) ? true : false;
	    } else {
	      return true; // not dns compatible names must always use path style
	    }
	  },

	  /**
	   * Returns true if the bucket name is DNS compatible.  Buckets created
	   * outside of the classic region MUST be DNS compatible.
	   *
	   * @api private
	   */
	  dnsCompatibleBucketName: function dnsCompatibleBucketName(bucketName) {
	    var b = bucketName;
	    var domain = new RegExp(/^[a-z0-9][a-z0-9\.\-]{1,61}[a-z0-9]$/);
	    var ipAddress = new RegExp(/(\d+\.){3}\d+/);
	    var dots = new RegExp(/\.\./);
	    return (b.match(domain) && !b.match(ipAddress) && !b.match(dots)) ? true : false;
	  },

	  /**
	   * @return [Boolean] whether response contains an error
	   * @api private
	   */
	  successfulResponse: function successfulResponse(resp) {
	    var req = resp.request;
	    var httpResponse = resp.httpResponse;
	    if (req.operation === 'completeMultipartUpload' &&
	        httpResponse.body.toString().match('<Error>'))
	      return false;
	    else
	      return httpResponse.statusCode < 300;
	  },

	  /**
	   * @return [Boolean] whether the error can be retried
	   * @api private
	   */
	  retryableError: function retryableError(error, request) {
	    if (request.operation === 'completeMultipartUpload' &&
	        error.statusCode === 200) {
	      return true;
	    } else if (error && error.code === 'RequestTimeout') {
	      return true;
	    } else {
	      var _super = AWS.Service.prototype.retryableError;
	      return _super.call(this, error, request);
	    }
	  },

	  /**
	   * Provides a specialized parser for getBucketLocation -- all other
	   * operations are parsed by the super class.
	   *
	   * @api private
	   */
	  extractData: function extractData(resp) {
	    var req = resp.request;
	    if (req.operation === 'getBucketLocation') {
	      var match = resp.httpResponse.body.toString().match(/>(.+)<\/Location/);
	      if (match) {
	        delete resp.data['_'];
	        resp.data.LocationConstraint = match[1];
	      }
	    }
	  },

	  /**
	   * Extracts an error object from the http response.
	   *
	   * @api private
	   */
	  extractError: function extractError(resp) {
	    var codes = {
	      304: 'NotModified',
	      403: 'Forbidden',
	      400: 'BadRequest',
	      404: 'NotFound'
	    };

	    var code = resp.httpResponse.statusCode;
	    var body = resp.httpResponse.body || '';
	    if (codes[code] && body.length === 0) {
	      resp.error = AWS.util.error(new Error(), {
	        code: codes[resp.httpResponse.statusCode],
	        message: null
	      });
	    } else {
	      var data = new AWS.XML.Parser().parse(body.toString());
	      resp.error = AWS.util.error(new Error(), {
	        code: data.Code || code,
	        message: data.Message || null
	      });
	    }
	  },

	  /**
	   * Get a pre-signed URL for a given operation name.
	   *
	   * @note You must ensure that you have static or previously resolved
	   *   credentials if you call this method synchronously (with no callback),
	   *   otherwise it may not properly sign the request. If you cannot guarantee
	   *   this (you are using an asynchronous credential provider, i.e., EC2
	   *   IAM roles), you should always call this method with an asynchronous
	   *   callback.
	   * @param operation [String] the name of the operation to call
	   * @param params [map] parameters to pass to the operation. See the given
	   *   operation for the expected operation parameters. In addition, you can
	   *   also pass the "Expires" parameter to inform S3 how long the URL should
	   *   work for.
	   * @option params Expires [Integer] (900) the number of seconds to expire
	   *   the pre-signed URL operation in. Defaults to 15 minutes.
	   * @param callback [Function] if a callback is provided, this function will
	   *   pass the URL as the second parameter (after the error parameter) to
	   *   the callback function.
	   * @return [String] if called synchronously (with no callback), returns the
	   *   signed URL.
	   * @return [null] nothing is returned if a callback is provided.
	   * @example Pre-signing a getObject operation (synchronously)
	   *   var params = {Bucket: 'bucket', Key: 'key'};
	   *   var url = s3.getSignedUrl('getObject', params);
	   *   console.log('The URL is', url);
	   * @example Pre-signing a putObject (asynchronously)
	   *   var params = {Bucket: 'bucket', Key: 'key'};
	   *   s3.getSignedUrl('putObject', params, function (err, url) {
	   *     console.log('The URL is', url);
	   *   });
	   * @example Pre-signing a putObject operation with a specific payload
	   *   var params = {Bucket: 'bucket', Key: 'key', Body: 'body'};
	   *   var url = s3.getSignedUrl('putObject', params);
	   *   console.log('The URL is', url);
	   * @example Passing in a 1-minute expiry time for a pre-signed URL
	   *   var params = {Bucket: 'bucket', Key: 'key', Expires: 60};
	   *   var url = s3.getSignedUrl('getObject', params);
	   *   console.log('The URL is', url); // expires in 60 seconds
	   */
	  getSignedUrl: function getSignedUrl(operation, params, callback) {
	    params = AWS.util.copy(params || {});
	    var expires = params.Expires || 900;
	    delete params.Expires; // we can't validate this
	    var request = this.makeRequest(operation, params);
	    return request.presign(expires, callback);
	  },

	  /**
	   * @api private
	   */
	  prepareSignedUrl: function prepareSignedUrl(request) {
	    request.removeListener('build', request.service.addContentType);
	    if (!request.params.Body) {
	      // no Content-MD5/SHA-256 if body is not provided
	      request.removeListener('build', request.service.computeContentMd5);
	      request.removeListener('build', request.service.computeSha256);
	    }
	  },

	  createBucket: function createBucket(params, callback) {
	    // When creating a bucket *outside* the classic region, the location
	    // constraint must be set for the bucket and it must match the endpoint.
	    // This chunk of code will set the location constraint param based
	    // on the region (when possible), but it will not override a passed-in
	    // location constraint.
	    if (!params) params = {};
	    var hostname = this.endpoint.hostname;
	    if (hostname !== this.api.globalEndpoint && !params.CreateBucketConfiguration) {
	      params.CreateBucketConfiguration = { LocationConstraint: this.config.region };
	    }
	    return this.makeRequest('createBucket', params, callback);
	  }
	});


/***/ },
/* 82 */
/***/ function(module, exports, __webpack_require__) {

	var AWS = __webpack_require__(8);

	AWS.util.update(AWS.SQS.prototype, {
	  /**
	   * @api private
	   */
	  setupRequestListeners: function setupRequestListeners(request) {
	    request.addListener('build', this.buildEndpoint);

	    if (request.service.config.computeChecksums) {
	      if (request.operation === 'sendMessage') {
	        request.addListener('extractData', this.verifySendMessageChecksum);
	      } else if (request.operation === 'sendMessageBatch') {
	        request.addListener('extractData', this.verifySendMessageBatchChecksum);
	      } else if (request.operation === 'receiveMessage') {
	        request.addListener('extractData', this.verifyReceiveMessageChecksum);
	      }
	    }
	  },

	  /**
	   * @api private
	   */
	  verifySendMessageChecksum: function verifySendMessageChecksum(response) {
	    if (!response.data) return;

	    var md5 = response.data.MD5OfMessageBody;
	    var body = this.params.MessageBody;
	    var calculatedMd5 = this.service.calculateChecksum(body);
	    if (calculatedMd5 !== md5) {
	      var msg = 'Got "' + response.data.MD5OfMessageBody +
	        '", expecting "' + calculatedMd5 + '".';
	      this.service.throwInvalidChecksumError(response,
	        [response.data.MessageId], msg);
	    }
	  },

	  /**
	   * @api private
	   */
	  verifySendMessageBatchChecksum: function verifySendMessageBatchChecksum(response) {
	    if (!response.data) return;

	    var service = this.service;
	    var entries = {};
	    var errors = [];
	    var messageIds = [];
	    AWS.util.arrayEach(response.data.Successful, function (entry) {
	      entries[entry.Id] = entry;
	    });
	    AWS.util.arrayEach(this.params.Entries, function (entry) {
	      if (entries[entry.Id]) {
	        var md5 = entries[entry.Id].MD5OfMessageBody;
	        var body = entry.MessageBody;
	        if (!service.isChecksumValid(md5, body)) {
	          errors.push(entry.Id);
	          messageIds.push(entries[entry.Id].MessageId);
	        }
	      }
	    });

	    if (errors.length > 0) {
	      service.throwInvalidChecksumError(response, messageIds,
	        'Invalid messages: ' + errors.join(', '));
	    }
	  },

	  /**
	   * @api private
	   */
	  verifyReceiveMessageChecksum: function verifyReceiveMessageChecksum(response) {
	    if (!response.data) return;

	    var service = this.service;
	    var messageIds = [];
	    AWS.util.arrayEach(response.data.Messages, function(message) {
	      var md5 = message.MD5OfBody;
	      var body = message.Body;
	      if (!service.isChecksumValid(md5, body)) {
	        messageIds.push(message.MessageId);
	      }
	    });

	    if (messageIds.length > 0) {
	      service.throwInvalidChecksumError(response, messageIds,
	        'Invalid messages: ' + messageIds.join(', '));
	    }
	  },

	  /**
	   * @api private
	   */
	  throwInvalidChecksumError: function throwInvalidChecksumError(response, ids, message) {
	    response.error = AWS.util.error(new Error(), {
	      retryable: true,
	      code: 'InvalidChecksum',
	      messageIds: ids,
	      message: response.request.operation +
	               ' returned an invalid MD5 response. ' + message
	    });
	  },

	  /**
	   * @api private
	   */
	  isChecksumValid: function isChecksumValid(checksum, data) {
	    return this.calculateChecksum(data) === checksum;
	  },

	  /**
	   * @api private
	   */
	  calculateChecksum: function calculateChecksum(data) {
	    return AWS.util.crypto.md5(data, 'hex');
	  },

	  /**
	   * @api private
	   */
	  buildEndpoint: function buildEndpoint(request) {
	    var url = request.httpRequest.params.QueueUrl;
	    if (url) {
	      request.httpRequest.endpoint = new AWS.Endpoint(url);

	      // signature version 4 requires the region name to be set,
	      // sqs queue urls contain the region name
	      var matches = request.httpRequest.endpoint.host.match(/^sqs\.(.+?)\./);
	      if (matches) request.httpRequest.region = matches[1];
	    }
	  }
	});


/***/ },
/* 83 */
/***/ function(module, exports, __webpack_require__) {

	var AWS = __webpack_require__(8);

	AWS.util.update(AWS.STS.prototype, {
	  /**
	   * @overload credentialsFrom(data, credentials = null)
	   *   Creates a credentials object from STS response data containing
	   *   credentials information. Useful for quickly setting AWS credentials.
	   *
	   *   @note This is a low-level utility function. If you want to load temporary
	   *     credentials into your process for subsequent requests to AWS resources,
	   *     you should use {AWS.TemporaryCredentials} instead.
	   *   @param data [map] data retrieved from a call to {getFederatedToken},
	   *     {getSessionToken}, {assumeRole}, or {assumeRoleWithWebIdentity}.
	   *   @param credentials [AWS.Credentials] an optional credentials object to
	   *     fill instead of creating a new object. Useful when modifying an
	   *     existing credentials object from a refresh call.
	   *   @return [AWS.TemporaryCredentials] the set of temporary credentials
	   *     loaded from a raw STS operation response.
	   *   @example Using credentialsFrom to load global AWS credentials
	   *     var sts = new AWS.STS();
	   *     sts.getSessionToken(function (err, data) {
	   *       if (err) console.log("Error getting credentials");
	   *       else {
	   *         AWS.config.credentials = sts.credentialsFrom(data);
	   *       }
	   *     });
	   *   @see AWS.TemporaryCredentials
	   */
	  credentialsFrom: function credentialsFrom(data, credentials) {
	    if (!data) return null;
	    if (!credentials) credentials = new AWS.TemporaryCredentials();
	    credentials.expired = false;
	    credentials.accessKeyId = data.Credentials.AccessKeyId;
	    credentials.secretAccessKey = data.Credentials.SecretAccessKey;
	    credentials.sessionToken = data.Credentials.SessionToken;
	    credentials.expireTime = data.Credentials.Expiration;
	    return credentials;
	  },

	  assumeRoleWithWebIdentity: function assumeRoleWithWebIdentity(params, callback) {
	    return this.makeUnauthenticatedRequest('assumeRoleWithWebIdentity', params, callback);
	  },

	  assumeRoleWithSAML: function assumeRoleWithSAML(params, callback) {
	    return this.makeUnauthenticatedRequest('assumeRoleWithSAML', params, callback);
	  }
	});


/***/ },
/* 84 */
/***/ function(module, exports, __webpack_require__) {

	var AWS = __webpack_require__(8);

	AWS.util.hideProperties(AWS, ['SimpleWorkflow']);

	/**
	 * @constant
	 * @readonly
	 * Backwards compatibility for access to the {AWS.SWF} service class.
	 */
	AWS.SimpleWorkflow = AWS.SWF;


/***/ },
/* 85 */
/***/ function(module, exports, __webpack_require__) {

	var AWS = __webpack_require__(8);
	__webpack_require__(86);

	/**
	 * Represents credentials received from the metadata service on an EC2 instance.
	 *
	 * By default, this class will connect to the metadata service using
	 * {AWS.MetadataService} and attempt to load any available credentials. If it
	 * can connect, and credentials are available, these will be used with zero
	 * configuration.
	 *
	 * This credentials class will timeout after 1 second of inactivity by default.
	 * If your requests to the EC2 metadata service are timing out, you can increase
	 * the value by configuring them directly:
	 *
	 * ```javascript
	 * AWS.config.credentials = new AWS.EC2MetadataCredentials({
	 *   httpOptions: { timeout: 5000 } // 5 second timeout
	 * });
	 * ```
	 *
	 * @!macro nobrowser
	 */
	AWS.EC2MetadataCredentials = AWS.util.inherit(AWS.Credentials, {
	  constructor: function EC2MetadataCredentials(options) {
	    AWS.Credentials.call(this);

	    options = options ? AWS.util.copy(options) : {};
	    if (!options.httpOptions) options.httpOptions = {};
	    options.httpOptions = AWS.util.merge(
	      {timeout: this.defaultTimeout}, options.httpOptions);

	    this.metadataService = new AWS.MetadataService(options);
	    this.metadata = {};
	  },

	  /**
	   * @api private
	   */
	  defaultTimeout: 1000,

	  /**
	   * Loads the credentials from the instance metadata service
	   *
	   * @callback callback function(err)
	   *   Called when the instance metadata service responds (or fails). When
	   *   this callback is called with no error, it means that the credentials
	   *   information has been loaded into the object (as the `accessKeyId`,
	   *   `secretAccessKey`, and `sessionToken` properties).
	   *   @param err [Error] if an error occurred, this value will be filled
	   * @see get
	   */
	  refresh: function refresh(callback) {
	    var self = this;
	    if (!callback) callback = function(err) { if (err) throw err; };

	    self.metadataService.loadCredentials(function (err, creds) {
	      if (!err) {
	        self.expired = false;
	        self.metadata = creds;
	        self.accessKeyId = creds.AccessKeyId;
	        self.secretAccessKey = creds.SecretAccessKey;
	        self.sessionToken = creds.Token;
	        self.expireTime = new Date(creds.Expiration);
	      }
	      callback(err);
	    });
	  }
	});


/***/ },
/* 86 */
/***/ function(module, exports, __webpack_require__) {

	var AWS = __webpack_require__(8);
	__webpack_require__(60);
	var inherit = AWS.util.inherit;

	/**
	 * Represents a metadata service available on EC2 instances. Using the
	 * {request} method, you can receieve metadata about any available resource
	 * on the metadata service.
	 *
	 * @!attribute [r] httpOptions
	 *   @return [map] a map of options to pass to the underlying HTTP request:
	 *
	 *     * **timeout** (Number) &mdash; a timeout value in milliseconds to wait
	 *       before aborting the connection. Set to 0 for no timeout.
	 *
	 * @!macro nobrowser
	 */
	AWS.MetadataService = inherit({
	  /**
	   * @return [String] the hostname of the instance metadata service
	   */
	  host: '169.254.169.254',

	  /**
	   * @!ignore
	   */

	  /**
	   * Default HTTP options. By default, the metadata service is set to not
	   * timeout on long requests. This means that on non-EC2 machines, this
	   * request will never return. If you are calling this operation from an
	   * environment that may not always run on EC2, set a `timeout` value so
	   * the SDK will abort the request after a given number of milliseconds.
	   */
	  httpOptions: { timeout: 0 },

	  /**
	   * Creates a new MetadataService object with a given set of options.
	   *
	   * @option options host [String] the hostname of the instance metadata
	   *   service
	   * @option options httpOptions [map] a map of options to pass to the
	   *   underlying HTTP request:
	   *
	   *   * **timeout** (Number) &mdash; a timeout value in milliseconds to wait
	   *     before aborting the connection. Set to 0 for no timeout.
	   */
	  constructor: function MetadataService(options) {
	    AWS.util.update(this, options);
	  },

	  /**
	   * Sends a request to the instance metadata service for a given resource.
	   *
	   * @param path [String] the path of the resource to get
	   * @callback callback function(err, data)
	   *   Called when a response is available from the service.
	   *   @param err [Error, null] if an error occurred, this value will be set
	   *   @param data [String, null] if the request was successful, the body of
	   *     the response
	   */
	  request: function request(path, callback) {
	    path = path || '/';

	    var data = '';
	    var http = AWS.HttpClient.getInstance();
	    var httpRequest = new AWS.HttpRequest('http://' + this.host + path);
	    httpRequest.method = 'GET';

	    http.handleRequest(httpRequest, this.httpOptions, function(httpResponse) {
	      httpResponse.on('data', function(chunk) { data += chunk.toString(); });
	      httpResponse.on('end', function() { callback(null, data); });
	    }, callback);
	  },

	  /**
	   * Loads a set of credentials stored in the instance metadata service
	   *
	   * @api private
	   * @callback callback function(err, credentials)
	   *   Called when credentials are loaded from the resource
	   *   @param err [Error] if an error occurred, this value will be set
	   *   @param credentials [Object] the raw JSON object containing all
	   *     metadata from the credentials resource
	   */
	  loadCredentials: function loadCredentials(callback) {
	    var self = this;
	    var basePath = '/latest/meta-data/iam/security-credentials/';
	    self.request(basePath, function (err, roleName) {
	      if (err) callback(err);
	      else {
	        roleName = roleName.split('\n')[0]; // grab first (and only) role
	        self.request(basePath + roleName, function (credErr, credData) {
	          if (credErr) callback(credErr);
	          else {
	            try {
	              var credentials = JSON.parse(credData);
	              callback(null, credentials);
	            } catch (parseError) {
	              callback(parseError);
	            }
	          }
	        });
	      }
	    });
	  }
	});

	module.exports = AWS.MetadataService;


/***/ },
/* 87 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {var AWS = __webpack_require__(8);

	/**
	 * Represents credentials from the environment.
	 *
	 * By default, this class will look for the matching environment variables
	 * prefixed by a given {envPrefix}. The un-prefixed environment variable names
	 * for each credential value is listed below:
	 *
	 * ```javascript
	 * accessKeyId: ACCESS_KEY_ID
	 * secretAccessKey: SECRET_ACCESS_KEY
	 * sessionToken: SESSION_TOKEN
	 * ```
	 *
	 * With the default prefix of 'AWS', the environment variables would be:
	 *
	 *     AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN
	 *
	 * @!attribute envPrefix
	 *   @readonly
	 *   @return [String] the prefix for the environment variable names excluding
	 *     the separating underscore ('_').
	 */
	AWS.EnvironmentCredentials = AWS.util.inherit(AWS.Credentials, {

	  /**
	   * Creates a new EnvironmentCredentials class with a given variable
	   * prefix {envPrefix}. For example, to load credentials using the 'AWS'
	   * prefix:
	   *
	   * ```javascript
	   * var creds = new AWS.EnvironmentCredentials('AWS');
	   * creds.accessKeyId == 'AKID' // from AWS_ACCESS_KEY_ID env var
	   * ```
	   *
	   * @param envPrefix [String] the prefix to use (e.g., 'AWS') for environment
	   *   variables. Do not include the separating underscore.
	   */
	  constructor: function EnvironmentCredentials(envPrefix) {
	    AWS.Credentials.call(this);
	    this.envPrefix = envPrefix;
	    this.get(function() {});
	  },

	  /**
	   * Loads credentials from the environment using the prefixed
	   * environment variables.
	   *
	   * @callback callback function(err)
	   *   Called when the instance metadata service responds (or fails). When
	   *   this callback is called with no error, it means that the credentials
	   *   information has been loaded into the object (as the `accessKeyId`,
	   *   `secretAccessKey`, and `sessionToken` properties).
	   *   @param err [Error] if an error occurred, this value will be filled
	   * @see get
	   */
	  refresh: function refresh(callback) {
	    if (!callback) callback = function(err) { if (err) throw err; };

	    if (process === undefined) {
	      callback(new Error('No process info available'));
	      return;
	    }

	    var keys = ['ACCESS_KEY_ID', 'SECRET_ACCESS_KEY', 'SESSION_TOKEN'];
	    var values = [];

	    for (var i = 0; i < keys.length; i++) {
	      var prefix = '';
	      if (this.envPrefix) prefix = this.envPrefix + '_';
	      values[i] = process.env[prefix + keys[i]];
	      if (!values[i] && keys[i] !== 'SESSION_TOKEN') {
	        callback(new Error('Variable ' + prefix + keys[i] + ' not set.'));
	        return;
	      }
	    }

	    this.expired = false;
	    AWS.Credentials.apply(this, values);
	    callback();
	  }

	});

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)))

/***/ },
/* 88 */
/***/ function(module, exports, __webpack_require__) {

	var AWS = __webpack_require__(8);

	/**
	 * Represents credentials from a JSON file on disk.
	 * If the credentials expire, the SDK can {refresh} the credentials
	 * from the file.
	 *
	 * The format of the file should be similar to the options passed to
	 * {AWS.Config}:
	 *
	 * ```javascript
	 * {accessKeyId: 'akid', secretAccessKey: 'secret', sessionToken: 'optional'}
	 * ```
	 *
	 * @example Loading credentials from disk
	 *   var creds = new AWS.FileSystemCredentials('./configuration.json');
	 *   creds.accessKeyId == 'AKID'
	 *
	 * @!attribute filename
	 *   @readonly
	 *   @return [String] the path to the JSON file on disk containing the
	 *     credentials.
	 * @!macro nobrowser
	 */
	AWS.FileSystemCredentials = AWS.util.inherit(AWS.Credentials, {

	  /**
	   * @overload AWS.FileSystemCredentials(filename)
	   *   Creates a new FileSystemCredentials object from a filename
	   *
	   *   @param filename [String] the path on disk to the JSON file to load.
	   */
	  constructor: function FileSystemCredentials(filename) {
	    AWS.Credentials.call(this);
	    this.filename = filename;
	    this.get(function() {});
	  },

	  /**
	   * Loads the credentials from the {filename} on disk.
	   *
	   * @callback callback function(err)
	   *   Called when the instance metadata service responds (or fails). When
	   *   this callback is called with no error, it means that the credentials
	   *   information has been loaded into the object (as the `accessKeyId`,
	   *   `secretAccessKey`, and `sessionToken` properties).
	   *   @param err [Error] if an error occurred, this value will be filled
	   * @see get
	   */
	  refresh: function refresh(callback) {
	    if (!callback) callback = function(err) { if (err) throw err; };
	    try {
	      var creds = JSON.parse(AWS.util.readFileSync(this.filename));
	      AWS.Credentials.call(this, creds);
	      if (!this.accessKeyId || !this.secretAccessKey) {
	        throw new Error('Credentials not set in ' + this.filename);
	      }
	      this.expired = false;
	      callback();
	    } catch (err) {
	      callback(err);
	    }
	  }

	});


/***/ },
/* 89 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {var AWS = __webpack_require__(8);
	var path = __webpack_require__(34);

	/**
	 * Represents credentials loaded from shared credentials file
	 * (defaulting to ~/.aws/credentials).
	 *
	 * ## Using the shared credentials file
	 *
	 * This provider is checked by default in the Node.js environment. To use the
	 * credentials file provider, simply add your access and secret keys to the
	 * ~/.aws/credentials file in the following format:
	 *
	 *     [default]
	 *     aws_access_key_id = AKID...
	 *     aws_secret_access_key = YOUR_SECRET_KEY
	 *
	 * ## Using custom profiles
	 *
	 * The SDK supports loading credentials for separate profiles. This can be done
	 * in two ways:
	 *
	 * 1. Set the `AWS_PROFILE` environment variable in your process prior to
	 *    loading the SDK.
	 * 2. Directly load the AWS.SharedIniFileCredentials provider:
	 *
	 * ```javascript
	 * var creds = new AWS.SharedIniFileCredentials({profile: 'myprofile'});
	 * AWS.config.credentials = creds;
	 * ```
	 *
	 * @!macro nobrowser
	 */
	AWS.SharedIniFileCredentials = AWS.util.inherit(AWS.Credentials, {
	  /**
	   * Creates a new SharedIniFileCredentials object.
	   *
	   * @param options [map] a set of options
	   * @option options profile [String] (AWS_PROFILE env var or 'default')
	   *   the name of the profile to load.
	   * @option options filename [String] ('~/.aws/credentials') the filename
	   *   to use when loading credentials.
	   */
	  constructor: function SharedIniFileCredentials(options) {
	    AWS.Credentials.call(this);

	    options = options || {};

	    this.filename = options.filename;
	    this.profile = options.profile || process.env.AWS_PROFILE || 'default';
	    this.get(function() {});
	  },

	  /**
	   * Loads the credentials from the instance metadata service
	   *
	   * @callback callback function(err)
	   *   Called when the instance metadata service responds (or fails). When
	   *   this callback is called with no error, it means that the credentials
	   *   information has been loaded into the object (as the `accessKeyId`,
	   *   `secretAccessKey`, and `sessionToken` properties).
	   *   @param err [Error] if an error occurred, this value will be filled
	   * @see get
	   */
	  refresh: function refresh(callback) {
	    if (!callback) callback = function(err) { if (err) throw err; };
	    try {
	      if (!this.filename) this.loadDefaultFilename();
	      var creds = AWS.util.ini.parse(AWS.util.readFileSync(this.filename));
	      if (typeof creds[this.profile] === 'object') {
	        this.accessKeyId = creds[this.profile]['aws_access_key_id'];
	        this.secretAccessKey = creds[this.profile]['aws_secret_access_key'];
	        this.sessionToken = creds[this.profile]['aws_session_token'];
	      }

	      if (!this.accessKeyId || !this.secretAccessKey) {
	        throw new Error('Credentials not set in ' + this.filename +
	                        ' using profile ' + this.profile);
	      }
	      this.expired = false;
	      callback();
	    } catch (err) {
	      callback(err);
	    }
	  },

	  /**
	   * @api private
	   */
	  loadDefaultFilename: function loadDefaultFilename() {
	    var env = process.env;
	    var home = env.HOME ||
	               env.USERPROFILE ||
	               (env.HOMEPATH ? ((env.HOMEDRIVE || 'C:/') + env.HOMEPATH) : null);
	    if (!home) {
	      throw AWS.util.error(
	        new Error('Cannot load credentials, HOME path not set'));
	    }

	    this.filename = path.join(home, '.aws', 'credentials');
	  }
	});

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)))

/***/ },
/* 90 */
/***/ function(module, exports, __webpack_require__) {

	var AWS = __webpack_require__(8);
	__webpack_require__(91);
	__webpack_require__(92);

	/**
	 * The main configuration class used by all service objects to set
	 * the region, credentials, and other options for requests.
	 *
	 * By default, credentials and region settings are left unconfigured.
	 * This should be configured by the application before using any
	 * AWS service APIs.
	 *
	 * In order to set global configuration options, properties should
	 * be assigned to the global {AWS.config} object.
	 *
	 * @see AWS.config
	 *
	 * @!group General Configuration Options
	 *
	 * @!attribute credentials
	 *   @return [AWS.Credentials] the AWS credentials to sign requests with.
	 *
	 * @!attribute region
	 *   @example Set the global region setting to us-west-2
	 *     AWS.config.update({region: 'us-west-2'});
	 *   @return [AWS.Credentials] The region to send service requests to.
	 *   @see http://docs.amazonwebservices.com/general/latest/gr/rande.html
	 *     A list of available endpoints for each AWS service
	 *
	 * @!attribute maxRetries
	 *   @return [Integer] the maximum amount of retries to perform for a
	 *     service request. By default this value is calculated by the specific
	 *     service object that the request is being made to.
	 *
	 * @!attribute maxRedirects
	 *   @return [Integer] the maximum amount of redirects to follow for a
	 *     service request. Defaults to 10.
	 *
	 * @!attribute paramValidation
	 *   @return [Boolean] whether input parameters should be validated against
	 *     the operation description before sending the request. Defaults to true.
	 *
	 * @!attribute computeChecksums
	 *   @return [Boolean] whether to compute checksums for payload bodies when
	 *     the service accepts it (currently supported in S3 only).
	 *
	 * @!attribute convertResponseTypes
	 *   @return [Boolean] whether types are converted when parsing response data.
	 *     Currently only supported for JSON based services. Turning this off may
	 *     improve performance on large response payloads. Defaults to `true`.
	 *
	 * @!attribute sslEnabled
	 *   @return [Boolean] whether SSL is enabled for requests
	 *
	 * @!attribute s3ForcePathStyle
	 *   @return [Boolean] whether to force path style URLs for S3 objects
	 *
	 * @!attribute s3BucketEndpoint
	 *   @note Setting this configuration option requires an `endpoint` to be
	 *     provided explicitly to the service constructor.
	 *   @return [Boolean] whether the provided endpoint addresses an individual
	 *     bucket (false if it addresses the root API endpoint).
	 *
	 * @!attribute httpOptions
	 *   @return [map] A set of options to pass to the low-level HTTP request.
	 *     Currently supported options are:
	 *
	 *     * **proxy** [String] &mdash; the URL to proxy requests through
	 *     * **agent** [http.Agent, https.Agent] &mdash; the Agent object to perform
	 *       HTTP requests with. Used for connection pooling. Defaults to the global
	 *       agent (`http.globalAgent`) for non-SSL connections. Note that for
	 *       SSL connections, a special Agent object is used in order to enable
	 *       peer certificate verification. This feature is only supported in the
	 *       Node.js environment.
	 *     * **timeout** [Integer] &mdash; The number of milliseconds to wait before
	 *       giving up on a connection attempt. Defaults to two minutes (120000).
	 *     * **xhrAsync** [Boolean] &mdash; Whether the SDK will send asynchronous
	 *       HTTP requests. Used in the browser environment only. Set to false to
	 *       send requests synchronously. Defaults to true (async on).
	 *     * **xhrWithCredentials** [Boolean] &mdash; Sets the "withCredentials"
	 *       property of an XMLHttpRequest object. Used in the browser environment
	 *       only. Defaults to false.
	 * @!attribute logger
	 *   @return [#write,#log] an object that responds to .write() (like a stream)
	 *     or .log() (like the console object) in order to log information about
	 *     requests
	 *
	 * @!attribute systemClockOffset
	 *   @return [Number] an offset value in milliseconds to apply to all signing
	 *     times. Use this to compensate for clock skew when your system may be
	 *     out of sync with the service time. Note that this configuration option
	 *     can only be applied to the global `AWS.config` object and cannot be
	 *     overridden in service-specific configuration. Defaults to 0 milliseconds.
	 *
	 * @!attribute signatureVersion
	 *   @return [String] the signature version to sign requests with (overriding
	 *     the API configuration). Possible values are: 'v2', 'v3', 'v4'.
	 */
	AWS.Config = AWS.util.inherit({
	  /**
	   * @!endgroup
	   */

	  /**
	   * Creates a new configuration object. This is the object that passes
	   * option data along to service requests, including credentials, security,
	   * region information, and some service specific settings.
	   *
	   * @example Creating a new configuration object with credentials and region
	   *   var config = new AWS.Config({
	   *     accessKeyId: 'AKID', secretAccessKey: 'SECRET', region: 'us-west-2'
	   *   });
	   * @option options accessKeyId [String] your AWS access key ID.
	   * @option options secretAccessKey [String] your AWS secret access key.
	   * @option options sessionToken [AWS.Credentials] the optional AWS
	   *   session token to sign requests with.
	   * @option options credentials [AWS.Credentials] the AWS credentials
	   *   to sign requests with. You can either specify this object, or
	   *   specify the accessKeyId and secretAccessKey options directly.
	   * @option options credentialProvider [AWS.CredentialProviderChain] the
	   *   provider chain used to resolve credentials if no static `credentials`
	   *   property is set.
	   * @option options region [String] the region to send service requests to.
	   *   See {region} for more information.
	   * @option options maxRetries [Integer] the maximum amount of retries to
	   *   attempt with a request. See {maxRetries} for more information.
	   * @option options maxRedirects [Integer] the maximum amount of redirects to
	   *   follow with a request. See {maxRedirects} for more information.
	   * @option options sslEnabled [Boolean] whether to enable SSL for
	   *   requests.
	   * @option options paramValidation [Boolean] whether parameter validation
	   *   is on.
	   * @option options computeChecksums [Boolean] whether to compute checksums
	   *   for payload bodies when the service accepts it (currently supported
	   *   in S3 only)
	   * @option options convertResponseTypes [Boolean] whether types are converted
	   *     when parsing response data. Currently only supported for JSON based
	   *     services. Turning this off may improve performance on large response
	   *     payloads. Defaults to `true`.
	   * @option options s3ForcePathStyle [Boolean] whether to force path
	   *   style URLs for S3 objects.
	   * @option options s3BucketEndpoint [Boolean] whether the provided endpoint
	   *   addresses an individual bucket (false if it addresses the root API
	   *   endpoint). Note that setting this configuration option requires an
	   *   `endpoint` to be provided explicitly to the service constructor.
	   * @option options httpOptions [map] A set of options to pass to the low-level
	   *   HTTP request. Currently supported options are:
	   *
	   *   * **proxy** [String] &mdash; the URL to proxy requests through
	   *   * **agent** [http.Agent, https.Agent] &mdash; the Agent object to perform
	   *     HTTP requests with. Used for connection pooling. Defaults to the global
	   *     agent (`http.globalAgent`) for non-SSL connections. Note that for
	   *     SSL connections, a special Agent object is used in order to enable
	   *     peer certificate verification. This feature is only available in the
	   *     Node.js environment.
	   *   * **timeout** [Integer] &mdash; Sets the socket to timeout after timeout
	   *     milliseconds of inactivity on the socket. Defaults to two minutes
	   *     (120000).
	   *   * **xhrAsync** [Boolean] &mdash; Whether the SDK will send asynchronous
	   *     HTTP requests. Used in the browser environment only. Set to false to
	   *     send requests synchronously. Defaults to true (async on).
	   *   * **xhrWithCredentials** [Boolean] &mdash; Sets the "withCredentials"
	   *     property of an XMLHttpRequest object. Used in the browser environment
	   *     only. Defaults to false.
	   * @option options apiVersion [String, Date] a String in YYYY-MM-DD format
	   *   (or a date) that represents the latest possible API version that can be
	   *   used in all services (unless overridden by `apiVersions`). Specify
	   *   'latest' to use the latest possible version.
	   * @option options apiVersions [map<String, String|Date>] a map of service
	   *   identifiers (the lowercase service class name) with the API version to
	   *   use when instantiating a service. Specify 'latest' for each individual
	   *   that can use the latest available version.
	   * @option options logger [#write,#log] an object that responds to .write()
	   *   (like a stream) or .log() (like the console object) in order to log
	   *   information about requests
	   * @option options systemClockOffset [Number] an offset value in milliseconds
	   *   to apply to all signing times. Use this to compensate for clock skew
	   *   when your system may be out of sync with the service time. Note that
	   *   this configuration option can only be applied to the global `AWS.config`
	   *   object and cannot be overridden in service-specific configuration.
	   *   Defaults to 0 milliseconds.
	   * @option options signatureVersion [String] the signature version to sign
	   *   requests with (overriding the API configuration). Possible values are:
	   *   'v2', 'v3', 'v4'.
	   */
	  constructor: function Config(options) {
	    if (options === undefined) options = {};
	    options = this.extractCredentials(options);

	    AWS.util.each.call(this, this.keys, function (key, value) {
	      this.set(key, options[key], value);
	    });
	  },

	  /**
	   * @!group Managing Credentials
	   */

	  /**
	   * Loads credentials from the configuration object. This is used internally
	   * by the SDK to ensure that refreshable {Credentials} objects are properly
	   * refreshed and loaded when sending a request. If you want to ensure that
	   * your credentials are loaded prior to a request, you can use this method
	   * directly to provide accurate credential data stored in the object.
	   *
	   * @note If you configure the SDK with static or environment credentials,
	   *   the credential data should already be present in {credentials} attribute.
	   *   This method is primarily necessary to load credentials from asynchronous
	   *   sources, or sources that can refresh credentials periodically.
	   * @example Getting your access key
	   *   AWS.config.getCredentials(function(err) {
	   *     if (err) console.log(err.stack); // credentials not loaded
	   *     else console.log("Access Key:", AWS.config.credentials.accessKeyId);
	   *   })
	   * @callback callback function(err)
	   *   Called when the {credentials} have been properly set on the configuration
	   *   object.
	   *
	   *   @param err [Error] if this is set, credentials were not successfuly
	   *     loaded and this error provides information why.
	   * @see credentials
	   * @see Credentials
	   */
	  getCredentials: function getCredentials(callback) {
	    var self = this;

	    function finish(err) {
	      callback(err, err ? null : self.credentials);
	    }

	    function credError(msg, err) {
	      return new AWS.util.error(err || new Error(), {
	        code: 'CredentialsError', message: msg
	      });
	    }

	    function getAsyncCredentials() {
	      self.credentials.get(function(err) {
	        if (err) {
	          var msg = 'Could not load credentials from ' +
	            self.credentials.constructor.name;
	          err = credError(msg, err);
	        }
	        finish(err);
	      });
	    }

	    function getStaticCredentials() {
	      var err = null;
	      if (!self.credentials.accessKeyId || !self.credentials.secretAccessKey) {
	        err = credError('Missing credentials');
	      }
	      finish(err);
	    }

	    if (self.credentials) {
	      if (typeof self.credentials.get === 'function') {
	        getAsyncCredentials();
	      } else { // static credentials
	        getStaticCredentials();
	      }
	    } else if (self.credentialProvider) {
	      self.credentialProvider.resolve(function(err, creds) {
	        if (err) {
	          err = credError('Could not load credentials from any providers', err);
	        }
	        self.credentials = creds;
	        finish(err);
	      });
	    } else {
	      finish(credError('No credentials to load'));
	    }
	  },

	  /**
	   * @!group Loading and Setting Configuration Options
	   */

	  /**
	   * @overload update(options, allowUnknownKeys = false)
	   *   Updates the current configuration object with new options.
	   *
	   *   @example Update maxRetries property of a configuration object
	   *     config.update({maxRetries: 10});
	   *   @param [Object] options a map of option keys and values.
	   *   @param [Boolean] allowUnknownKeys whether unknown keys can be set on
	   *     the configuration object. Defaults to `false`.
	   *   @see constructor
	   */
	  update: function update(options, allowUnknownKeys) {
	    allowUnknownKeys = allowUnknownKeys || false;
	    options = this.extractCredentials(options);
	    AWS.util.each.call(this, options, function (key, value) {
	      if (allowUnknownKeys || this.keys.hasOwnProperty(key) ||
	          AWS.Service.hasService(key)) {
	        this.set(key, value);
	      }
	    });
	  },

	  /**
	   * Loads configuration data from a JSON file into this config object.
	   * @note Loading configuration will reset all existing configuration
	   *   on the object.
	   * @!macro nobrowser
	   * @param path [String] the path to load configuration from
	   * @return [AWS.Config] the same configuration object
	   */
	  loadFromPath: function loadFromPath(path) {
	    this.clear();

	    var options = JSON.parse(AWS.util.readFileSync(path));
	    var fileSystemCreds = new AWS.FileSystemCredentials(path);
	    var chain = new AWS.CredentialProviderChain();
	    chain.providers.unshift(fileSystemCreds);
	    chain.resolve(function (err, creds) {
	      if (err) throw err;
	      else options.credentials = creds;
	    });

	    this.constructor(options);

	    return this;
	  },

	  /**
	   * Clears configuration data on this object
	   *
	   * @api private
	   */
	  clear: function clear() {
	    /*jshint forin:false */
	    AWS.util.each.call(this, this.keys, function (key) {
	      delete this[key];
	    });

	    // reset credential provider
	    this.set('credentials', undefined);
	    this.set('credentialProvider', undefined);
	  },

	  /**
	   * Sets a property on the configuration object, allowing for a
	   * default value
	   * @api private
	   */
	  set: function set(property, value, defaultValue) {
	    if (value === undefined) {
	      if (defaultValue === undefined) {
	        defaultValue = this.keys[property];
	      }
	      if (typeof defaultValue === 'function') {
	        this[property] = defaultValue.call(this);
	      } else {
	        this[property] = defaultValue;
	      }
	    } else if (property === 'httpOptions' && this[property]) {
	      // deep merge httpOptions
	      this[property] = AWS.util.merge(this[property], value);
	    } else {
	      this[property] = value;
	    }
	  },

	  /**
	   * All of the keys with their default values.
	   *
	   * @constant
	   * @api private
	   */
	  keys: {
	    credentials: null,
	    credentialProvider: null,
	    region: null,
	    logger: null,
	    apiVersions: {},
	    apiVersion: null,
	    endpoint: undefined,
	    httpOptions: {
	      timeout: 120000
	    },
	    maxRetries: undefined,
	    maxRedirects: 10,
	    paramValidation: true,
	    sslEnabled: true,
	    s3ForcePathStyle: false,
	    s3BucketEndpoint: false,
	    computeChecksums: true,
	    convertResponseTypes: true,
	    dynamoDbCrc32: true,
	    systemClockOffset: 0,
	    signatureVersion: null
	  },

	  /**
	   * Extracts accessKeyId, secretAccessKey and sessionToken
	   * from a configuration hash.
	   *
	   * @api private
	   */
	  extractCredentials: function extractCredentials(options) {
	    if (options.accessKeyId && options.secretAccessKey) {
	      options = AWS.util.copy(options);
	      options.credentials = new AWS.Credentials(options);
	    }
	    return options;
	  }
	});

	/**
	 * @return [AWS.Config] The global configuration object singleton instance
	 * @readonly
	 * @see AWS.Config
	 */
	AWS.config = new AWS.Config();


/***/ },
/* 91 */
/***/ function(module, exports, __webpack_require__) {

	var AWS = __webpack_require__(8);

	/**
	 * Represents your AWS security credentials, specifically the
	 * {accessKeyId}, {secretAccessKey}, and optional {sessionToken}.
	 * Creating a `Credentials` object allows you to pass around your
	 * security information to configuration and service objects.
	 *
	 * Note that this class typically does not need to be constructed manually,
	 * as the {AWS.Config} and {AWS.Service} classes both accept simple
	 * options hashes with the three keys. These structures will be converted
	 * into Credentials objects automatically.
	 *
	 * ## Expiring and Refreshing Credentials
	 *
	 * Occasionally credentials can expire in the middle of a long-running
	 * application. In this case, the SDK will automatically attempt to
	 * refresh the credentials from the storage location if the Credentials
	 * class implements the {refresh} method.
	 *
	 * If you are implementing a credential storage location, you
	 * will want to create a subclass of the `Credentials` class and
	 * override the {refresh} method. This method allows credentials to be
	 * retrieved from the backing store, be it a file system, database, or
	 * some network storage. The method should reset the credential attributes
	 * on the object.
	 *
	 * @!attribute expired
	 *   @return [Boolean] whether the credentials have been expired and
	 *     require a refresh. Used in conjunction with {expireTime}.
	 * @!attribute expireTime
	 *   @return [Date] a time when credentials should be considered expired. Used
	 *     in conjunction with {expired}.
	 * @!attribute accessKeyId
	 *   @return [String] the AWS access key ID
	 * @!attribute secretAccessKey
	 *   @return [String] the AWS secret access key
	 * @!attribute sessionToken
	 *   @return [String] an optional AWS session token
	 */
	AWS.Credentials = AWS.util.inherit({
	  /**
	   * A credentials object can be created using positional arguments or an options
	   * hash.
	   *
	   * @overload AWS.Credentials(accessKeyId, secretAccessKey, sessionToken=null)
	   *   Creates a Credentials object with a given set of credential information
	   *   as positional arguments.
	   *   @param accessKeyId [String] the AWS access key ID
	   *   @param secretAccessKey [String] the AWS secret access key
	   *   @param sessionToken [String] the optional AWS session token
	   *   @example Create a credentials object with AWS credentials
	   *     var creds = new AWS.Credentials('akid', 'secret', 'session');
	   * @overload AWS.Credentials(options)
	   *   Creates a Credentials object with a given set of credential information
	   *   as an options hash.
	   *   @option options accessKeyId [String] the AWS access key ID
	   *   @option options secretAccessKey [String] the AWS secret access key
	   *   @option options sessionToken [String] the optional AWS session token
	   *   @example Create a credentials object with AWS credentials
	   *     var creds = new AWS.Credentials({
	   *       accessKeyId: 'akid', secretAccessKey: 'secret', sessionToken: 'session'
	   *     });
	   */
	  constructor: function Credentials() {
	    // hide secretAccessKey from being displayed with util.inspect
	    AWS.util.hideProperties(this, ['secretAccessKey']);

	    this.expired = false;
	    this.expireTime = null;
	    if (arguments.length === 1 && typeof arguments[0] === 'object') {
	      var creds = arguments[0].credentials || arguments[0];
	      this.accessKeyId = creds.accessKeyId;
	      this.secretAccessKey = creds.secretAccessKey;
	      this.sessionToken = creds.sessionToken;
	    } else {
	      this.accessKeyId = arguments[0];
	      this.secretAccessKey = arguments[1];
	      this.sessionToken = arguments[2];
	    }
	  },

	  /**
	   * @return [Integer] the window size in seconds to attempt refreshhing of
	   *   credentials before the expireTime occurs.
	   */
	  expiryWindow: 15,

	  /**
	   * @return [Boolean] whether the credentials object should call {refresh}
	   * @note Subclasses should override this method to provide custom refresh
	   *   logic.
	   */
	  needsRefresh: function needsRefresh() {
	    var currentTime = AWS.util.date.getDate().getTime();
	    var adjustedTime = new Date(currentTime + this.expiryWindow * 1000);

	    if (this.expireTime && adjustedTime > this.expireTime) {
	      return true;
	    } else {
	      return this.expired || !this.accessKeyId || !this.secretAccessKey;
	    }
	  },

	  /**
	   * Gets the existing credentials, refreshing them if they are not yet loaded
	   * or have expired. Users should call this method before using {refresh},
	   * as this will not attempt to reload credentials when they are already
	   * loaded into the object.
	   *
	   * @callback callback function(err)
	   *   Called when the instance metadata service responds (or fails). When
	   *   this callback is called with no error, it means that the credentials
	   *   information has been loaded into the object (as the `accessKeyId`,
	   *   `secretAccessKey`, and `sessionToken` properties).
	   *   @param err [Error] if an error occurred, this value will be filled
	   */
	  get: function get(callback) {
	    var self = this;
	    if (this.needsRefresh()) {
	      this.refresh(function(err) {
	        if (!err) self.expired = false; // reset expired flag
	        if (callback) callback(err);
	      });
	    } else if (callback) {
	      callback();
	    }
	  },

	  /**
	   * Refreshes the credentials. Users should call {get} before attempting
	   * to forcibly refresh credentials.
	   *
	   * @callback callback function(err)
	   *   Called when the instance metadata service responds (or fails). When
	   *   this callback is called with no error, it means that the credentials
	   *   information has been loaded into the object (as the `accessKeyId`,
	   *   `secretAccessKey`, and `sessionToken` properties).
	   *   @param err [Error] if an error occurred, this value will be filled
	   * @note Subclasses should override this class to reset the
	   *   {accessKeyId}, {secretAccessKey} and optional {sessionToken}
	   *   on the credentials object and then call the callback with
	   *   any error information.
	   * @see get
	   */
	  refresh: function refresh(callback) {
	    this.expired = false;
	    callback();
	  }
	});


/***/ },
/* 92 */
/***/ function(module, exports, __webpack_require__) {

	var AWS = __webpack_require__(8);

	/**
	 * Creates a credential provider chain that searches for AWS credentials
	 * in a list of credential providers specified by the {providers} property.
	 *
	 * By default, the chain will use the {defaultProviders} to resolve credentials.
	 * These providers will look in the environment using the
	 * {AWS.EnvironmentCredentials} class with the 'AWS' and 'AMAZON' prefixes.
	 *
	 * ## Setting Providers
	 *
	 * Each provider in the {providers} list should be a function that returns
	 * a {AWS.Credentials} object, or a hardcoded credentials object. The function
	 * form allows for delayed execution of the credential construction.
	 *
	 * ## Resolving Credentials from a Chain
	 *
	 * Call {resolve} to return the first valid credential object that can be
	 * loaded by the provider chain.
	 *
	 * For example, to resolve a chain with a custom provider that checks a file
	 * on disk after the set of {defaultProviders}:
	 *
	 * ```javascript
	 * var diskProvider = new AWS.FileSystemCredentials('./creds.json');
	 * var chain = new AWS.CredentialProviderChain();
	 * chain.providers.push(diskProvider);
	 * chain.resolve();
	 * ```
	 *
	 * The above code will return the `diskProvider` object if the
	 * file contains credentials and the `defaultProviders` do not contain
	 * any credential settings.
	 *
	 * @!attribute providers
	 *   @return [Array<AWS.Credentials, Function>]
	 *     a list of credentials objects or functions that return credentials
	 *     objects. If the provider is a function, the function will be
	 *     executed lazily when the provider needs to be checked for valid
	 *     credentials. By default, this object will be set to the
	 *     {defaultProviders}.
	 *   @see defaultProviders
	 */
	AWS.CredentialProviderChain = AWS.util.inherit(AWS.Credentials, {

	  /**
	   * Creates a new CredentialProviderChain with a default set of providers
	   * specified by {defaultProviders}.
	   */
	  constructor: function CredentialProviderChain(providers) {
	    if (providers) {
	      this.providers = providers;
	    } else {
	      this.providers = AWS.CredentialProviderChain.defaultProviders.slice(0);
	    }
	  },

	  /**
	   * Resolves the provider chain by searching for the first set of
	   * credentials in {providers}.
	   *
	   * @callback callback function(err, credentials)
	   *   Called when the provider resolves the chain to a credentials object
	   *   or null if no credentials can be found.
	   *
	   *   @param err [Error] the error object returned if no credentials are
	   *     found.
	   *   @param credentials [AWS.Credentials] the credentials object resolved
	   *     by the provider chain.
	   * @return [AWS.CredentialProviderChain] the provider, for chaining.
	   */
	  resolve: function resolve(callback) {
	    if (this.providers.length === 0) {
	      callback(new Error('No providers'));
	      return this;
	    }

	    var index = 0;
	    var providers = this.providers.slice(0);

	    function resolveNext(err, creds) {
	      if ((!err && creds) || index === providers.length) {
	        callback(err, creds);
	        return;
	      }

	      var provider = providers[index++];
	      if (typeof provider === 'function') {
	        creds = provider.call();
	      } else {
	        creds = provider;
	      }

	      if (creds.get) {
	        creds.get(function(err) {
	          resolveNext(err, err ? null : creds);
	        });
	      } else {
	        resolveNext(null, creds);
	      }
	    }

	    resolveNext();
	    return this;
	  }

	});

	/**
	 * The default set of providers used by a vanilla CredentialProviderChain.
	 */
	AWS.CredentialProviderChain.defaultProviders = [];


/***/ },
/* 93 */
/***/ function(module, exports, __webpack_require__) {

	var AWS = __webpack_require__(8);

	/**
	 * Represents credentials retrieved from STS Web Identity Federation using
	 * the Amazon Cognito Identity service.
	 *
	 * By default this provider gets credentials using the
	 * {AWS.STS.assumeRoleWithWebIdentity} service operation, after first getting
	 * an Open ID token from {AWS.CognitoIdentity.getOpenIdToken}. These operations
	 * require an `AccountId` (AWS account ID), `IdentityPoolId` (Amazon Cognito
	 * Identity Pool ID), and `RoleArn` containing the ARN of the IAM trust policy
	 * for the Amazon Cognito role that the user will log into. In addition, if
	 * this credential provider is used to provide authenticated login, the
	 * `Logins` map may be set to the tokens provided by the respective identity
	 * providers. See {constructor} for an example on creating a credentials
	 * object with proper property values.
	 *
	 * ## Refreshing Credentials from Identity Service
	 *
	 * In addition to AWS credentials expiring after a given amount of time, the
	 * login token from the identity provider will also expire. Once this token
	 * expires, it will not be usable to refresh AWS credentials, and another
	 * token will be needed. The SDK does not manage refreshing of the token value,
	 * but this can be done through a "refresh token" supported by most identity
	 * providers. Consult the documentation for the identity provider for refreshing
	 * tokens. Once the refreshed token is acquired, you should make sure to update
	 * this new token in the credentials object's {params} property. The following
	 * code will update the WebIdentityToken, assuming you have retrieved an updated
	 * token from the identity provider:
	 *
	 * ```javascript
	 * AWS.config.credentials.params.Logins['graph.facebook.com'] = updatedToken;
	 * ```
	 *
	 * Future calls to `credentials.refresh()` will now use the new token.
	 *
	 * @!attribute params
	 *   @return [map] the map of params passed to
	 *     {AWS.CognitoIdentity.getOpenIdToken} and
	 *     {AWS.STS.assumeRoleWithWebIdentity}. To update the token, set the
	 *     `params.WebIdentityToken` property.
	 * @!attribute data
	 *   @return [map] the raw data response from the call to
	 *     {AWS.STS.assumeRoleWithWebIdentity}. Use this if you want to get
	 *     access to other properties from the response.
	 * @!attribute identityId
	 *   @return [String] the Cognito ID returned by the last call to
	 *     {AWS.CognitoIdentity.getOpenIdToken}. This ID represents the actual
	 *     final resolved identity ID from Amazon Cognito.
	 */
	AWS.CognitoIdentityCredentials = AWS.util.inherit(AWS.Credentials, {
	  /**
	   * @api private
	   */
	  localStorageKey: {
	    id: 'aws.cognito.identity-id.',
	    providers: 'aws.cognito.identity-providers.'
	  },

	  /**
	   * Creates a new credentials object.
	   * @param (see AWS.STS.assumeRoleWithWebIdentity)
	   * @param (see AWS.CognitoIdentity.getOpenIdToken)
	   * @example Creating a new credentials object
	   *   AWS.config.credentials = new AWS.CognitoIdentityCredentials({
	   *     AccountId: '1234567890',
	   *     IdentityPoolId: 'us-east-1:1699ebc0-7900-4099-b910-2df94f52a030',
	   *     RoleArn: 'arn:aws:iam::1234567890:role/MYAPP-CognitoIdentity',
	   *     Logins: { // optional tokens, used for authenticated login
	   *       'graph.facebook.com': 'FBTOKEN',
	   *       'www.amazon.com': 'AMAZONTOKEN',
	   *       'accounts.google.com': 'GOOGLETOKEN'
	   *     },
	   *     RoleSessionName: 'web' // optional name, defaults to web-identity
	   *   });
	   * @see AWS.STS.assumeRoleWithWebIdentity
	   */
	  constructor: function CognitoIdentityCredentials(params) {
	    AWS.Credentials.call(this);
	    this.expired = true;
	    this.webIdentityCredentials = new AWS.WebIdentityCredentials(params);
	    this.cognito = new AWS.CognitoIdentity({params: params});
	    this.sts = new AWS.STS();
	    this.params = params;
	    this.data = null;
	    this.identityId = null;
	    this.loadCachedId();
	  },

	  /**
	   * Refreshes credentials using {AWS.STS.assumeRoleWithWebIdentity}
	   *
	   * @callback callback function(err)
	   *   Called when the STS service responds (or fails). When
	   *   this callback is called with no error, it means that the credentials
	   *   information has been loaded into the object (as the `accessKeyId`,
	   *   `secretAccessKey`, and `sessionToken` properties).
	   *   @param err [Error] if an error occurred, this value will be filled
	   * @see get
	   */
	  refresh: function refresh(callback) {
	    var self = this;
	    self.data = null;
	    self.identityId = null;
	    self.getId(function(err) {
	      if (!err) {
	        self.cognito.getOpenIdToken(function(cogErr, data) {
	          if (!cogErr) {
	            self.cacheId(data);
	            self.params.WebIdentityToken = data.Token;
	            self.webIdentityCredentials.refresh(function(webErr) {
	              if (!webErr) {
	                self.data = self.webIdentityCredentials.data;
	                self.sts.credentialsFrom(self.data, self);
	              } else {
	                self.clearCachedId();
	              }
	              callback(webErr);
	            });
	          } else {
	            self.clearCachedId();
	            callback(cogErr);
	          }
	        });
	      } else {
	        self.clearCachedId();
	        callback(err);
	      }
	    });
	  },

	  /**
	   * Clears the cached Cognito ID associated with the currently configured
	   * identity pool ID. Use this to manually invalidate your cache if
	   * the identity pool ID was deleted.
	   */
	  clearCachedId: function clearCache() {
	    var poolId = this.params.IdentityPoolId;
	    delete this.storage[this.localStorageKey.id + poolId];
	    delete this.storage[this.localStorageKey.providers + poolId];
	  },

	  /**
	   * Retrieves a Cognito ID, loading from cache if it was already retrieved
	   * on this device.
	   *
	   * @callback callback function(err, identityId)
	   *   @param err [Error, null] an error object if the call failed or null if
	   *     it succeeded.
	   *   @param identityId [String, null] if successful, the callback will return
	   *     the Cognito ID.
	   * @note If not loaded explicitly, the Cognito ID is loaded and stored in
	   *   localStorage in the browser environment of a device.
	   * @api private
	   */
	  getId: function getId(callback) {
	    var self = this;
	    if (typeof self.params.IdentityId === 'string') {
	      return callback(null, self.params.IdentityId);
	    }

	    self.cognito.getId(function(err, data) {
	      if (!err && data.IdentityId) {
	        self.params.IdentityId = data.IdentityId;
	        callback(null, data.IdentityId);
	      } else {
	        callback(err);
	      }
	    });
	  },

	  /**
	   * @api private
	   */
	  loadCachedId: function loadCachedId() {
	    var self = this;

	    // in the browser we source default IdentityId from localStorage
	    if (AWS.util.isBrowser() && !self.params.IdentityId) {
	      var id = self.getStorage('id');
	      if (id && self.params.Logins) {
	        var actualProviders = Object.keys(self.params.Logins);
	        var cachedProviders =
	          (self.getStorage('providers') || '').split(',');

	        // only load ID if at least one provider used this ID before
	        var intersect = cachedProviders.filter(function(n) {
	          return actualProviders.indexOf(n) !== -1;
	        });
	        if (intersect.length !== 0) {
	          self.params.IdentityId = id;
	        }
	      } else if (id) {
	        self.params.IdentityId = id;
	      }
	    }
	  },

	  /**
	   * @api private
	   */
	  cacheId: function cacheId(data) {
	    this.identityId = data.IdentityId;
	    this.params.IdentityId = this.identityId;

	    // cache this IdentityId in browser localStorage if possible
	    if (AWS.util.isBrowser()) {
	      this.setStorage('id', data.IdentityId);

	      if (this.params.Logins) {
	        this.setStorage('providers', Object.keys(this.params.Logins).join(','));
	      }
	    }
	  },

	  /**
	   * @api private
	   */
	  getStorage: function getStorage(key) {
	    return this.storage[this.localStorageKey[key] + this.params.IdentityPoolId];
	  },

	  /**
	   * @api private
	   */
	  setStorage: function setStorage(key, val) {
	    this.storage[this.localStorageKey[key] + this.params.IdentityPoolId] = val;
	  },

	  /**
	   * @api private
	   */
	  storage: (function() {
	    try {
	      return AWS.util.isBrowser() && typeof window.localStorage === 'object' ?
	             window.localStorage : {};
	    } catch (_) {
	      return {};
	    }
	  })()
	});


/***/ },
/* 94 */
/***/ function(module, exports, __webpack_require__) {

	var AWS = __webpack_require__(8);

	/**
	 * Represents credentials retrieved from STS SAML support.
	 *
	 * By default this provider gets credentials using the
	 * {AWS.STS.assumeRoleWithSAML} service operation. This operation
	 * requires a `RoleArn` containing the ARN of the IAM trust policy for the
	 * application for which credentials will be given, as well as a `PrincipalArn`
	 * representing the ARN for the SAML identity provider. In addition, the
	 * `SAMLAssertion` must be set to the token provided by the identity
	 * provider. See {constructor} for an example on creating a credentials
	 * object with proper `RoleArn`, `PrincipalArn`, and `SAMLAssertion` values.
	 *
	 * ## Refreshing Credentials from Identity Service
	 *
	 * In addition to AWS credentials expiring after a given amount of time, the
	 * login token from the identity provider will also expire. Once this token
	 * expires, it will not be usable to refresh AWS credentials, and another
	 * token will be needed. The SDK does not manage refreshing of the token value,
	 * but this can be done through a "refresh token" supported by most identity
	 * providers. Consult the documentation for the identity provider for refreshing
	 * tokens. Once the refreshed token is acquired, you should make sure to update
	 * this new token in the credentials object's {params} property. The following
	 * code will update the SAMLAssertion, assuming you have retrieved an updated
	 * token from the identity provider:
	 *
	 * ```javascript
	 * AWS.config.credentials.params.SAMLAssertion = updatedToken;
	 * ```
	 *
	 * Future calls to `credentials.refresh()` will now use the new token.
	 *
	 * @!attribute params
	 *   @return [map] the map of params passed to
	 *     {AWS.STS.assumeRoleWithSAML}. To update the token, set the
	 *     `params.SAMLAssertion` property.
	 */
	AWS.SAMLCredentials = AWS.util.inherit(AWS.Credentials, {
	  /**
	   * Creates a new credentials object.
	   * @param (see AWS.STS.assumeRoleWithSAML)
	   * @example Creating a new credentials object
	   *   AWS.config.credentials = new AWS.SAMLCredentials({
	   *     RoleArn: 'arn:aws:iam::1234567890:role/SAMLRole',
	   *     PrincipalArn: 'arn:aws:iam::1234567890:role/SAMLPrincipal',
	   *     SAMLAssertion: 'base64-token', // base64-encoded token from IdP
	   *   });
	   * @see AWS.STS.assumeRoleWithSAML
	   */
	  constructor: function SAMLCredentials(params) {
	    AWS.Credentials.call(this);
	    this.expired = true;
	    this.params = params;
	    this.service = new AWS.STS({params: this.params});
	  },

	  /**
	   * Refreshes credentials using {AWS.STS.assumeRoleWithSAML}
	   *
	   * @callback callback function(err)
	   *   Called when the STS service responds (or fails). When
	   *   this callback is called with no error, it means that the credentials
	   *   information has been loaded into the object (as the `accessKeyId`,
	   *   `secretAccessKey`, and `sessionToken` properties).
	   *   @param err [Error] if an error occurred, this value will be filled
	   * @see get
	   */
	  refresh: function refresh(callback) {
	    var self = this;
	    if (!callback) callback = function(err) { if (err) throw err; };

	    self.service.assumeRoleWithSAML(function (err, data) {
	      if (!err) {
	        self.service.credentialsFrom(data, self);
	      }
	      callback(err);
	    });
	  }
	});


/***/ },
/* 95 */
/***/ function(module, exports, __webpack_require__) {

	var AWS = __webpack_require__(8);

	/**
	 * Represents temporary credentials retrieved from {AWS.STS}. Without any
	 * extra parameters, credentials will be fetched from the
	 * {AWS.STS.getSessionToken} operation. If an IAM role is provided, the
	 * {AWS.STS.assumeRole} operation will be used to fetch credentials for the
	 * role instead.
	 *
	 * To setup temporary credentials, configure a set of master credentials
	 * using the standard credentials providers (environment, EC2 instance metadata,
	 * or from the filesystem), then set the global credentials to a new
	 * temporary credentials object:
	 *
	 * ```javascript
	 * // Note that environment credentials are loaded by default,
	 * // the following line is shown for clarity:
	 * AWS.config.credentials = new AWS.EnvironmentCredentials('AWS');
	 *
	 * // Now set temporary credentials seeded from the master credentials
	 * AWS.config.credentials = new AWS.TemporaryCredentials();
	 *
	 * // subsequent requests will now use temporary credentials from AWS STS.
	 * new AWS.S3().listBucket(function(err, data) { ... });
	 * ```
	 *
	 * @!attribute masterCredentials
	 *   @return [AWS.Credentials] the master (non-temporary) credentials used to
	 *     get and refresh temporary credentials from AWS STS.
	 * @note (see constructor)
	 */
	AWS.TemporaryCredentials = AWS.util.inherit(AWS.Credentials, {
	  /**
	   * Creates a new temporary credentials object.
	   *
	   * @note In order to create temporary credentials, you first need to have
	   *   "master" credentials configured in {AWS.Config.credentials}. These
	   *   master credentials are necessary to retrieve the temporary credentials,
	   *   as well as refresh the credentials when they expire.
	   * @param params [map] a map of options that are passed to the
	   *   {AWS.STS.assumeRole} or {AWS.STS.getSessionToken} operations.
	   *   If a `RoleArn` parameter is passed in, credentials will be based on the
	   *   IAM role.
	   * @example Creating a new credenials object for generic temporary credentials
	   *   AWS.config.credentials = new AWS.TemporaryCredentials();
	   * @example Creating a new credentials object for an IAM role
	   *   AWS.config.credentials = new AWS.TemporaryCredentials({
	   *     RoleArn: 'arn:aws:iam::1234567890:role/TemporaryCredentials',
	   *   });
	   * @see AWS.STS.assumeRole
	   * @see AWS.STS.getSessionToken
	   */
	  constructor: function TemporaryCredentials(params) {
	    AWS.Credentials.call(this);
	    this.loadMasterCredentials();
	    this.expired = true;

	    this.params = params || {};
	    if (this.params.RoleArn) {
	      this.params.RoleSessionName =
	        this.params.RoleSessionName || 'temporary-credentials';
	    }
	    this.service = new AWS.STS({params: this.params});
	  },

	  /**
	   * Refreshes credentials using {AWS.STS.assumeRole} or
	   * {AWS.STS.getSessionToken}, depending on whether an IAM role ARN was passed
	   * to the credentials {constructor}.
	   *
	   * @callback callback function(err)
	   *   Called when the STS service responds (or fails). When
	   *   this callback is called with no error, it means that the credentials
	   *   information has been loaded into the object (as the `accessKeyId`,
	   *   `secretAccessKey`, and `sessionToken` properties).
	   *   @param err [Error] if an error occurred, this value will be filled
	   * @see get
	   */
	  refresh: function refresh(callback) {
	    var self = this;
	    if (!callback) callback = function(err) { if (err) throw err; };

	    self.service.config.credentials = self.masterCredentials;
	    var operation = self.params.RoleArn ?
	      self.service.assumeRole : self.service.getSessionToken;
	    operation.call(self.service, function (err, data) {
	      if (!err) {
	        self.service.credentialsFrom(data, self);
	      }
	      callback(err);
	    });
	  },

	  /**
	   * @api private
	   */
	  loadMasterCredentials: function loadMasterCredentials() {
	    this.masterCredentials = AWS.config.credentials;
	    while (this.masterCredentials.masterCredentials) {
	      this.masterCredentials = this.masterCredentials.masterCredentials;
	    }
	  }
	});


/***/ },
/* 96 */
/***/ function(module, exports, __webpack_require__) {

	var AWS = __webpack_require__(8);

	/**
	 * Represents credentials retrieved from STS Web Identity Federation support.
	 *
	 * By default this provider gets credentials using the
	 * {AWS.STS.assumeRoleWithWebIdentity} service operation. This operation
	 * requires a `RoleArn` containing the ARN of the IAM trust policy for the
	 * application for which credentials will be given. In addition, the
	 * `WebIdentityToken` must be set to the token provided by the identity
	 * provider. See {constructor} for an example on creating a credentials
	 * object with proper `RoleArn` and `WebIdentityToken` values.
	 *
	 * ## Refreshing Credentials from Identity Service
	 *
	 * In addition to AWS credentials expiring after a given amount of time, the
	 * login token from the identity provider will also expire. Once this token
	 * expires, it will not be usable to refresh AWS credentials, and another
	 * token will be needed. The SDK does not manage refreshing of the token value,
	 * but this can be done through a "refresh token" supported by most identity
	 * providers. Consult the documentation for the identity provider for refreshing
	 * tokens. Once the refreshed token is acquired, you should make sure to update
	 * this new token in the credentials object's {params} property. The following
	 * code will update the WebIdentityToken, assuming you have retrieved an updated
	 * token from the identity provider:
	 *
	 * ```javascript
	 * AWS.config.credentials.params.WebIdentityToken = updatedToken;
	 * ```
	 *
	 * Future calls to `credentials.refresh()` will now use the new token.
	 *
	 * @!attribute params
	 *   @return [map] the map of params passed to
	 *     {AWS.STS.assumeRoleWithWebIdentity}. To update the token, set the
	 *     `params.WebIdentityToken` property.
	 * @!attribute data
	 *   @return [map] the raw data response from the call to
	 *     {AWS.STS.assumeRoleWithWebIdentity}. Use this if you want to get
	 *     access to other properties from the response.
	 */
	AWS.WebIdentityCredentials = AWS.util.inherit(AWS.Credentials, {
	  /**
	   * Creates a new credentials object.
	   * @param (see AWS.STS.assumeRoleWithWebIdentity)
	   * @example Creating a new credentials object
	   *   AWS.config.credentials = new AWS.WebIdentityCredentials({
	   *     RoleArn: 'arn:aws:iam::1234567890:role/WebIdentity',
	   *     WebIdentityToken: 'ABCDEFGHIJKLMNOP', // token from identity service
	   *     RoleSessionName: 'web' // optional name, defaults to web-identity
	   *   });
	   * @see AWS.STS.assumeRoleWithWebIdentity
	   */
	  constructor: function WebIdentityCredentials(params) {
	    AWS.Credentials.call(this);
	    this.expired = true;
	    this.params = params;
	    this.params.RoleSessionName = this.params.RoleSessionName || 'web-identity';
	    this.service = new AWS.STS({params: this.params});
	    this.data = null;
	  },

	  /**
	   * Refreshes credentials using {AWS.STS.assumeRoleWithWebIdentity}
	   *
	   * @callback callback function(err)
	   *   Called when the STS service responds (or fails). When
	   *   this callback is called with no error, it means that the credentials
	   *   information has been loaded into the object (as the `accessKeyId`,
	   *   `secretAccessKey`, and `sessionToken` properties).
	   *   @param err [Error] if an error occurred, this value will be filled
	   * @see get
	   */
	  refresh: function refresh(callback) {
	    var self = this;
	    if (!callback) callback = function(err) { if (err) throw err; };

	    self.service.assumeRoleWithWebIdentity(function (err, data) {
	      self.data = null;
	      if (!err) {
	        self.data = data;
	        self.service.credentialsFrom(data, self);
	      }
	      callback(err);
	    });
	  }
	});


/***/ },
/* 97 */
/***/ function(module, exports, __webpack_require__) {

	var AWS = __webpack_require__(8);
	var SequentialExecutor = __webpack_require__(98);

	/**
	 * The namespace used to register global event listeners for request building
	 * and sending.
	 */
	AWS.EventListeners = {
	  /**
	   * @!attribute VALIDATE_CREDENTIALS
	   *   A request listener that validates whether the request is being
	   *   sent with credentials.
	   *   Handles the {AWS.Request~validate 'validate' Request event}
	   *   @example Sending a request without validating credentials
	   *     var listener = AWS.EventListeners.Core.VALIDATE_CREDENTIALS;
	   *     request.removeListener('validate', listener);
	   *   @readonly
	   *   @return [Function]
	   * @!attribute VALIDATE_REGION
	   *   A request listener that validates whether the region is set
	   *   for a request.
	   *   Handles the {AWS.Request~validate 'validate' Request event}
	   *   @example Sending a request without validating region configuration
	   *     var listener = AWS.EventListeners.Core.VALIDATE_REGION;
	   *     request.removeListener('validate', listener);
	   *   @readonly
	   *   @return [Function]
	   * @!attribute VALIDATE_PARAMETERS
	   *   A request listener that validates input parameters in a request.
	   *   Handles the {AWS.Request~validate 'validate' Request event}
	   *   @example Sending a request without validating parameters
	   *     var listener = AWS.EventListeners.Core.VALIDATE_PARAMETERS;
	   *     request.removeListener('validate', listener);
	   *   @example Disable parameter validation globally
	   *     AWS.EventListeners.Core.removeListener('validate',
	   *       AWS.EventListeners.Core.VALIDATE_REGION);
	   *   @readonly
	   *   @return [Function]
	   * @!attribute SEND
	   *   A request listener that initiates the HTTP connection for a
	   *   request being sent. Handles the {AWS.Request~send 'send' Request event}
	   *   @example Replacing the HTTP handler
	   *     var listener = AWS.EventListeners.Core.SEND;
	   *     request.removeListener('send', listener);
	   *     request.on('send', function(response) {
	   *       customHandler.send(response);
	   *     });
	   *   @return [Function]
	   *   @readonly
	   * @!attribute HTTP_DATA
	   *   A request listener that reads data from the HTTP connection in order
	   *   to build the response data.
	   *   Handles the {AWS.Request~httpData 'httpData' Request event}.
	   *   Remove this handler if you are overriding the 'httpData' event and
	   *   do not want extra data processing and buffering overhead.
	   *   @example Disabling default data processing
	   *     var listener = AWS.EventListeners.Core.HTTP_DATA;
	   *     request.removeListener('httpData', listener);
	   *   @return [Function]
	   *   @readonly
	   */
	  Core: {} /* doc hack */
	};

	AWS.EventListeners = {
	  Core: new SequentialExecutor().addNamedListeners(function(add, addAsync) {
	    addAsync('VALIDATE_CREDENTIALS', 'validate',
	        function VALIDATE_CREDENTIALS(req, done) {
	      if (!req.service.api.signatureVersion) return done(); // none
	      req.service.config.getCredentials(function(err) {
	        if (err) {
	          req.response.error = AWS.util.error(err,
	            {code: 'CredentialsError', message: 'Missing credentials in config'});
	        }
	        done();
	      });
	    });

	    add('VALIDATE_REGION', 'validate', function VALIDATE_REGION(req) {
	      if (!req.service.config.region && !req.service.isGlobalEndpoint) {
	        req.response.error = AWS.util.error(new Error(),
	          {code: 'ConfigError', message: 'Missing region in config'});
	      }
	    });

	    add('VALIDATE_PARAMETERS', 'validate', function VALIDATE_PARAMETERS(req) {
	      var rules = req.service.api.operations[req.operation].input;
	      new AWS.ParamValidator().validate(rules, req.params);
	    });

	    add('SET_CONTENT_LENGTH', 'afterBuild', function SET_CONTENT_LENGTH(req) {
	      if (req.httpRequest.headers['Content-Length'] === undefined) {
	        var length = AWS.util.string.byteLength(req.httpRequest.body);
	        req.httpRequest.headers['Content-Length'] = length;
	      }
	    });

	    add('SET_HTTP_HOST', 'afterBuild', function SET_HTTP_HOST(req) {
	      req.httpRequest.headers['Host'] = req.httpRequest.endpoint.host;
	    });

	    add('RESTART', 'restart', function RESTART() {
	      var err = this.response.error;
	      if (!err || !err.retryable) return;

	      if (this.response.retryCount < this.service.config.maxRetries) {
	        this.response.retryCount++;
	      } else {
	        this.response.error = null;
	      }
	    });

	    addAsync('SIGN', 'sign', function SIGN(req, done) {
	      if (!req.service.api.signatureVersion) return done(); // none

	      req.service.config.getCredentials(function (err, credentials) {
	        if (err) {
	          req.response.error = err;
	          return done();
	        }

	        try {
	          var date = AWS.util.date.getDate();
	          var SignerClass = req.service.getSignerClass(req);
	          var signer = new SignerClass(req.httpRequest,
	            req.service.api.signingName || req.service.api.endpointPrefix);

	          // clear old authorization headers
	          delete req.httpRequest.headers['Authorization'];
	          delete req.httpRequest.headers['Date'];
	          delete req.httpRequest.headers['X-Amz-Date'];

	          // add new authorization
	          signer.addAuthorization(credentials, date);
	          req.signedAt = date;
	        } catch (e) {
	          req.response.error = e;
	        }
	        done();
	      });
	    });

	    add('VALIDATE_RESPONSE', 'validateResponse', function VALIDATE_RESPONSE(resp) {
	      if (this.service.successfulResponse(resp, this)) {
	        resp.data = {};
	        resp.error = null;
	      } else {
	        resp.data = null;
	        resp.error = AWS.util.error(new Error(),
	          {code: 'UnknownError', message: 'An unknown error occurred.'});
	      }
	    });

	    addAsync('SEND', 'send', function SEND(resp, done) {
	      resp.httpResponse._abortCallback = done;
	      resp.error = null;
	      resp.data = null;

	      function callback(httpResp) {
	        resp.httpResponse.stream = httpResp;

	        httpResp.on('headers', function onHeaders(statusCode, headers) {
	          resp.request.emit('httpHeaders', [statusCode, headers, resp]);

	          if (!resp.httpResponse.streaming) {
	            if (AWS.HttpClient.streamsApiVersion === 2) { // streams2 API check
	              httpResp.on('readable', function onReadable() {
	                var data = httpResp.read();
	                if (data !== null) {
	                  resp.request.emit('httpData', [data, resp]);
	                }
	              });
	            } else { // legacy streams API
	              httpResp.on('data', function onData(data) {
	                resp.request.emit('httpData', [data, resp]);
	              });
	            }
	          }
	        });

	        httpResp.on('end', function onEnd() {
	          resp.request.emit('httpDone');
	          done();
	        });
	      }

	      function progress(httpResp) {
	        httpResp.on('sendProgress', function onSendProgress(progress) {
	          resp.request.emit('httpUploadProgress', [progress, resp]);
	        });

	        httpResp.on('receiveProgress', function onReceiveProgress(progress) {
	          resp.request.emit('httpDownloadProgress', [progress, resp]);
	        });
	      }

	      function error(err) {
	        resp.error = AWS.util.error(err, {
	          code: 'NetworkingError',
	          region: resp.request.httpRequest.region,
	          hostname: resp.request.httpRequest.endpoint.hostname,
	          retryable: true
	        });
	        resp.request.emit('httpError', [resp.error, resp], function() {
	          done();
	        });
	      }

	      function executeSend() {
	        var http = AWS.HttpClient.getInstance();
	        var httpOptions = resp.request.service.config.httpOptions || {};
	        try {
	          var stream = http.handleRequest(resp.request.httpRequest, httpOptions,
	                                          callback, error);
	          progress(stream);
	        } catch (err) {
	          error(err);
	        }
	      }

	      var timeDiff = (AWS.util.date.getDate() - this.signedAt) / 1000;
	      if (timeDiff >= 60 * 10) { // if we signed 10min ago, re-sign
	        this.emit('sign', [this], function(err) {
	          if (err) done(err);
	          else executeSend();
	        });
	      } else {
	        executeSend();
	      }
	    });

	    add('HTTP_HEADERS', 'httpHeaders',
	        function HTTP_HEADERS(statusCode, headers, resp) {
	      resp.httpResponse.statusCode = statusCode;
	      resp.httpResponse.headers = headers;
	      resp.httpResponse.body = new AWS.util.Buffer('');
	      resp.httpResponse.buffers = [];
	      resp.httpResponse.numBytes = 0;
	    });

	    add('HTTP_DATA', 'httpData', function HTTP_DATA(chunk, resp) {
	      if (chunk) {
	        if (AWS.util.isNode()) {
	          resp.httpResponse.numBytes += chunk.length;

	          var total = resp.httpResponse.headers['content-length'];
	          var progress = { loaded: resp.httpResponse.numBytes, total: total };
	          resp.request.emit('httpDownloadProgress', [progress, resp]);
	        }

	        resp.httpResponse.buffers.push(new AWS.util.Buffer(chunk));
	      }
	    });

	    add('HTTP_DONE', 'httpDone', function HTTP_DONE(resp) {
	      // convert buffers array into single buffer
	      if (resp.httpResponse.buffers && resp.httpResponse.buffers.length > 0) {
	        var body = AWS.util.buffer.concat(resp.httpResponse.buffers);
	        resp.httpResponse.body = body;
	      }
	      delete resp.httpResponse.numBytes;
	      delete resp.httpResponse.buffers;
	    });

	    add('FINALIZE_ERROR', 'retry', function FINALIZE_ERROR(resp) {
	      if (resp.httpResponse.statusCode) {
	        resp.error.statusCode = resp.httpResponse.statusCode;
	        if (resp.error.retryable === undefined) {
	          resp.error.retryable = this.service.retryableError(resp.error, this);
	        }
	      }
	    });

	    add('INVALIDATE_CREDENTIALS', 'retry', function INVALIDATE_CREDENTIALS(resp) {
	      if (!resp.error) return;
	      switch (resp.error.code) {
	        case 'RequestExpired': // EC2 only
	        case 'ExpiredTokenException':
	        case 'ExpiredToken':
	          resp.error.retryable = true;
	          resp.request.service.config.credentials.expired = true;
	      }
	    });

	    add('EXPIRED_SIGNATURE', 'retry', function EXPIRED_SIGNATURE(resp) {
	      var err = resp.error;
	      if (!err) return;
	      if (typeof err.code === 'string' && typeof err.message === 'string') {
	        if (err.code.match(/Signature/) && err.message.match(/expired/)) {
	          resp.error.retryable = true;
	        }
	      }
	    });

	    add('REDIRECT', 'retry', function REDIRECT(resp) {
	      if (resp.error && resp.error.statusCode >= 300 &&
	          resp.error.statusCode < 400 && resp.httpResponse.headers['location']) {
	        this.httpRequest.endpoint =
	          new AWS.Endpoint(resp.httpResponse.headers['location']);
	        this.httpRequest.headers['Host'] = this.httpRequest.endpoint.host;
	        resp.error.redirect = true;
	        resp.error.retryable = true;
	      }
	    });

	    add('RETRY_CHECK', 'retry', function RETRY_CHECK(resp) {
	      if (resp.error) {
	        if (resp.error.redirect && resp.redirectCount < resp.maxRedirects) {
	          resp.error.retryDelay = 0;
	        } else if (resp.retryCount < resp.maxRetries) {
	          var delays = this.service.retryDelays();
	          resp.error.retryDelay = delays[resp.retryCount] || 0;
	        }
	      }
	    });

	    addAsync('RESET_RETRY_STATE', 'afterRetry', function RESET_RETRY_STATE(resp, done) {
	      var delay, willRetry = false;

	      if (resp.error) {
	        delay = resp.error.retryDelay || 0;
	        if (resp.error.retryable && resp.retryCount < resp.maxRetries) {
	          resp.retryCount++;
	          willRetry = true;
	        } else if (resp.error.redirect && resp.redirectCount < resp.maxRedirects) {
	          resp.redirectCount++;
	          willRetry = true;
	        }
	      }

	      if (willRetry) {
	        resp.error = null;
	        setTimeout(done, delay);
	      } else {
	        done();
	      }
	    });
	  }),

	  CorePost: new SequentialExecutor().addNamedListeners(function(add) {
	    add('EXTRACT_REQUEST_ID', 'extractData', function EXTRACT_REQUEST_ID(resp) {
	      resp.requestId = resp.httpResponse.headers['x-amz-request-id'] ||
	                       resp.httpResponse.headers['x-amzn-requestid'];

	      if (!resp.requestId && resp.data && resp.data.ResponseMetadata) {
	        resp.requestId = resp.data.ResponseMetadata.RequestId;
	      }
	    });

	    add('ENOTFOUND_ERROR', 'httpError', function ENOTFOUND_ERROR(err) {
	      if (err.code === 'NetworkingError' && err.errno === 'ENOTFOUND') {
	        var message = 'Inaccessible host: `' + err.hostname +
	          '\'. This service may not be available in the `' + err.region +
	          '\' region.';
	        this.response.error = AWS.util.error(new Error(message), {
	          code: 'UnknownEndpoint',
	          region: err.region,
	          hostname: err.hostname,
	          retryable: false,
	          originalError: err
	        });
	      }
	    });
	  }),

	  Logger: new SequentialExecutor().addNamedListeners(function(add) {
	    add('LOG_REQUEST', 'complete', function LOG_REQUEST(resp) {
	      var req = resp.request;
	      var logger = req.service.config.logger;
	      if (!logger) return;

	      function buildMessage() {
	        var time = AWS.util.date.getDate().getTime();
	        var delta = (time - req.startTime.getTime()) / 1000;
	        var ansi = logger.isTTY ? true : false;
	        var status = resp.httpResponse.statusCode;
	        var params = __webpack_require__(21).inspect(req.params, true, true);

	        var message = '';
	        if (ansi) message += '\x1B[33m';
	        message += '[AWS ' + req.service.serviceIdentifier + ' ' + status;
	        message += ' ' + delta.toString() + 's ' + resp.retryCount + ' retries]';
	        if (ansi) message += '\x1B[0;1m';
	        message += ' ' + AWS.util.string.lowerFirst(req.operation);
	        message += '(' + params + ')';
	        if (ansi) message += '\x1B[0m';
	        return message;
	      }

	      var line = buildMessage();
	      if (typeof logger.log === 'function') {
	        logger.log(line);
	      } else if (typeof logger.write === 'function') {
	        logger.write(line + '\n');
	      }
	    });
	  }),

	  Json: new SequentialExecutor().addNamedListeners(function(add) {
	    var svc = __webpack_require__(99);
	    add('BUILD', 'build', svc.buildRequest);
	    add('EXTRACT_DATA', 'extractData', svc.extractData);
	    add('EXTRACT_ERROR', 'extractError', svc.extractError);
	  }),

	  Rest: new SequentialExecutor().addNamedListeners(function(add) {
	    var svc = __webpack_require__(102);
	    add('BUILD', 'build', svc.buildRequest);
	    add('EXTRACT_DATA', 'extractData', svc.extractData);
	    add('EXTRACT_ERROR', 'extractError', svc.extractError);
	  }),

	  RestJson: new SequentialExecutor().addNamedListeners(function(add) {
	    var svc = __webpack_require__(103);
	    add('BUILD', 'build', svc.buildRequest);
	    add('EXTRACT_DATA', 'extractData', svc.extractData);
	    add('EXTRACT_ERROR', 'extractError', svc.extractError);
	  }),

	  RestXml: new SequentialExecutor().addNamedListeners(function(add) {
	    var svc = __webpack_require__(104);
	    add('BUILD', 'build', svc.buildRequest);
	    add('EXTRACT_DATA', 'extractData', svc.extractData);
	    add('EXTRACT_ERROR', 'extractError', svc.extractError);
	  }),

	  Query: new SequentialExecutor().addNamedListeners(function(add) {
	    var svc = __webpack_require__(105);
	    add('BUILD', 'build', svc.buildRequest);
	    add('EXTRACT_DATA', 'extractData', svc.extractData);
	    add('EXTRACT_ERROR', 'extractError', svc.extractError);
	  })
	};


/***/ },
/* 98 */
/***/ function(module, exports, __webpack_require__) {

	var AWS = __webpack_require__(8);

	/**
	 * @api private
	 * @!method on(eventName, callback)
	 *   Registers an event listener callback for the event given by `eventName`.
	 *   Parameters passed to the callback function depend on the individual event
	 *   being triggered. See the event documentation for those parameters.
	 *
	 *   @param eventName [String] the event name to register the listener for
	 *   @param callback [Function] the listener callback function
	 *   @return [AWS.SequentialExecutor] the same object for chaining
	 */
	AWS.SequentialExecutor = AWS.util.inherit({

	  constructor: function SequentialExecutor() {
	    this._events = {};
	  },

	  /**
	   * @api private
	   */
	  listeners: function listeners(eventName) {
	    return this._events[eventName] ? this._events[eventName].slice(0) : [];
	  },

	  on: function on(eventName, listener) {
	    if (this._events[eventName]) {
	      this._events[eventName].push(listener);
	    } else {
	      this._events[eventName] = [listener];
	    }
	    return this;
	  },

	  /**
	   * @api private
	   */
	  onAsync: function onAsync(eventName, listener) {
	    listener._isAsync = true;
	    return this.on(eventName, listener);
	  },

	  removeListener: function removeListener(eventName, listener) {
	    var listeners = this._events[eventName];
	    if (listeners) {
	      var length = listeners.length;
	      var position = -1;
	      for (var i = 0; i < length; ++i) {
	        if (listeners[i] === listener) {
	          position = i;
	        }
	      }
	      if (position > -1) {
	        listeners.splice(position, 1);
	      }
	    }
	    return this;
	  },

	  removeAllListeners: function removeAllListeners(eventName) {
	    if (eventName) {
	      delete this._events[eventName];
	    } else {
	      this._events = {};
	    }
	    return this;
	  },

	  /**
	   * @api private
	   */
	  emit: function emit(eventName, eventArgs, doneCallback) {
	    if (!doneCallback) doneCallback = function() { };
	    var listeners = this.listeners(eventName);
	    var count = listeners.length;
	    this.callListeners(listeners, eventArgs, doneCallback);
	    return count > 0;
	  },

	  /**
	   * @api private
	   */
	  callListeners: function callListeners(listeners, args, doneCallback) {
	    var self = this;
	    function callNextListener(err) {
	      if (err) {
	        doneCallback.call(self, err);
	      } else {
	        self.callListeners(listeners, args, doneCallback);
	      }
	    }

	    while (listeners.length > 0) {
	      var listener = listeners.shift();
	      if (listener._isAsync) { // asynchronous listener
	        listener.apply(self, args.concat([callNextListener]));
	        return; // stop here, callNextListener will continue
	      } else { // synchronous listener
	        listener.apply(self, args);
	      }
	    }

	    doneCallback.call(self);
	  },

	  /**
	   * Adds or copies a set of listeners from another list of
	   * listeners or SequentialExecutor object.
	   *
	   * @param listeners [map<String,Array<Function>>, AWS.SequentialExecutor]
	   *   a list of events and callbacks, or an event emitter object
	   *   containing listeners to add to this emitter object.
	   * @return [AWS.SequentialExecutor] the emitter object, for chaining.
	   * @example Adding listeners from a map of listeners
	   *   emitter.addListeners({
	   *     event1: [function() { ... }, function() { ... }],
	   *     event2: [function() { ... }]
	   *   });
	   *   emitter.emit('event1'); // emitter has event1
	   *   emitter.emit('event2'); // emitter has event2
	   * @example Adding listeners from another emitter object
	   *   var emitter1 = new AWS.SequentialExecutor();
	   *   emitter1.on('event1', function() { ... });
	   *   emitter1.on('event2', function() { ... });
	   *   var emitter2 = new AWS.SequentialExecutor();
	   *   emitter2.addListeners(emitter1);
	   *   emitter2.emit('event1'); // emitter2 has event1
	   *   emitter2.emit('event2'); // emitter2 has event2
	   */
	  addListeners: function addListeners(listeners) {
	    var self = this;

	    // extract listeners if parameter is an SequentialExecutor object
	    if (listeners._events) listeners = listeners._events;

	    AWS.util.each(listeners, function(event, callbacks) {
	      if (typeof callbacks === 'function') callbacks = [callbacks];
	      AWS.util.arrayEach(callbacks, function(callback) {
	        self.on(event, callback);
	      });
	    });

	    return self;
	  },

	  /**
	   * Registers an event with {on} and saves the callback handle function
	   * as a property on the emitter object using a given `name`.
	   *
	   * @param name [String] the property name to set on this object containing
	   *   the callback function handle so that the listener can be removed in
	   *   the future.
	   * @param (see on)
	   * @return (see on)
	   * @example Adding a named listener DATA_CALLBACK
	   *   var listener = function() { doSomething(); };
	   *   emitter.addNamedListener('DATA_CALLBACK', 'data', listener);
	   *
	   *   // the following prints: true
	   *   console.log(emitter.DATA_CALLBACK == listener);
	   */
	  addNamedListener: function addNamedListener(name, eventName, callback) {
	    this[name] = callback;
	    this.addListener(eventName, callback);
	    return this;
	  },

	  /**
	   * @api private
	   */
	  addNamedAsyncListener: function addNamedAsyncListener(name, eventName, callback) {
	    callback._isAsync = true;
	    return this.addNamedListener(name, eventName, callback);
	  },

	  /**
	   * Helper method to add a set of named listeners using
	   * {addNamedListener}. The callback contains a parameter
	   * with a handle to the `addNamedListener` method.
	   *
	   * @callback callback function(add)
	   *   The callback function is called immediately in order to provide
	   *   the `add` function to the block. This simplifies the addition of
	   *   a large group of named listeners.
	   *   @param add [Function] the {addNamedListener} function to call
	   *     when registering listeners.
	   * @example Adding a set of named listeners
	   *   emitter.addNamedListeners(function(add) {
	   *     add('DATA_CALLBACK', 'data', function() { ... });
	   *     add('OTHER', 'otherEvent', function() { ... });
	   *     add('LAST', 'lastEvent', function() { ... });
	   *   });
	   *
	   *   // these properties are now set:
	   *   emitter.DATA_CALLBACK;
	   *   emitter.OTHER;
	   *   emitter.LAST;
	   */
	  addNamedListeners: function addNamedListeners(callback) {
	    var self = this;
	    callback(
	      function() {
	        self.addNamedListener.apply(self, arguments);
	      },
	      function() {
	        self.addNamedAsyncListener.apply(self, arguments);
	      }
	    );
	    return this;
	  }
	});

	/**
	 * {on} is the prefered method.
	 * @api private
	 */
	AWS.SequentialExecutor.prototype.addListener = AWS.SequentialExecutor.prototype.on;

	module.exports = AWS.SequentialExecutor;


/***/ },
/* 99 */
/***/ function(module, exports, __webpack_require__) {

	var util = __webpack_require__(9);
	var JsonBuilder = __webpack_require__(100);
	var JsonParser = __webpack_require__(101);

	function buildRequest(req) {
	  var httpRequest = req.httpRequest;
	  var api = req.service.api;
	  var target = api.targetPrefix + '.' + api.operations[req.operation].name;
	  var version = api.jsonVersion || '1.0';
	  var input = api.operations[req.operation].input;
	  var builder = new JsonBuilder();

	  if (version === 1) version = '1.0';
	  httpRequest.body = builder.build(req.params || {}, input);
	  httpRequest.headers['Content-Type'] = 'application/x-amz-json-' + version;
	  httpRequest.headers['X-Amz-Target'] = target;
	}

	function extractError(resp) {
	  var error = {};
	  var httpResponse = resp.httpResponse;

	  error.code = httpResponse.headers['x-amzn-errortype'] || 'UnknownError';
	  if (typeof error.code === 'string') {
	    error.code = error.code.split(':')[0];
	  }

	  if (httpResponse.body.length > 0) {
	    var e = JSON.parse(httpResponse.body.toString());
	    if (e.__type || e.code) {
	      error.code = (e.__type || e.code).split('#').pop();
	    }
	    if (error.code === 'RequestEntityTooLarge') {
	      error.message = 'Request body must be less than 1 MB';
	    } else {
	      error.message = (e.message || e.Message || null);
	    }
	  } else {
	    error.statusCode = httpResponse.statusCode;
	    error.message = httpResponse.statusCode.toString();
	  }

	  resp.error = util.error(new Error(), error);
	}

	function extractData(resp) {
	  var body = resp.httpResponse.body.toString() || '{}';
	  if (resp.request.service.config.convertResponseTypes === false) {
	    resp.data = JSON.parse(body);
	  } else {
	    var operation = resp.request.service.api.operations[resp.request.operation];
	    var shape = operation.output || {};
	    var parser = new JsonParser();
	    resp.data = parser.parse(body, shape);
	  }
	}

	module.exports = {
	  buildRequest: buildRequest,
	  extractError: extractError,
	  extractData: extractData
	};


/***/ },
/* 100 */
/***/ function(module, exports, __webpack_require__) {

	var util = __webpack_require__(9);

	function JsonBuilder() { }

	JsonBuilder.prototype.build = function(value, shape) {
	  return JSON.stringify(translate(value, shape));
	};

	function translate(value, shape) {
	  if (!shape || value === undefined || value === null) return undefined;

	  switch (shape.type) {
	    case 'structure': return translateStructure(value, shape);
	    case 'map': return translateMap(value, shape);
	    case 'list': return translateList(value, shape);
	    default: return translateScalar(value, shape);
	  }
	}

	function translateStructure(structure, shape) {
	  var struct = {};
	  util.each(structure, function(name, value) {
	    var memberShape = shape.members[name];
	    if (memberShape) {
	      if (memberShape.location !== 'body') return;

	      var result = translate(value, memberShape);
	      if (result !== undefined) struct[name] = result;
	    }
	  });
	  return struct;
	}

	function translateList(list, shape) {
	  var out = [];
	  util.arrayEach(list, function(value) {
	    var result = translate(value, shape.member);
	    if (result !== undefined) out.push(result);
	  });
	  return out;
	}

	function translateMap(map, shape) {
	  var out = {};
	  util.each(map, function(key, value) {
	    var result = translate(value, shape.value);
	    if (result !== undefined) out[key] = result;
	  });
	  return out;
	}

	function translateScalar(value, shape) {
	  return shape.toWireFormat(value);
	}

	module.exports = JsonBuilder;


/***/ },
/* 101 */
/***/ function(module, exports, __webpack_require__) {

	var util = __webpack_require__(9);

	function JsonParser() { }

	JsonParser.prototype.parse = function(value, shape) {
	  return translate(JSON.parse(value), shape);
	};

	function translate(value, shape) {
	  if (!shape || value === undefined || value === null) return undefined;

	  switch (shape.type) {
	    case 'structure': return translateStructure(value, shape);
	    case 'map': return translateMap(value, shape);
	    case 'list': return translateList(value, shape);
	    default: return translateScalar(value, shape);
	  }
	}

	function translateStructure(structure, shape) {
	  var struct = {};
	  util.each(structure, function(name, value) {
	    var memberShape = shape.members[name];
	    if (memberShape) {
	      var result = translate(value, memberShape);
	      if (result !== undefined) struct[name] = result;
	    }
	  });
	  return struct;
	}

	function translateList(list, shape) {
	  var out = [];
	  util.arrayEach(list, function(value) {
	    var result = translate(value, shape.member);
	    if (result !== undefined) out.push(result);
	  });
	  return out;
	}

	function translateMap(map, shape) {
	  var out = {};
	  util.each(map, function(key, value) {
	    var result = translate(value, shape.value);
	    if (result !== undefined) out[key] = result;
	  });
	  return out;
	}

	function translateScalar(value, shape) {
	  return shape.toType(value);
	}

	module.exports = JsonParser;


/***/ },
/* 102 */
/***/ function(module, exports, __webpack_require__) {

	var util = __webpack_require__(9);

	function populateMethod(req) {
	  req.httpRequest.method = req.service.api.operations[req.operation].httpMethod;
	}

	function populateURI(req) {
	  var operation = req.service.api.operations[req.operation];
	  var input = operation.input;
	  var uri = [req.httpRequest.endpoint.path, operation.httpPath].join('/');
	  uri = uri.replace(/\/+/g, '/');

	  var queryString = {}, queryStringSet = false;
	  util.each(input.members, function (name, member) {
	    var paramValue = req.params[name];
	    if (paramValue === null || paramValue === undefined) return;
	    if (member.location === 'uri') {
	      var regex = new RegExp('\\{' + member.name + '(\\+)?\\}');
	      uri = uri.replace(regex, function(_, plus) {
	        var fn = plus ? util.uriEscapePath : util.uriEscape;
	        return fn(String(paramValue));
	      });
	    } else if (member.location === 'querystring') {
	      queryStringSet = true;
	      queryString[member.name] = util.uriEscape(String(paramValue));
	    }
	  });

	  if (queryStringSet) {
	    uri += (uri.indexOf('?') >= 0 ? '&' : '?');
	    var parts = [];
	    util.arrayEach(Object.keys(queryString).sort(), function(key) {
	      parts.push(util.uriEscape(String(key)) + '=' + queryString[key]);
	    });
	    uri += parts.join('&');
	  }

	  req.httpRequest.path = uri;
	}

	function populateHeaders(req) {
	  var operation = req.service.api.operations[req.operation];
	  util.each(operation.input.members, function (name, member) {
	    var value = req.params[name];
	    if (value === null || value === undefined) return;

	    if (member.location === 'headers' && member.type === 'map') {
	      util.each(value, function(key, value) {
	        req.httpRequest.headers[member.name + key] = value;
	      });
	    } else if (member.location === 'header') {
	      value = member.toWireFormat(value).toString();
	      req.httpRequest.headers[member.name] = value;
	    }
	  });
	}

	function buildRequest(req) {
	  populateMethod(req);
	  populateURI(req);
	  populateHeaders(req);
	}

	function extractError() {
	}

	function extractData(resp) {
	  var req = resp.request;
	  var data = {};
	  var r = resp.httpResponse;
	  var operation = req.service.api.operations[req.operation];
	  var output = operation.output;

	  // normalize headers names to lower-cased keys for matching
	  var headers = {};
	  util.each(r.headers, function (k, v) {
	    headers[k.toLowerCase()] = v;
	  });

	  util.each(output.members, function(name, member) {
	    var header = (member.name || name).toLowerCase();
	    if (member.location === 'headers' && member.type === 'map') {
	      data[name] = {};
	      util.each(r.headers, function (k, v) {
	        var result = k.match(new RegExp('^' + member.name + '(.+)', 'i'));
	        if (result !== null) {
	          data[name][result[1]] = v;
	        }
	      });
	    } else if (member.location === 'header') {
	      if (headers[header] !== undefined) {
	        data[name] = headers[header];
	      }
	    } else if (member.location === 'statusCode') {
	      data[name] = parseInt(r.statusCode, 10);
	    }
	  });

	  resp.data = data;
	}

	module.exports = {
	  buildRequest: buildRequest,
	  extractError: extractError,
	  extractData: extractData
	};


/***/ },
/* 103 */
/***/ function(module, exports, __webpack_require__) {

	var util = __webpack_require__(9);
	var Rest = __webpack_require__(102);
	var Json = __webpack_require__(99);
	var JsonBuilder = __webpack_require__(100);

	function populateBody(req) {
	  var builder = new JsonBuilder();
	  var input = req.service.api.operations[req.operation].input;

	  if (input.payload) {
	    var params = {};
	    var payloadShape = input.members[input.payload];
	    params = req.params[input.payload];
	    if (params === undefined) return;

	    if (payloadShape.type === 'structure') {
	      req.httpRequest.body = builder.build(params, payloadShape);
	    } else { // non-JSON payload
	      req.httpRequest.body = params;
	    }
	  } else {
	    req.httpRequest.body = builder.build(req.params, input);
	  }
	}

	function buildRequest(req) {
	  Rest.buildRequest(req);

	  // never send body payload on GET/HEAD
	  if (['GET', 'HEAD'].indexOf(req.httpRequest.method) < 0) {
	    populateBody(req);
	  }
	}

	function extractError(resp) {
	  Json.extractError(resp);
	}

	function extractData(resp) {
	  Rest.extractData(resp);

	  var req = resp.request;
	  var rules = req.service.api.operations[req.operation].output || {};
	  if (rules.payload) {
	    var payloadMember = rules.members[rules.payload];
	    if (payloadMember.isStreaming) {
	      resp.data[rules.payload] = resp.httpResponse.body;
	    } else if (payloadMember.type === 'structure') {
	      Json.extractData(resp);
	    } else {
	      resp.data[rules.payload] = resp.httpResponse.body.toString();
	    }
	  } else {
	    var data = resp.data;
	    Json.extractData(resp);
	    resp.data = util.merge(data, resp.data);
	  }
	}

	module.exports = {
	  buildRequest: buildRequest,
	  extractError: extractError,
	  extractData: extractData
	};


/***/ },
/* 104 */
/***/ function(module, exports, __webpack_require__) {

	var AWS = __webpack_require__(8);
	var util = __webpack_require__(9);
	var Rest = __webpack_require__(102);

	function populateBody(req) {
	  var input = req.service.api.operations[req.operation].input;
	  var builder = new AWS.XML.Builder();
	  var params = req.params;

	  var payload = input.payload;
	  if (payload) {
	    var payloadMember = input.members[payload];
	    params = params[payload];
	    if (params === undefined) return;

	    if (payloadMember.type === 'structure') {
	      var rootElement = payloadMember.name;
	      req.httpRequest.body = builder.toXML(params, payloadMember, rootElement);
	    } else { // non-xml payload
	      req.httpRequest.body = params;
	    }
	  } else {
	    req.httpRequest.body = builder.toXML(params, input, input.shape ||
	      util.string.upperFirst(req.operation) + 'Request');
	  }
	}

	function buildRequest(req) {
	  Rest.buildRequest(req);

	  // never send body payload on GET/HEAD
	  if (['GET', 'HEAD'].indexOf(req.httpRequest.method) < 0) {
	    populateBody(req);
	  }
	}

	function extractError(resp) {
	  Rest.extractError(resp);

	  var data = new AWS.XML.Parser().parse(resp.httpResponse.body.toString());
	  if (data.Errors) data = data.Errors;
	  if (data.Error) data = data.Error;
	  if (data.Code) {
	    resp.error = util.error(new Error(), {
	      code: data.Code,
	      message: data.Message
	    });
	  } else {
	    resp.error = util.error(new Error(), {
	      code: resp.httpResponse.statusCode,
	      message: null
	    });
	  }
	}

	function extractData(resp) {
	  Rest.extractData(resp);

	  var parser;
	  var req = resp.request;
	  var body = resp.httpResponse.body;
	  var operation = req.service.api.operations[req.operation];
	  var output = operation.output;

	  var payload = output.payload;
	  if (payload) {
	    var payloadMember = output.members[payload];
	    if (payloadMember.isStreaming) {
	      resp.data[payload] = body;
	    } else if (payloadMember.type === 'structure') {
	      parser = new AWS.XML.Parser();
	      util.update(resp.data, parser.parse(body.toString(), payloadMember));
	    } else {
	      resp.data[payload] = body.toString();
	    }
	  } else if (body.length > 0) {
	    parser = new AWS.XML.Parser();
	    var data = parser.parse(body.toString(), output);
	    util.update(resp.data, data);
	  }
	}

	module.exports = {
	  buildRequest: buildRequest,
	  extractError: extractError,
	  extractData: extractData
	};


/***/ },
/* 105 */
/***/ function(module, exports, __webpack_require__) {

	var AWS = __webpack_require__(8);
	var util = __webpack_require__(9);
	var QueryParamSerializer = __webpack_require__(106);
	var Shape = __webpack_require__(37);

	function buildRequest(req) {
	  var operation = req.service.api.operations[req.operation];
	  var httpRequest = req.httpRequest;
	  httpRequest.headers['Content-Type'] =
	    'application/x-www-form-urlencoded; charset=utf-8';
	  httpRequest.params = {
	    Version: req.service.api.apiVersion,
	    Action: operation.name
	  };

	  // convert the request parameters into a list of query params,
	  // e.g. Deeply.NestedParam.0.Name=value
	  var builder = new QueryParamSerializer();
	  builder.serialize(req.params, operation.input, function(name, value) {
	    httpRequest.params[name] = value;
	  });
	  httpRequest.body = util.queryParamsToString(httpRequest.params);
	}

	function extractError(resp) {
	  var data, body = resp.httpResponse.body.toString();
	  if (body.match('<UnknownOperationException')) {
	    data = {
	      Code: 'UnknownOperation',
	      Message: 'Unknown operation ' + resp.request.operation
	    };
	  } else {
	    data = new AWS.XML.Parser().parse(body);
	  }

	  if (data.Errors) data = data.Errors;
	  if (data.Error) data = data.Error;
	  if (data.Code) {
	    resp.error = util.error(new Error(), {
	      code: data.Code,
	      message: data.Message
	    });
	  } else {
	    resp.error = util.error(new Error(), {
	      code: resp.httpResponse.statusCode,
	      message: null
	    });
	  }
	}

	function extractData(resp) {
	  var req = resp.request;
	  var operation = req.service.api.operations[req.operation];
	  var shape = operation.output || {};
	  var origRules = shape;

	  if (origRules.resultWrapper) {
	    var tmp = Shape.create({type: 'structure'});
	    tmp.members[origRules.resultWrapper] = shape;
	    tmp.memberNames = [origRules.resultWrapper];
	    util.property(shape, 'name', shape.resultWrapper);
	    shape = tmp;
	  }

	  var parser = new AWS.XML.Parser();
	  var data = parser.parse(resp.httpResponse.body.toString(), shape);

	  if (origRules.resultWrapper) {
	    if (data[origRules.resultWrapper]) {
	      util.update(data, data[origRules.resultWrapper]);
	      delete data[origRules.resultWrapper];
	    }
	  }

	  resp.data = data;
	}

	module.exports = {
	  buildRequest: buildRequest,
	  extractError: extractError,
	  extractData: extractData
	};


/***/ },
/* 106 */
/***/ function(module, exports, __webpack_require__) {

	var util = __webpack_require__(9);

	function QueryParamSerializer() {
	}

	QueryParamSerializer.prototype.serialize = function(params, shape, fn) {
	  serializeStructure('', params, shape, fn);
	};

	function ucfirst(shape) {
	  if (shape.isQueryName || shape.api.protocol !== 'ec2') {
	    return shape.name;
	  } else {
	    return shape.name[0].toUpperCase() + shape.name.substr(1);
	  }
	}

	function serializeStructure(prefix, struct, rules, fn) {
	  util.each(rules.members, function(name, member) {
	    var value = struct[name];
	    if (value === null || value === undefined) return;

	    var memberName = ucfirst(member);
	    memberName = prefix ? prefix + '.' + memberName : memberName;
	    serializeMember(memberName, value, member, fn);
	  });
	}

	function serializeMap(name, map, rules, fn) {
	  var i = 1;
	  util.each(map, function (key, value) {
	    var prefix = rules.flattened ? '.' : '.entry.';
	    var position = prefix + (i++) + '.';
	    var keyName = position + (rules.key.name || 'key');
	    var valueName = position + (rules.value.name || 'value');
	    serializeMember(name + keyName, key, rules.key, fn);
	    serializeMember(name + valueName, value, rules.value, fn);
	  });
	}

	function serializeList(name, list, rules, fn) {
	  var memberRules = rules.member || {};

	  if (list.length === 0) {
	    fn.call(this, name, null);
	    return;
	  }

	  util.arrayEach(list, function (v, n) {
	    var suffix = '.' + (n + 1);
	    if (rules.api.protocol === 'ec2') {
	      // Do nothing for EC2
	      suffix = suffix + ''; // make linter happy
	    } else if (rules.flattened) {
	      if (memberRules.name) {
	        var parts = name.split('.');
	        parts.pop();
	        parts.push(ucfirst(memberRules));
	        name = parts.join('.');
	      }
	    } else {
	      suffix = '.member' + suffix;
	    }
	    serializeMember(name + suffix, v, memberRules, fn);
	  });
	}

	function serializeMember(name, value, rules, fn) {
	  if (value === null || value === undefined) return;
	  if (rules.type === 'structure') {
	    serializeStructure(name, value, rules, fn);
	  } else if (rules.type === 'list') {
	    serializeList(name, value, rules, fn);
	  } else if (rules.type === 'map') {
	    serializeMap(name, value, rules, fn);
	  } else {
	    fn(name, rules.toWireFormat(value).toString());
	  }
	}

	module.exports = QueryParamSerializer;


/***/ },
/* 107 */
/***/ function(module, exports, __webpack_require__) {

	var AWS = __webpack_require__(8);
	var EventEmitter = __webpack_require__(42).EventEmitter;
	__webpack_require__(60);

	/**
	 * @api private
	 */
	AWS.XHRClient = AWS.util.inherit({
	  handleRequest: function handleRequest(httpRequest, httpOptions, callback, errCallback) {
	    var self = this;
	    var endpoint = httpRequest.endpoint;
	    var emitter = new EventEmitter();
	    var href = endpoint.protocol + '//' + endpoint.hostname;
	    if (endpoint.port !== 80 && endpoint.port !== 443) {
	      href += ':' + endpoint.port;
	    }
	    href += httpRequest.path;

	    var xhr = new XMLHttpRequest(), headersEmitted = false;
	    httpRequest.stream = xhr;

	    xhr.addEventListener('readystatechange', function() {
	      try {
	        if (xhr.status === 0) return; // 0 code is invalid
	      } catch (e) { return; }

	      if (this.readyState >= this.HEADERS_RECEIVED && !headersEmitted) {
	        try { xhr.responseType = 'arraybuffer'; } catch (e) {}
	        emitter.statusCode = xhr.status;
	        emitter.headers = self.parseHeaders(xhr.getAllResponseHeaders());
	        emitter.emit('headers', emitter.statusCode, emitter.headers);
	        headersEmitted = true;
	      }
	      if (this.readyState === this.DONE) {
	        self.finishRequest(xhr, emitter);
	      }
	    }, false);
	    xhr.upload.addEventListener('progress', function (evt) {
	      emitter.emit('sendProgress', evt);
	    });
	    xhr.addEventListener('progress', function (evt) {
	      emitter.emit('receiveProgress', evt);
	    }, false);
	    xhr.addEventListener('timeout', function () {
	      errCallback(AWS.util.error(new Error('Timeout'), {code: 'TimeoutError'}));
	    }, false);
	    xhr.addEventListener('error', function () {
	      errCallback(AWS.util.error(new Error('Network Failure'), {
	        code: 'NetworkingError'
	      }));
	    }, false);

	    callback(emitter);
	    xhr.open(httpRequest.method, href, httpOptions.xhrAsync !== false);
	    AWS.util.each(httpRequest.headers, function (key, value) {
	      if (key !== 'Content-Length' && key !== 'User-Agent' && key !== 'Host') {
	        xhr.setRequestHeader(key, value);
	      }
	    });

	    if (httpOptions.timeout) {
	      xhr.timeout = httpOptions.timeout;
	    }

	    if (httpOptions.xhrWithCredentials) {
	      xhr.withCredentials = true;
	    }

	    try {
	      xhr.send(httpRequest.body);
	    } catch (err) {
	      if (httpRequest.body && typeof httpRequest.body.buffer === 'object') {
	        xhr.send(httpRequest.body.buffer); // send ArrayBuffer directly
	      } else {
	        throw err;
	      }
	    }

	    return emitter;
	  },

	  parseHeaders: function parseHeaders(rawHeaders) {
	    var headers = {};
	    AWS.util.arrayEach(rawHeaders.split(/\r?\n/), function (line) {
	      var key = line.split(':', 1)[0];
	      var value = line.substring(key.length + 2);
	      if (key.length > 0) headers[key] = value;
	    });
	    return headers;
	  },

	  finishRequest: function finishRequest(xhr, emitter) {
	    var buffer;
	    if (xhr.responseType === 'arraybuffer' && xhr.response) {
	      var ab = xhr.response;
	      buffer = new AWS.util.Buffer(ab.byteLength);
	      var view = new Uint8Array(ab);
	      for (var i = 0; i < buffer.length; ++i) {
	        buffer[i] = view[i];
	      }
	    }

	    try {
	      if (!buffer && typeof xhr.responseText === 'string') {
	        buffer = new AWS.util.Buffer(xhr.responseText);
	      }
	    } catch (e) {}

	    if (buffer) emitter.emit('data', buffer);
	    emitter.emit('end');
	  }
	});

	/**
	 * @api private
	 */
	AWS.HttpClient.prototype = AWS.XHRClient.prototype;

	/**
	 * @api private
	 */
	AWS.HttpClient.streamsApiVersion = 1;


/***/ },
/* 108 */
/***/ function(module, exports, __webpack_require__) {

	var Collection = __webpack_require__(38);
	var Operation = __webpack_require__(109);
	var Shape = __webpack_require__(37);
	var Paginator = __webpack_require__(110);
	var ResourceWaiter = __webpack_require__(111);

	var util = __webpack_require__(9);
	var property = util.property;
	var memoizedProperty = util.memoizedProperty;

	function Api(api, options) {
	  api = api || {};
	  options = options || {};
	  options.api = this;

	  api.metadata = api.metadata || {};

	  property(this, 'isApi', true, false);
	  property(this, 'apiVersion', api.metadata.apiVersion);
	  property(this, 'endpointPrefix', api.metadata.endpointPrefix);
	  property(this, 'signingName', api.metadata.signingName);
	  property(this, 'globalEndpoint', api.metadata.globalEndpoint);
	  property(this, 'signatureVersion', api.metadata.signatureVersion);
	  property(this, 'jsonVersion', api.metadata.jsonVersion);
	  property(this, 'targetPrefix', api.metadata.targetPrefix);
	  property(this, 'protocol', api.metadata.protocol);
	  property(this, 'timestampFormat', api.metadata.timestampFormat);
	  property(this, 'xmlNamespaceUri', api.metadata.xmlNamespace);
	  property(this, 'abbreviation', api.metadata.serviceAbbreviation);
	  property(this, 'fullName', api.metadata.serviceFullName);

	  memoizedProperty(this, 'className', function() {
	    var name = api.metadata.serviceAbbreviation || api.metadata.serviceFullName;
	    if (!name) return null;

	    name = name.replace(/^Amazon|AWS\s*|\(.*|\s+|\W+/g, '');
	    if (name === 'ElasticLoadBalancing') name = 'ELB';
	    return name;
	  });

	  property(this, 'operations', new Collection(api.operations, options, function(name, operation) {
	    return new Operation(name, operation, options);
	  }, util.string.lowerFirst));

	  property(this, 'shapes', new Collection(api.shapes, options, function(name, shape) {
	    return Shape.create(shape, options);
	  }));

	  property(this, 'paginators', new Collection(api.paginators, options, function(name, paginator) {
	    return new Paginator(name, paginator, options);
	  }));

	  property(this, 'waiters', new Collection(api.waiters, options, function(name, waiter) {
	    return new ResourceWaiter(name, waiter, options);
	  }, util.string.lowerFirst));

	  if (options.documentation) {
	    property(this, 'documentation', api.documentation);
	    property(this, 'documentationUrl', api.documentationUrl);
	  }
	}

	module.exports = Api;


/***/ },
/* 109 */
/***/ function(module, exports, __webpack_require__) {

	var Shape = __webpack_require__(37);

	var util = __webpack_require__(9);
	var property = util.property;
	var memoizedProperty = util.memoizedProperty;

	function Operation(name, operation, options) {
	  options = options || {};

	  property(this, 'name', operation.name || name);
	  property(this, 'api', options.api, false);

	  operation.http = operation.http || {};
	  property(this, 'httpMethod', operation.http.method || 'POST');
	  property(this, 'httpPath', operation.http.requestUri || '/');

	  memoizedProperty(this, 'input', function() {
	    if (!operation.input) {
	      return new Shape.create({type: 'structure'}, options);
	    }
	    return Shape.create(operation.input, options);
	  });

	  memoizedProperty(this, 'output', function() {
	    if (!operation.output) {
	      return new Shape.create({type: 'structure'}, options);
	    }
	    return Shape.create(operation.output, options);
	  });

	  memoizedProperty(this, 'errors', function() {
	    var list = [];
	    if (!operation.errors) return null;

	    for (var i = 0; i < operation.errors.length; i++) {
	      list.push(Shape.create(operation.errors[i], options));
	    }

	    return list;
	  });

	  memoizedProperty(this, 'paginator', function() {
	    return options.api.paginators[name];
	  });

	  if (options.documentation) {
	    property(this, 'documentation', operation.documentation);
	    property(this, 'documentationUrl', operation.documentationUrl);
	  }
	}

	module.exports = Operation;


/***/ },
/* 110 */
/***/ function(module, exports, __webpack_require__) {

	var property = __webpack_require__(9).property;

	function Paginator(name, paginator) {
	  property(this, 'inputToken', paginator.input_token);
	  property(this, 'limitKey', paginator.limit_key);
	  property(this, 'moreResults', paginator.more_results);
	  property(this, 'outputToken', paginator.output_token);
	  property(this, 'resultKey', paginator.result_key);
	}

	module.exports = Paginator;


/***/ },
/* 111 */
/***/ function(module, exports, __webpack_require__) {

	var util = __webpack_require__(9);
	var property = util.property;

	function ResourceWaiter(name, waiter, options) {
	  options = options || {};

	  function InnerResourceWaiter() {
	    property(this, 'name', name);
	    property(this, 'api', options.api, false);

	    if (waiter.operation) {
	      property(this, 'operation', util.string.lowerFirst(waiter.operation));
	    }

	    var self = this, map = {
	      ignoreErrors: 'ignore_errors',
	      successType: 'success_type',
	      successValue: 'success_value',
	      successPath: 'success_path',
	      acceptorType: 'acceptor_type',
	      acceptorValue: 'acceptor_value',
	      acceptorPath: 'acceptor_path',
	      failureType: 'failure_type',
	      failureValue: 'failure_value',
	      failurePath: 'success_path',
	      interval: 'interval',
	      maxAttempts: 'max_attempts'
	    };
	    Object.keys(map).forEach(function(key) {
	      var value = waiter[map[key]];
	      if (value) property(self, key, value);
	    });
	  }

	  if (options.api) {
	    var proto = null;
	    if (waiter['extends']) {
	      proto = options.api.waiters[waiter['extends']];
	    } else if (name !== '__default__') {
	      proto = options.api.waiters['__default__'];
	    }

	    if (proto) InnerResourceWaiter.prototype = proto;
	  }

	  return new InnerResourceWaiter();
	}

	module.exports = ResourceWaiter;


/***/ },
/* 112 */
/***/ function(module, exports, __webpack_require__) {

	var AWS = __webpack_require__(8);

	/**
	 * @api private
	 */
	AWS.ParamValidator = AWS.util.inherit({
	  validate: function validate(shape, params, context) {
	    this.errors = [];
	    this.validateMember(shape, params || {}, context || 'params');

	    if (this.errors.length > 1) {
	      var msg = this.errors.join('\n* ');
	      if (this.errors.length > 1) {
	        msg = 'There were ' + this.errors.length +
	              ' validation errors:\n* ' + msg;
	        throw AWS.util.error(new Error(msg),
	          {code: 'MultipleValidationErrors', errors: this.errors});
	      }
	    } else if (this.errors.length === 1) {
	      throw this.errors[0];
	    } else {
	      return true;
	    }
	  },

	  validateStructure: function validateStructure(shape, params, context) {
	    this.validateType(context, params, ['object'], 'structure');

	    var paramName;
	    for (var i = 0; shape.required && i < shape.required.length; i++) {
	      paramName = shape.required[i];
	      var value = params[paramName];
	      if (value === undefined || value === null) {
	        this.fail('MissingRequiredParameter',
	          'Missing required key \'' + paramName + '\' in ' + context);
	      }
	    }

	    // validate hash members
	    for (paramName in params) {
	      if (!params.hasOwnProperty(paramName)) continue;

	      var paramValue = params[paramName],
	          memberShape = shape.members[paramName];

	      if (memberShape !== undefined) {
	        var memberContext = [context, paramName].join('.');
	        this.validateMember(memberShape, paramValue, memberContext);
	      } else {
	        this.fail('UnexpectedParameter',
	          'Unexpected key \'' + paramName + '\' found in ' + context);
	      }
	    }

	    return true;
	  },

	  validateMember: function validateMember(shape, param, context) {
	    switch (shape.type) {
	      case 'structure':
	        return this.validateStructure(shape, param, context);
	      case 'list':
	        return this.validateList(shape, param, context);
	      case 'map':
	        return this.validateMap(shape, param, context);
	      default:
	        return this.validateScalar(shape, param, context);
	    }
	  },

	  validateList: function validateList(shape, params, context) {
	    this.validateType(context, params, [Array]);

	    // validate array members
	    for (var i = 0; i < params.length; i++) {
	      this.validateMember(shape.member, params[i], context + '[' + i + ']');
	    }
	  },

	  validateMap: function validateMap(shape, params, context) {
	    this.validateType(context, params, ['object'], 'map');

	    for (var param in params) {
	      if (!params.hasOwnProperty(param)) continue;
	      this.validateMember(shape.value, params[param],
	                          context + '[\'' + param + '\']');
	    }
	  },

	  validateScalar: function validateScalar(shape, value, context) {
	    switch (shape.type) {
	      case null:
	      case undefined:
	      case 'string':
	        return this.validateType(context, value, ['string']);
	      case 'base64':
	      case 'binary':
	        return this.validatePayload(context, value);
	      case 'integer':
	      case 'float':
	        return this.validateNumber(context, value);
	      case 'boolean':
	        return this.validateType(context, value, ['boolean']);
	      case 'timestamp':
	        return this.validateType(context, value, [Date,
	          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/, 'number'],
	          'Date object, ISO-8601 string, or a UNIX timestamp');
	      default:
	        return this.fail('UnkownType', 'Unhandled type ' +
	                         shape.type + ' for ' + context);
	    }
	  },

	  fail: function fail(code, message) {
	    this.errors.push(AWS.util.error(new Error(message), {code: code}));
	  },

	  validateType: function validateType(context, value, acceptedTypes, type) {
	    if (value === null || value === undefined) return;

	    var foundInvalidType = false;
	    for (var i = 0; i < acceptedTypes.length; i++) {
	      if (typeof acceptedTypes[i] === 'string') {
	        if (typeof value === acceptedTypes[i]) return;
	      } else if (acceptedTypes[i] instanceof RegExp) {
	        if ((value || '').toString().match(acceptedTypes[i])) return;
	      } else {
	        if (value instanceof acceptedTypes[i]) return;
	        if (AWS.util.isType(value, acceptedTypes[i])) return;
	        if (!type && !foundInvalidType) acceptedTypes = acceptedTypes.slice();
	        acceptedTypes[i] = AWS.util.typeName(acceptedTypes[i]);
	      }
	      foundInvalidType = true;
	    }

	    var acceptedType = type;
	    if (!acceptedType) {
	      acceptedType = acceptedTypes.join(', ').replace(/,([^,]+)$/, ', or$1');
	    }

	    var vowel = acceptedType.match(/^[aeiou]/i) ? 'n' : '';
	    this.fail('InvalidParameterType', 'Expected ' + context + ' to be a' +
	              vowel + ' ' + acceptedType);
	  },

	  validateNumber: function validateNumber(context, value) {
	    if (value === null || value === undefined) return;
	    if (typeof value === 'string') {
	      var castedValue = parseFloat(value);
	      if (castedValue.toString() === value) value = castedValue;
	    }
	    this.validateType(context, value, ['number']);
	  },

	  validatePayload: function validatePayload(context, value) {
	    if (value === null || value === undefined) return;
	    if (typeof value === 'string') return;
	    if (value && typeof value.byteLength === 'number') return; // typed arrays
	    if (AWS.util.isNode()) { // special check for buffer/stream in Node.js
	      var Stream = AWS.util.nodeRequire('stream').Stream;
	      if (AWS.util.Buffer.isBuffer(value) || value instanceof Stream) return;
	    }

	    var types = ['Buffer', 'Stream', 'File', 'Blob', 'ArrayBuffer', 'DataView'];
	    if (value) {
	      for (var i = 0; i < types.length; i++) {
	        if (AWS.util.isType(value, types[i])) return;
	        if (AWS.util.typeName(value.constructor) === types[i]) return;
	      }
	    }

	    this.fail('InvalidParameterType', 'Expected ' + context + ' to be a ' +
	      'string, Buffer, Stream, Blob, or typed array object');
	  }
	});


/***/ },
/* 113 */
/***/ function(module, exports, __webpack_require__) {

	var util = __webpack_require__(9);
	var regionConfig = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"./region_config.json\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()));

	function generateRegionPrefix(region) {
	  if (!region) return null;

	  var parts = region.split('-');
	  if (parts.length < 3) return null;
	  return parts.slice(0, parts.length - 2).join('-') + '-*';
	}

	function derivedKeys(service) {
	  var region = service.config.region;
	  var regionPrefix = generateRegionPrefix(region);
	  var endpointPrefix = service.api.endpointPrefix;

	  return [
	    [region, endpointPrefix],
	    [regionPrefix, endpointPrefix],
	    [region, '*'],
	    [regionPrefix, '*'],
	    ['*', endpointPrefix],
	    ['*', '*']
	  ].map(function(item) {
	    return item[0] && item[1] ? item.join('/') : null;
	  });
	}

	function applyConfig(service, config) {
	  util.each(config, function(key, value) {
	    if (key === 'globalEndpoint') return;
	    if (service.config[key] === undefined || service.config[key] === null) {
	      service.config[key] = value;
	    }
	  });
	}

	function configureEndpoint(service) {
	  var keys = derivedKeys(service);
	  for (var i = 0; i < keys.length; i++) {
	    var key = keys[i];
	    if (!key) continue;

	    if (regionConfig.rules.hasOwnProperty(key)) {
	      var config = regionConfig.rules[key];
	      if (typeof config === 'string') {
	        config = regionConfig.patterns[config];
	      }

	      // set global endpoint
	      service.isGlobalEndpoint = !!config.globalEndpoint;

	      // signature version
	      if (!config.signatureVersion) config.signatureVersion = 'v4';

	      // merge config
	      applyConfig(service, config);
	      return;
	    }
	  }
	}

	module.exports = configureEndpoint;


/***/ },
/* 114 */,
/* 115 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {var AWS = __webpack_require__(8);
	var AcceptorStateMachine = __webpack_require__(116);
	var inherit = AWS.util.inherit;
	var domain = AWS.util.nodeRequire('domain');

	/**
	 * @api private
	 */
	var hardErrorStates = {success: 1, error: 1, complete: 1};

	function isTerminalState(machine) {
	  return hardErrorStates.hasOwnProperty(machine._asm.currentState);
	}

	var fsm = new AcceptorStateMachine();
	fsm.setupStates = function() {
	  var transition = function(_, done) {
	    var self = this;

	    try {
	      self.emit(self._asm.currentState, function() {
	        done(self.response.error);
	      });
	    } catch (err) {
	      if (isTerminalState(self)) {
	        if (domain && self.domain instanceof domain.Domain) {
	          err.domainEmitter = self;
	          err.domain = self.domain;
	          err.domainThrown = false;
	          self.domain.emit('error', err);
	        } else {
	          throw err;
	        }
	      } else {
	        self.response.error = err;
	        done(err);
	      }
	    }
	  };

	  this.addState('validate', 'build', 'error', transition);
	  this.addState('build', 'afterBuild', 'restart', transition);
	  this.addState('afterBuild', 'sign', 'restart', transition);
	  this.addState('sign', 'send', 'retry', transition);
	  this.addState('retry', 'afterRetry', 'afterRetry', transition);
	  this.addState('afterRetry', 'sign', 'error', transition);
	  this.addState('send', 'validateResponse', 'retry', transition);
	  this.addState('validateResponse', 'extractData', 'extractError', transition);
	  this.addState('extractError', 'extractData', 'retry', transition);
	  this.addState('extractData', 'success', 'retry', transition);
	  this.addState('restart', 'build', 'error', transition);
	  this.addState('success', 'complete', 'complete', transition);
	  this.addState('error', 'complete', 'complete', transition);
	  this.addState('complete', null, null, transition);
	};
	fsm.setupStates();

	/**
	 * ## Asynchronous Requests
	 *
	 * All requests made through the SDK are asynchronous and use a
	 * callback interface. Each service method that kicks off a request
	 * returns an `AWS.Request` object that you can use to register
	 * callbacks.
	 *
	 * For example, the following service method returns the request
	 * object as "request", which can be used to register callbacks:
	 *
	 * ```javascript
	 * // request is an AWS.Request object
	 * var request = ec2.describeInstances();
	 *
	 * // register callbacks on request to retrieve response data
	 * request.on('success', function(response) {
	 *   console.log(response.data);
	 * });
	 * ```
	 *
	 * When a request is ready to be sent, the {send} method should
	 * be called:
	 *
	 * ```javascript
	 * request.send();
	 * ```
	 *
	 * ## Removing Default Listeners for Events
	 *
	 * Request objects are built with default listeners for the various events,
	 * depending on the service type. In some cases, you may want to remove
	 * some built-in listeners to customize behaviour. Doing this requires
	 * access to the built-in listener functions, which are exposed through
	 * the {AWS.EventListeners.Core} namespace. For instance, you may
	 * want to customize the HTTP handler used when sending a request. In this
	 * case, you can remove the built-in listener associated with the 'send'
	 * event, the {AWS.EventListeners.Core.SEND} listener and add your own.
	 *
	 * ## Multiple Callbacks and Chaining
	 *
	 * You can register multiple callbacks on any request object. The
	 * callbacks can be registered for different events, or all for the
	 * same event. In addition, you can chain callback registration, for
	 * example:
	 *
	 * ```javascript
	 * request.
	 *   on('success', function(response) {
	 *     console.log("Success!");
	 *   }).
	 *   on('error', function(response) {
	 *     console.log("Error!");
	 *   }).
	 *   on('complete', function(response) {
	 *     console.log("Always!");
	 *   }).
	 *   send();
	 * ```
	 *
	 * The above example will print either "Success! Always!", or "Error! Always!",
	 * depending on whether the request succeeded or not.
	 *
	 * @!attribute httpRequest
	 *   @readonly
	 *   @!group HTTP Properties
	 *   @return [AWS.HttpRequest] the raw HTTP request object
	 *     containing request headers and body information
	 *     sent by the service.
	 *
	 * @!attribute startTime
	 *   @readonly
	 *   @!group Operation Properties
	 *   @return [Date] the time that the request started
	 *
	 * @!group Request Building Events
	 *
	 * @!event validate(request)
	 *   Triggered when a request is being validated. Listeners
	 *   should throw an error if the request should not be sent.
	 *   @param request [Request] the request object being sent
	 *   @see AWS.EventListeners.Core.VALIDATE_CREDENTIALS
	 *   @see AWS.EventListeners.Core.VALIDATE_REGION
	 *   @example Ensuring that a certain parameter is set before sending a request
	 *     var req = s3.putObject(params);
	 *     req.on('validate', function() {
	 *       if (!req.params.Body.match(/^Hello\s/)) {
	 *         throw new Error('Body must start with "Hello "');
	 *       }
	 *     });
	 *     req.send(function(err, data) { ... });
	 *
	 * @!event build(request)
	 *   Triggered when the request payload is being built. Listeners
	 *   should fill the necessary information to send the request
	 *   over HTTP.
	 *   @param (see AWS.Request~validate)
	 *   @example Add a custom HTTP header to a request
	 *     var req = s3.putObject(params);
	 *     req.on('build', function() {
	 *       req.httpRequest.headers['Custom-Header'] = 'value';
	 *     });
	 *     req.send(function(err, data) { ... });
	 *
	 * @!event sign(request)
	 *   Triggered when the request is being signed. Listeners should
	 *   add the correct authentication headers and/or adjust the body,
	 *   depending on the authentication mechanism being used.
	 *   @param (see AWS.Request~validate)
	 *
	 * @!group Request Sending Events
	 *
	 * @!event send(response)
	 *   Triggered when the request is ready to be sent. Listeners
	 *   should call the underlying transport layer to initiate
	 *   the sending of the request.
	 *   @param response [Response] the response object
	 *   @context [Request] the request object that was sent
	 *   @see AWS.EventListeners.Core.SEND
	 *
	 * @!event retry(response)
	 *   Triggered when a request failed and might need to be retried or redirected.
	 *   If the response is retryable, the listener should set the
	 *   `response.error.retryable` property to `true`, and optionally set
	 *   `response.error.retryCount` to the millisecond delay for the next attempt.
	 *   In the case of a redirect, `response.error.redirect` should be set to
	 *   `true` with `retryCount` set to an optional delay on the next request.
	 *
	 *   If a listener decides that a request should not be retried,
	 *   it should set both `retryable` and `redirect` to false.
	 *
	 *   Note that a retryable error will be retried at most
	 *   {AWS.Config.maxRetries} times (based on the service object's config).
	 *   Similarly, a request that is redirected will only redirect at most
	 *   {AWS.Config.maxRedirects} times.
	 *
	 *   @param (see AWS.Request~send)
	 *   @context (see AWS.Request~send)
	 *   @example Adding a custom retry for a 404 response
	 *     request.on('retry', function(response) {
	 *       // this resource is not yet available, wait 10 seconds to get it again
	 *       if (response.httpResponse.statusCode === 404 && response.error) {
	 *         response.error.retryable = true;   // retry this error
	 *         response.error.retryCount = 10000; // wait 10 seconds
	 *       }
	 *     });
	 *
	 * @!group Data Parsing Events
	 *
	 * @!event extractError(response)
	 *   Triggered on all non-2xx requests so that listeners can extract
	 *   error details from the response body. Listeners to this event
	 *   should set the `response.error` property.
	 *   @param (see AWS.Request~send)
	 *   @context (see AWS.Request~send)
	 *
	 * @!event extractData(response)
	 *   Triggered in successful requests to allow listeners to
	 *   de-serialize the response body into `response.data`.
	 *   @param (see AWS.Request~send)
	 *   @context (see AWS.Request~send)
	 *
	 * @!group Completion Events
	 *
	 * @!event success(response)
	 *   Triggered when the request completed successfully.
	 *   `response.data` will contain the response data and
	 *   `response.error` will be null.
	 *   @param (see AWS.Request~send)
	 *   @context (see AWS.Request~send)
	 *
	 * @!event error(error, response)
	 *   Triggered when an error occurs at any point during the
	 *   request. `response.error` will contain details about the error
	 *   that occurred. `response.data` will be null.
	 *   @param error [Error] the error object containing details about
	 *     the error that occurred.
	 *   @param (see AWS.Request~send)
	 *   @context (see AWS.Request~send)
	 *
	 * @!event complete(response)
	 *   Triggered whenever a request cycle completes. `response.error`
	 *   should be checked, since the request may have failed.
	 *   @param (see AWS.Request~send)
	 *   @context (see AWS.Request~send)
	 *
	 * @!group HTTP Events
	 *
	 * @!event httpHeaders(statusCode, headers, response)
	 *   Triggered when headers are sent by the remote server
	 *   @param statusCode [Integer] the HTTP response code
	 *   @param headers [map<String,String>] the response headers
	 *   @param (see AWS.Request~send)
	 *   @context (see AWS.Request~send)
	 *
	 * @!event httpData(chunk, response)
	 *   Triggered when data is sent by the remote server
	 *   @param chunk [Buffer] the buffer data containing the next data chunk
	 *     from the server
	 *   @param (see AWS.Request~send)
	 *   @context (see AWS.Request~send)
	 *   @see AWS.EventListeners.Core.HTTP_DATA
	 *
	 * @!event httpUploadProgress(progress, response)
	 *   Triggered when the HTTP request has uploaded more data
	 *   @param progress [map] An object containing the `loaded` and `total` bytes
	 *     of the request.
	 *   @param (see AWS.Request~send)
	 *   @context (see AWS.Request~send)
	 *   @note This event will not be emitted in Node.js 0.8.x.
	 *
	 * @!event httpDownloadProgress(progress, response)
	 *   Triggered when the HTTP request has downloaded more data
	 *   @param progress [map] An object containing the `loaded` and `total` bytes
	 *     of the request.
	 *   @param (see AWS.Request~send)
	 *   @context (see AWS.Request~send)
	 *   @note This event will not be emitted in Node.js 0.8.x.
	 *
	 * @!event httpError(error, response)
	 *   Triggered when the HTTP request failed
	 *   @param error [Error] the error object that was thrown
	 *   @param (see AWS.Request~send)
	 *   @context (see AWS.Request~send)
	 *
	 * @!event httpDone(response)
	 *   Triggered when the server is finished sending data
	 *   @param (see AWS.Request~send)
	 *   @context (see AWS.Request~send)
	 *
	 * @see AWS.Response
	 */
	AWS.Request = inherit({

	  /**
	   * Creates a request for an operation on a given service with
	   * a set of input parameters.
	   *
	   * @param service [AWS.Service] the service to perform the operation on
	   * @param operation [String] the operation to perform on the service
	   * @param params [Object] parameters to send to the operation.
	   *   See the operation's documentation for the format of the
	   *   parameters.
	   */
	  constructor: function Request(service, operation, params) {
	    var endpoint = service.endpoint;
	    var region = service.config.region;

	    // global endpoints sign as us-east-1
	    if (service.isGlobalEndpoint) region = 'us-east-1';

	    this.domain = domain && domain.active;
	    this.service = service;
	    this.operation = operation;
	    this.params = params || {};
	    this.httpRequest = new AWS.HttpRequest(endpoint, region);
	    this.startTime = AWS.util.date.getDate();

	    this.response = new AWS.Response(this);
	    this._asm = new AcceptorStateMachine(fsm.states, 'validate');

	    AWS.SequentialExecutor.call(this);
	    this.emit = this.emitEvent;
	  },

	  /**
	   * @!group Sending a Request
	   */

	  /**
	   * @overload send(callback = null)
	   *   Sends the request object.
	   *
	   *   @callback callback function(err, data)
	   *     If a callback is supplied, it is called when a response is returned
	   *     from the service.
	   *     @context [AWS.Request] the request object being sent.
	   *     @param err [Error] the error object returned from the request.
	   *       Set to `null` if the request is successful.
	   *     @param data [Object] the de-serialized data returned from
	   *       the request. Set to `null` if a request error occurs.
	   *   @example Sending a request with a callback
	   *     request = s3.putObject({Bucket: 'bucket', Key: 'key'});
	   *     request.send(function(err, data) { console.log(err, data); });
	   *   @example Sending a request with no callback (using event handlers)
	   *     request = s3.putObject({Bucket: 'bucket', Key: 'key'});
	   *     request.on('complete', function(response) { ... }); // register a callback
	   *     request.send();
	   */
	  send: function send(callback) {
	    if (callback) {
	      this.on('complete', function (resp) {
	        callback.call(resp, resp.error, resp.data);
	      });
	    }
	    this.runTo();

	    return this.response;
	  },

	  /**
	   * @api private
	   */
	  build: function build(callback) {
	    return this.runTo('send', callback);
	  },

	  /**
	   * @api private
	   */
	  runTo: function runTo(state, done) {
	    this._asm.runTo(state, done, this);
	    return this;
	  },

	  /**
	   * Aborts a request, emitting the error and complete events.
	   *
	   * @!macro nobrowser
	   * @example Aborting a request after sending
	   *   var params = {
	   *     Bucket: 'bucket', Key: 'key',
	   *     Body: new Buffer(1024 * 1024 * 5) // 5MB payload
	   *   };
	   *   var request = s3.putObject(params);
	   *   request.send(function (err, data) {
	   *     if (err) console.log("Error:", err.code, err.message);
	   *     else console.log(data);
	   *   });
	   *
	   *   // abort request in 1 second
	   *   setTimeout(request.abort.bind(request), 1000);
	   *
	   *   // prints "Error: RequestAbortedError Request aborted by user"
	   * @return [AWS.Request] the same request object, for chaining.
	   * @since v1.4.0
	   */
	  abort: function abort() {
	    this.removeAllListeners('validateResponse');
	    this.removeAllListeners('extractError');
	    this.on('validateResponse', function addAbortedError(resp) {
	      resp.error = AWS.util.error(new Error('Request aborted by user'), {
	         code: 'RequestAbortedError', retryable: false
	      });
	    });

	    if (this.httpRequest.stream) { // abort HTTP stream
	      this.httpRequest.stream.abort();
	      if (this.httpRequest._abortCallback) {
	         this.httpRequest._abortCallback();
	      } else {
	        this.removeAllListeners('send'); // haven't sent yet, so let's not
	      }
	    }

	    return this;
	  },

	  /**
	   * Iterates over each page of results given a pageable request, calling
	   * the provided callback with each page of data. After all pages have been
	   * retrieved, the callback is called with `null` data.
	   *
	   * @note This operation can generate multiple requests to a service.
	   * @example Iterating over multiple pages of objects in an S3 bucket
	   *   var pages = 1;
	   *   s3.listObjects().eachPage(function(err, data) {
	   *     if (err) return;
	   *     console.log("Page", pages++);
	   *     console.log(data);
	   *   });
	   * @example Iterating over multiple pages with an asynchronous callback
	   *   s3.listObjects(params).eachPage(function(err, data, done) {
	   *     doSomethingAsyncAndOrExpensive(function() {
	   *       // The next page of results isn't fetched until done is called
	   *       done();
	   *     });
	   *   });
	   * @callback callback function(err, data, [doneCallback])
	   *   Called with each page of resulting data from the request. If the
	   *   optional `doneCallback` is provided in the function, it must be called
	   *   when the callback is complete.
	   *
	   *   @param err [Error] an error object, if an error occurred.
	   *   @param data [Object] a single page of response data. If there is no
	   *     more data, this object will be `null`.
	   *   @param doneCallback [Function] an optional done callback. If this
	   *     argument is defined in the function declaration, it should be called
	   *     when the next page is ready to be retrieved. This is useful for
	   *     controlling serial pagination across asynchronous operations.
	   *   @return [Boolean] if the callback returns `false`, pagination will
	   *     stop.
	   *
	   * @see AWS.Request.eachItem
	   * @see AWS.Response.nextPage
	   * @since v1.4.0
	   */
	  eachPage: function eachPage(callback) {
	    // Make all callbacks async-ish
	    callback = AWS.util.fn.makeAsync(callback, 3);

	    function wrappedCallback(response) {
	      callback.call(response, response.error, response.data, function (result) {
	        if (result === false) return;

	        if (response.hasNextPage()) {
	          response.nextPage().on('complete', wrappedCallback).send();
	        } else {
	          callback.call(response, null, null, AWS.util.fn.noop);
	        }
	      });
	    }

	    this.on('complete', wrappedCallback).send();
	  },

	  /**
	   * Enumerates over individual items of a request, paging the responses if
	   * necessary.
	   *
	   * @api experimental
	   * @since v1.4.0
	   */
	  eachItem: function eachItem(callback) {
	    var self = this;
	    function wrappedCallback(err, data) {
	      if (err) return callback(err, null);
	      if (data === null) return callback(null, null);

	      var config = self.service.paginationConfig(self.operation);
	      var resultKey = config.resultKey;
	      if (Array.isArray(resultKey)) resultKey = resultKey[0];
	      var results = AWS.util.jamespath.query(resultKey, data);
	      AWS.util.arrayEach(results, function(result) {
	        AWS.util.arrayEach(result, function(item) { callback(null, item); });
	      });
	    }

	    this.eachPage(wrappedCallback);
	  },

	  /**
	   * @return [Boolean] whether the operation can return multiple pages of
	   *   response data.
	   * @see AWS.Response.eachPage
	   * @since v1.4.0
	   */
	  isPageable: function isPageable() {
	    return this.service.paginationConfig(this.operation) ? true : false;
	  },

	  /**
	   * Converts the request object into a readable stream that
	   * can be read from or piped into a writable stream.
	   *
	   * @note The data read from a readable stream contains only
	   *   the raw HTTP body contents.
	   * @example Manually reading from a stream
	   *   request.createReadStream().on('data', function(data) {
	   *     console.log("Got data:", data.toString());
	   *   });
	   * @example Piping a request body into a file
	   *   var out = fs.createWriteStream('/path/to/outfile.jpg');
	   *   s3.service.getObject(params).createReadStream().pipe(out);
	   * @return [Stream] the readable stream object that can be piped
	   *   or read from (by registering 'data' event listeners).
	   * @!macro nobrowser
	   */
	  createReadStream: function createReadStream() {
	    var streams = AWS.util.nodeRequire('stream');
	    var req = this;
	    var stream = null;
	    var legacyStreams = false;

	    if (AWS.HttpClient.streamsApiVersion === 2) {
	      stream = new streams.Readable();
	      stream._read = function() {};
	    } else {
	      stream = new streams.Stream();
	      stream.readable = true;
	    }

	    stream.sent = false;
	    stream.on('newListener', function(event) {
	      if (!stream.sent && (event === 'data' || event === 'readable')) {
	        if (event === 'data') legacyStreams = true;
	        stream.sent = true;
	        process.nextTick(function() { req.send(function() { }); });
	      }
	    });

	    this.on('httpHeaders', function streamHeaders(statusCode, headers, resp) {
	      if (statusCode < 300) {
	        req.removeListener('httpData', AWS.EventListeners.Core.HTTP_DATA);
	        req.removeListener('httpError', AWS.EventListeners.Core.HTTP_ERROR);
	        req.on('httpError', function streamHttpError(error, resp) {
	          resp.error = error;
	          resp.error.retryable = false;
	        });

	        var httpStream = resp.httpResponse.createUnbufferedStream();
	        if (legacyStreams) {
	          httpStream.on('data', function(arg) {
	            stream.emit('data', arg);
	          });
	          httpStream.on('end', function() {
	            stream.emit('end');
	          });
	        } else {
	          httpStream.on('readable', function() {
	            var chunk;
	            do {
	              chunk = httpStream.read();
	              if (chunk !== null) stream.push(chunk);
	            } while (chunk !== null);
	            stream.read(0);
	          });
	          httpStream.on('end', function() {
	            stream.push(null);
	          });
	        }

	        httpStream.on('error', function(err) {
	          stream.emit('error', err);
	        });
	      }
	    });

	    this.on('error', function(err) {
	      stream.emit('error', err);
	    });

	    return stream;
	  },

	  /**
	   * @param [Array,Response] args This should be the response object,
	   *   or an array of args to send to the event.
	   * @api private
	   */
	  emitEvent: function emit(eventName, args, done) {
	    if (typeof args === 'function') { done = args; args = null; }
	    if (!done) done = function() { };
	    if (!args) args = this.eventParameters(eventName, this.response);

	    var origEmit = AWS.SequentialExecutor.prototype.emit;
	    origEmit.call(this, eventName, args, function (err) {
	      if (err) this.response.error = err;
	      done.call(this, err);
	    });
	  },

	  /**
	   * @api private
	   */
	  eventParameters: function eventParameters(eventName) {
	    switch (eventName) {
	      case 'restart':
	      case 'validate':
	      case 'sign':
	      case 'build':
	      case 'afterValidate':
	      case 'afterBuild':
	        return [this];
	      case 'error':
	        return [this.response.error, this.response];
	      default:
	        return [this.response];
	    }
	  },

	  /**
	   * @api private
	   */
	  presign: function presign(expires, callback) {
	    if (!callback && typeof expires === 'function') {
	      callback = expires;
	      expires = null;
	    }
	    return new AWS.Signers.Presign().sign(this.toGet(), expires, callback);
	  },

	  /**
	   * @api private
	   */
	  toUnauthenticated: function toUnauthenticated() {
	    this.removeListener('validate', AWS.EventListeners.Core.VALIDATE_CREDENTIALS);
	    this.removeListener('sign', AWS.EventListeners.Core.SIGN);
	    return this.toGet();
	  },

	  /**
	   * @api private
	   */
	  toGet: function toGet() {
	    if (this.service.api.protocol === 'query' ||
	        this.service.api.protocol === 'ec2') {
	      this.removeListener('build', this.buildAsGet);
	      this.addListener('build', this.buildAsGet);
	    }
	    return this;
	  },

	  /**
	   * @api private
	   */
	  buildAsGet: function buildAsGet(request) {
	    request.httpRequest.method = 'GET';
	    request.httpRequest.path = request.service.endpoint.path +
	                               '?' + request.httpRequest.body;
	    request.httpRequest.body = '';

	    // don't need these headers on a GET request
	    delete request.httpRequest.headers['Content-Length'];
	    delete request.httpRequest.headers['Content-Type'];
	  }
	});

	AWS.util.mixin(AWS.Request, AWS.SequentialExecutor);

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)))

/***/ },
/* 116 */
/***/ function(module, exports) {

	function AcceptorStateMachine(states, state) {
	  this.currentState = state || null;
	  this.states = states || {};
	}

	AcceptorStateMachine.prototype.runTo = function runTo(finalState, done, bindObject, inputError) {
	  if (typeof finalState === 'function') {
	    inputError = bindObject; bindObject = done;
	    done = finalState; finalState = null;
	  }

	  var self = this;
	  var state = self.states[self.currentState];
	  state.fn.call(bindObject || self, inputError, function(err) {
	    if (err) {
	      if (state.fail) self.currentState = state.fail;
	      else return done ? done.call(bindObject, err) : null;
	    } else {
	      if (state.accept) self.currentState = state.accept;
	      else return done ? done.call(bindObject) : null;
	    }
	    if (self.currentState === finalState) {
	      return done ? done.call(bindObject, err) : null;
	    }

	    self.runTo(finalState, done, bindObject, err);
	  });
	};

	AcceptorStateMachine.prototype.addState = function addState(name, acceptState, failState, fn) {
	  if (typeof acceptState === 'function') {
	    fn = acceptState; acceptState = null; failState = null;
	  } else if (typeof failState === 'function') {
	    fn = failState; failState = null;
	  }

	  if (!this.currentState) this.currentState = name;
	  this.states[name] = { accept: acceptState, fail: failState, fn: fn };
	  return this;
	};

	module.exports = AcceptorStateMachine;


/***/ },
/* 117 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copyright 2012-2013 Amazon.com, Inc. or its affiliates. All Rights Reserved.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License"). You
	 * may not use this file except in compliance with the License. A copy of
	 * the License is located at
	 *
	 *     http://aws.amazon.com/apache2.0/
	 *
	 * or in the "license" file accompanying this file. This file is
	 * distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
	 * ANY KIND, either express or implied. See the License for the specific
	 * language governing permissions and limitations under the License.
	 */

	var AWS = __webpack_require__(8);
	var inherit = AWS.util.inherit;

	/**
	 * @api private
	 */
	AWS.ResourceWaiter = inherit({
	  /**
	   * Waits for a given state on a service object
	   * @param service [Service] the service object to wait on
	   * @param state [String] the state (defined in waiter configuration) to wait
	   *   for.
	   * @example Create a waiter for running EC2 instances
	   *   var ec2 = new AWS.EC2;
	   *   var waiter = new AWS.ResourceWaiter(ec2, 'instanceRunning');
	   */
	  constructor: function constructor(service, state) {
	    this.service = service;
	    this.state = state;

	    if (typeof this.state === 'object') {
	      AWS.util.each.call(this, this.state, function (key, value) {
	        this.state = key;
	        this.expectedValue = value;
	      });
	    }

	    this.loadWaiterConfig(this.state);
	    if (!this.expectedValue) {
	      this.expectedValue = this.config.successValue;
	    }
	  },

	  service: null,

	  state: null,

	  expectedValue: null,

	  config: null,

	  waitDone: false,

	  Listeners: {
	    retry: new AWS.SequentialExecutor().addNamedListeners(function(add) {
	      add('RETRY_CHECK', 'retry', function(resp) {
	        var waiter = resp.request._waiter;
	        if (resp.error && resp.error.code === 'ResourceNotReady') {
	          resp.error.retryDelay = waiter.config.interval * 1000;
	        }
	      });
	    }),

	    output: new AWS.SequentialExecutor().addNamedListeners(function(add) {
	      add('CHECK_OUT_ERROR', 'extractError', function CHECK_OUT_ERROR(resp) {
	        if (resp.error) {
	          resp.request._waiter.setError(resp, true);
	        }
	      });

	      add('CHECK_OUTPUT', 'extractData', function CHECK_OUTPUT(resp) {
	        var waiter = resp.request._waiter;
	        var success = waiter.checkSuccess(resp);
	        if (!success) {
	          waiter.setError(resp, success === null ? false : true);
	        } else {
	          resp.error = null;
	        }
	      });
	    }),

	    error: new AWS.SequentialExecutor().addNamedListeners(function(add) {
	      add('CHECK_ERROR', 'extractError', function CHECK_ERROR(resp) {
	        var waiter = resp.request._waiter;
	        var success = waiter.checkError(resp);
	        if (!success) {
	          waiter.setError(resp, success === null ? false : true);
	        } else {
	          resp.error = null;
	          resp.data = {};
	          resp.request.removeAllListeners('extractData');
	        }
	      });

	      add('CHECK_ERR_OUTPUT', 'extractData', function CHECK_ERR_OUTPUT(resp) {
	        resp.request._waiter.setError(resp, true);
	      });
	    })
	  },

	  /**
	   * @return [AWS.Request]
	   */
	  wait: function wait(params, callback) {
	    if (typeof params === 'function') {
	      callback = params; params = undefined;
	    }

	    var request = this.service.makeRequest(this.config.operation, params);
	    var listeners = this.Listeners[this.config.successType];
	    request._waiter = this;
	    request.response.maxRetries = this.config.maxAttempts;
	    request.addListeners(this.Listeners.retry);
	    if (listeners) request.addListeners(listeners);

	    if (callback) request.send(callback);
	    return request;
	  },

	  setError: function setError(resp, retryable) {
	    resp.data = null;
	    resp.error = AWS.util.error(resp.error || new Error(), {
	      code: 'ResourceNotReady',
	      message: 'Resource is not in the state ' + this.state,
	      retryable: retryable
	    });
	  },

	  /**
	   * Checks if the terminal expected success state has been met
	   * @return [Boolean]
	   */
	  checkSuccess: function checkSuccess(resp) {
	    if (!this.config.successPath) {
	      return resp.httpResponse.statusCode < 300;
	    }

	    var r = AWS.util.jamespath.find(this.config.successPath, resp.data);

	    if (this.config.failureValue &&
	        this.config.failureValue.indexOf(r) >= 0) {
	      return null; // fast fail
	    }

	    if (this.expectedValue) {
	      return r === this.expectedValue;
	    } else {
	      return r ? true : false;
	    }
	  },

	  /**
	   * Checks if the terminal expected error state has been met
	   * @return [Boolean]
	   */
	  checkError: function checkError(resp) {
	    var value = this.config.successValue;
	    if (typeof value === 'number') {
	      return resp.httpResponse.statusCode === value;
	    } else {
	      return resp.error && resp.error.code === value;
	    }
	  },

	  /**
	   * Loads waiter configuration from API configuration and deals with inherited
	   * properties.
	   *
	   * @api private
	   */
	  loadWaiterConfig: function loadWaiterConfig(state, noException) {
	    if (!this.service.api.waiters[state]) {
	      if (noException) return;
	      throw new AWS.util.error(new Error(), {
	        code: 'StateNotFoundError',
	        message: 'State ' + state + ' not found.'
	      });
	    }

	    this.config = this.service.api.waiters[state];
	    var config = this.config;

	    // inherit acceptor data
	    (function () { // anonymous function to avoid max complexity count
	      config.successType = config.successType || config.acceptorType;
	      config.successPath = config.successPath || config.acceptorPath;
	      config.successValue = config.successValue || config.acceptorValue;
	      config.failureType = config.failureType || config.acceptorType;
	      config.failurePath = config.failurePath || config.acceptorPath;
	      config.failureValue = config.failureValue || config.acceptorValue;
	    })();
	  }
	});


/***/ },
/* 118 */
/***/ function(module, exports, __webpack_require__) {

	var AWS = __webpack_require__(8);
	var inherit = AWS.util.inherit;

	/**
	 * This class encapsulates the the response information
	 * from a service request operation sent through {AWS.Request}.
	 * The response object has two main properties for getting information
	 * back from a request:
	 *
	 * ## The `data` property
	 *
	 * The `response.data` property contains the serialized object data
	 * retrieved from the service request. For instance, for an
	 * Amazon DynamoDB `listTables` method call, the response data might
	 * look like:
	 *
	 * ```
	 * > resp.data
	 * { TableNames:
	 *    [ 'table1', 'table2', ... ] }
	 * ```
	 *
	 * The `data` property can be null if an error occurs (see below).
	 *
	 * ## The `error` property
	 *
	 * In the event of a service error (or transfer error), the
	 * `response.error` property will be filled with the given
	 * error data in the form:
	 *
	 * ```
	 * { code: 'SHORT_UNIQUE_ERROR_CODE',
	 *   message: 'Some human readable error message' }
	 * ```
	 *
	 * In the case of an error, the `data` property will be `null`.
	 * Note that if you handle events that can be in a failure state,
	 * you should always check whether `response.error` is set
	 * before attempting to access the `response.data` property.
	 *
	 * @!attribute data
	 *   @readonly
	 *   @!group Data Properties
	 *   @note Inside of a {AWS.Request~httpData} event, this
	 *     property contains a single raw packet instead of the
	 *     full de-serialized service response.
	 *   @return [Object] the de-serialized response data
	 *     from the service.
	 *
	 * @!attribute error
	 *   An structure containing information about a service
	 *   or networking error.
	 *   @readonly
	 *   @!group Data Properties
	 *   @note This attribute is only filled if a service or
	 *     networking error occurs.
	 *   @return [Error]
	 *     * code [String] a unique short code representing the
	 *       error that was emitted.
	 *     * message [String] a longer human readable error message
	 *     * retryable [Boolean] whether the error message is
	 *       retryable.
	 *     * statusCode [Numeric] in the case of a request that reached the service,
	 *       this value contains the response status code.
	 *     * time [Date] the date time object when the error occurred.
	 *     * hostname [String] set when a networking error occurs to easily
	 *       identify the endpoint of the request.
	 *     * region [String] set when a networking error occurs to easily
	 *       identify the region of the request.
	 *
	 * @!attribute requestId
	 *   @readonly
	 *   @!group Data Properties
	 *   @return [String] the unique request ID associated with the response.
	 *     Log this value when debugging requests for AWS support.
	 *
	 * @!attribute retryCount
	 *   @readonly
	 *   @!group Operation Properties
	 *   @return [Integer] the number of retries that were
	 *     attempted before the request was completed.
	 *
	 * @!attribute redirectCount
	 *   @readonly
	 *   @!group Operation Properties
	 *   @return [Integer] the number of redirects that were
	 *     followed before the request was completed.
	 *
	 * @!attribute httpResponse
	 *   @readonly
	 *   @!group HTTP Properties
	 *   @return [AWS.HttpResponse] the raw HTTP response object
	 *     containing the response headers and body information
	 *     from the server.
	 *
	 * @see AWS.Request
	 */
	AWS.Response = inherit({

	  /**
	   * @api private
	   */
	  constructor: function Response(request) {
	    this.request = request;
	    this.data = null;
	    this.error = null;
	    this.retryCount = 0;
	    this.redirectCount = 0;
	    this.httpResponse = new AWS.HttpResponse();
	    if (request) {
	      this.maxRetries = request.service.numRetries();
	      this.maxRedirects = request.service.config.maxRedirects;
	    }
	  },

	  /**
	   * Creates a new request for the next page of response data, calling the
	   * callback with the page data if a callback is provided.
	   *
	   * @callback callback function(err, data)
	   *   Called when a page of data is returned from the next request.
	   *
	   *   @param err [Error] an error object, if an error occurred in the request
	   *   @param data [Object] the next page of data, or null, if there are no
	   *     more pages left.
	   * @return [AWS.Request] the request object for the next page of data
	   * @return [null] if no callback is provided and there are no pages left
	   *   to retrieve.
	   * @since v1.4.0
	   */
	  nextPage: function nextPage(callback) {
	    var config;
	    var service = this.request.service;
	    var operation = this.request.operation;
	    try {
	      config = service.paginationConfig(operation, true);
	    } catch (e) { this.error = e; }

	    if (!this.hasNextPage()) {
	      if (callback) callback(this.error, null);
	      else if (this.error) throw this.error;
	      return null;
	    }

	    var params = AWS.util.copy(this.request.params);
	    if (!this.nextPageTokens) {
	      return callback ? callback(null, null) : null;
	    } else {
	      var inputTokens = config.inputToken;
	      if (typeof inputTokens === 'string') inputTokens = [inputTokens];
	      for (var i = 0; i < inputTokens.length; i++) {
	        params[inputTokens[i]] = this.nextPageTokens[i];
	      }
	      return service.makeRequest(this.request.operation, params, callback);
	    }
	  },

	  /**
	   * @return [Boolean] whether more pages of data can be returned by further
	   *   requests
	   * @since v1.4.0
	   */
	  hasNextPage: function hasNextPage() {
	    this.cacheNextPageTokens();
	    if (this.nextPageTokens) return true;
	    if (this.nextPageTokens === undefined) return undefined;
	    else return false;
	  },

	  /**
	   * @api private
	   */
	  cacheNextPageTokens: function cacheNextPageTokens() {
	    if (this.hasOwnProperty('nextPageTokens')) return this.nextPageTokens;
	    this.nextPageTokens = undefined;

	    var config = this.request.service.paginationConfig(this.request.operation);
	    if (!config) return this.nextPageTokens;

	    this.nextPageTokens = null;
	    if (config.moreResults) {
	      if (!AWS.util.jamespath.find(config.moreResults, this.data)) {
	        return this.nextPageTokens;
	      }
	    }

	    var exprs = config.outputToken;
	    if (typeof exprs === 'string') exprs = [exprs];
	    AWS.util.arrayEach.call(this, exprs, function (expr) {
	      var output = AWS.util.jamespath.find(expr, this.data);
	      if (output) {
	        this.nextPageTokens = this.nextPageTokens || [];
	        this.nextPageTokens.push(output);
	      }
	    });

	    return this.nextPageTokens;
	  }

	});


/***/ },
/* 119 */
/***/ function(module, exports, __webpack_require__) {

	var AWS = __webpack_require__(8);
	var Api = __webpack_require__(108);
	var regionConfig = __webpack_require__(113);
	var inherit = AWS.util.inherit;

	/**
	 * The service class representing an AWS service.
	 *
	 * @abstract
	 *
	 * @!attribute apiVersions
	 *   @return [Array<String>] the list of API versions supported by this service.
	 *   @readonly
	 */
	AWS.Service = inherit({
	  /**
	   * Create a new service object with a configuration object
	   *
	   * @param config [map] a map of configuration options
	   */
	  constructor: function Service(config) {
	    if (!this.loadServiceClass) {
	      throw AWS.util.error(new Error(),
	        'Service must be constructed with `new\' operator');
	    }
	    var ServiceClass = this.loadServiceClass(config || {});
	    if (ServiceClass) return new ServiceClass(config);
	    this.initialize(config);
	  },

	  /**
	   * @api private
	   */
	  initialize: function initialize(config) {
	    var svcConfig = AWS.config[this.serviceIdentifier];

	    this.config = new AWS.Config(AWS.config);
	    if (svcConfig) this.config.update(svcConfig, true);
	    if (config) this.config.update(config, true);

	    this.validateService();
	    if (!this.config.endpoint) regionConfig(this);

	    this.config.endpoint = this.endpointFromTemplate(this.config.endpoint);
	    this.setEndpoint(this.config.endpoint);
	  },

	  /**
	   * @api private
	   */
	  validateService: function validateService() {
	  },

	  /**
	   * @api private
	   */
	  loadServiceClass: function loadServiceClass(serviceConfig) {
	    var config = serviceConfig;
	    if (!AWS.util.isEmpty(this.api)) {
	      return null;
	    } else if (config.apiConfig) {
	      return AWS.Service.defineServiceApi(this.constructor, config.apiConfig);
	    } else if (!this.constructor.services) {
	      return null;
	    } else {
	      config = new AWS.Config(AWS.config);
	      config.update(serviceConfig, true);
	      var version = config.apiVersions[this.constructor.serviceIdentifier];
	      version = version || config.apiVersion;
	      return this.getLatestServiceClass(version);
	    }
	  },

	  /**
	   * @api private
	   */
	  getLatestServiceClass: function getLatestServiceClass(version) {
	    version = this.getLatestServiceVersion(version);
	    if (this.constructor.services[version] === null) {
	      AWS.Service.defineServiceApi(this.constructor, version);
	    }

	    return this.constructor.services[version];
	  },

	  /**
	   * @api private
	   */
	  getLatestServiceVersion: function getLatestServiceVersion(version) {
	    if (!this.constructor.services || this.constructor.services.length === 0) {
	      throw new Error('No services defined on ' +
	                      this.constructor.serviceIdentifier);
	    }

	    if (!version) {
	      version = 'latest';
	    } else if (AWS.util.isType(version, Date)) {
	      version = AWS.util.date.iso8601(version).split('T')[0];
	    }

	    if (Object.hasOwnProperty(this.constructor.services, version)) {
	      return version;
	    }

	    var keys = Object.keys(this.constructor.services).sort();
	    var selectedVersion = null;
	    for (var i = keys.length - 1; i >= 0; i--) {
	      // versions that end in "*" are not available on disk and can be
	      // skipped, so do not choose these as selectedVersions
	      if (keys[i][keys[i].length - 1] !== '*') {
	        selectedVersion = keys[i];
	      }
	      if (keys[i].substr(0, 10) <= version) {
	        return selectedVersion;
	      }
	    }

	    throw new Error('Could not find ' + this.constructor.serviceIdentifier +
	                    ' API to satisfy version constraint `' + version + '\'');
	  },

	  /**
	   * @api private
	   */
	  api: {},

	  /**
	   * @api private
	   */
	  defaultRetryCount: 3,

	  /**
	   * Calls an operation on a service with the given input parameters.
	   *
	   * @param operation [String] the name of the operation to call on the service.
	   * @param params [map] a map of input options for the operation
	   * @callback callback function(err, data)
	   *   If a callback is supplied, it is called when a response is returned
	   *   from the service.
	   *   @param err [Error] the error object returned from the request.
	   *     Set to `null` if the request is successful.
	   *   @param data [Object] the de-serialized data returned from
	   *     the request. Set to `null` if a request error occurs.
	   */
	  makeRequest: function makeRequest(operation, params, callback) {
	    if (typeof params === 'function') {
	      callback = params;
	      params = null;
	    }

	    params = params || {};
	    if (this.config.params) { // copy only toplevel bound params
	      var rules = this.api.operations[operation];
	      if (rules) {
	        params = AWS.util.copy(params);
	        AWS.util.each(this.config.params, function(key, value) {
	          if (rules.input.members[key]) {
	            if (params[key] === undefined || params[key] === null) {
	              params[key] = value;
	            }
	          }
	        });
	      }
	    }

	    var request = new AWS.Request(this, operation, params);
	    this.addAllRequestListeners(request);

	    if (callback) request.send(callback);
	    return request;
	  },

	  /**
	   * Calls an operation on a service with the given input parameters, without
	   * any authentication data. This method is useful for "public" API operations.
	   *
	   * @param operation [String] the name of the operation to call on the service.
	   * @param params [map] a map of input options for the operation
	   * @callback callback function(err, data)
	   *   If a callback is supplied, it is called when a response is returned
	   *   from the service.
	   *   @param err [Error] the error object returned from the request.
	   *     Set to `null` if the request is successful.
	   *   @param data [Object] the de-serialized data returned from
	   *     the request. Set to `null` if a request error occurs.
	   */
	  makeUnauthenticatedRequest: function makeUnauthenticatedRequest(operation, params, callback) {
	    if (typeof params === 'function') {
	      callback = params;
	      params = {};
	    }

	    var request = this.makeRequest(operation, params).toUnauthenticated();
	    return callback ? request.send(callback) : request;
	  },

	  /**
	   * Waits for a given state
	   *
	   * @param state [String] the state on the service to wait for
	   * @param params [map] a map of parameters to pass with each request
	   * @callback callback function(err, data)
	   *   If a callback is supplied, it is called when a response is returned
	   *   from the service.
	   *   @param err [Error] the error object returned from the request.
	   *     Set to `null` if the request is successful.
	   *   @param data [Object] the de-serialized data returned from
	   *     the request. Set to `null` if a request error occurs.
	   */
	  waitFor: function waitFor(state, params, callback) {
	    var waiter = new AWS.ResourceWaiter(this, state);
	    return waiter.wait(params, callback);
	  },

	  /**
	   * @api private
	   */
	  addAllRequestListeners: function addAllRequestListeners(request) {
	    var list = [AWS.events, AWS.EventListeners.Core, this.serviceInterface(),
	                AWS.EventListeners.CorePost];
	    for (var i = 0; i < list.length; i++) {
	      if (list[i]) request.addListeners(list[i]);
	    }

	    // disable parameter validation
	    if (!this.config.paramValidation) {
	      request.removeListener('validate',
	        AWS.EventListeners.Core.VALIDATE_PARAMETERS);
	    }

	    if (this.config.logger) { // add logging events
	      request.addListeners(AWS.EventListeners.Logger);
	    }

	    this.setupRequestListeners(request);
	  },

	  /**
	   * Override this method to setup any custom request listeners for each
	   * new request to the service.
	   *
	   * @abstract
	   */
	  setupRequestListeners: function setupRequestListeners() {
	  },

	  /**
	   * Gets the signer class for a given request
	   * @api private
	   */
	  getSignerClass: function getSignerClass() {
	    var version;
	    if (this.config.signatureVersion) {
	      version = this.config.signatureVersion;
	    } else {
	      version = this.api.signatureVersion;
	    }
	    return AWS.Signers.RequestSigner.getVersion(version);
	  },

	  /**
	   * @api private
	   */
	  serviceInterface: function serviceInterface() {
	    switch (this.api.protocol) {
	      case 'ec2': return AWS.EventListeners.Query;
	      case 'query': return AWS.EventListeners.Query;
	      case 'json': return AWS.EventListeners.Json;
	      case 'rest-json': return AWS.EventListeners.RestJson;
	      case 'rest-xml': return AWS.EventListeners.RestXml;
	    }
	    if (this.api.protocol) {
	      throw new Error('Invalid service `protocol\' ' +
	        this.api.protocol + ' in API config');
	    }
	  },

	  /**
	   * @api private
	   */
	  successfulResponse: function successfulResponse(resp) {
	    return resp.httpResponse.statusCode < 300;
	  },

	  /**
	   * How many times a failed request should be retried before giving up.
	   * the defaultRetryCount can be overriden by service classes.
	   *
	   * @api private
	   */
	  numRetries: function numRetries() {
	    if (this.config.maxRetries !== undefined) {
	      return this.config.maxRetries;
	    } else {
	      return this.defaultRetryCount;
	    }
	  },

	  /**
	   * @api private
	   */
	  retryDelays: function retryDelays() {
	    var retryCount = this.numRetries();
	    var delays = [];
	    for (var i = 0; i < retryCount; ++i) {
	      delays[i] = Math.pow(2, i) * 30;
	    }
	    return delays;
	  },

	  /**
	   * @api private
	   */
	  retryableError: function retryableError(error) {
	    if (this.networkingError(error)) return true;
	    if (this.expiredCredentialsError(error)) return true;
	    if (this.throttledError(error)) return true;
	    if (error.statusCode >= 500) return true;
	    return false;
	  },

	  /**
	   * @api private
	   */
	  networkingError: function networkingError(error) {
	    return error.code === 'NetworkingError';
	  },

	  /**
	   * @api private
	   */
	  expiredCredentialsError: function expiredCredentialsError(error) {
	    // TODO : this only handles *one* of the expired credential codes
	    return (error.code === 'ExpiredTokenException');
	  },

	  /**
	   * @api private
	   */
	  throttledError: function throttledError(error) {
	    // this logic varies between services
	    switch (error.code) {
	      case 'ProvisionedThroughputExceededException':
	      case 'Throttling':
	        return true;
	      default:
	        return false;
	    }
	  },

	  /**
	   * @api private
	   */
	  endpointFromTemplate: function endpointFromTemplate(endpoint) {
	    if (typeof endpoint !== 'string') return endpoint;

	    var e = endpoint;
	    e = e.replace(/\{service\}/g, this.api.endpointPrefix);
	    e = e.replace(/\{region\}/g, this.config.region);
	    e = e.replace(/\{scheme\}/g, this.config.sslEnabled ? 'https' : 'http');
	    return e;
	  },

	  /**
	   * @api private
	   */
	  setEndpoint: function setEndpoint(endpoint) {
	    this.endpoint = new AWS.Endpoint(endpoint, this.config);
	  },

	  /**
	   * @api private
	   */
	  paginationConfig: function paginationConfig(operation, throwException) {
	    var paginator = this.api.operations[operation].paginator;
	    if (!paginator) {
	      if (throwException) {
	        var e = new Error();
	        throw AWS.util.error(e, 'No pagination configuration for ' + operation);
	      }
	      return null;
	    }

	    return paginator;
	  }
	});

	AWS.util.update(AWS.Service, {

	  /**
	   * Adds one method for each operation described in the api configuration
	   *
	   * @api private
	   */
	  defineMethods: function defineMethods(svc) {
	    AWS.util.each(svc.prototype.api.operations, function iterator(method) {
	      if (svc.prototype[method]) return;
	      svc.prototype[method] = function (params, callback) {
	        return this.makeRequest(method, params, callback);
	      };
	    });
	  },

	  /**
	   * Defines a new Service class using a service identifier and list of versions
	   * including an optional set of features (functions) to apply to the class
	   * prototype.
	   *
	   * @param serviceIdentifier [String] the identifier for the service
	   * @param versions [Array<String>] a list of versions that work with this
	   *   service
	   * @param features [Object] an object to attach to the prototype
	   * @return [Class<Service>] the service class defined by this function.
	   */
	  defineService: function defineService(serviceIdentifier, versions, features) {
	    AWS.Service._serviceMap[serviceIdentifier] = true;
	    if (!Array.isArray(versions)) {
	      features = versions;
	      versions = [];
	    }

	    var svc = inherit(AWS.Service, features || {});

	    if (typeof serviceIdentifier === 'string') {
	      AWS.Service.addVersions(svc, versions);

	      var identifier = svc.serviceIdentifier || serviceIdentifier;
	      svc.serviceIdentifier = identifier;
	    } else { // defineService called with an API
	      svc.prototype.api = serviceIdentifier;
	      AWS.Service.defineMethods(svc);
	    }

	    return svc;
	  },

	  /**
	   * @api private
	   */
	  addVersions: function addVersions(svc, versions) {
	    if (!Array.isArray(versions)) versions = [versions];

	    svc.services = svc.services || {};
	    for (var i = 0; i < versions.length; i++) {
	      if (svc.services[versions[i]] === undefined) {
	        svc.services[versions[i]] = null;
	      }
	    }

	    svc.apiVersions = Object.keys(svc.services).sort();
	  },

	  /**
	   * @api private
	   */
	  defineServiceApi: function defineServiceApi(superclass, version, apiConfig) {
	    var svc = inherit(superclass, {
	      serviceIdentifier: superclass.serviceIdentifier
	    });

	    function setApi(api) {
	      if (api.isApi) {
	        svc.prototype.api = api;
	      } else {
	        svc.prototype.api = new Api(api);
	      }
	    }

	    if (typeof version === 'string') {
	      if (apiConfig) {
	        setApi(apiConfig);
	      } else {
	        try {
	          setApi(AWS.apiLoader(superclass.serviceIdentifier, version));
	        } catch (err) {
	          throw AWS.util.error(err, {
	            message: 'Could not find API configuration ' +
	              superclass.serviceIdentifier + '-' + version
	          });
	        }
	      }
	      if (!superclass.services.hasOwnProperty(version)) {
	        superclass.apiVersions = superclass.apiVersions.concat(version).sort();
	      }
	      superclass.services[version] = svc;
	    } else {
	      setApi(version);
	    }

	    AWS.Service.defineMethods(svc);
	    return svc;
	  },

	  /**
	   * @api private
	   */
	  hasService: function(identifier) {
	    return AWS.Service._serviceMap.hasOwnProperty(identifier);
	  },

	  /**
	   * @api private
	   */
	  _serviceMap: {}
	});


/***/ },
/* 120 */
/***/ function(module, exports, __webpack_require__) {

	var AWS = __webpack_require__(8);
	var inherit = AWS.util.inherit;

	/**
	 * @api private
	 */
	var expiresHeader = 'presigned-expires';

	/**
	 * @api private
	 */
	function signedUrlBuilder(request) {
	  var expires = request.httpRequest.headers[expiresHeader];

	  delete request.httpRequest.headers['User-Agent'];
	  delete request.httpRequest.headers['X-Amz-User-Agent'];

	  if (request.service.getSignerClass() === AWS.Signers.V4) {
	    if (expires > 604800) { // one week expiry is invalid
	      var message = 'Presigning does not support expiry time greater ' +
	                    'than a week with SigV4 signing.';
	      throw AWS.util.error(new Error(), {
	        code: 'InvalidExpiryTime', message: message, retryable: false
	      });
	    }
	    request.httpRequest.headers[expiresHeader] = expires;
	  } else if (request.service.getSignerClass() === AWS.Signers.S3) {
	    request.httpRequest.headers[expiresHeader] = parseInt(
	      AWS.util.date.unixTimestamp() + expires, 10).toString();
	  } else {
	    throw AWS.util.error(new Error(), {
	      message: 'Presigning only supports S3 or SigV4 signing.',
	      code: 'UnsupportedSigner', retryable: false
	    });
	  }
	}

	/**
	 * @api private
	 */
	function signedUrlSigner(request) {
	  var endpoint = request.httpRequest.endpoint;
	  var parsedUrl = AWS.util.urlParse(request.httpRequest.path);
	  var queryParams = {};

	  if (parsedUrl.search) {
	    queryParams = AWS.util.queryStringParse(parsedUrl.search.substr(1));
	  }

	  AWS.util.each(request.httpRequest.headers, function (key, value) {
	    if (key === expiresHeader) key = 'Expires';
	    queryParams[key] = value;
	  });
	  delete request.httpRequest.headers[expiresHeader];

	  var auth = queryParams['Authorization'].split(' ');
	  if (auth[0] === 'AWS') {
	    auth = auth[1].split(':');
	    queryParams['AWSAccessKeyId'] = auth[0];
	    queryParams['Signature'] = auth[1];
	  } else if (auth[0] === 'AWS4-HMAC-SHA256') { // SigV4 signing
	    auth.shift();
	    var rest = auth.join(' ');
	    var signature = rest.match(/Signature=(.*?)(?:,|\s|\r?\n|$)/)[1];
	    queryParams['X-Amz-Signature'] = signature;
	    delete queryParams['Expires'];
	  }
	  delete queryParams['Authorization'];
	  delete queryParams['Host'];

	  // build URL
	  endpoint.pathname = parsedUrl.pathname;
	  endpoint.search = AWS.util.queryParamsToString(queryParams);
	}

	/**
	 * @api private
	 */
	AWS.Signers.Presign = inherit({
	  /**
	   * @api private
	   */
	  sign: function sign(request, expireTime, callback) {
	    request.httpRequest.headers[expiresHeader] = expireTime || 3600;
	    request.on('build', signedUrlBuilder);
	    request.on('sign', signedUrlSigner);
	    request.removeListener('afterBuild',
	      AWS.EventListeners.Core.SET_CONTENT_LENGTH);

	    request.emit('beforePresign', [request]);

	    if (callback) {
	      request.build(function() {
	        if (this.response.error) callback(this.response.error);
	        else {
	          callback(null, AWS.util.urlFormat(request.httpRequest.endpoint));
	        }
	      });
	    } else {
	      request.build();
	      return AWS.util.urlFormat(request.httpRequest.endpoint);
	    }
	  }
	});

	module.exports = AWS.Signers.Presign;


/***/ },
/* 121 */
/***/ function(module, exports, __webpack_require__) {

	var AWS = __webpack_require__(8);
	var inherit = AWS.util.inherit;

	/**
	 * @api private
	 */
	AWS.Signers.RequestSigner = inherit({
	  constructor: function RequestSigner(request) {
	    this.request = request;
	  }
	});

	AWS.Signers.RequestSigner.getVersion = function getVersion(version) {
	  switch (version) {
	    case 'v2': return AWS.Signers.V2;
	    case 'v3': return AWS.Signers.V3;
	    case 'v4': return AWS.Signers.V4;
	    case 's3': return AWS.Signers.S3;
	    case 'v3https': return AWS.Signers.V3Https;
	  }
	  throw new Error('Unknown signing version ' + version);
	};

	__webpack_require__(122);
	__webpack_require__(123);
	__webpack_require__(124);
	__webpack_require__(125);
	__webpack_require__(126);
	__webpack_require__(120);


/***/ },
/* 122 */
/***/ function(module, exports, __webpack_require__) {

	var AWS = __webpack_require__(8);
	var inherit = AWS.util.inherit;

	/**
	 * @api private
	 */
	AWS.Signers.V2 = inherit(AWS.Signers.RequestSigner, {
	  addAuthorization: function addAuthorization(credentials, date) {

	    if (!date) date = AWS.util.date.getDate();

	    var r = this.request;

	    r.params.Timestamp = AWS.util.date.iso8601(date);
	    r.params.SignatureVersion = '2';
	    r.params.SignatureMethod = 'HmacSHA256';
	    r.params.AWSAccessKeyId = credentials.accessKeyId;

	    if (credentials.sessionToken) {
	      r.params.SecurityToken = credentials.sessionToken;
	    }

	    delete r.params.Signature; // delete old Signature for re-signing
	    r.params.Signature = this.signature(credentials);

	    r.body = AWS.util.queryParamsToString(r.params);
	    r.headers['Content-Length'] = r.body.length;
	  },

	  signature: function signature(credentials) {
	    return AWS.util.crypto.hmac(credentials.secretAccessKey, this.stringToSign(), 'base64');
	  },

	  stringToSign: function stringToSign() {
	    var parts = [];
	    parts.push(this.request.method);
	    parts.push(this.request.endpoint.host.toLowerCase());
	    parts.push(this.request.pathname());
	    parts.push(AWS.util.queryParamsToString(this.request.params));
	    return parts.join('\n');
	  }

	});

	module.exports = AWS.Signers.V2;


/***/ },
/* 123 */
/***/ function(module, exports, __webpack_require__) {

	var AWS = __webpack_require__(8);
	var inherit = AWS.util.inherit;

	/**
	 * @api private
	 */
	AWS.Signers.V3 = inherit(AWS.Signers.RequestSigner, {
	  addAuthorization: function addAuthorization(credentials, date) {

	    var datetime = AWS.util.date.rfc822(date);

	    this.request.headers['X-Amz-Date'] = datetime;

	    if (credentials.sessionToken) {
	      this.request.headers['x-amz-security-token'] = credentials.sessionToken;
	    }

	    this.request.headers['X-Amzn-Authorization'] =
	      this.authorization(credentials, datetime);

	  },

	  authorization: function authorization(credentials) {
	    return 'AWS3 ' +
	      'AWSAccessKeyId=' + credentials.accessKeyId + ',' +
	      'Algorithm=HmacSHA256,' +
	      'SignedHeaders=' + this.signedHeaders() + ',' +
	      'Signature=' + this.signature(credentials);
	  },

	  signedHeaders: function signedHeaders() {
	    var headers = [];
	    AWS.util.arrayEach(this.headersToSign(), function iterator(h) {
	      headers.push(h.toLowerCase());
	    });
	    return headers.sort().join(';');
	  },

	  canonicalHeaders: function canonicalHeaders() {
	    var headers = this.request.headers;
	    var parts = [];
	    AWS.util.arrayEach(this.headersToSign(), function iterator(h) {
	      parts.push(h.toLowerCase().trim() + ':' + String(headers[h]).trim());
	    });
	    return parts.sort().join('\n') + '\n';
	  },

	  headersToSign: function headersToSign() {
	    var headers = [];
	    AWS.util.each(this.request.headers, function iterator(k) {
	      if (k === 'Host' || k === 'Content-Encoding' || k.match(/^X-Amz/i)) {
	        headers.push(k);
	      }
	    });
	    return headers;
	  },

	  signature: function signature(credentials) {
	    return AWS.util.crypto.hmac(credentials.secretAccessKey, this.stringToSign(), 'base64');
	  },

	  stringToSign: function stringToSign() {
	    var parts = [];
	    parts.push(this.request.method);
	    parts.push('/');
	    parts.push('');
	    parts.push(this.canonicalHeaders());
	    parts.push(this.request.body);
	    return AWS.util.crypto.sha256(parts.join('\n'));
	  }

	});

	module.exports = AWS.Signers.V3;


/***/ },
/* 124 */
/***/ function(module, exports, __webpack_require__) {

	var AWS = __webpack_require__(8);
	var inherit = AWS.util.inherit;

	__webpack_require__(123);

	/**
	 * @api private
	 */
	AWS.Signers.V3Https = inherit(AWS.Signers.V3, {
	  authorization: function authorization(credentials) {
	    return 'AWS3-HTTPS ' +
	      'AWSAccessKeyId=' + credentials.accessKeyId + ',' +
	      'Algorithm=HmacSHA256,' +
	      'Signature=' + this.signature(credentials);
	  },

	  stringToSign: function stringToSign() {
	    return this.request.headers['X-Amz-Date'];
	  }
	});

	module.exports = AWS.Signers.V3Https;


/***/ },
/* 125 */
/***/ function(module, exports, __webpack_require__) {

	var AWS = __webpack_require__(8);
	var inherit = AWS.util.inherit;

	/**
	 * @api private
	 */
	var cachedSecret = {};

	/**
	 * @api private
	 */
	var expiresHeader = 'presigned-expires';

	/**
	 * @api private
	 */
	AWS.Signers.V4 = inherit(AWS.Signers.RequestSigner, {
	  constructor: function V4(request, serviceName) {
	    AWS.Signers.RequestSigner.call(this, request);
	    this.serviceName = serviceName;
	  },

	  algorithm: 'AWS4-HMAC-SHA256',

	  addAuthorization: function addAuthorization(credentials, date) {
	    var datetime = AWS.util.date.iso8601(date).replace(/[:\-]|\.\d{3}/g, '');

	    if (this.isPresigned()) {
	      this.updateForPresigned(credentials, datetime);
	    } else {
	      this.addHeaders(credentials, datetime);
	      this.updateBody(credentials);
	    }

	    this.request.headers['Authorization'] =
	      this.authorization(credentials, datetime);
	  },

	  addHeaders: function addHeaders(credentials, datetime) {
	    this.request.headers['X-Amz-Date'] = datetime;
	    if (credentials.sessionToken) {
	      this.request.headers['x-amz-security-token'] = credentials.sessionToken;
	    }
	  },

	  updateBody: function updateBody(credentials) {
	    if (this.request.params) {
	      this.request.params.AWSAccessKeyId = credentials.accessKeyId;

	      if (credentials.sessionToken) {
	        this.request.params.SecurityToken = credentials.sessionToken;
	      }

	      this.request.body = AWS.util.queryParamsToString(this.request.params);
	      this.request.headers['Content-Length'] = this.request.body.length;
	    }
	  },

	  updateForPresigned: function updateForPresigned(credentials, datetime) {
	    var credString = this.credentialString(datetime);
	    var qs = {
	      'X-Amz-Date': datetime,
	      'X-Amz-Algorithm': this.algorithm,
	      'X-Amz-Credential': credentials.accessKeyId + '/' + credString,
	      'X-Amz-Expires': this.request.headers[expiresHeader],
	      'X-Amz-SignedHeaders': this.signedHeaders()
	    };

	    if (credentials.sessionToken) {
	      qs['X-Amz-Security-Token'] = credentials.sessionToken;
	    }

	    if (this.request.headers['Content-Type']) {
	      qs['Content-Type'] = this.request.headers['Content-Type'];
	    }

	    // need to pull in any other X-Amz-* headers
	    AWS.util.each.call(this, this.request.headers, function(key, value) {
	      if (key === expiresHeader) return;
	      if (this.isSignableHeader(key) &&
	          key.toLowerCase().indexOf('x-amz-') === 0) {
	        qs[key] = value;
	      }
	    });

	    var sep = this.request.path.indexOf('?') >= 0 ? '&' : '?';
	    this.request.path += sep + AWS.util.queryParamsToString(qs);
	  },

	  authorization: function authorization(credentials, datetime) {
	    var parts = [];
	    var credString = this.credentialString(datetime);
	    parts.push(this.algorithm + ' Credential=' +
	      credentials.accessKeyId + '/' + credString);
	    parts.push('SignedHeaders=' + this.signedHeaders());
	    parts.push('Signature=' + this.signature(credentials, datetime));
	    return parts.join(', ');
	  },

	  signature: function signature(credentials, datetime) {
	    var cache = cachedSecret[this.serviceName];
	    var date = datetime.substr(0, 8);
	    if (!cache ||
	        cache.akid !== credentials.accessKeyId ||
	        cache.region !== this.request.region ||
	        cache.date !== date) {
	      var kSecret = credentials.secretAccessKey;
	      var kDate = AWS.util.crypto.hmac('AWS4' + kSecret, date, 'buffer');
	      var kRegion = AWS.util.crypto.hmac(kDate, this.request.region, 'buffer');
	      var kService = AWS.util.crypto.hmac(kRegion, this.serviceName, 'buffer');
	      var kCredentials = AWS.util.crypto.hmac(kService, 'aws4_request', 'buffer');
	      cachedSecret[this.serviceName] = {
	        region: this.request.region, date: date,
	        key: kCredentials, akid: credentials.accessKeyId
	      };
	    }

	    var key = cachedSecret[this.serviceName].key;
	    return AWS.util.crypto.hmac(key, this.stringToSign(datetime), 'hex');
	  },

	  stringToSign: function stringToSign(datetime) {
	    var parts = [];
	    parts.push('AWS4-HMAC-SHA256');
	    parts.push(datetime);
	    parts.push(this.credentialString(datetime));
	    parts.push(this.hexEncodedHash(this.canonicalString()));
	    return parts.join('\n');
	  },

	  canonicalString: function canonicalString() {
	    var parts = [], pathname = this.request.pathname();
	    if (this.serviceName !== 's3') pathname = AWS.util.uriEscapePath(pathname);

	    parts.push(this.request.method);
	    parts.push(pathname);
	    parts.push(this.request.search());
	    parts.push(this.canonicalHeaders() + '\n');
	    parts.push(this.signedHeaders());
	    parts.push(this.hexEncodedBodyHash());
	    return parts.join('\n');
	  },

	  canonicalHeaders: function canonicalHeaders() {
	    var headers = [];
	    AWS.util.each.call(this, this.request.headers, function (key, item) {
	      headers.push([key, item]);
	    });
	    headers.sort(function (a, b) {
	      return a[0].toLowerCase() < b[0].toLowerCase() ? -1 : 1;
	    });
	    var parts = [];
	    AWS.util.arrayEach.call(this, headers, function (item) {
	      var key = item[0].toLowerCase();
	      if (this.isSignableHeader(key)) {
	        parts.push(key + ':' +
	          this.canonicalHeaderValues(item[1].toString()));
	      }
	    });
	    return parts.join('\n');
	  },

	  canonicalHeaderValues: function canonicalHeaderValues(values) {
	    return values.replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
	  },

	  signedHeaders: function signedHeaders() {
	    var keys = [];
	    AWS.util.each.call(this, this.request.headers, function (key) {
	      key = key.toLowerCase();
	      if (this.isSignableHeader(key)) keys.push(key);
	    });
	    return keys.sort().join(';');
	  },

	  credentialString: function credentialString(datetime) {
	    var parts = [];
	    parts.push(datetime.substr(0, 8));
	    parts.push(this.request.region);
	    parts.push(this.serviceName);
	    parts.push('aws4_request');
	    return parts.join('/');
	  },

	  hexEncodedHash: function hash(string) {
	    return AWS.util.crypto.sha256(string, 'hex');
	  },

	  hexEncodedBodyHash: function hexEncodedBodyHash() {
	    if (this.isPresigned() && this.serviceName === 's3') {
	      return 'UNSIGNED-PAYLOAD';
	    } else if (this.request.headers['X-Amz-Content-Sha256']) {
	      return this.request.headers['X-Amz-Content-Sha256'];
	    } else {
	      return this.hexEncodedHash(this.request.body || '');
	    }
	  },

	  unsignableHeaders: ['authorization', 'content-type', 'content-length',
	                      'user-agent', expiresHeader],

	  isSignableHeader: function isSignableHeader(key) {
	    if (key.toLowerCase().indexOf('x-amz-') === 0) return true;
	    return this.unsignableHeaders.indexOf(key) < 0;
	  },

	  isPresigned: function isPresigned() {
	    return this.request.headers[expiresHeader] ? true : false;
	  }

	});

	module.exports = AWS.Signers.V4;


/***/ },
/* 126 */
/***/ function(module, exports, __webpack_require__) {

	var AWS = __webpack_require__(8);
	var inherit = AWS.util.inherit;

	/**
	 * @api private
	 */
	AWS.Signers.S3 = inherit(AWS.Signers.RequestSigner, {
	  /**
	   * When building the stringToSign, these sub resource params should be
	   * part of the canonical resource string with their NON-decoded values
	   */
	  subResources: {
	    'acl': 1,
	    'cors': 1,
	    'lifecycle': 1,
	    'delete': 1,
	    'location': 1,
	    'logging': 1,
	    'notification': 1,
	    'partNumber': 1,
	    'policy': 1,
	    'requestPayment': 1,
	    'restore': 1,
	    'tagging': 1,
	    'torrent': 1,
	    'uploadId': 1,
	    'uploads': 1,
	    'versionId': 1,
	    'versioning': 1,
	    'versions': 1,
	    'website': 1
	  },

	  // when building the stringToSign, these querystring params should be
	  // part of the canonical resource string with their NON-encoded values
	  responseHeaders: {
	    'response-content-type': 1,
	    'response-content-language': 1,
	    'response-expires': 1,
	    'response-cache-control': 1,
	    'response-content-disposition': 1,
	    'response-content-encoding': 1
	  },

	  addAuthorization: function addAuthorization(credentials, date) {
	    if (!this.request.headers['presigned-expires']) {
	      this.request.headers['X-Amz-Date'] = AWS.util.date.rfc822(date);
	    }

	    if (credentials.sessionToken) {
	      // presigned URLs require this header to be lowercased
	      this.request.headers['x-amz-security-token'] = credentials.sessionToken;
	    }

	    var signature = this.sign(credentials.secretAccessKey, this.stringToSign());
	    var auth = 'AWS ' + credentials.accessKeyId + ':' + signature;

	    this.request.headers['Authorization'] = auth;
	  },

	  stringToSign: function stringToSign() {
	    var r = this.request;

	    var parts = [];
	    parts.push(r.method);
	    parts.push(r.headers['Content-MD5'] || '');
	    parts.push(r.headers['Content-Type'] || '');

	    // This is the "Date" header, but we use X-Amz-Date.
	    // The S3 signing mechanism requires us to pass an empty
	    // string for this Date header regardless.
	    parts.push(r.headers['presigned-expires'] || '');

	    var headers = this.canonicalizedAmzHeaders();
	    if (headers) parts.push(headers);
	    parts.push(this.canonicalizedResource());

	    return parts.join('\n');

	  },

	  canonicalizedAmzHeaders: function canonicalizedAmzHeaders() {

	    var amzHeaders = [];

	    AWS.util.each(this.request.headers, function (name) {
	      if (name.match(/^x-amz-/i))
	        amzHeaders.push(name);
	    });

	    amzHeaders.sort(function (a, b) {
	      return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
	    });

	    var parts = [];
	    AWS.util.arrayEach.call(this, amzHeaders, function (name) {
	      parts.push(name.toLowerCase() + ':' + String(this.request.headers[name]));
	    });

	    return parts.join('\n');

	  },

	  canonicalizedResource: function canonicalizedResource() {

	    var r = this.request;

	    var parts = r.path.split('?');
	    var path = parts[0];
	    var querystring = parts[1];

	    var resource = '';

	    if (r.virtualHostedBucket)
	      resource += '/' + r.virtualHostedBucket;

	    resource += path;

	    if (querystring) {

	      // collect a list of sub resources and query params that need to be signed
	      var resources = [];

	      AWS.util.arrayEach.call(this, querystring.split('&'), function (param) {
	        var name = param.split('=')[0];
	        var value = param.split('=')[1];
	        if (this.subResources[name] || this.responseHeaders[name]) {
	          var subresource = { name: name };
	          if (value !== undefined) {
	            if (this.subResources[name]) {
	              subresource.value = value;
	            } else {
	              subresource.value = decodeURIComponent(value);
	            }
	          }
	          resources.push(subresource);
	        }
	      });

	      resources.sort(function (a, b) { return a.name < b.name ? -1 : 1; });

	      if (resources.length) {

	        querystring = [];
	        AWS.util.arrayEach(resources, function (resource) {
	          if (resource.value === undefined)
	            querystring.push(resource.name);
	          else
	            querystring.push(resource.name + '=' + resource.value);
	        });

	        resource += '?' + querystring.join('&');
	      }

	    }

	    return resource;

	  },

	  sign: function sign(secret, string) {
	    return AWS.util.crypto.hmac(secret, string, 'base64', 'sha1');
	  }
	});

	module.exports = AWS.Signers.S3;


/***/ },
/* 127 */
/***/ function(module, exports, __webpack_require__) {

	var util = __webpack_require__(9);
	var Shape = __webpack_require__(37);

	function DomXmlParser() { }

	DomXmlParser.prototype.parse = function(xml, shape) {
	  if (xml.replace(/^\s+/, '') === '') return {};

	  var result, error;
	  try {
	    if (window.DOMParser) {
	      try {
	        var parser = new DOMParser();
	        result = parser.parseFromString(xml, 'text/xml');
	      } catch (syntaxError) {
	        throw util.error(new Error('Parse error in document'),
	          {originalError: syntaxError});
	      }

	      if (result.documentElement === null) {
	        throw new Error('Cannot parse empty document.');
	      }

	      var isError = result.getElementsByTagName('parsererror')[0];
	      if (isError && (isError.parentNode === result ||
	          isError.parentNode.nodeName === 'body')) {
	        throw new Error(isError.getElementsByTagName('div')[0].textContent);
	      }
	    } else if (window.ActiveXObject) {
	      result = new window.ActiveXObject('Microsoft.XMLDOM');
	      result.async = false;

	      if (!result.loadXML(xml)) {
	        throw new Error('Parse error in document');
	      }
	    } else {
	      throw new Error('Cannot load XML parser');
	    }
	  } catch (e) {
	    error = e;
	  }

	  if (result && result.documentElement && !error) {
	    var data = parseXml(result.documentElement, shape);
	    var metadata = result.getElementsByTagName('ResponseMetadata')[0];
	    if (metadata) {
	      data.ResponseMetadata = parseXml(metadata, {});
	    }
	    return data;
	  } else if (error) {
	    throw util.error(error || new Error(), {code: 'XMLParserError'});
	  } else { // empty xml document
	    return {};
	  }
	};

	function parseXml(xml, shape) {
	  if (!shape) shape = {};
	  switch (shape.type) {
	    case 'structure': return parseStructure(xml, shape);
	    case 'map': return parseMap(xml, shape);
	    case 'list': return parseList(xml, shape);
	    case undefined: case null: return parseUnknown(xml);
	    default: return parseScalar(xml, shape);
	  }
	}

	function parseStructure(xml, shape) {
	  var data = {};
	  if (xml === null) return data;

	  util.each(shape.members, function(memberName, memberShape) {
	    if (memberShape.isXmlAttribute) {
	      if (xml.attributes.hasOwnProperty(memberShape.name)) {
	        var value = xml.attributes[memberShape.name].value;
	        data[memberName] = parseXml({textContent: value}, memberShape);
	      }
	    } else {
	      var xmlChild = memberShape.flattened ? xml :
	        xml.getElementsByTagName(memberShape.name)[0];
	      if (xmlChild) {
	        data[memberName] = parseXml(xmlChild, memberShape);
	      } else if (!memberShape.flattened && memberShape.type === 'list') {
	        data[memberName] = memberShape.defaultValue;
	      }
	    }
	  });

	  return data;
	}

	function parseMap(xml, shape) {
	  var data = {};
	  var xmlKey = shape.key.name || 'key';
	  var xmlValue = shape.value.name || 'value';
	  var tagName = shape.flattened ? shape.name : 'entry';

	  var child = xml.firstElementChild;
	  while (child) {
	    if (child.nodeName === tagName) {
	      var key = child.getElementsByTagName(xmlKey)[0].textContent;
	      var value = child.getElementsByTagName(xmlValue)[0];
	      data[key] = parseXml(value, shape.value);
	    }
	    child = child.nextElementSibling;
	  }
	  return data;
	}

	function parseList(xml, shape) {
	  var data = [];
	  var tagName = shape.flattened ? shape.name : (shape.member.name || 'member');

	  var child = xml.firstElementChild;
	  while (child) {
	    if (child.nodeName === tagName) {
	      data.push(parseXml(child, shape.member));
	    }
	    child = child.nextElementSibling;
	  }
	  return data;
	}

	function parseScalar(xml, shape) {
	  if (xml.getAttribute) {
	    var encoding = xml.getAttribute('encoding');
	    if (encoding === 'base64') {
	      shape = new Shape.create({type: encoding});
	    }
	  }

	  var text = xml.textContent;
	  if (text === '') text = null;
	  if (typeof shape.toType === 'function') {
	    return shape.toType(text);
	  } else {
	    return text;
	  }
	}

	function parseUnknown(xml) {
	  if (xml === undefined || xml === null) return '';

	  // empty object
	  if (!xml.firstElementChild) {
	    if (xml.parentNode.parentNode === null) return {};
	    if (xml.childNodes.length === 0) return '';
	    else return xml.textContent;
	  }

	  // object, parse as structure
	  var shape = {type: 'structure', members: {}};
	  var child = xml.firstElementChild;
	  while (child) {
	    var tag = child.nodeName;
	    if (shape.members.hasOwnProperty(tag)) {
	      // multiple tags of the same name makes it a list
	      shape.members[tag].type = 'list';
	    } else {
	      shape.members[tag] = {name: tag};
	    }
	    child = child.nextElementSibling;
	  }
	  return parseStructure(xml, shape);
	}

	module.exports = DomXmlParser;


/***/ },
/* 128 */
/***/ function(module, exports, __webpack_require__) {

	var util = __webpack_require__(9);
	var builder = __webpack_require__(129);

	function XmlBuilder() { }

	XmlBuilder.prototype.toXML = function(params, shape, rootElement) {
	  var xml = builder.create(rootElement);
	  applyNamespaces(xml, shape);
	  serialize(xml, params, shape);
	  return xml.children.length === 0 ? '' : xml.root().toString();
	};

	function serialize(xml, value, shape) {
	  switch (shape.type) {
	    case 'structure': return serializeStructure(xml, value, shape);
	    case 'map': return serializeMap(xml, value, shape);
	    case 'list': return serializeList(xml, value, shape);
	    default: return serializeScalar(xml, value, shape);
	  }
	}

	function serializeStructure(xml, params, shape) {
	  util.arrayEach(shape.memberNames, function(memberName) {
	    var memberShape = shape.members[memberName];
	    if (memberShape.location !== 'body') return;

	    var value = params[memberName];
	    var name = memberShape.name;
	    if (value !== undefined && value !== null) {
	      if (memberShape.isXmlAttribute) {
	        xml.att(name, value);
	      } else if (memberShape.flattened) {
	        serialize(xml, value, memberShape);
	      } else {
	        var element = xml.ele(name);
	        applyNamespaces(element, memberShape);
	        serialize(element, value, memberShape);
	      }
	    }
	  });
	}

	function serializeMap(xml, map, shape) {
	  var xmlKey = shape.key.name || 'key';
	  var xmlValue = shape.value.name || 'value';

	  util.each(map, function(key, value) {
	    var entry = xml.ele(shape.flattened ? shape.name : 'entry');
	    serialize(entry.ele(xmlKey), key, shape.key);
	    serialize(entry.ele(xmlValue), value, shape.value);
	  });
	}

	function serializeList(xml, list, shape) {
	  if (shape.flattened) {
	    util.arrayEach(list, function(value) {
	      var name = shape.member.name || shape.name;
	      var element = xml.ele(name);
	      serialize(element, value, shape.member);
	    });
	  } else {
	    util.arrayEach(list, function(value) {
	      var name = shape.member.name || 'member';
	      var element = xml.ele(name);
	      serialize(element, value, shape.member);
	    });
	  }
	}

	function serializeScalar(xml, value, shape) {
	  xml.txt(shape.toWireFormat(value));
	}

	function applyNamespaces(xml, shape) {
	  var uri, prefix = 'xmlns';
	  if (shape.xmlNamespaceUri) {
	    uri = shape.xmlNamespaceUri;
	    if (shape.xmlNamespacePrefix) prefix += ':' + shape.xmlNamespacePrefix;
	  } else if (xml.isRoot && shape.api.xmlNamespaceUri) {
	    uri = shape.api.xmlNamespaceUri;
	  }

	  if (uri) xml.att(prefix, uri);
	}

	module.exports = XmlBuilder;


/***/ },
/* 129 */
/***/ function(module, exports, __webpack_require__) {

	// Generated by CoffeeScript 1.3.3
	(function() {
	  var XMLBuilder;

	  XMLBuilder = __webpack_require__(130);

	  module.exports.create = function(name, xmldec, doctype) {
	    if (name != null) {
	      return new XMLBuilder(name, xmldec, doctype).root();
	    } else {
	      return new XMLBuilder();
	    }
	  };

	}).call(this);


/***/ },
/* 130 */
/***/ function(module, exports, __webpack_require__) {

	// Generated by CoffeeScript 1.3.3
	(function() {
	  var XMLBuilder, XMLFragment;

	  XMLFragment = __webpack_require__(131);

	  XMLBuilder = (function() {

	    function XMLBuilder(name, xmldec, doctype) {
	      var att, child, _ref;
	      this.children = [];
	      this.rootObject = null;
	      if (this.is(name, 'Object')) {
	        _ref = [name, xmldec], xmldec = _ref[0], doctype = _ref[1];
	        name = null;
	      }
	      if (name != null) {
	        name = '' + name || '';
	        if (xmldec == null) {
	          xmldec = {
	            'version': '1.0'
	          };
	        }
	      }
	      if ((xmldec != null) && !(xmldec.version != null)) {
	        throw new Error("Version number is required");
	      }
	      if (xmldec != null) {
	        xmldec.version = '' + xmldec.version || '';
	        if (!xmldec.version.match(/1\.[0-9]+/)) {
	          throw new Error("Invalid version number: " + xmldec.version);
	        }
	        att = {
	          version: xmldec.version
	        };
	        if (xmldec.encoding != null) {
	          xmldec.encoding = '' + xmldec.encoding || '';
	          if (!xmldec.encoding.match(/[A-Za-z](?:[A-Za-z0-9._-]|-)*/)) {
	            throw new Error("Invalid encoding: " + xmldec.encoding);
	          }
	          att.encoding = xmldec.encoding;
	        }
	        if (xmldec.standalone != null) {
	          att.standalone = xmldec.standalone ? "yes" : "no";
	        }
	        child = new XMLFragment(this, '?xml', att);
	        this.children.push(child);
	      }
	      if (doctype != null) {
	        att = {};
	        if (name != null) {
	          att.name = name;
	        }
	        if (doctype.ext != null) {
	          doctype.ext = '' + doctype.ext || '';
	          att.ext = doctype.ext;
	        }
	        child = new XMLFragment(this, '!DOCTYPE', att);
	        this.children.push(child);
	      }
	      if (name != null) {
	        this.begin(name);
	      }
	    }

	    XMLBuilder.prototype.begin = function(name, xmldec, doctype) {
	      var doc, root;
	      if (!(name != null)) {
	        throw new Error("Root element needs a name");
	      }
	      if (this.rootObject) {
	        this.children = [];
	        this.rootObject = null;
	      }
	      if (xmldec != null) {
	        doc = new XMLBuilder(name, xmldec, doctype);
	        return doc.root();
	      }
	      name = '' + name || '';
	      root = new XMLFragment(this, name, {});
	      root.isRoot = true;
	      root.documentObject = this;
	      this.children.push(root);
	      this.rootObject = root;
	      return root;
	    };

	    XMLBuilder.prototype.root = function() {
	      return this.rootObject;
	    };

	    XMLBuilder.prototype.end = function(options) {
	      return toString(options);
	    };

	    XMLBuilder.prototype.toString = function(options) {
	      var child, r, _i, _len, _ref;
	      r = '';
	      _ref = this.children;
	      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
	        child = _ref[_i];
	        r += child.toString(options);
	      }
	      return r;
	    };

	    XMLBuilder.prototype.is = function(obj, type) {
	      var clas;
	      clas = Object.prototype.toString.call(obj).slice(8, -1);
	      return (obj != null) && clas === type;
	    };

	    return XMLBuilder;

	  })();

	  module.exports = XMLBuilder;

	}).call(this);


/***/ },
/* 131 */
/***/ function(module, exports) {

	// Generated by CoffeeScript 1.3.3
	(function() {
	  var XMLFragment,
	    __hasProp = {}.hasOwnProperty;

	  XMLFragment = (function() {

	    function XMLFragment(parent, name, attributes, text) {
	      this.isRoot = false;
	      this.documentObject = null;
	      this.parent = parent;
	      this.name = name;
	      this.attributes = attributes;
	      this.value = text;
	      this.children = [];
	    }

	    XMLFragment.prototype.element = function(name, attributes, text) {
	      var child, key, val, _ref, _ref1;
	      if (!(name != null)) {
	        throw new Error("Missing element name");
	      }
	      name = '' + name || '';
	      this.assertLegalChar(name);
	      if (attributes == null) {
	        attributes = {};
	      }
	      if (this.is(attributes, 'String') && this.is(text, 'Object')) {
	        _ref = [text, attributes], attributes = _ref[0], text = _ref[1];
	      } else if (this.is(attributes, 'String')) {
	        _ref1 = [{}, attributes], attributes = _ref1[0], text = _ref1[1];
	      }
	      for (key in attributes) {
	        if (!__hasProp.call(attributes, key)) continue;
	        val = attributes[key];
	        val = '' + val || '';
	        attributes[key] = this.escape(val);
	      }
	      child = new XMLFragment(this, name, attributes);
	      if (text != null) {
	        text = '' + text || '';
	        text = this.escape(text);
	        this.assertLegalChar(text);
	        child.raw(text);
	      }
	      this.children.push(child);
	      return child;
	    };

	    XMLFragment.prototype.insertBefore = function(name, attributes, text) {
	      var child, i, key, val, _ref, _ref1;
	      if (this.isRoot) {
	        throw new Error("Cannot insert elements at root level");
	      }
	      if (!(name != null)) {
	        throw new Error("Missing element name");
	      }
	      name = '' + name || '';
	      this.assertLegalChar(name);
	      if (attributes == null) {
	        attributes = {};
	      }
	      if (this.is(attributes, 'String') && this.is(text, 'Object')) {
	        _ref = [text, attributes], attributes = _ref[0], text = _ref[1];
	      } else if (this.is(attributes, 'String')) {
	        _ref1 = [{}, attributes], attributes = _ref1[0], text = _ref1[1];
	      }
	      for (key in attributes) {
	        if (!__hasProp.call(attributes, key)) continue;
	        val = attributes[key];
	        val = '' + val || '';
	        attributes[key] = this.escape(val);
	      }
	      child = new XMLFragment(this.parent, name, attributes);
	      if (text != null) {
	        text = '' + text || '';
	        text = this.escape(text);
	        this.assertLegalChar(text);
	        child.raw(text);
	      }
	      i = this.parent.children.indexOf(this);
	      this.parent.children.splice(i, 0, child);
	      return child;
	    };

	    XMLFragment.prototype.insertAfter = function(name, attributes, text) {
	      var child, i, key, val, _ref, _ref1;
	      if (this.isRoot) {
	        throw new Error("Cannot insert elements at root level");
	      }
	      if (!(name != null)) {
	        throw new Error("Missing element name");
	      }
	      name = '' + name || '';
	      this.assertLegalChar(name);
	      if (attributes == null) {
	        attributes = {};
	      }
	      if (this.is(attributes, 'String') && this.is(text, 'Object')) {
	        _ref = [text, attributes], attributes = _ref[0], text = _ref[1];
	      } else if (this.is(attributes, 'String')) {
	        _ref1 = [{}, attributes], attributes = _ref1[0], text = _ref1[1];
	      }
	      for (key in attributes) {
	        if (!__hasProp.call(attributes, key)) continue;
	        val = attributes[key];
	        val = '' + val || '';
	        attributes[key] = this.escape(val);
	      }
	      child = new XMLFragment(this.parent, name, attributes);
	      if (text != null) {
	        text = '' + text || '';
	        text = this.escape(text);
	        this.assertLegalChar(text);
	        child.raw(text);
	      }
	      i = this.parent.children.indexOf(this);
	      this.parent.children.splice(i + 1, 0, child);
	      return child;
	    };

	    XMLFragment.prototype.remove = function() {
	      var i, _ref;
	      if (this.isRoot) {
	        throw new Error("Cannot remove the root element");
	      }
	      i = this.parent.children.indexOf(this);
	      [].splice.apply(this.parent.children, [i, i - i + 1].concat(_ref = [])), _ref;
	      return this.parent;
	    };

	    XMLFragment.prototype.text = function(value) {
	      var child;
	      if (!(value != null)) {
	        throw new Error("Missing element text");
	      }
	      value = '' + value || '';
	      value = this.escape(value);
	      this.assertLegalChar(value);
	      child = new XMLFragment(this, '', {}, value);
	      this.children.push(child);
	      return this;
	    };

	    XMLFragment.prototype.cdata = function(value) {
	      var child;
	      if (!(value != null)) {
	        throw new Error("Missing CDATA text");
	      }
	      value = '' + value || '';
	      this.assertLegalChar(value);
	      if (value.match(/]]>/)) {
	        throw new Error("Invalid CDATA text: " + value);
	      }
	      child = new XMLFragment(this, '', {}, '<![CDATA[' + value + ']]>');
	      this.children.push(child);
	      return this;
	    };

	    XMLFragment.prototype.comment = function(value) {
	      var child;
	      if (!(value != null)) {
	        throw new Error("Missing comment text");
	      }
	      value = '' + value || '';
	      value = this.escape(value);
	      this.assertLegalChar(value);
	      if (value.match(/--/)) {
	        throw new Error("Comment text cannot contain double-hypen: " + value);
	      }
	      child = new XMLFragment(this, '', {}, '<!-- ' + value + ' -->');
	      this.children.push(child);
	      return this;
	    };

	    XMLFragment.prototype.raw = function(value) {
	      var child;
	      if (!(value != null)) {
	        throw new Error("Missing raw text");
	      }
	      value = '' + value || '';
	      child = new XMLFragment(this, '', {}, value);
	      this.children.push(child);
	      return this;
	    };

	    XMLFragment.prototype.up = function() {
	      if (this.isRoot) {
	        throw new Error("This node has no parent. Use doc() if you need to get the document object.");
	      }
	      return this.parent;
	    };

	    XMLFragment.prototype.root = function() {
	      var child;
	      if (this.isRoot) {
	        return this;
	      }
	      child = this.parent;
	      while (!child.isRoot) {
	        child = child.parent;
	      }
	      return child;
	    };

	    XMLFragment.prototype.document = function() {
	      return this.root().documentObject;
	    };

	    XMLFragment.prototype.end = function(options) {
	      return this.document().toString(options);
	    };

	    XMLFragment.prototype.prev = function() {
	      var i;
	      if (this.isRoot) {
	        throw new Error("Root node has no siblings");
	      }
	      i = this.parent.children.indexOf(this);
	      if (i < 1) {
	        throw new Error("Already at the first node");
	      }
	      return this.parent.children[i - 1];
	    };

	    XMLFragment.prototype.next = function() {
	      var i;
	      if (this.isRoot) {
	        throw new Error("Root node has no siblings");
	      }
	      i = this.parent.children.indexOf(this);
	      if (i === -1 || i === this.parent.children.length - 1) {
	        throw new Error("Already at the last node");
	      }
	      return this.parent.children[i + 1];
	    };

	    XMLFragment.prototype.clone = function(deep) {
	      var clonedSelf;
	      clonedSelf = new XMLFragment(this.parent, this.name, this.attributes, this.value);
	      if (deep) {
	        this.children.forEach(function(child) {
	          var clonedChild;
	          clonedChild = child.clone(deep);
	          clonedChild.parent = clonedSelf;
	          return clonedSelf.children.push(clonedChild);
	        });
	      }
	      return clonedSelf;
	    };

	    XMLFragment.prototype.importXMLBuilder = function(xmlbuilder) {
	      var clonedRoot;
	      clonedRoot = xmlbuilder.root().clone(true);
	      clonedRoot.parent = this;
	      this.children.push(clonedRoot);
	      clonedRoot.isRoot = false;
	      return this;
	    };

	    XMLFragment.prototype.attribute = function(name, value) {
	      var _ref;
	      if (!(name != null)) {
	        throw new Error("Missing attribute name");
	      }
	      if (!(value != null)) {
	        throw new Error("Missing attribute value");
	      }
	      name = '' + name || '';
	      value = '' + value || '';
	      if ((_ref = this.attributes) == null) {
	        this.attributes = {};
	      }
	      this.attributes[name] = this.escape(value);
	      return this;
	    };

	    XMLFragment.prototype.removeAttribute = function(name) {
	      if (!(name != null)) {
	        throw new Error("Missing attribute name");
	      }
	      name = '' + name || '';
	      delete this.attributes[name];
	      return this;
	    };

	    XMLFragment.prototype.toString = function(options, level) {
	      var attName, attValue, child, indent, newline, pretty, r, space, _i, _len, _ref, _ref1;
	      pretty = (options != null) && options.pretty || false;
	      indent = (options != null) && options.indent || '  ';
	      newline = (options != null) && options.newline || '\n';
	      level || (level = 0);
	      space = new Array(level + 1).join(indent);
	      r = '';
	      if (pretty) {
	        r += space;
	      }
	      if (!(this.value != null)) {
	        r += '<' + this.name;
	      } else {
	        r += '' + this.value;
	      }
	      _ref = this.attributes;
	      for (attName in _ref) {
	        attValue = _ref[attName];
	        if (this.name === '!DOCTYPE') {
	          r += ' ' + attValue;
	        } else {
	          r += ' ' + attName + '="' + attValue + '"';
	        }
	      }
	      if (this.children.length === 0) {
	        if (!(this.value != null)) {
	          r += this.name === '?xml' ? '?>' : this.name === '!DOCTYPE' ? '>' : '/>';
	        }
	        if (pretty) {
	          r += newline;
	        }
	      } else if (pretty && this.children.length === 1 && this.children[0].value) {
	        r += '>';
	        r += this.children[0].value;
	        r += '</' + this.name + '>';
	        r += newline;
	      } else {
	        r += '>';
	        if (pretty) {
	          r += newline;
	        }
	        _ref1 = this.children;
	        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
	          child = _ref1[_i];
	          r += child.toString(options, level + 1);
	        }
	        if (pretty) {
	          r += space;
	        }
	        r += '</' + this.name + '>';
	        if (pretty) {
	          r += newline;
	        }
	      }
	      return r;
	    };

	    XMLFragment.prototype.escape = function(str) {
	      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&apos;').replace(/"/g, '&quot;');
	    };

	    XMLFragment.prototype.assertLegalChar = function(str) {
	      var chars, chr;
	      chars = /[\u0000-\u0008\u000B-\u000C\u000E-\u001F\uD800-\uDFFF\uFFFE-\uFFFF]/;
	      chr = str.match(chars);
	      if (chr) {
	        throw new Error("Invalid character (" + chr + ") in string: " + str);
	      }
	    };

	    XMLFragment.prototype.is = function(obj, type) {
	      var clas;
	      clas = Object.prototype.toString.call(obj).slice(8, -1);
	      return (obj != null) && clas === type;
	    };

	    XMLFragment.prototype.ele = function(name, attributes, text) {
	      return this.element(name, attributes, text);
	    };

	    XMLFragment.prototype.txt = function(value) {
	      return this.text(value);
	    };

	    XMLFragment.prototype.dat = function(value) {
	      return this.cdata(value);
	    };

	    XMLFragment.prototype.att = function(name, value) {
	      return this.attribute(name, value);
	    };

	    XMLFragment.prototype.com = function(value) {
	      return this.comment(value);
	    };

	    XMLFragment.prototype.doc = function() {
	      return this.document();
	    };

	    XMLFragment.prototype.e = function(name, attributes, text) {
	      return this.element(name, attributes, text);
	    };

	    XMLFragment.prototype.t = function(value) {
	      return this.text(value);
	    };

	    XMLFragment.prototype.d = function(value) {
	      return this.cdata(value);
	    };

	    XMLFragment.prototype.a = function(name, value) {
	      return this.attribute(name, value);
	    };

	    XMLFragment.prototype.c = function(value) {
	      return this.comment(value);
	    };

	    XMLFragment.prototype.r = function(value) {
	      return this.raw(value);
	    };

	    XMLFragment.prototype.u = function() {
	      return this.up();
	    };

	    return XMLFragment;

	  })();

	  module.exports = XMLFragment;

	}).call(this);


/***/ },
/* 132 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	exports.decode = exports.parse = __webpack_require__(133);
	exports.encode = exports.stringify = __webpack_require__(134);


/***/ },
/* 133 */
/***/ function(module, exports) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	'use strict';

	// If obj.hasOwnProperty has been overridden, then calling
	// obj.hasOwnProperty(prop) will break.
	// See: https://github.com/joyent/node/issues/1707
	function hasOwnProperty(obj, prop) {
	  return Object.prototype.hasOwnProperty.call(obj, prop);
	}

	module.exports = function(qs, sep, eq, options) {
	  sep = sep || '&';
	  eq = eq || '=';
	  var obj = {};

	  if (typeof qs !== 'string' || qs.length === 0) {
	    return obj;
	  }

	  var regexp = /\+/g;
	  qs = qs.split(sep);

	  var maxKeys = 1000;
	  if (options && typeof options.maxKeys === 'number') {
	    maxKeys = options.maxKeys;
	  }

	  var len = qs.length;
	  // maxKeys <= 0 means that we should not limit keys count
	  if (maxKeys > 0 && len > maxKeys) {
	    len = maxKeys;
	  }

	  for (var i = 0; i < len; ++i) {
	    var x = qs[i].replace(regexp, '%20'),
	        idx = x.indexOf(eq),
	        kstr, vstr, k, v;

	    if (idx >= 0) {
	      kstr = x.substr(0, idx);
	      vstr = x.substr(idx + 1);
	    } else {
	      kstr = x;
	      vstr = '';
	    }

	    k = decodeURIComponent(kstr);
	    v = decodeURIComponent(vstr);

	    if (!hasOwnProperty(obj, k)) {
	      obj[k] = v;
	    } else if (isArray(obj[k])) {
	      obj[k].push(v);
	    } else {
	      obj[k] = [obj[k], v];
	    }
	  }

	  return obj;
	};

	var isArray = Array.isArray || function (xs) {
	  return Object.prototype.toString.call(xs) === '[object Array]';
	};


/***/ },
/* 134 */
/***/ function(module, exports) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	'use strict';

	var stringifyPrimitive = function(v) {
	  switch (typeof v) {
	    case 'string':
	      return v;

	    case 'boolean':
	      return v ? 'true' : 'false';

	    case 'number':
	      return isFinite(v) ? v : '';

	    default:
	      return '';
	  }
	};

	module.exports = function(obj, sep, eq, name) {
	  sep = sep || '&';
	  eq = eq || '=';
	  if (obj === null) {
	    obj = undefined;
	  }

	  if (typeof obj === 'object') {
	    return map(objectKeys(obj), function(k) {
	      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
	      if (isArray(obj[k])) {
	        return map(obj[k], function(v) {
	          return ks + encodeURIComponent(stringifyPrimitive(v));
	        }).join(sep);
	      } else {
	        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
	      }
	    }).join(sep);

	  }

	  if (!name) return '';
	  return encodeURIComponent(stringifyPrimitive(name)) + eq +
	         encodeURIComponent(stringifyPrimitive(obj));
	};

	var isArray = Array.isArray || function (xs) {
	  return Object.prototype.toString.call(xs) === '[object Array]';
	};

	function map (xs, f) {
	  if (xs.map) return xs.map(f);
	  var res = [];
	  for (var i = 0; i < xs.length; i++) {
	    res.push(f(xs[i], i));
	  }
	  return res;
	}

	var objectKeys = Object.keys || function (obj) {
	  var res = [];
	  for (var key in obj) {
	    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
	  }
	  return res;
	};


/***/ },
/* 135 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(__dirname) {;(function(wsp){
		var Gun = __webpack_require__(3)
		, formidable = __webpack_require__(136)
		, ws = __webpack_require__(144).Server
		, http = __webpack_require__(145)
		, url = __webpack_require__(67);
		Gun.on('opt').event(function(gun, opt){
			gun.__.opt.ws = opt.ws = gun.__.opt.ws || opt.ws || {};
			gun.attach = gun.attach || function(app){
				if(app.use){
					app.use(gun.server);
				}
				var listen = app.listen;
				app.listen = function(port){
					var server = listen.apply(app, arguments);
					gun.__.opt.ws.server = gun.__.opt.ws.server || opt.ws.server || server;
					gun.__.opt.ws.path = gun.__.opt.ws.path || opt.ws.path || '/gun';
					__webpack_require__(146)(gun.server.websocket = gun.server.websocket || new ws(gun.__.opt.ws), function(req, res){
						var ws = this;
						req.headers['gun-sid'] = ws.sid = ws.sid? ws.sid : req.headers['gun-sid'];
						ws.sub = ws.sub || gun.server.on('network').event(function(msg){
							if(!ws || !ws.send || !ws._socket || !ws._socket.writable){ return this.off() }
							if(!msg || (msg.headers && msg.headers['gun-sid'] === ws.sid)){ return }
							if(msg && msg.headers){ delete msg.headers['ws-rid'] }
							// TODO: BUG? ^ What if other peers want to ack? Do they use the ws-rid or a gun declared id?
							try{ws.send(Gun.text.ify(msg));
							}catch(e){} // juuuust in case. 
						});
						gun.__.opt.hooks.transport(req, res);
					});
					gun.__.opt.ws.port = port || opt.ws.port || gun.__.opt.ws.port || 80;
					return server;
				}
				return gun;
			}
			gun.server = gun.server || function(req, res, next){ // http
				//Gun.log("\n\n GUN SERVER!", req);
				next = next || function(){};
				if(!req || !res){ return next(), false }
				if(!req.url){ return next(), false }
				if(!req.method){ return next(), false }
				var msg = {};
				msg.url = url.parse(req.url, true);
				if(!gun.server.regex.test(msg.url.pathname)){ return next(), false }
				if(msg.url.pathname.replace(gun.server.regex,'').slice(0,3).toLowerCase() === '.js'){
					res.writeHead(200, {'Content-Type': 'text/javascript'});
					res.end(gun.server.js = gun.server.js || __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"fs\""); e.code = 'MODULE_NOT_FOUND'; throw e; }())).readFileSync(__dirname + '/../gun.js')); // gun server is caching the gun library for the client
					return true;
				}
				return http(req, res, function(req, res){
					if(!req){ return next() }
					var tab, cb = res = __webpack_require__(147)(req, res);
					if(req.headers && (tab = req.headers['gun-sid'])){
						tab = (gun.server.peers = gun.server.peers || {})[tab] = gun.server.peers[tab] || {sid: tab};
						tab.sub = tab.sub || gun.server.on('network').event(function(req){
							if(!tab){ return this.off() } // self cleans up after itself!
							if(!req || (req.headers && req.headers['gun-sid'] === tab.sid)){ return }
							(tab.queue = tab.queue || []).push(req);
							tab.drain(tab.reply);
						});
						cb = function(r){ (r.headers||{}).poll = gun.__.opt.poll; res(r) }
						tab.drain = tab.drain || function(res){
							if(!res || !tab || !tab.queue || !tab.queue.length){ return }
							res({headers: {'gun-sid': tab.sid}, body: tab.queue });
							tab.off = setTimeout(function(){ tab = null }, gun.__.opt.pull);
							tab.reply = tab.queue = null;
							return true;
						}
						clearTimeout(tab.off);
						if(req.headers.pull){
							if(tab.drain(cb)){ return }
							return tab.reply = cb;
						}
					}
					gun.__.opt.hooks.transport(req, cb);
				}), true;
			}
			gun.server.on = gun.server.on || Gun.on.create();
			gun.__.opt.poll = gun.__.opt.poll || opt.poll || 1;
			gun.__.opt.pull = gun.__.opt.pull || opt.pull || gun.__.opt.poll * 1000;
			gun.server.regex = gun.__.opt.route = gun.__.opt.route || opt.route || /^\/gun/i;
			if((gun.__.opt.maxSockets = opt.maxSockets || gun.__.opt.maxSockets) !== false){
				__webpack_require__(61).globalAgent.maxSockets = __webpack_require__(62).globalAgent.maxSockets = gun.__.opt.maxSockets || Infinity; // WARNING: Document this!
			}
			/* gun.server.xff = function(r){
				if(!r){ return '' }
				var req = {headers: r.headers || {}, connection: r.connection || {}, socket: r.socket || {}};
				return req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || (req.connection.socket || {}).remoteAddress || '';
			} */
			gun.server.transport = gun.server.transport || (function(){
				// all streams, technically PATCH but implemented as PUT or POST, are forwarded to other trusted peers
				// except for the ones that are listed in the message as having already been sending to.
				// all states, implemented with GET, are replied to the source that asked for it.
				function tran(req, cb){
					req.method = req.body? 'put' : 'get'; // put or get is based on whether there is a body or not
					req.url.key = req.url.pathname.replace(gun.server.regex,'').replace(/^\//i,'') || '';
					if('get' == req.method){ return tran.get(req, cb) }
					if('put' == req.method || 'post' == req.method){ return tran.put(req, cb) }
					cb({body: {hello: 'world'}});
				}
				tran.get = function(req, cb){
					var key = req.url.key
					, reply = {headers: {'Content-Type': tran.json}};
					//console.log(req);
					/* NTS HACK! SHOULD BE ITS OWN ISOLATED MODULE! */
					if(req && req.url && req.url.pathname && req.url.pathname.indexOf('gun.nts') >= 0){
						return cb({headers: reply.headers, body: {time: Gun.time.is() }});
					}
					/* NTS END! SHOULD HAVE BEEN ITS OWN MODULE */
					if(req && req.url && Gun.obj.has(req.url.query, '*')){
						return gun.all(req.url.key + req.url.search, function(err, list){
							cb({headers: reply.headers, body: (err? (err.err? err : {err: err || "Unknown error."}) : list || null ) })
						});
					}
					if(!key){
						if(!Gun.obj.has(req.url.query, Gun._.soul)){
							return cb({headers: reply.headers, body: {err: "No key or soul to get."}});
						}
						key = {};
						key[Gun._.soul] = req.url.query[Gun._.soul];
					}
					console.log("tran.get", key);
					gun.get(key, function(err, graph){
						//tran.sub.scribe(req.tab, graph._[Gun._.soul]);
						//console.log("tran.get", key, "<---", err, graph);
						if(err || !graph){
							return cb({headers: reply.headers, body: (err? (err.err? err : {err: err || "Unknown error."}) : null)});
						}
						if(Gun.obj.empty(graph)){ return cb({headers: reply.headers, body: graph}) } // we're out of stuff!
						
						/*
						(function(chunks){// FEATURE! Stream chunks if the nodes are large!
							var max = 10;
							Gun.is.graph(graph, function(node, soul){
								var chunk = {};
								if(Object.keys(node).length > max){
									var count = 0, n = Gun.union.pseudo(soul);
									Gun.obj.map(node, function(val, field){
										if(!(++count % max)){
											console.log("Sending chunk", chunk);
											cb({headers: reply.headers, chunk: chunk});
											n = Gun.union.pseudo(soul);
											chunk = {};
										}
										chunk[soul] = n;
										n[field] = val;
										(n._[Gun._.HAM] = n._[Gun._.HAM] || {})[field] = ((node._||{})[Gun._.HAM]||{})[field];
									});
									if(count % max){ // finish off the last chunk
										cb({headers: reply.headers, chunk: chunk});
									}
								} else {
									chunk[soul] = node;
									console.log("Send BLOB", chunk);
									cb({headers: reply.headers, chunk: chunk});
								}
							});
						}([]));
						*/
						cb({headers: reply.headers, chunk: graph }); // Use this if you don't want streaming chunks feature.
					});
				}
				tran.put = function(req, cb){
					// NOTE: It is highly recommended you do your own PUT/POSTs through your own API that then saves to gun manually.
					// This will give you much more fine-grain control over security, transactions, and what not.
					var reply = {headers: {'Content-Type': tran.json}};
					if(!req.body){ return cb({headers: reply.headers, body: {err: "No body"}}) }
					gun.server.on('network').emit(Gun.obj.copy(req));
					if(tran.put.key(req, cb)){ return }
					// some NEW code that should get revised.
					if(Gun.is.node(req.body) || Gun.is.graph(req.body)){
						//console.log("tran.put", req.body);					
						if(req.err = Gun.union(gun, req.body, function(err, ctx){ // TODO: BUG? Probably should give me ctx.graph
							if(err){ return cb({headers: reply.headers, body: {err: err || "Union failed."}}) }
							var ctx = ctx || {}; ctx.graph = {};
							Gun.is.graph(req.body, function(node, soul){
								ctx.graph[soul] = gun.__.graph[soul]; // TODO: BUG? Probably should be delta fields
							});
							(gun.__.opt.hooks.put || function(g,cb){cb("No save.")})(ctx.graph, function(err, ok){
								if(err){ return cb({headers: reply.headers, body: {err: err || "Failed."}}) }
								cb({headers: reply.headers, body: {ok: ok || "Persisted."}});
							});
						}).err){ cb({headers: reply.headers, body: {err: req.err || "Union failed."}}) }
					}
				}
				tran.put.key = function(req, cb){ // key hook!
					if(!req || !req.url || !req.url.key || !Gun.obj.has(req.body, Gun._.soul)){ return }
					var index = req.url.key, soul = Gun.is.soul(req.body);
					console.log("tran.key", index, req.body);
					gun.key(index, function(err, reply){
						if(err){ return cb({headers: {'Content-Type': tran.json}, body: {err: err}}) }
						cb({headers: {'Content-Type': tran.json}, body: reply}); // TODO: Fix so we know what the reply is.
					}, soul);
					return true;
				}
				gun.server.on('network').event(function(req){
					// TODO: MARK! You should move the networking events to here, not in WSS only.
				});
				tran.json = 'application/json';
				return tran;
			}());

			opt.hooks = opt.hooks || {};
			gun.opt({hooks: {
				transport: opt.hooks.transport || gun.server.transport
			}}, true);
		});
	}({}));

	/* WEBPACK VAR INJECTION */}.call(exports, "/"))

/***/ },
/* 136 */
/***/ function(module, exports, __webpack_require__) {

	var IncomingForm = __webpack_require__(137).IncomingForm;
	IncomingForm.IncomingForm = IncomingForm;
	module.exports = IncomingForm;


/***/ },
/* 137 */
/***/ function(module, exports, __webpack_require__) {

	var require;/* WEBPACK VAR INJECTION */(function(global, Buffer) {if (global.GENTLY) require = GENTLY.hijack(__webpack_require__(138));

	var crypto = require('crypto');
	var fs = require('fs');
	var util = require('util'),
	    path = require('path'),
	    File = require('./file'),
	    MultipartParser = require('./multipart_parser').MultipartParser,
	    QuerystringParser = require('./querystring_parser').QuerystringParser,
	    OctetParser       = require('./octet_parser').OctetParser,
	    JSONParser = require('./json_parser').JSONParser,
	    StringDecoder = require('string_decoder').StringDecoder,
	    EventEmitter = require('events').EventEmitter,
	    Stream = require('stream').Stream,
	    os = require('os');

	function IncomingForm(opts) {
	  if (!(this instanceof IncomingForm)) return new IncomingForm(opts);
	  EventEmitter.call(this);

	  opts=opts||{};

	  this.error = null;
	  this.ended = false;

	  this.maxFields = opts.maxFields || 1000;
	  this.maxFieldsSize = opts.maxFieldsSize || 2 * 1024 * 1024;
	  this.keepExtensions = opts.keepExtensions || false;
	  this.uploadDir = opts.uploadDir || os.tmpDir();
	  this.encoding = opts.encoding || 'utf-8';
	  this.headers = null;
	  this.type = null;
	  this.hash = opts.hash || false;
	  this.multiples = opts.multiples || false;

	  this.bytesReceived = null;
	  this.bytesExpected = null;

	  this._parser = null;
	  this._flushing = 0;
	  this._fieldsSize = 0;
	  this.openedFiles = [];

	  return this;
	}
	util.inherits(IncomingForm, EventEmitter);
	exports.IncomingForm = IncomingForm;

	IncomingForm.prototype.parse = function(req, cb) {
	  this.pause = function() {
	    try {
	      req.pause();
	    } catch (err) {
	      // the stream was destroyed
	      if (!this.ended) {
	        // before it was completed, crash & burn
	        this._error(err);
	      }
	      return false;
	    }
	    return true;
	  };

	  this.resume = function() {
	    try {
	      req.resume();
	    } catch (err) {
	      // the stream was destroyed
	      if (!this.ended) {
	        // before it was completed, crash & burn
	        this._error(err);
	      }
	      return false;
	    }

	    return true;
	  };

	  // Setup callback first, so we don't miss anything from data events emitted
	  // immediately.
	  if (cb) {
	    var fields = {}, files = {};
	    this
	      .on('field', function(name, value) {
	        fields[name] = value;
	      })
	      .on('file', function(name, file) {
	        if (this.multiples) {
	          if (files[name]) {
	            if (!Array.isArray(files[name])) {
	              files[name] = [files[name]];
	            }
	            files[name].push(file);
	          } else {
	            files[name] = file;
	          }
	        } else {
	          files[name] = file;
	        }
	      })
	      .on('error', function(err) {
	        cb(err, fields, files);
	      })
	      .on('end', function() {
	        cb(null, fields, files);
	      });
	  }

	  // Parse headers and setup the parser, ready to start listening for data.
	  this.writeHeaders(req.headers);

	  // Start listening for data.
	  var self = this;
	  req
	    .on('error', function(err) {
	      self._error(err);
	    })
	    .on('aborted', function() {
	      self.emit('aborted');
	      self._error(new Error('Request aborted'));
	    })
	    .on('data', function(buffer) {
	      self.write(buffer);
	    })
	    .on('end', function() {
	      if (self.error) {
	        return;
	      }

	      var err = self._parser.end();
	      if (err) {
	        self._error(err);
	      }
	    });

	  return this;
	};

	IncomingForm.prototype.writeHeaders = function(headers) {
	  this.headers = headers;
	  this._parseContentLength();
	  this._parseContentType();
	};

	IncomingForm.prototype.write = function(buffer) {
	  if (this.error) {
	    return;
	  }
	  if (!this._parser) {
	    this._error(new Error('uninitialized parser'));
	    return;
	  }

	  this.bytesReceived += buffer.length;
	  this.emit('progress', this.bytesReceived, this.bytesExpected);

	  var bytesParsed = this._parser.write(buffer);
	  if (bytesParsed !== buffer.length) {
	    this._error(new Error('parser error, '+bytesParsed+' of '+buffer.length+' bytes parsed'));
	  }

	  return bytesParsed;
	};

	IncomingForm.prototype.pause = function() {
	  // this does nothing, unless overwritten in IncomingForm.parse
	  return false;
	};

	IncomingForm.prototype.resume = function() {
	  // this does nothing, unless overwritten in IncomingForm.parse
	  return false;
	};

	IncomingForm.prototype.onPart = function(part) {
	  // this method can be overwritten by the user
	  this.handlePart(part);
	};

	IncomingForm.prototype.handlePart = function(part) {
	  var self = this;

	  if (part.filename === undefined) {
	    var value = ''
	      , decoder = new StringDecoder(this.encoding);

	    part.on('data', function(buffer) {
	      self._fieldsSize += buffer.length;
	      if (self._fieldsSize > self.maxFieldsSize) {
	        self._error(new Error('maxFieldsSize exceeded, received '+self._fieldsSize+' bytes of field data'));
	        return;
	      }
	      value += decoder.write(buffer);
	    });

	    part.on('end', function() {
	      self.emit('field', part.name, value);
	    });
	    return;
	  }

	  this._flushing++;

	  var file = new File({
	    path: this._uploadPath(part.filename),
	    name: part.filename,
	    type: part.mime,
	    hash: self.hash
	  });

	  this.emit('fileBegin', part.name, file);

	  file.open();
	  this.openedFiles.push(file);

	  part.on('data', function(buffer) {
	    if (buffer.length == 0) {
	      return;
	    }
	    self.pause();
	    file.write(buffer, function() {
	      self.resume();
	    });
	  });

	  part.on('end', function() {
	    file.end(function() {
	      self._flushing--;
	      self.emit('file', part.name, file);
	      self._maybeEnd();
	    });
	  });
	};

	function dummyParser(self) {
	  return {
	    end: function () {
	      self.ended = true;
	      self._maybeEnd();
	      return null;
	    }
	  };
	}

	IncomingForm.prototype._parseContentType = function() {
	  if (this.bytesExpected === 0) {
	    this._parser = dummyParser(this);
	    return;
	  }

	  if (!this.headers['content-type']) {
	    this._error(new Error('bad content-type header, no content-type'));
	    return;
	  }

	  if (this.headers['content-type'].match(/octet-stream/i)) {
	    this._initOctetStream();
	    return;
	  }

	  if (this.headers['content-type'].match(/urlencoded/i)) {
	    this._initUrlencoded();
	    return;
	  }

	  if (this.headers['content-type'].match(/multipart/i)) {
	    var m = this.headers['content-type'].match(/boundary=(?:"([^"]+)"|([^;]+))/i);
	    if (m) {
	      this._initMultipart(m[1] || m[2]);
	    } else {
	      this._error(new Error('bad content-type header, no multipart boundary'));
	    }
	    return;
	  }

	  if (this.headers['content-type'].match(/json/i)) {
	    this._initJSONencoded();
	    return;
	  }

	  this._error(new Error('bad content-type header, unknown content-type: '+this.headers['content-type']));
	};

	IncomingForm.prototype._error = function(err) {
	  if (this.error || this.ended) {
	    return;
	  }

	  this.error = err;
	  this.emit('error', err);

	  if (Array.isArray(this.openedFiles)) {
	    this.openedFiles.forEach(function(file) {
	      file._writeStream.destroy();
	      setTimeout(fs.unlink, 0, file.path, function(error) { });
	    });
	  }
	};

	IncomingForm.prototype._parseContentLength = function() {
	  this.bytesReceived = 0;
	  if (this.headers['content-length']) {
	    this.bytesExpected = parseInt(this.headers['content-length'], 10);
	  } else if (this.headers['transfer-encoding'] === undefined) {
	    this.bytesExpected = 0;
	  }

	  if (this.bytesExpected !== null) {
	    this.emit('progress', this.bytesReceived, this.bytesExpected);
	  }
	};

	IncomingForm.prototype._newParser = function() {
	  return new MultipartParser();
	};

	IncomingForm.prototype._initMultipart = function(boundary) {
	  this.type = 'multipart';

	  var parser = new MultipartParser(),
	      self = this,
	      headerField,
	      headerValue,
	      part;

	  parser.initWithBoundary(boundary);

	  parser.onPartBegin = function() {
	    part = new Stream();
	    part.readable = true;
	    part.headers = {};
	    part.name = null;
	    part.filename = null;
	    part.mime = null;

	    part.transferEncoding = 'binary';
	    part.transferBuffer = '';

	    headerField = '';
	    headerValue = '';
	  };

	  parser.onHeaderField = function(b, start, end) {
	    headerField += b.toString(self.encoding, start, end);
	  };

	  parser.onHeaderValue = function(b, start, end) {
	    headerValue += b.toString(self.encoding, start, end);
	  };

	  parser.onHeaderEnd = function() {
	    headerField = headerField.toLowerCase();
	    part.headers[headerField] = headerValue;

	    var m = headerValue.match(/\bname="([^"]+)"/i);
	    if (headerField == 'content-disposition') {
	      if (m) {
	        part.name = m[1];
	      }

	      part.filename = self._fileName(headerValue);
	    } else if (headerField == 'content-type') {
	      part.mime = headerValue;
	    } else if (headerField == 'content-transfer-encoding') {
	      part.transferEncoding = headerValue.toLowerCase();
	    }

	    headerField = '';
	    headerValue = '';
	  };

	  parser.onHeadersEnd = function() {
	    switch(part.transferEncoding){
	      case 'binary':
	      case '7bit':
	      case '8bit':
	      parser.onPartData = function(b, start, end) {
	        part.emit('data', b.slice(start, end));
	      };

	      parser.onPartEnd = function() {
	        part.emit('end');
	      };
	      break;

	      case 'base64':
	      parser.onPartData = function(b, start, end) {
	        part.transferBuffer += b.slice(start, end).toString('ascii');

	        /*
	        four bytes (chars) in base64 converts to three bytes in binary
	        encoding. So we should always work with a number of bytes that
	        can be divided by 4, it will result in a number of buytes that
	        can be divided vy 3.
	        */
	        var offset = parseInt(part.transferBuffer.length / 4, 10) * 4;
	        part.emit('data', new Buffer(part.transferBuffer.substring(0, offset), 'base64'));
	        part.transferBuffer = part.transferBuffer.substring(offset);
	      };

	      parser.onPartEnd = function() {
	        part.emit('data', new Buffer(part.transferBuffer, 'base64'));
	        part.emit('end');
	      };
	      break;

	      default:
	      return self._error(new Error('unknown transfer-encoding'));
	    }

	    self.onPart(part);
	  };


	  parser.onEnd = function() {
	    self.ended = true;
	    self._maybeEnd();
	  };

	  this._parser = parser;
	};

	IncomingForm.prototype._fileName = function(headerValue) {
	  var m = headerValue.match(/\bfilename="(.*?)"($|; )/i);
	  if (!m) return;

	  var filename = m[1].substr(m[1].lastIndexOf('\\') + 1);
	  filename = filename.replace(/%22/g, '"');
	  filename = filename.replace(/&#([\d]{4});/g, function(m, code) {
	    return String.fromCharCode(code);
	  });
	  return filename;
	};

	IncomingForm.prototype._initUrlencoded = function() {
	  this.type = 'urlencoded';

	  var parser = new QuerystringParser(this.maxFields)
	    , self = this;

	  parser.onField = function(key, val) {
	    self.emit('field', key, val);
	  };

	  parser.onEnd = function() {
	    self.ended = true;
	    self._maybeEnd();
	  };

	  this._parser = parser;
	};

	IncomingForm.prototype._initOctetStream = function() {
	  this.type = 'octet-stream';
	  var filename = this.headers['x-file-name'];
	  var mime = this.headers['content-type'];

	  var file = new File({
	    path: this._uploadPath(filename),
	    name: filename,
	    type: mime
	  });

	  this.emit('fileBegin', filename, file);
	  file.open();

	  this._flushing++;

	  var self = this;

	  self._parser = new OctetParser();

	  //Keep track of writes that haven't finished so we don't emit the file before it's done being written
	  var outstandingWrites = 0;

	  self._parser.on('data', function(buffer){
	    self.pause();
	    outstandingWrites++;

	    file.write(buffer, function() {
	      outstandingWrites--;
	      self.resume();

	      if(self.ended){
	        self._parser.emit('doneWritingFile');
	      }
	    });
	  });

	  self._parser.on('end', function(){
	    self._flushing--;
	    self.ended = true;

	    var done = function(){
	      file.end(function() {
	        self.emit('file', 'file', file);
	        self._maybeEnd();
	      });
	    };

	    if(outstandingWrites === 0){
	      done();
	    } else {
	      self._parser.once('doneWritingFile', done);
	    }
	  });
	};

	IncomingForm.prototype._initJSONencoded = function() {
	  this.type = 'json';

	  var parser = new JSONParser()
	    , self = this;

	  if (this.bytesExpected) {
	    parser.initWithLength(this.bytesExpected);
	  }

	  parser.onField = function(key, val) {
	    self.emit('field', key, val);
	  };

	  parser.onEnd = function() {
	    self.ended = true;
	    self._maybeEnd();
	  };

	  this._parser = parser;
	};

	IncomingForm.prototype._uploadPath = function(filename) {
	  var name = 'upload_';
	  var buf = crypto.randomBytes(16);
	  for (var i = 0; i < buf.length; ++i) {
	    name += ('0' + buf[i].toString(16)).slice(-2);
	  }

	  if (this.keepExtensions) {
	    var ext = path.extname(filename);
	    ext     = ext.replace(/(\.[a-z0-9]+).*/i, '$1');

	    name += ext;
	  }

	  return path.join(this.uploadDir, name);
	};

	IncomingForm.prototype._maybeEnd = function() {
	  if (!this.ended || this._flushing || this.error) {
	    return;
	  }

	  this.emit('end');
	};


	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(11).Buffer))

/***/ },
/* 138 */
/***/ function(module, exports, __webpack_require__) {

	var map = {
		"./file": 139,
		"./file.js": 139,
		"./incoming_form": 137,
		"./incoming_form.js": 137,
		"./index": 136,
		"./index.js": 136,
		"./json_parser": 140,
		"./json_parser.js": 140,
		"./multipart_parser": 141,
		"./multipart_parser.js": 141,
		"./octet_parser": 142,
		"./octet_parser.js": 142,
		"./querystring_parser": 143,
		"./querystring_parser.js": 143
	};
	function webpackContext(req) {
		return __webpack_require__(webpackContextResolve(req));
	};
	function webpackContextResolve(req) {
		return map[req] || (function() { throw new Error("Cannot find module '" + req + "'.") }());
	};
	webpackContext.keys = function webpackContextKeys() {
		return Object.keys(map);
	};
	webpackContext.resolve = webpackContextResolve;
	module.exports = webpackContext;
	webpackContext.id = 138;


/***/ },
/* 139 */
/***/ function(module, exports, __webpack_require__) {

	var require;/* WEBPACK VAR INJECTION */(function(global) {if (global.GENTLY) require = GENTLY.hijack(__webpack_require__(138));

	var util = require('util'),
	    WriteStream = require('fs').WriteStream,
	    EventEmitter = require('events').EventEmitter,
	    crypto = require('crypto');

	function File(properties) {
	  EventEmitter.call(this);

	  this.size = 0;
	  this.path = null;
	  this.name = null;
	  this.type = null;
	  this.hash = null;
	  this.lastModifiedDate = null;

	  this._writeStream = null;
	  
	  for (var key in properties) {
	    this[key] = properties[key];
	  }

	  if(typeof this.hash === 'string') {
	    this.hash = crypto.createHash(properties.hash);
	  } else {
	    this.hash = null;
	  }
	}
	module.exports = File;
	util.inherits(File, EventEmitter);

	File.prototype.open = function() {
	  this._writeStream = new WriteStream(this.path);
	};

	File.prototype.toJSON = function() {
	  return {
	    size: this.size,
	    path: this.path,
	    name: this.name,
	    type: this.type,
	    mtime: this.lastModifiedDate,
	    length: this.length,
	    filename: this.filename,
	    mime: this.mime
	  };
	};

	File.prototype.write = function(buffer, cb) {
	  var self = this;
	  if (self.hash) {
	    self.hash.update(buffer);
	  }
	  this._writeStream.write(buffer, function() {
	    self.lastModifiedDate = new Date();
	    self.size += buffer.length;
	    self.emit('progress', self.size);
	    cb();
	  });
	};

	File.prototype.end = function(cb) {
	  var self = this;
	  if (self.hash) {
	    self.hash = self.hash.digest('hex');
	  }
	  this._writeStream.end(function() {
	    self.emit('end');
	    cb();
	  });
	};

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 140 */
/***/ function(module, exports, __webpack_require__) {

	var require;/* WEBPACK VAR INJECTION */(function(global) {if (global.GENTLY) require = GENTLY.hijack(__webpack_require__(138));

	var Buffer = require('buffer').Buffer;

	function JSONParser() {
	  this.data = new Buffer('');
	  this.bytesWritten = 0;
	}
	exports.JSONParser = JSONParser;

	JSONParser.prototype.initWithLength = function(length) {
	  this.data = new Buffer(length);
	};

	JSONParser.prototype.write = function(buffer) {
	  if (this.data.length >= this.bytesWritten + buffer.length) {
	    buffer.copy(this.data, this.bytesWritten);
	  } else {
	    this.data = Buffer.concat([this.data, buffer]);
	  }
	  this.bytesWritten += buffer.length;
	  return buffer.length;
	};

	JSONParser.prototype.end = function() {
	  try {
	    var fields = JSON.parse(this.data.toString('utf8'));
	    for (var field in fields) {
	      this.onField(field, fields[field]);
	    }
	  } catch (e) {}
	  this.data = null;

	  this.onEnd();
	};

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 141 */
/***/ function(module, exports, __webpack_require__) {

	var Buffer = __webpack_require__(11).Buffer,
	    s = 0,
	    S =
	    { PARSER_UNINITIALIZED: s++,
	      START: s++,
	      START_BOUNDARY: s++,
	      HEADER_FIELD_START: s++,
	      HEADER_FIELD: s++,
	      HEADER_VALUE_START: s++,
	      HEADER_VALUE: s++,
	      HEADER_VALUE_ALMOST_DONE: s++,
	      HEADERS_ALMOST_DONE: s++,
	      PART_DATA_START: s++,
	      PART_DATA: s++,
	      PART_END: s++,
	      END: s++
	    },

	    f = 1,
	    F =
	    { PART_BOUNDARY: f,
	      LAST_BOUNDARY: f *= 2
	    },

	    LF = 10,
	    CR = 13,
	    SPACE = 32,
	    HYPHEN = 45,
	    COLON = 58,
	    A = 97,
	    Z = 122,

	    lower = function(c) {
	      return c | 0x20;
	    };

	for (s in S) {
	  exports[s] = S[s];
	}

	function MultipartParser() {
	  this.boundary = null;
	  this.boundaryChars = null;
	  this.lookbehind = null;
	  this.state = S.PARSER_UNINITIALIZED;

	  this.index = null;
	  this.flags = 0;
	}
	exports.MultipartParser = MultipartParser;

	MultipartParser.stateToString = function(stateNumber) {
	  for (var state in S) {
	    var number = S[state];
	    if (number === stateNumber) return state;
	  }
	};

	MultipartParser.prototype.initWithBoundary = function(str) {
	  this.boundary = new Buffer(str.length+4);
	  this.boundary.write('\r\n--', 0);
	  this.boundary.write(str, 4);
	  this.lookbehind = new Buffer(this.boundary.length+8);
	  this.state = S.START;

	  this.boundaryChars = {};
	  for (var i = 0; i < this.boundary.length; i++) {
	    this.boundaryChars[this.boundary[i]] = true;
	  }
	};

	MultipartParser.prototype.write = function(buffer) {
	  var self = this,
	      i = 0,
	      len = buffer.length,
	      prevIndex = this.index,
	      index = this.index,
	      state = this.state,
	      flags = this.flags,
	      lookbehind = this.lookbehind,
	      boundary = this.boundary,
	      boundaryChars = this.boundaryChars,
	      boundaryLength = this.boundary.length,
	      boundaryEnd = boundaryLength - 1,
	      bufferLength = buffer.length,
	      c,
	      cl,

	      mark = function(name) {
	        self[name+'Mark'] = i;
	      },
	      clear = function(name) {
	        delete self[name+'Mark'];
	      },
	      callback = function(name, buffer, start, end) {
	        if (start !== undefined && start === end) {
	          return;
	        }

	        var callbackSymbol = 'on'+name.substr(0, 1).toUpperCase()+name.substr(1);
	        if (callbackSymbol in self) {
	          self[callbackSymbol](buffer, start, end);
	        }
	      },
	      dataCallback = function(name, clear) {
	        var markSymbol = name+'Mark';
	        if (!(markSymbol in self)) {
	          return;
	        }

	        if (!clear) {
	          callback(name, buffer, self[markSymbol], buffer.length);
	          self[markSymbol] = 0;
	        } else {
	          callback(name, buffer, self[markSymbol], i);
	          delete self[markSymbol];
	        }
	      };

	  for (i = 0; i < len; i++) {
	    c = buffer[i];
	    switch (state) {
	      case S.PARSER_UNINITIALIZED:
	        return i;
	      case S.START:
	        index = 0;
	        state = S.START_BOUNDARY;
	      case S.START_BOUNDARY:
	        if (index == boundary.length - 2) {
	          if (c == HYPHEN) {
	            flags |= F.LAST_BOUNDARY;
	          } else if (c != CR) {
	            return i;
	          }
	          index++;
	          break;
	        } else if (index - 1 == boundary.length - 2) {
	          if (flags & F.LAST_BOUNDARY && c == HYPHEN){
	            callback('end');
	            state = S.END;
	            flags = 0;
	          } else if (!(flags & F.LAST_BOUNDARY) && c == LF) {
	            index = 0;
	            callback('partBegin');
	            state = S.HEADER_FIELD_START;
	          } else {
	            return i;
	          }
	          break;
	        }

	        if (c != boundary[index+2]) {
	          index = -2;
	        }
	        if (c == boundary[index+2]) {
	          index++;
	        }
	        break;
	      case S.HEADER_FIELD_START:
	        state = S.HEADER_FIELD;
	        mark('headerField');
	        index = 0;
	      case S.HEADER_FIELD:
	        if (c == CR) {
	          clear('headerField');
	          state = S.HEADERS_ALMOST_DONE;
	          break;
	        }

	        index++;
	        if (c == HYPHEN) {
	          break;
	        }

	        if (c == COLON) {
	          if (index == 1) {
	            // empty header field
	            return i;
	          }
	          dataCallback('headerField', true);
	          state = S.HEADER_VALUE_START;
	          break;
	        }

	        cl = lower(c);
	        if (cl < A || cl > Z) {
	          return i;
	        }
	        break;
	      case S.HEADER_VALUE_START:
	        if (c == SPACE) {
	          break;
	        }

	        mark('headerValue');
	        state = S.HEADER_VALUE;
	      case S.HEADER_VALUE:
	        if (c == CR) {
	          dataCallback('headerValue', true);
	          callback('headerEnd');
	          state = S.HEADER_VALUE_ALMOST_DONE;
	        }
	        break;
	      case S.HEADER_VALUE_ALMOST_DONE:
	        if (c != LF) {
	          return i;
	        }
	        state = S.HEADER_FIELD_START;
	        break;
	      case S.HEADERS_ALMOST_DONE:
	        if (c != LF) {
	          return i;
	        }

	        callback('headersEnd');
	        state = S.PART_DATA_START;
	        break;
	      case S.PART_DATA_START:
	        state = S.PART_DATA;
	        mark('partData');
	      case S.PART_DATA:
	        prevIndex = index;

	        if (index === 0) {
	          // boyer-moore derrived algorithm to safely skip non-boundary data
	          i += boundaryEnd;
	          while (i < bufferLength && !(buffer[i] in boundaryChars)) {
	            i += boundaryLength;
	          }
	          i -= boundaryEnd;
	          c = buffer[i];
	        }

	        if (index < boundary.length) {
	          if (boundary[index] == c) {
	            if (index === 0) {
	              dataCallback('partData', true);
	            }
	            index++;
	          } else {
	            index = 0;
	          }
	        } else if (index == boundary.length) {
	          index++;
	          if (c == CR) {
	            // CR = part boundary
	            flags |= F.PART_BOUNDARY;
	          } else if (c == HYPHEN) {
	            // HYPHEN = end boundary
	            flags |= F.LAST_BOUNDARY;
	          } else {
	            index = 0;
	          }
	        } else if (index - 1 == boundary.length)  {
	          if (flags & F.PART_BOUNDARY) {
	            index = 0;
	            if (c == LF) {
	              // unset the PART_BOUNDARY flag
	              flags &= ~F.PART_BOUNDARY;
	              callback('partEnd');
	              callback('partBegin');
	              state = S.HEADER_FIELD_START;
	              break;
	            }
	          } else if (flags & F.LAST_BOUNDARY) {
	            if (c == HYPHEN) {
	              callback('partEnd');
	              callback('end');
	              state = S.END;
	              flags = 0;
	            } else {
	              index = 0;
	            }
	          } else {
	            index = 0;
	          }
	        }

	        if (index > 0) {
	          // when matching a possible boundary, keep a lookbehind reference
	          // in case it turns out to be a false lead
	          lookbehind[index-1] = c;
	        } else if (prevIndex > 0) {
	          // if our boundary turned out to be rubbish, the captured lookbehind
	          // belongs to partData
	          callback('partData', lookbehind, 0, prevIndex);
	          prevIndex = 0;
	          mark('partData');

	          // reconsider the current character even so it interrupted the sequence
	          // it could be the beginning of a new sequence
	          i--;
	        }

	        break;
	      case S.END:
	        break;
	      default:
	        return i;
	    }
	  }

	  dataCallback('headerField');
	  dataCallback('headerValue');
	  dataCallback('partData');

	  this.index = index;
	  this.state = state;
	  this.flags = flags;

	  return len;
	};

	MultipartParser.prototype.end = function() {
	  var callback = function(self, name) {
	    var callbackSymbol = 'on'+name.substr(0, 1).toUpperCase()+name.substr(1);
	    if (callbackSymbol in self) {
	      self[callbackSymbol]();
	    }
	  };
	  if ((this.state == S.HEADER_FIELD_START && this.index === 0) ||
	      (this.state == S.PART_DATA && this.index == this.boundary.length)) {
	    callback(this, 'partEnd');
	    callback(this, 'end');
	  } else if (this.state != S.END) {
	    return new Error('MultipartParser.end(): stream ended unexpectedly: ' + this.explain());
	  }
	};

	MultipartParser.prototype.explain = function() {
	  return 'state = ' + MultipartParser.stateToString(this.state);
	};


/***/ },
/* 142 */
/***/ function(module, exports, __webpack_require__) {

	var EventEmitter = __webpack_require__(42).EventEmitter
		, util = __webpack_require__(21);

	function OctetParser(options){
		if(!(this instanceof OctetParser)) return new OctetParser(options);
		EventEmitter.call(this);
	}

	util.inherits(OctetParser, EventEmitter);

	exports.OctetParser = OctetParser;

	OctetParser.prototype.write = function(buffer) {
	    this.emit('data', buffer);
		return buffer.length;
	};

	OctetParser.prototype.end = function() {
		this.emit('end');
	};


/***/ },
/* 143 */
/***/ function(module, exports, __webpack_require__) {

	var require;/* WEBPACK VAR INJECTION */(function(global) {if (global.GENTLY) require = GENTLY.hijack(__webpack_require__(138));

	// This is a buffering parser, not quite as nice as the multipart one.
	// If I find time I'll rewrite this to be fully streaming as well
	var querystring = require('querystring');

	function QuerystringParser(maxKeys) {
	  this.maxKeys = maxKeys;
	  this.buffer = '';
	}
	exports.QuerystringParser = QuerystringParser;

	QuerystringParser.prototype.write = function(buffer) {
	  this.buffer += buffer.toString('ascii');
	  return buffer.length;
	};

	QuerystringParser.prototype.end = function() {
	  var fields = querystring.parse(this.buffer, '&', '=', { maxKeys: this.maxKeys });
	  for (var field in fields) {
	    this.onField(field, fields[field]);
	  }
	  this.buffer = '';

	  this.onEnd();
	};


	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 144 */
/***/ function(module, exports) {

	
	/**
	 * Module dependencies.
	 */

	var global = (function() { return this; })();

	/**
	 * WebSocket constructor.
	 */

	var WebSocket = global.WebSocket || global.MozWebSocket;

	/**
	 * Module exports.
	 */

	module.exports = WebSocket ? ws : null;

	/**
	 * WebSocket constructor.
	 *
	 * The third `opts` options object gets ignored in web browsers, since it's
	 * non-standard, and throws a TypeError if passed to the constructor.
	 * See: https://github.com/einaros/ws/issues/227
	 *
	 * @param {String} uri
	 * @param {Array} protocols (optional)
	 * @param {Object) opts (optional)
	 * @api public
	 */

	function ws(uri, protocols, opts) {
	  var instance;
	  if (protocols) {
	    instance = new WebSocket(uri, protocols);
	  } else {
	    instance = new WebSocket(uri);
	  }
	  return instance;
	}

	if (WebSocket) ws.prototype = WebSocket.prototype;


/***/ },
/* 145 */
/***/ function(module, exports, __webpack_require__) {

	var Gun = __webpack_require__(3)
	,	formidable = __webpack_require__(136)
	,	url = __webpack_require__(67);
	module.exports = function(req, res, next){
		next = next || function(){}; // if not next, and we don't handle it, we should res.end
		if(!req || !res){ return next() }
		if(!req.url){ return next() }
		if(!req.method){ return next() }
		var msg = {};
		msg.url = url.parse(req.url, true);
		msg.method = (req.method||'').toLowerCase();
		msg.headers = req.headers;
		var u, body
		,	form = new formidable.IncomingForm()
		,	post = function(err, body){
			if(u !== body){ msg.body = body }
			next(msg, function(reply){
				if(!res){ return }
				if(!reply){ return res.end() }
				if(Gun.obj.has(reply, 'statusCode') || Gun.obj.has(reply, 'status')){
					res.statusCode = reply.statusCode || reply.status;
				}
				if(reply.headers){
					if(!(res.headersSent || res.headerSent || res._headerSent || res._headersSent)){
						Gun.obj.map(reply.headers, function(val, field){
							res.setHeader(field, val);
						});
					}
				}
				if(Gun.obj.has(reply,'chunk') || Gun.obj.has(reply,'write')){
					res.write(Gun.text.ify(reply.chunk || reply.write) || '');
				}
				if(Gun.obj.has(reply,'body') || Gun.obj.has(reply,'end')){
					res.end(Gun.text.ify(reply.body || reply.end) || '');
				}
			});
		}
		form.on('field',function(k,v){
			(body = body || {})[k] = v;
		}).on('file',function(k,v){
			return; // files not supported in gun yet
		}).on('error',function(e){
			if(form.done){ return }
			post(e);
		}).on('end', function(){
			if(form.done){ return }
			post(null, body);
		});
		form.parse(req);
	}

/***/ },
/* 146 */
/***/ function(module, exports, __webpack_require__) {

	var Gun = __webpack_require__(3)
	,	url = __webpack_require__(67);
	module.exports = function(wss, server){
		wss.on('connection', function(ws){
			var req = {};
			ws.upgradeReq = ws.upgradeReq || {};
			req.url = url.parse(ws.upgradeReq.url||'');
			req.method = (ws.upgradeReq.method||'').toLowerCase();
			req.headers = ws.upgradeReq.headers || {};
			//Gun.log("wsReq", req);
			ws.on('message', function(msg){
				msg = Gun.obj.ify(msg);
				msg.url = msg.url || {};
				msg.url.pathname = (req.url.pathname||'') + (msg.url.pathname||'');
				Gun.obj.map(req.url, function(val, i){
					msg.url[i] = msg.url[i] || val; // reattach url
				});
				msg.method = msg.method || req.method;
				msg.headers = msg.headers || {};
				Gun.obj.map(req.headers, function(val, i){
					msg.headers[i] = msg.headers[i] || val; // reattach headers
				});
				server.call(ws, msg, function(reply){
					if(!ws || !ws.send || !ws._socket || !ws._socket.writable){ return }
					reply = reply || {};
					if(msg && msg.headers && msg.headers['ws-rid']){
						(reply.headers = reply.headers || {})['ws-rid'] = msg.headers['ws-rid'];
					}
					try{ws.send(Gun.text.ify(reply));
					}catch(e){} // juuuust in case. 
				});
			});
			ws.off = function(m){
				Gun.log("ws.off", m);
				ws.send = null;
			}
			ws.on('close', ws.off);
			ws.on('error', ws.off);
		});
	}


/***/ },
/* 147 */
/***/ function(module, exports, __webpack_require__) {

	var Gun = __webpack_require__(3);
	module.exports = function(req, cb){
		if(!req.url || !req.url.query || !req.url.query.jsonp){ return cb }
		cb.jsonp = req.url.query.jsonp;
		delete req.url.query.jsonp;
		Gun.obj.map(Gun.obj.ify(req.url.query['`']), function(val, i){
			req.headers[i] = val;
		});
		delete req.url.query['`'];
		if(req.url.query.$){
			req.body = req.url.query.$;
			if(!Gun.obj.has(req.url.query, '^') || 'json' == req.url.query['^']){
				req.body = Gun.obj.ify(req.body); // TODO: BUG! THIS IS WRONG! This doesn't handle multipart chunking, and will fail!
			}
		}
		delete req.url.query.$;
		delete req.url.query['^'];
		delete req.url.query['%'];
		var reply = {headers:{}};
		return function(res){
			if(!res){ return }
			if(res.headers){
				Gun.obj.map(res.headers, function(val, field){
					reply.headers[field] = val;
				});
			}
			reply.headers['Content-Type'] = "text/javascript";
			if(Gun.obj.has(res,'chunk') && (!reply.body || Gun.list.is(reply.chunks))){
				(reply.chunks = reply.chunks || []).push(res.chunk);
			}
			if(Gun.obj.has(res,'body')){
				reply.body = res.body; // self-reference yourself so on the client we can get the headers and body.
				reply.body = ';'+ cb.jsonp + '(' + Gun.text.ify(reply) + ');'; // javascriptify it! can't believe the client trusts us.
				cb(reply);
			}
		}
	}


/***/ },
/* 148 */
/***/ function(module, exports, __webpack_require__) {

	// This was written by the wonderful Forrest Tait
	// modified by Mark to be part of core for convenience
	// twas not designed for production use
	// only simple local development.
	var Gun = __webpack_require__(3),
			file = {};

	Gun.on('opt').event(function(gun, opts) {
		if ((opts.file === false) || (opts.s3 && opts.s3.key)) {
			return; // don't use this plugin if S3 is being used.
		}
		console.log("WARNING! This `file.js` module for gun is intended only for local development testing!")
		opts.file = opts.file || 'data.json';
		var fs = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"fs\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
		file.raw = file.raw || (fs.existsSync || __webpack_require__(34).existsSync)(opts.file) ? fs.readFileSync(opts.file).toString() : null;
		var all = file.all = file.all || Gun.obj.ify(file.raw || {
			nodes: {},
			keys: {}
		});
		all.keys = all.keys || {};
		all.nodes = all.nodes || {};
		gun.opt({hooks: {
			get: function get(key, cb, o){
				var graph, soul;
				if(soul = Gun.is.soul(key)){
					if(all.nodes[soul]){
						(graph = {})[soul] = all.nodes[soul];
						cb(null, graph); 
						(graph = {})[soul] = Gun.union.pseudo(soul);
						cb(null, graph); // end.
					}
					return;
				}
				Gun.obj.map(all.keys[key], function(rel){
					if(Gun.is.soul(rel)){ get(soul = rel, cb, o) }
				});
				return soul? cb(null, {}) : cb(null, null);
			},
			put: function(graph, cb, o){
				all.nodes = gun.__.graph;
				fs.writeFile(opts.file, Gun.text.ify(all), cb);
			},
			key: function(key, soul, cb, o){
				var meta = {};
				meta[Gun._.soul] = soul = Gun.is.soul(soul) || soul;
				((all.keys = all.keys || {})[key] = all.keys[key] || {})[soul] = meta;
				fs.writeFile(opts.file, Gun.text.ify(all), cb);
			},
			all: function(list, opt, cb) {
				opt = opt || {};
				opt.from = opt.from || '';
				opt.start = opt.from + (opt.start || '');
				if(opt.end){ opt.end = opt.from + opt.end }
				var match = {};
				cb = cb || function(){};
				Gun.obj.map(list, function(soul, key){
					var end = opt.end || key;
					if(key.indexOf(opt.from) === 0 && opt.start <= key && (key <= end || key.indexOf(end) === 0)){
						if(opt.upto){
							if(key.slice(opt.from.length).indexOf(opt.upto) === -1){
								yes(soul, key);
							}
						} else {
							yes(soul, key);
						}
					}
				});
				function yes(soul, key){
					cb(key);
					match[key] = {};
					match[key][Gun._.soul] = soul;
				}
				return match;
			}
		}}, true);
		gun.all = gun.all || function(url, cb) {
			url = __webpack_require__(67).parse(url, true);
			var r = gun.__.opt.hooks.all(all.keys, {
					from: url.pathname,
					upto: url.query['*'],
					start: url.query['*>'],
					end: url.query['*<']
			});
			console.log("All please", url.pathname, url.query['*'], r);
			cb = cb || function() {};
			cb(null, r);
		}
	});

/***/ }
/******/ ]);