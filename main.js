var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var path = require('path');
var sanitizeHtml = require(`sanitize-html`);

var template = {
  HTML:function (title,list,body, control){
    return `
    <!doctype html>
    <html>
    <head>
      <title>WEB1 - ${title}</title>
      <meta charset="utf-8">
    </head>
    <body>
      <h1><a href="/">WEB</a></h1>
      ${list}
      ${control}
      ${body}
    </body>
    </html>`
  },
  List:function (filelist){
    var list = '<ul>'
    var i=0;
    while(i<filelist.length){
      list = list+`<li><a href="/?id=${filelist[i]}">${filelist[i]}</a></li>`;
      i=i+1;
    }
    list = list+'</ul>';
    return list;
  }
}



//request 컴퓨터가 요청할 때 웹브라우저가 보낸 정보
//response 응답할 때 우리가 웹브라우저 한테 전송할 정보
var app = http.createServer(function(request,response){
    var _url = request.url;
    var queryData = url.parse(_url, true).query;
    var pathname = url.parse(_url,true).pathname;

    if(pathname =='/'){
      if(queryData.id == undefined){
        fs.readdir('./data',function(error,filelist){

          var title = 'welcome';
          var description = 'Hello, Node.js';
          /*
          var list = `<li><a href="/?id=html">HTML</a></li>
          <li><a href="/?id=CSS">CSS</a></li>
          <li><a href="/?id=JavaScript">JavaScript</a></li>`;*/
          var list = template.List(filelist);
          var html = template.HTML(title,list,`<h2>${title}</h2>${description}`,
          `<a href="/create">create</a>`);


          response.writeHead(200);
          response.end(html);

        })
      }else{
        fs.readdir('./data',function(error,filelist){
          var filterdId = path.parse(queryData.id).base;
          var list = template.List(filelist);
          fs.readFile(`data/${filterdId}`,'utf8',function(err,data){
            var title = queryData.id;
            var description = data;
            var sanitizedTitle = sanitizeHtml(title);
            
            var html = template.HTML(sanitizedTitle,list,`<h2>${sanitizedTitle}</h2>${description}`,
              `<a href="/create">create </a>
              <a href="/update?id=${sanitizedTitle}">update</a>
              <form action = "delete_process" method = "post" >
                <input type="hidden" name="id" value="${sanitizedTitle}">
                <input type="submit" value = "delete">
              </forom>
              `);
            response.writeHead(200);
            response.end(html);
          });
        });
      }
    }else if(pathname == '/create'){
      fs.readdir('./data',function(error,filelist){

        var title = 'Web-create';
        var description = 'Hello, Node.js';
        var list = template.List(filelist);
        var html = template.HTML(title,list,
          `<form action="/create_process
          " method="post">
            <p><input type="text" name="title" placeholder = "title"></p>
            <p>
                <textarea name="description" rows="8" cols="80"
                placeholder = "description"></textarea>
            </p>
            <p><input type="submit"></p>
          </form>
          `,` `);


        response.writeHead(200);
        response.end(html);

      })
    }else if(pathname === '/create_process'){
      var body = '';
      //정보 수신중
      request.on('data',function(data){
        //body 데이터에 콜백이 실행될 때 마다 데이터를 축적한다.
        body = body + data;
      });
      //정보 수신이 끝났다
      request.on('end',function(){
        var post = qs.parse(body);
        var title = post.title;
        var description = post.description;

        fs.writeFile(`data/${title}`,description,'utf8',function(err){
          response.writeHead(302,{Location: `/?id=${title}`});
          response.end('success');
        })
      });

    }
    else if(pathname === '/update'){
      fs.readdir('./data',function(error,filelist){
        var list = template.List(filelist);
        var filterdId = pth.parse(queryData.id).base;
        fs.readFile(`data/${filterdId}`,'utf8',function(err,data){
          var title = queryData.id;
          var description = data;
          var html = template.HTML(title,list,`
            <form action="/update_process
            " method="post">
            <input type = "hidden" name = "id" value = "${title}">
              <p><input type="text" name="title" placeholder = "title"value = ${title}></p>
              <p>
                  <textarea name="description" rows="8" cols="80"
                  placeholder = "description">${description}</textarea>
              </p>
              <p><input type="submit"></p>
            </form>

            `,
            `<a href="/create">create </a><a href="/update?id=${title}">update</a>`);
          response.writeHead(200);
          response.end(html);
        });
      });
    }else if(pathname === '/update_process'){
      var body = '';
      //정보 수신중
      request.on('data',function(data){
        //body 데이터에 콜백이 실행될 때 마다 데이터를 축적한다.
        body = body + data;
      });
      //정보 수신이 끝났다
      request.on('end',function(){
        var post = qs.parse(body);
        var id = post.id;
        var title = post.title;
        var description = post.description;
        fs.rename(`data/${id}`,`data/${title}`,function(error){
          fs.writeFile(`data/${title}`,description,'utf8',function(err){
            response.writeHead(302,{Location: `/?id=${title}`});
            response.end();
            });

        })
        console.log(post);
      })
    }else if(pathname === '/delete_process'){
      var body = '';
      //정보 수신중
      request.on('data',function(data){
        //body 데이터에 콜백이 실행될 때 마다 데이터를 축적한다.
        body = body + data;
      });
      //정보 수신이 끝났다
      request.on('end',function(){
        var post = qs.parse(body);
        var id = post.id;
        var filterdId = pth.parse(id).base;
        fs.unlink(`data/${filterdId}`,function(error){
          response.writeHead(302,{Location: `/`});
          response.end();
        })
      })
    }else{
      response.writeHead(404);
      response.end('Not found');
    }
});
app.listen(3000);
