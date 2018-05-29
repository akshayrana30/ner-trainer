define(['underscore-contrib','d3','jquery'], function(_, d3, $){

  var tags = [];
  var colors = d3.scale.category20c();

  var init = function(){
    return $.ajax({
      url:'js/types.json',
      type:"GET",
      contentType:"application/json; charset=utf-8"}).done(function(resp){
        
        // **** WINDOWS ****
        temp = JSON.parse(resp)
        tags = temp.types;

        // **** LINUX ****
        // tags = resp.types;

      });
  };

  // var init = function(){

  // };

  var save = function(){
    return $.ajax({
      url:'data/save_tags',
      type:"POST",
      data:JSON.stringify({ 'types' : tags }),
      contentType:"application/json; charset=utf-8",
      dataType:"json"
    }).done(function(resp){
      console.log("Akshay Rana");
      
      console.log(resp);
    });
  };

  var getTags = function(){
    return tags;
  };

  var setTags = function(tagList){
    tags = tagList.slice();
  };

  var addTag = function(sz, color){
    color = color || colors(tags.length);
    tags.push({'text' : sz, 'color': color});
  };
  
  return {
    init : init,
    refresh : init,
    getTags : getTags,
    setTags : setTags,
    save : save
  };});
