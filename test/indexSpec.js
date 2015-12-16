var assert = require('assert'); 
var setPlayers = require('../index');

describe('The setPlayers function', function() {
	var gun;
	
	beforeEach(function () {
		// Prevent gun-level from saving to
		// the file system by passing false.
		gun = setPlayers('battlefleet/players/test');
	});
	
	it('should export a function', function () {
		assert.equal(setPlayers.constructor, Function);
	});
	
	it.skip('should populate the players collection', function (done) {
		this.timeout(1000);
		gun.path('players').val(function (players) {
			var length = Object.keys(players).length;
			assert.equal(length, 4);
			done();
		});
	});
	
});
