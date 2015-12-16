// dynamically generates tables
// listens for changes
// updates based on changes

var init = (function() {
    var self = this;
    var boardState = {};
    
    self.initiateBoard = function() {
        boardState = {};
        return boardState;
    };

    
    return self;
})();

module.exports = init;