<?php

$loc = (!empty($_GET['loc'])) ? $_GET['loc'] : 'seattle,wa';
$zoom = (!empty($_GET['z'])) ? (integer)$_GET['z'] : 6;
$intervals = (!empty($_GET['i'])) ? (integer)$_GET['i'] : 10;
$layers = (!empty($_GET['layers'])) ? $_GET['layers'] : 'flat,radar,admin';
$duration = (!empty($_GET['d'])) ? (double)$_GET['d'] : 4;


$from = (isset($_GET['from'])) ? (integer)$_GET['from'] : -2;
$to = (isset($_GET['to'])) ? (integer)$_GET['to'] : 0;

if ($zoom < 1) {
	$zoom = 1;
}
if ($intervals < 5) {
	$intervals = 5;
} else if ($intervals > 50) {
	$intervals = 50;
}

$layers = explode(',', $layers);

?>
<!DOCTYPE html>
<html>
<head>
	<title>AMP Animator Example</title>
	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <meta name="description" content="Demo project">
	<meta name="viewport" content="width=device-width, initial-scale=1">

	<style type="text/css">

	body {
		font-family: "Helvetica","Arial",sans-serif;
	}

	.amp-map {
		background: #efefef;
	}

	/* customize the timestamp element that's added to the map when `overlays.timestamp` is set */
	.amp-map .timestamp {
		position: absolute;
		bottom: 5px;
		left: 7px;
		font-size: 14px;
		color: #222;
	}

	/* customize the title element that's added to the map when `overlays.title` is set */
	.amp-map .title {
		position: absolute;
		top: 10px;
		left: 10px;
		width: 300px;
		height: 40px;
		font-size: 22px;
		background: rgba(255,255,255,0.8);
		color: #222;
		line-height: 44px;
		padding: 0 15px;
		border-bottom: 3px solid #0097e2;
	}

	</style>

</head>
<body>

<div id="map"></div>

<script type="text/javascript" src="./aerismaps-animation.js"></script>
<script type="text/javascript">

var now = new Date();
var animator = new AerisMaps.Animation('#map', {
	loc: '<?php echo $loc; ?>',
	keys: {
		id: '',
		secret: ''
	},
	map: {
		zoom: <?php echo $zoom; ?>,
		layers: <?php echo json_encode($layers); ?>
	},
	animation: {
		from: new Date(now.getTime() + <?php echo $from; ?> * 3600 * 1000),
		to: new Date(now.getTime() + <?php echo $to; ?> * 3600 * 1000),
		intervals: <?php echo $intervals; ?>,
		duration: <?php echo $duration; ?>
	},
	overlays: {
		title: 'Test Animation'
	}
});

animator.on('play', function(data) {
	// console.log(data);
});
animator.on('advance', function(data) {
	// console.log(data.time);
});
animator.on('load:progress', function(data) {
	console.log('load progress: ' + data.loaded/data.total);
});

animator.play();

</script>

</body>
</html>