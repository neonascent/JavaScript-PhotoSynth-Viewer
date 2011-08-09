function ArrayReader(input) {
	var _input = new jDataView(input);
	
	this.ReadCompressedInt = function() {
		var i = 0;
		var b;
		do {
			b = _input.getUint8();
			i = (i << 7) | (b & 127);
		} while (b < 128);
		
		return i;
	};
	
	this.ReadBigEndianSingle = function() {
		var b0 = _input.getUint8();
		var b1 = _input.getUint8();
		var b2 = _input.getUint8();
		var b3 = _input.getUint8();
		
		var sign = 1 - (2 * (b0 >> 7));
		var exponent = (((b0 << 1) & 0xff) | (b1 >> 7)) - 127;
		var mantissa = ((b1 & 0x7f) << 16) | (b2 << 8) | b3;

		if (mantissa == 0 && exponent == -127)
			return 0.0;

		return sign * (1 + mantissa * Math.pow(2, -23)) * Math.pow(2, exponent);
	};
	
	this.ReadBigEndianUInt16 = function() {
		var b0 = _input.getUint8();
		var b1 = _input.getUint8();
		
		return (b1 | b0 << 8);
	};		
}