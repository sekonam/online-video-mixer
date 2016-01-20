function Player(element, videoUrl, frameAmount, onloadCallback) 
{
	this.DELAY = 150;
	this.REPLAY = false;
	this.frame = {};
	this.element = element;
	
	var self = this,
		counter = 0,
		img = null,
		pause = true,
		frame = this.frame;

	function run()
	{
		element.style.backgroundPosition = '0px ' + (-counter * frame.height) + 'px';
		
		if (++counter >= frameAmount) {
			counter = 0;
			
			if (!self.REPLAY) {
				self.stop();
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
		
		if (onloadCallback && {}.toString.call(onloadCallback) === '[object Function]') {
			onloadCallback.call(self);
		}
		
		self.start();
	};
	img.src = videoUrl;
}

window.onload = function () {
	var mainStream = Player(document.querySelector('.main-stream .player'), 'sprite1xx.jpeg', 100);
	for (var i=1; i<=4; i++) {
		(function (i) {
			var player = new Player(document.querySelector('.stream:nth-child(' + i + ') .player'), 
				'sprite' + i + 'xx.jpeg', 
				100, 
				function () {
					var pw = document.querySelector('.stream:nth-child(' + i + ')'),
						pwH3 = pw.querySelector('h3'),
						pwH3style = pwH3.currentStyle || window.getComputedStyle(pwH3);
						pwHeight = parseFloat(pwH3style.marginTop) + parseFloat(pwH3style.height) + parseFloat(pwH3style.marginBottom) + player.frame.height * player.frame.zoom;
					pw.style.height = pwHeight + 'px';
				}
			);
		})(i);
	}
};