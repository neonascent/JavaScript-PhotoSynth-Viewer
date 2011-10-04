<?php

// get guid
$guid = htmlspecialchars($_GET["guid"]);
$link = "viewer.php?guid=".$guid."&mobile=true";
?>
<!DOCTYPE html>
<html>
	<head>
	<title>Instructions</title>
    <meta name="viewport" content="width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=0;" />
    <meta name="apple-mobile-web-app-capable" content="yes" /> <!-- allows fullscreen as Home Screen link on iphone -->
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
	</head>
<body bgcolor="black">
<a href="<?php echo($link); ?>" style="decoration: none;"><img src="./img/instructions-iphone.jpg" style="position: absolute; top: 50%; left: 50%; width: 400px; height: 200px; margin-top: -100px; margin-left: -200px;"/></a>
</body>
</html>