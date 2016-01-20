function Player(element, videoUrl, frameAmount) 
{
	this.DELAY = 150;
	this.REPLAY = false;
	this.frame = {};
	this.element = element;
	this.counter = 0;
	this.frameAmount = frameAmount;
	this.onload = null;
	this.onend = null;
	this.src = videoUrl;
	
	var self = this,
		img = null,
		pause = true,
		frame = this.frame;

	function run()
	{
		element.style.backgroundPosition = '0px ' + (-self.counter * frame.height) + 'px';
		
		if (++self.counter >= frameAmount) {
			self.counter = 0;
			
			if (!self.REPLAY) {
				self.stop();
		
				if (self.onend && {}.toString.call(self.onend) === '[object Function]') {
					self.onend.call(self);
				}
				
			}
		}
		
		if (!pause) {
			setTimeout(run, self.DELAY);
		}
	};
	
	this.start = function () {
		pause = false;
		run();
	};
	
	this.stop = function () {
		pause = true;
	};

	img = new Image();
	img.onload = function() 
	{
		frame.width = this.width;
		frame.height = frameAmount ? this.height / frameAmount : 0;
		frame.ratio = frame.height == 0 ? 1 : frame.width / frame.height;
		frame.zoom = this.width ? element.clientWidth / this.width : 1;
		
		var style = {
				width: frame.width + 'px',
				height: frame.height + 'px',
				transform: 'scale(' + frame.zoom + ')',
				backgroundImage: 'url(' + videoUrl + ')' 
			};
			
		for (var field in style) {
			element.style[field] = style[field];
		}
		
		if (self.onload && {}.toString.call(self.onload) === '[object Function]') {
			self.onload.call(self);
		}
	};
	this.load = function () {
		img.src = videoUrl;
	};
}

function Mixer()
{
	this.onstop = null;
	
	var players = [],
		mainPlayer = null,
		self = this;

	function init()
	{
		mainPlayer = new Player(document.querySelector('.main-stream .player'), 'sprite1xx.jpeg', 100, true);
		mainPlayer.onend = function () {
			self.stop();
		};
		
		for (var i=1; i<=4; i++) {
			(function (i) {
				var player = new Player(
					document.querySelector('.stream:nth-child(' + i + ') .player'), 
					'sprite' + i + 'xx.jpeg', 
					100
				);
				player.onload = function () {
					var pw = document.querySelector('.stream:nth-child(' + i + ')'),
						pwH3 = pw.querySelector('h3'),
						pwH3style = pwH3.currentStyle || window.getComputedStyle(pwH3);
						pwHeight = parseFloat(pwH3style.marginTop) + parseFloat(pwH3style.height) + parseFloat(pwH3style.marginBottom) + player.frame.height * player.frame.zoom;
					pw.style.height = pwHeight + 'px';
				};
				players.push(player);
			})(i);
		}
	} init();
	
	function load() {
		mainPlayer.load();
		players.map(function (player) {
			player.load();
		});
	} load();
	
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

	this.stop= function () {
		this.played = false;
		mainPlayer.stop();
		players.map(function (player) {
			player.stop();
		});
		if (self.onstop && {}.toString.call(self.onstop) === '[object Function]') {
			self.onstop.call(self);
		}
	};
	
	this.play = function () {
		
		if (this.played) {
			this.stop();
		} else {
			this.start();
		}
		
		return this.played;
	};
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