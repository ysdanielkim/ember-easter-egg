import Ember from 'ember';

export default Ember.Component.extend({

    easterEggStyle: function() {
        
        return 'width: '+this.blocksH*this.blockSize+'px; height:'+this.blocksV*this.blockSize+'px;';
    }.property(),

    blocksH: 40,
    blocksV: 29,
    blockSize: 20,
    direction: 'left',
    mainLoop: null, // attach the interval to this, we will have a way to stop it
    loopDelay: 1000/10,
    collision: false,

    computeSnake: function() {
        var level = this.get('level'),
            newPosition,
            snake;
        snake = level.snake;
        snake.reverseObjects();
        newPosition = snake[snake.length-1];
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
        snake.pushObject(newPosition);
        snake.reverseObjects();
        snake.popObject();
        level.snake = snake;
    },

    computeLevel: function() {
        var level = this.get('level');
        level.blocks.forEach(function(item, index) {
            if (level.snake.contains(index)) {
                Ember.set(item, 'isFloor', false);
                Ember.set(item, 'isSnake', true);
            } else {
                Ember.set(item, 'isFloor', true);
                Ember.set(item, 'isSnake', false);
            }
        });
    },

    collisionCheck: function() {

    },

    gameLoop: function(gs) {
        gs.computeSnake();
        gs.computeLevel();
    },

    initialize: function() {
        var gs = this,
            level = Ember.Object.create({
                snake: Ember.A(),
                peanuts: Ember.A(),
                blocks: Ember.A()
            }),
            length = 6,
            i = 0;

        // initial level setup
        for (i=0;i<(this.blocksH * this.blocksV);i++) {
            level.blocks.pushObject({ isFloor: true, isSnake: false, isPeanut: false });
        }
        for (i=0;i<length;i++) {
            level.snake.pushObject(((level.blocks.length/2)-(length/2))+i);
        }
        this.set('level', level);
        this.computeLevel();        

        // keyboard controls
        window.addEventListener('keydown', function (e) {
            var keyTrans = {37: 'left', 38: 'up', 39: 'right', 40:'down'};
            switch (gs.direction) {
                case 'left':
                    delete keyTrans[39];
                break;
                case 'right':
                    delete keyTrans[37];
                break;
                case 'up':
                    delete keyTrans[40];
                break;
                case 'down':
                    delete keyTrans[38];
                break;
            }
            if (keyTrans.hasOwnProperty(e.keyCode)) {
                gs.direction = keyTrans[e.keyCode];
            }
        }, false);

        // mainloop!
        this.mainLoop = setInterval(this.gameLoop, this.loopDelay, gs);

    }.on( 'init' )

});