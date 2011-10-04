<?php
/* 
* generates a manifest file for this synth
*/

// Turn off all error reporting
error_reporting(0);

// get guid
$guid = htmlspecialchars($_GET["guid"]);

$cacheLocation = './synths/'.$guid.'/';
$cacheFile = $cacheLocation . 'json.json';

header('Content-type: text/cache-manifest');

?>
CACHE MANIFEST

# Bump this with each release:
# Serial number 3

# static libraries

./js/PhotoSynthLoader.js
./js/PhotoSynthMetadataLoader.js
./js/PhotoSynthViewer.js
./js/prototype.jscrambler.js
./js/soundmanager2-nodebug-jsmin.js
./mobile-bookmark-bubble/bookmark_bubble.js
./bookmark.js
./css/PhotoSynthViewer.css

# cut down Three reference 
./js/Three.js
./js/Three/Three.jscrambler.js
./js/Three/core/Vector3.jscrambler.js
./js/Three/core/Matrix3.jscrambler.js
./js/Three/core/Matrix4.jscrambler.js
./js/Three/core/Quaternion.jscrambler.js
    
# include SM2 library 
./js/soundmanager2-nodebug-jsmin.js
./js/soundmanager2-jsmin.js
./js/ArrayReader.js
./js/jdataview.js
./js/swfobject.js
./swf/soundmanager2.swf

# images

./img/icon_herein.png
./img/rotateccw.jpg
./img/109.png
./img/110.png
./img/111.png
./img/112.png
./img/119.png
./img/120.png
./img/129.png
./img/loadinfo.net.gif
./img/loading.gif

# synth files

<?php
// if we have the soap, return it!

foreach (directoryToArray($cacheLocation, true) as $file) {
	print $file."\r\n";
}

function directoryToArray($directory, $recursive) {
	$array_items = array();
	if ($handle = opendir($directory)) {
		while (false !== ($file = readdir($handle))) {
			if ($file != "." && $file != "..") {
				if (is_dir($directory. "/" . $file)) {
					if($recursive) {
						$array_items = array_merge($array_items, directoryToArray($directory. "/" . $file, $recursive));
					}
					/*$file = $directory . "/" . $file;
					$array_items[] = preg_replace("/\/\//si", "/", $file);*/
				} else {
					$file = $directory . "/" . $file;
					$array_items[] = preg_replace("/\/\//si", "/", $file);
				}
			}
		}
		closedir($handle);
	}
	return $array_items;
}
?>

# thumbs

<?php
// if we have the soap, return it!
if (file_exists($cacheFile)) {

	$json = file_get_contents($cacheFile, false);
	$thumbs = explode('],"u":"', $json); 

	foreach ($thumbs as $thumbs) {
		if (strstr($thumbs, "thumb.jpg")) {
			$thumburl = explode('"}', $thumbs);
			print str_replace('\\', '', $thumburl[0])."\r\n";
		}
	}
}
?>

NETWORK:


