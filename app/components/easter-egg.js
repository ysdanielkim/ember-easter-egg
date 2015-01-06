import Ember from 'ember';

export default Ember.Component.extend( {

    // some initial settings
    blocksH      : 32,
    blocksV      : 25,
    blockSize    : 20,
    peanut       : null,
    snake        : [],
    direction    : 'left',
    oldDirection : 'left',
    mainLoop     : null, // attach the interval to this, we will have a way to stop it
    loopDelay    : 1000/10,

    easterEggStyle: function() {
        return 'width: ' + this.blocksH * this.blockSize + 'px; height:' + this.blocksV * this.blockSize + 'px;';
    }.property(),

    mapSize: function() {
        return this.blocksH * this.blocksV;
    },

    // make sure that the snake cannot go against itself
    directionCheck: function() {
        var gs        = this,
            direction = [
                [ 'up', 'down' ],
                [ 'left', 'right' ]
            ];
        direction.forEach(function(item) {
            if ( ( gs.oldDirection === item[ 0 ] && gs.direction === item[ 1 ] ) ||
                 ( gs.oldDirection === item[ 1 ] && gs.direction === item[ 0 ] ) ) {
                gs.direction = gs.oldDirection;
            }
        });
    },

    computeSnake: function(gs) {
        var newPosition,
            snake = gs.get( 'snake' );
        newPosition = snake[ 0 ];
        gs.directionCheck();
        switch ( gs.direction ) {
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
        gs.oldDirection = gs.direction;
        if ( newPosition !== gs.get( 'peanut' ) ) {
            snake.popObject();
        } else {
            gs.incrementProperty('score');
            gs.computePeanut( snake );
        }
        if ( gs.collisionOccured( snake, newPosition ) ) {
            window.clearInterval( gs.mainLoop );
            gs.set('gameMode', 'over');
        } else {
            snake.insertAt( 0, newPosition );
        }
    },

    isSnake: function( i ) {
        if ( this.get('snake').contains( i ) ) {
            return true;
        }
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
    }.property( 'snake.@each' ),

    computePeanut: function( snake ) {
        var i = false;
        while ( i===false ) {
            i = Math.floor( ( Math.random() * this.mapSize() ) + 0);
            if ( snake.contains(i) ) {
                i = false;
            }
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

    informationMessage: function() {
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

        // initialize the snake
        if ( this.blocksV % 2 === 0 ) {
            offset = ( this.blocksH ) / 2;
        }
        for ( i = 0; i < length; i++ ) {
            snake.push( ( ( this.mapSize() - length ) / 2 ) + i + offset + 1 );
        }
        this.computePeanut( snake );
        this.set( 'snake', snake );

        // initialize the map
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
        this.set( 'score', 0);

        if (restart) {
            // gs.mainLoop = setInterval( gs.computeSnake, gs.loopDelay, gs );
            this.set( 'gameMode', 'new');
        } else {
            this.set( 'gameMode', 'new');
            window.addEventListener( 'keydown' , function( e ) {
                var keyTrans = {
                    37 : 'left', 
                    38 : 'up',   
                    39 : 'right',
                    40 : 'down'   
                };
                if ( keyTrans.hasOwnProperty( e.keyCode ) ) {
                    gs.direction = keyTrans[ e.keyCode ];
                } else if (e.keyCode == 32) {
                    switch ( gs.get( 'gameMode' ) ) {
                        case ( 'paused' ):
                        case ( 'new' ):
                            gs.mainLoop = setInterval( gs.computeSnake, gs.loopDelay, gs );
                            gs.set( 'gameMode', 'playing' );
                        break;
                        case ('playing'):
                            window.clearInterval( gs.mainLoop );
                            gs.set( 'gameMode', 'paused');
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