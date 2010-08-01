var DB = require("google/appengine/ext/db"),
	Test = require("./test").Test;

var TestGroup = exports.TestGroup = DB.Model("TestGroup", {
	title:       new DB.StringProperty({required: true, multiline: false}),
    description: new DB.TextProperty(),
    parent:      new DB.ReferenceProperty({referenceClass: Test})
});

TestGroup.prototype.toString = function(){
    return this.title;
}

TestGroup.prototype.api_uri = function(){
	return "/api/test_groups/?key=" + this.key();
};

TestGroup.prototype.view_uri = function(){
	return "/view/test_group/?key=" + this.key();
};

TestGroup.prototype.edit_uri = function(){
	return "/admin/test_group/?key=" + this.key();
};

// augment Test

var oldRemove = Test.prototype.remove;
Test.prototype.remove = function(){
	TestGroup.all().filter("parent =", this.key()).fetch().forEach(function(testGroup){
		testGroup.remove();
	});
	oldRemove.call(this);
};

Test.prototype.removeStats = function(){
	TestGroup.all().filter("parent =", this.key()).fetch().forEach(function(testGroup){
		testGroup.removeStats();
	});
};
