
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

		if (format.indexOf("t") > -1 && hours >= 12) {
			if (hours > 12) hours = hours - 12;
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
	var filter = function(obj, predicate) {
		obj = obj || [];
		var results = [];
		obj.forEach(function(el) {
			if (predicate(el)) results.push(el);
		});
		return results;
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

	var jsonpId = 0;
	var ajax = function(options) {
		options.method = options.method || 'GET';

		var jsonpCallbackName = null;

		var request = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
		request.onreadystatechange = function() {
			var req = request;
			if (4 == req.readyState && 200 == req.status) {
				var type = req.getResponseHeader('Content-Type');
				var content;
				if (type.match(/xml/gi)) {
					content = req.responseXML;
				} else if (type.match(/json/gi)) {
					content = JSON.parse(req.responseText);
				} else {
					content = req.responseText;
				}

				if (jsonpCallbackName) {
					window[jsonpCallbackName](req.responseText);
				} else if (options.success) {
					options.success(content);
				}
			} else if (4 == req.readyState && 200 != req.status && options.error) {
				options.error(req.responseText, req.status);
			}
		};

		if (options.dataType) {
			if (options.dataType == 'jsonp') {
				jsonpCallbackName = '__aw__' + (++jsonpId);
			}
		}

		// build request
		var query = '';
		if (options.params) {
			if (options.params.substr) {
				query = options.params;
			} else {
				for (var key in options.params) {
					query += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(options.params[key]);
				}
				query = query.substr(1);
			}
		}

		// prevent caching
		// options.url += ((options.url.indexOf('?') !== -1) ? "&" : "?") + '_' + (new Date()).getTime();
		if (jsonpCallbackName) {
			var url = options.url + query;
			url = url + ((url.indexOf("?") !== -1) ? "&" : "?") + "callback=" + jsonpCallbackName;

			var script = document.createElement('script');
			script.src = url;
			document.getElementsByTagName('body')[0].appendChild(script);
			window[jsonpCallbackName] = function(data) {
				delete window[jsonpCallbackName];
				script.parentElement.removeChild(script);
				if (options.success) {
					options.success(data);
				}
			};
		} else if ('POST' == options.method) {
			request.open('POST', options.url, true);
			// set request headers if any were passed with options
			for (var header in options.headers) {
				request.setRequestHeader(header, options.headers[header]);
			}
			request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
			request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			request.send(options.params);
		} else {
			if (query) {
				query = ((options.url.match(/\?/)) ? '&' : '?') + query;
			}
			request.open('GET', options.url + query, true);
			// set request headers if any were passed with options
			for (var header in options.headers) {
				request.setRequestHeader(header, options.headers[header]);
			}
			request.send(null);
		}

		return request;
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
	Dom.prototype.html = function(html) {
		if (undefined != html) {
			this.el.innerHTML = html;
		} else {
			return this.el.innerHTML;
		}
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
			// MS IE and Edge STILL don't support the :scope psuedo selector >:|
			var isMS = (document.documentMode || /Edge/.test(navigator.userAgent));
			var scope = selector.match(/^\:scope/);
			if ((!scope || scope.length == 0) && !isMS) {
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
	 * Core Map Visualizer object
	 */
	var Visualizer = function(target, options) {
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
				format: 'png',
				size: {
					width: 600,
					height: 600
				},
				layers: [
					'flat',
					'radar',
					'admin'
				],
				combined: false
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
				},
				branding: {
					html: null,
					img: null
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

		this._isLoadingMetadata = false;
		this._isLoading = false;
		this._metadataCallbacks = [];

		if (!config.keys.id || config.keys.id.length == 0 || !config.keys.secret || config.keys.secret.length == 0) {
			throw new InvalidArgumentException('Invalid configuration values for "keys.id" and/or "keys.secret"');
		} else if (!config.loc || config.loc.length == 0) {
			throw new InvalidArgumentException('Invalid configuration value for "loc"');
		} else {
			this.init();
		}

		return this;
	};
	extend(Visualizer.prototype, Events);

	Visualizer.prototype.init = function() {
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

			var containers = ['base', 'content', 'overlay'];
			containers.forEach(function(key, i) {
				self.target.ext.append('<div class="amp-map-' + key + '"></div>');
				var target = self.target.ext.select('.amp-map-' + key);
				target.ext.css({
					position: 'absolute',
					top: 0,
					left: 0,
					bottom: 0,
					right: 0,
					"z-index": i
				});
				self['_' + key + 'Target'] = target;
			});

			if (this.config.events) {
				for (var event in this.config.events) {
					this.target.addEventListener(event, function() {
						self.config.events[event]();
					});
				}
			}

			// map tilestamp
			if (this.config.overlays.timestamp) {
				this.target.ext.append('<div class="amp-map-timestamp"></div>');
				this._timestamp = this.target.ext.select('.amp-map-timestamp');
				this._timestamp.ext.css({
					"z-index": 10
				});

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

			// map title
			if (this.config.overlays.title) {
				this.target.ext.append('<div class="amp-map-title">' + this.config.overlays.title + '</div>');
				this.target.ext.select('.amp-map-title').ext.css({
					"z-index": 11
				});
			}

			// map branding
			if (this.config.overlays.branding) {
				this.target.ext.append('<div class="amp-map-branding"></div>');

				var branding = this.config.overlays.branding;
				var el = this.target.ext.select('.amp-map-branding');
				el.ext.css({
					"z-index": 12
				});

				if (undefined != branding.img) {
					el.ext.html('<img src="' + branding.img + '" />');
				} else if (undefined != branding.html) {
					el.ext.html(branding.html);
				}
			}

			this._fetchLayerMetadata(function() {
				self.startup();
			});
		}
	};

	Visualizer.prototype.startup = function() {
		if (!this.config.map.combined) {
			this._loadBase(this.config.map.layers);
			this._loadOverlays(this.config.map.layers);
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
	};

	Visualizer.prototype.play = function() {
		if (this.isAnimating() || this._isLoading) {
			return;
		}

		if (!this._hasImages() || this._totalImages() < this._intervals) {
			if (this._isLoadingMetadata) {
				var self = this;
				this._metadataCallbacks.push(function() {
					self._loadData();
				});
			} else {
				this._loadData();
			}
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

	Visualizer.prototype.stop = function() {
		this.pause(false);
		this.trigger('stop');
		this._paused = false;

		if (this._to != null) {
			this.goToTime(this._to);
		}
	};

	Visualizer.prototype.restart = function() {
		this.pause();
		(function(self) {
			if (self._restartTimeout) clearTimeout(self._restartTimeout);
			self._restartTimeout = setTimeout(function() {
				self.goToTime(self._from);
				self.play();
			}, self._endDelay * 1000);
		})(this);
	};

	Visualizer.prototype.pause = function(fireEvents) {
		if (fireEvents !== false) {
			fireEvents = true;
		}

		this._paused = true;
		if (this._timer) {
			window.clearInterval(this._timer);
		}
		this._timer = null;
		if (this._restartTimeout) {
			window.clearTimeout(this._restartTimeout);
		}

		if (fireEvents) {
			this.trigger('pause');
		}
	};

	Visualizer.prototype.goToTime = function(time) {
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

	Visualizer.prototype.isAnimating = function() {
		return (this._timer != null);
	};

	Visualizer.prototype.isPaused = function() {
		return this._paused;
	};

	Visualizer.prototype.totalTime = function() {
		return this._to - this._from;
	};

	Visualizer.prototype.currentTime = function() {
		return this._time;
	};

	Visualizer.prototype.position = function() {
		this._offset / this.totalTime();
	};

	Visualizer.prototype.startDate = function() {
		return new Date(this._from);
	};

	Visualizer.prototype.setStartDate = function(start) {
		this.stop();
		this._from = isDate(start) ? start.getTime() : start;
		this._updateTiming();
		this._images = {};
		this._times = this._timesForIntervals();

		this.trigger('start:change', this._from);
	};

	Visualizer.prototype.setStartOffset = function(offset) {
		this._fromOffset = offset;

		var now = new Date().getTime();
		this.setStartDate(now + offset);
	};

	Visualizer.prototype.endDate = function() {
		return new Date(this._to);
	};

	Visualizer.prototype.setEndDate = function(end) {
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

	Visualizer.prototype.setEndOffset = function(offset) {
		this._toOffset = offset;

		var now = new Date().getTime();
		this.setEndDate(now + offset);
	};

	//
	// Private Methods
	//

	Visualizer.prototype._updateTiming = function() {
		this._increment = ((this._to - this._from) / this.duration) * this._delay;
	};

	Visualizer.prototype._intervalClosestToTime = function(time) {
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

	Visualizer.prototype._imageClosestToTime = function(time) {
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

	Visualizer.prototype._hasImages = function() {
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

	Visualizer.prototype._totalImages = function() {
		var total = 0;
		for (var i in this._images) {
			total += 1;
		}
		return total;
	}

	Visualizer.prototype._updateTimestampOverlay = function(time) {
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

	Visualizer.prototype._timesForIntervals = function() {
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

	var _loadTimeout = null;
	var _startTimeout = null;
	Visualizer.prototype._loadData = function() {
		if (this._isLoading) return;

		this._isLoading = true;
		this._images = {};
		this._contentTarget.ext.empty();
		var times = this._timesForIntervals();
		this.trigger('load:start', { times: times });

		var self = this;
		var loadingInterval = 0;
		var loadNextInterval = function() {
			self._loadInterval(times[loadingInterval], true, function() {
				loadingInterval++;
				if (loadingInterval >= times.length) {
					self._isLoading = false;
					self.trigger('load:done');
					self.play();

					// start refresh timer if needed
					if (self.config.refresh > 0) {
						if (_loadTimeout) clearTimeout(_loadTimeout);
						_loadTimeout = setTimeout(function() {
							self.stop();
							self._loadData();
						}, self.config.refresh * 1000);
					}

				} else {
					loadNextInterval();
				}
			});
		};

		if (_startTimeout) clearTimeout(_startTimeout);
		_startTimeout = setTimeout(function() {
			loadNextInterval();
		}, 100);
	};

	var _loaders = {};
	Visualizer.prototype._loadInterval = function(interval, cache, callback) {
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
		var timestamp = formatDate(gmtDate, 'yyyyMMddhhmm00');
		// var isBounds = opts.loc.match(/^([0-9\.-]+,){3}[0-9\.-]+$/) != null;

		// filter out base and overlay layers
		var baseLayers = this.layerGroups.base || [];
		var overlayLayers = this.layerGroups.overlay || [];
		var exclude = baseLayers.concat(overlayLayers);

		var layers = opts.map.layers;
		if (!opts.map.combined) {
			layers = filter(opts.map.layers, function(el) {
				for (var i = 0, len = exclude.length; i < len; i += 1) {
					if (el.match(new RegExp('^' + exclude[i])) != null) {
						return false;
					}
				}
				return true;
			});
		}

		var url = this._urlForLayers(layers, timestamp);

		if (!this._images) {
			this._images = {};
		}

		// skip the request if we already have a cached image for this interval
		if (this._images[interval]) {
			if (callback) {
				callback();
			}
			return;
		}

		var image = new Image();
		image.src = url;
		_loaders[interval] = image;
		(function(self) {
			image.onload = function() {
				if (!self._images) {
					self._images = {};
				}

				// remove any existing element that matches
				var el = Dom.select('#amp-' + interval);
				if (el && el.length === 1) {
					el.ext.remove();
				}

				var img = '<img id="amp-' + interval + '" src="' + image.src + '" width="' + self.config.map.size.width + '" height="' + self.config.map.size.height + '" style="position:absolute;">';
				self._contentTarget.ext.append(img);

				el = Dom.select('#amp-' + interval);
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

				_loaders[interval] = null;
			};
		})(this);
	};

	Visualizer.prototype._loadBase = function(layers) {
		var group = this.layerGroups.base;
		if (!group) { return; }

		var layers = filter(layers, function(el) {
			for (var i = 0, len = group.length; i < len; i += 1) {
				if (el.match(new RegExp('^' + group[i])) != null) {
					return true;
				}
			}
			return false;
		});

		if (layers.length > 0) {
			var url = this._urlForLayers(layers);
			this._baseTarget.ext.html('<img src="' + url + '" width="' + this.config.map.size.width + '" height="' + this.config.map.size.height + '" style="position:absolute;">');
		}
	};

	Visualizer.prototype._loadOverlays = function(layers) {
		var group = this.layerGroups.overlay;
		if (!group) { return; }

		var layers = filter(layers, function(el) {
			for (var i = 0, len = group.length; i < len; i += 1) {
				if (el.match(new RegExp('^' + group[i])) != null) {
					return true;
				}
			}
			return false;
		});

		if (layers.length > 0) {
			var url = this._urlForLayers(layers);
			this._overlayTarget.ext.html('<img src="' + url + '" width="' + this.config.map.size.width + '" height="' + this.config.map.size.height + '" style="position:absolute;">');
		}
	};

	Visualizer.prototype._fetchLayerMetadata = function(callback) {
		this._isLoadingMetadata = true;

		var self = this;
		ajax({
			url: '//cdn.aerisjs.com/layers.json',
			dataType: 'json',
			success: function(data) {
				var groups = [];
				data.forEach(function(el) {
					var cat = el.category;

					// catch to handle new category names in layers.json source that aren't what we expect
					if (cat.match(/^base/)) {
						cat = 'base';
					} else if (cat.match(/overlay/)) {
						cat = 'overlay';
					}

					if (undefined == groups[cat]) {
						groups[cat] = [];
					}
					groups[cat].push(el.id);
				});

				self.layerGroups = groups;
				self._isLoadingMetadata = false;

				if (self._metadataCallbacks && self._metadataCallbacks.length > 0) {
					self._metadataCallbacks.forEach(function(callback) {
						callback();
					});
				}
				self._metadataCallbacks = null;
				if (callback) {
					callback();
				}
			},
			error: function(error) {
				console.log('failed!');
			}
		});
	};

	Visualizer.prototype._urlForLayers = function(layers, time) {
		var opts = this.config;
		var isBounds = opts.loc.match(/^([0-9\.-]+,){3}[0-9\.-]+$/) != null;

		var url = parseTemplate(AerisMaps.url, {
			server: opts.server,
			client_id: opts.keys.id,
			client_secret: opts.keys.secret,
			layers: layers.join(','),
			zoom: opts.map.zoom,
			size: opts.map.size.width + 'x' + opts.map.size.height,
			loc: opts.loc,
			bounds: opts.bounds,
			region: (isBounds) ? opts.loc : opts.loc + ',' + opts.map.zoom,
			format: opts.map.format,
			time: time || 0
		});

		return url;
	}

	Visualizer.prototype._reset = function() {
		this._images = {};
		this._contentTarget.ext.empty();
	}

	window.AerisMaps.Visualizer = Visualizer;
	// keep Animation reference for backwards compatibility
	window.AerisMaps.Animation = Visualizer;

	// inject visualizer CSS into the DOM, but only if it hasn't already been included
	var css = 'aerismaps-visualizer.css',
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
