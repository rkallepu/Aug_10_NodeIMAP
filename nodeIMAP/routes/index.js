var router = require('express').Router(),
    Imap = require('imap'),
    inspect = require('util').inspect,
    fs = require('fs'),
    fileStream,
    unreadEmails = 0,
    readEmails = 0,
    attachEmailCount = 0,
    totalEmails = 0,
    mimeTypes = [];
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.post('/', function(req, res, next){
  console.log(req.body);
  var mailId = req.body.email,
      password = req.body.password;
  var imap = new Imap({
    user: mailId,
    password: password,
    host: 'imap.gmail.com',
    port: 993,
    tls: true
  });

  function openInbox(cb) {
    imap.openBox('INBOX', true, cb);
  }
  imap.once('ready', function() {
    openInbox(function(err, box) {
      if (err) throw err;
      imap.search([ 'ALL', ['SINCE', 'Aug 10, 2015'] ], function(err, results) {
        if (err) throw err;
        var f = imap.fetch(results, { bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)', struct: true });
        f.on('message', function(msg, seqno) {
          var prefix = '(#' + seqno + ') ';
          msg.on('body', function(stream, info) {
            var buffer = '';
            stream.on('data', function(chunk) {
              buffer += chunk.toString('utf8');
            });
            stream.once('end', function() {
            });
          });
          msg.once('attributes', function(attrs) {
            totalEmails++;
            console.log('attributes',attrs);
            var arr = attrs.struct[2];
            if (typeof arr !== 'undefined'){
              if(arr[0].disposition === null || typeof arr[0].disposition === 'undefined' || typeof arr[0].disposition.params === 'undefined'){
              }
              else{
                attachEmailCount++;
                var thisType = arr[0].subtype;
                var found = false;

                if (mimeTypes.length === 0){
                  var obj = {name: thisType, y: 1};
                  mimeTypes.push(obj);
                }
                else{
                  mimeTypes.forEach(function (mime) {
                    if (mime.name === thisType){
                      found = true;
                      mime.y++;
                    }
                  });
                  if (found === false){
                    var obj = {name: thisType, y: 1};
                    mimeTypes.push(obj);
                  }
                  found = false;
                }

              }
            }
          });
          msg.once('end', function() {
            console.log(prefix + 'Finished');
          });
        });
        f.once('error', function(err) {
          console.log('Fetch error: ' + err);
        });
        f.once('end', function() {
          console.log('Done fetching all messages!');
          imap.end();
        });
      });
      imap.search([ 'UNSEEN', ['SINCE', 'Aug 10, 2015'] ], function(err, results) {
        if (err) throw err;
        var f = imap.fetch(results, { bodies: '' });
        console.log('number of unread messages', results.length);
        unreadEmails = results.length;
        /*f.on('message', function(msg, seqno) {
          console.log('Message #%d', seqno);
          var prefix = '(#' + seqno + ') ';
          msg.on('body', function(stream, info) {
            console.log(prefix + 'Body');
            stream.pipe(fs.createWriteStream('msg-' + seqno + '-body.txt'));
          });
          msg.once('attributes', function(attrs) {
            console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
          });
          msg.once('end', function() {
            console.log(prefix + 'Finished');
          });
        });*/
        f.once('error', function(err) {
          console.log('Fetch error: ' + err);
        });
        f.once('end', function() {
          console.log('Done fetching all messages!');
          imap.end();
        });
      });

      imap.search([ 'SEEN', ['SINCE', 'Aug 10, 2015'] ], function(err, results) {
        if (err) throw err;
        var f = imap.fetch(results, { bodies: '' });
        console.log('number of read messages', results.length);
        readEmails = results.length;
        /*f.on('message', function(msg, seqno) {
         console.log('Message #%d', seqno);
         var prefix = '(#' + seqno + ') ';
         msg.on('body', function(stream, info) {
         console.log(prefix + 'Body');
         stream.pipe(fs.createWriteStream('msg-' + seqno + '-body.txt'));
         });
         msg.once('attributes', function(attrs) {
         console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
         });
         msg.once('end', function() {
         console.log(prefix + 'Finished');
         });
         });*/
        f.once('error', function(err) {
          console.log('Fetch error: ' + err);
        });
        f.once('end', function() {
          console.log('Done fetching all messages!');
          res.send(JSON.stringify({unread: unreadEmails, read: readEmails, emailsAttachments: attachEmailCount, noattachments: totalEmails - attachEmailCount, mimeTypes: mimeTypes }));
          imap.end();
        });
      });

    });
  });

  imap.once('error', function(err) {
    console.log(err);
  });

  imap.once('end', function() {
    console.log('Connection ended');
  });

  imap.connect();
});
module.exports = router;
