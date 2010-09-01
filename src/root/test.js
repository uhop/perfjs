var Response = require("nitro/response").Response,
    Test = require("content/models").Test,
    utils = require("utils");

exports.GET = function(request){
    var slug = request.pathInfo,
        tests = Test.all().filter("slug =", slug).fetch();
    if(tests.length != 1){
        return Response.notFound();
    }
    var test = tests[0];
	return {
		data: {
			test: test.toJson(),
            groups: test.getGroups().map(utils.toJson),
            units: test.getUnits().map(utils.toJson)
            // TODO: add stats in some form
		}
	};
};
