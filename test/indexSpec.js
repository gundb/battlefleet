var assert = require('assert'); 
var Gun = require('gun-level');
// var remove = require('gun-level/spec/remove')
// remove('folder/file to remove')
var index = require('../index');


describe('testing mocha set-up', function() {
	it('should work with code local to test.js', function() {
		assert.equal([1,2,3].indexOf(5), -1);
		assert.equal([1,2,3].indexOf(0), -1);
	}) 

	, it('should work with variables in index.js', function() {
		assert.equal(index.arr.indexOf(5), -1);
		assert.equal(index.arr.indexOf(0), -1);
	})

	, it('should work with methods in index.js', function() {
		assert.equal(index.arrChar(5), -1);
		assert.equal(index.arrChar(0), -1);
	})
})