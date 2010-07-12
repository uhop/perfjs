var Response = require("nitro/response").Response,
	users = require("google/appengine/api/users");

exports.onlyForRegisteredUsers = function(f){
	return function(){
		if(!users.getCurrentUser()){
			return Response.unauthorized();
		}
		return f.apply(this, arguments);
	}
};

exports.onlyForAdmins = function(f){
	return function(){
		if(!users.getCurrentUser() || !users.isCurrentUserAdmin()){
			return Response.unauthorized();
		}
		return f.apply(this, arguments);
	}
};
