import Ember from 'ember';

export default Ember.Component.extend( {

    // some initial settings
    blocksH      : 32,
    blocksV      : 25,
    blockSize    : 20,
    peanut       : null,
    snake        : [],
    mainLoop     : null, // attach the interval to this, we will have a way to stop it
    loopDelay    : 1000/10,
    playersCount : 2,
    frameCount   : 0,

    easterEggStyle: function() {
        return 'width: ' + this.blocksH * this.blockSize + 'px; height:' + this.blocksV * this.blockSize + 'px;';
    }.property(),

    mapSize: function() {
        return this.blocksH * this.blocksV;
    },

    // make sure that the snake cannot go against itself
    directionCheck: function(player) {
        var possibleDirection = [
                [ 'up', 'down' ],
                [ 'left', 'right' ]
            ],
            oldDirection = player.oldDirection,
            direction = player.direction;

        possibleDirection.forEach(function(item) {
            if ( ( oldDirection === item[ 0 ] && direction === item[ 1 ] ) ||
                 ( oldDirection === item[ 1 ] && direction === item[ 0 ] ) ) {
                player.direction = oldDirection;
            }
        });
    },

    computeSnake: function(gs) {
        var newPosition;

        gs.get('players').forEach(function(player) {
            newPosition = player.snake[ 0 ];
            gs.directionCheck(player);

            switch ( player.direction ) {
                case 'up':
                    newPosition -= gs.blocksH;
                    break;
                case 'down':
                    newPosition += gs.blocksH;
                    break;
                case 'right':
                    newPosition++;
                break;
                case 'left':
                    newPosition--;
                break;
            }

            player.oldDirection = player.direction;

            if ( newPosition !== gs.get( 'peanut' ) ) {
                player.snake.popObject();
            } else {
                gs.incrementProperty('score');
                gs.computePeanut();
            }

            if ( gs.collisionOccured( player.snake, newPosition ) ) {
                window.clearInterval( gs.mainLoop );
                gs.set('gameMode', 'over');
            } else {
                player.snake.insertAt( 0, newPosition );
            }
            gs.set('frameCount', gs.frameCount + 1);
        });

    },

    isSnake: function( i ) {
        var isSnake = false;

        this.get('players').forEach(function(player) {
            if (player.snake.contains(i)) {
                isSnake = true;
            }
        });

        return isSnake;
    },

    isPeanut: function( i ) {
        if ( this.get( 'peanut' ) === i ) {
            return true;
        }
    },

    isFloor: function(i) {
        return !( this.isPeanut( i ) || this.isSnake( i ) );
    },

    level: function() {
        var gs     = this,
            blocks = this.get( 'blocks' );
        blocks.map( function( item, i ) {
            item.setProperties( {
                isPeanut : gs.isPeanut( i ),
                isSnake  : gs.isSnake( i ),
                isFloor  : gs.isFloor( i )
            } );
        } );
        return blocks;
    }.property( 'frameCount' ),

    computePeanut: function() {
        var i = false,
            checkForPeanut = function(player) {
                if (player.snake.contains(i)) {
                    i = false;
                }
            };

        while ( i===false ) {
            i = Math.floor( ( Math.random() * this.mapSize() ) + 0);
            this.get('players').forEach(checkForPeanut);
        }
        this.set( 'peanut', i );
    },

    collisionOccured: function( snake, newPosition ) {
        var i;

        // check if collided with self
        for ( i = 0; i < snake.length; i++ ) {
            if ( newPosition === snake[i] ) {
                return true;
            }
        }

        // check if snake has collided, top or bottom
        if ( newPosition < 0 || newPosition >= this.get('blocks').length ) {
            return true;
        }

        // collision check left side
        if ( ( (newPosition + 1 ) % ( this.blocksH ) ) === 0 &&
             ( snake[0] % ( this.blocksH ) ) === 0 )  {
            return true;
        }

        // collision check right side
        if ( ( ( newPosition ) % ( this.blocksH ) ) === 0 &&
             ( ( snake[0]+1 ) % ( this.blocksH ) ) === 0 ) {
            return true;
        }
    },

    gameStatus: function() {
        switch ( this.get( 'gameMode' ) ) {
            case 'new':
                return 'TO START: press spacebar. CONTROL: use arrow keys';
            case 'paused':
                return 'GAME PAUSED: press spacebar to continue';
            case 'over':
                return 'GAME OVER: press spacebar to restart. PEANUTS EATEN:' + this.get( 'score' );
            case 'playing':
                return 'PEANUTS EATEN: ' + this.get( 'score' );
        }
    }.property( 'gameMode', 'score' ),

    initialize: function(restart) {
        var i,
            gs     = this,
            length = 6,
            offset = 0,
            snake  = [],
            blocks = [];

        this.set( 'players', []);

        for(var x = 0; x < this.playersCount; x++) {
            snake = [];

            if ( this.blocksV % 2 === 0 ) {
                offset = ( this.blocksH ) / 2 + ( x * blocksH);
            }

            for ( i = 0; i < length; i++ ) {
                snake.push( ( ( this.mapSize() - length ) / 2 ) + i + offset + 1 );
            }

            this.players.push({
                'snake'         : snake,
                'direction'     : 'left',
                'oldDirection'  : 'left',
                'score'         : 0
            });
        }

        // initialize the snake and it's default values
        this.computePeanut();
        this.set( 'score', 0);
        this.set( 'gameMode', 'new');

        if (!restart) {
            for ( i = 0; i < ( this.mapSize() ); i++ ) {
                blocks.push( Ember.Object.create(
                    {
                        isFloor  : this.isFloor( i ),
                        isSnake  : this.isSnake( i ),
                        isPeanut : this.isPeanut( i )
                    }
                ));
            }
            this.set( 'blocks', blocks );
            window.addEventListener( 'keydown' , function( e ) {
                var keyTrans = [
                    {
                        37 : 'left',
                        38 : 'up',
                        39 : 'right',
                        40 : 'down',
                    },{
                        65 : 'left',
                        87 : 'up',
                        68 : 'right',
                        83 : 'down'
                    }
                ];

                if ( gs.get( 'gameMode' ) === 'playing' ) {
                    keyTrans.forEach( function(trans, index) {
                        if ( trans.hasOwnProperty( e.keyCode ) ) {
                            gs.players[index].direction = trans[ e.keyCode ];
                        }
                    } );
                } else if (e.keyCode === 32) {
                    switch ( gs.get( 'gameMode' ) ) {
                        case ( 'paused' ):
                        case ( 'new' ):
                            gs.mainLoop = setInterval( gs.computeSnake, gs.loopDelay, gs );
                            gs.set( 'gameMode', 'playing' );
                        break;
                        case ( 'playing' ):
                            window.clearInterval( gs.mainLoop );
                            gs.set( 'gameMode', 'paused' );
                        break;
                        case ( 'over' ):
                            gs.initialize( true );
                        break;
                    }
                }
            } );
        }
    }.on( 'init' )
} );