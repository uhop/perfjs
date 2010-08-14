var Response = require("nitro/response").Response,
	decorators = require("decorators");

var Stat = require("content/stat").Stat,
    Form = require("google/appengine/ext/db/forms").ModelForm(Stat);

function GET(request){
    var params = request.params;

	if(params.key){
		var stat = Stat.get(params.key);
		if(stat){
            return {
                json: {
                    uri:           "/api/stat/?key=" + stat.key(),
                    parent:        "/api/unit/?key=" + stat.parent.key(),
                    timestamp:     stat.timestamp,
                    userAgent:     stat.userAgent,
                    browser:       stat.browser,
                    version:       stat.version,
                    repetitions:   stat.repetitions,
                    length:        stat.length,
                    average:       stat.average,
                    minimum:       stat.minimum,
                    maximum:       stat.maximum,
                    median:        stat.median,
                    lowerQuartile: stat.lowerQuartile,
                    upperQuartile: stat.upperQuartile,
                    firstDecile:   stat.firstDecile,
                    lastDecile:    stat.lastDecile
                }
            };
        }
	}
    return Response.notFound();
}

function POST(request){
    var params = request.params,
        stat = new Stat();

    var form = new Form(params, {instance: stat});

    try{
        form.put();
    }catch (errors){
        return Response.json({errors: errors});
    }

    return {
		json: {uri: "/api/stat/?key=" + stat.key()}
	};
}

function PUT(request){
    var params = request.params,
        stat = Stat.get(params.key);

    if(!stat){
        return Response.notFound();
    }

    var form = new Form(params, {instance: stat});

    try{
        form.put();
    }catch (errors){
        return Response.json({errors: errors});
    }

    return {
		json: {uri: "/api/stat/?key=" + stat.key()}
	};
}

function DELETE(request){
    var params = request.params,
        stat = Stat.get(params.key);

    if(stat){
        stat.remove();
        return Response.ok();
    }
    return Response.notFound();
}

exports.GET    = GET;
exports.POST   = POST;
exports.PUT    = decorators.onlyForAdmins(PUT);
exports.DELETE = decorators.onlyForAdmins(DELETE);
