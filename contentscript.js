/*
	Copyright (c) 2011 ASTRE Henri (http://www.visual-experiments.com)

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.
*/

(function() {

	function createInlineWebGLViewer(parent, guid) {
		
		var parentDiv = document.createElement("div");
		parentDiv.style.backgroundColor = "black";
		parentDiv.style.width = "100%";
		parentDiv.style.height = "560px";
		
		var gui = document.createElement("div");
		gui.setAttribute("id", "gui");
		
		var div = document.createElement("div");
		div.setAttribute("style", "width: 675px; height: 585px; float: left");					
		
		var loaderInfo = document.createElement("div");
		loaderInfo.setAttribute("class", "loader-info");
		
		var canvasContainer = document.createElement("div");
		canvasContainer.setAttribute("class", "canvas-container");

		var canvasController = document.createElement("div");
		canvasController.setAttribute("class", "canvas-controller");
		
		{ //canvasController content
			var p = document.createElement("p");
			p.appendChild(document.createTextNode("Point size: "));
			
			var range = document.createElement("input");
			range.setAttribute("type", "range");
			range.setAttribute("min", "0.0125");
			range.setAttribute("max", "0.1");
			range.setAttribute("step", "0.0125");
			range.setAttribute("style", "vertical-align: middle");
			range.addEventListener("change", function() {
				viewer.setPointSize(this.value);
			}, false);
			p.appendChild(range);
			
			p.appendChild(document.createTextNode(" | Cameras Frustrum visible: "));
			
			var checkbox = document.createElement("input");
			checkbox.setAttribute("type", "checkbox");
			checkbox.addEventListener("change", function() {
				viewer.setCamerasFrustrumVisibility(this.checked);
			}, false);			
			p.appendChild(checkbox);
			
			p.appendChild(document.createTextNode(" | "));
			
			var button = document.createElement("input");
			button.setAttribute("type", "button");
			button.setAttribute("value", "Top View");
			button.addEventListener("click", function() {
				viewer.toggleTopView();
			}, false);
			p.appendChild(button);			
			
			// closest test button
			
			p.appendChild(document.createTextNode(" | "));
			
			var testbutton = document.createElement("input");
			testbutton.setAttribute("type", "button");
			testbutton.setAttribute("value", "Test");
			testbutton.addEventListener("click", function() {
				viewer.test();
			}, false);
			

			p.appendChild(testbutton);	
			
		
			Event.observe(window, 'keydown', function(event) {
				var char;
				if (event.which == null) {
					char= String.fromCharCode(event.keyCode);    // old IE
				} else if (event.which != 0) {
				     char= String.fromCharCode(event.which);	  // All others
				}
				switch(char)
				{
				case "Q":
					viewer.movement("rl");
					break;
				case "W":
					viewer.movement("f");
					break;
				case "E":
					viewer.movement("rr");
					break;
				case "A":
					viewer.movement("l");
					break;
				case "S":
					viewer.movement("b");
					break;
				case "D":
					viewer.movement("r");
					break;
				default:
				}
			});
			
			
			// swipe
			var down_x = null;
			var up_x = null;

			
			Event.observe(canvasContainer, 'mousedown', function(event) {
				down_x = event.pageX;
			});
			
			Event.observe(canvasContainer, 'mouseup', function(event) {
				up_x = event.pageX;
				do_work();
			});
			
			function do_work() {
				  if ((down_x - up_x) > 50)
				    {
				        slide_right();
				    }
				    if ((up_x - down_x) > 50)
				    {
				        slide_left();
				    }
			}

			function slide_right() {
				viewer.movement("rr");
			}
			
			function slide_left() {
				viewer.movement("rl");
			}
			
			//p.appendChild(document.createTextNode(" | "));
			canvasController.appendChild(p);
		}
		
		div.appendChild(loaderInfo);
		div.appendChild(canvasContainer);
		div.appendChild(canvasController);
		gui.appendChild(div);
		
		var infoPanel = document.createElement("div");
		infoPanel.setAttribute("class", "info-panel");
		
		gui.appendChild(infoPanel);
		parentDiv.appendChild(gui);
		parent.parentNode.insertBefore(parentDiv, parent);		
	}

	function getGuidFromUrl() {
		var url = document.URL;
		var tmp = url.split("view.aspx?cid=");
		if (tmp.length == 2) {
			return tmp[1];
		}
		else {
			return "";
		}
	}

	function isSilverlightEnable() {
		var plugins = navigator.plugins;
		for (var i=0; i<plugins.length; ++i) {
			if (plugins.item(i).name == "Silverlight Plug-In")
				return true;
		}
		return false;
	}
	
	var isOverCanvas = false;	
	var silverlightIsEnable = isSilverlightEnable();
	var silverlightDiv = document.getElementById("silverlightDiv");
	var guid = getGuidFromUrl();
	var viewer;
		
	document.onmousewheel = function(e) {
		if (isOverCanvas)
			return false; 
	};

	//Warning: there is a race condition between Microsoft script detecting Sylverlight and my script...
	//They are replacing the content of "silverlightDiv" with a innerHTML call if Sylverlight is desactivated
	//Thus it will remove my canvas if I add it in "silverlightDiv" before their call to innerHTML :-(
	//->This is why I have added the canvas before "silverlightDiv" and not as a child
	
	if (guid != "" && !silverlightIsEnable) { //Silverlight is desactivated and were are on a page with a viewable synth
		
		silverlightDiv.style.display = "none";
		
		createInlineWebGLViewer(silverlightDiv, guid);
		viewer = new PhotoSynthViewer(document.getElementById("gui"));
		viewer.load(guid);
		
	}
	else if (guid != "" && silverlightIsEnable){ //Silverlight is activated and were are on a page with a viewable synth
		
		//Should warn the user to desactivate Silverlight or this extension
	}
})();