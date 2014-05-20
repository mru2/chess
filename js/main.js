angular.module("MyApp", ["firebase"])
.service('Game', function($firebase, $q, $rootScope){

  // var defaultFen = 

  var remoteDB = $firebase(new Firebase("https://torid-fire-3930.firebaseio.com/game"));

  var deferred = $q.defer();

  // Return a promise for the game
  remoteDB.$on('loaded', function(){

    var fen   = remoteDB.$value;
    var game  = new Chess(fen);

    // Custom methods on the game object
    game.save = function(){
      console.log('persisting game', this.fen());
      remoteDB.$set(this.fen());
    };

    game.clear = function(){
      this.load('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      this.save();
    };

    // Watching remote DB changes
    remoteDB.$on('change', function(){
      $rootScope.$apply(function(){
        game.load(remoteDB.$value);
      });
    });

    deferred.resolve(game);

  });

  return deferred.promise;

})


.controller('AppCtrl', function($scope, Game){

  Game.then(function(game){
    $scope.game = game
  });

  $scope.clear = function(){
    if (confirm('Are you sure you want to clear the board?')) {
      $scope.game.clear();
    }
  }

})


// ==============
// The chessboard
// ==============
.directive('chessboard', function(){

  var board = null;
  var game = null;

  // do not pick up pieces if the game is over
  // only pick up pieces for the side to move
  var onDragStart = function(source, piece, position, orientation) {
    if (game.game_over() === true ||
        (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
      return false;
    }
  };

  var onDrop = function(source, target) {
    // see if the move is legal
    var move = game.move({
      from: source,
      to: target,
      promotion: 'q' // NOTE: always promote to a queen for example simplicity
    });

    // illegal move
    if (move === null) return 'snapback';

    // update game
    game.save();
  };

  // update the board position after the piece snap 
  // for castling, en passant, pawn promotion
  var onSnapEnd = function() {
    board.position(game.fen());
  };

  return {
    restrict: 'E',

    scope: {
      'game': '=game',
    },

    link: function(scope, element, attrs){
      dirscope = scope;
      game = scope.game

      board = new ChessBoard(element, {
        position: game.fen(),
        draggable: true,
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
      });


      // Update board layout on game changes
      scope.$watch(game.fen, function(newPos, oldPos){
        console.log('repainting board');
        board.position(game.fen());
      });
    }
  }
});
