function Fx(div, options) {
	var _options    = options             || {};
	var _fps        = _options.fps        || 25;
	var _duration   = _options.duration   || 800;
	var _transition = _options.transition || Fx.Transitions.Linear.easeOut;
	var _from       = _options.from       || 0;
	var _to         = _options.to         || 1.0;
	var _onApply    = _options.onApply    || false;	
	var _onComplete = _options.onComplete || false;
	var _onStart    = _options.onStart    || false;
	var _onUpdate   = _options.onUpdate   || false;
	var _div        = $(div);
	var _that       = this;

	var _interval   = 1000/_fps;
	var _nbSteps    = Math.round(_duration/_interval);

	var _mapping = [];
	for(var i=1; i<=_nbSteps; ++i) {
		_mapping.push(_transition(i*_interval / _duration) * (_to - _from) + _from);
  }
	var currentStep = 0;
	var _timer;

	function iter() {
		if (_mapping[currentStep] && _onApply) {			
			_onApply(_div, _mapping[currentStep]);
			
			if (_onUpdate)
				_onUpdate(_that, currentStep, _mapping[currentStep]);
				
			currentStep++;
		}
		else {
			_that.stop();
			return;
		}
	}
	
	this.getDiv = function() {
		return _div;
	};
	
	this.start = function() {
		if (_onStart)
			_onStart(_that);
			
		_timer = setInterval(iter, _interval);
	};
	
	this.stop = function() {
		if (_timer)
			clearInterval(_timer);
		Fx.Listener.remove(_that);
		
		if (_onComplete)
			_onComplete(_that);
	};
	
	Fx.Listener.add(_that);
}

Fx.Listener = new function() {
	var _listeners = [];
	
	this.add = function(animator) {		
		var div = animator.getDiv();
		for (var elt in _listeners) {
			if (_listeners[elt].div == div) {
				_listeners[elt].anim.stop();
				delete _listeners[elt];
				break;				
			}
		}
		_listeners.push({"div": div, "anim" : animator});
		animator.start();
	};
	
	this.remove = function(animator) {
		var div = animator.getDiv();
		for (var elt in _listeners) {
			if (_listeners[elt].div === div) {
				delete _listeners[elt];
				break;
			}
		}
	};
};

Fx.Transitions = {};

Fx.Transition = function(transition){
	return Object.extend(transition, {
		easeIn: function(pos) {
			return transition(pos);
		},
		easeOut: function(pos) {
			return 1 - transition(1 - pos);
		},
		easeInOut: function(pos) {
			return (pos <= 0.5) ? transition(2 * pos) / 2 : (2 - transition(2 * (1 - pos))) / 2;
		}
	});
};

Fx.Transitions.extend = function(transitions) {
	for (var transition in transitions) 
		Fx.Transitions[transition] = new Fx.Transition(transitions[transition]);
};

Fx.Transitions.extend({

	Linear : function(p) {
		return p;
	},	
	Pow: function(p, x) {
		return Math.pow(p, x || 6);
	},

	Expo: function(p) {
		return Math.pow(2, 8 * (p - 1));
	},

	Circ: function(p) {
		return 1 - Math.sin(Math.acos(p));
	},

	Sine: function(p) {
		return 1 - Math.sin((1 - p) * Math.PI / 2);
	},

	Back: function(p, x) {
		x = x || 1.618;
		return Math.pow(p, 2) * ((x + 1) * p - x);
	},

	Bounce: function(p) {
		var value;
		for (var a = 0, b = 1; 1; a += b, b /= 2){
			if (p >= (7 - 4 * a) / 11){
				value = - Math.pow((11 - 6 * a - 11 * p) / 4, 2) + b * b;
				break;
			}
		}
		return value;
	},

	Elastic: function(p, x) {
		return Math.pow(2, 10 * --p) * Math.cos(20 * p * Math.PI * (x || 1) / 3);
	}
});

Fx.Transitions.extend(
	function() {
		var obj = {};
		var name = ["Quad", "Cubic", "Quart", "Quint"];
		for (var i=0; i<name.length; ++i) {
			obj[name[i]] = function(index) { 
				return function(p)  { 
					return Math.pow(p, index+2);
				};
			}(i);
		}
		return obj;
	}()
);