function Accordion(ul, options) {

	var _ul = ul;
	var _lis = [];	
	var _that = this;
	
	var _onChange = options.onChange || function() {};

	function collapseAll() {
		for (var i=0; i<_lis.length; ++i) {
			var div = _lis[i].getElementsByTagName("div")[0];
			div.style.height = 0 + "px";
			_lis[i].getElementsByTagName("h3")[0].className = "";
		}
	}

	function createElement(index) {
		var h3  = _lis[index].getElementsByTagName("h3")[0];
		var div = _lis[index].getElementsByTagName("div")[0];
		
		Event.observe(h3, "click", function(div_elt) {			
			return function() {
				if (parseInt(div_elt.style.height) == 0) {
					collapseAll();
					div_elt.style.height = "auto";
					this.className = "selected";
					_onChange(index);
				}
				else {
					div_elt.style.height = 0;
				}
			}
		}(div));
	}
	
	function build() {
		var lis = _ul.getElementsByTagName("li");		
		for (var i=0; i<lis.length; ++i) {
			if (lis[i].parentNode == ul) {
				_lis.push(lis[i]);
			}
		}	
		for (var i=0; i<_lis.length; ++i) {
			createElement(i);
		}
		collapseAll();
	}
	
	build();
}