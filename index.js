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

var index = (function() {
    var self = this;
    
    self.arr = [1,2,3];

	self.arrChar = function (char) {
		return self.arr.indexOf(char);
	};
    
    return self;
})();

module.exports = index;