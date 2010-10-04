var Test = require("content/models").Test,
    utils = require("utils");

exports.GET = function(request){
	// list available tests
	return {
		data: {
			tests: Test.all().fetch().map(utils.toJson)
		}
	};
};
