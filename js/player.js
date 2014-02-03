(function() {
  var player = window.player = {};

  var Player = function(options) {
    this._audio = options.audio;
    
    this.playlist = ko.observableArray(
      _.map(options.playlist, function(item){ return new Song(item, this); })
    );
    
    this.isPlaying = ko.observable(false);
    this.isSeeking = ko.observable(false);
    
    this.nowPlaying = ko.observable();

    this.currentTime = ko.observable(0);
    this.duration = ko.observable(0)

    function formatDate(sec) {
      return new Date(sec * 1000).toString("m:ss");
    }

    this.currentTimeFormatted = ko.computed(function(){
      return formatDate(this.currentTime());
    }.bind(this));

    this.durationFormatted = ko.computed(function(){
      return formatDate(this.duration());
    }.bind(this));

    _.bindAll(this, '_tick', '_updateMeta');

    this.isPlaying.subscribe(this._tick);
    this.isSeeking.subscribe(this._tick);

    this._audio.addEventListener('loadedmetadata', this._updateMeta);

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
      clearInterval(this._interval);
    },
    seekForward: function() {
      this.isSeeking(true);
      this._seekInterval = setInterval(function(){
        this._audio.currentTime++;
      }.bind(this))
    },
    seekBack: function() {
      this.isSeeking(true);
      this._seekInterval = setInterval(function(){
        this._audio.currentTime--;
      }.bind(this))
    },
    stopSeeking: function(){
      this.isSeeking(false);
      clearInterval(this._seekInterval);
    },
    _tick: function(value){
      if (value) {
        this._tickInterval = setInterval(function(){
          this.currentTime(this._audio.currentTime);
        }.bind(this), 50);
      } else {
        clearInterval(this._tickInterval);
      }
    },
    _updateMeta: function() {
      this.duration(this._audio.duration);
      console.log(this.duration());
    }
  }

  var Song = function(model) {
    _.extend(this, model);
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