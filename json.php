<?php

// get guid
$url = htmlspecialchars($_GET["url"]);


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
}
?>