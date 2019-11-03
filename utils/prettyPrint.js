var print = require('pretty-print');
var options = {
	rightPadding: 3
};

print(
	[
		{
			name: 'guy',
			height: 'short'
		},
		{
			name: 'girl',
			height: 'short'
		}
	],
	options
);

// outputs:
//
// guy:   short
// girl:  short

module.exports = {
	Single: function(key, value) {
		print([
			{
				name: key,
				value: value
			}
		]);
	},
	Array: function(array) {
		print(array);
	}
};
