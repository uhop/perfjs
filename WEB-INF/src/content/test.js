var DB = require("google/appengine/ext/db");

var Test = exports.Test = DB.Model("Test", {
	title: new DB.StringProperty({required: true, multiline: false})
});

Test.prototype.toString = function(){
    return this.title;
}
