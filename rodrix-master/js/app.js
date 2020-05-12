// app.js --- Rodrix Web App main functions
//
//  Created Nov-6-2019 by Karl Gingerich
//
//  NOTE! Heavy reliance on selector names in HTML documents!!!
//
// Explainations:
//
//   This is the client side of data handling.  The init routines initialize
//   various elements and may set up event handlers that trigger an API
//   call via getServerData().  The server responses via the defined 'update'
//   call-backs and page actions are taken.
//
// Update History:
//
//    Date           Who                        Description
// -----------  --------------------  -----------------------------------------
// 2019-10-01   Karl Gingerich        initial creation
//
// ...see git kgingeri/rodrix-fastensers for updates


//
//  [ globals - denoted via "g_" ]
//

//...CSS selectors for addressing nodes
//
const g_HeaderBottomButton     = 'header-bottom-btn';
const g_HeaderTopMenuItem      = 'header-top-menu-item';
const g_HeaderTopLogin         = 'header-top-login';
const g_HeaderTopLoginUser     = 'header-top-login-user';

const g_HeaderBottomLogo       = 'header-bottom-logo';
const g_HeaderBottomCart       = 'header-bottom-cart';
const g_HeaderBottomCartIcon   = 'header-bottom-cart-icon';

const g_HeaderBottomSearch     = 'header-bottom-search';
const g_HeaderSearchResults    = 'search-results';
const g_HeaderSearchInput      = 'search-input';

const g_JumbotronButton        = 'jumbotron-btn';
const g_Company                = 'company';   //...register company form
const g_Heading2               = 'heading-2';
const g_PopupLogin             = 'popup-login';
const g_LoginSignout           = 'popup-login-signout';

const g_ContactsForm           = 'contacts-form';

const g_CatalogPopup           = 'popup-catalog';

const g_CategoryListParent     = 'category-list';
const g_CategoryListItem       = 'category-list-item';
const g_CategoryListAmnt       = 'category-list-item-amount';

//
// [ category page ]
//

//...search buttons
const g_CatGdsHdrCategories    = 'category-goods-header-categories';
const g_CatGdsHdrButton        = 'category-goods-header-btn';
const g_CatGdsItemWrapper      = 'category-goods-item-wrapper';

//...product category cards
const g_CatGdsCards            = 'category-goods';
const g_CatGdsCardImage        = 'category-goods-item-img';
const g_CatGdsCardTitle        = 'category-goods-item-title';

//...product detail
const g_CatGdsItems            = 'list';
const g_CatGdsItemsList        = 'list-item';
const g_CatGdsItemImage        = 'img';
const g_CatGdsItemBoxes        = 'box-text';     //...array of 4 + 4 for mobile
const g_CatGdsItemBtns         = 'quantity-item'; //...2 buttons, + and -
const g_CatGdsItemInput        = 'quantity-field';
const g_catGdsItemCart         = 'btn-icon';     //...firstChild of this

var   g_CategoryLstItmTemplate = '';

var   g_CatGdsProdList         = null;
var   g_CatGdsHdrBtnTemplate   = null;
var   g_CatGdsCrdWrpTemplate   = null;
var   g_CatGdsPrdWrpTemplate   = null;

//
//  [ general inits to page on render ]
//
function generalPageInit() {

  setLogin();

  //...set Product Catalog button to show to category.html
  let element = document.querySelector('.'+g_CatalogPopup);
  if(element !== null)
    element.remove();        //...hide entire product pop-up

  element = document.querySelector('.'+g_HeaderBottomButton);
  element.addEventListener("click", (event) => {
                            event.stopPropagation();
                            document.location.replace('/category.html');
                          });

  //...setup top search field
  //
  //  NOTE! It's important to encode search string, sub out '=' and '/'
  //
  element = document.querySelector('.'+g_HeaderBottomSearch);
  element.addEventListener("click", (event) => {
                            event.stopPropagation();
                              if(document.URL.indexOf('category.html') < 0)
                                document.location.href = '/category.html#search-input';
                          });
  element.addEventListener("change", (event) => {
                            event.stopPropagation();
                            if(event.target.value.length > 0)
                              getServerData( 'search='+
                                   encodeURI(event.target.value.trim())
                                   .replace('/','%2f')
                                   .replace('=','%3d')
                                 );
                          });
  element.addEventListener("keyup", (event) => {    //...Enter key pressed
                            if (event.keyCode === 13) {
                              event.preventDefault();
                              getServerData( 'search='+
                                   encodeURI(event.target.value.trim())
                                   .replace('/','%2f')
                                   .replace('=','%3d')
                                 );
                            }
                          });

  //...logo click goes to home page
  element = document.querySelector('.'+g_HeaderBottomLogo);
  element.addEventListener('click', (e) => { window.location = '/index.html'});

  //...hide menu items not used yet
  //
  // element = document.querySelectorAll('.'+g_HeaderTopMenuItem);
  // element.forEach(item => {if(item.innerText != 'Contacts') item.classList.add('display-none');});

  //...cart click goes to cart page
  element = document.querySelector('.'+g_HeaderBottomCart);
  element.addEventListener('click', (e) => { window.location = '/cart.html'});

  //... link for and pop-up menu with login
  element = document.querySelector('.'+g_HeaderTopLogin);
  element.addEventListener('click', (e) => { event.stopPropagation();
                            setLogin();  //...endure proper labels are set
                          });

  element = document.querySelector('.'+g_LoginSignout);
  element.addEventListener('click', (e) => { event.stopPropagation();
                            document.querySelector('.'+g_PopupLogin).classList.remove('open');
                            if(window.localStorage.loggedIn === 'yes') //...logged in? Log out
                              window.localStorage.loggedIn = 'no';
                            else                                       //...show login popup
                              document.getElementById('login-popup').classList.remove('display-none');
                            setLogin();
                          });

  //...modal login popup - login, cancel or close buttons
  element = document.getElementById('login-login');
  element.addEventListener('click', (e) => { event.stopPropagation();
                            verifyLogin();
                          });
  element = document.getElementById('login-cancel');
  attachLogin(element);
  element = document.getElementById('login-close');
  attachLogin(element);

  //...Home page - set up buttons etc
  if(document.URL.indexOf('index') > 0) {

    element = document.querySelectorAll('.'+g_JumbotronButton);  //...buttons "go" and "explore"
    element.forEach(item => item.addEventListener('click', (e) => window.location = '/category.html'));

    element = document.querySelectorAll('.'+g_Heading2);
    element.forEach(item => {if(item.innerText=='Popular categories') item.parentElement.remove()});
  }

  //...Contacts page
  if(document.URL.indexOf('contacts')>0) {

    element = document.querySelector('.'+g_ContactsForm).parentElement.parentElement;
    let cloned = element.children[1].cloneNode(true); //...contact info
    element.children[0].remove();
    element.children[1].remove();
    element.appendChild(cloned);
  }
}

//
//  [ Init Category page ]
//
//  Delete all demo elements and clear page for rebuilding
//  Some elements may be saved as templates
//
function initCategoryPage() {

  console.log('Initializing for Category page...');

  //...delete all demo elements (main category page)
  //
  let elements = document.querySelectorAll('.'+g_CategoryListItem);
  g_CategoryLstItmTemplate = elements[0].cloneNode(true);
  g_CategoryLstItmTemplate.getElementsByTagName('a')[0]
                          .setAttribute('href','#');
  // NOTE: '#' causes top-of-page action but leaves CSS enabled
  //       can use .removeAttribute('href') but no CSS then
  elements.forEach(item => item.parentNode.removeChild(item));

  elements = document.querySelectorAll('.'+g_CatGdsHdrButton);
  g_CatGdsHdrBtnTemplate = elements[0].cloneNode(true);
  elements.forEach(button => button.remove());

  //...product category 'cards' list
  //
  elements = document.querySelectorAll('.'+g_CatGdsItemWrapper);
  g_CatGdsCrdWrpTemplate = elements[0].cloneNode(true);
  elements.forEach(item => item.remove());

  //...product items list
  //
  g_CatGdsProdList = document.querySelector('.'+g_CatGdsItems);

  elements = document.querySelectorAll('.'+g_CatGdsItemsList);
  g_CatGdsPrdWrpTemplate = elements[0].cloneNode(true);
  elements.forEach(item => item.remove());
}


// // // // // // // // // // // // // // // // // // // // // // // //
//
//                     [ call-back handlers ]
//

//
//  [ update category page list ]
//
//  Update left sidebar list
//
//  items: an JSON array of text values
//
function updateCategoryList(items) {

  // console.log('--> categories request...');

  const parent    = document.querySelector('.'+g_CategoryListParent);
  const selector  = '.'+g_CategoryListItem;               //...the class we are dealing with
  const elements  = document.querySelectorAll(selector);

  //...rebuild product list (sidebar)
  //
  items.forEach((item) => {

    let liTag = g_CategoryLstItmTemplate.cloneNode(true); //...copy "All" node (not deleted)
    let count = item.child_count;

    liTag.classList.remove('active');
    liTag.querySelector('.'+g_CategoryListAmnt).innerText =
          '('+count+')';                                  //...category items found

    liTag.addEventListener('click', (event) => {          //...set sidebar click event
      event.stopPropagation();
      document.querySelectorAll(selector).forEach(element => {
        if(element.innerText == event.srcElement.parentElement.innerText)
          element.classList.add('active');                //...set clicked 'active'
        else
          element.classList.remove('active');             //...set others 'inactive'
      });
      getServerData('cid='+item.tree_id + '&desc='+item.descr); //...get category
    });

    liTag.childNodes[1].innerText = item.descr;           //...text and API URI

    parent.appendChild(liTag, parent.lastChild);
  });  //...foreach category

  //...set up first item as active
  //
  let e = document.querySelector('.'+g_CategoryListItem);
  e.classList.add('active');
                                                          //...set up init list
  getServerData('cid='+items[0].tree_id + '&desc='+items[0].descr);

}


//
//  [ update main category/product list ]
//
//  Update main page content when category is clicked
//
//  categoryName: the name clicked
//  clearButtons: whether or not to clear bread-crumb buttons
//  responseData: the data received from the server - getServerData()
//
function updateCategoryData(categoryName, clearButtons, responseData, treeId) {

  const parent   = document.querySelector   ('.'+g_CatGdsHdrCategories);
  const buttons  = document.querySelectorAll('.'+g_CatGdsHdrButton    );
  const cards    = document.querySelector   ('.'+g_CatGdsCards        );
  const items    = g_CatGdsProdList;                      //...saved div for product items

  // console.log('<-- CID Response Array:',responseData);

  //...clear prev bread-crumb buttons
  //
  //   if main category or search is clicked, otherwise it's a
  //   sub-category and we let it build
  //
  if(clearButtons)
    document.querySelector('.'+g_CatGdsHdrCategories).innerHTML = '';

  //...'bread-crumb' buttons
  //
  if(categoryName.length > 0) {

    let button = g_CatGdsHdrBtnTemplate.cloneNode(true);
    button.innerText = categoryName;              //...bread-crumb category button
    button.setAttribute('cid',treeId);            //...store treeId with button
    button.addEventListener('click', event => {
     event.stopPropagation();
     breadCrumbButton(event);
    });

    parent.appendChild(button, parent.lastChild);
  }

  // console.log('Sub Data:',responseData);

  //...clear product category 'cards' list
  elements = document.querySelectorAll('.'+g_CatGdsItemWrapper);
  elements.forEach(item => item.remove());

  //...clear product items list
  elements = document.querySelectorAll('.'+g_CatGdsItemsList);
  elements.forEach(item => item.remove());

  if(responseData === undefined)                  //...no data?
    return;

  //
  //...loop thru responseData and display cards (categories) or order rows (products)
  //

  //...set up category 'cards'
  //
  responseData.forEach(item => {                  //...post all cards for category

    // console.log('Descr Item for', item.descr);
    // console.dir(item);

    if(item.data_type === 'C' || item.data_type === 'c') {

      let card = g_CatGdsCrdWrpTemplate.cloneNode(true);
      card.querySelector('.'+g_CatGdsCardTitle).innerText = item.descr;
                                                  //...save for call-back below
      card.setAttribute('cid',  encodeURI(item.tree_id));
      card.setAttribute('desc', encodeURI(item.descr)
                                .replace('/','%2f')
                                .replace('=','%3d')   );

      if(item.image_url !== null && item.image_url.length > 0)  //...set image
        card.querySelector('.'+g_CatGdsCardImage).setAttribute('src', item.image_url);
      else
      if(item.image !== null && item.image.length > 0)
        card.querySelector('.'+g_CatGdsCardImage)
            .setAttribute('src', 'data:image/jpeg;base64,'+item.image);

      card.addEventListener("click", (event) => { //...click event for category cards
             event.stopPropagation();             //...lookup by description

             //...this is a sub-category so we use "sid"
             //
             getServerData(  'sid='   + event.currentTarget.getAttribute('cid' )
                           + '&desc=' + event.currentTarget.getAttribute('desc') );

             // document.querySelectorAll('.'+g_CategoryListItem)
             //                           .forEach(e => {
             //                             e.classList.remove('active');
             //                           });         //...blur all category links
           });


      cards.appendChild(card);

    } //...if category

  });

  //...product items (after all category cards have now been posted)
  //
  cards.append(items);        //...the items list wrapper first

  const box = { descr  : 0,   //...NOTE: for mobile elements, add offset below
                partno : 1,
                onhand : 2,
                unit   : 3
              }
  const mOffset = 4;          //...offset for mobile elements

  responseData.forEach(item => {                               //...post all products

    if(item.data_type === 'P' || item.data_type === 'p') {

      let prod = g_CatGdsPrdWrpTemplate.cloneNode(true);

      //...set item custom or deafult image and mouse-over
      //
      let image = prod.querySelector('.'+g_CatGdsItemImage);
      if(item.image_url !== null && item.image_url.length > 0)
        image.setAttribute('src', item.image_url);
      else
      if(item.image     !== null && item.image.length > 0)
        image.setAttribute('src', 'data:image/jpeg;base64,'+item.image);

      image.addEventListener('mouseover',
             event =>  { event.stopPropagation();
             event.currentTarget.classList.add   ('category-goods-item-img-large');
           });
      image.addEventListener('mouseleave',
             event =>  { event.stopPropagation();
             event.currentTarget.classList.remove('category-goods-item-img-large');
           });

      //...the values boxes for product details
      //
      let boxes = prod.querySelectorAll('.'+g_CatGdsItemBoxes);

      boxes[box.descr           ].innerText = item.descr;
      boxes[box.descr  + mOffset].innerText = item.descr;

      boxes[box.partno          ].innerText = (item.prod_id !== null ? item.prod_id : '');
      boxes[box.partno + mOffset].innerText = (item.prod_id !== null ? item.prod_id : '');

      boxes[box.onhand          ].innerText = (item.on_hand > 0 ? 'Yes' : 'No');
      boxes[box.onhand + mOffset].innerText = (item.on_hand > 0 ? 'Yes' : 'No');

      boxes[box.unit            ].innerText = (item.units !== null ? item.units : '');
      boxes[box.unit   + mOffset].innerText = (item.units !== null ? item.units : '');

      prod.querySelectorAll('.'+g_CatGdsItemBtns)         //...2 +/- buttons
          .forEach(node => node.addEventListener('click', event => {
                                                  event.stopPropagation();
                                                  if(loggedIn())
                                                    amountAddRemove(event);
                                                 })
          );

      prod.querySelector('.'+g_CatGdsItemInput)           //...entered quantity
          .addEventListener('change', event => {
                              event.stopPropagation();
                              if(loggedIn())
                                updateAmount(event);
                            });

      prod.querySelector('.'+g_catGdsItemCart)            //...add to cart button
          .addEventListener('click',  event => {
                              event.stopPropagation();
                              if(loggedIn())
                                addToCart(event);
                            });

      items.appendChild(prod);

    } //...if Product

  });

}


// // // // // // // // // // // // // // // // // // // // // // // //
//
//             [ ordering event handlers ]
//

//
//  [ check if logged in ]
//
function loggedIn() {

  if(window.localStorage.loggedIn !== 'yes') {
    alert("You must be logged in to add to cart!"); //...db(...replace with better pop-up
    return false;
  }

  return true;
}
//
//  [ check/login ]
//
function setLogin() {

  // console.log('setLogin()');

  if(window.localStorage.loggedIn === undefined ||
     window.localStorage.loggedIn === 'no'       ) {

    document.querySelector('.'+g_LoginSignout).innerText = 'Sign In';
    document.querySelector('.'+g_HeaderTopLoginUser).innerText = 'Log in to your account';
    window.localStorage.loggedIn = 'no';

  } else {

    document.querySelector('.'+g_LoginSignout).innerText = 'Sign Out';
    document.querySelector('.'+g_HeaderTopLoginUser).innerText = 'Log out of your account';
    window.localStorage.loggedIn = 'yes';
  }

}


//
//  [ attach login to element ]

//
function attachLogin(element) {

  element.addEventListener('click', (e) => { event.stopPropagation();
          document.getElementById('login-popup').classList.add('display-none');
          document.querySelector('.'+g_HeaderTopLoginUser).innerText = 'Log in to your account';

          document.getElementById('login-email').value = null;
          document.getElementById('login-psswd').value = null;
          document.querySelectorAll('.field-error')[1].innerText = '';
          document.querySelectorAll('.field-error')[1].style.display = 'none';
  });
}


//
//  [ check if login is valid ]
//
async function verifyLogin() {

  try {
    var email    = document.getElementById('login-email').value;
    var password = md5(document.getElementById('login-psswd').value);
  } catch (err) {
    console.dir(err);
    return;
  }

  console.log('Checking access for:',email, password);

  var info = null;

  const options = {
    method  : 'POST',
    headers : {'Content-Type': 'application/json'},
    body    : JSON.stringify({email, password})
  };

  await fetch('/access', options)
        .then(async (resp) => {
          info = await resp.json();
          // console.log('Response, info:',resp, info);

          if(info.message === 'OK') {

            window.localStorage.loggedIn = 'yes';
            document.getElementById('login-popup').classList.add('display-none');
            document.querySelector('.'+g_HeaderTopLoginUser).innerText =
                    'Log out of your account';

            document.getElementById('login-email').value = null;
            document.getElementById('login-psswd').value = null;
            document.querySelectorAll('.field-error')[1].innerText = '';
            document.querySelectorAll('.field-error')[1].style.display = 'none';

          } else {

            document.querySelectorAll('.field-error')[1].innerText =
                     'Not a valid login! Please try again.';
            document.querySelectorAll('.field-error')[1].style.display = 'flex';
          }
        })
      .catch(e => {
        console.log(e.message);
      });
}


//
//  [ update quantity input ]
//
function updateAmount(event) {

  console.log('updateAmount()');
}


//
//  [ update quantity with buttons ]
//
function amountAddRemove(event) {

  // console.log('amountAddRemoved()');
  // console.dir(event.target);

  let element = event.target.parentElement.parentElement.getElementsByTagName('input')[0];
  let value = parseInt(element.value);

  //  find buttons with:
  switch(event.target.innerText) {

    case 'add'    : console.log('Add clicked, logged in',window.localStorage.loggedIn);
                    element.value = value + 1;
                    break;

    case 'remove' : console.log('Remove clicked');
                    if(value > 0)
                      element.value = value - 1;
                    break;
  }

}


//
//  [ add to cart button ]
//
function addToCart(event) {

  console.log('addToCart()');
  alert('Item added to your cart');  //...db(...replace with better pop-up

//...db(...popup and processing - clear page?

}


//
//  [ click handler for bread-crumb buttons ]
//
function breadCrumbButton(event) {

  console.log('Bread-crumb button clicked:',event.target.innerText);

  while(event.currentTarget.nextSibling != null)     //...delete siblings and this button
    event.currentTarget.nextSibling.remove();

  let id   = event.currentTarget.getAttribute('cid');
  let desc = event.currentTarget.innerText;
  event.currentTarget.remove();

  //...if button is SEARCH: result, re do search else use ID
  if(desc.indexOf('SEARCH:') === 0)
    getServerData('search='+desc.split('"')[1]);      //...extract seach term
  else
    getServerData('sid='+ id + '&desc=' + desc);      //..."sid=" does not clear buttons

}

// // // // // // // // // // // // // // // // // // // // // // // //
//
//             [ server request and response dispatching ]
//

//
//  [ displatch server data results ]
//
//  uri = the URL parameter to send - using by the server for routing
//        ie. .../products
//
function getServerData(params) {

  console.log('>> In getServerData(' + params + ')');

  (async () => {

  fetch('/' + params)
    .then(async (response) => {
      if(response.ok !== true)
        return;

      let jsonData = await response.json()
      .catch(err => {
              alert('No data found for item!');
              console.dir(err);
            });

      // console.log('Params and Data:', params, jsonData);

      if(response.url.indexOf('/main-categories') > 0)
      {
        console.log('>> main-categories Response');
        //...main catalog page
        if (document.URL.indexOf('category.html') >= 0) {
          updateCategoryList(jsonData);        //...left panel categories
        }

      }
      else  //...URI: '/cid=' or '/sid=' (category id) requests
      if(response.url.indexOf('/cid=') > 0 ||  //...category id vs sub-cat id
         response.url.indexOf('/sid=') > 0) {

        console.log('>> cid/sid Response');

        //...parse id from uri
        let desc      = decodeURIComponent(response.url.split('&desc=')[1]);
        let clearBtns = (response.url.indexOf('/cid=') >= 0 ? true : false);
        let treeId    = ((response.url.split('/')[3]).split('=')[1]).split('&')[0];

        updateCategoryData(desc, clearBtns, jsonData, treeId);
      }
      else  //...URI: 'search=' find products
      if(response.url.indexOf('/search=') > 0) {

        console.log('>> In search response');

        //...search items found?
        if(jsonData.length > 0) {

          //...use bread-crumb button for search info
          let buttonText = 'SEARCH: "' + document.querySelector('.'+g_HeaderSearchInput).value + '"';
          if(jsonData.length == 30)
            buttonText += ' (first 30 results) ';

          document.querySelector('.'+g_HeaderBottomSearch).classList.toggle('focused');
          document.activeElement.blur();

          document.querySelectorAll('.'+g_CategoryListItem) //...blur all category links
                                    .forEach(e => {
                                      e.classList.remove('active');
                                    });

          updateCategoryData(buttonText, true, jsonData); //...results (30 max)

          //...enable next line to clear search after [Enter]
          // document.querySelector('.'+g_HeaderSearchInput).value = '';

        } else {  //...

          //...db(...popup nothing found (need UI coded)
          alert('Nothing found. Try again!');
        }

      } else {
         console.log('UNHANDLED Request or Server Error!', response.url, response.status);
      }
    })

    .catch(error => {
      console.log(error);
    });
  })();
}

//...previous code for XMLHttpRequest()  --- save for now, better for errors?
//
// async function getServerData(params) {
//
//   console.log('...In getServerData('+params+')');
//
//   var xhr = new XMLHttpRequest();
//   xhr.onreadystatechange = (uri) => {                          //...ajax handler function
//
//     console.log('...xhr.callback()', params, uri.currentTarget.responseURL);
//     //...callback handling
//     //
//     if(xhr.readyState === xhr.DONE) {                        //...check for error
//
//       //...General error via "APP-ERR ..." msg from server
//       //
//       if(xhr.responseText.indexOf('APP-ERR') > (-1) ||
//          xhr.responseText <= ''                  ) {
//
//         //...db(...replace with better pop-up
//         alert( (xhr.responseText.indexOf('APP-ERR') === 0)   ?
//                xhr.responseText                              :
//                'URL PARAMETER ERROR!\nIs the server running?' );
//         return;
//       }
//
//       //
//       //  [ branch based on what URI was used ]
//       //
//
//       //...URI: 'main-categories' requests
//       if(uri.currentTarget.responseURL.indexOf('/main-categories') > 0)
//       {
//         let jsonData = JSON.parse(xhr.responseText);
//         // console.log('<--- PRODUCT Response:',jsonData);
//
//         //...main catalog page
//         if (document.URL.indexOf('category.html') >= 0) {
//           updateCategoryList(jsonData);
//         }
//
//       }
//       else  //...URI: '/cid=' or '/sid=' (category id) requests
//       if(uri.currentTarget.responseURL.indexOf('/cid=') > 0 ||  //...category id vs sub-cat id
//          uri.currentTarget.responseURL.indexOf('/sid=') > 0) {
//
//         // console.log('<-- CID Response:',xhr.responseText);
//
//         //...parse id from uri
//         let desc         = decodeURIComponent(uri.currentTarget.responseURL.split('&desc=')[1]);
//         let clearButtons = (uri.currentTarget.responseURL.indexOf('/cid=') >= 0 ? true : false);
//         let id = ((uri.currentTarget.responseURL.split('/')[3]).split('=')[1]).split('&')[0];
//
//         updateCategoryData(desc, clearButtons, JSON.parse(xhr.responseText), id);
//       }
//       else  //...URI: 'search=' find products
//       if(uri.currentTarget.responseURL.indexOf('/search=') > 0) {
//
//         console.log('In search products hander!');
//
//         //...nothing found?
//         if(xhr.responseText.length === 0             ||
//            xhr.responseText.indexOf('<!DOCTYPE html>') > (-1)  ) {
//
//           console.log('>>> handle pop-up for nothing found!');
//           //...db(...popup nothing found (need UI coded)
//
//         } else {  //...we found items
//
//           //...use bread-crumb button for search info
//           let buttonText = 'SEARCH: "' + document.querySelector('.'+g_HeaderSearchInput).value + '"';
//           if(JSON.parse(xhr.responseText).length == 30)
//             buttonText += ' (first 30 results) ';
//
//           document.querySelector('.'+g_HeaderBottomSearch).classList.toggle('focused');
//           document.activeElement.blur();
//
//           updateCategoryData(buttonText, true, JSON.parse(xhr.responseText)); //...results (30 max)
//
//           //...enable next line to clear search after [Enter]
//           // document.querySelector('.'+g_HeaderSearchInput).value = '';
//         }
//
//       } else {   //...URI: unknown - handle exceptions
//
//          console.log('UNHANDLED Request!', uri.currentTarget.responseURL);
//       }
//     }
//   };
//
//   xhr.open("GET", '/'+params);             //...assembly API request for server
//   await xhr.send();                        //...send, the above - callback will process it
// }
//



//
//  [ kick start processing ]
//
(() => {

  console.log('Document Ready Actions started...');

  generalPageInit();

  if(document.URL.indexOf('category.html') > 0)
    initCategoryPage();                               //...blank and save elements

  getServerData('main-categories');                   //...always load catalog main categories

})();
