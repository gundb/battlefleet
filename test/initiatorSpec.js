var assert = require('chai').assert; 
//var Gun = require('gun-level');
var init = require('../input/initiator');
// var remove = require('gun-level/spec/remove')
// remove('folder/file to remove')

describe.only('the INITIATOR module', function() {
	
	it('should build a blank board for the given gun path', function() {
		
	    var board = init.initiateBoard();
	    assert.isObject(board);
	    
	});
	
	it.skip('should do more awesome things', function() {
		assert.equal("actual", "expected", "Make me do more awesome things!");
	});
	
});