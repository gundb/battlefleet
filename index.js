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
var Gun = require('gun');
require('./setup/generate-table');
var gun = Gun({
    file: 'game-state'
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