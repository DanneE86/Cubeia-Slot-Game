var fs = require('fs');
var path = require('path');
var outcomeHandler = require('./outcomeHandler');

module.exports = {
    getFilePath: function(url) {
        var filePath = './static' + url;

        if (filePath === './static/') {
            filePath = './static/index.html';
        }

        return filePath;
    },
    getContentType: function(filePath) {
        var extname = path.extname(filePath);
        var contentType = 'text/html';

       return contentType;
    },
    write: function(request, response) {
        var url = request.url;

        if (url === "/outcome.json") {
            outcomeHandler.write(request, response);
        } else {
            var filePath = this.getFilePath(url),
                contentType = this.getContentType(filePath);

            fs.readFile(filePath, (error, content) => {
                if (!error) {
                    response.writeHead(200, {
                        'Content-Type': contentType
                    });
                    response.end(content, 'utf-8');
                } else {
                    response.writeHead(200, {
                        'Content-Type': 'text/html'
                    });
                    response.end("File not found", 'utf-8');
                }
            });
        }
    }
}