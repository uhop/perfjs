var Response = require("nitro/response").Response,
	users = require("google/appengine/api/users");

exports.allowedUser = function(userId){
    var user = users.getCurrentUser();
    return user && (user.userId === userId || users.isCurrentUserAdmin()); 
};

exports.toJson = function(o){
    return o.toJson();
};

exports.getItems = function(key, kind, items){
    if(key){
        var o = kind.get(key);
        if(o){
            return {
                json: o[items].map(toJson)
            };
        }
        return Response.notFound();
    }
    return null;
};

exports.standardGet = function(kind){
    return function(request){
        var key = request.pathInfo;
        if(key){
            var o = kind.get(key);
            if(o){
                return {
                    json: o.toJson()
                };
            }
        }
        return Response.notFound();
    };
};
