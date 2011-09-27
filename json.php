<?php
// Turn off all error reporting
error_reporting(0);

// get guid
$url = htmlspecialchars($_GET["url"]);
$guid = htmlspecialchars($_GET["guid"]);

$cacheLocation = './synths/'.$guid.'/';
$cacheFile = $cacheLocation . 'json.json';

// if we have the soap, return it!
if (file_exists($cacheFile)) {

	// output file contents 
	header('Content-type: application/json');
	print file_get_contents($cacheFile, false);
	
} else {

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

		//return 'Operation completed without any errors';
		header('Content-type: application/json');
		print $result;
		
		// write file to cache
		mkdir($cacheLocation,0777,TRUE);
		$fh = fopen($cacheFile, 'w') or die();
		fwrite($fh, $result);
		fclose($fh);
	}
}
?>