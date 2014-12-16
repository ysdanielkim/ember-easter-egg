import Ember from 'ember';

export default Ember.Component.extend({

    easterEggStyle: function() {
        return 'width: '+this.blocksH*this.blockSize+'px; height:'+this.blocksV*this.blockSize+'px;';
    }.property(),

    blocksH: 40,
    blocksV: 29,
    blockSize: 20,
    direction: 'left',
    oldDirection: 'left',
    mainLoop: null, // attach the interval to this, we will have a way to stop it
    loopDelay: 1000/10,

    // make sure that the snake cannot go against itself
    directionCheck: function() {
        var gs = this,
            check = [
            ['up','down'],
            ['left','right']
        ];
        check.forEach (function(item) {
            if ( (gs.oldDirection === item[0] && gs.direction === item[1]) ||
                 (gs.oldDirection === item[1] && gs.direction === item[0])) {
                    gs.direction = gs.oldDirection;
                 }
        });
    },

    computeSnake: function() {
        var newPosition,
            snake = this.get('snake'),
            peanut = this.get('peanut');

        snake.reverseObjects();
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
        snake.pushObject(newPosition);
        snake.reverseObjects();
        if (snake[0]!==peanut) {
            snake.popObject();
        } else {
            this.computePeanut();
        }
    },

    computeLevel: function() {
        var blocks = this.get('blocks'),
            snake = this.get('snake'),
            peanut = this.get('peanut');
        blocks.forEach(function(item, index) {
            if (peanut === index) {
                Ember.set(item, 'isFloor', false);
                Ember.set(item, 'isSnake', false);
                Ember.set(item, 'isPeanut', true);
            } else if (snake.contains(index)) {
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
        var snake = this.get('snake'),
            blocks = this.get('blocks'),
            i = false;

        while (i===false) {
            i = Math.floor((Math.random() * blocks.length) + 0);
            if (snake.contains(i)) {
                i = false;
            }
        }
        this.set('peanut', i);
    },

    collisionOccured: function() {
        var blocks = this.get('blocks'),
            snake = this.get('snake'),   
            i = 1,
            collision = false;

        // check if collided with self
        for (; i<snake.length; i++) {
            if (snake[0] === snake[i]) {
                collision = true;
                break;
            }
        }

        // check if snake has collided, top or bottom
        if (snake[0]<0) {
            collision = true;
        }
        if (snake[0] >= blocks.length) {
            collision = true;
        }

        // collision check left side
        if (((snake[0]+1) % (this.blocksH)) === 0 &&
            (snake[1] % (this.blocksH)) === 0)  {
            collision = true;
        }

        // collision check right side
        if (((snake[0]) % (this.blocksH)) === 0 &&
            ((snake[1]+1) % (this.blocksH)) === 0) {
            collision = true;
         }

        return collision;
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
        var gs = this,
            length = 6,
            blocks = Ember.A(),
            snake = Ember.A(),
            i = 0;

        for (i;i<(this.blocksH * this.blocksV);i++) {
            blocks.pushObject({ isFloor: true, isSnake: false, isPeanut: false, index: i });
        }
        for (i=0;i<length;i++) {
            snake.pushObject(((blocks.length/2)-(length/2))+i);
        }
        this.set('snake', snake);
        this.set('blocks', blocks);
        this.set('peanut', Ember.A());
        this.computePeanut();
        this.computeLevel();        

        window.addEventListener('keydown', function (e) {
            var keyTrans = {37: 'left', 38: 'up', 39: 'right', 40:'down'};
            if (keyTrans.hasOwnProperty(e.keyCode)) {
                gs.direction = keyTrans[e.keyCode];
            }
        }, false);

        this.mainLoop = setInterval(this.gameLoop, this.loopDelay, gs);

    }.on( 'init' )

});