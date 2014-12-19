import Ember from 'ember';

export default Ember.Component.extend({

    blocksH: 40,
    blocksV: 29,
    blockSize: 20,
    peanut: null,
    snake: [],
    direction: 'left',
    oldDirection: 'left',
    mainLoop: null, // attach the interval to this, we will have a way to stop it
    loopDelay: 1000/10,

    easterEggStyle: function() {
        return 'width: '+this.blocksH*this.blockSize+'px; height:'+this.blocksV*this.blockSize+'px;';
    }.property(),

    mapSize: function() {
        return this.blocksH * this.blocksV;
    },

    // make sure that the snake cannot go against itself
    directionCheck: function() {
        var gs = this,
            check = [
                ['up','down'],
                ['left','right']
            ];
        check.forEach (function(item) {
            if ((gs.oldDirection === item[0] && gs.direction === item[1]) ||
                (gs.oldDirection === item[1] && gs.direction === item[0])) {
                    gs.direction = gs.oldDirection;
                }
        });
    },

    computeSnake: function() {
        var newPosition,
            snake = this.snake;
        snake.reverse();
        newPosition = snake[snake.length-1];
        this.directionCheck();
        switch (this.direction) {
            case 'up':
                newPosition -= this.blocksH;
                break;
            case 'down':
                newPosition += this.blocksH;
                break;
            case 'right':
                newPosition++;
            break;
            case 'left':
                newPosition--;
                break;
        }
        this.oldDirection = this.direction;
        snake.push(newPosition);
        snake.reverse();
        if (snake[0]!==this.peanut) {
            snake.pop();
        } else {
            this.computePeanut();
        }
        this.snake = snake;
    },

    computeLevel: function() {
        var gs = this,
            blocks = this.get('blocks');
        blocks.forEach(function(item, index) {
            if (gs.peanut === index) {
                Ember.set(item, 'isFloor', false);
                Ember.set(item, 'isSnake', false);
                Ember.set(item, 'isPeanut', true);
            } else if (gs.snake.indexOf(index) >= 0) {
                Ember.set(item, 'isFloor', false);
                Ember.set(item, 'isSnake', true);
                Ember.set(item, 'isPeanut', false);
            } else {
                Ember.set(item, 'isFloor', true);
                Ember.set(item, 'isSnake', false);
                Ember.set(item, 'isPeanut', false);
            }
        });
    },

    computePeanut: function() {
        var i = false;
        while (i===false) {
            i = Math.floor((Math.random() * this.mapSize()) + 0);
            if (this.snake.indexOf(i) >= 0) {
                i = false;
            }
        }
        this.peanut = i;
    },

    collisionOccured: function() {
        var i,
            snake = this.snake,
            blocks = this.get('blocks');  
        // check if collided with self
        for (i = 1; i<snake.length; i++) {
            if (snake[0] === snake[i]) {
                return true;
            }
        }
        // check if snake has collided, top or bottom
        if (snake[0]<0 || snake[0] >= blocks.length) {
            return true;
        }
        // collision check left side
        if (((snake[0]+1) % (this.blocksH)) === 0 &&
            (snake[1] % (this.blocksH)) === 0)  {
            return true;
        }
        // collision check right side
        if (((snake[0]) % (this.blocksH)) === 0 &&
            ((snake[1]+1) % (this.blocksH)) === 0) {
            return true;
         }
    },

    gameLoop: function(gs) {
        gs.computeSnake();
        if (gs.collisionOccured()) {
            console.log('collision happened, bad driver!');
            window.clearInterval(gs.mainLoop);
        } else {
            gs.computeLevel();
        }
    },

    initialize: function() {
        var i,
            gs = this,
            length = 6,
            blocks = Ember.A();
        // set snake in the center of the map
        for (i=0; i<length; i++) {
            this.snake.push(((this.mapSize()-length)/2)+i);
        }
        this.computePeanut();
        // initialize the map
        for (i=0; i<(this.mapSize()); i++) {
            blocks.pushObject({ isFloor: false, isSnake: false, isPeanut: false, index: i });
        }
        this.set('blocks', blocks);
        window.addEventListener('keydown', function (e) {
            var keyTrans = {37: 'left', 38: 'up', 39: 'right', 40:'down'};
            if (keyTrans.hasOwnProperty(e.keyCode)) {
                gs.direction = keyTrans[e.keyCode];
            }
        });
        this.mainLoop = setInterval(this.gameLoop, this.loopDelay, gs);
    }.on( 'init' )

});