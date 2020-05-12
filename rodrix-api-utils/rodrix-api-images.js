// rodrix-api-images.js --- retrieve and update image to SQL database
//
// Function:
//
//    This app updates images in the inventory SQL table via EBMS API
//
//     DATE              WHO                        DESCRIPTION
//  ----------  -------------------  ---------------------------------------
//  2019-12-12  Karl Gingerich       Created
//  2020-01-24  Karl Gingerich       Hopefully fixed stack prob with recursive calls
//  2020-02-03  Karl Gingerich       Promise version
//  2020-02-05  Karl Gingerich       Images table created/updated
//
// NOTE: Test the API server with the following:
//
//       curl https://API:RodFasApi@ecc792242017021701.servicebus.windows.net/myebms/DAT/odata/...
//            ...INVENTRYIMAGES\?\$filter=PAR_AID\%20eq\%20\'GUIS1M102I9IT0B0\'...
//            ...\&\$select=DETAIL\&\$expand=DETAIL    #...won't work with quoting!
//

const request = require('request'),
      path    = require('path'   ),
      mysql   = require('mysql'  ),
      got     = require('got'    );
      fs      = require('fs'     );

var g_con   = null;
var g_count = 0;  //...records counted
var g_found = 0;  //...images found

const g_URLHeader = 'https://API:RodFasApi@ecc792242017021701.servicebus.windows.net/myebms/DAT/odata/';
const g_URLPartA  = 'INVENTRYIMAGES?$filter=PAR_AID%20eq%20\'';
const g_URLPartB  = '\'&$select=DETAIL&$expand=DETAIL';


//
//  [ found updating ]
//
async function getSetImage(data) {

  console.log('Checking',data.length,'records...');

  for(let item of data) {

    if(item && item.autoid) {

      //...assemble API and send request
      //
      let url   = g_URLHeader + g_URLPartA + item.autoid + g_URLPartB;

      let image = await got(url).json().catch(error => {
                          console.log('Server not responding!');
                          error.message = 'API server is not responding: ' + url;
                          throw error;
                        });

      if(image && image.value[0] && image.value[0].DETAIL &&
         image.value[0].DETAIL.Value.length       ) {

          g_found++;
          console.log('\nFound: ['+item.autoid+' - '+item.descr
                       + '] a total of ' + g_found + ' in ' + g_count + ' rows');

          //...post back to SQL
          //
          let qry = ' INSERT INTO images( autoid, image )               '
                  + ' VALUES ("' + item.autoid + '",                    '
                  + '         "' + image.value[0].DETAIL.Value + '")    '
                  + ' ON DUPLICATE KEY UPDATE                           '
                  + '    image  = "' + image.value[0].DETAIL.Value + '" '
                  + ' ; ';

          await g_con.query(qry, (error) => {
                  if (error) {
                    console.log('ERROR:',error.message, '\nSQL:['+error.sql+']\n');
                    throw error.message;
                  }
                });

      } else {

          //...insure no image data, if image or inventory row was deleted
          //
          let qry = ' DELETE img FROM images AS img                         '
                  + ' LEFT JOIN inventory AS inv ON inv.autoid = img.autoid '
                  + ' WHERE img.autoid = "'+ item.autoid +'"                '
                  + '   AND inv.autoid IS NULL                              '
                  + ' ; ';
          await g_con.query(qry, (error) => {
                  if (error) {
                    console.log('ERROR:',error.message, '\nSQL:['+error.sql+']\n');
                    throw error.message;
                  }
                });

          process.stdout.write('.');  //...show '.' for record, but no image

      }  //...if/else image.value

      g_count++;

    }  //...if/else item

  } //...for()

}


//
//  [ main lines ]
//
(() => {

  let params = null;
  try {

    params = JSON.parse(fs.readFileSync('./config.json'));

    //...load autoids array from SQL inventory table - saving autoids
    //   autoids in INVENTRY join on par_aid's in INVENTRYIMAGES
    //
    g_con = mysql.createConnection(params.SQLConnection);
    g_con.connect((error) => {  if(error) {
                                console.log('ERROR:',error.message);
                                throw error.message;
                              }
                           });

    //...do requested query and return data or an error
    //
    let qry = 'select autoid, descr from inventory order by autoid;';
    g_con.query(qry, (error, results, flds) => {

        if (error || flds === undefined) {
          console.log('ERROR:',error.message, '\nSQL:['+error.sql+']\n');
          throw error.message;
        }

        // console.log('Results length:',results.length);

        let row   = 0;   //...this value can be set for debugging
        let found = 0;
        console.log('Starting at record '+(1+row));
        getSetImage(results).then(() => {
                              console.log("Done.\nTotal records scanned was: ",g_count)
                              console.log("Total images found were: ",g_found)
                              process.exit(0);
                            });

      });

  }
  catch (error) {

    console.log('Error parsing config parameters!');
    console.log(error);
  }

})();