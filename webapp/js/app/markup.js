define(['underscore-contrib', 'ko', 'windows', 'app/main-window', 'app/routes', 'app/utils', 'app/entity-view', 'app/data','app/tag-types','app/class-tag-types',  'jquery','bootstrap', 'bootstrap.colorpicker'], function(_, ko, windows, main_window, routes, utils, entity_view, data, tag_types,class_tag_types,  $){
  var count = 0
  var current_training = null;



  var view = function(){
    var deferred = new $.Deferred();
    require(['text!templates/markup_view.html'], function(tmpl){
      deferred.resolve(tmpl);
    });
    return deferred.promise();
  };

  var getTags = function(){
    var tagged = _.map($('.markup-container').find('.tag'), function(tag){
      var t = $(tag).attr('class').replace('tag', '').trim();
      var start = +$(tag).children().first().attr('data-index');
      var end = +$(tag).children().last().attr('data-index') + 1;
      return [start, end, t];
    });
    return tagged;
  };

  var save = function(){
    console.log(current_training);
    data.clearTags(current_training);
    var addTag = _.partial(data.addTag, current_training);
    _.each(getTags(), function(t){
      addTag(t[0], t[1], t[2]);
    });
  };


  var render = function(el, i){
    
    current_training = i;

    view().then(function(tmpl){
      el.html(tmpl);
      var container = el.find(".markup-container").first();
      var id = ko.observable(data.trainings()[i].id);
      container.append(
        _.map(data.trainings()[i].tokens,
              function(part, i){ 
                return $('<span>').html(_.first(part)).attr("data-index", i);
              }));

      var navigate_home = _.partial(utils.navigate, routes.HOME())
      var navigate_next = function () {
        console.log(data.trainings())
        count = count + 1;
        var i = _.last(utils.current_route_array());
        // console.log("=========================")                
        var j = parseInt(i)
        // console.log("Count : "+count)
        // console.log("IS PREDICTION "+localStorage.getItem("isPrediction"))
        
        // if (_.isNumeric(i) && 
        //     (+i < data.trainings().length - 1)){
              if (count%2 ==0 && localStorage.getItem("isPrediction") == 'true'){
                count = 0
                data.clearTags(j+1)
                // data.addTag(j+1, 0, 2 , 'person')                
                tagDataWithPrediction(j+1)
                // alert("Send response now") 
                
               }
               else{
                utils.navigate(routes.TRAIN(+i + 1));                
               }
        // };
      };

      var tagDataWithPrediction = function(j){
          $.ajax({
            url:'http://localhost:5000/predict',
            type:"POST",
            data:JSON.stringify({'text' : data.trainings()[j].text}),
            contentType:"application/json; charset=utf-8",
            dataType:"json"
          }).done(function(resp){
          console.log(resp);
          for(var i in resp){
            var start = parseInt(resp[i].start)
            var end = parseInt(resp[i].end)
            var tag = resp[i].tag       
            data.addTag(j, start, end , tag)
            utils.navigate(routes.TRAIN(j));
          }
        }).fail(function(){
          console.log("save failed");
        });
      }


      var navigate_prev = function (){
        if (_.isNumeric(i) && 
            (+i > 0)){
              
          utils.navigate(routes.TRAIN(+i - 1));
        };
      };
      console.log(" --- INSIDE JS ---")
      var entity_types = ko.observableArray(tag_types.getTags());
      console.log(entity_types)
      // var class_types = ko.observableArray(class_tag_types.getTags());
      // console.log(class_types)

      // var classify_types = ko.observableArray(class_tag_types.getTags());

      var currentType = ko.observable(_.first(tag_types.getTags()));
      var setSelectedType = function(type){
        return function(){
          currentType(type);
        };
      };

      var selectedFn = function(type){
        return ko.computed(function(){
          // console.log(type.text);
          if (currentType()){
            // console.log(currentType().text.localeCompare(type.text) == 0);
            if (currentType().text.localeCompare(type.text) == 0){
              return type.color;
            }
          }
          $(".markup-container").focus();
          return "";          
        });
      };

      var auto_tag_builder = function(div, type){
        div.find('span').each(function(i, el){
          $(this).off("click");
        });
        div.removeClass().addClass("tag").addClass(type)
        div.on("click", function(){
          if(!$(this).hasClass("highlight")){
            var currentHighlight = $('.markup-container').find('div.highlight').first();
            if (currentHighlight.hasClass("tag")){
              currentHighlight.removeClass("highlight")
            } else {
              currentHighlight.find('span').first().unwrap();                
            }
            $(this).addClass("highlight");
          } else {
            $(this).removeClass("highlight");
          }
        });
      };

      var tag_highlight = function(){
        var highlight = $('.markup-container').find('div.highlight').first();
        //there is a highlight and it is not a tag
        if (_.some(highlight) && !highlight.hasClass("tag")){
          auto_tag_builder(highlight, currentType().text);
          save();
        }
      };

      var untag_highlight = function(){
        var highlight = $('.markup-container').find('div.highlight').first();
        if (highlight.hasClass("tag")){
          highlight.find('span').each(function(i, el){
            $(this).on("click", function(){
              handle_highlight($(this));
            });
          });
        }
        highlight.find('span').first().unwrap();
        save();
      };

      var checkKey = function(data, evt){
        var key_code = evt.keyCode;

        if (key_code == 37 || key_code == 39){
          var btns = $(".btn-group").find('button');

          var idx = utils.findIndex(btns, function(btn){
            return $(btn).attr("data-type") == currentType().text;
          });
          
          //left
          if (key_code == 37){
            if (idx == 0){
              idx = btns.length -1;
            } else {
              idx = idx - 1;
            }
          }
          //right
          if (key_code == 39){
            if (idx == btns.length -1){
              idx = 0;
            } else {
              idx = idx +1;
            }
          }
          var tag = _.find(tag_types.getTags(), function(t) {
            return t.text == $(btns[idx]).attr('data-type');
          });
          currentType(tag);
        }

        if (key_code == 84){
          tag_highlight();
        }

        if (key_code == 85){
          untag_highlight();
        }
      };

      var highlightBuilder = function(el){
        var div = $('<div>').addClass("highlight");
        $(el).wrap(div);
      };

      var handle_highlight = function(span){
        var right = span.nextAll().first();
        var left = span.prevAll().first(); 
        var currentHighlight = $(".markup-container").find("div.highlight").first();

        //there is no currentHighlight
        //and this span is not tagged
        if (_.not(_.some(currentHighlight)) 
            && _.not(span.parent().hasClass("tag"))){
          highlightBuilder(span);
          return;
        }

        if ($(span).parent().hasClass("highlight")){
          //remove highlighting if only 1 word is highlighted
          if (_.every([_.not(left.is("span")), _.not(right.is("span"))])){
            $(span).unwrap();
            return;
          }
          
          //this is the middle of a highlight
          //cannot unhighlight tokens from the middle 
          if (_.every([left.is("span"), right.is("span")])){
            return;
          }

          // remove from end
          if (_.every([left.is("span"), _.not(right.is("span"))])){
            $(span).detach().insertAfter(currentHighlight);
            return;
          }

          // remove from begining 
          if (_.every([_.not(left.is("span")), right.is("span")])){
            $(span).detach().insertBefore(currentHighlight);
            return;
          }
        }

        if (right.is(currentHighlight)){
          if (!currentHighlight.hasClass("tag")){
            span.detach().prependTo(currentHighlight);
          }
          return;
        }

        if (left.is(currentHighlight)){
          if (!currentHighlight.hasClass("tag")){
            span.detach().appendTo(currentHighlight);
          }
          return;
        }

        //highlight is somewhere else remove it and move the highlight
        //to the current location
        // if (currentHighlight.hasClass("tag")){
        //   currentHighlight.removeClass("highlight");
        // } else {
        //   currentHighlight.find('span').first().unwrap();
        // }
        // highlightBuilder(span);        

      };

      var akshay = function(){
        alert("Helloo");
      };

      var add_subtract_tags = function(call_url, write_url,func){
        // alert(call_url, write_url,func)
        var CSS_COLOR_NAMES = ["AliceBlue",,"Aqua","Aquamarine","Azure","Bisque","Black","Blue","BlueViolet","Brown","BurlyWood","CadetBlue","Chartreuse","Chocolate","Coral","CornflowerBlue","Cornsilk","Crimson","Cyan","DarkBlue","DarkCyan","DarkGoldenRod","DarkGray","DarkGrey","DarkGreen","DarkKhaki","DarkMagenta","DarkOliveGreen","Darkorange","DarkOrchid","DarkRed","DarkSalmon","DarkSeaGreen","DarkSlateBlue","DarkSlateGray","DarkSlateGrey","DarkTurquoise","DarkViolet","DeepPink","DeepSkyBlue","DimGray","DimGrey","DodgerBlue","FireBrick",,"ForestGreen","Fuchsia","GoldenRod","Gray","Grey","Green","GreenYellow","HoneyDew","HotPink","IndianRed","Indigo","Khaki","Lavender","LavenderBlush","LawnGreen","LemonChiffon","LightBlue","LightCoral","LightCyan","LightGoldenRodYellow","LightGray","LightGrey","LightGreen","LightPink","LightSalmon","LightSeaGreen","LightSkyBlue","LightSlateGray","LightSlateGrey","LightSteelBlue","LightYellow","Lime","LimeGreen","Linen","Magenta","Maroon","MediumAquaMarine","MediumBlue","MediumOrchid","MediumPurple","MediumSeaGreen","MediumSlateBlue","MediumSpringGreen","MediumTurquoise","MediumVioletRed","MidnightBlue","MintCream","MistyRose","Moccasin","NavajoWhite","Navy","OldLace","Olive","OliveDrab","Orange","OrangeRed","Orchid","PaleGoldenRod","PaleGreen","PaleTurquoise","PaleVioletRed","PapayaWhip","Peru","Pink","Plum","PowderBlue","Purple","Red","RosyBrown","RoyalBlue","SaddleBrown","Salmon","SandyBrown","SeaGreen","SeaShell","Sienna","Silver","SkyBlue","SlateBlue","SlateGray","SlateGrey","Snow","SpringGreen","SteelBlue","Tan","Teal","Thistle","Tomato","Turquoise","Violet","WhiteSmoke","Yellow","YellowGreen"];
        var tags = '';
        $.ajax({
        url:call_url,
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
          $('#myModal').modal();
          $('#modalYes').on('click',function(){
            $('#btnText').focus();
            var getTextField=$("#btnText").val();
            $("#btnText").val("");
            console.log(getTextField);
    
            if(func==="add"){
                if(getTextField!=""){
                  var rand = CSS_COLOR_NAMES[Math.floor(Math.random() * CSS_COLOR_NAMES.length)];
                }
                tags.push({"color":rand, "text":getTextField.toLowerCase()})
            }
    
          else if(func==="subtract"){
            var index = 0
            for (var i = 0; i < tags.length; i++) {
                if(tags[i].text === getTextField.toLowerCase()){
                  index = i
                }
              }
            tags.splice(index, 1)
          }
            $.ajax({
        url:write_url,
        type:"POST",
        data:JSON.stringify({ 'text' : temp }),
        contentType:"application/json; charset=utf-8",
        dataType:"json"
      }).done();
      location.reload();   
       });
      });
    }
      ko.applyBindings({ 
        'id' : id,
        'entity_types' : entity_types,
        'class_types' : class_types,
        'selectedType' : setSelectedType,
        'checkKey' : checkKey,
        'currentType': currentType,
        'selectedFn' : selectedFn,
        'navigate_prev' : navigate_prev, 
        'navigate_home': navigate_home, 
        'akshay' : akshay,
        'add_subtract_tags':add_subtract_tags,
        'navigate_next' : navigate_next }, el[0]);
        

      
      $(".markup-container").first().find('span').each(function(i, span){
        $(this).on('click', function(){
          handle_highlight($(this));
        });
      });
      
      _.each(data.trainings()[i].tags, function(tag){
        var spans = _.filter(el.find('span'), function(e){
          var i = parseInt($(e).attr('data-index'));
          return _.every(
            [_.gte(i, tag.start), 
             _.lt(i, tag.end)]);
        });
        
        var div = $('<div>');
        $(spans).wrapAll(div);

        var p = $(spans).parent();
        _.defer(function(){
          auto_tag_builder(p, tag.tag);
        });
      })
      
    });

    main_window.panelRef.empty();
    main_window.panelClose();
  };

  return {
    render : render
  };
});
