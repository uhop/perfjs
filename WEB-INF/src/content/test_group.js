var DB = require("google/appengine/ext/db"),
	Test = require("./test").Test;

var TestGroup = exports.TestGroup = DB.Model("TestGroup", {
	title:  new DB.StringProperty({required: true, multiline: false}),
    parent: new DB.ReferenceProperty({referenceClass: Test})
});

TestGroup.prototype.toString = function(){
    return this.title;
}
