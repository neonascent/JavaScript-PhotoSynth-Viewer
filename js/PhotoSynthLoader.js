function PhotoSynthLoader(metadataLoader, coordSystemIndex, options) {

	var _onStart    = options.onStart    || function() {};
	var _onProgress = options.onProgress || function() {};
	var _onComplete = options.onComplete || function() {};	
	var _onError    = options.onError    || function() {};
	
	var _metadataLoader = metadataLoader;
	var _that = this;
	
	var _state = LOADING; //useless for now
	var _nbBinFiles;
	var _nbBinFileLoaded = 0;
		
	const LOADING = 0; //useless for now
	const LOADED  = 1;
	const ERROR   = 2;
	
	function updateDownloadProgress(coordSystemIndex, binFileIndex) {
		_nbBinFileLoaded++;		
		_onProgress(_metadataLoader, coordSystemIndex, binFileIndex, _nbBinFileLoaded/_nbBinFiles);
		
		if (_nbBinFileLoaded == _nbBinFiles) {
			_state = LOADED;
			_onComplete(_metadataLoader);
		}
	}

	load(metadataLoader, coordSystemIndex);
	
	function load(metadataLoader, coordSystemIndex) {
		_state = LOADING;
		var coordSystem = metadataLoader.getCoordSystem(coordSystemIndex);
		
		_nbBinFiles = coordSystem.nbBinFiles;
		for (var i=0; i<_nbBinFiles; ++i) {
			coordSystem.binFiles[i] = {};
			coordSystem.binFiles[i].loaded = false;
		}
		_onStart(metadataLoader);
		for (var i=0; i<_nbBinFiles; ++i)
			downloadBinFile(metadataLoader.getSoapInfo().collectionRoot, coordSystemIndex, i, _nbBinFiles);			
	}
	
	function downloadBinFile(collectionRoot, coordSystemIndex, binFileIndex) {
		/*
		//Ajax call supporting binary mode
		var url = "ajax/download.php?url="+encodeURI(collectionRoot + "points_" + coordSystemIndex + "_" + binFileIndex + ".bin");
		var xhr = new XMLHttpRequest();
		xhr.open("GET", url, true);
		if (xhr.hasOwnProperty("responseType"))
			xhr.responseType = "arraybuffer";
		else
			xhr.overrideMimeType('text/plain; charset=x-user-defined');
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				var data = xhr.response ? xhr.response : xhr.mozResponseArrayBuffer;	
				parseBinFile(data, coordSystemIndex, binFileIndex);
				updateDownloadProgress(coordSystemIndex, binFileIndex);
			}			
		};		
		xhr.send(null);	*/
		var url = collectionRoot + "points_" + coordSystemIndex + "_" + binFileIndex + ".bin";
		chrome.extension.sendRequest({'action' : 'downloadBinFile', 'url' : url}, function(result) {
			var binFile = _metadataLoader.getCoordSystem(coordSystemIndex).binFiles[binFileIndex];
			binFile["positions"] = result.positions;
			binFile["colors"]    = result.colors;
			binFile.loaded       = true;
			updateDownloadProgress(coordSystemIndex, binFileIndex);
		});
	}
	
	function parseBinFile(data, coordSystemIndex, binFileIndex) {
		
		var input = new ArrayReader(data);
		var versionMajor  = input.ReadBigEndianUInt16();
		var versionMinor  = input.ReadBigEndianUInt16();
		
		if (versionMajor != 1 || versionMinor != 0) {
			_state = ERROR;
			_onError();
			return;
		}
		
		var nbImage = input.ReadCompressedInt();
		
		//reading unknown header
		for (var i=0; i<nbImage; ++i) {							
			var nbInfo = input.ReadCompressedInt();
			for (var j=0; j<nbInfo; j++) {
				var vertexIndex = input.ReadCompressedInt();
				var vertexValue = input.ReadCompressedInt();
			}
		}
		
		var nbVertices = input.ReadCompressedInt();
		
		var vertsArray = new Float32Array(nbVertices * 3);
		var colsArray  = new Float32Array(nbVertices * 3);
		
		for (var i=0; i<nbVertices; i++) {
			var x = input.ReadBigEndianSingle();
			var y = input.ReadBigEndianSingle();
			var z = input.ReadBigEndianSingle();
			vertsArray[i*3+0] = parseFloat(x);
			vertsArray[i*3+1] = parseFloat(y);
			vertsArray[i*3+2] = parseFloat(z);
			
			var color = input.ReadBigEndianUInt16();
			var r = (((color >> 11) * 255) / 31) & 0xff;
			var g = ((((color >> 5) & 63) * 255) / 63) & 0xff;
			var b = (((color & 31) * 255) / 31) & 0xff;
			colsArray[i*3+0] = parseInt(r)/255;
			colsArray[i*3+1] = parseInt(g)/255;
			colsArray[i*3+2] = parseInt(b)/255;			
		}
		var binFile = _metadataLoader.getCoordSystem(coordSystemIndex).binFiles[binFileIndex];
		binFile["positions"] = vertsArray;
		binFile["colors"]    = colsArray;
		binFile.loaded       = true;
	}	
}