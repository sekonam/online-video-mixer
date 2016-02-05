function getStyleRead(element) 
{
	return element.currentStyle || window.getComputedStyle(element);
}

function removeClass(element, className) 
{
	element.className = element.className.replace(new RegExp(className, 'g'), '');
}

function call(func, self)
{
	if (func && {}.toString.call(func) === '[object Function]') {
		return func.call(self);
	}
	return null;
}

function AbstractPlayer(element, frameAmount) 
{
	var self = this;
	
	this.call = function (func) 
	{
		return call(func, self);
	};

	this.frame = {};
	this.element = element;
	this.counter = 0;
	this.frameAmount = frameAmount;

	this.DELAY = 150;
	this.REPLAY = false;

	this.onend = null;
	
	var pause = true,
		frame = this.frame;

	this._iterate = function ()
	{
		element.style.backgroundPosition = '0px ' + (-self.counter * frame.height) + 'px';
	};

	this.run = function ()
	{
		self._iterate();
		
		if (++self.counter >= frameAmount) {
			self.counter = 0;
			
			if (!self.REPLAY) {
				self.stop();
				self.call(self.onend);				
			}
		}
		
		if (!pause) {
			setTimeout(self.run, self.DELAY);
		}
	};
	
	this.start = function () {
		pause = false;
		self.run();
	};
	
	this.stop = function () {
		pause = true;
	};
	
	this._setFrameStyle = function (img) 
	{
		frame.width = img.width;
		frame.height = frameAmount ? img.height / frameAmount : 0;
		frame.ratio = frame.height == 0 ? 1 : frame.width / frame.height;
		frame.zoom = img.width ? element.clientWidth / img.width : 1;
		
		var style = {
				width: frame.width + 'px',
				height: frame.height + 'px',
				transform: 'scale(' + frame.zoom + ')'
			};
			
		for (var field in style) {
			element.style[field] = style[field];
		}
	};

}

function Player(element, videoUrl, frameAmount) 
{
	AbstractPlayer.call(this, element, frameAmount);

	this.src = videoUrl;
	this.onload = null;
	
	var self = this;

	this.img = new Image();
	this.img.onload = function() 
	{
		element.style.backgroundImage = 'url(' + videoUrl + ')';
		self._setFrameStyle(self.img);
		self.call(self.onload);
	};
	
	this.load = function () 
	{
		self.img.src = videoUrl;
	};
}

function UnrecordedVideoPlaying()
{
	this.message = "You're trying to play unrecorded video. Mix it at first!";
}

function Recorder(element, initSource)
{
	AbstractPlayer.call(this, element, initSource.frameAmount);
	
	this.sources = [];

	var self = this,
		activePlayer = null,
		record = true;
	
	this.active = function () 
	{
		if (arguments.length) {
			activePlayer = arguments[0];
		} 
		return activePlayer;
	};
	
	this.record = function ()
	{
		if (arguments.length > 0) {
			record = arguments[0];
		}
		
		return record;
	};
	
	var parentIterate = this._iterate;
	this._iterate = function ()
	{
		if (record) {
			self.sources[self.counter] = self.active();
		}

		if (typeof self.sources[self.counter] === 'undefined') {
			throw new UnrecordedVideoPlaying();
		}
		
		if (self.counter === 0 || self.sources[self.counter-1] !== self.sources[self.counter]) {
			self._setFrameStyle(self.sources[self.counter].img);
		}
		
		parentIterate.call(self);
		element.style.backgroundImage = 'url(' + self.sources[self.counter].src + ')';
	};
	
	for (var i=0; i<this.frameAmount; i++) {
		this.sources[i] = initSource;
	}

	var initOnload = initSource.onload ? initSource.onload : function () {};
	initSource.onload = function ()
	{
		initOnload();
		self.active(initSource);
		self._iterate();
	};
}

function Mixer()
{
	this.onstop = null;
	
	var players = [],
		mainPlayer = null,
		self = this,
		active = null;
	
	this.active = function () 
	{
		if (arguments.length > 0) {
			if (active) {
				removeClass(active.element, 'active-player');
			}
			active = arguments[0];
			mainPlayer.active(active);
			active.element.className += ' active-player';
		} else {
			return active;
		}
	};
	
	function scroll() {
		if (mainPlayer) {
			var shift = document.querySelector('.record-progress').clientWidth / mainPlayer.frameAmount;
			document.querySelector('.record-progress .indicator').style.left = shift * mainPlayer.counter + 'px';
			if (self.played) {
				setTimeout(scroll, mainPlayer.DELAY);
			}
		}
	}
	
	this.played = false;

	this.start = function () {
		try {
			mainPlayer.start();
			players.map(function (player) {
				player.start();
			});
			self.played = true;
			scroll();
		} catch (e) {
			if (e.constructor.name == 'UnrecordedVideoPlaying') {
				alert(e.message);
			}
		}
	};

	this.stop = function () 
	{
		self.played = false;
		mainPlayer.stop();
		players.map(function (player) {
			player.stop();
		});
		
		call(self.onstop, self);
	};
	
	this.play = function (record) 
	{
		mainPlayer.record(record);
		
		if (this.played) {
			this.stop();
		} else {
			this.start();
		}

		return this.played;
	};

	function init()
	{
		for (var i=1; i<=4; i++) {
			(function (i) {
				var player = new Player(
					document.querySelector('.stream:nth-child(' + i + ') .player'), 
					'sprite' + i + 'xx.jpeg', 
					100
				);
				players.push(player);
				
				/*
				 * active player selection
				 */
				player.element.addEventListener('click', function () {
					
					if (this != self.active().element) {
						self.active(player);
					}
					
				});
				
				/*
				 * streams default height fix
				 */
				player.onload = function () {
					var pw = document.querySelector('.stream:nth-child(' + i + ')'),
						pwH3 = pw.querySelector('h3'),
						pwH3style = getStyleRead(pwH3);
						pwHeight = parseFloat(pwH3style.marginTop) + parseFloat(pwH3style.height) + parseFloat(pwH3style.marginBottom) + player.frame.height * player.frame.zoom;
					pw.style.height = pwHeight + 'px';
				};
			})(i);
		}
		
		mainPlayer = new Recorder(document.querySelector('.main-stream .player'), players[0]);
		mainPlayer.onend = function () {
			self.stop();
		};
		
		var player0Onload = players[0].onload;
		players[0].onload = function ()
		{
			player0Onload();
			self.active(players[0]);
		};
		
	} init();
	
	function load() 
	{
		players.map(function (player) {
			player.load();
		});
	} load();
	
}

window.onload = function () {
	var mixer = new Mixer;
	mixer.onstop = function () {
		document.querySelector('.buttons .record').innerHTML = 'Record';
		document.querySelector('.buttons .play').innerHTML = 'Play';
	};
	var playCallback = function () {
		var record = this.className.indexOf("record") > -1 ? true : false;
		if (mixer.play(record)) {
			document.querySelector('.buttons .record').innerHTML = 'Stop';
			document.querySelector('.buttons .play').innerHTML = 'Pause';
		}
	};
	document.querySelector('.buttons .record').addEventListener('click', playCallback);
	document.querySelector('.buttons .play').addEventListener('click', playCallback);
};