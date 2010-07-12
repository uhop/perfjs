var DB = require("google/appengine/ext/db"),
	TestGroup = require("./test_group").TestGroup;

var TestUnit = exports.TestUnit = DB.Model("TestUnit", {
	title:    new DB.StringProperty({required: true, multiline: false}),
    parent:   new DB.ReferenceProperty({referenceClass: TestGroup}),
    code:     new DB.TextProperty({required: true}),
    includes: new DB.TextProperty()
});

TestUnit.prototype.toString = function(){
    return this.title;
}


// augment TestGroup

var oldRemove = TestGroup.prototype.remove;
TestGroup.prototype.remove = function(){
	TestUnit.all().filter("parent =", this.key()).fetch().forEach(function(testUnit){
		testUnit.remove();
	});
	oldRemove.call(this);
}

TestGroup.prototype.removeStats = function(){
	TestUnit.all().filter("parent =", this.key()).fetch().forEach(function(testUnit){
		testUnit.removeStats();
	});
}
