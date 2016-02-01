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
			setTimeout(this.run, self.DELAY);
		}
	};
	
	this.start = function () {
		pause = false;
		this.run();
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
		this.img.src = videoUrl;
	};
}

function Recorder(element, initSource)
{
	AbstractPlayer.call(this, element, initSource.frameAmount);

	var self = this,
		sources = [],
		activePlayer = null;
	
	this.active = function () 
	{
		if (arguments.length) {
			activePlayer = arguments[0];
		} 
		return activePlayer;
	};
	
	var parentIterate = this._iterate;
	this._iterate = function ()
	{
		sources[this.counter] = this.active();

		if (this.counter == 0 || sources[this.counter-1] != sources[this.counter]) {
			this._setFrameStyle(sources[this.counter].img);
		}
		
		parentIterate.call(this);
		element.style.backgroundImage = 'url(' + sources[self.counter].src + ')';
	};
	
	sources[0] = this.active(initSource);
	var source0Onload = sources[0].onload ? sources[0].onload : function () {};
	sources[0].onload = function ()
	{
		source0Onload();
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
		this.played = true;
		mainPlayer.start();
		players.map(function (player) {
			player.start();
		});
		scroll();
	};

	this.stop = function () 
	{
		this.played = false;
		mainPlayer.stop();
		players.map(function (player) {
			player.stop();
		});
		
		call(self.onstop, self);
	};
	
	this.play = function () 
	{
		
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
				
				if (i == 1) {
					self.active(player);
				}
				
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
		document.querySelector('.buttons .play').innerHTML = 'Start';
	};
	document.querySelector('.buttons .play').addEventListener('click', function () {
		if (mixer.play()) {
			document.querySelector('.buttons .play').innerHTML = 'Stop';
		}
	});
};