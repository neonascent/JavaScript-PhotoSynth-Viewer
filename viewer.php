<?php
error_reporting(0);
// get guid
$guid = htmlspecialchars($_GET["guid"]);

$cacheLocation = './synths/'.$guid.'/';
$cacheSOAPFile = $cacheLocation . 'soap.xml';

// if no soap, get it!
if (!file_exists($cacheSOAPFile)) {

	//$REQUEST_BODY = '';
	$REQUEST_BODY  = "<?xml version=\"1.0\" encoding=\"utf-8\"?>"; 
	$REQUEST_BODY .= "<soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">";
	$REQUEST_BODY .= "  <soap:Body>";
	$REQUEST_BODY .= "    <GetCollectionData xmlns=\"http://labs.live.com/\">";
	$REQUEST_BODY .= "      <collectionId>" . $guid . "</collectionId>";
	$REQUEST_BODY .= "      <incrementEmbedCount>false</incrementEmbedCount>";
	$REQUEST_BODY .= "    </GetCollectionData>";
	$REQUEST_BODY .= "  </soap:Body>";
	$REQUEST_BODY .= "</soap:Envelope>";


	// from Henri Astre's PhotoSynth viewer
	/*
			 
	var xhr = new XMLHttpRequest();
	xhr.open("POST", "http://photosynth.net/photosynthws/PhotosynthService.asmx", true);
	xhr.setRequestHeader("Content-Type", "text/xml; charset=utf-8");
	*/

	$soap_do = curl_init();
	curl_setopt($soap_do, CURLOPT_URL,            "http://photosynth.net/photosynthws/PhotosynthService.asmx" );
	curl_setopt($soap_do, CURLOPT_CONNECTTIMEOUT, 10);
	curl_setopt($soap_do, CURLOPT_TIMEOUT,        60);
	curl_setopt($soap_do, CURLOPT_RETURNTRANSFER, true );
	curl_setopt($soap_do, CURLOPT_SSL_VERIFYPEER, false);
	curl_setopt($soap_do, CURLOPT_SSL_VERIFYHOST, false);
	curl_setopt($soap_do, CURLOPT_POST,           true );
	curl_setopt($soap_do, CURLOPT_POSTFIELDS,    $REQUEST_BODY);
	curl_setopt($soap_do, CURLOPT_HTTPHEADER,     array('Content-Type: text/xml; charset=utf-8', 'SOAPAction: http://labs.live.com/GetCollectionData', 'Content-Length: '.strlen($REQUEST_BODY) ));

	$result = curl_exec($soap_do);
	if($result === false)
	{
		$err = 'Curl error: ' . curl_error($soap_do);
		curl_close($soap_do);
		//return $err;
		print_r($err);
	}
	else
	{
		curl_close($soap_do);
		//return 'Operation completed without any errors';
		// We'll be outputting a XML
		
		// write file to cache
		mkdir($cacheLocation,0777,TRUE);
		$fh = fopen($cacheSOAPFile, 'w') or die();
		fwrite($fh, $result);
		fclose($fh);	
	}
	
	// now get json!
	$parts = explode('<JsonUrl>', $result);
	$jsonUrl = explode('</JsonUrl>', $parts[1]);
	$url = $jsonUrl[0];
	
	$cacheJsonFile = $cacheLocation . 'json.json';
	error_reporting(E_ALL);

	// Get JSON
	if (!file_exists($cacheJsonFile)) {

		$soap_do = curl_init();
		curl_setopt($soap_do, CURLOPT_URL,            $url );
		curl_setopt($soap_do, CURLOPT_CONNECTTIMEOUT, 10);
		curl_setopt($soap_do, CURLOPT_TIMEOUT,        60);
		curl_setopt($soap_do, CURLOPT_RETURNTRANSFER, true );


		$result = curl_exec($soap_do);
		if($result === false)
		{
			$err = 'Curl error: ' . curl_error($soap_do);
			curl_close($soap_do);
			//return $err;
			print_r($err);
		}
		else
		{
			
			curl_close($soap_do);		
			// write file to cache
			$fh = fopen($cacheJsonFile, 'w') or die();
			fwrite($fh, $result);
			fclose($fh);
		}
	}
	
} // end if not cached soap
?>
<!--
	Copyright (c) 2011 ASTRE Henri (http://www.visual-experiments.com)

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.
-->
<!DOCTYPE html>
<html manifest="cache.manifest.php?guid=<?php echo htmlspecialchars($_GET["guid"]); ?>">
	<head>
	<title>MystRecon</title>
	<!-- set up size for iPhone and iPad -->
    <meta name="viewport" content="user-scalable=no, maximum-scale=1.5, width=512" /> <!-- making assumption of landscape -->
	<meta name="apple-mobile-web-app-capable" content="yes" /> <!-- allows fullscreen as Home Screen link on iphone -->
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <!-- 	<meta name="viewport" content="width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=0;" />
	<meta name="apple-mobile-web-app-capable" content="yes" /> -->
    
    <link rel="apple-touch-icon-precomposed" href="./img/icon_herein.png" />
    <script type="text/javascript" src="./mobile-bookmark-bubble/bookmark_bubble.js"></script>
    <script type="text/javascript" src="bookmark.js"></script>
  </head>
	
	
	<script src="js/prototype.jscrambler.js"></script>

	<!-- cut down Three reference -->
    <script src="js/Three/Three.jscrambler.js"></script>
    <script src="js/Three/core/Vector3.jscrambler.js"></script>
    <script src="js/Three/core/Matrix3.jscrambler.js"></script>
    <script src="js/Three/core/Matrix4.jscrambler.js"></script>
    <script src="js/Three/core/Quaternion.jscrambler.js"></script>
    

	<script src="js/PhotoSynthViewer.js"></script>
	<script src="js/PhotoSynthLoader.js"></script>
	<script src="js/PhotoSynthMetadataLoader.js"></script>
	<!-- include SM2 library -->
	<script src="js/soundmanager2-nodebug-jsmin.js"></script>
	<link rel="stylesheet" type="text/css" href="css/PhotoSynthViewer.css"> 
	<script>	
	
	var _viewer;
	
	// setup sound
	soundManager.url = './swf/'; // directory where SM2 .SWFs live
	
	function createInlineWebGLViewer(parent, guid) {
		
		var parentDiv = document.createElement("div");
		parentDiv.style.backgroundColor = "black";
		//parentDiv.style.width = "360px"; // 100%
		//parentDiv.style.height = "560px";
		
		var nbAllow = 60;
		//var imageWidth = 340;
		
		var gui = document.createElement("div");
		gui.setAttribute("id", "gui");
		
		
		
		var div = document.createElement("div");
		//div.setAttribute("style", "width: "+imageWidth+"px; height: 585px; float: left");					
		div.setAttribute("style", "float: left");
		
		var loaderInfo = document.createElement("div");
		loaderInfo.setAttribute("class", "loader-info");
		
		var canvasContainer = document.createElement("div");
		canvasContainer.setAttribute("class", "canvas-container");


	
		Event.observe(window, 'keydown', function(event) {
			var char;
			if (event.which == null) {
				char= String.fromCharCode(event.keyCode);    // old IE
			} else if (event.which != 0) {
			     char= String.fromCharCode(event.which);	  // All others
			}
			switch(char)
			{
			case "Q":
				_viewer.movement(5); // rotate left
				break;
			case "W":
				_viewer.movement(0); // forward
				break;
			case "E":
				_viewer.movement(4); // rotate right
				break;
			case "A":
				_viewer.movement(3); // left
				break;
			case "S":
				_viewer.movement(2); // back
				break;
			case "D":
				_viewer.movement(1); // right
				break;
			default:
			}
		});
		
		
		// swipe
		var down_x = null;
		var up_x = null;
		var up_y = null;

		if (getMobile()) {
		    orientationchange();
            window.onorientationchange = orientationchange;
		    function orientationchange() {
		        if (window.orientation == 90
                || window.orientation == -90) {
		            document.getElementById('rotateccw').style.display = 'none';
		            document.getElementById('displayDiv').style.display = '';                 
		        }
		        else {
		            document.getElementById('rotateccw').style.display = '';
		            document.getElementById('displayDiv').style.display = 'none';
		        }
		    }
		}

		if (!getOrientationOff()) {
			// send orientation to viewer
			window.addEventListener('deviceorientation', function(eventData) {
				var LR = eventData.gamma;
				var FB = eventData.beta;
				var DIR = eventData.alpha;
				_viewer.orientation(LR, FB, DIR);            
			});
		}

		Event.observe(canvasContainer, 'mousedown', function(event) {
		    down_x = event.pageX;
		    _viewer.playSound();
		});
		
		Event.observe(canvasContainer, 'mouseup', function(event) {
			up_x = event.pageX;
			up_y = event.pageY;
			do_work();
		});
		
		
		// http://test.lin.net.nz/swipe_demo/
		
		Event.observe(canvasContainer, 'touchstart', function(event) {
			down_x = event.touches[0].pageX;
			up_x = down_x;
			up_y = event.touches[0].pageY;
			_viewer.playSound();
		});
		
		Event.observe(canvasContainer, 'touchmove', function(event) {
			up_x = event.touches[0].pageX;
			up_y = event.touches[0].pageY;
		});
		
		Event.observe(canvasContainer, 'touchend', function(event) {
		    do_work();
		    
		});

		// possible for later: dynamic viewport
		/*
        function setScale() {
		    var metatags = document.getElementsByTagName('meta');
		    for (cnt = 0; cnt < metatags.length; cnt++) {
		        var element = metatags[cnt];
		        if (element.getAttribute('name') == 'viewport') {

		            element.setAttribute('content', 'initial-scale=' + width + '; maximum-scale = 5; user-scalable = yes');
		            document.body.style['max-width'] = width + 'px';
		        }
		    }
		}
        */

		function do_work() {	
			var xC = _viewer.getImageWidth() / 2;
			var yC = _viewer.getImageHeight() /2;  
			
			if ((down_x - up_x) > 150)
			    {
			        slide_right();
			    } else if ((up_x - down_x) > 150)
			    {
			        slide_left();
			    } else if( (  up_y > (yC-nbAllow) ) && ( (yC+nbAllow) > up_y )  ) { // vertical center
			    	if ( nbAllow > up_x ) { 
			    		_viewer.movement(3); // left
			    	} else if (  (  up_x > (xC-nbAllow) ) && ( (xC+nbAllow) > up_x ) ) { // center
						_viewer.movement(0); // forward
			    	} else if ( (_viewer.getImageWidth() > up_x) && ( up_x > (_viewer.getImageWidth()-nbAllow) ) ) { // right
						_viewer.movement(1); // right
			    	}
			    } else if ( (_viewer.getImageWidth() > up_x) && ( up_y > (_viewer.getImageHeight()-nbAllow) ) ) { // back
					_viewer.movement(2); // back
			    }

		}

		function slide_right() {
		    _viewer.movement(4); // rotate right
		}
		
		function slide_left() {
		    _viewer.movement(5); // rotate left
		}
				
		div.appendChild(loaderInfo);
		div.appendChild(canvasContainer);
		gui.appendChild(div);
		
		var infoPanel = document.createElement("div");
		infoPanel.setAttribute("class", "info-panel");
		
		gui.appendChild(infoPanel);
		parentDiv.appendChild(gui);
		parent.update(parentDiv);		
	}

	function getGuidFromUrl() {
		var url = document.URL;
		var tmp = url.split("guid=");
		if (tmp.length == 2) {
		    // there is a guid
		    var tmp1 = tmp[1].split("&");   // if there's other parameters
		    var tmp2 = tmp1[0].split("#"); // if there's a hash
            return tmp2[0];
		}
		else {
			return "";
		}
    }

    function getMobile() {
        var url = document.URL;
        var tmp = url.split("&mobile=");
        if (tmp.length == 2) {
            return true;
        } else {
            return false;
        }
    }
	
	function getOrientationOff() {
        var url = document.URL;
        var tmp = url.split("&o=");
        if (tmp.length == 2) {
            return true;
        } else {
            return false;
        }
    }



	function isSilverlightEnable() {
		var plugins = navigator.plugins;
		for (var i=0; i<plugins.length; ++i) {
			if (plugins.item(i).name == "Silverlight Plug-In")
				return true;
		}
		return false;
	}

	touchMove = function (event) {
	    // Prevent scrolling on this element
	    event.preventDefault();
	}

	function addViewer() {
		var isOverCanvas = false;	
		var displayDiv = document.getElementById("displayDiv");
		var guid = getGuidFromUrl();
			
		document.onmousewheel = function(e) {
			if (isOverCanvas)
				return false; 
		};
	
		
		if (guid != "") { //Silverlight is desactivated and were are on a page with a viewable synth

			createInlineWebGLViewer(displayDiv, guid);
			_viewer = new PhotoSynthViewer(document.getElementById("gui"), false, true); // useframe usesound
			_viewer.load(guid);
			
		}
		else if (guid == "" ){ //Silverlight is activated and were are on a page with a viewable synth
			
			//Should warn the user to desactivate Silverlight or this extension
			alert("no guid!");
		}
}


</script>
</head>
<body onLoad="addViewer();">
<div id="displayDiv" ontouchmove="touchMove(event);">test</div>
<img id="rotateccw" src="./img/rotateccw.jpg" style="position: absolute;top: 50%; left: 50%; width: 36px; height: 36px; margin-top: -18px; margin-left: -18px; display: none; "/>
<img id="initLoading" src="./img/loadinfo.net.gif" style="position: absolute; top: 50%; left: 50%; width: 24px; height: 24px;  margin-top: -12px; margin-left: -12px;  "/>
</body>
</html>