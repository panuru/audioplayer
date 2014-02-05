(function() {
  var player = window.player = {};

  function formattedTime(observable, prefix) {
    return ko.computed(function(){
      var value = observable();
      var formatted = isNaN(value) ? '--:--' : new Date(value * 1000).toString("m:ss");
      if(prefix) { formatted = prefix + formatted };
      return formatted;
    });
  }

  var Player = function(options) {
    var audio = this._audio = options.audio;
    
    this.playlist = ko.observableArray(
      _.map(options.playlist, function(item){ return new Song(item); })
    );

    this.nowPlaying = ko.observable();
    
    this.isPlaying = ko.observable(false);
    this.isSeeking = ko.observable(false);
    this.isMuted = ko.observable(false);
    this.volume = ko.observable(audio.volume);
    this.currentTime = ko.observable(0);
    this.duration = ko.observable('-');

    this.remaining = ko.computed(function(){
      return this.duration() - this.currentTime();
    }.bind(this));

    this.currentTimePercent = ko.computed(function(){
      return 100 * this.currentTime() / this.duration();
    }.bind(this));
    
    this.volumePercent = ko.computed(function(){
      return this.volume() * 100;
    }.bind(this));

    this.currentTimeFormatted = formattedTime(this.currentTime);
    this.durationFormatted = formattedTime(this.duration);
    this.remainingFormatted = formattedTime(this.remaining, '-');

    audio.addEventListener('loadedmetadata', function() {
      this.duration(this._audio.duration);
      this.nowPlaying().duration(this._audio.duration);
    }.bind(this));

    audio.addEventListener('timeupdate', function() {
      this.currentTime(this._audio.currentTime);
    }.bind(this));

    audio.addEventListener('volumechange', function() {
      this.volume(this._audio.volume);
    }.bind(this));

    audio.addEventListener('error', function() {
      throw new PlayerLoadError();
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
      this._audio.muted = true;
      this.isMuted(true);
    },
    unmute: function() {
      this._audio.muted = false;
      this.isMuted(false);
    },
    setVolumePercent: function(context, event) {
      var percent = event.target.value;
      this._audio.volume = percent / 100;
    },
    seekToPercent: function(context, event) {
      var percent = event.target.value;
      this._audio.currentTime = percent * this._audio.duration / 100;
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

  var PlayerLoadError = function (message) {
    this.name = "Player error";
    this.message = message || '';
  }

  PlayerLoadError.prototype = new Error();

  player.init = function(options) {
    player.instance = new Player(options);
    ko.applyBindings(player.instance);
  };

  var errorCallbacks = $.Callbacks();

  player.onLoadError = errorCallbacks.add;

  window.onerror = function() {
    error = arguments[4];
    if (error && error instanceof PlayerLoadError) errorCallbacks.fire();
  };

})();
