(function () {
    if (document.getElementById("itu-navbar")) return; // Avoid duplication - use itu-navbar as the main ID

    // Ensure styles are loaded
    const linkElement = document.createElement('link');
    linkElement.rel = 'stylesheet';
    linkElement.type = 'text/css';
    linkElement.href = chrome.runtime.getURL('src/styles/styles.css');
    document.head.appendChild(linkElement);

    // Add navbar styles
    const navbarStylesLink = document.createElement('link');
    navbarStylesLink.rel = 'stylesheet';
    navbarStylesLink.type = 'text/css';
    navbarStylesLink.href = chrome.runtime.getURL('src/styles/navbar-styles.css');
    document.head.appendChild(navbarStylesLink);

    // Create a container for the navbar
    const navContainer = document.createElement("div");
    navContainer.id = "custom-nav-container";
    document.body.insertAdjacentElement('afterbegin', navContainer);

    // Set padding on document body
    document.body.style.paddingTop = '50px';
    document.body.style.marginTop = '0';

    // Ensure the navbar is 50px tall - redundancy to make sure it works
    setTimeout(() => {
        document.body.style.paddingTop = '50px';
    }, 100);

    // Load Font Awesome directly instead of via external script
    if (!document.getElementById('itu-helper-fontawesome-css')) {
        const fontAwesomeLink = document.createElement('link');
        fontAwesomeLink.id = 'itu-helper-fontawesome-css';
        fontAwesomeLink.rel = 'stylesheet';
        fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css';
        document.head.appendChild(fontAwesomeLink);
    }

    if (!document.getElementById('itu-helper-fontawesome')) {
        const script = document.createElement('script');
        script.id = 'itu-helper-fontawesome';
        script.src = 'https://kit.fontawesome.com/9e92a2c380.js';
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
    }

    // Add the shared sites data script - load it directly into the page
    const sitesDataScript = document.createElement('script');
    sitesDataScript.src = chrome.runtime.getURL('src/shared/sites-data.js');
    sitesDataScript.onload = function() {
        initNavbar(); // Initialize navbar after sites data is loaded
    };
    document.head.appendChild(sitesDataScript);

    // Create the actual navbar inside the regular DOM
    const nav = document.createElement("div");
    nav.id = "itu-navbar";
    nav.className = "custom-nav";
    navContainer.appendChild(nav);

    // Add a buffer div to push content down
    const buffer = document.createElement('div');
    buffer.id = 'itu-navbar-buffer';
    navContainer.after(buffer);

    // Include all the remaining functionality from the previous content.js
    // Get current URL
    const currentUrl = window.location.href;
    let lastScrollTop = 0;
    let scrollThreshold = 100;
    let isNavbarConstant = false;

    // Helper function to generate HTML for links with site visibility check
    function generateLinksHtml(sites) {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['navbarSites', 'showNavbar'], function (data) {
                let html = '';

                // Get default settings if no saved preferences
                const defaultSettings = window.ITU_SITES ?
                    window.ITU_SITES.getDefaultSettings() : {};

                // Use saved preferences if available, otherwise use defaults
                const siteSettings = data.navbarSites || defaultSettings;

                for (const site of sites) {
                    // Skip this site if it's explicitly disabled in settings or hidden by default
                    if (siteSettings[site.url] === false) {
                        continue;
                    }

                    const iconClass = site.icon;
                    const iconHtml = `<i class="${iconClass}" aria-hidden="true"></i>`;

                    if (currentUrl.startsWith(site.url)) {
                        html += `<span class="current-site">${iconHtml}<span class="nav-text">${site.label}</span></span>`;
                    } else {
                        html += `<a href="${site.url}">${iconHtml}<span class="nav-text">${site.label}</span></a>`;
                    }
                }
                resolve(html);
            });
        });
    }

    // Legacy helper function to generate HTML for links respecting default hidden status
    function generateLinksHtmlLegacy(sites) {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['navbarSites'], function (data) {
                let html = '';
                for (const site of sites) {
                    // Skip sites that are hidden by default or explicitly in settings
                    if ((site.hidden && !data.navbarSites) ||
                        (data.navbarSites && data.navbarSites[site.url] === false)) {
                        continue;
                    }

                    const iconClass = site.icon;
                    const iconHtml = `<i class="${iconClass}" aria-hidden="true"></i>`;

                    if (currentUrl.startsWith(site.url)) {
                        html += `<span class="current-site">${iconHtml}<span class="nav-text">${site.label}</span></span>`;
                    } else {
                        html += `<a href="${site.url}">${iconHtml}<span class="nav-text">${site.label}</span></a>`;
                    }
                }
                resolve(html);
            });
        });
    }

    // Function to update the navbar without page reload 
    function updateITUNavbar(settings) {
        // If settings are passed, use them; otherwise, call updateNavbar which will fetch settings
        if (settings) {
            // Use settings to update the navbar
            updateNavbar(settings);
        } else {
            updateNavbar();
        }
    }

    // Function to adjust navbar for different screen sizes
    function adjustNavbarForScreenSize() {
        const windowWidth = window.innerWidth;
        const mobileToggle = nav.querySelector('.mobile-menu-toggle');
        const navLinksContainer = nav.querySelector('.nav-links-container');
        const desktopLayout = nav.querySelector('.desktop-layout');
        const mobileLayout = nav.querySelector('.mobile-layout');

        const isMobile = windowWidth < 768;

        // Toggle layouts - Fix: use style.display for both layouts
        if (desktopLayout) desktopLayout.style.display = isMobile ? "none" : "flex";
        if (mobileLayout) mobileLayout.style.display = isMobile ? "flex" : "none";

        // Add custom CSS to fix styling issues
        let customStyles = document.getElementById('itu-helper-nav-styles');
        if (!customStyles) {
            customStyles = document.createElement('style');
            customStyles.id = 'itu-helper-nav-styles';
            document.head.appendChild(customStyles);
        }

        customStyles.textContent = `
            .desktop-layout {
                width: 100%;
                display: flex;
                justify-content: space-between;
            }
            .mobile-layout {
                width: 100%;
            }
            .mobile-layout .mobile-links {
                display: flex;
                flex-direction: column;
                width: 100%;
            }
            .mobile-layout .mobile-links a, 
            .mobile-layout .mobile-links span {
                display: block;
                width: 100%;
                padding: 10px 15px;
                text-align: left;
            }
            .nav-links-container.mobile-view {
                position: absolute;
                top: 50px;
                left: 0;
                width: 100%;
                background-color: #333333;
                z-index: 1000;
            }
        `;

        // Apply appropriate classes based on screen width
        if (isMobile) {
            // Show mobile toggle in small screens
            if (mobileToggle) {
                mobileToggle.style.display = 'flex';
                mobileToggle.style.visibility = 'visible'; // Ensure visibility
            }

            // Ensure mobile menu styling is applied
            if (navLinksContainer) {
                navLinksContainer.classList.add('mobile-view');

                // Keep the menu hidden unless it's explicitly open
                if (!navContainer.classList.contains('mobile-menu-open')) {
                    navLinksContainer.style.display = 'none';
                } else {
                    navLinksContainer.style.display = 'flex';
                    navLinksContainer.style.height = 'auto';
                    navLinksContainer.style.minHeight = '100px';
                }
            }
        } else {
            // Hide mobile toggle in large screens
            if (mobileToggle) {
                mobileToggle.style.display = 'none';
            }

            // Ensure desktop styling is applied
            if (navLinksContainer) {
                navLinksContainer.classList.remove('mobile-view');
                navLinksContainer.style.display = 'flex'; // Always show in desktop mode
                navLinksContainer.style.height = '';
                navLinksContainer.style.minHeight = '';
            }

            // Ensure menu is not collapsed in desktop view
            navContainer.classList.remove('mobile-menu-open');
        }

        // Double check FontAwesome is loaded
        ensureFontAwesomeIsLoaded();
    }

    // Function to ensure FontAwesome is properly loaded
    function ensureFontAwesomeIsLoaded() {
        // Check if FA styles are applied
        const testIcons = document.querySelectorAll('.fa-solid');
        
        if (testIcons.length > 0) {
            const iconStyle = window.getComputedStyle(testIcons[0]);
            if (iconStyle.fontFamily !== '"Font Awesome 6 Free"' && 
                iconStyle.fontFamily !== 'Font Awesome 6 Free') {
                
                // Reload FontAwesome if necessary
                if (!document.getElementById('itu-helper-fontawesome-css-backup')) {
                    const fontAwesomeLink = document.createElement('link');
                    fontAwesomeLink.id = 'itu-helper-fontawesome-css-backup';
                    fontAwesomeLink.rel = 'stylesheet';
                    fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css';
                    document.head.appendChild(fontAwesomeLink);

                    // Add explicit FA styles as a last resort
                    const faStyles = document.createElement('style');
                    faStyles.textContent = `
                        .fa-solid.fa-times:before { content: "\\f00d"; }
                        .fa-solid.fa-bars:before { content: "\\f0c9"; }
                    `;
                    document.head.appendChild(faStyles);
                }
            }
        }
    }

    // Function to update navbar with sites
    function updateNavbar(settings) {
        // If we can access the sites data from the injected script
        if (window.ITU_SITES) {
            Promise.all([
                generateLinksHtml(window.ITU_SITES.leftSites),
                generateLinksHtml(window.ITU_SITES.rightSites)
            ]).then(([leftLinksHtml, rightLinksHtml]) => {
                renderNavbar(leftLinksHtml, rightLinksHtml);
            });
        } else {
            // Use the original hardcoded lists if shared data isn't available
            const leftSites = [
                {
                    url: "https://portal.itu.edu.tr",
                    label: "Portal",
                    icon: "fa-solid fa-door-open"
                },
                {
                    url: "https://webmail.itu.edu.tr",
                    label: "Webmail",
                    icon: "fa-solid fa-envelope"
                }
            ];

            const rightSites = [
                {
                    url: "https://itu-helper.github.io/prereq-scheduler/prerequsitory_chains",
                    label: "Ön Şart Diyagramı",
                    icon: "fa-solid fa-sitemap"
                },
                {
                    url: "http://www.notkutusu.com/",
                    label: "Not Kutusu",
                    icon: "fa-solid fa-notes-medical"
                }
            ];

            // Generate HTML for left and right links with promise support
            Promise.all([
                generateLinksHtmlLegacy(leftSites),
                generateLinksHtmlLegacy(rightSites)
            ]).then(([leftLinksHtml, rightLinksHtml]) => {
                renderNavbar(leftLinksHtml, rightLinksHtml);
            });
        }
    }

    function renderNavbar(leftLinksHtml, rightLinksHtml) {
        // Process the HTML to add icon-only class to items beyond the responsive limit
        const processLinks = (html) => {
            if (!html) return '';
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            const links = tempDiv.querySelectorAll('a, span.current-site');
            
            // Apply initial icon-only classes based on default limit
            // The actual display will be controlled by CSS media queries
            links.forEach((link, index) => {
                if (index >= 5) {
                    link.classList.add('icon-only');
                    link.classList.add('icon-only-always'); // Always icon-only regardless of screen size
                    
                    // Add data attribute for tooltip
                    const navText = link.querySelector('.nav-text');
                    if (navText) {
                        link.setAttribute('data-tooltip', navText.textContent);
                    }
                } else if (index >= 3) {
                    // These will become icon-only at smaller screens
                    link.classList.add('icon-only-medium');
                    
                    // Add data attribute for tooltip
                    const navText = link.querySelector('.nav-text');
                    if (navText) {
                        link.setAttribute('data-tooltip', navText.textContent);
                    }
                } else if (index >= 2) {
                    // These will become icon-only at smaller screens
                    link.classList.add('icon-only-small');
                    
                    // Add data attribute for tooltip
                    const navText = link.querySelector('.nav-text');
                    if (navText) {
                        link.setAttribute('data-tooltip', navText.textContent);
                    }
                }
            });
            
            return tempDiv.innerHTML;
        };
        
        const processedLeftLinks = processLinks(leftLinksHtml);
        const processedRightLinks = processLinks(rightLinksHtml);
        
        nav.innerHTML = `
            <div class="logo-wrapper">
                <a href="https://itu-helper.github.io/home" class="logo-container">
                    <img src="https://raw.githubusercontent.com/itu-helper/home/main/images/logo.png" alt="ITU Helper Logo" class="logo">
                </a>
            </div>
            <button class="mobile-menu-toggle" type="button" aria-label="Toggle navigation">
                <i class="fa-solid fa-bars" aria-hidden="true"></i>
            </button>
            <div class="nav-links-container">
                <!-- Desktop Layout -->
                <div class="desktop-layout">
                    <div class="nav-links left-links">
                        ${processedLeftLinks}
                    </div>
                    <div class="nav-links right-links">
                        ${processedRightLinks}
                    </div>
                </div>
                
                <!-- Mobile Layout -->
                <div class="mobile-layout">
                    <div class="mobile-links">
                        ${leftLinksHtml}
                        ${rightLinksHtml}
                    </div>
                </div>
            </div>
        `;
        
        // Create tooltips outside the navbar
        setupExternalTooltips();
        
        // Add CSS for icon-only items
        let iconOnlyStyles = document.getElementById('icon-only-styles');
        if (!iconOnlyStyles) {
            iconOnlyStyles = document.createElement('style');
            iconOnlyStyles.id = 'icon-only-styles';
            document.head.appendChild(iconOnlyStyles);
            
            iconOnlyStyles.textContent = `
                /* Fix navbar overflow */
                #itu-navbar {
                    overflow: visible !important;
                }
                .nav-links {
                    overflow: visible !important;
                }
                #custom-nav-container {
                    overflow: visible !important;
                }
                
                /* Base styles for icon-only items */
                #itu-navbar .nav-links a.icon-only .nav-text,
                #itu-navbar .nav-links span.icon-only .nav-text,
                #itu-navbar .nav-links a.icon-only-always .nav-text,
                #itu-navbar .nav-links span.icon-only-always .nav-text {
                    display: none;
                }
                
                /* Responsive behavior for medium screens */
                @media (max-width: 1500px) {
                    #itu-navbar .nav-links a.icon-only-medium .nav-text,
                    #itu-navbar .nav-links span.icon-only-medium .nav-text {
                        display: none;
                    }
                    #itu-navbar .nav-links a.icon-only-medium,
                    #itu-navbar .nav-links span.icon-only-medium {
                        position: relative;
                        width: auto;
                        padding: 0 12px;
                    }
                }
                
                /* Responsive behavior for small screens */
                @media (max-width: 1200px) {
                    #itu-navbar .nav-links a.icon-only-small .nav-text,
                    #itu-navbar .nav-links span.icon-only-small .nav-text {
                        display: none;
                    }
                    #itu-navbar .nav-links a.icon-only-small,
                    #itu-navbar .nav-links span.icon-only-small {
                        position: relative;
                        width: auto;
                        padding: 0 12px;
                    }
                }
                
                /* External tooltip style */
                .itu-external-tooltip {
                    display: none;
                    position: fixed;
                    background: #333;
                    color: white;
                    padding: 5px 10px;
                    border-radius: 3px;
                    z-index: 10000;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                    font-size: 14px;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                    white-space: nowrap;
                    font-family: Arial, sans-serif;
                }
                
                /* Arrow for tooltip */
                .itu-external-tooltip:before {
                    content: '';
                    position: absolute;
                    top: -5px;
                    left: 50%;
                    transform: translateX(-50%);
                    border-width: 0 5px 5px 5px;
                    border-style: solid;
                    border-color: transparent transparent #333 transparent;
                }
                
                /* Position and styling for icon-only items */
                #itu-navbar .nav-links a.icon-only,
                #itu-navbar .nav-links span.icon-only,
                #itu-navbar .nav-links a.icon-only-always,
                #itu-navbar .nav-links span.icon-only-always {
                    position: relative;
                    width: auto;
                    padding: 0 12px;
                }
                
                /* Don't apply icon-only in mobile view */
                .mobile-layout .mobile-links a.icon-only .nav-text,
                .mobile-layout .mobile-links span.icon-only .nav-text,
                .mobile-layout .mobile-links a.icon-only-medium .nav-text,
                .mobile-layout .mobile-links span.icon-only-medium .nav-text,
                .mobile-layout .mobile-links a.icon-only-small .nav-text,
                .mobile-layout .mobile-links span.icon-only-small .nav-text,
                .mobile-layout .mobile-links a.icon-only-always .nav-text,
                .mobile-layout .mobile-links span.icon-only-always .nav-text {
                    display: inline !important;
                }
            `;
        }

        // Setup event listeners for the tooltips
        function setupExternalTooltips() {
            // Remove any existing tooltips
            document.querySelectorAll('.itu-external-tooltip').forEach(el => el.remove());
            
            // Create tooltip container that will be appended to body
            const tooltip = document.createElement('div');
            tooltip.className = 'itu-external-tooltip';
            document.body.appendChild(tooltip);
            
            // Selector for all potential icon-only elements
            const iconOnlySelector = '#itu-navbar .nav-links a.icon-only-always, ' +
                                    '#itu-navbar .nav-links span.icon-only-always, ' +
                                    '#itu-navbar .nav-links a.icon-only-medium, ' +
                                    '#itu-navbar .nav-links span.icon-only-medium, ' +
                                    '#itu-navbar .nav-links a.icon-only-small, ' +
                                    '#itu-navbar .nav-links span.icon-only-small';
            
            // Add event listeners to all potential icon-only elements
            document.querySelectorAll(iconOnlySelector).forEach(item => {
                item.addEventListener('mouseenter', function(e) {
                    // Check if the label is currently hidden (making it an icon-only item)
                    const navText = this.querySelector('.nav-text');
                    const isHidden = navText && (window.getComputedStyle(navText).display === 'none');
                    
                    if (!isHidden) return;
                    
                    const tooltipText = this.getAttribute('data-tooltip');
                    if (!tooltipText) return;
                    
                    // Position the tooltip under the element
                    const rect = this.getBoundingClientRect();
                    tooltip.textContent = tooltipText;
                    tooltip.style.display = 'block';
                    tooltip.style.opacity = '1';
                    
                    // Position center-bottom of the element
                    tooltip.style.top = (rect.bottom + 10) + 'px';
                    tooltip.style.left = (rect.left + rect.width/2) + 'px';
                    tooltip.style.transform = 'translateX(-50%)';
                });
                
                item.addEventListener('mouseleave', function() {
                    tooltip.style.display = 'none';
                    tooltip.style.opacity = '0';
                });
            });
        }

        // Listen for window resize to update tooltips
        window.addEventListener('resize', function() {
            // Short delay to allow CSS media queries to apply first
            setTimeout(setupExternalTooltips, 100);
        });

        // Enhanced mobile menu toggle functionality
        const mobileToggle = nav.querySelector('.mobile-menu-toggle');
        if (mobileToggle) {
            mobileToggle.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                navContainer.classList.toggle('mobile-menu-open');

                // Change icon based on menu state
                const iconElement = mobileToggle.querySelector('i');
                if (iconElement) {
                    if (navContainer.classList.contains('mobile-menu-open')) {
                        iconElement.className = 'fa-solid fa-times';
                    } else {
                        iconElement.className = 'fa-solid fa-bars';
                    }
                }

                // Force redraw of the mobile menu
                const navLinksContainer = nav.querySelector('.nav-links-container');
                if (navLinksContainer) {
                    navLinksContainer.style.display = 'none';
                    setTimeout(() => {
                        if (navContainer.classList.contains('mobile-menu-open')) {
                            navLinksContainer.style.display = 'flex';
                        }
                    }, 10);
                }
            });
        }

        // Add responsive behavior for small screens
        adjustNavbarForScreenSize();
        window.addEventListener('resize', adjustNavbarForScreenSize);

        // Check if navbar should be shown
        chrome.storage.sync.get(['showNavbar'], function (data) {
            navContainer.style.display = data.showNavbar === false ? 'none' : 'block';
        });
    }

    // Initialize scroll behavior for hiding/showing navbar
    function initScrollBehavior() {
        window.addEventListener('scroll', function () {
            // If navbar is set to constant, don't hide it on scroll
            if (isNavbarConstant) {
                navContainer.classList.remove('nav-hidden');
                return;
            }

            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            // If scrolled down more than threshold
            if (scrollTop > lastScrollTop && scrollTop > scrollThreshold) {
                navContainer.classList.add('nav-hidden');

                // Also close the mobile menu if it's open when scrolling down
                if (navContainer.classList.contains('mobile-menu-open')) {
                    navContainer.classList.remove('mobile-menu-open');

                    // Update the icon to the hamburger icon
                    const iconElement = nav.querySelector('.mobile-menu-toggle i');
                    if (iconElement) {
                        iconElement.className = 'fa-solid fa-bars';
                    }

                    // Hide the mobile menu
                    const navLinksContainer = nav.querySelector('.nav-links-container');
                    if (navLinksContainer && navLinksContainer.classList.contains('mobile-view')) {
                        navLinksContainer.style.display = 'none';
                    }
                }
            }
            // If scrolled up or at the top
            else if (scrollTop < lastScrollTop || scrollTop <= 0) {
                navContainer.classList.remove('nav-hidden');
            }

            lastScrollTop = scrollTop;
        });
        
        // Check the setting once on load
        chrome.storage.sync.get(['constantNavbar'], function (data) {
            isNavbarConstant = data.constantNavbar === true;
        });

        // Listen for changes to the setting
        chrome.storage.onChanged.addListener(function (changes) {
            if (changes.constantNavbar) {
                isNavbarConstant = changes.constantNavbar.newValue === true;
            }
        });
    }

    // Function to initialize navbar
    function initNavbar() {
        updateNavbar();
        initScrollBehavior();

        // Set default value for constantNavbar if not already set
        chrome.storage.sync.get(['constantNavbar'], function (data) {
            if (data.constantNavbar === undefined) {
                chrome.storage.sync.set({ constantNavbar: false });
            }
        });

        // Listen for messages to update the navbar
        chrome.runtime.onMessage.addListener(function (request) {
            if (request.action === "updateNavbar") {
                // Get the current settings from storage
                chrome.storage.sync.get(['navbarSites', 'showNavbar'], function (data) {
                    console.log("Navbar settings retrieved:", data);
                    updateITUNavbar(data);
                });
                return true;
            }
            // Add handler for toggling constant navbar
            else if (request.action === "toggleConstantNavbar") {
                if (request.constant) {
                    navContainer.classList.remove('nav-hidden');
                } else {
                    // When turning off constant mode, check scroll position
                    // to determine if navbar should be hidden
                    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                    if (scrollTop > scrollThreshold) {
                        navContainer.classList.add('nav-hidden');
                    } else {
                        navContainer.classList.remove('nav-hidden');
                    }
                }
                return true;
            }
        });

        // Register the updater function globally
        window.updateITUNavbar = updateITUNavbar;
    }
})();
