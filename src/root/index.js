var Request = require("nitro/request").Request,
    Response = require("nitro/response").Response,
	users = require("google/appengine/api/users");

var Test = require("content/test").Test;

exports.GET = function(request){
	// list available tests
	return {
		data: {
			tests: Test.all().fetch().map(function(test){
				return {
					title: test.title,
					uri: "/api/tests/?key=" + test.key()
				};
			}),
			isAdmin: users.getCurrentUser() && users.isCurrentUserAdmin()
		}
	};
}
