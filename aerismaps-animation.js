

window.AerisMaps = window.AerisMaps || {};

(function(window, document) {

	/**
	 * Base Events object
	 */
	var Events = function(obj, blockGlobalRemoval) {
		var events = obj || {};
		var listeners = {}, contexts = {}, triggerLock = false;
		var toRemove = [], toCall = [];
		var numToRemove, numToCall;

		events.on = function (event, callback, context) {
			if (!listeners[event]) listeners[event] = [];
			listeners[event].push(callback);
			if (context) contexts[callback] = context;
		};
		events.off = function (event, callback, deferred) {
			if (!deferred) {
				if (listeners[event]) {
					listeners[event].splice(callback, 1);
				}
			} else {
				toRemove.push(arguments);
				numToRemove = toRemove.length;
			}
		};
		events.trigger = function (event, data, deferred) {
			if (deferred) {
				toCall.push(arguments);
				numToCall = toCall.length;
				return;
			}

			if (listeners[event]) {
				var i = 0, len = listeners[event].length;
				while (i < len) {
					var fn = listeners[event][i];
					fn.call(contexts[fn], data);
					i++;
				}
			}

			if (numToRemove > 0) {
				for (var i = 0; i < numToRemove; i++) {
					var r = toRemove[i];
					events.off(r[0], r[1], false);
				}
				toRemove = [];
				numToRemove = 0;
			}

			if (numToCall > 0) {
				var nc = toCall.shift();
				numToCall = toCall.length;
				events.trigger(nc[0], nc[1]);
			}
		};

		if (!blockGlobalRemoval) {
			events.offAll = function (event, deferred) {
				var es = listeners[event];
				var len = es.length;
				for (var i = 0; i < len; i++) {
					events.off(event, es[i], deferred);
				}
			}
		}

		return events;
	};

	/**
	 * DOM utilities
	 */
	var stringToDOM = function(string) {
 		var div = document.createElement('div');
		var el = document.createDocumentFragment();
		var node = null;

		div.innerHTML = string;
		while (node = div.firstChild) {
			el.appendChild(node);
		}
		return el;
 	};

	var Dom = function(el) {
		this.el = el;
		return this;
	};
	Dom.prototype.select = function(selector) {
		return Dom.select(selector, this.el);
	};
	Dom.prototype.show = function() {
		this.el.style.display = 'block';
		return this;
	};
	Dom.prototype.hide = function() {
		this.el.style.display = 'none';
		return this;
	};
	Dom.prototype.visible = function() {
		return (this.css('display') != 'none');
	};
	Dom.prototype.css = function(property, value) {
		if (typeof property == 'string') {
			if (value == null) {
				return getStyle(this.el, property);
			}
			this.el.style[property] = value;
		} else {
			for (var p in property) {
				this.el.style[p] = property[p];
			}
		}
		return this;
	};
	Dom.prototype.addClass = function(cls) {
		var el = this.el;
		if (undefined != cls && cls != '') {
			if (el.classList) {
				cls = (cls.match(/\s/)) ? cls.split(' ') : [cls];
				cls.forEach(function(c) {
					el.classList.add(c);
				});
			} else {
				var c = el.className;
				if (c) {
					c += ' ';
				}
				el.className += c + cls;
			}
		}
		return this;
	};
	Dom.prototype.removeClass = function(cls) {
		var el = this.el;
		if (undefined != cls && cls != '') {
			if (el.classList) {
				cls = (cls.match(/\s/)) ? cls.split(' ') : [cls];
				cls.forEach(function(c) {
					el.classList.remove(c);
				});
			} else {
				var re = new RegExp('\b' + cls + '\b');
				el.className.replace(re, '');
			}
		}
		return this;
	};
	Dom.prototype.toggleClass = function(cls) {
		if (this.hasClass(cls)) {
			this.removeClass(cls);
		} else {
			this.addClass(cls);
		}
		return this;
	};
	Dom.prototype.hasClass = function(cls) {
		if (undefined == cls || cls == '') {
			return false;
		}
		if (this.el.classList) {
			return this.el.classList.contains(cls);
		}
		var re = new RegExp('(^|\\s+)' + cls + '(\\s+|$)');
		return re.test(this.el.className);
	};
	Dom.prototype.create = function(html) {
		var el = html;
		if (typeof el == 'string') {
			el = stringToDOM(html);
		}
		if (undefined == el.ext) {
			Dom.extend(el);
		}
		return el;
	};
	Dom.prototype.append = function(html) {
		var node = this.create(html);
		this.el.appendChild(node);

		return this;
	};
	Dom.prototype.prepend = function(html) {
		var node = this.create(html);
		document.body.insertBefore(node, this.el.firstChild);

		return this;
	};
	Dom.prototype.remove = function() {
		this.el.parentNode.removeChild(this.el);
	};
	Dom.prototype.empty = function() {
		while (this.el.firstChild) {
			this.el.removeChild(this.el.firstChild);
		}
		return this;
	};

	Dom.select = function(selector, el) {
 		if (typeof selector != 'string') return selector;
		if (!el) el = document;
		if (el != document && el != window) {
			var scope = selector.match(/^\:scope/);
			if (!scope || scope.length == 0) {
				selector = ':scope ' + selector;
			}
		}

		var els = Array.prototype.slice.call(el.querySelectorAll(selector));
		(function(self) {
			els.forEach(function(el, idx) {
				Dom.extend(el);
			});
		})(this);

		if (els.length == 1) {
			els = els[0];
		}

		return els;
	};
	Dom.extend = function(el) {
		el.ext = new Dom(el);
	};

	function InvalidArgumentException(message) {
		this.message = message;
		if ("captureStackTrace" in Error) {
			Error.captureStackTrace(this, InvalidArgumentException);
		} else {
			this.stack = (new Error()).stack;
		}
	}
	InvalidArgumentException.prototype = Object.create(Error.prototype);
	InvalidArgumentException.prototype.name = "InvalidArgumentException";
	InvalidArgumentException.prototype.constructor = InvalidArgumentException;


	/**
	 * Private utility functions
	 */
	var extend = function(target, object) {
		for (var i in object) {
			if (object.hasOwnProperty(i)) {
				if (typeof target[i] == "object" && target.hasOwnProperty(i) && target[i] != null) {
					extend(target[i], object[i]);
				} else {
					target[i] = object[i];
				}
			}
		}
		return target;
	};
	var keys = function(o) {
		if (typeof o != 'object') return [];
		var keys = [];
    	for (var key in o) if (hasOwnProperty.call(o, key)) keys.push(key);
    	return keys;
	};
	var isDate = function(date) {
		return date.constructor.toString().indexOf("Date") > -1;
	}
	var formatDate = function(date, format) {
		var hours = date.getHours();
		var ttime = "AM";

		if (format.indexOf("t") > -1 && hours > 12) {
			hours = hours - 12;
			ttime = "PM";
		}

		var o = {
			"M+": date.getMonth() + 1, //month
			"d+": date.getDate(),    //day
			"h+": hours,   //hour
			"m+": date.getMinutes(), //minute
			"s+": date.getSeconds(), //second
			"q+": Math.floor((date.getMonth() + 3) / 3),  //quarter
			"S": date.getMilliseconds(), //millisecond,
			"t+": ttime
		}

		if (/(y+)/.test(format)) {
			format = format.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
		}

		for (var k in o) {
			if (new RegExp("(" + k + ")").test(format)) {
				format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
			}
		}
		return format;
	};
	var parseTemplate = function(tpl, data) {
		var val = tpl;
		for (var key in data) {
			val = val.replace('{{' + key + '}}', data[key]);
		}
		return val;
	};

	AerisMaps.url = 'http://maps.aerisapi.com/{{client_id}}_{{client_secret}}/{{layers}}/{{size}}/{{loc}},{{zoom}}/{{time}}.{{format}}';

	/**
	 * Core Map Animation object
	 */
	var Animation = function(target, options) {
		var self = this;
		var config = extend({
			loc: null,
			keys: {
				id: null,
				secret: null
			},
			refresh: 0,
			events: {
				click: function() {
					if (self.isPaused()) {
						self.play();
					} else {
						self.pause();
					}
				}
			},
			map: {
				zoom: 6,
				format: 'jpg',
				size: {
					width: 600,
					height: 600
				},
				layers: [
					'flat',
					'radar',
					'admin'
				]
			},
			animation: {
				from: -6 * 3600,
				to: 0,
				duration: 2,
				endDelay: 1,
				intervals: 10
			},
			overlays: {
				title: null,
				timestamp: {
					format: 'MM/dd/yyyy hh:mm tt',
					continuous: true
				}
			}
		}, options);

		var now = new Date().getTime();

		if (isDate(config.animation.from)) {
			this._fromOffset = null;
			config.animation.from = config.animation.from.getTime();
		} else {
			this._fromOffset = config.animation.from * 1000;
		}

		if (isDate(config.animation.to)) {
			this._toOffset = null;
			config.animation.to = config.animation.to.getTime();
		} else {
			this._toOffset = config.animation.to * 1000;
		}

		this.target = (typeof target == 'string') ? Dom.select(target) : Dom.extend(target);
		this.config = config;
		this.duration = config.animation.duration;

		this._endDelay = config.animation.endDelay;
		this._from = config.animation.from;
		this._to = config.animation.to;
		this._intervals = config.animation.intervals;

		this._elapsed = 0;
		this._time = this._from;
		this._increment = 0;
		this._delay = 1/60;
		this._paused = false;

		this._images = {};
		this._currentImage = null;

		if (!config.keys.id || config.keys.id.length == 0 || !config.keys.secret || config.keys.secret.length == 0) {
			throw new InvalidArgumentException('Invalid configuration values for "keys.id" and/or "keys.secret"');
		} else if (!config.loc || config.loc.length == 0) {
			throw new InvalidArgumentException('Invalid configuration value for "loc"')
		} else {
			this.init();
		}

		return this;
	};
	Events(Animation.prototype, true);

	Animation.prototype.init = function() {
		if (this.target) {
			var self = this;

			this.target.ext.css({
				position: 'relative',
				width: this.config.map.size.width + 'px',
				height: this.config.map.size.height  + 'px'
			});
			this.target.ext.addClass('amp-map');

			this.target.ext.append('<div class="amp-map-content"></div>');
			var contentTarget = this.target.ext.select('.amp-map-content');
			contentTarget.ext.css({
				position: 'absolute',
				top: 0,
				left: 0,
				bottom: 0,
				right: 0,
				"z-index": 0
			});
			this._contentTarget = contentTarget;

			if (this.config.events) {
				for (var event in this.config.events) {
					this.target.addEventListener(event, function() {
						self.config.events[event]();
					});
				}
			}

			if (this.config.overlays.timestamp) {
				this.target.ext.append('<div class="amp-map-timestamp"></div>');
				this._timestamp = this.target.ext.select('.amp-map-timestamp');

				var ts = this.config.overlays.timestamp;
				if (typeof ts == 'object' && undefined != ts.continuous) {
					if (ts.continuous === false) {
						this.on('advance:image', function(data) {
							self._updateTimestampOverlay(data.time);
						});
					} else {
						this.on('advance', function(data) {
							self._updateTimestampOverlay(data.time);
						});
					}
				}
				this.on('load:progress', function(data) {
					self._updateTimestampOverlay(data.time);
				});
			}
			if (this.config.overlays.title) {
				this.target.ext.append('<div class="amp-map-title">' + this.config.overlays.title + '</div>');
			}
		}
	};

	Animation.prototype.play = function() {
		if (this.isAnimating()) {
			return;
		}
		if (!this._hasImages()) {
			this._loadData();
			return;
		}

		this._paused = false;
		this._updateTiming();
		this.trigger('play', { from: new Date(this._from), to: new Date(this._to) });

		if (this._time == this._to || this._to == this._from) {
			this.goToTime(this._from);
		}

		(function(self) {
			self._timer = setInterval(function() {
				var next = self._time + self._increment;
				if (next > self._to) {
					self.restart();
				} else {
					self.goToTime(next);
				}
			}, self._delay * 1000);
		})(this);
	};

	Animation.prototype.stop = function() {
		this.pause();
		this.trigger('stop');
		this._paused = false;

		if (this._to != null) {
			this.goToTime(this._to);
		}
	};

	Animation.prototype.restart = function() {
		this.pause();
		(function(self) {
			setTimeout(function() {
				self.goToTime(self._from);
				self.play();
			}, self._endDelay * 1000);
		})(this);
	}

	Animation.prototype.pause = function() {
		this._paused = true;
		if (this._timer) {
			window.clearInterval(this._timer);
			this._timer = null;
		}
		this.trigger('pause');
	};

	Animation.prototype.goToTime = function(time) {
		this._time = isDate(time) ? time.getTime() : time;
		this._offset = time - this._from;

		var image = this._imageClosestToTime(this._time);
		if (image) {
			if (image != this._currentImage) {
				image.ext.show();
				if (this._currentImage && this._currentImage.ext) {
					this._currentImage.ext.hide();
				}
				this._currentImage = image;
			}
		} else if (!this.isAnimating()) {
			this._loadInterval(time, false);
		}
		this.trigger('advance', { time: this._time, offset: this._offset });
	};

	Animation.prototype.isAnimating = function() {
		return (this._timer != null);
	};

	Animation.prototype.isPaused = function() {
		return this._paused;
	};

	Animation.prototype.totalTime = function() {
		return this._to - this._from;
	};

	Animation.prototype.currentTime = function() {
		return this._time;
	};

	Animation.prototype.position = function() {
		this._offset / this.totalTime();
	};

	Animation.prototype.startDate = function() {
		return new Date(this._from);
	};

	Animation.prototype.setStartDate = function(start) {
		this.stop();
		this._from = isDate(start) ? state.getTime() : start;
		this._updateTiming();
		this._images = {};
	};

	Animation.prototype.endDate = function() {
		return new Date(this._to);
	};

	Animation.prototype.setEndDate = function(end) {
		this.stop();
		this._to = isDate(start) ? state.getTime() : start;
		this._updateTiming();
		this._images = {};
	};

	//
	// Private Methods
	//

	Animation.prototype._updateTiming = function() {
		this._increment = ((this._to - this._from) / this.duration) * this._delay;
	};

	Animation.prototype._imageClosestToTime = function(time) {
		var image = null;
		var closest = this._from;
		var diff = Math.abs(time - closest);

		for (var imageTime in this._images) {
			var imageDiff = Math.abs(time - imageTime);
			if (imageDiff < diff) {
				diff = imageDiff;
				closest = imageTime;
			}
		}

		if (closest != this._lastImageTime && this._images[closest]) {
			image = this._images[closest];
			closest = Math.round(closest);
			this._lastImageTime = closest;
			this.trigger('advance:image', { time: closest, img: image });
		}

		return image;
	};

	Animation.prototype._hasImages = function() {
		var o = this._images;
		if (o == null) return false;

		var hasProps = false;
		for (var key in o) {
			if (hasOwnProperty.call(o, key)) {
				return true;
			}
		}
		return hasProps;
	};

	Animation.prototype._updateTimestampOverlay = function(time) {
		if (this._timestamp) {
			var ts = this.config.overlays.timestamp;
			var format = null;

			if (typeof ts == 'string') {
				format = ts;
			} else if (ts.format) {
				format = ts.format;
			}

			this._timestamp.innerHTML = formatDate(new Date(time), format);
		}
	};

	Animation.prototype._loadData = function() {
		// if from and to were offsets and not dates, then we need to update the date time values before loading new data
		var now = new Date().getTime();
		if (null != this._fromOffset) {
			this._from = now + this._fromOffset;
			this._time = this._from;
		}
		if (null != this._toOffset) {
			this._to = now + this._toOffset;
		}

		this._images = {};
		this._contentTarget.ext.empty();

		// calculate time intervals needed
		var totalIntervals = this._intervals;
		var interval = Math.round((this._to - this._from) / totalIntervals);
		var times = [];
		var lastTime = null;
		for (var i = 0; i < totalIntervals; i++) {
			var t = this._from + (interval * i);
			if (i == 0 || t != lastTime) {
				times.push(t);
				lastTime = t;
			}
		}

		this._intervals = times.length;
		this.trigger('load:start', { times: times });

		var self = this;
		var loadingInterval = 0;
		var loadNextInterval = function() {
			self._loadInterval(times[loadingInterval], true, function() {
				loadingInterval++;
				if (loadingInterval >= times.length) {
					self.trigger('load:done');
					self.play();

					// start refresh timer if needed
					if (self.config.refresh > 0) {
						setTimeout(function() {
							self.stop();
							self._loadData();
						}, self.config.refresh * 1000);
					}

				} else {
					loadNextInterval();
				}
			});
		};

		loadNextInterval();
	};

	Animation.prototype._loadInterval = function(interval, cache, callback) {
		var opts = this.config;
		var date = new Date(interval);
		var gmtDate = new Date(date.getTime() + date.getTimezoneOffset() * 60 * 1000);

		var url = parseTemplate(AerisMaps.url, {
			client_id: opts.keys.id,
			client_secret: opts.keys.secret,
			layers: opts.map.layers.join(','),
			zoom: opts.map.zoom,
			size: opts.map.size.width + 'x' + opts.map.size.height,
			loc: opts.loc,
			format: opts.map.format,
			time: formatDate(gmtDate, 'yyyyMMddhhmm00')
		});

		var image = new Image();
		image.src = url;
		(function(self) {
			image.onload = function() {
				if (!self._images) {
					self._images = {};
				}

				var img = '<img id="amp-' + interval + '" src="' + image.src + '" width="' + self.config.map.size.width + '" height="' + self.config.map.size.height + '" style="position:absolute;">';
				self._contentTarget.ext.append(img);

				var el = Dom.select('#amp-' + interval);
				if (el && cache) {
					self._images[interval] = el;
				}
				if (self._currentImage && self._currentImage.ext) {
					self._currentImage.ext.hide();
				}
				self._currentImage = el;

				self.trigger('load:image', { date: new Date(interval), src: image.src });
				self.trigger('load:progress', { time: interval, loaded: keys(self._images).length, total: self._intervals });

				if (callback) {
					callback();
				}
			};
		})(this);
	};

	window.AerisMaps.Animation = Animation;

})(window, document);
