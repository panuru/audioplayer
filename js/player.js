(function() {
  var player = window.player = {};

  function formattedTime(observable) {
    return ko.computed(function(){
      var value = observable();
      return isNaN(value) ? '--:--' : new Date(value * 1000).toString("m:ss");
    });
  }

  var Player = function(options) {
    var audio = this._audio = options.audio;
    
    this.playlist = ko.observableArray(
      _.map(options.playlist, function(item){ return new Song(item); })
    );
    
    this.isPlaying = ko.observable(false);
    this.isSeeking = ko.observable(false);
    this.isMuted = ko.observable(false);
    this.nowPlaying = ko.observable();
    this.currentTime = ko.observable(0);
    this.duration = ko.observable('-')

    this.currentTimeFormatted = formattedTime(this.currentTime);
    this.durationFormatted = formattedTime(this.duration);

    this.currentPercent = ko.computed(function(){
      return 100 * this.currentTime() / this.duration();
    }.bind(this));

    audio.addEventListener('loadedmetadata', function() {
      this.duration(audio.duration);
      this.nowPlaying().duration(audio.duration);
    }.bind(this));

    audio.addEventListener('timeupdate', function() {
      this.currentTime(audio.currentTime);
    }.bind(this));

    // load the first track
    this.nowPlaying(this.playlist()[0]);
  }

  Player.prototype = {
    play: function() {
      this._audio.play();
      this.isPlaying(true);
    },
    pause: function() {
      this._audio.pause()
      this.isPlaying(false);
    },
    mute: function () {
      audio.muted = true;
      this.isMuted(true);
    },
    unmute: function() {
      audio.muted = false;
      this.isMuted(false);
    },
    seekTo: function(context, event) {
      var percent = event.target.value;
      this.currentTime(percent * this.duration() / 100);
    },
    seekForward: function() {
      this.isSeeking(true);
      this._seekInterval = setInterval(function(){
        this._audio.currentTime = Math.min(this._audio.currentTime + 0.4, this._audio.duration);
      }.bind(this), 25);
    },
    seekBack: function() {
      this.isSeeking(true);
      this._seekInterval = setInterval(function(){
        this._audio.currentTime = Math.max(this._audio.currentTime - 0.4, 0);
      }.bind(this), 25);
    },
    stopSeeking: function(){
      this.isSeeking(false);
      clearInterval(this._seekInterval);
    }
  }

  var Song = function(model) {
    _.extend(this, model);
    this.duration = ko.observable('-');
    this.durationFormatted = formattedTime(this.duration);
  }

  Song.prototype = {
    play: function() {
      player.instance.nowPlaying(this);
      player.instance.play();
    }
  }

  player.init = function(options) {
    player.instance = new Player(options)
    ko.applyBindings(player.instance);
  }
})();