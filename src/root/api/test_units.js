var Request = require("nitro/request").Request,
    Response = require("nitro/response").Response,
	decorators = require("decorators");

var TestUnit = require("content/test_unit").TestUnit,
    Form = require("google/appengine/ext/db/forms").ModelForm(TestUnit),
	StatUnit = require("content/stat_unit").StatUnit;

function GET(env){
    var params = new Request(env).params;

	if(params.key){
		var testUnit = TestUnit.get(params.key);
		if(!testUnit){
			return Response.notFound();
		}
		return {
			json: {
				uri:    "/api/test_units/?key=" + testUnit.key(),
				parent: "/api/test_groups/?key=" + testUnit.parent.key(),
				title:  testUnit.title,
				description: testUnit.description,
				code:   testUnit.code,
				includes: testUnit.includes
			}
		};
	}

	// list available tests
	return {
		json: TestUnit.all().fetch().map(function(testUnit){
			return {
				uri:    "/api/test_units/?key=" + testUnit.key(),
				parent: "/api/test_groups/?key=" + testUnit.parent.key(),
				title:  testUnit.title,
				description: testUnit.description,
				code:   testUnit.code,
				includes: testUnit.includes
			};
		})
	};
}

function POST(env){
    var params = new Request(env).params,
        testUnit = params.key ? TestUnit.get(params.key) : new TestUnit();

    var form = new Form(params, {instance: testUnit});

    try{
        form.put();
    }catch (errors){
        return Response.json({errors: errors});
    }

    return {
		json: {uri: "/api/test_units/?key=" + testUnit.key()}
	};
}

function DELETE(env){
    var params = new Request(env).params,
        testUnit = TestUnit.get(params.key);

    if(testUnit){
        testUnit.remove();
        return Response.ok();
    }
    return Response.notFound();
}

exports.GET = GET;
exports.POST = decorators.onlyForAdmins(POST);
exports.DELETE = decorators.onlyForAdmins(DELETE);
