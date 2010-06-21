var DB = require("google/appengine/ext/db"),
	TestGroup = require("./test_group").TestGroup;

var TestUnit = exports.TestUnit = DB.Model("TestUnit", {
	title:  new DB.StringProperty({required: true, multiline: false}),
    parent: new DB.ReferenceProperty({referenceClass: TestGroup}),
    code:   new DB.TextProperty({required: true})
});

TestUnit.prototype.toString = function(){
    return this.title;
}
