angular.module("MyApp", ["firebase"])
.service('Game', function($firebase, $rootScope){

  var defaultFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  var gameRef = new Firebase("https://torid-fire-3930.firebaseio.com/game");
  var fen = $firebase(gameRef);
  var game = null;
  var ready = false;

  fen.$on('loaded', function(){
    $rootScope.$apply(function(){
      game = new Chess(fen.$value);
      ready = true;
    });

    fen.$on('change', function(){
      console.log('update!');
      $rootScope.$apply(function(){
        game.load(fen.$value);
      });
    });
  });


  return {
    ready: function(){
      return ready;
    },

    fen: function(){
      return game.fen();
    },

    update: function(newFen){
      if(newFen !== this.fen()){
        console.log('updating remote game to', newFen);
        fen.$set(newFen);
        game.load(newFen);
      }
    },

    clear: function(){
      this.update(defaultFen);
    },

    turn: function(){
      return game.turn();
    }

  }

})


.controller('AppCtrl', function($scope, Game){

  $scope.$watch(Game.ready, function(isReady){

    if(isReady === true){
      $scope.fen = Game.fen();
      $scope.turn = Game.turn;
      $scope.$watch('fen', function(newVal){
        Game.update(newVal);
      });

      $scope.$watch(Game.fen, function(newVal){
        console.log('game update from server');
        if($scope.fen !== newVal){
          $scope.fen = newVal;
        }
      });

    }

  });


  $scope.clear = function(){
    if (confirm('Are you sure you want to clear the board?')) {
      Game.clear();
      $scope.fen = Game.fen();
      $scope.turn = Game.turn;
    }
  }

})


// ==============
// The chessboard
// ==============
.directive('chessboard', function(){

  var board = null;
  var game = null;
  var dirscope = null;

  var updateBoard = function(fen){
    console.log('updating board to', fen);
    game = new Chess(fen);
    board.position(fen);
  };


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

    updateStatus();
  };

  // update the board position after the piece snap 
  // for castling, en passant, pawn promotion
  var onSnapEnd = function() {
    board.position(game.fen());
  };

  // TO REDO
  var updateStatus = function() {
    dirscope.$apply(function(){
      dirscope.fen = game.fen();
    });

    // var status = '';

    // var moveColor = 'White';
    // if (game.turn() === 'b') {
    //   moveColor = 'Black';
    // }

    // // checkmate?
    // if (game.in_checkmate() === true) {
    //   status = 'Game over, ' + moveColor + ' is in checkmate.';
    // }

    // // draw?
    // else if (game.in_draw() === true) {
    //   status = 'Game over, drawn position';
    // }

    // // game still on
    // else {
    //   status = moveColor + ' to move';

    //   // check?
    //   if (game.in_check() === true) {
    //     status += ', ' + moveColor + ' is in check';
    //   }
    // }

    // statusEl.html(status);
    // fenEl.html(game.fen());
    // pgnEl.html(game.pgn());
  };

  return {
    restrict: 'E',

    scope: {
      'fen': '=fen',
    },

    link: function(scope, element, attrs){
      dirscope = scope;

      var fen = scope.fen;
      game = new Chess(fen);

      board = new ChessBoard(element, {
        position: game.fen(),
        draggable: true,
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
      });

      scope.$watch('fen', function(newPosition, oldPosition){
        console.log('setting up board positions', newPosition, oldPosition);
        if(newPosition !== oldPosition && newPosition !== game.fen()){
          updateBoard(newPosition);
        }
      });
    }
  }
});

// function MyController($scope, $firebase) {
//   var todosRef = new Firebase("https://torid-fire-3930.firebaseio.com/todos");
//   // Automatically syncs everywhere in realtime
//   $scope.todos = $firebase(todosRef);
//   $scope.addTodo = function() {
//     // AngularFire $add method
//     $scope.todos.$add({name: $scope.newTodo});

//     $scope.newTodo = "";
//   }
// }
