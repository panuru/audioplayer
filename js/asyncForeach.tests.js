(function() {
  var stuff = [];

  module("asyncForeach", {
    teardown: function() { stuff = []; }
  });

  asyncTest("asyncForeach with random delays test", function() {
    asyncForeach([1, 2, 3], function(item, index, done) {
      setTimeout(function() {
        stuff.push(item);
        done();
      }, Math.random() * 1000);
    }, function() {
      deepEqual(stuff, [1, 2, 3], "should call async callbacks in correct order");
      start();
    });
  });

  asyncTest("asyncForeach on empty array test", function() {
    asyncForeach([], function(item, index, done) {
      ok(false, "should never get here");
    }, function() {
      deepEqual(stuff, [], "should call 'done' callback immediately");
      start();
    });
  });

  asyncTest('asyncForeach on a dynamically growing array', function () {
    var arr = [1, 2, 3];
    asyncForeach(arr, function(item, index, done) {
      setTimeout(function() {
        stuff.push(item);
        arr.push(item);
        done();
      }, Math.random() * 1000);
    }, function() {
      deepEqual(stuff, [1, 2, 3], 'should proceed 3 items');
      deepEqual(arr, [1, 2, 3, 1, 2, 3], 'should have tampered with original array');
      start()
    })
  });

  asyncTest('asyncForeach on a dynamically changing array', function () {
    var arr = [1, 2, 3];
    asyncForeach(arr, function(item, index, done) {
      setTimeout(function() {
        stuff.push(item);
        arr.pop();
        done();
      }, Math.random() * 1000);
    }, function() {
      deepEqual(stuff, [1, 2, 3], 'should proceed 3 original items');
      deepEqual(arr, [], 'should have removed all items from the original array');
      start()
    })
  });

})();
