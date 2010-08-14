var Response = require("nitro/response").Response,
	decorators = require("decorators");

var Test = require("content/test").Test,
    Form = require("google/appengine/ext/db/forms").ModelForm(Test);

function GET(request){
    var params = request.params;

	if(params.key){
		var test = Test.get(params.key);
		if(test){
            return {
                json: {
                    uri: "/api/test/?key=" + test.key(),
                    title: test.title,
                    description: test.description
                }
            };
        }
	}
    return Response.notFound();
}

function POST(request){
    var params = request.params,
        test = new Test();

    var form = new Form(params, {instance: test});

    try{
        form.put();
    }catch (errors){
        return Response.json({errors: errors});
    }

    return {
		json: {uri: "/api/test/?key=" + test.key()}
	};
}

function PUT(request){
    var params = request.params,
        test = Test.get(params.key);

    if(!test){
        return Response.notFound();
    }

    var form = new Form(params, {instance: test});

    try{
        form.put();
    }catch (errors){
        return Response.json({errors: errors});
    }

    return {
		json: {uri: "/api/test/?key=" + test.key()}
	};
}

function DELETE(request){
    var params = request.params,
        test = Test.get(params.key);

    if(test){
        test.remove();
        return Response.ok();
    }
    return Response.notFound();
}

exports.GET    = GET;
exports.POST   = decorators.onlyForAdmins(POST);
exports.PUT    = decorators.onlyForAdmins(PUT);
exports.DELETE = decorators.onlyForAdmins(DELETE);
