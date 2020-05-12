//  rodrix-server.js --- Rodrix Fasternes NodeJS Server Source file
//
//     Author: Karl Gingerich (International Teams Canada)
//       Date: Oct 28, 2019
//
// Explainations:
//
//   Event handlers are defined in app.js (client) via getServerData() that call
//   API endpoints defined here. The endpoint functions collect data and use the
//   sendData() to return the data.  At that point the app.js getServerData()
//   call-back runs the proper function in app.js to update pages.
//
// Update History:
//
//    Date           Who                        Description
// -----------  --------------------  -----------------------------------------
// 2019-10-01   Karl Gingerich        initial creation
//

const mysql   = require('mysql'      ),
      http    = require('http'       ),
      path    = require('path'       ),
      express = require('express'    ),
      parser  = require('body-parser'),
      https   = require('https'      ),
      fs      = require('fs'         ),
      md5     = require('js-md5'     ),
      os      = require('os'         );
const cartRouter = require('./rodrix-api-utils/rodrix-api-cart')

//
//  [ load config params ]
//
var data;
try {                                          //...put config file in server folder
  data = fs.readFileSync('config.json');
}
catch(err) {
  console.log('Error reading config.json file!');
  throw(err);
}

var cfgPrm;
try {
  cfgPrm = JSON.parse(data);
}
catch (err) {
  console.log('Error parsing config.json file!');
  throw(err);
}

const conPrms = cfgPrm.SQLConnection;

console.log('Using SQL connection: '+conPrms.user+'@'+conPrms.host+' - '+conPrms.description);


//
//  [ login checking ]
//
function checkAccess(request, response) {

 if(request.body === undefined) {
    response.status(500).send({ error: 'ERROR: No POST data!'});
    return;
  }

  //...NOTE: pw comes as MD5 hash
  //
  var qry = 'select id from user where email = "'     +
            request.body.email + '" and password = "' +
            request.body.password + '";'              ;

  let con = mysql.createConnection(conPrms);
  con.query(qry, (err, result, flds) => {



    // console.log("login results:", result.length);
    con.end();
    if (err || flds === undefined || result.length === 0) {

      console.log('Invalid login attempt:', request.body.email, request.body.password);
      response.status(200).send({ message: 'ERROR'});

    } else {

      console.log('Valid login for:', request.body.email, request.body.password);
      response.status(200).send({ message: 'OK'});  //...client looks for this 'OK" msg
    }

  });
}


//
// [ get main categories ]
//
function getCategories(request, response) {

  if(request === undefined) {

    console.log('Get product Request is undefined!');
    response.send('APP-ERR: Bad Category Request received!');

  } else {

    let sql =   ' SELECT tree_id, descr, tree_path, child_count,  '
              + '        img.image, img.image_url                 '
              + ' FROM inventory AS inv                           '
              + ' LEFT JOIN images img ON img.autoid = inv.autoid '
              + ' WHERE web_descr not like "hide%"                '
              + '   AND web_descr not like "hidden%"              '
              + '   AND parent_id = 1                             '
              + ' ORDER BY descr;                                 ';

    sendData( sql, (resp) => {
                     console.log('Sending Main Category info');
                     // console.dir(resp);
                     if (resp.length >= 1)
                       response.send(JSON.stringify(resp));
                     else
                       response.send('APP-ERR: Category data Not Found!');
                   }
            );
  }
}


//
//  [ get data for given ID ]
//
//  Get category's child records
//  - ie. bolt is 503, there are sub categories and eventually products
// - there can be both at any level as well
//
function getCategoryId(request, response) {

  console.log('---> Received Category ID Request:');
  console.dir(request.params);

  if(request.params === undefined) {

    console.log('Received Request with NO PARAMS!');
    response.send('APP-ERR: Undefined Params!');

  } else {

    let id = request.params.cid;
    if(id === undefined)
      id = request.params.sid;

    console.log('Request Params: sid/cid:'+id+' desc:['+request.params.desc+'] ');

    let sql =   ' SELECT tree_id, descr, data_type, units, prod_id, data_type, '
              + '        image_url, image, inv.autoid, web_descr, on_hand      '
              + ' FROM inventory AS inv                                        '
              + ' LEFT JOIN images AS img ON img.autoid = inv.autoid           '
              + ' WHERE parent_id = ' + id
              + '    OR (tree_id  = ' + id
              + '        AND descr <> "' + request.params.desc + '")           ';

    // console.log('By ID Request SQL:',sql);

    sendData( sql, (resp) => {
                     console.log('Items by ID found:',resp.length);
                     // console.dir(resp);

                     if(resp.length >= 1)
                       response.send(JSON.stringify(resp));
                     else
                       response.send('APP-ERR: Product data Not Found!');
                   }
            );
  }
}


//
// [ get search results ]
//
function getSearchResults(request, response) {

  console.log('---> Received Search Request:');

  if(request.params === undefined) {

    response.send('APP-ERR: Undefined Search Params!');

  } else {

    //...following is all words in any order
    //
    let searches = 'descr like "%' + request.params.search.replace(' ','%" AND descr like "%') + '%"';

    //...following is any word in order given
    //
    // let searches = 'descr like "%' + request.params.search.replace(/\s+/g,'%') + '%"';
    console.log('Looking for:',searches);

    let sql =   ' SELECT tree_id, descr, units, data_type, image_url,      '
              + ' image, prod_id, web_descr, on_hand FROM inventory AS inv '
              + ' LEFT JOIN images AS img ON img.autoid = inv.autoid       '
              + ' where (' + searches + ')                                 '
              + ' limit 30;                                                ';

    sendData( sql, (resp) => {
                      console.log('Sending Category sub-data');
                      // console.dir(resp);
                      if (resp.length >= 1) {

                        response.send(JSON.stringify(resp));

                      } else {

                        response.send('APP-ERR: Nothing Found!\nTry other wording?');
                      }
                    }
            );

  }
}


//
//  [ Send Data to web Client ]
//
function sendData(qry, send) {

  //...set up SQL connection
  //
  let con = mysql.createConnection(conPrms);

  con.connect((err) => {
    if(err) {

      console.log('APP-ERR:',err.message);
      send('APP-ERR: '+err.message);

    } else {

      //...do requested query and return data or an error
      //
      con.query(qry, (err, result, flds) => {

                       if (err || flds === undefined) {

                         console.log('APP-ERR:',err.message, '\nSQL:['+err.sql+']\n');
                         send('APP-ERR: '+err.message);  //...prefix to trigger client alert()

                       } else {

                         send(result);
                         // console.log('Results length:',result.length);
                         // console.dir(result);
                       }
                     });
      con.end();
    }
  });
}


//
// [ get local hosts IP ]
//
function getIp() {

  var interfaces = os.networkInterfaces();
  var ip         = '0.0.0.0';

  Object.keys(interfaces).forEach(function (name) {

    var alias = 0;

    interfaces[name].forEach(function (netInterface) {

      if ('IPv4' !== netInterface.family || netInterface.internal !== false) {
        // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
        return;
      }

      if (alias >= 1) {
        // this single netInterface has multiple ipv4 addresses
        ip = netInterface.address;
      } else {
        // this netInterface has only one ipv4 adress
        ip = netInterface.address;
      }
      ++alias;
    });
  });
  return(ip);
}


//
//  [ server setup/launch ]
//
const app     = express();
const router  = express.Router();


let server    = null;
if (fs.existsSync(cfgPrm.keyFile)) {  //...key & cert? use https

  console.log('Initiating HTTPS server...');
  const options = { key : fs.readFileSync(cfgPrm.keyFile),
                    cert: fs.readFileSync(cfgPrm.crtFile), };
  server = https.createServer(options, app);

} else {                              //...no key & cert? use http

  console.log('Using HTTP server');
  server = http.createServer(app);
}

//
//  [ Express server ]
//
const master = __dirname + '/' + cfgPrm.path.master; //...paths for routing
const admin  = __dirname + '/' + cfgPrm.path.admin;

console.log('Server Home Paths:\n', '   ' + master, '\n    ' + admin);
app.use(express.static(master));

//...configure express to use body-parser as middle-ware
//
app.use(parser.urlencoded({extended: false}));
app.use(parser.json());

//...routing
//
app.use('/', router);
app.use(express.json({limit: '10kb'}));        //...parse JSON bodies (as sent by API clients)
app.use( parser.json());                       //...parse URL-encoded bodies (as sent by HTML forms)

cartRouter(router)
//...GET requests
//
router.get('/',      (req, res) => { res.sendFile(path.join(master + '/index.html'       )); } );
router.get('/login', (req, res) => { res.sendFile(path.join(master + '/rodrix-login.html')); } );

router.get('/main-categories',     getCategories   );  //...API/GET requests
router.get('/cid=:cid&desc=:desc', getCategoryId   );  //...main category
router.get('/sid=:sid&desc=:desc', getCategoryId   );  //...sub-category
router.get('/search=:search',      getSearchResults);  //...custom search


//...POST requests
//
router.post('/access', checkAccess);           //...login request


//...catch all for URL errors
//
router.get ('/*', (req, res) => { res.send('APP-ERR: unknown GET API Call ['+req.originalUrl+']!');
                                 console.log('Bad ['+req.method+'] request:\n'+req.originalUrl+'\n');} );
router.post('/*', (req, res) => { res.send('APP-ERR: unknown POST API Call ['+req.originalUrl+']!');
                                 console.log('APP-ERR: Bad ['+req.method+'] request:\n'+req.originalUrl+'\n');} );

//
//  [ Express Web Server ]
//
// NOTE: GCE must have host ip as "0.0.0.0"
//       Binding to http://localhost:3000 or system default
//
let ip = getIp();

server.listen(3000, ip, function() {
              var addr = server.address();
              console.log("Rodrix server listening at", addr.address + ":" + addr.port); }
);
