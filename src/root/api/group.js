var Response = require("nitro/response").Response,
	decorators = require("decorators");

var Group = require("content/group").Group,
    Form = require("google/appengine/ext/db/forms").ModelForm(Group);

function GET(request){
    var params = request.params;

	if(params.key){
		var group = Group.get(params.key);
		if(group){
            return {
                json: {
                    uri:    "/api/group/?key=" + group.key(),
                    parent: "/api/test/?key=" + group.parent.key(),
                    title:  group.title,
                    description: group.description
                }
            };
        }
	}
    return Response.notFound();
}

function POST(request){
    var params = request.params,
        group = new Group();

    var form = new Form(params, {instance: group});

    try{
        form.put();
    }catch (errors){
        return Response.json({errors: errors});
    }

    return {
		json: {uri: "/api/group/?key=" + group.key()}
	};
}

function PUT(request){
    var params = request.params,
        group = Group.get(params.key);

    if(!group){
        return Response.notFound();
    }

    var form = new Form(params, {instance: group});

    try{
        form.put();
    }catch (errors){
        return Response.json({errors: errors});
    }

    return {
		json: {uri: "/api/group/?key=" + group.key()}
	};
}

function DELETE(request){
    var params = request.params,
        group = Group.get(params.key);

    if(group){
        group.remove();
        return Response.ok();
    }
    return Response.notFound();
}

exports.GET    = GET;
exports.POST   = decorators.onlyForAdmins(POST);
exports.PUT    = decorators.onlyForAdmins(PUT);
exports.DELETE = decorators.onlyForAdmins(DELETE);
