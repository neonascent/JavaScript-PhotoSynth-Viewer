function PhotoSynthViewer(div) {
	
	var _div        = div;
	var _container  = div.getElementsByClassName("canvas-container")[0];
	var _controller = div.getElementsByClassName("canvas-controller")[0];
	var _width      = Element.getWidth(_container);
	var _height     = Element.getHeight(_container);	
	var _that       = this;
	
	var _renderer;	
	var _scene;
	var _particleSystems = [];
	var _lines;
	var _pointCloudMaterial;
	var _camerasFrustrumMaterial;
	var _stats;
	var _loader;	
	
	//camera
	var _camera;
	var _qx   = new THREE.Quaternion(1.0, 0.0, 0.0, 0.0);
	var _fov  = 45;
	var _near = 0.01;
	var _far  = 1000;
	var _prevCameraPosition;
	var _prevCameraRotation;
	var _isCameraTopView = false;
	
	this.getCamera = function() {
		return _camera;
	};
	
	this.getLoader = function() {
		return _loader;
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
	
	this.setCamera = function(coordSystemIndex, cameraIndex) {
		var cam = _loader.getCamera(coordSystemIndex, cameraIndex);
		_camera.position = new THREE.Vector3(cam.position[0], cam.position[1], cam.position[2]);
		_camera.quaternion = new THREE.Quaternion(cam.orientation[0], cam.orientation[1], cam.orientation[2], cam.orientation[3]);
		_camera.quaternion.multiplySelf(_qx);
	};
	
	this.moveToCamera = function(coordSystemIndex, cameraIndex, options) {
		var cam = _loader.getCamera(coordSystemIndex, cameraIndex);
		var dstPosition = new THREE.Vector3(cam.position[0], cam.position[1], cam.position[2]);
		var dstRotation = new THREE.Quaternion(cam.orientation[0], cam.orientation[1], cam.orientation[2], cam.orientation[3]);
		dstRotation.multiplySelf(_qx);
		
		moveCameraTo(dstPosition, dstRotation, options);
	};
	
	this.getCoordSystemAsPly = function(metadataLoader, coordSystemIndex, withCamera) {
		
		var coordSystem = metadataLoader.getCoordSystem(coordSystemIndex);
		var nbVertices  = metadataLoader.getNbVertices(coordSystemIndex);
		if (withCamera)
			nbVertices += 2*metadataLoader.getNbCameras(coordSystemIndex);		
		
		var output = "";
		output +="ply\n";
		output +="format ascii 1.0\n";
		output +="comment Created using PhotoSynthWebGL Viewer from http://www.visual-experiments.com\n";
		output +="comment PhotoSynth downloaded from: http://photosynth.net/view.aspx?cid=" + metadataLoader.getSoapInfo().guid + "\n";			
		output +="element vertex " + nbVertices + "\n";
		output +="property float x\n";
		output +="property float y\n";
		output +="property float z\n";
		output +="property uchar diffuse_red\n";
		output +="property uchar diffuse_green\n";
		output +="property uchar diffuse_blue\n";
		output +="end_header\n";
		
		for (var i=0; i<coordSystem.nbBinFiles; ++i) {
			var binFile = coordSystem.binFiles[i];
			for (var j=0; j<binFile.positions.length/3; ++j) {
				var posx   = binFile.positions[j*3+0];
				var posy   = binFile.positions[j*3+1];
				var posz   = binFile.positions[j*3+2];				
				var colorr = binFile.colors[j*3+0];
				var colorg = binFile.colors[j*3+1];
				var colorb = binFile.colors[j*3+2];
				output += posx + " " + posy + " " + posz + " " + Math.round(colorr*255) + " " + Math.round(colorg*255) + " " + Math.round(colorb*255) + "\n";
			}						
		}
		
		if (withCamera) {
			var cameraIndex = 0;
			
			var offset = new THREE.Vector3(0.0, 0.0, -0.05);
			
			for (var i=0; i<coordSystem.cameras.length; ++i) {
				if (coordSystem.cameras[i] !== undefined) {
					var cam = metadataLoader.getCamera(coordSystemIndex, i);
					var pos = new THREE.Vector3(cam.position[0], cam.position[1], cam.position[2]);
					if ((cameraIndex % 2) == 0)
						output += pos.x + " " + pos.y + " " + pos.z + " 0 255 0\n";
					else
						output += pos.x + " " + pos.y + " " + pos.z + " 255 0 0\n";					
					var camInverse = (new THREE.Quaternion(cam.orientation[0], cam.orientation[1], cam.orientation[2], cam.orientation[3])).inverse();
					var p = (new THREE.Vector3()).add(new THREE.Vector3(cam.position[0], cam.position[1], cam.position[2]), camInverse.multiplyVector3(offset, new THREE.Vector3())); //p = cam.position + cam.orientation.Inverse() * offset
					output += p.x + " " + p.y + " " + p.z + " 255 255 0\n";
					cameraIndex++;
				}
			}
		}
		console.log(output);
		return output;
	};
	
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
	
	var _imgLoading = '<img src="'+chrome.extension.getURL('img/loading.gif')+'" alt="" />';
	
	function setupScene() {
		
		_camera   = new THREE.Camera(45, _width / _height, 0.01, 1000); //fov ratio near far
		_camera.position.z = 20;
		_camera.useTarget = false;
		_camera.useQuaternion = true;
		_renderer = new THREE.WebGLRenderer();		
		_scene    = new THREE.Scene();
		_renderer.setSize(_width, _height);
		_container.appendChild(_renderer.domElement);
		
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
			console.log("keydown");
		});

		Event.observe(_renderer.domElement, "keyup", function(event) {
			console.log("keyup");
		});
		
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
		
		setInterval(function(){
			_renderer.render(_scene, _camera);
			_stats.update();
		}, 1000/60);
		
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
		for (var i=0; i<coordSystem.nbBinFiles; ++i) {
			updateCoordSystem(metadataLoader, coordSystemIndex, i);
		}
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
				var thumb  = metadataLoader.getJsonInfo().thumbs[i];
														
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
		_scene.addObject(_lines);
	}
	
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
	}
	
	function clearScene() {
		for (var i=0; i<_particleSystems.length; ++i)
			_scene.removeChild(_particleSystems[i]);
		_particleSystems = [];
		
		if (_lines) {
			_scene.removeChild(_lines);
		}
		_lines = undefined;
	}
	
	this.load = function(guid) {
		
		var loaderInfo = _div.getElementsByClassName("loader-info")[0];
		loaderInfo.innerHTML = _imgLoading;
		
		var infoPanel = _div.getElementsByClassName("info-panel")[0];
		infoPanel.innerHTML = "";
		
		_loader = new PhotoSynthMetadataLoader(guid, {
			onComplete : function() {
				loaderInfo.innerHTML = "Loaded";
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
												if (firstCameraIndex != -1)
													_that.setCamera(index, firstCameraIndex);											
											},
											onProgress : function(loader, coordSystemIndex, binFileIndex, percent) {
												div_elt.innerHTML = Math.round(percent*100)+"%";
												updateCoordSystem(loader, coordSystemIndex, binFileIndex);
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
												
												var p = new Element("p", {'class': 'download'});
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
													swf: chrome.extension.getURL('swf/downloadify.swf'),
													downloadImage: chrome.extension.getURL('img/downloadify.png'),
													width: 16,
													height: 16,
													transparent: true,
													append: true
												});
												
												Downloadify.create(span1, {
													filename: 'coord_system_' + index + '_with_cameras.ply',
													data: function() { return _that.getCoordSystemAsPly(loader, index, true); },
													swf: chrome.extension.getURL('swf/downloadify.swf'),
													downloadImage: chrome.extension.getURL('img/downloadify.png'),
													width: 16,
													height: 16,
													transparent: true,
													append: true
												});
												
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
								if (firstCameraIndex != -1)
									_that.setCamera(index, firstCameraIndex);									
							}
						}
					});
				}
			}
		});
	};
}