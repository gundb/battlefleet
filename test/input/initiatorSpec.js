var assert = require('assert'); 
var Gun = require('gun-level');
var init = require('../../input/initiator');
// var remove = require('gun-level/spec/remove')
// remove('folder/file to remove')

describe('the INITIATOR', function() {
	it.skip('should do awesome things', function() {
		assert.equal("actual", "expected", "Make me do awesome things!");
	});
	
	it('should build a blank board for the given gun path', function() {
	    init.initiateBoard();
	    assert.exists(init.boardState, 'boardState exists when initiateBoard() called' )
	});
});