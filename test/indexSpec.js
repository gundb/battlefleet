var assert = require('assert'); 
var Gun = require('gun-level');
var index = require('../index');
// var remove = require('gun-level/spec/remove')
// remove('folder/file to remove')


describe('the INDEX', function() {
	var gun;
	
	beforeEach(function () {
		// Prevent gun-level from saving to
		// the file system by passing false.
		gun = new Gun({
			level: false
		}).get('battlefleet/players/test').set();
	});
	
	it('should export a function', function () {
		assert.isFunction(index);
	});
	
});