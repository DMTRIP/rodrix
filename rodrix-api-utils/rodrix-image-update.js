// rodrix-image-update.js --- put path of image file to SQL database
//
//     DATE              WHO                        DESCRIPTION
//  ----------  -------------------  ---------------------------------------
//  2020 02 06  Karl Gingerich       Created
//

const mysql   = require('mysql'  ),
      fs      = require('fs'     );

var g_con   = null;

//
//  [ create/update SQL record ]
//
async function setImageURL(autoid, image_url) {

}


//
//  [ main lines ]
//
async function main() {

  if(process.argv.length < 4) {
    console.log('\nUsage: '+process.argv[1]+' <Category Tree_ID> <./file path for image>');
    console.log('        (Look for "cid" of card in page source. It is the tree_id.)\n');
    process.exit();
  }

  let tree_id   = process.argv[2];
  let image_url = process.argv[3];

  try {

    let params = JSON.parse(fs.readFileSync('./config.json'));

    //...load autoids array from SQL inventory table - saving autoids
    //   autoids in INVENTRY join on par_aid's in INVENTRYIMAGES
    //
    g_con = mysql.createConnection(params.SQLConnection);
    await g_con.connect((error) => {  if(error) {
                            console.log('ERROR:',error.message);
                            throw error.message;
                          }
                        });

    //...get autoid via tree_id of category table
    //
    let qry = ' SELECT autoid FROM category WHERE tree_id = '+ tree_id;
    let autoid = '';
    await g_con.query(qry, (error, results, flds) => {
            if (error) {
              console.log('ERROR:',error.message, '\nSQL:['+error.sql+']\n');
              throw error.message;

            }

            autoid = results[0].autoid;
            console.log('Updating AutoID: '+autoid+' with path '+image_url);

            qry = ' INSERT INTO images(autoid, image_url) '
                  + ' VALUES ("' + autoid + '",           '
                  + '         "' + image_url + '")        '
                  + ' ON DUPLICATE KEY UPDATE             '
                  + '    image  = "' + image_url + '";    ';

            g_con.query(qry, (error) => {
                    if (error) {
                      console.log('ERROR:',error.message, '\nSQL:['+error.sql+']\n');
                      throw error.message;

                    } else {

                      console.log('Record updated.');
                      process.exit();
                    }

                  });

          });

    //...post updates to SQL
    //

  } catch (error) {

    console.log('Error updating image path!');
    console.log(error.message);
  }

}

main();