var Request = require("nitro/request").Request,
    Response = require("nitro/response").Response,
	decorators = require("decorators");

var Test = require("content/test").Test,
    Form = require("google/appengine/ext/db/forms").ModelForm(Test),
	TestGroup = require("content/test_group").TestGroup,
	TestUnit = require("content/test_unit").TestUnit,
	StatUnit = require("content/stat_unit").StatUnit;

function GET(env){
    var params = new Request(env).params;

	if(params.key){
		var test = Test.get(params.key);
		if(!test){
			return Response.notFound();
		}
		return Response.json({
			uri: "/api/tests/?key=" + test.key(),
			title: test.title
		});
	}

	// list available tests
	var tests = Test.all().fetch();
	return Response.json(tests.map(function(test){
		return {
			uri: "/api/tests/?key=" + test.key(),
			title: test.title
		};
	}));
}

function POST(env){
    var params = new Request(env).params,
        test = params.key ? Test.get(params.key) : new Test();

    var form = new Form(params, {instance: test});

    try{
        form.put();
    }catch (errors){
        return Response.json({errors: errors});
    }

    return Response.json({uri: "/api/tests/?key=" + test.key()});
}

function DELETE(env){
    var params = new Request(env).params,
        test = Test.get(params.key);

    if(test){
        test.remove();
        return Response.ok();
    }
    return Response.notFound();
}

exports.GET = GET;
exports.POST = decorators.onlyForAdmins(POST);
exports.DELETE = decorators.onlyForAdmins(DELETE);
