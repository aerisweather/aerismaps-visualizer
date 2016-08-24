
(function(window, document) {
	"use strict";

	var AerisMaps = window.AerisMaps || {};
	window.AerisMaps = AerisMaps;

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
	};
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
		};

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
	var update = function(obj) {
		var len = arguments.length;
		if (len < 2 || obj == null) return obj;

		for (var i = 1; i < len; i++) {
			var source = arguments[i];
			var k = keys(source), l = k.length;
			for (var j = 0; j < l; j++) {
				var key = k[j];
				if (obj[key] === void 0) obj[key] = source[key];
			}
		}

		return obj;
	};


	/**
	 * Base Events object
	 */
	var triggerEvents = function(events, args) {
		var ev, i = -1, len = events.length;
		var a1 = args[0], a2 = args[1], a3 = args[2];

		switch (args.length) {
			case 0:
				while (++i < len) {
					(ev = events[i]).callback.call(ev.ctx);
				}
				return;
			case 1:
				while (++i < len) {
					(ev = events[i]).callback.call(ev.ctx, a1);
				}
				return;
			case 2:
				while (++i < len) {
					(ev = events[i]).callback.call(ev.ctx, a1, a2);
				}
				return;
			case 3:
				while (++i < len) {
					(ev = events[i]).callback.call(ev.ctx, a1, a2, a3);
				}
				return;
			default:
				while (++i < len) {
					(ev = events[i]).callback.apply(ev.ctx, args);
				}
				return;
		}
	};
	var Events = {
		on: function(event, callback, context) {
			if (!this._events) {
				this._events = {};
			}

			var events = this._events[event] || (this._events[event] = []);
			events.push({ callback: callback, context: context, ctx: context || this });

			return this;
		},

		once: function(event, callback, context) {
			var self = this;
			var once = _.once(function() {
				self.off(event, once);
				callback.apply(this, arguments);
			});
			once._callback = callback;

			return this.on(event, once, context);
		},

		off: function(event, callback, context) {
			// removes all callbacks for all events
			if (!event && !callback && !context) {
				this._events = undefined;
				return this;
			}

			var names = (event) ? [event] : _.keys(this._events);
			var name;
			for (var i = 0, len = names.lenght; i < len; i++) {
				name = names[i];
				var events = this._events[name];
				if (!events) continue;

				// remove all callbacks for this event
				if (!callback && !context) {
					delete this._events[name];
					continue;
				}

				// find any remaining events
				var remaining = [];
				for (var j = 0, k = events.length; j < k; j++) {
					var e = events[j];
					if (callback && callback !== e.callback && callback !== e.callback._callback || context && context !== e.context) {
						remaining.push(e);
					}
				}

				// replace events if there are any remaining
				if (remaining.length) {
					this._events[name] = remaining;
				}
				else {
					delete this._events[name];
				}
			}

			return this;
		},

		trigger: function(event) {
			if (!this._events) return this;

			var args = arguments || [];
			var isArray = Object.prototype.toString.call(args) === '[object Array]';

			if (!isArray) {
				var values = [];
				var k = keys(args);
				for (var i = 0, len = k.length; i < len; i++) {
					values.push(args[k[i]]);
				}
				args = values;
			}
			args = args.slice(1);

			var events = this._events[event];
			var allEvents = this._events.all;
			if (events) triggerEvents(events, args);
			if (allEvents) triggerEvents(allEvents, arguments);

			return this;
		}
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

 	var getStyle = function(el, prop) {
		var value, defaultView = el.ownerDocument.defaultView;
		// W3C standard method
		if (defaultView && defaultView.getComputedStyle) {
			// sanitize property name to css notation (hyphen separate words)
			prop = prop.replace(/([A-Z])/g, "-$1").toLowerCase();

			return defaultView.getComputedStyle(el, null).getPropertyValue(prop);
		}
		// IE method
		else if (el.currentStyle) {
			// sanitize property name to camelCase
			prop = prop.replace(/\-(\w)/g, function(str, letter) {
				return letter.toUpperCase();
			});
			value = el.currentStyle[prop];

			// convert other units to pixels in IE
			if (/^\d+(em|pt|%|ex)?$/i.test(value)) {
				return (function(value) {
					var oldLeft = el.style.left;
					var oldRsLeft = el.runtimeStyle.left;

					el.runtimeStyle.left = el.currentStyle.left;
					el.style.left = value || 0;
					value = el.style.pixelLeft + 'px';

					el.style.left = oldLeft;
					el.runtimeStyle.left = oldRsLeft;

					return value;
				})(value);
			}
		}
		return value;
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
			if (value === null) {
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
		if (undefined !== cls && cls !== '') {
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
		if (undefined !== cls && cls !== '') {
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
		if (undefined === cls || cls === '') {
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
		if (undefined === el.ext) {
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
		els.forEach(function(el) {
			Dom.extend(el);
		});

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

	AerisMaps.url = '//{{server}}/{{client_id}}_{{client_secret}}/{{layers}}/{{size}}/{{region}}/{{time}}.{{format}}';

	/**
	 * Core Map Animation object
	 */
	var Animation = function(target, options) {
		var self = this;
		var config = extend({
			server: 'maps.aerisapi.com',
			loc: null,
			keys: {
				id: null,
				secret: null
			},
			refresh: 0,
			autoplay: false,
			autosize: true,
			events: {
				click: function() {
					if (self.isPaused() || !self.isAnimating()) {
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
			config.animation.from = now + this._fromOffset;
		}

		if (isDate(config.animation.to)) {
			this._toOffset = null;
			config.animation.to = config.animation.to.getTime();
		} else {
			this._toOffset = config.animation.to * 1000;
			config.animation.to = now + this._toOffset;
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

		this._times = [];
		this._images = {};
		this._currentImage = null;
		this._currentIntervalTime = 0;

		if (!config.keys.id || config.keys.id.length == 0 || !config.keys.secret || config.keys.secret.length == 0) {
			throw new InvalidArgumentException('Invalid configuration values for "keys.id" and/or "keys.secret"');
		} else if (!config.loc || config.loc.length == 0) {
			throw new InvalidArgumentException('Invalid configuration value for "loc"');
		} else {
			this.init();
		}

		return this;
	};
	extend(Animation.prototype, Events);

	Animation.prototype.init = function() {
		if (this.target) {
			var self = this;

			this.target.ext.css({
				position: 'relative'
			});

			if (this.config.autosize === true) {
				this.target.ext.css({
					width: this.config.map.size.width + 'px',
					height: this.config.map.size.height  + 'px'
				});
			}
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
				if (typeof ts == 'object' && undefined !== ts.continuous) {
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

			this._times = this._timesForIntervals();

			if (this.config.autoplay) {
				this.play();
			} else {
				// determine the time interval to display initially before animation begins
				var now = new Date().getTime();
				var time = now;

				if (this._from >= now) {
					time = this._from;
				} else if (this._to <= now) {
					time = this._to;
				}
				this.goToTime(time);
			}
		}
	};

	Animation.prototype.play = function() {
		if (this.isAnimating()) {
			return;
		}

		if (!this._hasImages() || this._totalImages() < this._intervals) {
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
		this.pause(false);
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
	};

	Animation.prototype.pause = function(fireEvents) {
		if (fireEvents !== false) {
			fireEvents = true;
		}

		this._paused = true;
		if (this._timer) {
			window.clearInterval(this._timer);
		}
		this._timer = null;

		if (fireEvents) {
			this.trigger('pause');
		}
	};

	Animation.prototype.goToTime = function(time) {
		this._time = isDate(time) ? time.getTime() : time;
		this._offset = time - this._from;

		var closest = this._intervalClosestToTime(time);

		var image = this._imageClosestToTime(closest);
		if (image) {
			this._currentIntervalTime = closest;
			if (image != this._currentImage) {
				image.ext.show();
				if (this._currentImage && this._currentImage.ext) {
					this._currentImage.ext.hide();
				}
				this._currentImage = image;
			}
		} else if (!this.isAnimating()) {
			if (closest != this._currentIntervalTime) {
				this._loadInterval(closest, true);
				this._currentIntervalTime = closest;
			}
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
		this._from = isDate(start) ? start.getTime() : start;
		this._updateTiming();
		this._images = {};
		this._times = this._timesForIntervals();

		this.trigger('start:change', this._from);
	};

	Animation.prototype.setStartOffset = function(offset) {
		this._fromOffset = offset;

		var now = new Date().getTime();
		this.setStartDate(now + offset);
	};

	Animation.prototype.endDate = function() {
		return new Date(this._to);
	};

	Animation.prototype.setEndDate = function(end) {
		this.stop();
		this._to = isDate(end) ? end.getTime() : end;
		this._updateTiming();
		this._images = {};
		this._times = this._timesForIntervals();

		this.trigger('end:change', this._to);

		var now = new Date().getTime();
		if (this._to > now) {
			this.goToTime(now);
		}
	};

	Animation.prototype.setEndOffset = function(offset) {
		this._toOffset = offset;

		var now = new Date().getTime();
		this.setEndDate(now + offset);
	};

	//
	// Private Methods
	//

	Animation.prototype._updateTiming = function() {
		this._increment = ((this._to - this._from) / this.duration) * this._delay;
	};

	Animation.prototype._intervalClosestToTime = function(time) {
		var closest = this._from;
		var diff = Math.abs(time - closest);

		if (undefined == this._times) {
			this._times = this._timesForIntervals();
		}

		for (var i in this._times) {
			var t = this._times[i];
			var tdiff = Math.abs(time - t);
			if (tdiff < diff) {
				diff = tdiff;
				closest = t;
			}
		}

		return Math.round(closest);
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
		if (o === null) return false;

		var hasProps = false;
		for (var key in o) {
			if (hasOwnProperty.call(o, key)) {
				return true;
			}
		}
		return hasProps;
	};

	Animation.prototype._totalImages = function() {
		var total = 0;
		for (var i in this._images) {
			total += 1;
		}
		return total;
	}

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

	Animation.prototype._timesForIntervals = function() {
		// if from and to were offsets and not dates, then we need to update the date time values before loading new data
		var now = new Date().getTime();
		if (null !== this._fromOffset) {
			this._from = now + this._fromOffset;
			this._time = this._from;
		}
		if (null !== this._toOffset) {
			this._to = now + this._toOffset;
		}

		// calculate time intervals needed
		var totalIntervals = this._intervals;
		var interval = Math.round((this._to - this._from) / totalIntervals);
		var times = [];
		var lastTime = null;
		for (var i = 0; i < totalIntervals - 1; i++) {
			var t = this._from + (interval * i);
			if (i == 0 || t != lastTime) {
				times.push(Math.round(t));
				lastTime = t;
			}
		}
		times.push(this._to);

		this._intervals = times.length;

		return times;
	};

	Animation.prototype._loadData = function() {
		var times = this._timesForIntervals();

		this._images = {};
		this._contentTarget.ext.empty();
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
		interval = Math.round(interval);

		// don't reload interval if it already exists in the DOM
		var el = Dom.select('#amp-' + interval);
		if (el && el.length > 0) {
			if (undefined != el[0]) el = el[0];
			el.ext.show();
			if (self._currentImage && self._currentImage.ext) {
				self._currentImage.ext.hide();
			}
			self._currentImage = el;

			if (callback) {
				callback();
			}
			return;
		}

		var opts = this.config;
		var date = new Date(interval);
		var gmtDate = new Date(date.getTime() + date.getTimezoneOffset() * 60 * 1000);

		var isBounds = opts.loc.match(/^([0-9\.-]+,){3}[0-9\.-]+$/) != null;
		var url = parseTemplate(AerisMaps.url, {
			server: opts.server,
			client_id: opts.keys.id,
			client_secret: opts.keys.secret,
			layers: opts.map.layers.join(','),
			zoom: opts.map.zoom,
			size: opts.map.size.width + 'x' + opts.map.size.height,
			loc: opts.loc,
			bounds: opts.bounds,
			region: (isBounds) ? opts.loc : opts.loc + ',' + opts.map.zoom,
			format: opts.map.format,
			time: formatDate(gmtDate, 'yyyyMMddhhmm00')
		});

		if (!this._images) {
			this._images = {};
		}

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
					if (undefined != el[0]) {
						el = el[0];
					}
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

	Animation.prototype._reset = function() {
		this._images = {};
		this._contentTarget.ext.empty();
	}

	window.AerisMaps.Animation = Animation;

	// inject animator CSS into the DOM, but only if it hasn't already been included
	var css = 'aerismaps-animation.css',
		links = Dom.select('link'),
		include = true,
		re = new RegExp(css);

	var link;
	for (var i = 0, len = links.length; i < len; i++) {
		link = links[i];
		if (re.test(link.href)) {
			include = false;
			break;
		}
	}

	if (include) {
		Dom.select('head').ext.append('<link href="//cdn.aerisapi.com/css/' + css + '" rel="stylesheet" type="text/css"/>');
	}

})(window, document);
