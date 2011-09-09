﻿/*
 *
 * todo: look up/down sweep. 
 *
 * todo: fix iphone double-touch
 *
 * todo: rotate animations. 
 *   
 * todo: navigation arrows subtly on image (fade? animated gif?)
 *
 * todo: remove unneccesary CoverFlow and Accordian code. 
 */


function PhotoSynthViewer(div, frame, sound) {
	
	var _div        = div;
	var _container  = div.getElementsByClassName("canvas-container")[0];
	var _controller = div.getElementsByClassName("canvas-controller")[0];
	var _width      = Element.getWidth(_container);
	var _height     = Element.getHeight(_container);	
	var _that       = this;
	
	// configuration 
	var _useFrame = frame;
	var _useSound = sound;

	var _renderer;	
	var _scene;
	var _particleSystems = [];
	var _lines;
	var _pointCloudMaterial;
	var _camerasFrustrumMaterial;
	var _stats;
	var _loader;	
	
	var _similarAngle = 10; // +- 10 degrees 
	var _thumbs;
	
	var _guid;
	
	//camera
	var _camera;
	var _qx = new THREE.Quaternion(1.0, 0.0, 0.0, 0.0);
	var _qy = new THREE.Quaternion(0.0, 1.0, 0.0, 0.0);
	var _qz = new THREE.Quaternion(0.0, 0.0, 1.0, 0.0);
	var _fov  = 45;
	var _near = 0.01;
	var _far  = 1000;
	var _prevCameraPosition;
	var _prevCameraRotation;
	var _currentCameraIndex;
	var _currentCoordIndex;
	var _isCameraTopView = false;
	
	// current image details
	var _imageWidth;
	var _imageHeight;
	
	var _searchDistance = .7;  // need more dynamic method of searching really
	
	// directions
	var _directions = 	[new THREE.Quaternion(0, 1, 0, 0), new THREE.Quaternion(0, -0.707, 0, 0.707), new THREE.Quaternion(0, 0, 0, 1),  new THREE.Quaternion(0, 0.707, 0, 0.707)] ; // forward, right, back, left down Z
	var _directionNames = ["forward", "right", "back", "left", "anticlockwise", "clockwise"];
	var _direction;
	
	// direction icons
	var _dIcons = ['112.png','109.png','111.png','110.png','119.png','120.png'];
	var _dIconsPosition = [[.5, .5, -.5, -.5], [1, .5, -1, -.5], [.5, 1, -.5, -1], [0, .5, 0, -.5], [0, 0, 0, 0], [1, 0, -1, 0]]; // ximage width, ximage height, +/- xicon width, +/- xicon height  
	var _iconsize = 16;
	
	// sound list
	var _sounds;
	var _soundReady = false;
	var _currentSound;
	var _currentSoundObject;

	var _imgLoading = '<img src="img/loading.gif" alt="" />';

	
	this.getCamera = function() {
		return _camera;
	};
	
	this.getLoader = function() {
		return _loader;
	};
	
	this.getImageHeight = function() {
		return _imageHeight;
	};
	
	this.getImageWidth = function() {
		return _imageWidth;
	};
	
	this.toggleTopView = function() {
		if (_isCameraTopView) {
			moveCameraTo(_prevCameraPosition, _prevCameraRotation, {
				onComplete : function() {
					_isCameraTopView = false;
				}
			});
		}
		else {
			_prevCameraPosition = _camera.position.clone();
			_prevCameraRotation = new THREE.Quaternion(); _prevCameraRotation.copy(_camera.quaternion); //TODO: Three.js I need clone() on Quaternion too!
			moveCameraTo(new THREE.Vector3(0, 0, 10), new THREE.Quaternion(0, 0, 0 ,1), {
				onComplete : function() {
					_isCameraTopView = true;
				}
			});		
		}
	};
	
	this.setPointSize = function(pointSize) {
		_pointCloudMaterial.size = pointSize;
	};
	
	this.setCamerasFrustrumVisibility = function(isVisible) {
		_camerasFrustrumMaterial.opacity = (isVisible ? 1.0 : 0.0);
	};
	
	/*this.setCamera = function(coordSystemIndex, cameraIndex) {
		var cam = _loader.getCamera(coordSystemIndex, cameraIndex);
		_camera.position = new THREE.Vector3(cam.position[0], cam.position[1], cam.position[2]);
		_camera.quaternion = new THREE.Quaternion(cam.orientation[0], cam.orientation[1], cam.orientation[2], cam.orientation[3]);
		_camera.quaternion.multiplySelf(_qx);
	};*/

	this.moveToCamera = function (coordSystemIndex, cameraIndex, options) {
	    // record the current camera index
	    _currentCameraIndex = cameraIndex;
	    _currentCoordIndex = coordSystemIndex;

	    var url = _thumbs.thumbs[cameraIndex].url;
	    _imageHeight = _thumbs.thumbs[cameraIndex].height;
	    _imageWidth = _thumbs.thumbs[cameraIndex].width;
	    getDirections();


	    // new image content
	    var frame = "";
	    if (_useFrame) {
	        var frameFile;
	        if (_imageHeight > _imageWidth) {
	            frameFile = 'portrait-narrow.png';
	        } else {
	            frameFile = 'landscape-narrow.png';
	        }
	        frame = '<img src="img/' + frameFile + '" height="' + (_imageHeight + 3) + '" width="' + _imageWidth + '" style="position: absolute;  z-index:10; left: 0px; top:0px;" ondragstart="return false" onselectstart="return false"/>';
	    }
	    var updateHTML = '<img src="' + url + '" ondragstart="return false" style="position: absolute; left: 0px; top:0px;" onselectstart="return false"/>' + frame;
	    for (var k = 0; k < 6; k++) {
	        if (_direction[k] !== -1) {
	            var iconLeft = (_dIconsPosition[k][0] * _imageWidth) + (_dIconsPosition[k][2] * _iconsize);
	            var iconTop = (_dIconsPosition[k][1] * _imageHeight) + (_dIconsPosition[k][3] * _iconsize);
	            updateHTML = updateHTML + '<img alt="' + _direction[k] + '" title="' + _direction[k] + '" src="img/' + _dIcons[k] + '" style="position: absolute;  z-index:20; left: ' + iconLeft + 'px; top:' + iconTop + 'px;" />';
	            // hidden pre-load images
	            var urlOther = _thumbs.thumbs[_direction[k]].url;
	            updateHTML = updateHTML + '<img src="' + urlOther + '" style="display: none;"/>';
	        }
	    }







	    // add "loading" and undisplayed new image
	    var iconLeft = (.5 * _imageWidth) - (.5 * _iconsize);
	    var iconTop = (.5 * _imageHeight) - (.5 * _iconsize);
	    _container.insert('<img alt="loading" title="loading" src="img/loading.gif" style="position: absolute;  z-index:30; left: ' + iconLeft + 'px; top:' + iconTop + 'px;" />');

	    // hidden loading image        
	    var img = new Element('img');
	    img.onload = function () { _container.update(updateHTML); };
	    img.setStyle({
	        display: "none"
	    });
	    img.src = url;
	    _container.insert(img)





	};

	this.playSound = function () {
	    if (_useSound) {
	        var newSound = './sounds/' + _guid + '/background.mp3';
	        if ((_currentSound != newSound) && (_soundReady)) {
	            _currentSound = newSound;
	            //soundManager.stop('aSound');
	            _currentSoundObject = soundManager.createSound({
	                id: 'aSound',
	                url: newSound
	            });

	            // soundManager.stop('hhCymbal')
	            loopSound(_currentSoundObject); //_currentSoundObject.play();
	        }
	    }
	}

	function loopSound(sound) {
		  sound.play({
		    onfinish: function() {
		      loopSound(sound);
		    }
		  });
		}


	// move in the angle direction
	/*this.moveDirection = function(angle) {
		var newCamera = _loader.basicCardinalMovement(_currentCoordIndex, _currentCameraIndex, angle);
		if (newCamera) {
			this.MoveToCamera(_currentCoordIndex, newCamera, {}); 
			alert(newCamera);
		}
	}*/
	
	
	// can "cache" many of these things.  Nearest cameras, possible angles, etc. 
	
	// movement doesn't have reciprocity (which is okay because we go on camera orientation)
	// rotation should be reciprical and isn't. 
	
	function getDirections() {
		
		// get current camera
		var currentCamera = _loader.getCamera(_currentCoordIndex, _currentCameraIndex);
		var currentOrientation = new THREE.Quaternion(currentCamera.orientation[0], currentCamera.orientation[1], currentCamera.orientation[2], currentCamera.orientation[3]);
		
		// set up direction placeholders
		var directionSet = 0;
		_direction = [-1,-1,-1,-1,-1,-1];
		var directionDistance = [];
		
		
		// get list of nearby cameras
		// first look at ones that are close in orientation.  Put others in other group  
		var orientatedCameras = [];
		var rotatedCameras = [];
		var orientatedCamerasDone = [];
		var rotatedCamerasDone = [];
		var closeRotatedCameras = [];
      
		var counter = 0;
		for (var j = _searchDistance; counter < 10 ; j = j + (j * 0.5)) {
			var listCameras = _loader.getNearby(_currentCoordIndex, _currentCameraIndex, j);
			for (var i = 0; i < listCameras.length; i++) {
				// get camera relative orientations
				var testCamera = _loader.getCamera(_currentCoordIndex, listCameras[i]);
				if (testCamera !== undefined) {
					var testCameraOrientation = new THREE.Quaternion(testCamera.orientation[0], testCamera.orientation[1], testCamera.orientation[2], testCamera.orientation[3]);
					var relativeOrientationEulerDegrees = vToDegrees( QuaternionToEuler( relativeQuaternion(currentOrientation, testCameraOrientation) ) );
					
					if ((-_similarAngle > relativeOrientationEulerDegrees.x) || (relativeOrientationEulerDegrees.x  >  _similarAngle) || (-_similarAngle > relativeOrientationEulerDegrees.y) || (relativeOrientationEulerDegrees.y  >  _similarAngle) || (-_similarAngle > relativeOrientationEulerDegrees.z) || (relativeOrientationEulerDegrees.z  >  _similarAngle)) {										
						// if camera is rotated more than _similarAngle, and it's close
						if (counter == 0) {
							closeRotatedCameras.push(listCameras[i]);
						} else {
							if (!(rotatedCameras.has(listCameras[i]))) {
								rotatedCameras.push(listCameras[i]);
							}
						}
					} else {
						//alert("similar orientation: camera "+ listCameras[i] + " : " + relativeOrientationEulerDegrees.x + " " + relativeOrientationEulerDegrees.y + " " + relativeOrientationEulerDegrees.z );
						if (!(orientatedCameras.has(listCameras[i]))) {
							orientatedCameras.push(listCameras[i]);
						}
					}
				}
				
			} // endfor
			
		
			var string = getMaxScript(_currentCoordIndex);


            
			// in orientatedCameras, uses _direction, out to _direction
			for (var i = 0; i < orientatedCameras.length; i++) {
			    if (!(orientatedCamerasDone.has(orientatedCameras[i]))) {


			        var thisCamera = _loader.getCamera(_currentCoordIndex, orientatedCameras[i]);
			        // work out direction quat

			        // 1. create start and end points
			        var startVec = new THREE.Vector3(currentCamera.position[0], currentCamera.position[1], currentCamera.position[2]);
			        var endVec = new THREE.Vector3(thisCamera.position[0], thisCamera.position[1], thisCamera.position[2]);

			        // 2. move start and end so that start is origin
			        endVec.x = endVec.x - startVec.x;
			        endVec.y = endVec.y - startVec.y;
			        endVec.z = endVec.z - startVec.z;

			        // 3. lookat quat in world coordinates
			        var quat = lookat(new THREE.Vector3(), endVec);
                    
			        // 4. work out relative quat from orientation to endVec 
			        // qy then rotate again?
			        var rot1 = relativeQuaternion(quat, _qx);
			        var rot2 = relativeQuaternion(currentOrientation, _qx);
			        var rot = relativeQuaternion(rot1, rot2);

			        // 5. find what cardinal is closest
			        var thisDirection = getDirection(rot);

			        var distance = _loader.lineDistance(currentCamera, thisCamera);

			        // work out which direction this is
			        if (thisDirection !== false) {
			            // if this has a direction, check if it is closer, and update
			            if ((directionDistance[thisDirection] == undefined) || (directionDistance[thisDirection] > distance)) {
			                directionDistance[thisDirection] = distance;
			                _direction[thisDirection] = orientatedCameras[i];
			                directionSet++;
			            }
			        }

                
			        orientatedCamerasDone.push(orientatedCameras[i]);  // mark as done

			    } // not already done !orientatedCamerasDone.has...
			} // for orientatedCameras
			
			
			
			

			
			if (directionSet > 2) {
				break;
			}
			counter++;
		}
		
		/* rotations */
		getCloseRotations(closeRotatedCameras);
	}

	/*
    * Makes 3DS Max output of camera positions
    */
	function getMaxScript(coordinateIndex) {

	    var msCamera = 'startCamera = matrix3 [1,0,0] [0,-1,0] [0,0,-1] [0,0,0]\n';
	    msCamera = msCamera + 'sideCamera = matrix3 [0,1,0] [1,0,0] [0,0,-1] [0,0,0]\n';
	    msCamera = msCamera + 'sideCamera = matrix3 [0,1,0] [1,0,0] [0,0,-1] [0,0,0]\n';
	    msCamera = msCamera + 't = matrix3 [1,0,0] [0,1,0] [0,0,1] [0,0,0]\n';
	    msCamera = msCamera + 'R = matrix3 [1,0,0] [0,1,0] [0,0,1] [0,0,0]\n';
	    msCamera = msCamera + '\n';

	    var all = _loader.getAll(coordinateIndex);
	    for (var i = 0; i < all.length; i++) {
	        var thisCamera = _loader.getCamera(coordinateIndex, all[i]);
	        var currentOrientation = new THREE.Quaternion(thisCamera.orientation[0], thisCamera.orientation[1], thisCamera.orientation[2], thisCamera.orientation[3]);
	        var Angle = vToDegrees(QuaternionToEuler(currentOrientation));

	        msCamera = msCamera + 'Camera' + all[i] + ' = freecamera name: "' + all[i] + '_quat" \n';
	        msCamera = msCamera + 'Camera' + all[i] + '.rotation = quat ' + currentOrientation.x + ' ' + currentOrientation.y + ' ' + currentOrientation.z + ' ' + currentOrientation.w + '\n';
	        msCamera = msCamera + 'Camera' + all[i] + '.transform = startCamera * Camera' + all[i] + '.transform \n';
	        msCamera = msCamera + 'Camera' + all[i] + '.pos = [' + thisCamera.position[0] + ', ' + thisCamera.position[1] + ', ' + thisCamera.position[2] + ']\n';
	        msCamera = msCamera + '\n';

	    }
	    return msCamera;
	}

	// move in a direction
	this.movement = function(d) {
	// check rotation options
	    if (_direction[d] !== -1) {
	        this.moveToCamera(_currentCoordIndex, _direction[d], {});
	    }
	}
	
	/*
	* These are for close points. considered "coexistent" i.e. on top of each other, so privelege rotation. 
	*/
	function getCloseRotations(rotatedCameras) {
		var directionDistance = [];
		var currentCamera = _loader.getCamera(_currentCoordIndex, _currentCameraIndex);
		var currentOrientation = new THREE.Quaternion(currentCamera.orientation[0], currentCamera.orientation[1], currentCamera.orientation[2], currentCamera.orientation[3]);
		
		for (var i = 0; i < rotatedCameras.length; i++) {
			// find relative rotations 
			var thisCamera = _loader.getCamera(_currentCoordIndex, rotatedCameras[i]);
			var thisOrientation = new THREE.Quaternion(thisCamera.orientation[0], thisCamera.orientation[1], thisCamera.orientation[2], thisCamera.orientation[3]);
			var rot = relativeQuaternion(currentOrientation, thisOrientation);
			
			var angle = vToDegrees(QuaternionToEuler(rot));
			
			// just do z at the moment (rotate xy) 
			if ((170 > Math.abs(angle.x)) && (170 > Math.abs(angle.y))) { // if not rotated in opposite direction
				if ((-_similarAngle > angle.z) || (angle.z  >  _similarAngle)) { // then if this is a significant z-axis rotation
					if ((0 > angle.z) && ((directionDistance[4] == undefined) || (directionDistance[4] < angle.z))) {
						directionDistance[4] = angle.z;
						_direction[4] = rotatedCameras[i];
					} 
					if ((angle.z > 0) && ((directionDistance[5] == undefined) || (angle.z < directionDistance[5]))) {
						directionDistance[5] = angle.z;
						_direction[5] = rotatedCameras[i];
					} 
				}
			}
		}
		return true;
	}
	
	/* 
	 * work out which direction this is
	 * this isn't perfect, because we are using calculated Euler values rather than plane offsets.
	 * i.e. If x > 45 then we are facing wrong direction,
	 * but if y > 45 it makes little difference 
	 */
	function getDirection(rot) {
	    var lowestAngle;
	    var directionIndex;

	    for (var k = 0; k < 4; k++) {

	        var tryQuat = relativeQuaternion(_directions[k], rot);

	        var angle = vToDegrees(QuaternionToEuler(tryQuat));
	        var yDeviation = Math.abs(angle.y);
	        var xDeviation = Math.abs(angle.x);
	        var zDeviation = Math.abs(angle.z);
	        if ((45 > xDeviation) && (45 > zDeviation)) {
	            if ((directionIndex == undefined) || (lowestAngle > xDeviation)) {
	                directionIndex = k;
	                lowestAngle = xDeviation;
	            }
	        }
	    }
		
		if (directionIndex !== undefined) {
			//alert(_directionNames[directionIndex]);
			return directionIndex;	
		} else {
			return false;
		}
		
	} 

	Array.prototype.indexOf = function(obj) {
		  for (var i = 0; i < this.length; i++) {
		    if (this[i] == obj)
		      return i;
		  }
		  return -1;
		}

	Array.prototype.has = function(obj) {
	  return this.indexOf(obj) >= 0;
	}
	
	// 2 Vectors to Quat from : https://github.com/mrdoob/three.js/issues/382 (with fix)
		function lookat (vecStart, vecEnd, vecUp) {
	       var up = vecUp || new THREE.Vector3(0, 0, 1); 
	       var temp = new THREE.Matrix4();
	       temp.lookAt(vecEnd, vecStart, up);

	       var m00 = temp.n11, m10 = temp.n21, m20 = temp.n31,
	           m01 = temp.n12, m11 = temp.n22, m21 = temp.n32,
	           m02 = temp.n13, m12 = temp.n23, m22 = temp.n33;

	       var t = m00 + m11 + m22;
	       var s,x,y,z,w;

	       if (t > 0) {
	           s = Math.sqrt(t+1)*2;
	           w = 0.25 * s;
	           x = (m21 - m12) / s;
	           y = (m02 - m20) / s;
	           z = (m10 - m01) / s;
	       } else if ((m00 > m11) && (m00 > m22)) {
	           s = Math.sqrt(1.0 + m00 - m11 - m22)*2;
	           x = s * 0.25;
	           y = (m10 + m01) / s;
	           z = (m02 + m20) / s;
	           w = (m21 - m12) / s;
	       } else if (m11 > m22) {
	           s = Math.sqrt(1.0 + m11 - m00 - m22) *2;
	           y = s * 0.25;
	           x = (m10 + m01) / s;
	           z = (m21 + m12) / s;
	           w = (m02 - m20) / s;
	       } else {
	           s = Math.sqrt(1.0 + m22 - m00 - m11) *2;
	           z = s * 0.25;
	           x = (m02 + m20) / s;
	           y = (m21 + m12) / s;
	           w = (m10 - m01) / s;
	       }

	       var rotation = new THREE.Quaternion(x,y,z,w);
	       rotation.normalize();
	       return rotation;
	   }
	
	function moveCameraTo(dstPosition, dstRotation, options) {		
		var _onUpdate   = options.onUpdate     || function() {};
		var _onComplete = options.onComplete || function() {};
		
		var srcPosition = new THREE.Vector3(_camera.position.x, _camera.position.y, _camera.position.z);
		var srcRotation = new THREE.Quaternion(_camera.quaternion.x, _camera.quaternion.y, _camera.quaternion.z, _camera.quaternion.w);
		
		new Fx(_camera, {
			transition: Fx.Transitions.Quint.easeOut,
			onApply: function(elt, percent) {
				var src = new THREE.Vector3(srcPosition.x, srcPosition.y, srcPosition.z);
				var dst = new THREE.Vector3(dstPosition.x, dstPosition.y, dstPosition.z);
				_camera.position = src.multiplyScalar(1-percent).addSelf(dst.multiplyScalar(percent)); //src*(1-p) + dst*p
				THREE.Quaternion.slerp(srcRotation, dstRotation, _camera.quaternion, percent);
				_onUpdate();
			},
			onComplete : function() {
				_camera.position   = dstPosition;
				_camera.quaternion = dstRotation;
				_onComplete();
			}
		});	
	}
	

	function setupScene() {
		
		_camera   = new THREE.Camera(45, _width / _height, 0.01, 1000); //fov ratio near far
		_camera.position.z = 20;
		_camera.useTarget = false;
		_camera.useQuaternion = true;
		
		
		
		if (_useSound) {
			// disable debug mode after development/testing..
			// soundManager.debugMode = false;

			// The basics: onready() callback

			// Optional: ontimeout() callback for handling start-up failure
			soundManager.onready(function() {
			    _soundReady = true;
			});
			
			soundManager.ontimeout(function(){
	
			  // Hrmm, SM2 could not start. Flash blocker involved? Show an error, etc.?
				alert("Sound failed to start!");

			});
		}
		
		
		//_renderer = new THREE.WebGLRenderer();		
		//_scene    = new THREE.Scene();
		//_renderer.setSize(_width, _height);
		//_container.appendChild(_renderer.domElement);
		

		/*
		Event.observe(_renderer.domElement, "mousemove", function(event) {
			//console.log("mouse move");
		});

		Event.observe(_renderer.domElement, "mousedown", function(event) {
			//console.log("mouse down");
		});

		Event.observe(_renderer.domElement, "mouseup", function(event) {
			//console.log("mouse up");
		});
		
		Event.observe(_renderer.domElement, "keydown", function(event) {
			alert("keypress");
			console.log("keydown");
		});

		Event.observe(_renderer.domElement, "keyup", function(event) {
			console.log("keyup");
		});*/
		
	
		_stats = new Stats();
		_stats.domElement.style.display = "inline-block";
		//_controller.getElementsByTagName("p")[0].appendChild(_stats.domElement);
		
			
		_pointCloudMaterial = new THREE.ParticleBasicMaterial({
			size: 0.0125,
			vertexColors : true
		});
		
		_camerasFrustrumMaterial = new THREE.LineBasicMaterial({ 
			color: 0xffffff, 
			opacity: 1, 
			linewidth: 3, 
			vertexColors: false
		});

		/*
		setInterval(function(){
			_renderer.render(_scene, _camera);
			_stats.update();
		}, 1000/60);*/
		
	}
	
	setupScene();
	
	function getIndexOfFirstCamera(metadataLoader, coordSystemIndex) {
		var coordSystem = metadataLoader.getCoordSystem(coordSystemIndex);												
		var firstCameraIndex = -1;
		for (var i=0; i<coordSystem.cameras.length; ++i) {
			if (coordSystem.cameras[i] !== undefined) {
				if (firstCameraIndex == -1) 
					firstCameraIndex = i;
			}
		}
		return firstCameraIndex;
	}
	
	function displayCoordSystem(metadataLoader, coordSystemIndex) {
		initCoordSystem(metadataLoader, coordSystemIndex);
		var coordSystem = metadataLoader.getCoordSystem(coordSystemIndex);
		//for (var i=0; i<coordSystem.nbBinFiles; ++i) {
			//updateCoordSystem(metadataLoader, coordSystemIndex, i);
		//}
	}
	
	function initCoordSystem(metadataLoader, coordSystemIndex) {
		clearScene();
		_particleSystems = new Array(metadataLoader.getNbBinFiles(coordSystemIndex));	
		drawCamerasFrustrum(metadataLoader, coordSystemIndex);
	}
	
	function drawCamerasFrustrum(metadataLoader, coordSystemIndex) {
	
		var nbCameras = metadataLoader.getNbCameras(coordSystemIndex);
		var coordSystem = metadataLoader.getCoordSystem(coordSystemIndex);
		
		var distanceFromCamera = 0.2;
		var geometry = new THREE.Geometry();
		
		for (var i=0; i<coordSystem.cameras.length; ++i) {
			if (coordSystem.cameras[i] !== undefined) {
				var cam = coordSystem.cameras[i];
				
				
				_thumbs = metadataLoader.getJsonInfo();
				
				var thumb  = _thumbs.thumbs[i];
														
				var width  = thumb.width;
				var height = thumb.height;
				var focalLength = cam.focal*Math.max(width, height);
				var aspectRatio = width / height;
				var fovy = 2.0 * Math.atan(height / (2.0*focalLength));
				var planeHeight = 2 * distanceFromCamera * Math.tan(fovy*0.5);
				var planeWidth  = planeHeight * aspectRatio;
				
				var pos = new THREE.Vector3(cam.position[0], cam.position[1], cam.position[2]);
				var rot = new THREE.Quaternion(cam.orientation[0], cam.orientation[1], cam.orientation[2], cam.orientation[3]);
				rot.multiplySelf(_qx);
								
				var c = new THREE.Vector3(); c.add(pos, rot.multiplyVector3(new THREE.Vector3(-planeWidth/2,  planeHeight/2, -distanceFromCamera), new THREE.Vector3()));
				var d = new THREE.Vector3(); d.add(pos, rot.multiplyVector3(new THREE.Vector3( planeWidth/2,  planeHeight/2, -distanceFromCamera), new THREE.Vector3()));
				var e = new THREE.Vector3(); e.add(pos, rot.multiplyVector3(new THREE.Vector3( planeWidth/2, -planeHeight/2, -distanceFromCamera), new THREE.Vector3()));
				var f = new THREE.Vector3(); f.add(pos, rot.multiplyVector3(new THREE.Vector3(-planeWidth/2, -planeHeight/2, -distanceFromCamera), new THREE.Vector3()));
				
				geometry.vertices.push(new THREE.Vertex(c));
				geometry.vertices.push(new THREE.Vertex(d));
				geometry.vertices.push(new THREE.Vertex(d));
				geometry.vertices.push(new THREE.Vertex(e));
				geometry.vertices.push(new THREE.Vertex(e));
				geometry.vertices.push(new THREE.Vertex(f));
				geometry.vertices.push(new THREE.Vertex(f));
				geometry.vertices.push(new THREE.Vertex(c));
				
				geometry.vertices.push(new THREE.Vertex(pos));
				geometry.vertices.push(new THREE.Vertex(c));
				geometry.vertices.push(new THREE.Vertex(pos));
				geometry.vertices.push(new THREE.Vertex(d));
				geometry.vertices.push(new THREE.Vertex(pos));
				geometry.vertices.push(new THREE.Vertex(e));
				geometry.vertices.push(new THREE.Vertex(pos));
				geometry.vertices.push(new THREE.Vertex(f));				
			}
		}

		
		
		_lines =  new THREE.Line(geometry, _camerasFrustrumMaterial, THREE.LinePieces);
		_camerasFrustrumMaterial.opacity = 0;
		//_scene.addObject(_lines);
	}
	
	// josh: works out Euler angles (ported from: http://forums.create.msdn.com/forums/p/4574/232603.aspx#232603 )
	function QuaternionToEuler(q) 
        { 
            var v = new THREE.Vector3();
 
            v.x = Math.atan2  
            ( 
                2 * q.y * q.w - 2 * q.x * q.z, 
                   1 - 2 * Math.pow(q.y, 2) - 2 * Math.pow(q.z, 2) 
            ); 
 
            v.z = Math.asin 
            ( 
                2 * q.x * q.y + 2 * q.z * q.w 
            ); 
 
            v.y = Math.atan2 
            ( 
                2 * q.x * q.w - 2 * q.y * q.z, 
                1 - 2 * Math.pow(q.x, 2) - 2 * Math.pow(q.z, 2) 
            ); 
 
            if (q.x * q.y + q.z * q.w == 0.5) 
            { 
                v.x = (2 * Math.atan2(q.x, q.w)); 
                v.y = 0; 
            } 
 
            else if (q.x * q.y + q.z * q.w == -0.5) 
            { 
                v.x = (-2 * Math.atan2(q.x, q.w)); 
                v.y = 0; 
            } 
 
            return v; 
        }  

	//to fix odd mixup of x and y
	/*function QuaternionToEuler(q) {
		var temp = brokenQuaternionToEuler(q);
		
		return new THREE.Vector3(temp.y, temp.x, temp.z);
		
	}*/
	
	//josh: vector to Degrees
	function vToDegrees(v) {
		v.x = v.x * (180/Math.PI);
		v.y = v.y * (180/Math.PI);
		v.z = v.z * (180/Math.PI);
		return v;
	}
	
	
	// josh: works out the relative orientation rotation of two quaternions in world  
	function relativeQuaternion(quatReference, quatNew){
		var first = new THREE.Quaternion(); first.copy(quatReference);first.inverse();  first.normalize();
		var second = new THREE.Quaternion(); second.copy(quatNew); 
        
		var relative = new THREE.Quaternion(); relative.copy(second);
		relative.multiplySelf(first);
		relative.normalize();
		return relative;
	}
	
	/*
	function updateCoordSystem(metadataLoader, coordSystemIndex, binFileIndex) {
		var coordSystem = metadataLoader.getCoordSystem(coordSystemIndex);
		coordSystem.pointClouds[binFileIndex] = new THREE.Geometry();
		
		var pointCloud = coordSystem.pointClouds[binFileIndex];
		for (var i=0; i<coordSystem.binFiles[binFileIndex].positions.length/3; ++i) {
			var vertex = new THREE.Vertex(new THREE.Vector3(coordSystem.binFiles[binFileIndex].positions[i*3+0], 
															coordSystem.binFiles[binFileIndex].positions[i*3+1], 
															coordSystem.binFiles[binFileIndex].positions[i*3+2]));
			pointCloud.vertices.push(vertex);
			var color = new THREE.Color(0xffffff);
			color.setRGB(coordSystem.binFiles[binFileIndex].colors[i*3+0], 
						 coordSystem.binFiles[binFileIndex].colors[i*3+1], 
						 coordSystem.binFiles[binFileIndex].colors[i*3+2]);
			pointCloud.colors.push(color);
		}		
		_particleSystems[binFileIndex] = new THREE.ParticleSystem(pointCloud, _pointCloudMaterial);
		_scene.addChild(_particleSystems[binFileIndex]);
	}*/
	
	function clearScene() {
		/*for (var i=0; i<_particleSystems.length; ++i)
			_scene.removeChild(_particleSystems[i]);
		_particleSystems = [];
		
		if (_lines) {
			_scene.removeChild(_lines);
		}
		_lines = undefined;*/
	}
	
	this.load = function(guid) {
		
		_guid = guid;
		
		var loaderInfo = _div.getElementsByClassName("loader-info")[0];
		loaderInfo.innerHTML = _imgLoading;
		
		var infoPanel = _div.getElementsByClassName("info-panel")[0];
		infoPanel.innerHTML = "";
		
		_loader = new PhotoSynthMetadataLoader(guid, {
			onComplete : function() {
				loaderInfo.innerHTML = "Loaded";
				// just load the first one!
				index = 0;
				initCoordSystem(_loader, index);
				_loader.loadCoordSystem(index, {
					onStart : function() {											
						var firstCameraIndex = getIndexOfFirstCamera(_loader, index);
						_currentCoordIndex = index;
						if (firstCameraIndex != -1) {
							_currentCameraIndex = firstCameraIndex;
							_that.moveToCamera(_currentCoordIndex, _currentCameraIndex, {});
						}							
					}
				});
			},
			onProgress : function(loader) {
				if (loader.state == 0) {
					loaderInfo.innerHTML = "Loading Soap " + _imgLoading;
				}
				else if (loader.state == 1) {
					loaderInfo.innerHTML = "Loading Json " + _imgLoading;
				}
				else if (loader.state == 2)
				{
					var ul = new Element("ul", {"class": "acc"});
					
					for (var i=0; i<loader.getNbCoordSystems(); ++i) {
						
						var nbCameras        = loader.getNbCameras(i);
						var approxNbVertices = loader.getNbBinFiles(i) * 5000;
						
						if (nbCameras > 2) {
							var li = new Element("li");
							var h3 = new Element("h3");
							var span = new Element("span", {"class": "right"});
							
							span.appendChild(document.createTextNode(nbCameras + " images ~" + approxNbVertices/1000+"k vertices"));
							h3.appendChild(document.createTextNode("Coord system " + i + ":"));
							h3.appendChild(span);							
							li.appendChild(h3);							
							
							var divAccSection = new Element("div", {"class" : "acc-section" });
							var divAccContent = new Element("div", {"class" : "acc-content"});
							var approxSize = loader.getNbBinFiles(i) * 83;
							approxSize = (approxSize < 1024) ? approxSize + "ko" : Math.round(approxSize/10)/100+"Mo";
							var input = new Element("input", { type: "button", 'class': 'load', value : "Load (~"+approxSize+")" });
							
							divAccContent.appendChild(input);
							divAccSection.appendChild(divAccContent);
							li.appendChild(divAccSection);
							
							(function(div_elt) {
								Event.observe(input, "click", function(index) {
									return function() {
										initCoordSystem(loader, index);
										loader.loadCoordSystem(index, {
											onStart : function() {											
												var firstCameraIndex = getIndexOfFirstCamera(loader, index);
												_currentCoordIndex = index;
												if (firstCameraIndex != -1) {
													//_that.setCamera(index, firstCameraIndex);
													_currentCameraIndex = firstCameraIndex;
													_that.moveToCamera(_currentCoordIndex, _currentCameraIndex, {});
												}
																								
											},
											onProgress : function(loader, coordSystemIndex, binFileIndex, percent) {
												div_elt.innerHTML = Math.round(percent*100)+"%";
												//updateCoordSystem(loader, coordSystemIndex, binFileIndex);
											},											
											onComplete : function() {
												div_elt.innerHTML = "";
												
												var span = div_elt.parentNode.parentNode.getElementsByTagName("h3")[0].getElementsByTagName("span")[0];
												span.innerHTML = "";
												var nbCameras  = loader.getNbCameras(index);
												var nbVertices = loader.getNbVertices(index);
												if (nbVertices > 1000) 
													nbVertices = Math.round(nbVertices/1000)+"k";												
												span.appendChild(document.createTextNode(" (" + nbCameras + " images, " + nbVertices + " vertices) "));
												
												/*var p = new Element("p", {'class': 'download'});
												p.appendChild(document.createTextNode("Download ply: "));
												var span0 = document.createElement("span");
												p.appendChild(span0);
												p.appendChild(document.createTextNode(", with cameras: "));
												var span1 = document.createElement("span");
												p.appendChild(span1);
												
												div_elt.appendChild(p);
												
												Downloadify.create(span0, {
													filename: 'coord_system_' + index + '.ply',
													data: function() { return _that.getCoordSystemAsPly(loader, index, false); },
													swf: 'swf/downloadify.swf',
													downloadImage: 'img/downloadify.png',
													width: 16,
													height: 16,
													transparent: true,
													append: true
												});
												
												Downloadify.create(span1, {
													filename: 'coord_system_' + index + '_with_cameras.ply',
													data: function() { return _that.getCoordSystemAsPly(loader, index, true); },
													swf: 'swf/downloadify.swf',
													downloadImage: 'img/downloadify.png',
													width: 16,
													height: 16,
													transparent: true,
													append: true
												});*/
												
												var coordSystem = loader.getCoordSystem(index);												
												
												/*
												var select = new Element("select", {});
												Event.observe(select, "change", function() {
													_that.moveToCamera(index, this.value, {});
												});
												
												var cameraIndex = 0;
												for (var i=0; i<coordSystem.cameras.length; ++i) {
													if (coordSystem.cameras[i] !== undefined) {
														var option = new Element("option", { value: i});
														option.appendChild(document.createTextNode("camera "+cameraIndex));
														select.appendChild(option);														
														cameraIndex++;
													}
												}				
												div_elt.appendChild(select);												
												*/
												
												var divCoverflow = new Element("div", {'class': 'imageflow', 'id': 'coverflow_'+index});
												for (var i=0; i<coordSystem.cameras.length; ++i) {
													if (coordSystem.cameras[i] !== undefined) {
														var img = new Element("img", {alt: "", src: _loader.getJsonInfo().thumbs[i].url, index: i});
														divCoverflow.appendChild(img);
													}
												}
												div_elt.appendChild(divCoverflow);
												var coverflow = new ImageFlow();
												coverflow.init({
													ImageFlowID:'coverflow_'+index , 
													reflections: false, 
													onClick: function() {
														_that.moveToCamera(index, this.getAttribute('index'), {
															onComplete: function() {
																_isCameraTopView = false;
															}
														});
													}
												});
											}
										});
									}
								}(i));
							})(divAccContent)
							
							ul.appendChild(li);
						}
					}
					infoPanel.appendChild(ul);
					new Accordion(ul, {
						onChange : function(index) {
							if (_loader.isCoordSystemLoaded(index)) {
								displayCoordSystem(loader, index);																
								var firstCameraIndex = getIndexOfFirstCamera(loader, index);
								if (firstCameraIndex != -1) {
									_that.setCamera(index, firstCameraIndex);
									_currentCameraIndex = firstCameraIndex;
								}
																		
							}
						}
					});
				}
			}
		});
	};


	
	
}