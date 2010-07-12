var DB = require("google/appengine/ext/db"),
	Test = require("./test").Test;

var TestGroup = exports.TestGroup = DB.Model("TestGroup", {
	title:  new DB.StringProperty({required: true, multiline: false}),
    parent: new DB.ReferenceProperty({referenceClass: Test})
});

TestGroup.prototype.toString = function(){
    return this.title;
}


// augment Test

var oldRemove = Test.prototype.remove;
Test.prototype.remove = function(){
	TestGroup.all().filter("parent =", this.key()).fetch().forEach(function(testGroup){
		testGroup.remove();
	});
	oldRemove.call(this);
}

Test.prototype.removeStats = function(){
	TestGroup.all().filter("parent =", this.key()).fetch().forEach(function(testGroup){
		testGroup.removeStats();
	});
}
