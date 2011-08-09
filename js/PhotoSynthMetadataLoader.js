
function SoapInfo() {
	this.succeeded;
	this.collectionType; //"synth" or "pano"
	this.dzcUrl;
	this.jsonUrl;
	this.collectionRoot;
	this.privacyLevel;
	this.guid;
}

function JsonInfo() {
	this.version;
	this.thumbs;
}

function PhotoSynthMetadataLoader(guid, options) {
	var _onComplete = options.onComplete || function() {};
	var _onProgress = options.onProgress || function() {};
	var _onError    = options.onError    || function() {};
	var _soapInfo   = new SoapInfo();
	var _jsonInfo   = new JsonInfo();
	_soapInfo.guid = guid;
	
	var _coords = [];	
	var _state  = LOADING_SOAP;
	var _that   = this;
	
	const LOADING_SOAP = 0;
	const LOADING_JSON = 1;
	const LOADED       = 2;
	const ERROR        = 3;
	
	this.__defineGetter__("state", function(){
		return _state;
	});	
	
	this.getSoapInfo = function() {
		return _soapInfo;
	};
	
	this.getJsonInfo = function() {
		return _jsonInfo;
	};	
	
	this.getNbCoordSystems = function() {
		return _coords.length;
	};
	
	this.getCoordSystem = function(coordSystemIndex) {
		return _coords[coordSystemIndex];
	};
	
	this.getNbBinFiles = function(coordSystemIndex) {
		return _coords[coordSystemIndex].nbBinFiles;
	};

	this.getBinFile = function(coordSystemIndex, binFileIndex) {
		return _coords[coordSystemIndex].binFiles[binFileIndex];
	};
	
	this.getNbVertices = function(coordSystemIndex) {
		var coordSystem = _coords[coordSystemIndex];
		var nbVertices = 0;
		for (var i=0; i<coordSystem.nbBinFiles; ++i)
			nbVertices += coordSystem.binFiles[i].positions.length;
		return nbVertices/3;
	}	
	
	this.getNbCameras = function(coordSystemIndex) {
		var coordSystem = _coords[coordSystemIndex];
		var nbCameras = 0;
		for (var i=0; i<coordSystem.cameras.length; ++i)
			if (coordSystem.cameras[i] !== undefined)
				nbCameras++;
		return nbCameras;
	};
	
	this.getCamera = function(coordSystemIndex, cameraIndex) {
		return _coords[coordSystemIndex].cameras[cameraIndex];
	};

	this.loadCoordSystem = function(coordSystemIndex, options) {
		new PhotoSynthLoader(_that, coordSystemIndex, options);
	};
	
	this.isCoordSystemLoaded = function(coordSystemIndex) {
		var coordSystem = _coords[coordSystemIndex];
		var isLoaded = true;
		for (var i=0; i<coordSystem.binFiles.length; ++i) {
			if (coordSystem.binFiles[i] == undefined) {
				isLoaded = false;
			}
		}
		return isLoaded;
	};
	
	loadMetadata(guid);
	
    function loadMetadata(guid) {
		_state = LOADING_SOAP;
		_onProgress(_that);
		parseSoap(guid, function() {
			_state = LOADING_JSON;
			_onProgress(_that);
			parseJson(_soapInfo.jsonUrl, guid, function() {
				_state = LOADED;
				_onProgress(_that);
				_onComplete(_that);
			});
		});	
	}		
	
	function getNbImage(obj) {
		var nbImage = 0;		
		while(obj[nbImage]) {
			nbImage++;
		}
		return nbImage;
	}
	
	function parseSoap(guid, onSoapParsed) {
	
		var request  = '<?xml version="1.0" encoding="utf-8"?>';
		request += '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">';
		request += '  <soap:Body>';
		request += '    <GetCollectionData xmlns="http://labs.live.com/">';
		request += '      <collectionId>' + guid + '</collectionId>';
		request += '      <incrementEmbedCount>false</incrementEmbedCount>';
		request += '    </GetCollectionData>';
		request += '  </soap:Body>';
		request += '</soap:Envelope>';		
		
		var xhr = new XMLHttpRequest();
		xhr.open("POST", "http://photosynth.net/photosynthws/PhotosynthService.asmx", true);
		xhr.setRequestHeader("Content-Type", "text/xml; charset=utf-8");
		xhr.setRequestHeader("SOAPAction", "http://labs.live.com/GetCollectionData");
		
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				var xml = xhr.responseXML;
				_soapInfo.succeeded      = xml.getElementsByTagName("Result")[0].firstChild.nodeValue == "OK";
				_soapInfo.collectionType = xml.getElementsByTagName("CollectionType")[0].firstChild.nodeValue == "Synth" ? "synth" : "pano";
				_soapInfo.dzcUrl         = xml.getElementsByTagName("DzcUrl")[0].firstChild.nodeValue;
				_soapInfo.jsonUrl        = xml.getElementsByTagName("JsonUrl")[0].firstChild.nodeValue;
				_soapInfo.collectionRoot = xml.getElementsByTagName("CollectionRoot")[0].firstChild.nodeValue;
				_soapInfo.privacyLevel   = xml.getElementsByTagName("PrivacyLevel")[0].firstChild.nodeValue;
				onSoapParsed();	
			}			
		};		
		xhr.send(request);		
	}
	
	function parseJson(url, guid, onJsonParsed) {

		chrome.extension.sendRequest({'action' : 'downloadJson', 'url' : url}, function(responseText) {
		
			var result = JSON.parse(responseText);
		
			_jsonInfo.version = result["_json_synth"];
			
			var root;				
			if (!result["l"][guid])
				root = result["l"][""];
			else
				root = result["l"][guid];
			
			var nbPicture = parseInt(root["_num_images"], 10);
			var nbCoordSystem = parseInt(root["_num_coord_systems"], 10);
			
			var thumbs = root["image_map"];
			
			//Retrieve thumb information
			var thumbnails = [];
			for (var i=0; i<nbPicture; ++i) {
				var thumb = thumbs[i];
				thumbnails.push({
					"url":    thumb["u"],
					"width":  parseInt(thumb["d"][0], 10),
					"height": parseInt(thumb["d"][1], 10)
				});
			}
			_jsonInfo.thumbs = thumbnails;
			
			//Retrieve CoordSystem information
			_coords = [];
			for (var i=0; i<nbCoordSystem; ++i) {
				var current = root["x"][i];
				if (!current["k"]) {
					_coords.push({
						"cameras"     : [],
						"nbBinFiles"  : 0,							
						"binFiles"    : [],
						"pointClouds" : []
					});
				}
				else {					
					var nbBinFiles = current["k"][1];
					var images = current["r"];
					
					//tricky part: we allocate an array of N picture but some of them may not be registered in this coords system
					var cameras = new Array(nbPicture);		
					for (var j=0; j<getNbImage(images); ++j) {
						var infos = images[j]["j"];
						
						var index = parseInt(infos[0], 10);
						var x     = infos[1];
						var y     = infos[2];
						var z     = infos[3];
						var qx    = infos[4];
						var qy    = infos[5];
						var qz    = infos[6];
						var qw    = Math.sqrt(1-qx*qx-qy*qy-qz*qz);
						var ratio = infos[7];
						var focal = infos[8];
						
						var distorts = images[j]["f"];
						var distort1 = distorts[0];
						var distort2 = distorts[1];
						
						cameras[index] = {
							"position"    : [x, y, z],
							"orientation" : [qx, qy, qz, qw],
							"ratio"       : ratio,
							"focal"       : focal,
							"distort"     : [distort1, distort2]
						};
					}
					_coords.push({
						"cameras"     : cameras,
						"nbBinFiles"  : nbBinFiles,
						"binFiles"    : new Array(nbBinFiles),
						"pointClouds" : new Array(nbBinFiles)
					});
				}
			}				
			onJsonParsed();
		});
	}
}