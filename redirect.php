<?php

// get guid
$guid = htmlspecialchars($_GET["guid"]);

/*
*	Mobile device detection
* from: http://www.kevinleary.net/mobile-user-detect-php-iphone-ipad-blackberry-android/
*/
if( !function_exists('mobile_user_agent_switch') ){
	function mobile_user_agent_switch(){
		$device = '';
		
		if( stristr($_SERVER['HTTP_USER_AGENT'],'ipad') ) {
			$device = "ipad";
		} else if( stristr($_SERVER['HTTP_USER_AGENT'],'iphone') || strstr($_SERVER['HTTP_USER_AGENT'],'iphone') ) {
			$device = "iphone";
		} else if( stristr($_SERVER['HTTP_USER_AGENT'],'blackberry') ) {
			$device = "blackberry";
		} else if( stristr($_SERVER['HTTP_USER_AGENT'],'android') ) {
			$device = "android";
		}
		
		if( $device ) {
			return $device; 
		} return false; {
			return false;
		}
	}
}

switch (mobile_user_agent_switch()) {
	case "iphone": // redirect for ipads
		$link = "instructions-iphone.php?guid=". $guid;
		break;
	case "ipad":
	case "blackberry":
	case "android":
		header('Location: viewer.php?guid='.$guid."&mobile=true");
		exit;
	default: // normal browser
		header('Location: viewer.php?guid='.$guid);
		exit;
}
?>
<!DOCTYPE html>
<html>
	<head>
	<title>Instructions</title>
    <meta name="viewport" content="width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=0;" />
	</head>
<body bgcolor="black">
<a href="<?php echo($link); ?>" style="decoration: none;"><img src="./img/instructions.jpg" style="position: absolute; top: 50%; left: 50%; width: 250px; height: 250px; margin-top: -125px; margin-left: -125px;"/></a>
</body>
</html>