var Response = require("nitro/response").Response,
	decorators = require("decorators");

var Unit = require("content/unit").Unit,
    Form = require("google/appengine/ext/db/forms").ModelForm(Unit);

function GET(request){
    var params = request.params;

	if(params.key){
		var unit = Unit.get(params.key);
		if(unit){
            return {
                json: {
                    uri:    "/api/unit/?key=" + unit.key(),
                    parent: "/api/group/?key=" + unit.parent.key(),
                    title:  unit.title,
                    description: unit.description,
                    code:   unit.code,
                    includes: unit.includes
                }
            };
        }
	}
    return Response.notFound();
}

function POST(request){
    var params = request.params,
        unit = new Unit();

    var form = new Form(params, {instance: unit});

    try{
        form.put();
    }catch (errors){
        return Response.json({errors: errors});
    }

    return {
		json: {uri: "/api/unit/?key=" + unit.key()}
	};
}

function PUT(request){
    var params = request.params,
        unit = Unit.get(params.key);

    if(!unit){
        return Response.notFound();
    }

    var form = new Form(params, {instance: unit});

    try{
        form.put();
    }catch (errors){
        return Response.json({errors: errors});
    }

    return {
		json: {uri: "/api/unit/?key=" + unit.key()}
	};
}

function DELETE(request){
    var params = request.params,
        unit = Unit.get(params.key);

    if(unit){
        unit.remove();
        return Response.ok();
    }
    return Response.notFound();
}

exports.GET    = GET;
exports.POST   = decorators.onlyForAdmins(POST);
exports.PUT    = decorators.onlyForAdmins(PUT);
exports.DELETE = decorators.onlyForAdmins(DELETE);
