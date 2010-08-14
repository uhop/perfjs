var Group = require("content/group").Group,
    groupApi = require("./group");

function GET(request){
	// list available tests
	return {
		json: Group.all().fetch().map(function(group){
			return {
				uri:    "/api/group/?key=" + group.key(),
				parent: "/api/test/?key=" + group.parent.key(),
				title:  group.title,
				description: group.description
			};
		})
	};
}

exports.GET  = GET;
exports.POST = groupApi.POST;
