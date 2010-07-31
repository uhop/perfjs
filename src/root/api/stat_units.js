var Request = require("nitro/request").Request,
    Response = require("nitro/response").Response,
	decorators = require("decorators");

var StatUnit = require("content/stat_unit").StatUnit,
    Form = require("google/appengine/ext/db/forms").ModelForm(StatUnit);

function GET(env){
    var params = new Request(env).params;

	if(params.key){
		var statUnit = StatUnit.get(params.key);
		if(!statUnit){
			return Response.notFound();
		}
		return {
			json: {
				uri:           "/api/stat_units/?key=" + statUnit.key(),
				parent:        "/api/test_units/?key=" + statUnit.parent.key(),
				timestamp:     statUnit.timestamp,
				userAgent:     statUnit.userAgent,
				browser:       statUnit.browser,
				version:       statUnit.version,
				repetitions:   statUnit.repetitions,
				length:        statUnit.length,
				average:       statUnit.average,
				minimum:       statUnit.minimum,
				maximum:       statUnit.maximum,
				median:        statUnit.median,
				lowerQuartile: statUnit.lowerQuartile,
				upperQuartile: statUnit.upperQuartile,
				firstDecile:   statUnit.firstDecile,
				lastDecile:    statUnit.lastDecile
			}
		};
	}

	// list available tests
	return {
		json: StatUnit.all().fetch().map(function(statUnit){
			return {
				uri:           "/api/stat_units/?key=" + statUnit.key(),
				parent:        "/api/test_units/?key=" + statUnit.parent.key(),
				timestamp:     statUnit.timestamp,
				userAgent:     statUnit.userAgent,
				browser:       statUnit.browser,
				version:       statUnit.version,
				repetitions:   statUnit.repetitions,
				length:        statUnit.length,
				average:       statUnit.average,
				minimum:       statUnit.minimum,
				maximum:       statUnit.maximum,
				median:        statUnit.median,
				lowerQuartile: statUnit.lowerQuartile,
				upperQuartile: statUnit.upperQuartile,
				firstDecile:   statUnit.firstDecile,
				lastDecile:    statUnit.lastDecile
			};
		})
	};
}

function POST(env){
	if(!users.getCurrentUser()){
		return Response.unauthorized();
	}

    var params = new Request(env).params,
        statUnit = params.key ? StatUnit.get(params.key) : new StatUnit();

    var form = new Form(params, {instance: statUnit});

    try{
        form.put();
    }catch (errors){
        return Response.json({errors: errors});
    }

    return {
		json: {uri: "/api/stat_units/?key=" + statUnit.key()}
	};
}

function DELETE(env){
	if(!users.isCurrentUserAdmin()){
		return Response.unauthorized();
	}

    var params = new Request(env).params,
        statUnit = StatUnit.get(params.key);

    if(statUnit){
        statUnit.remove();
        return Response.ok();
    }
    return Response.notFound();
}

exports.GET = GET;
exports.POST = POST;
exports.DELETE = decorators.onlyForAdmins(DELETE);
