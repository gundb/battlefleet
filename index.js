var index = (function() {
    var self = this;
    
    self.arr = [1,2,3];

	self.arrChar = function (char) {
		return self.arr.indexOf(char);
	}
    
    return self;
})();

module.exports = index;