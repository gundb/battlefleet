
if (typeof document !== 'undefined') {
	
	  // create 40 cells
	// divide them into 4 classes
	var classes = [
	  ['first', 'second'],
	  ['third', 'fourth']
	];
	function create(element) {
	  return document.createElement(element);
	}
	function append(element, parent) {
	  var child = create(element);
	  parent.appendChild(child);
	  return child;
	}
	function getClass(x, y) {
	  var top = y < 10 ? 0 : 1;
	  var left = x < 10 ? 0 : 1;
	  return classes[top][left];
	}
	function getTable(x, y) {
	  var selector = '.' + getClass(x, y);
	  selector += ' table';
	  return document.querySelector(selector);
	}
	function populate(row) {
		for (var x = 0; x < 10; x++) {
	  	var cell = append('td', row);
		}
	}
	

}