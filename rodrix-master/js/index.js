(function() {
    var openPopups = [];

    initPopUp('.popup-contacts', '.header-top-contacts');
    initPopUp('.popup-login', '.header-top-login');
    initPopUp('.popup-cart', '.header-bottom-cart');
    initPopUp('.modal', '.modal');

    initCatalog('.popup-catalog', '.header-bottom-btn');
    initSelects();
    initCategoryViewToggle();
    initSearch();

    function initPopUp(popupSelector, triggerSelector) {
        const popup = document.querySelector(popupSelector);
        const triggerElement = document.querySelector(triggerSelector);

        if (popup === null || triggerElement === null) return;

        triggerElement.addEventListener('click', function(e) {
            e.stopPropagation();
            openPopUp();
        });

        // Karl's mod --- 'click' instead of 'mouseover'
        triggerElement.addEventListener('click', function(e) {
            openPopUp();
        });

        document.addEventListener('click', function(e) {
            if (e.target.closest(popupSelector) === null) {
                closePopUp();
            }
        });

        function openPopUp() {
            popup.classList.add('open');

            if (openPopups.length > 0 && openPopups[0] != popup) {
                closeAllOpenPopups();
            } else if (openPopups.length === 0) {
                openPopups.push(popup);
            }
        }

        function closePopUp() {
            popup.classList.remove('open');
            openPopups = openPopups.filter(function(e) { return e != popup; });
        }
    }

    function closeAllOpenPopups() {
        for (var i = 0; i < openPopups.length; i++) {
            openPopups[i].classList.remove('open');
        }
        openPopups = [];
    }

    function initCatalog(catalogSelector, btnSelector) {
        const catalog = document.querySelector(catalogSelector);
        const btnElement = document.querySelector(btnSelector);
        const mainElement = document.querySelector('main');

        if (catalog === null || btnElement === null | mainElement === null) return;

        let isOpen = false;

        btnElement.addEventListener('click', function(e) {
            e.stopPropagation();

            if (!isOpen) {
                openCatalog();
            } else {
                closeCatalog();
            }

        });

        document.addEventListener('click', function(e) {
            if (isOpen && e.target.closest(catalogSelector) === null) {
                closeCatalog();
            }
        });

        function openCatalog() {
            if(openPopups.length > 0) {
                closeAllOpenPopups();
            }

            catalog.classList.add('open');
            btnElement.classList.add('active');
            mainElement.classList.add('shadowed');
            isOpen = true;
        }

        function closeCatalog() {
            catalog.classList.remove('open');
            btnElement.classList.remove('active');
            mainElement.classList.remove('shadowed');
            isOpen = false;
        }
    }

    function initSelects() {
        $('.select').each(function() {
            var $this = $(this),
                numberOfOptions = $(this).children('option').length;

            $this.addClass('select-hidden');
            $this.wrap('<div class="select"></div>');
            $this.after('<div class="select-styled"></div>');

            var $styledSelect = $this.next('div.select-styled');
            $styledSelect.text($this.children('option[selected]').text());

            var $list = $('<ul />', {
                'class': 'select-options'
            }).insertAfter($styledSelect);

            for (var i = 0; i < numberOfOptions; i++) {
                $('<li />', {
                    text: $this.children('option').eq(i).text(),
                    rel: $this.children('option').eq(i).val()
                }).appendTo($list);
            }

            var $listItems = $list.children('li');

            $styledSelect.click(function(e) {
                e.stopPropagation();
                $('div.select-styled.active').not(this).each(function() {
                    $(this).removeClass('active').next('ul.select-options').hide();
                });
                $(this).toggleClass('active').next('ul.select-options').toggle();
            });

            $listItems.click(function(e) {
                e.stopPropagation();
                $styledSelect.text($(this).text()).removeClass('active');
                $this.val($(this).attr('rel'));
                $list.hide();
                changeLanguage($this.val());
            });

            $(document).click(function() {
                $styledSelect.removeClass('active');
                $list.hide();
            });
        });
    }

// slider

    if(document.querySelector('.slider') !== null)   //...Karl's mod - slider on index.html only
      $('.slider').slick({
          dots: true,
          arrows: false,
          slidesToShow: 1,
          speed: 300,
      });

//...end of mod

    //buttons with price
    // var btnContainer = document.querySelector("buttons");
    // var btn = btnContainer.querySelector("request-account-btn");

    // for (var i = 0; i < btn.length; i++) {
    //     btn[i].addEventListener("click", function() {
    //       var current = document.querySelector("btn-red");
    //       current[0].className = current[0].className.replace(" btn-red", "");
    //       this.className += " btn-red";
    //     });
    //   }
    $('.buttons > .request-account-btn').click(function(e){
        e.preventDefault();
        $('.buttons > .request-account-btn').removeClass('btn-red');
        $(this).addClass('btn-red');
    });



    function initCategoryViewToggle() {
        const content = document.querySelector('.category-goods');
        const viewToggleIcons = document.querySelectorAll('.category-header-icon');
        // const viewListIcon = document.querySelector('.category-header-icon-list');

        if (content === null || viewToggleIcons === null) return;

        for (let i = 0; i < viewToggleIcons.length; i++) {
            const icon = viewToggleIcons[i];
            icon.addEventListener('click', function(e) {
                if (e.toElement.getAttribute('data-view') == 'list') {
                    content.classList.add('list');
                } else {
                    content.classList.remove('list');
                }

                for (let i = 0; i < viewToggleIcons.length; i++) {
                    const icon = viewToggleIcons[i];
                    icon.classList.remove('active');
                }

                e.target.classList.add('active');
            });
        }
    }

    function initSearch() {
        const search      = document.querySelector('.search');
        const searchInput = document.querySelector('.search-input');
        const main        = document.querySelector('main');
        const body        = document.querySelector('body');
        const menuSearchIcon     = document.querySelector('#menu-search-icon');
        // const searchHistory   = document.querySelector('#search-history');
        // const searchNoResults = document.querySelector('#search-no-results');
        // const searchResults   = document.querySelector('#search-results');

        if (search == null) return;

        searchInput.addEventListener('focus', function() {
            search.classList.add('focused');
            main.classList.add('shadowed');

        });

        searchInput.addEventListener('blur', function() {
            search.classList.remove('focused');
            main.classList.remove('shadowed');

            // searchResults.classList.remove('d-block');
            // searchHistory.classList.remove('d-block');
            // searchNoResults.classList.remove('d-block');
        });

        menuSearchIcon.addEventListener('click', function() {
            body.classList.toggle('shadowed');
            search.classList.toggle('d-none');
            menuSearchIcon.classList.toggle('active');
        });

        // searchInput.addEventListener('input', function(e) {
        //     if(e.target.value.length == 0) {
        //         searchHistory.classList.add('d-block');
        //         searchResults.classList.remove('d-block');
        //         searchNoResults.classList.remove('d-block');
        //     } else if (e.target.value.length > 0 && e.target.value.length <= 10) {
        //         searchResults.classList.add('d-block');
        //         searchHistory.classList.remove('d-block');
        //         searchNoResults.classList.remove('d-block');
        //     } else {
        //         searchNoResults.classList.add('d-block');
        //         searchResults.classList.remove('d-block');
        //         searchHistory.classList.remove('d-block');
        //     }
        // });
    }
})();
