function asyncForeach(array, callback, done) {
  // copy the original array
  array = array.map(function(item) { return item; });
  (function proceed(index){
    if (index === array.length) { 
      if (done) done();
    } else {
      callback(array[index], index, proceed.bind(this, ++index));
    }
  })(0);
}
