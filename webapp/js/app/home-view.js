define(['underscore-contrib', 'windows', 'hasher', 'ko', 'd3', 'app/utils', 'app/routes', 'app/data','app/main-window', 'jquery'], function(_, windows, hasher, ko, d3, utils, routes, data, main_window, $){

  var view = function(){
    var deferred = new $.Deferred();
    require(['text!templates/home_view.html'], function(tmpl){
      deferred.resolve(tmpl);
    });
    return deferred.promise();
  };

  var table_container = function(el){
    el.empty();
    el.append($('<table>').addClass("table").append($('<thead>')).append($('<tbody>')));
    return el;
  };

  var render_table = function(el, rows){

    var lastSort = "";

    var thead = d3.select(el[0])
      .select("thead")
      .append("tr")
      .selectAll("tr")
      .data(['Index', 'ID', 'Snippet', 'Trained'])
      .enter().append("th").text(_.identity);

    var tr = d3.select(el[0]).select("tbody").selectAll("tr")
      .data(rows)
      .enter().append("tr")
      .attr("class", function(d){
        if (d[3]) return "success";
      })
      .on("click", function(d){
        utils.navigate(routes.TRAIN(d[0]))
      })
      // .on("contextmenu", function(d, i){
      //   utils.navigate(routes.TEST(d[0]))
      // })
      .on('mouseover', function(d){
        $(this).addClass('hover');
      })
      .on('mouseout', function(d){
        $(this).removeClass('hover');
      });

    var td = tr.selectAll("td")
      .data(_.identity)
      .enter().append("td")
      .html(function(d, i){

        if (i == 1){
            return $('<_>').append(
              $('<span>').html(d.length > 50 ? d.substr(0, 47) + "..." : d).attr('title', d)
            ).html();          
        } 

        if (i == 3){        
          if (d) {
            return $('<_>').append(
              $('<span>').addClass('glyphicon').addClass('glyphicon-ok')
            ).html();
          } else {
            return "";
          }
        }
        return d;
      });
  };

  var result_msg = ko.observable("");
  var result_msg_class = ko.observable("");

  var train = function(){
    var trainings = _.filter(data.trainings(), function(o){
      return o.tags.length > 0;
    });
    console.log({ 'trainings' : trainings });
    result_msg($('<O_o>').append($('<img>', { 'src': "img/ajax-loader.gif", 'width': '140px'})).html());    
    result_msg_class("");

    $.ajax({
      url:'train/train',
      type:"POST",
      data:JSON.stringify({ 'trainings' : trainings }),
      contentType:"application/json; charset=utf-8",
      dataType:"json"
    }).done(function(resp){
      console.log("HAHAHAH")
      console.log(resp);
      result_msg($('<O_o>').append(
        $('<span>').addClass("glyphicon").addClass("glyphicon-ok-sign"), 
        $('<span>').html(" training complete")).html())
      result_msg_class("bg-success");
    }).fail(function(){
      result_msg($('<O_o>').append(
        $('<span>').addClass("glyphicon").addClass("glyphicon-remove-sign"), 
        $('<span>').html(" error")).html())
      result_msg_class("bg-danger");
    });
  };

  var save = function(){
    result_msg($('<O_o>').append($('<img>', { 'src': "img/ajax-loader.gif", 'width': '140px'})).html());    
    result_msg_class("");
    $.ajax({
      url:'train/save',
      type:"GET",
      contentType:"application/json; charset=utf-8",
      dataType:"json"
    }).done(function(resp){
      result_msg($('<O_o>').append(
        $('<span>').addClass("glyphicon").addClass("glyphicon-ok"), 
        $('<a>').attr('target', '_blank').attr('href', resp.model).html(" Download")
      ).html());    
      result_msg_class("bg-success");
    }).fail(function(){
      result_msg($('<O_o>').append(
        $('<span>').addClass("glyphicon").addClass("glyphicon-remove-sign"),
        $('<span>').html(" error")).html())
      result_msg_class("bg-danger");
    });
  };

  var render = function(ref){
    view().then(function(tmpl){
      ref.empty();
      ref.html(tmpl);
      table = ref.find('.table-container');
      table_container(table);
      render_table(table, _.map(data.trainings(), function(d, i){ 
        return [i, d.id, d.text.substr(0, 150), d.tags.length > 0 ];
      }));
      var trainingCount = ko.observable(data.trainings().length);
      var trained = ko.observable(_.filter(data.trainings(), function(o){
        return o.tags.length > 0;
      }).length);

      main_window.panelClose();      

      var navigate_test = function(){
        utils.navigate(routes.TEST());
      };

      var training_save_handler = function(){
        var filename = prompt("Please enter a file name.", data.fileName());
        if (filename != null) {
          if (!utils.strEndsWith(filename, ".json")){
            filename = filename + ".json";
          }
        }
          data.fileName(filename);
        $.ajax({
          url:'data/spacy_save',
          type:"POST",
          data:JSON.stringify({ 'name' : filename, 
                                'data' : {'filename': filename, 'trainings' : data.trainings() }}),
          contentType:"application/json; charset=utf-8",
          dataType:"json"
        }).done(function(resp){
          console.log(resp)
          var f = new Blob([JSON.stringify(resp.data)], {'type': 'application/json'});
          var URL = window.URL || window.webkitURL;
          var downloadUrl = URL.createObjectURL(f);
          // el.href = URL.createObjectURL(f);
          // el.dispatchEvent(evt);
          var a = document.createElement("a");
          document.body.appendChild(a);
          a.style = "display: none";
          a.href = downloadUrl;
          a.download = "Spacy-"+data.fileName() ;
          a.click();
          document.body.removeChild(a);
        }).fail(function(){
          console.log("save failed");
        });

        // var URL = window.URL || window.webkitURL;
        // var evt = document.createEvent("HTMLEvents");
        // evt.initEvent("click", true, false);
        // var el = document.createElement('a');
        // el.download = data.fileName() ;
        var f = new Blob([JSON.stringify( {'filename': data.fileName(),'trainings' : data.trainings()})], {'type': 'application/json'});
        var URL = window.URL || window.webkitURL;
        var downloadUrl = URL.createObjectURL(f);
        // el.href = URL.createObjectURL(f);
        // el.dispatchEvent(evt);
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        a.href = downloadUrl;
        a.download = "Training-"+data.fileName();
        a.click();
        document.body.removeChild(a);
      };

      var training_save_server_handler = function(){
        console.log("MAin worked");
        
        var filename = prompt("Please enter a file name.", data.fileName());
        if (filename != null) {
          if (!utils.strEndsWith(filename, ".json")){
            filename = filename + ".json";
          }
          data.fileName(filename);
          console.log(filename)
          $.ajax({
            url:'data/server_save',
            type:"POST",
            data:JSON.stringify({ 'name' : filename, 
                                  'data' : {'filename': filename, 'trainings' : data.trainings() }}),
            contentType:"application/json; charset=utf-8",
            dataType:"json"
          }).done(function(resp){
            console.log("done")
            console.log(resp);
            alert("saved " + "/data/user_saves" + "/" + resp.saved);
          }).fail(function(){
            console.log("save failed");
          });
        }};



        var training_save_spacy_handler = function(){
          console.log("Spacy worked");
          var filename = prompt("Please enter a file name.", data.fileName());
          if (filename != null) {
            if (!utils.strEndsWith(filename, ".json")){
              filename = filename + ".json";
            }
            data.fileName(filename);
            $.ajax({
              url:'data/spacy_save',
              type:"POST",
              data:JSON.stringify({ 'name' : filename, 
                                    'data' : {'filename': filename, 'trainings' : data.trainings() }}),
              contentType:"application/json; charset=utf-8",
              dataType:"json"
            }).done(function(resp){
              console.log(resp);
              alert("saved " + "/data/user_saves" + "/" + resp.saved);
            }).fail(function(){
              console.log("save failed");
            });
          }};
  

      var training_complete_handler = function(){
        var verify = _.every(data.trainings(), function(t){
          return t.tags.length > 0;
        });

        if (!verify) { 
          var c = confirm("Not all trainings have been tagged are you sure you want to complete this training?");
          if (!c){
            //bail
            return;
          }
        }

        var filename = prompt("Please enter the file name", data.fileName());
        if (filename != null){
          if (!utils.strEndsWith(filename, ".json")){
            filename = filename + ".json";
          }
          //update ui filename
          data.fileName(filename);          
          // create completed filename
          filename = filename.replace(/\.json/, '');
          filename = filename + "_complete.json";

          $.ajax({
            url:'data/server_save_complete',
            type:"POST",
            data:JSON.stringify({ 'name' : filename, 
                                  'data' : {'filename': filename, 'trainings' : data.trainings() }}),
            contentType:"application/json; charset=utf-8",
            dataType:"json"
          }).done(function(resp){
            console.log(resp);
            alert("completed " + "/data/complete" + "/" + resp.saved);
          }).fail(function(){
            console.log("save failed");
          });
        }
      };

      // var training_upload = function(){

      //   var fileSelected = function(evt) {
      //     var files = evt.target.files; // FileList object
      //     f = files[0];
      //     var reader = new FileReader();

      //     // Closure to capture the file information.
      //     reader.onload = (function (theFile) {
      //       return function (e) { 
      //         var f = theFile.name;
      //         var JsonObj = e.target.result
      //         console.log(JsonObj);
      //         var parsedJSON = JSON.parse(JsonObj);
      //         data.bulkload(parsedJSON.trainings, f);
      //         utils.navigate(routes.HOME("reload"));
      //       };
      //     })(f);

      //     // Read in JSON as a data URL.
      //     reader.readAsText(f, 'UTF-8');
      //   };

      //   $("#fileupload:file").off("change")
      //   $("#fileupload:file").one("change", fileSelected);
      //   $("#fileupload").trigger("click"); 
      // };
      

      var training_upload = function(){
        var fileSelected = function(evt) {
          var files = evt.target.files; // FileList object
          f = files[0];
          var reader = new FileReader();

          // Closure to capture the file information.
          reader.onload = (function (theFile) {
            return function (e) { 
              console.log(e.target.result)
              var f = theFile.name;
              var JsonObj = e.target.result
              console.log("*********************************")
              console.log(JsonObj);
              var parsedJSON = JSON.parse(JsonObj);
              if(parsedJSON.trainings!=null){
                        data.bulkload(parsedJSON.trainings, f);
                        utils.navigate(routes.HOME("reload"));
              }
              else{
              $.ajax({
                url:'data/parse_tsv',
                type:"POST",
                data:JSON.stringify({'text':parsedJSON}),
                contentType:"application/json; charset=utf-8",
                dataType:"json"
              }).done(function(resp){
                var JsonObj = resp.trainings
                console.log(JsonObj);
                data.bulkload(JsonObj, f);
                utils.navigate(routes.HOME("reload"));
                // alert("completed " + "/data/complete" + "/" + resp.saved);
              }).fail(function(){
                console.log("save failed");
              });

            }
             
            };
          })(f);

          // Read in JSON as a data URL.
          reader.readAsText(f, 'UTF-8');
        };

        $("#fileupload:file").off("change")
        $("#fileupload:file").one("change", fileSelected);
        $("#fileupload").trigger("click"); 
      };


      var fileName = data.fileName;
      var filenameEditing = ko.observable(false);
      var toggleFilename = function () { 
        console.log('toggle')
        filenameEditing(!filenameEditing()); 
      };

      var resetTraining = function(){
        var r = confirm("Are you sure you want to remove all tagged data from the current set?");
        if (r) {
          data.clearAllTags();
          utils.navigate(routes.HOME("reload"));
        };
      };

      var train_spacy = function(){
        console.log(document.getElementById("path_to"))
        console.log(document.getElementById("iter"))
        console.log(document.getElementById("loadText"))
        

        var path_to = document.getElementById("path_to").value;
        var iter = document.getElementById("iter").value;
        var path_from = "";
        // if ( document.getElementById("loadText") != null){
        //   path_from = document.getElementById("loadText").value;
        // }
        var strUser = ''
        var e = document.getElementById("sel1");
        strUser = e.options[e.selectedIndex].text;
        console.log(e)
        if ( strUser != null){
          path_from = strUser;
        }
        
        console.log(path_from+iter+path_to)
        console.log("Inside Training module");
        console.log(data.trainings())
          $.ajax({
            url:'http://localhost:5000/train',
            type:"POST",
            data:JSON.stringify(
              {'data' : 
                {
                'trainings' : data.trainings(),
                },
                'iteration': parseInt(iter),
                'path_from' : path_from, 
                'path_to': path_to,
                'update':document.getElementById("update").checked == true

              }),
            contentType:"application/json; charset=utf-8",
            dataType:"json"
          }).done(function(resp){
            console.log(resp);
            localStorage.setItem('path',resp.path);
            alert("Model created with accuracy :  "+resp.accuracy);
          }).fail(function(){
            console.log("save failed");
          });
        };
        
      var test_spacy_handler = function(){
        var model = ''
        var e = document.getElementById("sel2");
        model = e.options[e.selectedIndex].text;
        var input_text = document.getElementById("input_text").value;

        $.ajax({
          url:'http://localhost:5000/predict_ner',
          type:"POST",
          data:JSON.stringify(
            {
              "model_name" : model,
              "text" : input_text
            }),
          contentType:"application/json; charset=utf-8",
          dataType:"json"
        }).done(function(resp){
          alert(resp);
          // localStorage.setItem('path',resp.path);
        }).fail(function(){
          console.log("test failed");
        });
        
      
      
      
      
      }
      var download_spacy = function(){
        // var get_path=localStorage.getItem('path');
        // alert(get_path)
        // var zip_file_path = get_path+".zip" //put inside "" your path with file.zip
        
        var zip_file_name = "Model" //put inside "" file name or something
        var zip_file_path = "C:/AKSHAY/Projects/NER TRAINER/NER-trainer-master/model3.zip"
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        a.href = zip_file_path;
        a.download = zip_file_name;
        a.click();
        document.body.removeChild(a);

        // var zip = new JSZip();
        // zip.file("Hello.txt", "Hello world\n");
        // zip.generateAsync({type:"blob"}).then(function (blob) { // 1) generate the zip file
        //   saveAs(blob, "hello.zip");                          // 2) trigger the download
        //     }, function (err) {
        //       jQuery("#blob").text(err);
        //   });

      }
     
      ko.applyBindings({ training_upload: training_upload, 
                         training_save: training_save_handler, 
                         training_save_server: training_save_server_handler,
                         training_save_spacy: training_save_spacy_handler,
                         training_complete_handler : training_complete_handler,
                         train_spacy: train_spacy,
                         test_spacy: test_spacy_handler,
                         download_spacy: download_spacy,
                         test_handler: navigate_test, 
                         save: save, 
                         train: train, 
                         result_msg: result_msg,
                         result_msg_class: result_msg_class,
                         total: trainingCount, 
                         trained: trained,
                         fileName: fileName,
                         filenameEditing : filenameEditing,
                         toggleFilename : toggleFilename,
                         resetTraining : resetTraining
                       }, ref[0])
    });

  };

  return {
    'render' : render
  };
});
