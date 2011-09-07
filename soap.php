<?php

// get guid
$guid = htmlspecialchars($_GET["guid"]);

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
	header('Content-type: text/xml');
	print $result;
}
?>