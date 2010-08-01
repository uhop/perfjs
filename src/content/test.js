var DB = require("google/appengine/ext/db");

var Test = exports.Test = DB.Model("Test", {
	title:       new DB.StringProperty({required: true, multiline: false}),
    description: new DB.TextProperty(),
	published:   new DB.BooleanProperty({required: true, defaultValue: false})
});

Test.prototype.toString = function(){
    return this.title;
};

Test.prototype.api_uri = function(){
	return "/api/tests/?key=" + this.key();
};

Test.prototype.view_uri = function(){
	return "/view/test/?key=" + this.key();
};

Test.prototype.edit_uri = function(){
	return "/admin/test/?key=" + this.key();
};
