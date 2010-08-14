var Unit = require("content/unit").Unit,
    unitApi = require("./unit");

function GET(request){
	// list available tests
	return {
		json: Unit.all().fetch().map(function(unit){
			return {
				uri:    "/api/unit/?key=" + unit.key(),
				parent: "/api/group/?key=" + unit.parent.key(),
				title:  unit.title,
				description: unit.description,
				code:   unit.code,
				includes: unit.includes
			};
		})
	};
}

exports.GET  = GET;
exports.POST = unitApi.POST;
