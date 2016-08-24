# AerisMaps.Animation

A minimal Javascript class for creating and displaying animations with [Aeris Maps (AMP)](http://www.aerisweather.com/develop/maps/) imagery, our powerful and flexible weather mapping platform giving you exactly the weather maps you need.

## Getting Started

You'll need an active [Aeris Maps (AMP) subscription](http://www.aerisweather.com/support/docs/aeris-maps/getting-started/) before using this animator class, which you can [sign up for free](http://www.aerisweather.com/signup/) with our Developer level account.

Once you're signed up and have your [first project/application registered](http://www.aerisweather.com/support/docs/aeris-maps/getting-started/access-authentication/) with the Aeris Maps API, you'll need that project's access ID and secret keys to configure your `AerisMaps.Animation` instance with. Simply pass these keys in your instance's configuration object at instantiation along with your desired location to use for the map center:

	var animator = new AerisMaps.Animation('#map', {
		loc: 'seattle,wa',
		keys: {
			id: '{{your_id}}',
			secret: '{{your_secret}}'
		}
	});
	
## Example

Use the included `example.php` page to test out various options quickly by changing the supported parameters:

Parameter | Description
--------- | -----------
loc | The location to center the map on ("seattle,wa", "78705", "44.96,-93.27") or a bounding box to define a region ("30.1010,-85.9578,33.0948,-82.4421").
z | Map zoom level (will be ignored if using a bounding box for "loc")
i | Total number of intervals/frames to display during the animation
layers | A comma-separated list of map layers to display on the map
d | Total duration of the animation in seconds
from | Starting time offset relative to now for the animation (in hours)
to | Ending time offset relative to now for the animation (in hours)

For example, the following URL would display a radar animation for Seattle, WA for the past 6 hours:

`example.php?loc=seattle,wa&z=7&layers=flat,radar,counties,admin&i=10&from=-6`
	
## Configuring

Your Animation instance is automatically configured with defaults for many different options to control how your animation appears. Below is the full list of options you can override in the configuration object you pass when instantiating your `AerisMaps.Animation(config)` instance along with their default values.

Option | Default | Description
------ | ------- | -----------
**loc** | undefined | [string] The location to center the map on
**keys.id** | undefined | [string] Your project's ID provided when [registering with the API](http://www.aerisweather.com/support/docs/aeris-maps/getting-started/access-authentication/)
**keys.secret** | undefined | [string] Your project's secret key provided when [registering with the API](http://www.aerisweather.com/support/docs/aeris-maps/getting-started/access-authentication/)
**refresh** | 0 | [integer] Interval (in seconds) when the animation data is reloaded; a value of `0` will disable reloading
**autoplay** | false | [boolean] Whether or not the animation should start playing immediately when instantiated; if `false`, then you must call `play()` on your animation to being playback
**events.click** | Function | [function] A callback function called when the animation container DOM element is clicked
**map.zoom** | 6 | [integer] Map zoom level
**map.format** | jpg | [string] [Image format](http://www.aerisweather.com/support/docs/aeris-maps/getting-started/image-quality/) for the map
**map.size.width** | 600 | [integer] Map width in pixels (limited by your Aeris Maps level)
**map.size.height** | 600 | [integer] Map height in pixels (limited by your Aeris Maps level)
**map.layers** | ['flat','radar','admin'] | [array] An array of [map layers](http://www.aerisweather.com/support/docs/aeris-maps/reference/map-layers/) and [options](http://www.aerisweather.com/support/docs/aeris-maps/layer-modifiers/) to display on the map
**animation.from** | -6 * 3600 | [integer] or [date] Start time offset relative to now for the animation in seconds, or a valid `Date` instance; negative values are in the past
**animation.to** | 0 | [integer] or [date] End time offset relative to now for the animation in seconds, or a valid `Date` instance; negative values are in the past
**animation.duration** | 2 | [integer] Total duration of the animation in seconds; `duration` and `intervals` are both used to control the overall speed of the animation
**animation.endDelay** | 1 | [integer] Delay to hold the end of the animation before replaying from the beginning, in seconds
**animation.intervals** | 10 | [integer] Total number of frames to use for the animation; `duration` and `intervals` are both used to control the overall speed of the animation
**overlays.title** | null | [string] The title to display over the map; use CSS to style the title DOM elements as needed
**overlays.timestamp** | | Map timestamp options
**overlays.timestamp.format** | MM/dd/yyyy hh:mm tt | [string] Time and date format for the map timeline during playback (limited formatting options currently supported)
**overlays.timestamp.continuous** | true | [boolean] Whether or not the timestamp should update continuously during playback regardless of frame intervals; if `false`, then the timestamp will only update when the animation's frame changes

The following is an example configuration object with default values:

	{
		loc: undefined,
		keys: {
			id: undefined,
			secret: undefined
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
	}
	
## Public Properties

The following public properties are available on your `Animation` instance:

Property | Description
-------- | -----------
**target** | The DOM element containing the animation's content
**config** | The config object that the animation was instantiated with
**duration** | The animation's duration in seconds

## Public Methods

The following public methods are available on your `Animation` instance for controlling its playback once configured:

Method | Description
------ | -----------
**play()** | Starts the animation; loads the required imagery before playing if needed
**stop()** | Stops the animation and advances the playhead to the end of the timeline
**pause()** | Stops playing the animation at the current position; calling `play()` after pausing will resume playback at the paused position
**restart()** | Restarts playback of the animation from the beginning
**goToTime(time)** | Moves the timeline's position to the specified time interval (integer)
**isAnimating()** | Returns a Boolean indicating whether the animation is currently playing
**isPaused()** | Returns a Boolean indicating whether the animation is currently paused
**totalTime()** | Returns the total time range, in seconds, that the animation timeline covers (different between ending and starting time intervals)
**currentTime()** | Returns the current time interval for the animation's timeline
**position()** | Returns the current position of the animation, from 0 (beginning) to 1 (end)
**startDate()** | Returns a `Date` object for the animation timeline's `from` interval
**setStartDate(start)** | Updates the animation timeline's starting interval; can either be a `Date` instance or epoch time interval
**endDate()** | Returns a `Date` object for the animation timeline's `to` interval
**setEndDate(end)** | Updates the animation timeline's ending interval; can either be a `Date` instance or epoch time interval


## Events

You can listen for certain events from your `Animation` instance to perform custom actions. Many events also pass an object as a single argument to their registered callback with additional information about the event. The following events are currently supported:

Event | Description
----- | -----------
**play** | Triggered when the animation begins playback
**stop** | Triggered when the animation stops playback
**pause** | Triggered when the animation pauses playback
**advance** | Triggered each time the animation's timeline is advanced regardless of animation frames
**advance:image** | Triggered each time the animation's frame is updated (as determined by the `animation.intervals` value)
**load:start** | Triggered when animation data begins loading
**load:done** | Triggered when all required animation data has loaded
**load:image** | Triggered each time a single frame of the animation has loaded
**load:progress** | Triggered when the loading progress of the animation has changed

For instance, to perform an action while loading animation data to update a custom progress indicator in your interface, you would add an observer for the `load:progress` event:

	animation.on('load:progress', function(data) {
		console.log('load progress: ' + data.loaded/data.total);
	}
	
To remove an event listener from your `Animation` instance, simply use `off` instead:

	animation.off('load:progress');
		
## Support
Review our [complete documentation](http://www.aerisweather.com/support/docs/aeris-maps/) for more details about Aeris Maps and its usage, and feel free to [contact us](http://www.aerisweather.com/support/) with any questions or issues.