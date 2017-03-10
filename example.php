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
	<title>AMP Visualizer Example</title>
	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <meta name="description" content="Demo project">
	<meta name="viewport" content="width=device-width, initial-scale=1">

	<link href="./aerismaps-visualizer.css" rel="stylesheet" type="text/css">
	<style type="text/css">
	body {
		font-family: "Helvetica","Arial",sans-serif;
	}
	</style>

</head>
<body>

<div id="map"></div>

<script type="text/javascript" src="./aerismaps-visualizer.js"></script>
<script type="text/javascript">

var now = new Date();
var map = new AerisMaps.Visualizer('#map', {
	loc: '<?php echo $loc; ?>',
	keys: {
		id: '',
		secret: ''
	},
	autoplay: true,
	map: {
		zoom: <?php echo $zoom; ?>,
		layers: <?php echo json_encode($layers); ?>
	},
	animation: {
		from: <?php echo $from; ?> * 3600,
		to: <?php echo $to; ?> * 3600,
		intervals: <?php echo $intervals; ?>,
		duration: <?php echo $duration; ?>
	},
	overlays: {
		title: 'Test Visualizer'
	}
});

map.on('play', function(data) {
	// console.log(data);
});
map.on('advance', function(data) {
	// console.log(data.time);
});
map.on('load:progress', function(data) {
	console.log('load progress: ' + data.loaded/data.total);
});

</script>

</body>
</html>