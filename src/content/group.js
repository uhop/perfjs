var DB = require("google/appengine/ext/db"),
	Test = require("./test").Test;

var Group = exports.Group = DB.Model("Group", {
        title:       new DB.StringProperty({required: true, multiline: false}),
        description: new DB.TextProperty(),
        parent:      new DB.ReferenceProperty({referenceClass: Test})
    });

Group.prototype.toString = function(){
    return this.title;
}

Group.prototype.api_uri = function(){
	return "/api/group/?key=" + this.key();
};

Group.prototype.view_uri = function(){
	return "/view/group/?key=" + this.key();
};

Group.prototype.edit_uri = function(){
	return "/admin/group/?key=" + this.key();
};

// augment Test

var oldRemove = Test.prototype.remove;
Test.prototype.remove = function(){
	Group.all().filter("parent =", this.key()).fetch().forEach(function(group){
		group.remove();
	});
	oldRemove.call(this);
};

Test.prototype.removeStats = function(){
	Group.all().filter("parent =", this.key()).fetch().forEach(function(group){
		group.removeStats();
	});
};
