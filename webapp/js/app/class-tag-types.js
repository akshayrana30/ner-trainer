define(['underscore-contrib','d3','jquery'], function(_, d3, $){

  var tags = [];
  var colors = d3.scale.category20c();

  var init = function(){
    console.log("---- INSIDE CLASS TAGS ----")
    return $.ajax({
      url:'js/types_classification.json',
      type:"GET",
      contentType:"application/json; charset=utf-8"}).done(function(resp){
        
        if (navigator.appVersion.indexOf("Win")!=-1){
          // **** WINDOWS ****
          temp = JSON.parse(resp)
          tags = temp.types;
          }
          else if (navigator.appVersion.indexOf("Linux")!=-1){
          // **** LINUX ****
          tags = resp.types
          temp = resp;
          }
          else{
            alert("OS Version not identified. Make changes manually in markup_view.html")
          }

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
