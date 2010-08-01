var Test = require("content/test").Test;

exports.GET = function(env){
	// list available tests
	return {
		data: {
			create_uri: "/admin/test",
			tests: Test.all().fetch().map(function(test){
				return {
					title:       test.title,
					description: test.description,
					view_uri:    test.view_uri(),
					edit_uri:    test.edit_uri()
				};
			})
		}
	};
}
