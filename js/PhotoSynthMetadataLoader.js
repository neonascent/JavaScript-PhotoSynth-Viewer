
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
    var _synthTitle = "MystRecon";
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
		//return _coords[coordSystemIndex].nbBinFiles;
		return 0;
	};

	this.getBinFile = function(coordSystemIndex, binFileIndex) {
		return _coords[coordSystemIndex].binFiles[binFileIndex];
	};
	
	this.getNbVertices = function(coordSystemIndex) {
		/*var coordSystem = _coords[coordSystemIndex];
		var nbVertices = 0;
		for (var i=0; i<coordSystem.nbBinFiles; ++i)
			nbVertices += coordSystem.binFiles[i].positions.length;
		return nbVertices/3;*/
		return 0;
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
	
	// get nearest camera to index
	// go through all cameras and find nearest. 
	// could optimise based on, say, +- 20 if camera index is linked to position?
	// need better logic for finding cameras
	this.getNearestCamera = function(coordSystemIndex, cameraIndex) {
		var originCamera = _coords[coordSystemIndex].cameras[cameraIndex];
		
		var distance = null;
		var closest = null;
		
		for (var i = 0; i < _coords[coordSystemIndex].cameras.length; i++) {
			if ((i != cameraIndex) && (_coords[coordSystemIndex].cameras[i] !== undefined)) {
					var testDistance = this.lineDistance(originCamera, _coords[coordSystemIndex].cameras[i]);
					if ((closest == null) || (testDistance < distance)) {
						distance = testDistance;
						closest = i;
					}
			}
		}
	
		// return _coords[coordSystemIndex].cameras[closest];
		return closest;
	}
	
	// same as getNearestCamera but just returns distance
	this.getDistanceToNearestCamera = function(coordSystemIndex, cameraIndex) {
		var originCamera = _coords[coordSystemIndex].cameras[cameraIndex];
		
		var distance;
		var closest;
		
		for (var i = 0; i < _coords[coordSystemIndex].cameras.length; i++) {
			if ((i != cameraIndex) && (_coords[coordSystemIndex].cameras[i] !== undefined)) {
					var testDistance = this.lineDistance(originCamera, _coords[coordSystemIndex].cameras[i]);
					if ((closest == undefined) || (testDistance < distance)) {
						distance = testDistance;
						closest = i;
					}
			}
		}
	
		// return _coords[coordSystemIndex].cameras[closest];
		return distance;
	}
	
	// gets nearest, then look around a bit further for other points
	this.getNearby = function(coordSystemIndex, cameraIndex, searchDistance) {
		var cameraIndexes = []; // initialise an empty array
		var originCamera = _coords[coordSystemIndex].cameras[cameraIndex];
		
		
		//var searchDistance = this.getDistanceToNearestCamera(coordSystemIndex, cameraIndex);
		
		
		if (searchDistance !== undefined) {
			// if there is a closest point
			for (var i = 0; i < _coords[coordSystemIndex].cameras.length; i++) {
				if ((i != cameraIndex) && (_coords[coordSystemIndex].cameras[i] !== undefined)) {
						var testDistance = this.lineDistance(originCamera, _coords[coordSystemIndex].cameras[i]);
						//if (testDistance <= ((searchDistance * (100 + percentage))/ 100)) {
						if (testDistance <= searchDistance) {
							// add this camera
							cameraIndexes.push(i);
						}
				}
			} //endfor
		} // endif close point
		return cameraIndexes;
	}


    // gets nearest, then look around a bit further for other points
	this.getAll = function(coordSystemIndex) {
		var cameraIndexes = []; // initialise an empty array


		for (var i = 0; i < _coords[coordSystemIndex].cameras.length; i++) {
			if (_coords[coordSystemIndex].cameras[i] !== undefined) {
				cameraIndexes.push(i);
			}
		} 

		return cameraIndexes;
	}

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
	
	// josh's working out distance 
	this.lineDistance = function(a, b)
	{
		var dx = a.position[0] - b.position[0];
		var dy = a.position[1] - b.position[1];
		var dz = a.position[2] - b.position[2];
		return Math.sqrt(dx*dx + dy*dy + dz*dz);
	}	
	
	// work out vector angle from coordinate system
	// ignore roll
	// ignore y, just use plane xz
	function vectorAngle(x, z) {
		return (Math.atan2(x,z) - Math.atan2(0,0))* (180/Math.PI);
	}
	
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
        parseSynthInfo(guid, function() {
            document.title = _synthTitle;
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
	
		var xhr = new XMLHttpRequest();
		xhr.open("GET", "soap.php?guid="+guid, true);
		
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
		xhr.send();		
	}
	
    function parseSynthInfo(guid, onSynthInfoParsed) {
	
		/*<?xml version="1.0" encoding="utf-8"?>
        <synth>
        <title>Graffiti</title>
        </synth>*/
		
		
		var xhr = new XMLHttpRequest();
		xhr.open("GET", "./synths/"+guid+"/synth.xml", true);
		
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				var xml = xhr.responseXML;
				try
                {
                    _synthTitle = xml.getElementsByTagName("title")[0].firstChild.nodeValue;
                }
                catch(err)
                {
                }
				onSynthInfoParsed();	
			}			
		};		
		xhr.send();		
	}

	function parseJson(url, guid, onJsonParsed) {

		var xhr = new XMLHttpRequest();
		xhr.open("GET", "json.php?guid="+guid+"&url=" + url, true);
		
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				var result = JSON.parse(xhr.responseText);
				
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
						"height": parseInt(thumb["d"][1], 10) });
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
			}			
		};		
		xhr.send();	
		
		
		
		
		
		

	}
}