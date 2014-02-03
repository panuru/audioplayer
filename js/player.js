(function() {
  var player = window.player = {};

  var Player = function(options) {
    this.audio = options.audio;
    this.playlist = ko.observableArray(
      _.map(options.playlist, function(item){ return new Song(item, this); })
    );
    this.isPlaying = ko.observable(false);
    this.nowPlaying = ko.observable(this.playlist()[0]);
    this.nowPlaying.subscribe(function(newSong){
      console.log('now playing:', newSong);
    });
  }

  Player.prototype = {
    play: function() {
      this.audio.play();
      this.isPlaying(true);
    },
    pause: function() {
      this.audio.pause()
      this.isPlaying(false);
    }
  }

  var Song = function(model) {
    this.file = model.file
    this.play = function() {
      player.instance.nowPlaying(this);
      player.instance.play();
    }
  }

  player.init = function(options) {
    player.instance = new Player(options)
    ko.applyBindings(player.instance);
  }
})();