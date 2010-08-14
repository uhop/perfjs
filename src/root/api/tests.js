var Test = require("content/test").Test,
    testApi = require("./test");

function GET(request){
	// list available tests
    return {
		json: Test.all().fetch().map(function(test){
			return {
				uri: "/api/test/?key=" + test.key(),
				title: test.title,
				description: test.description
			};
		})
	};
}

exports.GET  = GET;
exports.POST = testApi.POST;
