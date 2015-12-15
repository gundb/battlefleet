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
	var Gun = __webpack_require__(1);
	var gun = Gun({
	    level: {
	        blaze: 'game-state'
	    }
	});

	function index(path) {
	    gun.get(path).path('players').put({
	        0: {
	            taken
	        }
	    })
	    gun.path('players');
	}

	module.exports = index;

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	/*jslint node: true */
	'use strict';

	var Gun, fs, patch, blaze, shared = {};

	module.exports = Gun = __webpack_require__(2);
	patch = __webpack_require__(3);
	blaze = __webpack_require__(70);



	console.log('Thanks for using gun-level!');
	console.log('Submit any issues to: github.com/PsychoLlama/gun-level');
	console.log('or ask us a question: gitter.im/amark\n');



	Gun.on('opt').event(function (gun, config) {

		var level, driver, path, hooks;

		level = patch.level(config);
		path = level.path;

		if (level === false) {
			return;
		}


		// allow multiple gun instances to share
		// a levelDown instance
		if (level.db) {
			driver = level.db;

		} else if (level.share && shared[path]) {
			driver = shared[path];

		} else {
			if (level.blaze) {
				blaze(path);
			}

			driver = level.up(path, level.down);

			if (level.share) {
				shared[path] = driver;
			}
		}

		hooks = patch.hooks(config, driver);


		gun.opt(hooks, true);

	});


/***/ },
/* 2 */
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
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	/*jslint node: true */
	'use strict';

	function when(obj, prop) {
		return {
			is: function (type) {
				return {
					set: function (val) {
						if (typeof obj[prop] === type) {
							obj[prop] = val;
						}
					}
				};
			},
			isnt: function (type) {
				return {
					set: function (val) {
						if (typeof obj[prop] !== type) {
							obj[prop] = val;
						}
					}
				};
			}
		};
	}

	function unless(obj, prop) {
		return {
			set: function (val) {
				return (obj[prop] = obj[prop] || val);
			}
		};
	}

	// patch single-condition options
	function patch(opt) {
		unless(opt.level, 'db').set(null);
		unless(opt.level, 'down').set({});
		unless(opt.level, 'blaze').set(false);
		unless(opt.level, 'path').set('level/');
		unless(opt.level, 'up').set(__webpack_require__(4));
		unless(opt.level.down, 'valueEncoding').set('json');
		return opt;
	}

	// handle deprecated options
	function findDeprecated(opt) {
		if (typeof opt.level.folder !== 'undefined') {
			opt.level.path = opt.level.folder;
			opt.level.folder = undefined;
			console.warn('\tThe gun-level "folder" option has been deprecated.');
			console.warn('\tUse "path" or "blaze" instead.\n');
		}
		return opt;
	}

	module.exports = {
		level: function (opt, level) {
			// Give default options where they aren't defined
			opt = opt || {};

			if (opt.level === false) {
				// return if level is disabled
				return opt.level;
			}

			unless(opt, 'level').set({});

			// level wasn't defined. We're flying blind.
			when(opt, 'level').isnt('object').set({
				share: true
			});

			// the user wants to use a db module
			when(opt.level, 'down').is('function').set({
				db: opt.level.down
			});

			// the user wants to blaze a path
			if (typeof opt.level.blaze === 'string') {
				opt.level.path = opt.level.blaze;
				opt.level.blaze = true;
			}

			// define default share settings
			var sharing = when(opt.level, 'share').is('undefined').set;
			if (opt.level.blaze === true) {
				sharing(true);
			}
			sharing(false);

			// handle deprecated options
			findDeprecated(opt);

			// set the minor defaults
			return patch(opt).level;
		},

		hooks: function (opt, level) {
			// grab the corresponding method name
			function driver(name) {
				return __webpack_require__(64)("./" + name)(level);
			}

			opt = opt || {};

			unless(opt, 'hooks').set({});
			unless(opt.hooks, 'get').set(driver('get'));
			unless(opt.hooks, 'put').set(driver('put'));
			unless(opt.hooks, 'key').set(driver('key'));

			return {
				hooks: opt.hooks
			};
		}
	};


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {/* Copyright (c) 2012-2015 LevelUP contributors
	 * See list at <https://github.com/level/levelup#contributing>
	 * MIT License
	 * <https://github.com/level/levelup/blob/master/LICENSE.md>
	 */

	var EventEmitter        = __webpack_require__(6).EventEmitter
	  , inherits            = __webpack_require__(7).inherits
	  , deprecate           = __webpack_require__(7).deprecate
	  , extend              = __webpack_require__(10)
	  , prr                 = __webpack_require__(11)
	  , DeferredLevelDOWN   = __webpack_require__(12)
	  , IteratorStream      = __webpack_require__(23)

	  , errors              = __webpack_require__(52)
	  , WriteError          = errors.WriteError
	  , ReadError           = errors.ReadError
	  , NotFoundError       = errors.NotFoundError
	  , OpenError           = errors.OpenError
	  , EncodingError       = errors.EncodingError
	  , InitializationError = errors.InitializationError

	  , util                = __webpack_require__(56)
	  , Batch               = __webpack_require__(61)
	  , Codec               = __webpack_require__(62)

	  , getOptions          = util.getOptions
	  , defaultOptions      = util.defaultOptions
	  , getLevelDOWN        = util.getLevelDOWN
	  , dispatchError       = util.dispatchError
	  , isDefined           = util.isDefined

	function getCallback (options, callback) {
	  return typeof options == 'function' ? options : callback
	}

	// Possible LevelUP#_status values:
	//  - 'new'     - newly created, not opened or closed
	//  - 'opening' - waiting for the database to be opened, post open()
	//  - 'open'    - successfully opened the database, available for use
	//  - 'closing' - waiting for the database to be closed, post close()
	//  - 'closed'  - database has been successfully closed, should not be
	//                 used except for another open() operation

	function LevelUP (location, options, callback) {
	  if (!(this instanceof LevelUP))
	    return new LevelUP(location, options, callback)

	  var error

	  EventEmitter.call(this)
	  this.setMaxListeners(Infinity)

	  if (typeof location == 'function') {
	    options = typeof options == 'object' ? options : {}
	    options.db = location
	    location = null
	  } else if (typeof location == 'object' && typeof location.db == 'function') {
	    options = location
	    location = null
	  }


	  if (typeof options == 'function') {
	    callback = options
	    options  = {}
	  }

	  if ((!options || typeof options.db != 'function') && typeof location != 'string') {
	    error = new InitializationError(
	        'Must provide a location for the database')
	    if (callback) {
	      return process.nextTick(function () {
	        callback(error)
	      })
	    }
	    throw error
	  }

	  options      = getOptions(options)
	  this.options = extend(defaultOptions, options)
	  this._codec = new Codec(this.options)
	  this._status = 'new'
	  // set this.location as enumerable but not configurable or writable
	  prr(this, 'location', location, 'e')

	  this.open(callback)
	}

	inherits(LevelUP, EventEmitter)

	LevelUP.prototype.open = function (callback) {
	  var self = this
	    , dbFactory
	    , db

	  if (this.isOpen()) {
	    if (callback)
	      process.nextTick(function () { callback(null, self) })
	    return this
	  }

	  if (this._isOpening()) {
	    return callback && this.once(
	        'open'
	      , function () { callback(null, self) }
	    )
	  }

	  this.emit('opening')

	  this._status = 'opening'
	  this.db      = new DeferredLevelDOWN(this.location)
	  dbFactory    = this.options.db || getLevelDOWN()
	  db           = dbFactory(this.location)

	  db.open(this.options, function (err) {
	    if (err) {
	      return dispatchError(self, new OpenError(err), callback)
	    } else {
	      self.db.setDb(db)
	      self.db = db
	      self._status = 'open'
	      if (callback)
	        callback(null, self)
	      self.emit('open')
	      self.emit('ready')
	    }
	  })
	}

	LevelUP.prototype.close = function (callback) {
	  var self = this

	  if (this.isOpen()) {
	    this._status = 'closing'
	    this.db.close(function () {
	      self._status = 'closed'
	      self.emit('closed')
	      if (callback)
	        callback.apply(null, arguments)
	    })
	    this.emit('closing')
	    this.db = new DeferredLevelDOWN(this.location)
	  } else if (this._status == 'closed' && callback) {
	    return process.nextTick(callback)
	  } else if (this._status == 'closing' && callback) {
	    this.once('closed', callback)
	  } else if (this._isOpening()) {
	    this.once('open', function () {
	      self.close(callback)
	    })
	  }
	}

	LevelUP.prototype.isOpen = function () {
	  return this._status == 'open'
	}

	LevelUP.prototype._isOpening = function () {
	  return this._status == 'opening'
	}

	LevelUP.prototype.isClosed = function () {
	  return (/^clos/).test(this._status)
	}

	function maybeError(db, options, callback) {
	  if (!db._isOpening() && !db.isOpen()) {
	    dispatchError(
	        db
	      , new ReadError('Database is not open')
	      , callback
	    )
	    return true
	  }
	}

	function writeError (db, message, callback) {
	  dispatchError(
	      db
	     , new WriteError(message)
	     , callback
	  )
	}

	function readError (db, message, callback) {
	  dispatchError(
	      db
	     , new ReadError(message)
	     , callback
	  )
	}


	LevelUP.prototype.get = function (key_, options, callback) {
	  var self = this
	    , key

	  callback = getCallback(options, callback)

	  if (maybeError(this, options, callback))
	    return

	  if (key_ === null || key_ === undefined || 'function' !== typeof callback)
	    return readError(this
	      , 'get() requires key and callback arguments', callback)

	  options = util.getOptions(options)
	  key = this._codec.encodeKey(key_, options)

	  options.asBuffer = this._codec.valueAsBuffer(options)

	  this.db.get(key, options, function (err, value) {
	    if (err) {
	      if ((/notfound/i).test(err) || err.notFound) {
	        err = new NotFoundError(
	            'Key not found in database [' + key_ + ']', err)
	      } else {
	        err = new ReadError(err)
	      }
	      return dispatchError(self, err, callback)
	    }
	    if (callback) {
	      try {
	        value = self._codec.decodeValue(value, options)
	      } catch (e) {
	        return callback(new EncodingError(e))
	      }
	      callback(null, value)
	    }
	  })
	}

	LevelUP.prototype.put = function (key_, value_, options, callback) {
	  var self = this
	    , key
	    , value

	  callback = getCallback(options, callback)

	  if (key_ === null || key_ === undefined)
	    return writeError(this, 'put() requires a key argument', callback)

	  if (maybeError(this, options, callback))
	    return

	  options = getOptions(options)
	  key     = this._codec.encodeKey(key_, options)
	  value   = this._codec.encodeValue(value_, options)

	  this.db.put(key, value, options, function (err) {
	    if (err) {
	      return dispatchError(self, new WriteError(err), callback)
	    } else {
	      self.emit('put', key_, value_)
	      if (callback)
	        callback()
	    }
	  })
	}

	LevelUP.prototype.del = function (key_, options, callback) {
	  var self = this
	    , key

	  callback = getCallback(options, callback)

	  if (key_ === null || key_ === undefined)
	    return writeError(this, 'del() requires a key argument', callback)

	  if (maybeError(this, options, callback))
	    return

	  options = getOptions(options)
	  key     = this._codec.encodeKey(key_, options)

	  this.db.del(key, options, function (err) {
	    if (err) {
	      return dispatchError(self, new WriteError(err), callback)
	    } else {
	      self.emit('del', key_)
	      if (callback)
	        callback()
	    }
	  })
	}

	LevelUP.prototype.batch = function (arr_, options, callback) {
	  var self = this
	    , keyEnc
	    , valueEnc
	    , arr

	  if (!arguments.length)
	    return new Batch(this, this._codec)

	  callback = getCallback(options, callback)

	  if (!Array.isArray(arr_))
	    return writeError(this, 'batch() requires an array argument', callback)

	  if (maybeError(this, options, callback))
	    return

	  options  = getOptions(options)
	  arr      = self._codec.encodeBatch(arr_, options)
	  arr      = arr.map(function (op) {
	    if (!op.type && op.key !== undefined && op.value !== undefined)
	      op.type = 'put'
	    return op
	  })

	  this.db.batch(arr, options, function (err) {
	    if (err) {
	      return dispatchError(self, new WriteError(err), callback)
	    } else {
	      self.emit('batch', arr_)
	      if (callback)
	        callback()
	    }
	  })
	}

	LevelUP.prototype.approximateSize = deprecate(function (start_, end_, options, callback) {   
	  var self = this    
	    , start    
	    , end    
	   
	  callback = getCallback(options, callback)    
	   
	  options = getOptions(options)    
	   
	  if (start_ === null || start_ === undefined    
	        || end_ === null || end_ === undefined || 'function' !== typeof callback)    
	    return readError(this, 'approximateSize() requires start, end and callback arguments', callback)   
	   
	  start = this._codec.encodeKey(start_, options)   
	  end   = this._codec.encodeKey(end_, options)   
	   
	  this.db.approximateSize(start, end, function (err, size) {   
	    if (err) {   
	      return dispatchError(self, new OpenError(err), callback)   
	    } else if (callback) {   
	      callback(null, size)   
	    }    
	  })   
	}, 'db.approximateSize() is deprecated. Use db.db.approximateSize() instead')

	LevelUP.prototype.readStream =
	LevelUP.prototype.createReadStream = function (options) {
	  options = extend( {keys: true, values: true}, this.options, options)

	  options.keyEncoding   = options.keyEncoding
	  options.valueEncoding = options.valueEncoding

	  options = this._codec.encodeLtgt(options);
	  options.keyAsBuffer   = this._codec.keyAsBuffer(options)
	  options.valueAsBuffer = this._codec.valueAsBuffer(options)

	  if ('number' !== typeof options.limit)
	    options.limit = -1

	  return new IteratorStream(this.db.iterator(options), extend(options, {
	    decoder: this._codec.createStreamDecoder(options)
	  }))
	}

	LevelUP.prototype.keyStream =
	LevelUP.prototype.createKeyStream = function (options) {
	  return this.createReadStream(extend(options, { keys: true, values: false }))
	}

	LevelUP.prototype.valueStream =
	LevelUP.prototype.createValueStream = function (options) {
	  return this.createReadStream(extend(options, { keys: false, values: true }))
	}

	LevelUP.prototype.toString = function () {
	  return 'LevelUP'
	}

	function utilStatic (name) {
	  return function (location, callback) {
	    getLevelDOWN()[name](location, callback || function () {})
	  }
	}

	module.exports         = LevelUP
	module.exports.errors  = __webpack_require__(52)
	module.exports.destroy = deprecate(
	    utilStatic('destroy')
	  , 'levelup.destroy() is deprecated. Use leveldown.destroy() instead'
	)
	module.exports.repair  = deprecate(
	    utilStatic('repair')
	  , 'levelup.repair() is deprecated. Use leveldown.repair() instead'
	)


	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)))

/***/ },
/* 5 */
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
/* 6 */
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
/* 7 */
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

	exports.isBuffer = __webpack_require__(8);

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
	exports.inherits = __webpack_require__(9);

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

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(5)))

/***/ },
/* 8 */
/***/ function(module, exports) {

	module.exports = function isBuffer(arg) {
	  return arg && typeof arg === 'object'
	    && typeof arg.copy === 'function'
	    && typeof arg.fill === 'function'
	    && typeof arg.readUInt8 === 'function';
	}

/***/ },
/* 9 */
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
/* 10 */
/***/ function(module, exports) {

	module.exports = extend

	var hasOwnProperty = Object.prototype.hasOwnProperty;

	function extend() {
	    var target = {}

	    for (var i = 0; i < arguments.length; i++) {
	        var source = arguments[i]

	        for (var key in source) {
	            if (hasOwnProperty.call(source, key)) {
	                target[key] = source[key]
	            }
	        }
	    }

	    return target
	}


/***/ },
/* 11 */
/***/ function(module, exports) {

	/*!
	  * prr
	  * (c) 2013 Rod Vagg <rod@vagg.org>
	  * https://github.com/rvagg/prr
	  * License: MIT
	  */

	(function (name, context, definition) {
	  if (typeof module != 'undefined' && module.exports)
	    module.exports = definition()
	  else
	    context[name] = definition()
	})('prr', this, function() {

	  var setProperty = typeof Object.defineProperty == 'function'
	      ? function (obj, key, options) {
	          Object.defineProperty(obj, key, options)
	          return obj
	        }
	      : function (obj, key, options) { // < es5
	          obj[key] = options.value
	          return obj
	        }

	    , makeOptions = function (value, options) {
	        var oo = typeof options == 'object'
	          , os = !oo && typeof options == 'string'
	          , op = function (p) {
	              return oo
	                ? !!options[p]
	                : os
	                  ? options.indexOf(p[0]) > -1
	                  : false
	            }

	        return {
	            enumerable   : op('enumerable')
	          , configurable : op('configurable')
	          , writable     : op('writable')
	          , value        : value
	        }
	      }

	    , prr = function (obj, key, value, options) {
	        var k

	        options = makeOptions(value, options)

	        if (typeof key == 'object') {
	          for (k in key) {
	            if (Object.hasOwnProperty.call(key, k)) {
	              options.value = key[k]
	              setProperty(obj, k, options)
	            }
	          }
	          return obj
	        }

	        return setProperty(obj, key, options)
	      }

	  return prr
	})

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process, Buffer) {var util              = __webpack_require__(7)
	  , AbstractLevelDOWN = __webpack_require__(17).AbstractLevelDOWN
	  , DeferredIterator  = __webpack_require__(22)

	function DeferredLevelDOWN (location) {
	  AbstractLevelDOWN.call(this, typeof location == 'string' ? location : '') // optional location, who cares?
	  this._db         = undefined
	  this._operations = []
	  this._iterators  = []
	}

	util.inherits(DeferredLevelDOWN, AbstractLevelDOWN)

	// called by LevelUP when we have a real DB to take its place
	DeferredLevelDOWN.prototype.setDb = function (db) {
	  this._db = db
	  this._operations.forEach(function (op) {
	    db[op.method].apply(db, op.args)
	  })
	  this._iterators.forEach(function (it) {
	    it.setDb(db)
	  })
	}

	DeferredLevelDOWN.prototype._open = function (options, callback) {
	  return process.nextTick(callback)
	}

	// queue a new deferred operation
	DeferredLevelDOWN.prototype._operation = function (method, args) {
	  if (this._db)
	    return this._db[method].apply(this._db, args)
	  this._operations.push({ method: method, args: args })
	}

	// deferrables
	'put get del batch approximateSize'.split(' ').forEach(function (m) {
	  DeferredLevelDOWN.prototype['_' + m] = function () {
	    this._operation(m, arguments)
	  }
	})

	DeferredLevelDOWN.prototype._isBuffer = function (obj) {
	  return Buffer.isBuffer(obj)
	}

	DeferredLevelDOWN.prototype._iterator = function (options) {
	  if (this._db)
	    return this._db.iterator.apply(this._db, arguments)
	  var it = new DeferredIterator(options)
	  this._iterators.push(it)
	  return it
	}

	module.exports                  = DeferredLevelDOWN
	module.exports.DeferredIterator = DeferredIterator

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5), __webpack_require__(13).Buffer))

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer, global) {/*!
	 * The buffer module from node.js, for the browser.
	 *
	 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
	 * @license  MIT
	 */
	/* eslint-disable no-proto */

	var base64 = __webpack_require__(14)
	var ieee754 = __webpack_require__(15)
	var isArray = __webpack_require__(16)

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

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(13).Buffer, (function() { return this; }())))

/***/ },
/* 14 */
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
/* 15 */
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
/* 16 */
/***/ function(module, exports) {

	var toString = {}.toString;

	module.exports = Array.isArray || function (arr) {
	  return toString.call(arr) == '[object Array]';
	};


/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	exports.AbstractLevelDOWN    = __webpack_require__(18)
	exports.AbstractIterator     = __webpack_require__(19)
	exports.AbstractChainedBatch = __webpack_require__(20)
	exports.isLevelDOWN          = __webpack_require__(21)


/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process, Buffer) {/* Copyright (c) 2013 Rod Vagg, MIT License */

	var xtend                = __webpack_require__(10)
	  , AbstractIterator     = __webpack_require__(19)
	  , AbstractChainedBatch = __webpack_require__(20)

	function AbstractLevelDOWN (location) {
	  if (!arguments.length || location === undefined)
	    throw new Error('constructor requires at least a location argument')

	  if (typeof location != 'string')
	    throw new Error('constructor requires a location string argument')

	  this.location = location
	  this.status = 'new'
	}

	AbstractLevelDOWN.prototype.open = function (options, callback) {
	  var self      = this
	    , oldStatus = this.status

	  if (typeof options == 'function')
	    callback = options

	  if (typeof callback != 'function')
	    throw new Error('open() requires a callback argument')

	  if (typeof options != 'object')
	    options = {}

	  options.createIfMissing = options.createIfMissing != false
	  options.errorIfExists = !!options.errorIfExists

	  if (typeof this._open == 'function') {
	    this.status = 'opening'
	    this._open(options, function (err) {
	      if (err) {
	        self.status = oldStatus
	        return callback(err)
	      }
	      self.status = 'open'
	      callback()
	    })
	  } else {
	    this.status = 'open'
	    process.nextTick(callback)
	  }
	}

	AbstractLevelDOWN.prototype.close = function (callback) {
	  var self      = this
	    , oldStatus = this.status

	  if (typeof callback != 'function')
	    throw new Error('close() requires a callback argument')

	  if (typeof this._close == 'function') {
	    this.status = 'closing'
	    this._close(function (err) {
	      if (err) {
	        self.status = oldStatus
	        return callback(err)
	      }
	      self.status = 'closed'
	      callback()
	    })
	  } else {
	    this.status = 'closed'
	    process.nextTick(callback)
	  }
	}

	AbstractLevelDOWN.prototype.get = function (key, options, callback) {
	  var err

	  if (typeof options == 'function')
	    callback = options

	  if (typeof callback != 'function')
	    throw new Error('get() requires a callback argument')

	  if (err = this._checkKey(key, 'key', this._isBuffer))
	    return callback(err)

	  if (!this._isBuffer(key))
	    key = String(key)

	  if (typeof options != 'object')
	    options = {}

	  options.asBuffer = options.asBuffer != false

	  if (typeof this._get == 'function')
	    return this._get(key, options, callback)

	  process.nextTick(function () { callback(new Error('NotFound')) })
	}

	AbstractLevelDOWN.prototype.put = function (key, value, options, callback) {
	  var err

	  if (typeof options == 'function')
	    callback = options

	  if (typeof callback != 'function')
	    throw new Error('put() requires a callback argument')

	  if (err = this._checkKey(key, 'key', this._isBuffer))
	    return callback(err)

	  if (!this._isBuffer(key))
	    key = String(key)

	  // coerce value to string in node, don't touch it in browser
	  // (indexeddb can store any JS type)
	  if (value != null && !this._isBuffer(value) && !process.browser)
	    value = String(value)

	  if (typeof options != 'object')
	    options = {}

	  if (typeof this._put == 'function')
	    return this._put(key, value, options, callback)

	  process.nextTick(callback)
	}

	AbstractLevelDOWN.prototype.del = function (key, options, callback) {
	  var err

	  if (typeof options == 'function')
	    callback = options

	  if (typeof callback != 'function')
	    throw new Error('del() requires a callback argument')

	  if (err = this._checkKey(key, 'key', this._isBuffer))
	    return callback(err)

	  if (!this._isBuffer(key))
	    key = String(key)

	  if (typeof options != 'object')
	    options = {}

	  if (typeof this._del == 'function')
	    return this._del(key, options, callback)

	  process.nextTick(callback)
	}

	AbstractLevelDOWN.prototype.batch = function (array, options, callback) {
	  if (!arguments.length)
	    return this._chainedBatch()

	  if (typeof options == 'function')
	    callback = options

	  if (typeof array == 'function')
	    callback = array

	  if (typeof callback != 'function')
	    throw new Error('batch(array) requires a callback argument')

	  if (!Array.isArray(array))
	    return callback(new Error('batch(array) requires an array argument'))

	  if (!options || typeof options != 'object')
	    options = {}

	  var i = 0
	    , l = array.length
	    , e
	    , err

	  for (; i < l; i++) {
	    e = array[i]
	    if (typeof e != 'object')
	      continue

	    if (err = this._checkKey(e.type, 'type', this._isBuffer))
	      return callback(err)

	    if (err = this._checkKey(e.key, 'key', this._isBuffer))
	      return callback(err)
	  }

	  if (typeof this._batch == 'function')
	    return this._batch(array, options, callback)

	  process.nextTick(callback)
	}

	//TODO: remove from here, not a necessary primitive
	AbstractLevelDOWN.prototype.approximateSize = function (start, end, callback) {
	  if (   start == null
	      || end == null
	      || typeof start == 'function'
	      || typeof end == 'function') {
	    throw new Error('approximateSize() requires valid `start`, `end` and `callback` arguments')
	  }

	  if (typeof callback != 'function')
	    throw new Error('approximateSize() requires a callback argument')

	  if (!this._isBuffer(start))
	    start = String(start)

	  if (!this._isBuffer(end))
	    end = String(end)

	  if (typeof this._approximateSize == 'function')
	    return this._approximateSize(start, end, callback)

	  process.nextTick(function () {
	    callback(null, 0)
	  })
	}

	AbstractLevelDOWN.prototype._setupIteratorOptions = function (options) {
	  var self = this

	  options = xtend(options)

	  ;[ 'start', 'end', 'gt', 'gte', 'lt', 'lte' ].forEach(function (o) {
	    if (options[o] && self._isBuffer(options[o]) && options[o].length === 0)
	      delete options[o]
	  })

	  options.reverse = !!options.reverse
	  options.keys = options.keys != false
	  options.values = options.values != false
	  options.limit = 'limit' in options ? options.limit : -1
	  options.keyAsBuffer = options.keyAsBuffer != false
	  options.valueAsBuffer = options.valueAsBuffer != false

	  return options
	}

	AbstractLevelDOWN.prototype.iterator = function (options) {
	  if (typeof options != 'object')
	    options = {}

	  options = this._setupIteratorOptions(options)

	  if (typeof this._iterator == 'function')
	    return this._iterator(options)

	  return new AbstractIterator(this)
	}

	AbstractLevelDOWN.prototype._chainedBatch = function () {
	  return new AbstractChainedBatch(this)
	}

	AbstractLevelDOWN.prototype._isBuffer = function (obj) {
	  return Buffer.isBuffer(obj)
	}

	AbstractLevelDOWN.prototype._checkKey = function (obj, type) {

	  if (obj === null || obj === undefined)
	    return new Error(type + ' cannot be `null` or `undefined`')

	  if (this._isBuffer(obj)) {
	    if (obj.length === 0)
	      return new Error(type + ' cannot be an empty Buffer')
	  } else if (String(obj) === '')
	    return new Error(type + ' cannot be an empty String')
	}

	module.exports = AbstractLevelDOWN

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5), __webpack_require__(13).Buffer))

/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {/* Copyright (c) 2013 Rod Vagg, MIT License */

	function AbstractIterator (db) {
	  this.db = db
	  this._ended = false
	  this._nexting = false
	}

	AbstractIterator.prototype.next = function (callback) {
	  var self = this

	  if (typeof callback != 'function')
	    throw new Error('next() requires a callback argument')

	  if (self._ended)
	    return callback(new Error('cannot call next() after end()'))
	  if (self._nexting)
	    return callback(new Error('cannot call next() before previous next() has completed'))

	  self._nexting = true
	  if (typeof self._next == 'function') {
	    return self._next(function () {
	      self._nexting = false
	      callback.apply(null, arguments)
	    })
	  }

	  process.nextTick(function () {
	    self._nexting = false
	    callback()
	  })
	}

	AbstractIterator.prototype.end = function (callback) {
	  if (typeof callback != 'function')
	    throw new Error('end() requires a callback argument')

	  if (this._ended)
	    return callback(new Error('end() already called on iterator'))

	  this._ended = true

	  if (typeof this._end == 'function')
	    return this._end(callback)

	  process.nextTick(callback)
	}

	module.exports = AbstractIterator

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)))

/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {/* Copyright (c) 2013 Rod Vagg, MIT License */

	function AbstractChainedBatch (db) {
	  this._db         = db
	  this._operations = []
	  this._written    = false
	}

	AbstractChainedBatch.prototype._checkWritten = function () {
	  if (this._written)
	    throw new Error('write() already called on this batch')
	}

	AbstractChainedBatch.prototype.put = function (key, value) {
	  this._checkWritten()

	  var err = this._db._checkKey(key, 'key', this._db._isBuffer)
	  if (err)
	    throw err

	  if (!this._db._isBuffer(key)) key = String(key)
	  if (!this._db._isBuffer(value)) value = String(value)

	  if (typeof this._put == 'function' )
	    this._put(key, value)
	  else
	    this._operations.push({ type: 'put', key: key, value: value })

	  return this
	}

	AbstractChainedBatch.prototype.del = function (key) {
	  this._checkWritten()

	  var err = this._db._checkKey(key, 'key', this._db._isBuffer)
	  if (err) throw err

	  if (!this._db._isBuffer(key)) key = String(key)

	  if (typeof this._del == 'function' )
	    this._del(key)
	  else
	    this._operations.push({ type: 'del', key: key })

	  return this
	}

	AbstractChainedBatch.prototype.clear = function () {
	  this._checkWritten()

	  this._operations = []

	  if (typeof this._clear == 'function' )
	    this._clear()

	  return this
	}

	AbstractChainedBatch.prototype.write = function (options, callback) {
	  this._checkWritten()

	  if (typeof options == 'function')
	    callback = options
	  if (typeof callback != 'function')
	    throw new Error('write() requires a callback argument')
	  if (typeof options != 'object')
	    options = {}

	  this._written = true

	  if (typeof this._write == 'function' )
	    return this._write(callback)

	  if (typeof this._db._batch == 'function')
	    return this._db._batch(this._operations, options, callback)

	  process.nextTick(callback)
	}

	module.exports = AbstractChainedBatch
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)))

/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	var AbstractLevelDOWN = __webpack_require__(18)

	function isLevelDOWN (db) {
	  if (!db || typeof db !== 'object')
	    return false
	  return Object.keys(AbstractLevelDOWN.prototype).filter(function (name) {
	    // TODO remove approximateSize check when method is gone
	    return name[0] != '_' && name != 'approximateSize'
	  }).every(function (name) {
	    return typeof db[name] == 'function'
	  })
	}

	module.exports = isLevelDOWN


/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	var util = __webpack_require__(7)
	  , AbstractIterator = __webpack_require__(17).AbstractIterator


	function DeferredIterator (options) {
	  AbstractIterator.call(this, options)

	  this._options = options
	  this._iterator = null
	  this._operations = []
	}

	util.inherits(DeferredIterator, AbstractIterator)

	DeferredIterator.prototype.setDb = function (db) {
	  var it = this._iterator = db.iterator(this._options)
	  this._operations.forEach(function (op) {
	    it[op.method].apply(it, op.args)
	  })
	}

	DeferredIterator.prototype._operation = function (method, args) {
	  if (this._iterator)
	    return this._iterator[method].apply(this._iterator, args)
	  this._operations.push({ method: method, args: args })
	}

	'next end'.split(' ').forEach(function (m) {
	  DeferredIterator.prototype['_' + m] = function () {
	    this._operation(m, arguments)
	  }
	})

	module.exports = DeferredIterator;


/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	var inherits = __webpack_require__(24);
	var Readable = __webpack_require__(25).Readable;
	var extend = __webpack_require__(10);
	var EncodingError = __webpack_require__(52).EncodingError;

	module.exports = ReadStream;
	inherits(ReadStream, Readable);

	function ReadStream(iterator, options){
	  if (!(this instanceof ReadStream)) return new ReadStream(iterator, options);
	  Readable.call(this, extend(options, {
	    objectMode: true
	  }));
	  this._iterator = iterator;
	  this._destroyed = false;
	  this._decoder = null;
	  if (options && options.decoder) this._decoder = options.decoder;
	  this.on('end', this._cleanup.bind(this));
	}

	ReadStream.prototype._read = function(){
	  var self = this;
	  if (this._destroyed) return;

	  this._iterator.next(function(err, key, value){
	    if (self._destroyed) return;
	    if (err) return self.emit('error', err);
	    if (key === undefined && value === undefined) {
	      self.push(null);
	    } else {
	      if (!self._decoder) return self.push({ key: key, value: value });

	      try {
	        var value = self._decoder(key, value);
	      } catch (err) {
	        self.emit('error', new EncodingError(err));
	        self.push(null);
	        return;
	      }
	      self.push(value);
	    }
	  });
	};

	ReadStream.prototype.destroy =
	ReadStream.prototype._cleanup = function(){
	  var self = this;
	  if (this._destroyed) return;
	  this._destroyed = true;

	  this._iterator.end(function(err){
	    if (err) return self.emit('error', err);
	    self.emit('close');
	  });
	};



/***/ },
/* 24 */
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
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(26);
	exports.Stream = __webpack_require__(28);
	exports.Readable = exports;
	exports.Writable = __webpack_require__(48);
	exports.Duplex = __webpack_require__(47);
	exports.Transform = __webpack_require__(50);
	exports.PassThrough = __webpack_require__(51);


/***/ },
/* 26 */
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
	var isArray = __webpack_require__(27);
	/*</replacement>*/


	/*<replacement>*/
	var Buffer = __webpack_require__(13).Buffer;
	/*</replacement>*/

	Readable.ReadableState = ReadableState;

	var EE = __webpack_require__(6).EventEmitter;

	/*<replacement>*/
	if (!EE.listenerCount) EE.listenerCount = function(emitter, type) {
	  return emitter.listeners(type).length;
	};
	/*</replacement>*/

	var Stream = __webpack_require__(28);

	/*<replacement>*/
	var util = __webpack_require__(45);
	util.inherits = __webpack_require__(24);
	/*</replacement>*/

	var StringDecoder;


	/*<replacement>*/
	var debug = __webpack_require__(46);
	if (debug && debug.debuglog) {
	  debug = debug.debuglog('stream');
	} else {
	  debug = function () {};
	}
	/*</replacement>*/


	util.inherits(Readable, Stream);

	function ReadableState(options, stream) {
	  var Duplex = __webpack_require__(47);

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
	      StringDecoder = __webpack_require__(49).StringDecoder;
	    this.decoder = new StringDecoder(options.encoding);
	    this.encoding = options.encoding;
	  }
	}

	function Readable(options) {
	  var Duplex = __webpack_require__(47);

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
	    StringDecoder = __webpack_require__(49).StringDecoder;
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

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)))

/***/ },
/* 27 */
/***/ function(module, exports) {

	module.exports = Array.isArray || function (arr) {
	  return Object.prototype.toString.call(arr) == '[object Array]';
	};


/***/ },
/* 28 */
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

	var EE = __webpack_require__(6).EventEmitter;
	var inherits = __webpack_require__(29);

	inherits(Stream, EE);
	Stream.Readable = __webpack_require__(30);
	Stream.Writable = __webpack_require__(41);
	Stream.Duplex = __webpack_require__(42);
	Stream.Transform = __webpack_require__(43);
	Stream.PassThrough = __webpack_require__(44);

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
/* 29 */
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
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(31);
	exports.Stream = __webpack_require__(28);
	exports.Readable = exports;
	exports.Writable = __webpack_require__(37);
	exports.Duplex = __webpack_require__(36);
	exports.Transform = __webpack_require__(39);
	exports.PassThrough = __webpack_require__(40);


/***/ },
/* 31 */
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
	var isArray = __webpack_require__(32);
	/*</replacement>*/


	/*<replacement>*/
	var Buffer = __webpack_require__(13).Buffer;
	/*</replacement>*/

	Readable.ReadableState = ReadableState;

	var EE = __webpack_require__(6).EventEmitter;

	/*<replacement>*/
	if (!EE.listenerCount) EE.listenerCount = function(emitter, type) {
	  return emitter.listeners(type).length;
	};
	/*</replacement>*/

	var Stream = __webpack_require__(28);

	/*<replacement>*/
	var util = __webpack_require__(33);
	util.inherits = __webpack_require__(34);
	/*</replacement>*/

	var StringDecoder;


	/*<replacement>*/
	var debug = __webpack_require__(35);
	if (debug && debug.debuglog) {
	  debug = debug.debuglog('stream');
	} else {
	  debug = function () {};
	}
	/*</replacement>*/


	util.inherits(Readable, Stream);

	function ReadableState(options, stream) {
	  var Duplex = __webpack_require__(36);

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
	      StringDecoder = __webpack_require__(38).StringDecoder;
	    this.decoder = new StringDecoder(options.encoding);
	    this.encoding = options.encoding;
	  }
	}

	function Readable(options) {
	  var Duplex = __webpack_require__(36);

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
	    StringDecoder = __webpack_require__(38).StringDecoder;
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

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)))

/***/ },
/* 32 */
/***/ function(module, exports) {

	module.exports = Array.isArray || function (arr) {
	  return Object.prototype.toString.call(arr) == '[object Array]';
	};


/***/ },
/* 33 */
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

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(13).Buffer))

/***/ },
/* 34 */
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
/* 35 */
/***/ function(module, exports) {

	/* (ignored) */

/***/ },
/* 36 */
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
	var util = __webpack_require__(33);
	util.inherits = __webpack_require__(34);
	/*</replacement>*/

	var Readable = __webpack_require__(31);
	var Writable = __webpack_require__(37);

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

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)))

/***/ },
/* 37 */
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
	var Buffer = __webpack_require__(13).Buffer;
	/*</replacement>*/

	Writable.WritableState = WritableState;


	/*<replacement>*/
	var util = __webpack_require__(33);
	util.inherits = __webpack_require__(34);
	/*</replacement>*/

	var Stream = __webpack_require__(28);

	util.inherits(Writable, Stream);

	function WriteReq(chunk, encoding, cb) {
	  this.chunk = chunk;
	  this.encoding = encoding;
	  this.callback = cb;
	}

	function WritableState(options, stream) {
	  var Duplex = __webpack_require__(36);

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
	  var Duplex = __webpack_require__(36);

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

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)))

/***/ },
/* 38 */
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

	var Buffer = __webpack_require__(13).Buffer;

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
/* 39 */
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

	var Duplex = __webpack_require__(36);

	/*<replacement>*/
	var util = __webpack_require__(33);
	util.inherits = __webpack_require__(34);
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
/* 40 */
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

	var Transform = __webpack_require__(39);

	/*<replacement>*/
	var util = __webpack_require__(33);
	util.inherits = __webpack_require__(34);
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
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(37)


/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(36)


/***/ },
/* 43 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(39)


/***/ },
/* 44 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(40)


/***/ },
/* 45 */
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

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(13).Buffer))

/***/ },
/* 46 */
/***/ function(module, exports) {

	/* (ignored) */

/***/ },
/* 47 */
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
	var util = __webpack_require__(45);
	util.inherits = __webpack_require__(24);
	/*</replacement>*/

	var Readable = __webpack_require__(26);
	var Writable = __webpack_require__(48);

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

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)))

/***/ },
/* 48 */
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
	var Buffer = __webpack_require__(13).Buffer;
	/*</replacement>*/

	Writable.WritableState = WritableState;


	/*<replacement>*/
	var util = __webpack_require__(45);
	util.inherits = __webpack_require__(24);
	/*</replacement>*/

	var Stream = __webpack_require__(28);

	util.inherits(Writable, Stream);

	function WriteReq(chunk, encoding, cb) {
	  this.chunk = chunk;
	  this.encoding = encoding;
	  this.callback = cb;
	}

	function WritableState(options, stream) {
	  var Duplex = __webpack_require__(47);

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
	  var Duplex = __webpack_require__(47);

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

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)))

/***/ },
/* 49 */
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

	var Buffer = __webpack_require__(13).Buffer;

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
/* 50 */
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

	var Duplex = __webpack_require__(47);

	/*<replacement>*/
	var util = __webpack_require__(45);
	util.inherits = __webpack_require__(24);
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
/* 51 */
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

	var Transform = __webpack_require__(50);

	/*<replacement>*/
	var util = __webpack_require__(45);
	util.inherits = __webpack_require__(24);
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
/* 52 */
/***/ function(module, exports, __webpack_require__) {

	/* Copyright (c) 2012-2015 LevelUP contributors
	 * See list at <https://github.com/rvagg/node-levelup#contributing>
	 * MIT License
	 * <https://github.com/rvagg/node-levelup/blob/master/LICENSE.md>
	 */

	var createError   = __webpack_require__(53).create
	  , LevelUPError  = createError('LevelUPError')
	  , NotFoundError = createError('NotFoundError', LevelUPError)

	NotFoundError.prototype.notFound = true
	NotFoundError.prototype.status   = 404

	module.exports = {
	    LevelUPError        : LevelUPError
	  , InitializationError : createError('InitializationError', LevelUPError)
	  , OpenError           : createError('OpenError', LevelUPError)
	  , ReadError           : createError('ReadError', LevelUPError)
	  , WriteError          : createError('WriteError', LevelUPError)
	  , NotFoundError       : NotFoundError
	  , EncodingError       : createError('EncodingError', LevelUPError)
	}


/***/ },
/* 53 */
/***/ function(module, exports, __webpack_require__) {

	var all = module.exports.all = [
	  {
	    errno: -2,
	    code: 'ENOENT',
	    description: 'no such file or directory'
	  },
	  {
	    errno: -1,
	    code: 'UNKNOWN',
	    description: 'unknown error'
	  },
	  {
	    errno: 0,
	    code: 'OK',
	    description: 'success'
	  },
	  {
	    errno: 1,
	    code: 'EOF',
	    description: 'end of file'
	  },
	  {
	    errno: 2,
	    code: 'EADDRINFO',
	    description: 'getaddrinfo error'
	  },
	  {
	    errno: 3,
	    code: 'EACCES',
	    description: 'permission denied'
	  },
	  {
	    errno: 4,
	    code: 'EAGAIN',
	    description: 'resource temporarily unavailable'
	  },
	  {
	    errno: 5,
	    code: 'EADDRINUSE',
	    description: 'address already in use'
	  },
	  {
	    errno: 6,
	    code: 'EADDRNOTAVAIL',
	    description: 'address not available'
	  },
	  {
	    errno: 7,
	    code: 'EAFNOSUPPORT',
	    description: 'address family not supported'
	  },
	  {
	    errno: 8,
	    code: 'EALREADY',
	    description: 'connection already in progress'
	  },
	  {
	    errno: 9,
	    code: 'EBADF',
	    description: 'bad file descriptor'
	  },
	  {
	    errno: 10,
	    code: 'EBUSY',
	    description: 'resource busy or locked'
	  },
	  {
	    errno: 11,
	    code: 'ECONNABORTED',
	    description: 'software caused connection abort'
	  },
	  {
	    errno: 12,
	    code: 'ECONNREFUSED',
	    description: 'connection refused'
	  },
	  {
	    errno: 13,
	    code: 'ECONNRESET',
	    description: 'connection reset by peer'
	  },
	  {
	    errno: 14,
	    code: 'EDESTADDRREQ',
	    description: 'destination address required'
	  },
	  {
	    errno: 15,
	    code: 'EFAULT',
	    description: 'bad address in system call argument'
	  },
	  {
	    errno: 16,
	    code: 'EHOSTUNREACH',
	    description: 'host is unreachable'
	  },
	  {
	    errno: 17,
	    code: 'EINTR',
	    description: 'interrupted system call'
	  },
	  {
	    errno: 18,
	    code: 'EINVAL',
	    description: 'invalid argument'
	  },
	  {
	    errno: 19,
	    code: 'EISCONN',
	    description: 'socket is already connected'
	  },
	  {
	    errno: 20,
	    code: 'EMFILE',
	    description: 'too many open files'
	  },
	  {
	    errno: 21,
	    code: 'EMSGSIZE',
	    description: 'message too long'
	  },
	  {
	    errno: 22,
	    code: 'ENETDOWN',
	    description: 'network is down'
	  },
	  {
	    errno: 23,
	    code: 'ENETUNREACH',
	    description: 'network is unreachable'
	  },
	  {
	    errno: 24,
	    code: 'ENFILE',
	    description: 'file table overflow'
	  },
	  {
	    errno: 25,
	    code: 'ENOBUFS',
	    description: 'no buffer space available'
	  },
	  {
	    errno: 26,
	    code: 'ENOMEM',
	    description: 'not enough memory'
	  },
	  {
	    errno: 27,
	    code: 'ENOTDIR',
	    description: 'not a directory'
	  },
	  {
	    errno: 28,
	    code: 'EISDIR',
	    description: 'illegal operation on a directory'
	  },
	  {
	    errno: 29,
	    code: 'ENONET',
	    description: 'machine is not on the network'
	  },
	  {
	    errno: 31,
	    code: 'ENOTCONN',
	    description: 'socket is not connected'
	  },
	  {
	    errno: 32,
	    code: 'ENOTSOCK',
	    description: 'socket operation on non-socket'
	  },
	  {
	    errno: 33,
	    code: 'ENOTSUP',
	    description: 'operation not supported on socket'
	  },
	  {
	    errno: 34,
	    code: 'ENOENT',
	    description: 'no such file or directory'
	  },
	  {
	    errno: 35,
	    code: 'ENOSYS',
	    description: 'function not implemented'
	  },
	  {
	    errno: 36,
	    code: 'EPIPE',
	    description: 'broken pipe'
	  },
	  {
	    errno: 37,
	    code: 'EPROTO',
	    description: 'protocol error'
	  },
	  {
	    errno: 38,
	    code: 'EPROTONOSUPPORT',
	    description: 'protocol not supported'
	  },
	  {
	    errno: 39,
	    code: 'EPROTOTYPE',
	    description: 'protocol wrong type for socket'
	  },
	  {
	    errno: 40,
	    code: 'ETIMEDOUT',
	    description: 'connection timed out'
	  },
	  {
	    errno: 41,
	    code: 'ECHARSET',
	    description: 'invalid Unicode character'
	  },
	  {
	    errno: 42,
	    code: 'EAIFAMNOSUPPORT',
	    description: 'address family for hostname not supported'
	  },
	  {
	    errno: 44,
	    code: 'EAISERVICE',
	    description: 'servname not supported for ai_socktype'
	  },
	  {
	    errno: 45,
	    code: 'EAISOCKTYPE',
	    description: 'ai_socktype not supported'
	  },
	  {
	    errno: 46,
	    code: 'ESHUTDOWN',
	    description: 'cannot send after transport endpoint shutdown'
	  },
	  {
	    errno: 47,
	    code: 'EEXIST',
	    description: 'file already exists'
	  },
	  {
	    errno: 48,
	    code: 'ESRCH',
	    description: 'no such process'
	  },
	  {
	    errno: 49,
	    code: 'ENAMETOOLONG',
	    description: 'name too long'
	  },
	  {
	    errno: 50,
	    code: 'EPERM',
	    description: 'operation not permitted'
	  },
	  {
	    errno: 51,
	    code: 'ELOOP',
	    description: 'too many symbolic links encountered'
	  },
	  {
	    errno: 52,
	    code: 'EXDEV',
	    description: 'cross-device link not permitted'
	  },
	  {
	    errno: 53,
	    code: 'ENOTEMPTY',
	    description: 'directory not empty'
	  },
	  {
	    errno: 54,
	    code: 'ENOSPC',
	    description: 'no space left on device'
	  },
	  {
	    errno: 55,
	    code: 'EIO',
	    description: 'i/o error'
	  },
	  {
	    errno: 56,
	    code: 'EROFS',
	    description: 'read-only file system'
	  },
	  {
	    errno: 57,
	    code: 'ENODEV',
	    description: 'no such device'
	  },
	  {
	    errno: 58,
	    code: 'ESPIPE',
	    description: 'invalid seek'
	  },
	  {
	    errno: 59,
	    code: 'ECANCELED',
	    description: 'operation canceled'
	  }
	]

	module.exports.errno = {}
	module.exports.code = {}

	all.forEach(function (error) {
	  module.exports.errno[error.errno] = error
	  module.exports.code[error.code] = error
	})

	module.exports.custom = __webpack_require__(54)(module.exports)
	module.exports.create = module.exports.custom.createError


/***/ },
/* 54 */
/***/ function(module, exports, __webpack_require__) {

	var prr = __webpack_require__(55)

	function init (type, message, cause) {
	  prr(this, {
	      type    : type
	    , name    : type
	      // can be passed just a 'cause'
	    , cause   : typeof message != 'string' ? message : cause
	    , message : !!message && typeof message != 'string' ? message.message : message

	  }, 'ewr')
	}

	// generic prototype, not intended to be actually used - helpful for `instanceof`
	function CustomError (message, cause) {
	  Error.call(this)
	  if (Error.captureStackTrace)
	    Error.captureStackTrace(this, arguments.callee)
	  init.call(this, 'CustomError', message, cause)
	}

	CustomError.prototype = new Error()

	function createError (errno, type, proto) {
	  var err = function (message, cause) {
	    init.call(this, type, message, cause)
	    //TODO: the specificity here is stupid, errno should be available everywhere
	    if (type == 'FilesystemError') {
	      this.code    = this.cause.code
	      this.path    = this.cause.path
	      this.errno   = this.cause.errno
	      this.message =
	        (errno.errno[this.cause.errno]
	          ? errno.errno[this.cause.errno].description
	          : this.cause.message)
	        + (this.cause.path ? ' [' + this.cause.path + ']' : '')
	    }
	    Error.call(this)
	    if (Error.captureStackTrace)
	      Error.captureStackTrace(this, arguments.callee)
	  }
	  err.prototype = !!proto ? new proto() : new CustomError()
	  return err
	}

	module.exports = function (errno) {
	  var ce = function (type, proto) {
	    return createError(errno, type, proto)
	  }
	  return {
	      CustomError     : CustomError
	    , FilesystemError : ce('FilesystemError')
	    , createError     : ce
	  }
	}


/***/ },
/* 55 */
/***/ function(module, exports) {

	/*!
	  * prr
	  * (c) 2013 Rod Vagg <rod@vagg.org>
	  * https://github.com/rvagg/prr
	  * License: MIT
	  */

	(function (name, context, definition) {
	  if (typeof module != 'undefined' && module.exports)
	    module.exports = definition()
	  else
	    context[name] = definition()
	})('prr', this, function() {

	  var setProperty = typeof Object.defineProperty == 'function'
	      ? function (obj, key, options) {
	          Object.defineProperty(obj, key, options)
	          return obj
	        }
	      : function (obj, key, options) { // < es5
	          obj[key] = options.value
	          return obj
	        }

	    , makeOptions = function (value, options) {
	        var oo = typeof options == 'object'
	          , os = !oo && typeof options == 'string'
	          , op = function (p) {
	              return oo
	                ? !!options[p]
	                : os
	                  ? options.indexOf(p[0]) > -1
	                  : false
	            }

	        return {
	            enumerable   : op('enumerable')
	          , configurable : op('configurable')
	          , writable     : op('writable')
	          , value        : value
	        }
	      }

	    , prr = function (obj, key, value, options) {
	        var k

	        options = makeOptions(value, options)

	        if (typeof key == 'object') {
	          for (k in key) {
	            if (Object.hasOwnProperty.call(key, k)) {
	              options.value = key[k]
	              setProperty(obj, k, options)
	            }
	          }
	          return obj
	        }

	        return setProperty(obj, key, options)
	      }

	  return prr
	})

/***/ },
/* 56 */
/***/ function(module, exports, __webpack_require__) {

	/* Copyright (c) 2012-2015 LevelUP contributors
	 * See list at <https://github.com/level/levelup#contributing>
	 * MIT License
	 * <https://github.com/level/levelup/blob/master/LICENSE.md>
	 */

	var extend         = __webpack_require__(10)
	  , LevelUPError   = __webpack_require__(52).LevelUPError
	  , format         = __webpack_require__(7).format
	  , defaultOptions = {
	        createIfMissing : true
	      , errorIfExists   : false
	      , keyEncoding     : 'utf8'
	      , valueEncoding   : 'utf8'
	      , compression     : true
	    }

	  , leveldown

	function getOptions (options) {
	  if (typeof options == 'string')
	    options = { valueEncoding: options }
	  if (typeof options != 'object')
	    options = {}
	  return options
	}

	function getLevelDOWN () {
	  if (leveldown)
	    return leveldown

	  var requiredVersion  = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"../package.json\""); e.code = 'MODULE_NOT_FOUND'; throw e; }())).devDependencies.leveldown
	    , leveldownVersion

	  try {
	    leveldownVersion = __webpack_require__(58).version
	  } catch (e) {
	    throw requireError(e)
	  }

	  if (!__webpack_require__(59).satisfies(leveldownVersion, requiredVersion)) {
	    throw new LevelUPError(
	        'Installed version of LevelDOWN ('
	      + leveldownVersion
	      + ') does not match required version ('
	      + requiredVersion
	      + ')'
	    )
	  }

	  try {
	    return leveldown = __webpack_require__(60)
	  } catch (e) {
	    throw requireError(e)
	  }
	}

	function requireError (e) {
	  var template = 'Failed to require LevelDOWN (%s). Try `npm install leveldown` if it\'s missing'
	  return new LevelUPError(format(template, e.message))
	}

	function dispatchError (db, error, callback) {
	  typeof callback == 'function' ? callback(error) : db.emit('error', error)
	}

	function isDefined (v) {
	  return typeof v !== 'undefined'
	}

	module.exports = {
	    defaultOptions  : defaultOptions
	  , getOptions      : getOptions
	  , getLevelDOWN    : getLevelDOWN
	  , dispatchError   : dispatchError
	  , isDefined       : isDefined
	}


/***/ },
/* 57 */,
/* 58 */
/***/ function(module, exports) {

	/* (ignored) */

/***/ },
/* 59 */
/***/ function(module, exports) {

	/* (ignored) */

/***/ },
/* 60 */
/***/ function(module, exports) {

	/* (ignored) */

/***/ },
/* 61 */
/***/ function(module, exports, __webpack_require__) {

	/* Copyright (c) 2012-2015 LevelUP contributors
	 * See list at <https://github.com/level/levelup#contributing>
	 * MIT License
	 * <https://github.com/level/levelup/blob/master/LICENSE.md>
	 */

	var util          = __webpack_require__(56)
	  , WriteError    = __webpack_require__(52).WriteError

	  , getOptions    = util.getOptions
	  , dispatchError = util.dispatchError

	function Batch (levelup, codec) {
	  this._levelup = levelup
	  this._codec = codec
	  this.batch = levelup.db.batch()
	  this.ops = []
	  this.length = 0
	}

	Batch.prototype.put = function (key_, value_, options) {
	  options = getOptions(options)

	  var key   = this._codec.encodeKey(key_, options)
	    , value = this._codec.encodeValue(value_, options)

	  try {
	    this.batch.put(key, value)
	  } catch (e) {
	    throw new WriteError(e)
	  }
	  this.ops.push({ type : 'put', key : key, value : value })
	  this.length++

	  return this
	}

	Batch.prototype.del = function (key_, options) {
	  options = getOptions(options)

	  var key = this._codec.encodeKey(key_, options)

	  try {
	    this.batch.del(key)
	  } catch (err) {
	    throw new WriteError(err)
	  }
	  this.ops.push({ type : 'del', key : key })
	  this.length++

	  return this
	}

	Batch.prototype.clear = function () {
	  try {
	    this.batch.clear()
	  } catch (err) {
	    throw new WriteError(err)
	  }

	  this.ops = []
	  this.length = 0
	  return this
	}

	Batch.prototype.write = function (callback) {
	  var levelup = this._levelup
	    , ops     = this.ops

	  try {
	    this.batch.write(function (err) {
	      if (err)
	        return dispatchError(levelup, new WriteError(err), callback)
	      levelup.emit('batch', ops)
	      if (callback)
	        callback()
	    })
	  } catch (err) {
	    throw new WriteError(err)
	  }
	}

	module.exports = Batch


/***/ },
/* 62 */
/***/ function(module, exports, __webpack_require__) {

	var encodings = __webpack_require__(63);

	module.exports = Codec;

	function Codec(opts){
	  this.opts = opts || {};
	  this.encodings = encodings;
	}

	Codec.prototype._encoding = function(encoding){
	  if (typeof encoding == 'string') encoding = encodings[encoding];
	  if (!encoding) encoding = encodings.id;
	  return encoding;
	};

	Codec.prototype._keyEncoding = function(opts, batchOpts){
	  return this._encoding(batchOpts && batchOpts.keyEncoding
	    || opts && opts.keyEncoding
	    || this.opts.keyEncoding);
	};

	Codec.prototype._valueEncoding = function(opts, batchOpts){
	  return this._encoding(
	    batchOpts && (batchOpts.valueEncoding || batchOpts.encoding)
	    || opts && (opts.valueEncoding || opts.encoding)
	    || (this.opts.valueEncoding || this.opts.encoding));
	};

	Codec.prototype.encodeKey = function(key, opts, batchOpts){
	  return this._keyEncoding(opts, batchOpts).encode(key);
	};

	Codec.prototype.encodeValue = function(value, opts, batchOpts){
	  return this._valueEncoding(opts, batchOpts).encode(value);
	};

	Codec.prototype.decodeKey = function(key, opts){
	  return this._keyEncoding(opts).decode(key);
	};

	Codec.prototype.decodeValue = function(value, opts){
	  return this._valueEncoding(opts).decode(value);
	};

	Codec.prototype.encodeBatch = function(ops, opts){
	  var self = this;

	  return ops.map(function(_op){
	    var op = {
	      type: _op.type,
	      key: self.encodeKey(_op.key, opts, _op)
	    };
	    if (self.keyAsBuffer(opts, _op)) op.keyEncoding = 'binary';
	    if (_op.prefix) op.prefix = _op.prefix;
	    if ('value' in _op) {
	      op.value = self.encodeValue(_op.value, opts, _op);
	      if (self.valueAsBuffer(opts, _op)) op.valueEncoding = 'binary';
	    }
	    return op;
	  });
	};

	var ltgtKeys = ['lt', 'gt', 'lte', 'gte', 'start', 'end'];

	Codec.prototype.encodeLtgt = function(ltgt){
	  var self = this;
	  var ret = {};
	  Object.keys(ltgt).forEach(function(key){
	    ret[key] = ltgtKeys.indexOf(key) > -1
	      ? self.encodeKey(ltgt[key], ltgt)
	      : ltgt[key]
	  });
	  return ret;
	};

	Codec.prototype.createStreamDecoder = function(opts){
	  var self = this;

	  if (opts.keys && opts.values) {
	    return function(key, value){
	      return {
	        key: self.decodeKey(key, opts),
	        value: self.decodeValue(value, opts)
	      };
	    };
	  } else if (opts.keys) {
	    return function(key) {
	      return self.decodeKey(key, opts);
	    }; 
	  } else if (opts.values) {
	    return function(_, value){
	      return self.decodeValue(value, opts);
	    }
	  } else {
	    return function(){};
	  }
	};

	Codec.prototype.keyAsBuffer = function(opts){
	  return this._keyEncoding(opts).buffer;
	};

	Codec.prototype.valueAsBuffer = function(opts){
	  return this._valueEncoding(opts).buffer;
	};



/***/ },
/* 63 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {
	exports.utf8 = exports['utf-8'] = {
	  encode: function(data){
	    return isBinary(data)
	      ? data
	      : String(data);
	  },
	  decode: identity,
	  buffer: false,
	  type: 'utf8'
	};

	exports.json = {
	  encode: JSON.stringify,
	  decode: JSON.parse,
	  buffer: false,
	  type: 'json'
	};

	exports.binary = {
	  encode: function(data){
	    return isBinary(data)
	      ? data
	      : new Buffer(data);      
	  },
	  decode: identity,
	  buffer: true,
	  type: 'binary'
	};

	exports.id = {
	  encode: function(data){
	    return data;
	  },
	  decode: function(data){
	    return data;
	  },
	  buffer: false,
	  type: 'id'
	};

	var bufferEncodings = [
	  'hex',
	  'ascii',
	  'base64',
	  'ucs2',
	  'ucs-2',
	  'utf16le',
	  'utf-16le'
	];

	bufferEncodings.forEach(function(type){
	  exports[type] = {
	    encode: function(data){
	      return isBinary(data)
	        ? data
	        : new Buffer(data, type);
	    },
	    decode: function(buffer){
	      return buffer.toString(type);
	    },
	    buffer: true,
	    type: type
	  };
	});

	function identity(value){
	  return value;
	}

	function isBinary(data){
	  return data === undefined
	    || data === null
	    || Buffer.isBuffer(data);
	}


	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(13).Buffer))

/***/ },
/* 64 */
/***/ function(module, exports, __webpack_require__) {

	var map = {
		"./get": 65,
		"./get.js": 65,
		"./key": 68,
		"./key.js": 68,
		"./put": 69,
		"./put.js": 69
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
	webpackContext.id = 64;


/***/ },
/* 65 */
/***/ function(module, exports, __webpack_require__) {

	/*jslint node: true */
	'use strict';

	var Gun = __webpack_require__(2);
	var error = __webpack_require__(66);
	var valid = __webpack_require__(67);

	module.exports = function (level) {
		function getSoul(soul, cb, opt, count) {

			level.get(soul, function (err, node) {
				var graph = {},
					soul = Gun.is.soul.on(node);

				if (valid(err)) {
					return error(cb)(err);
				}

				graph[soul] = node;
				cb(null, graph);

				graph[soul] = Gun.union.pseudo(soul);
				cb(null, graph);

				count.found += 1;
				if (count.requested === count.found) {
					// terminate
					cb(null, {});
				}
			});
		}



		function getKey(key, cb, opt, count) {

			level.get(key, function (err, souls) {

				if (!souls) {
					cb(null, null);
				}

				// map over each soul in the graph
				Gun.obj.map(souls, function (rel, soul) {
					count.requested += 1;

					// get that soul
					getSoul(soul, cb, opt, count);
				});
			});
		}

		return function get(key, cb, opt) {
			var soul, err;

			if (!key) {
				err = "No data was given to .get()";
				return error(cb)(err);
			}

			soul = Gun.is.soul(key);
			if (soul) {
				getSoul(soul, cb, opt, {
					requested: 1,
					found: 0
				});
			} else {
				// getKey depends on getSouls
				getKey(key, cb, opt, {
					requested: 0,
					found: 0
				});
			}

		};
	};


/***/ },
/* 66 */
/***/ function(module, exports) {

	/*jslint node: true */
	'use strict';
	module.exports = function (cb) {
		return function (msg) {
			cb({
				err: msg
			}, false);
		};
	};


/***/ },
/* 67 */
/***/ function(module, exports) {

	/*jslint node: true */
	'use strict';

	module.exports = function (err) {

		var noData = 'Key not found in database';

		if (!err || !err.message) {
			return false;
		}
		if (err.message.match(noData)) {
			return false;
		}
		return true;
	};


/***/ },
/* 68 */
/***/ function(module, exports, __webpack_require__) {

	/*jslint node: true */
	'use strict';

	var error = __webpack_require__(66);
	var valid = __webpack_require__(67);

	module.exports = function (level) {

		return function (name, soul, cb) {
			var fail = error(cb);
			if (!name) {
				return fail("No key was given to .key()");
			}
			if (!soul) {
				return fail("No soul given to .key()");
			}
			level.get(name, function (err, graph) {
				if (valid(err)) {
					return fail(err);
				}
				graph = graph || {};
				var relation = {
					'#': soul
				};
				graph[soul] = relation;
				level.put(name, graph, function (err) {
					if (valid(err)) {
						return fail(err);
					}
					cb(null, {
						ok: true
					});
				});

			});
		};

	};


/***/ },
/* 69 */
/***/ function(module, exports, __webpack_require__) {

	/*jslint node: true */
	'use strict';
	var valid = __webpack_require__(67);
	var error = __webpack_require__(66);
	var Gun = __webpack_require__(2);


	module.exports = function (level) {
		return function (graph, cb, opt) {
			var saved = 0,
				pending = 0;

			Gun.is.graph(graph, function (node, soul) {
				pending += 1;
				level.put(soul, node, function (err) {
					if (valid(err)) {
						return error(cb)(err);
					}
					saved += 1;
					if (pending === saved) {
						cb(null, {
							ok: true
						});
					}
				});
			});
		};
	};


/***/ },
/* 70 */
/***/ function(module, exports, __webpack_require__) {

	/*jslint node: true, nomen: true */
	'use strict';

	var path, format, fs;
	path = __webpack_require__(71);
	format = __webpack_require__(72);

	try {
		fs = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"fs\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
		if (fs && fs.exists) {
			__webpack_require__(73);
		} else {
			fs = null;
		}
	} catch (e) {
		fs = null;
	}

	function build(dir, depth) {
		var folder, segment;
		if (!dir.length) {
			return depth;
		}
		depth.push(segment = dir.shift());
		if (!segment) {
			return build(dir, depth);
		}
		folder = depth.join(format.sep);

		if (!fs.existsSync(folder)) {
			fs.mkdirSync(folder);
		}
		return build(dir, depth);
	}

	module.exports = function (string) {
		if (!string || !string.length || !fs) {
			return;
		}
		var source, route = path(string);

		build(route.path, []);

		if (route.file && !fs.existsSync(route.file)) {
			source = fs.openSync(route.file, 'w');
			fs.closeSync(source);
		}
		return route.file || format.sep + route.path.join(format.sep);
	};


/***/ },
/* 71 */
/***/ function(module, exports, __webpack_require__) {

	/*jslint node: true, nomen: true */
	'use strict';
	var path = __webpack_require__(72);

	function hasFile(dir) {
		var file = dir[dir.length - 1];
		if (file.match(/\w+\.\w+$/)) {
			return dir.join(path.sep);
		} else {
			return false;
		}
	}

	module.exports = function (string) {
		var root, dir, file;
		if (!string) {
			return;
		}

		root = path.resolve(string);
		dir = root.split(path.sep);

		file = hasFile(dir);

		if (file) {
			dir.pop();
		}
		return {
			file: file,
			path: dir
		};
	};


/***/ },
/* 72 */
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

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)))

/***/ },
/* 73 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(__dirname) {;(function(wsp){
		var Gun = __webpack_require__(2)
		, formidable = __webpack_require__(74)
		, ws = __webpack_require__(82).Server
		, http = __webpack_require__(83)
		, url = __webpack_require__(84);
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
					__webpack_require__(90)(gun.server.websocket = gun.server.websocket || new ws(gun.__.opt.ws), function(req, res){
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
					var tab, cb = res = __webpack_require__(91)(req, res);
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
				__webpack_require__(92).globalAgent.maxSockets = __webpack_require__(93).globalAgent.maxSockets = gun.__.opt.maxSockets || Infinity; // WARNING: Document this!
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
/* 74 */
/***/ function(module, exports, __webpack_require__) {

	var IncomingForm = __webpack_require__(75).IncomingForm;
	IncomingForm.IncomingForm = IncomingForm;
	module.exports = IncomingForm;


/***/ },
/* 75 */
/***/ function(module, exports, __webpack_require__) {

	var require;/* WEBPACK VAR INJECTION */(function(global, Buffer) {if (global.GENTLY) require = GENTLY.hijack(__webpack_require__(76));

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


	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(13).Buffer))

/***/ },
/* 76 */
/***/ function(module, exports, __webpack_require__) {

	var map = {
		"./file": 77,
		"./file.js": 77,
		"./incoming_form": 75,
		"./incoming_form.js": 75,
		"./index": 74,
		"./index.js": 74,
		"./json_parser": 78,
		"./json_parser.js": 78,
		"./multipart_parser": 79,
		"./multipart_parser.js": 79,
		"./octet_parser": 80,
		"./octet_parser.js": 80,
		"./querystring_parser": 81,
		"./querystring_parser.js": 81
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
	webpackContext.id = 76;


/***/ },
/* 77 */
/***/ function(module, exports, __webpack_require__) {

	var require;/* WEBPACK VAR INJECTION */(function(global) {if (global.GENTLY) require = GENTLY.hijack(__webpack_require__(76));

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
/* 78 */
/***/ function(module, exports, __webpack_require__) {

	var require;/* WEBPACK VAR INJECTION */(function(global) {if (global.GENTLY) require = GENTLY.hijack(__webpack_require__(76));

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
/* 79 */
/***/ function(module, exports, __webpack_require__) {

	var Buffer = __webpack_require__(13).Buffer,
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
/* 80 */
/***/ function(module, exports, __webpack_require__) {

	var EventEmitter = __webpack_require__(6).EventEmitter
		, util = __webpack_require__(7);

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
/* 81 */
/***/ function(module, exports, __webpack_require__) {

	var require;/* WEBPACK VAR INJECTION */(function(global) {if (global.GENTLY) require = GENTLY.hijack(__webpack_require__(76));

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
/* 82 */
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
/* 83 */
/***/ function(module, exports, __webpack_require__) {

	var Gun = __webpack_require__(2)
	,	formidable = __webpack_require__(74)
	,	url = __webpack_require__(84);
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
/* 84 */
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

	var punycode = __webpack_require__(85);

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
	    querystring = __webpack_require__(87);

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
/* 85 */
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

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(86)(module), (function() { return this; }())))

/***/ },
/* 86 */
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
/* 87 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	exports.decode = exports.parse = __webpack_require__(88);
	exports.encode = exports.stringify = __webpack_require__(89);


/***/ },
/* 88 */
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
/* 89 */
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
/* 90 */
/***/ function(module, exports, __webpack_require__) {

	var Gun = __webpack_require__(2)
	,	url = __webpack_require__(84);
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
/* 91 */
/***/ function(module, exports, __webpack_require__) {

	var Gun = __webpack_require__(2);
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
/* 92 */
/***/ function(module, exports, __webpack_require__) {

	var http = __webpack_require__(93);

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
/* 93 */
/***/ function(module, exports, __webpack_require__) {

	var http = module.exports;
	var EventEmitter = __webpack_require__(6).EventEmitter;
	var Request = __webpack_require__(94);
	var url = __webpack_require__(84)

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
/* 94 */
/***/ function(module, exports, __webpack_require__) {

	var Stream = __webpack_require__(28);
	var Response = __webpack_require__(95);
	var Base64 = __webpack_require__(96);
	var inherits = __webpack_require__(97);

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
/* 95 */
/***/ function(module, exports, __webpack_require__) {

	var Stream = __webpack_require__(28);
	var util = __webpack_require__(7);

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
/* 96 */
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
/* 97 */
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


/***/ }
/******/ ]);