// rodrix-api-database.js --- parse JSON data from EBMS API capture
//
// NOTE: This app may eventually read API stream directly.
//
// Function:
//
//    This app creates two tables from API data (which can be customized).
//    Those two tables are then used to create a final inventory table
//    that contains the data we need for the Rodrix webapp.
//
//    It is done this way in order to control updates and avoid loosing
//    custom data added besides the API data.
//
//     DATE              WHO                        DESCRIPTION
//  ----------  -------------------  ---------------------------------------
//  2019-10-01  Karl Gingerich       Created
//
//

          //
          //...db(...make this read directly from API server - see rodrix-api-images.js
          //

const mysql   = require('mysql'),
      fs      = require('fs');

//
//  [ load config file params ]
//
var data = fs.readFileSync('./config.json');
var g_Params;

try {
  g_Params = JSON.parse(data);
  console.dir(g_Params.login);
}
catch (err) {
  console.log('There has been an error parsing config g_Params!');
  console.log(err);
}

const g_conPrms = g_Params.SQLConnection;

//
//  [ Set up SQL connection ]
//
const con = mysql.createConnection(g_conPrms);

con.connect((err) => {  if(err) {
                          console.log('DB-ERR:',err.message);
                          throw error.message;
                        }
                     });

//
//  [ API files to read - eventually to be API data stream ]
//
const g_ProductFile  = './EBMS-INVENTRY.json';             //...json files to read
const g_CategoryFile = './EBMS-INVENTRE.json';

console.log('DB: '+g_conPrms.user+'@'+g_conPrms.host+' - '+g_conPrms.description+'\n');

console.log('NOTE: Delete INVENTORY table before running, for a fresh rebuild\n');

mainLine();  //...do it all!


//
//  [ Main - Read JSON File Data ]
//
function mainLine() {

  return new Promise(resolve => {

                        let productData  = fs.readFileSync(g_ProductFile,  {encoding: 'utf8'});
                        let categoryData = fs.readFileSync(g_CategoryFile, {encoding: 'utf8'});

                        resolve(createCategoryTable(productData, categoryData));
                    });
}


//
//  [ category table - prep for creating inventory ]
//
//  NOTE: prepare tree path and data here
//
function createCategoryTable(productData, categoryData) {

  jsonData  = JSON.parse(categoryData).value;
  console.log('Processing '+jsonData.length+' records from category data...');

  query =   ' DROP TABLE IF EXISTS category;\n         '

          + ' CREATE TABLE category (                  '

          + '   TREE_ID     int(11) unsigned NOT NULL, '
          + '   AUTOID      varchar(16),               '
          + '   PARENT_ID   int(11) unsigned,          '
          + '   TREE_PATH   text,                      '
          + '   TREE_DESCR  varchar(128),              '
          + '   WEB_DESCR   varchar(128),              '

          + '   PRIMARY KEY (TREE_ID)                  '

          + ' ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; '

          + ' INSERT INTO category ( TREE_ID    , '
          + '                        AUTOID     , '
          + '                        PARENT_ID  , '
          + '                        TREE_PATH  , '
          + '                        TREE_DESCR , '
          + '                        WEB_DESCR    '
          + ' ) VALUES ';

  //...append the values we have, the rest default
  //
  for(let row=0; row<jsonData.length; row++) {
                                                           //...strip tabs and quotes
    jsonData[row].TREE_DESCR = jsonData[row].TREE_DESCR.replace(/[\t\"]/g,'');

    if(jsonData[row].WEB_DESCR1 <= '')
      jsonData[row].WEB_DESCR1 = '';
    else
      jsonData[row].WEB_DESCR1 = jsonData[row].WEB_DESCR1.replace(/[\t\"]/g,'');

    query += ' ("' + jsonData[row].TREE_ID    + '", '
           + '  "' + jsonData[row].AUTOID     + '", '
           + '  "' + jsonData[row].PARENT_ID  + '", '
           + '  "' + jsonData[row].TREE_PATH  + '", '
           + '  "' + jsonData[row].TREE_DESCR + '", '
           + '  "' + jsonData[row].WEB_DESCR1 + '"  '

           + ' ) ' + (row<jsonData.length-1 ? ',' : ';\n');
  }

  con.query(query, (error, result, fields) => {

                      if (error) {
                        console.log('SQL ERROR:',error.message);
                        console.log(error.sql);
                        throw error.message;
                      }

                      console.log('CATEGORY data imported.');

                      createProductTable(productData);
                    });
}


//
//  [ create SQL table from CSV data ]
//
          //
          //...db(...eventually needs to read API data directly from server
          //
function createProductTable(productData) {

  let query = '';

  //
  //...products data first
  //
  let jsonData  = JSON.parse(productData).value;
  console.log('Processing '+jsonData.length+' records from product data...');

  query =   ' DROP TABLE IF EXISTS product;\n                     '

          + ' CREATE TABLE product (                              '

          + '   ID      int(11) unsigned NOT NULL AUTO_INCREMENT, '

          + '   AUTOID    varchar(16),                            '
          + '   PROD_ID   varchar(32),                            '
          + '   TREE_ID   int(11) unsigned NOT NULL,              '
          + '   DESCR     varchar(128),                           '
          + '   UNITS     varchar(32),                            '
          + '   ON_HAND   int(11),                                '

          + '   PRIMARY KEY (ID)                                  '

          + ' ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;            '

          + ' INSERT INTO product ( AUTOID , '
          + '                       PROD_ID, '
          + '                       TREE_ID, '
          + '                       DESCR  , '
          + '                       UNITS  , '
          + '                       ON_HAND ) VALUES ';

  //...append the values we have to query, let the rest default

  let delimiter = '';                                     //...if rows ignored @ EOF!
  for(let row=0; row<jsonData.length; row++) {

    if(jsonData[row].ID.indexOf('($)') >= 0)              //... skip "($)..." entries
      continue;

    jsonData[row].ID      = jsonData[row].ID.replace(     /[\t\"]/g,'');
    jsonData[row].DESCR_1 = jsonData[row].DESCR_1.replace(/[\t\"]/g,'');

    if(jsonData[row].DEF_UNIT <= '')                      //...default for UNIT
      jsonData[row].DEF_UNIT = 'Each';

    if(jsonData[row].T_ON_HAND < 0)                       //...no negative ON_HAND
      jsonData[row].T_ON_HAND = 0;

    query += delimiter
           + ' ("' + jsonData[row].AUTOID    + '", '
           + '  "' + jsonData[row].ID        + '", '      //...prod_id
           + '  "' + jsonData[row].TREE_ID   + '", '
           + '  "' + jsonData[row].DESCR_1   + '", '
           + '  "' + jsonData[row].DEF_UNIT  + '", '
           + '  "' + jsonData[row].T_ON_HAND + '"  '
           + ' )';

    delimiter = ',';                                      //...after first pass
  }

  con.query(query, (error, result, fields) => {

                      if (error) {
                        console.log('SQL ERROR:',error.message);
                        console.log(error.sql);
                        console.log('Found rows:',jsonData.length);
                        throw error.message;
                      }

                      console.log('PRODUCT data imported.');

                      createInventoryTable();
                    });
}


//
//  [ inventory table - prep for inventory ]
//
//  This is the main table we use for the web app
//
function createInventoryTable() {

  console.log('Creating/Checking Inventory with category data...');

  query =   ' CREATE TABLE IF NOT EXISTS inventory (       '

          + '   AUTOID      varchar(16),                   '  //...relational key

          + '   DATA_TYPE   varchar(1),                    '  //...data type - Category or Product
          + '   HIDDEN      tinyint(1) not null default 0, '  //...non public items
          + '   DESCR       varchar(128),                  '  //...description
          + '   UNITS       varchar(32),                   '  //...selling unit type or "each"
          + '   PROD_ID     varchar(32),                   '  //...set from array values
          + '   TREE_ID     int(11) unsigned NOT NULL,     '  //...tree id it belongs to
          + '   PARENT_ID   int(11) unsigned,              '  //...parent id
          + '   TREE_PATH   text,                          '  //...tree path back to root
          + '   CHILD_COUNT int(11) unsigned,              '  //...updated later
          + '   ON_HAND     int(11) default 0,             '  //...available quantity
          + '   WEB_DESCR   varchar(128),                  '  //...may be used for cards

          + '   PRIMARY KEY (AUTOID)                       '  //...key

          + ' ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4      '
          + ' ; '

              //...add/update, set displayed flag & counts - purge old autoid's

          + ' INSERT INTO inventory ( autoid   ,           '
          + '                         data_type,           '
          + '                         hidden   ,           '
          + '                         descr    ,           '
          + '                         tree_id  ,           '
          + '                         tree_path,           '
          + '                         parent_id,           '
          + '                         web_descr )          '
          + ' SELECT c.autoid,                             '
          + '        UPPER("C")  ,                         '
          + '        false       ,                         '
          + '        c.tree_descr,                         '
          + '        c.tree_id   ,                         '
          + '        c.tree_path ,                         '
          + '        c.parent_id ,                         '
          + '        c.web_descr                           '
          + ' FROM category c                              '
          + ' LEFT JOIN inventory i ON i.autoid = c.autoid '

          + ' ON DUPLICATE KEY UPDATE     '
          + '   data_type = UPPER("C")  , '
          + '      hidden = false       , '
          + '       descr = c.tree_descr, '
          + '     tree_id = c.tree_id   , '
          + '   tree_path = c.tree_path , '
          + '   parent_id = c.parent_id , '
          + '   web_descr = c.web_descr   '
          + ' ; '

          + ' INSERT INTO inventory ( autoid   ,           '
          + '                         hidden   ,           '
          + '                         descr    ,           '
          + '                         data_type,           '
          + '                         tree_id  ,           '
          + '                         prod_id  ,           '
          + '                         units    ,           '
          + '                         on_hand )            '
          + ' SELECT p.autoid  ,                           '
          + '        false     ,                           '
          + '        p.descr   ,                           '
          + '        UPPER("P"),                           '
          + '        p.tree_id ,                           '
          + '        p.prod_id ,                           '
          + '        p.units   ,                           '
          + '        p.on_hand                             '
          + ' FROM product p                               '
          + ' LEFT JOIN inventory i ON i.autoid = p.autoid '

          + ' ON DUPLICATE KEY UPDATE '
          + '    hidden = false     , '
          + '     descr = p.descr   , '
          + ' data_type = UPPER("P"), '
          + '   tree_id = p.tree_id , '
          + '   prod_id = p.prod_id , '
          + '     units = p.units   , '
          + '   on_hand = p.on_hand   '
          + ' ;                                                   '
          ;

  con.query(query, (error, result, fields) => {
            if (error) {
              console.log('SQL ERROR:',error.message,'\n',error.sql);
              throw error.message;
            }

            console.log('INVENTORY table created from category/product data.');

            updateInventory();

          });
}


//
//  [ inventory - the main table we use for the WebApp ]
//
function updateInventory() {

  console.log('Updating counts, hidden id\'s and purging old records...');

  query =   ' UPDATE inventory i                                         '
          + ' LEFT JOIN category c ON c.autoid  = i.autoid               '
          + ' LEFT JOIN product  p ON p.tree_id = c.tree_id              '
          + ' SET i.child_count = ( SELECT COUNT(*) FROM category x      '
          + '                       WHERE x.tree_path LIKE               '
          + '       CONCAT("%",right(CONCAT("    ",c.tree_id),5),"/%" )  '
          + '                     ) +                                    '
          + '                     ( SELECT COUNT(p.id) FROM product      '
          + '                       WHERE tree_id = c.tree_id            '
          + '                     )                                      '
          + ' WHERE i.data_type = "C" AND hidden = false                 '
          + ' ; '

          + ' DELETE i FROM inventory i                                  '
          + ' LEFT JOIN category c on c.autoid = i.autoid                '
          + ' LEFT JOIN product  p on p.autoid = i.autoid                '
          + ' WHERE c.autoid IS NULL                                     '
          + '   AND p.autoid IS NULL                                     '
          + ' ; ';

  con.query(query, (error, result, fields) => {
              if (error) {
                console.log('SQL ERROR:',error.message,'\n',error.sql);
                throw error.message;
              }

              console.log('INVENTORY table finished.\n');

              createImagesTable();
            });
}


//
//  [ inventory table - prep for inventory ]
//
//  This is the main table we use for the web app
//
function createImagesTable() {

  console.log('Creating/Checking Inventory Table...');

  query = 'CREATE TABLE IF NOT EXISTS images (     '

        + '  AUTOID varchar(16) NOT NULL,          '  //...inventory autodi key
        + '  IMAGE_URL    text,                    '  //...a URL for image
        + '  IMAGE        mediumtext,              '  //...image octet-stream via API

        + '  PRIMARY KEY (`AUTOID`)                '  //...key

        + ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 '
        + '; ';

  con.query(query, (error, result, fields) => {
            if (error) {
              console.log('SQL ERROR:',error.message,'\n',error.sql);
              throw error.message;
            }

            console.log('IMAGES table created.');
            console.log('*** Update required via API Image utility.\n');
            con.end();

          });

}
