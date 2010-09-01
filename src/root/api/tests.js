var Test = require("content/models").Test,
    toJson = require("utils"),
    testApi = require("./test");

function GET(request){
	// list available tests
    return {
		json: Test.all().fetch().map(toJson())
	};
}

exports.GET  = GET;
exports.POST = testApi.POST;
