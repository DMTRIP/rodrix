const mysql  = require('mysql');
const fs  = require('fs');
const util = require('util')

// const con = mysql.createConnection({
//     "host"               : "rodrix.c98bq3ncyfhl.us-east-1.rds.amazonaws.com"        ,
//     "port"               : "3306"             ,
//     "user"               : "rodrix"           ,
//     "password"           : "rodrixrodrixrodrix"           ,
//     "database"           : "rodrix"
// })
// con.connect(function(err) {
//     if (err) {
//         console.error('error connecting: ' + err.stack);
//         return;
//     }
//
//     console.log('connected as id ' + con.threadId);
// });

function makeDb(config) {
    const connection = mysql.createConnection( config );
    return {
        query( sql, args ) {
            return util.promisify( connection.query )
                .call( connection, sql, args );
        },
        close() {
            return util.promisify( connection.end ).call( connection );
        }
    };
}

const db = makeDb({
    "host"               : "rodrix.c98bq3ncyfhl.us-east-1.rds.amazonaws.com"        ,
    "port"               : "3306"             ,
    "user"               : "rodrix"           ,
    "password"           : "rodrixrodrixrodrix"           ,
    "database"           : "rodrix"
 })

 module.exports = (router) => {

    router.post('/order', async (req, res) => {
         try {
             const { email = 'test@mail.com', shipping_type = '' } = req.body
             const createOrderQuery = `CREATE TABLE IF NOT EXISTS orders (
                id int NOT NULL AUTO_INCREMENT,
                user_email VARCHAR(100),
                shipping_type VARCHAR(100),
                PRIMARY KEY (id) 
                 );
             `
             await db.query(createOrderQuery)
             const insertOrderQuery = `INSERT INTO orders (user_email, shipping_type) VALUES ('${email}', '${shipping_type}')`
             await db.query(insertOrderQuery)
             res.status(200).send('Order has been created successful')
         } catch (e) {
             console.log(e);
             res.status(400).send(e.message)
         }
     })

     router.get('/order/:id', async (req, res) => {
         try {
             const { id = 1 } = req.params
             const order = await db.query(`SELECT * FROM orders WHERE id = ${id}`)
             const orderItems = await db.query(`SELECT * FROM order_items WHERE order_id = ${id}`)
             res.status(200).send({
                 order: order[0],
                 orderItems
             })
         } catch (e) {
             res.status(400).send(e.message)
         }
     })

     router.get('/order', async (req, res) => {
         try {
             const { userEmail = 'test@mail.com' } = req.body
             const orders = await db.query(`SELECT * FROM orders WHERE user_email = '${userEmail}'`)
             res.status(200).send(orders)
         } catch (e) {
             res.status(400).send(e.message)
         }
     })

    router.post('/order-item', async (req, res) => {
        try {
            const createOrderItemQuery = `CREATE TABLE IF NOT EXISTS order_items (
                id int NOT NULL AUTO_INCREMENT,
                order_id int,
                product_id int,
                quantity int,
                price dec(5,5),
                PRIMARY KEY (id)
                );
            `
            const { order_id = 1, product_id = 1,  quantity = 1, price = 1.1, } = req.body
            const insertQuery = `INSERT INTO order_items (order_id, product_id, quantity, price)
            VALUES (${order_id}, ${product_id}, ${quantity}, ${price});
            `
            await db.query(createOrderItemQuery)
            await db.query(insertQuery)
            await db.query(`DELETE FROM cart_items WHERE id = ${product_id}`)
            res.status(200).send('Order item has been added successful')
        } catch (e) {
            console.log(e);
            res.status(400).send(e.message)
        }
    })

    router.get('/cart', async (req, res) => {
        try {
            const { userEmail = 'test@mail.com' } = req.body
            const items = await db.query(`SELECT * FROM cart_items WHERE user_email = '${userEmail}'`)
            res.status(200).send(items)
        } catch (e) {
            res.status(400).send(e.message)
        }
    })

    router.post('/cart-item', async (req, res) => {
            try {
                const { email = 'test@mail.com', productId = 1, quantity = 10, price = 1.1 } = req.body
                const createCartQuery = `CREATE TABLE IF NOT EXISTS cart_items (
                id int NOT NULL AUTO_INCREMENT,
                user_email VARCHAR(100),
                product_id INT,
                quantity INT,
                price DEC(5,5),
                PRIMARY KEY (id)
                );`

                const insertItem = `   
                INSERT INTO cart_items (user_email, product_id, quantity, price)
                VALUES ('${email}', ${productId}, ${quantity}, ${price}) ;`
                await db.query(createCartQuery)
                await db.query(insertItem)

               res.status(200).send('item is added to cart')
            } catch (e) {
                console.log(e);
                res.status(500).send(e.message)
            }
        }
    )

    router.delete('/cart-item/:id', async (req, res) => {
        try {
            const { id } = req.params
            await db.query(`DELETE FROM cart_items WHERE id = ${id}`)
            res.status(200).send('Item has been deleted successful')
        } catch (e) {
            res.status(400).send('can not delete item')
        }
    })

 }
