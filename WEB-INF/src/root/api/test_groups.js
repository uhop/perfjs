var Request = require("nitro/request").Request,
    Response = require("nitro/response").Response,
	decorators = require("decorators");

var TestGroup = require("content/test_group").TestGroup,
    Form = require("google/appengine/ext/db/forms").ModelForm(TestGroup),
	TestUnit = require("content/test_unit").TestUnit,
	StatUnit = require("content/stat_unit").StatUnit;

function GET(env){
    var params = new Request(env).params;

	if(params.key){
		var testGroup = TestGroup.get(params.key);
		if(!testGroup){
			return Response.notFound();
		}
		return {
			json: {
				uri:    "/api/test_groups/?key=" + testGroup.key(),
				parent: "/api/tests/?key=" + testGroup.parent.key(),
				title:  testGroup.title
			}
		};
	}

	// list available tests
	return {
		json: TestGroup.all().fetch().map(function(testGroup){
			return {
				uri:    "/api/test_groups/?key=" + testGroup.key(),
				parent: "/api/tests/?key=" + testGroup.parent.key(),
				title:  testGroup.title
			};
		})
	};
}

function POST(env){
    var params = new Request(env).params,
        testGroup = params.key ? TestGroup.get(params.key) : new TestGroup();

    var form = new Form(params, {instance: testGroup});

    try{
        form.put();
    }catch (errors){
        return Response.json({errors: errors});
    }

    return {
		json: {uri: "/api/test_groups/?key=" + testGroup.key()}
	};
}

function DELETE(env){
    var params = new Request(env).params,
        testGroup = TestGroup.get(params.key);

    if(testGroup){
        testGroup.remove();
        return Response.ok();
    }
    return Response.notFound();
}

exports.GET = GET;
exports.POST = decorators.onlyForAdmins(POST);
exports.DELETE = decorators.onlyForAdmins(DELETE);
