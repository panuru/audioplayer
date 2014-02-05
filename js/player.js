(function() {
  var player = window.player = {};

  function formattedTime(observable, options) {
    return ko.computed(function(){
      var value = observable();
      var formatted = isNaN(value) ? '--:--' : new Date(value * 1000).toString("m:ss");
      if (options && options.prefix) { formatted = options.prefix + formatted };
      return formatted;
    });
  }

  var PlayerLoadMediaError = function (message) {
    this.name = "Player load media error";
    this.message = message || '';
  }

  PlayerLoadMediaError.prototype = new Error();
  
  var Track = function(model) {
    _.extend(this, model);
    this.duration = ko.observable('-');
    this.durationFormatted = formattedTime(this.duration);
  }

  Track.prototype = {
    play: function() {
      player.instance.nowPlaying(this);
      player.instance.play();
    }
  }

  var PlayerViewModel = function(playlist) {    
    this.playlist = ko.observableArray(
      _.map(playlist, function(item){ return new Track(item); })
    );

    this.nowPlaying = ko.observable();
    
    this.isPlaying = ko.observable(false);
    this.isSeeking = ko.observable(false);
    this.isMuted = ko.observable(false);
    this.volume = ko.observable(player.audio.volume);
    this.currentTime = ko.observable(player.audio.currentTime);
    this.duration = ko.observable('-');

    this.remaining = ko.computed(function(){
      return this.duration() - this.currentTime();
    }.bind(this));

    this.currentTimeFormatted = formattedTime(this.currentTime);
    this.durationFormatted = formattedTime(this.duration);
    this.remainingFormatted = formattedTime(this.remaining, { prefix: '-' });

    this.currentTimePercent = ko.computed(function(){
      return 100 * this.currentTime() / this.duration();
    }.bind(this));
    
    this.volumePercent = ko.computed(function(){
      return this.volume() * 100;
    }.bind(this));

    this._bindAudioEvents();

    // load the first track
    this.nowPlaying(this.playlist()[0]);
  }

  PlayerViewModel.prototype = {
    play: function() {
      player.audio.play();
    },
    pause: function() {
      player.audio.pause()
    },
    mute: function () {
      player.audio.muted = true;
    },
    unmute: function() {
      player.audio.muted = false;
    },
    setVolumePercent: function(context, event) {
      var percent = event.target.value;
      player.audio.volume = percent / 100;
    },
    nextTrack: function () {
      var ix = _.indexOf(this.playlist(), this.nowPlaying());
      var nextTrack = this.playlist()[ix + 1];
      if (nextTrack) {
        this.nowPlaying(nextTrack);
        this.play();
      }
    },
    prevTrack: function () {
      var ix = _.indexOf(this.playlist(), this.nowPlaying());
      var prevTrack = this.playlist()[ix - 1];
      if (prevTrack) {
        this.nowPlaying(prevTrack);
        this.play();
      }
    },
    seekToPercent: function(context, event) {
      var percent = event.target.value;
      player.audio.currentTime = percent * player.audio.duration / 100;
    },
    seekForward: function() {
      this.isSeeking(true);
      this._seekInterval = setInterval(function(){
        player.audio.currentTime = Math.min(player.audio.currentTime + 0.4, player.audio.duration);
      }.bind(this), 25);
    },
    seekBack: function() {
      this.isSeeking(true);
      this._seekInterval = setInterval(function(){
        player.audio.currentTime = Math.max(player.audio.currentTime - 0.4, 0);
      }.bind(this), 25);
    },
    stopSeeking: function() {
      this.isSeeking(false);
      clearInterval(this._seekInterval);
    },
    _bindAudioEvents: function() {
      var audio = player.audio;

      audio.addEventListener('loadedmetadata', function() {
        this.duration(audio.duration);
        this.nowPlaying().duration(audio.duration);
      }.bind(this));

      audio.addEventListener('playing', function(){
        this.isPlaying(true);
      }.bind(this));

      audio.addEventListener('pause', function(){
        this.isPlaying(false);
      }.bind(this));

      audio.addEventListener('timeupdate', function() {
        this.currentTime(audio.currentTime);
      }.bind(this));

      audio.addEventListener('volumechange', function() {
        this.volume(audio.volume);
        this.isMuted(audio.muted);
      }.bind(this));

      audio.addEventListener('error', function() {
        throw new PlayerLoadMediaError();
      }.bind(this));
    }
  }

  player.init = function(options) {
    player.audio = options.audio;
    player.instance = new PlayerViewModel(options.playlist);
    ko.applyBindings(player.instance);
  };

  var errorCallbacks = $.Callbacks();

  player.onLoadMediaError = errorCallbacks.add;

  window.onerror = function() {
    error = arguments[4];
    if (error && error instanceof PlayerLoadMediaError) errorCallbacks.fire();
  };

})();
