var DB = require("google/appengine/ext/db");

var Test = exports.Test = DB.Model("Test", {
	title: new DB.StringProperty({required: true, multiline: false}),
	published: new DB.BooleanProperty({required: true, defaultValue: false})
});

Test.prototype.toString = function(){
    return this.title;
}
