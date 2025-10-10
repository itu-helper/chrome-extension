(function () {
    // Exit early if navbar already exists to prevent duplication
    if (document.getElementById("itu-navbar")) return;

    // Load required stylesheets for navbar
    const linkElement = document.createElement('link');
    linkElement.rel = 'stylesheet';
    linkElement.type = 'text/css';
    linkElement.href = chrome.runtime.getURL('src/styles/styles.css');
    document.head.appendChild(linkElement);

    const navbarStylesLink = document.createElement('link');
    navbarStylesLink.rel = 'stylesheet';
    navbarStylesLink.type = 'text/css';
    navbarStylesLink.href = chrome.runtime.getURL('src/styles/navbar-styles.css');
    document.head.appendChild(navbarStylesLink);

    // Create container for navbar
    const navContainer = document.createElement("div");
    navContainer.id = "custom-nav-container";
    document.body.insertAdjacentElement('afterbegin', navContainer);

    // We use the buffer element to reserve space for the navbar.
    // Avoid setting body padding here to prevent duplicate spacing.
    document.body.style.marginTop = '0';

    // Load Font Awesome
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

    // Load sites data script and initialize navbar when loaded
    const sitesDataScript = document.createElement('script');
    sitesDataScript.src = chrome.runtime.getURL('src/shared/sites-data.js');
    sitesDataScript.onload = function() {
        initNavbar();
    };
    document.head.appendChild(sitesDataScript);

    // Create navbar structure
    const nav = document.createElement("div");
    nav.id = "itu-navbar";
    nav.className = "custom-nav";
    navContainer.appendChild(nav);

    // Add or reuse buffer div to push page content down
    let buffer = document.getElementById('itu-navbar-buffer');
    if (!buffer) {
        buffer = document.createElement('div');
        buffer.id = 'itu-navbar-buffer';
        navContainer.after(buffer);
    } else {
        // Ensure buffer is positioned immediately after our container
        navContainer.after(buffer);
    }

    // Initialize variables
    const currentUrl = window.location.href;
    let lastScrollTop = 0;
    let scrollThreshold = 100;
    let isNavbarConstant = false;

    /**
     * Generates HTML for links with site visibility checking
     * 
     * @param {Array} sites - Array of site objects to generate links for
     * @returns {Promise} - Promise resolving to HTML string
     */
    function generateLinksHtml(sites) {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['navbarSites', 'showNavbar'], function (data) {
                let html = '';

                // Get default settings or use saved preferences
                const defaultSettings = window.ITU_SITES ?
                    window.ITU_SITES.getDefaultSettings() : {};
                const siteSettings = data.navbarSites || defaultSettings;

                for (const site of sites) {
                    // Skip sites explicitly disabled in settings
                    if (siteSettings[site.url] === false) {
                        continue;
                    }

                    const iconHtml = `<i class="${site.icon}" aria-hidden="true"></i>`;

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

    /**
     * Legacy function for generating links HTML (used as fallback)
     */
    function generateLinksHtmlLegacy(sites) {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['navbarSites'], function (data) {
                let html = '';
                for (const site of sites) {
                    // Skip hidden sites
                    if ((site.hidden && !data.navbarSites) ||
                        (data.navbarSites && data.navbarSites[site.url] === false)) {
                        continue;
                    }

                    const iconHtml = `<i class="${site.icon}" aria-hidden="true"></i>`;

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

    /**
     * Updates navbar without page reload
     * @param {Object} settings - Optional settings to use for update
     */
    function updateITUNavbar(settings) {
        if (settings) {
            updateNavbar(settings);
        } else {
            updateNavbar();
        }
    }

    /**
     * Adjusts navbar display based on screen size
     * Handles mobile vs desktop layouts
     */
    function adjustNavbarForScreenSize() {
        const windowWidth = window.innerWidth;
        const mobileToggle = nav.querySelector('.mobile-menu-toggle');
        const navLinksContainer = nav.querySelector('.nav-links-container');
        const desktopLayout = nav.querySelector('.desktop-layout');
        const mobileLayout = nav.querySelector('.mobile-layout');

        const isMobile = windowWidth < 768;

        // Toggle layout visibility based on screen size
        if (desktopLayout) desktopLayout.style.display = isMobile ? "none" : "flex";
        if (mobileLayout) mobileLayout.style.display = isMobile ? "flex" : "none";

        // Add custom CSS for layout handling
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

        // Apply mobile-specific styling
        if (isMobile) {
            if (mobileToggle) {
                mobileToggle.style.display = 'flex';
                mobileToggle.style.visibility = 'visible';
            }

            if (navLinksContainer) {
                navLinksContainer.classList.add('mobile-view');

                // Show/hide menu based on open state
                if (!navContainer.classList.contains('mobile-menu-open')) {
                    navLinksContainer.style.display = 'none';
                } else {
                    navLinksContainer.style.display = 'flex';
                    navLinksContainer.style.height = 'auto';
                    navLinksContainer.style.minHeight = '100px';
                }
            }
        } else {
            // Desktop-specific styling
            if (mobileToggle) {
                mobileToggle.style.display = 'none';
            }

            if (navLinksContainer) {
                navLinksContainer.classList.remove('mobile-view');
                navLinksContainer.style.display = 'flex';
                navLinksContainer.style.height = '';
                navLinksContainer.style.minHeight = '';
            }

            navContainer.classList.remove('mobile-menu-open');
        }

        ensureFontAwesomeIsLoaded();
    }

    /**
     * Ensures Font Awesome icons are properly loaded
     * Adds backup loading if primary method fails
     */
    function ensureFontAwesomeIsLoaded() {
        const testIcons = document.querySelectorAll('.fa-solid');
        
        if (testIcons.length > 0) {
            const iconStyle = window.getComputedStyle(testIcons[0]);
            if (iconStyle.fontFamily !== '"Font Awesome 6 Free"' && 
                iconStyle.fontFamily !== 'Font Awesome 6 Free') {
                
                if (!document.getElementById('itu-helper-fontawesome-css-backup')) {
                    const fontAwesomeLink = document.createElement('link');
                    fontAwesomeLink.id = 'itu-helper-fontawesome-css-backup';
                    fontAwesomeLink.rel = 'stylesheet';
                    fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css';
                    document.head.appendChild(fontAwesomeLink);

                    // Add fallback icon styles
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

    /**
     * Updates navbar content with site links
     */
    function updateNavbar(settings) {
        // Use ITU_SITES if available (preferred)
        if (window.ITU_SITES) {
            Promise.all([
                generateLinksHtml(window.ITU_SITES.leftSites),
                generateLinksHtml(window.ITU_SITES.rightSites)
            ]).then(([leftLinksHtml, rightLinksHtml]) => {
                renderNavbar(leftLinksHtml, rightLinksHtml);
            });
        } else {
            // Fallback to hardcoded site lists
            const leftSites = [
                {
                    url: "https://portal.itu.edu.tr",
                    label: "Portal",
                    icon: "fa-solid fa-door-open",
                    hidden: false
                },
                {
                    url: "https://obs.itu.edu.tr/ogrenci/",
                    label: "OBS (Kepler)",
                    icon: "fa-solid fa-graduation-cap",
                    hidden: false
                },
                {
                    url: "https://ninova.itu.edu.tr/Kampus1",
                    label: "Ninova",
                    icon: "fa-solid fa-book",
                    hidden: false
                },
                {
                    url: "https://yeni.webmail.itu.edu.tr/",
                    label: "Webmail",
                    icon: "fa-solid fa-envelope",
                    hidden: false
                }
            ];

            const rightSites = [
                {
                    url: "https://itu-helper.github.io/prereq-scheduler/prerequsitory_chains",
                    label: "Ön Şart Diyagramı",
                    icon: "fa-solid fa-sitemap"
                }
            ];

            Promise.all([
                generateLinksHtmlLegacy(leftSites),
                generateLinksHtmlLegacy(rightSites)
            ]).then(([leftLinksHtml, rightLinksHtml]) => {
                renderNavbar(leftLinksHtml, rightLinksHtml);
            });
        }
    }

    /**
     * Renders the navbar with provided links and sets up interaction handlers
     * 
     * @param {string} leftLinksHtml - HTML for left side links
     * @param {string} rightLinksHtml - HTML for right side links
     */
    function renderNavbar(leftLinksHtml, rightLinksHtml) {
        // Process links to add icon-only classes for responsive display
        const processLinks = (html) => {
            if (!html) return '';
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            const links = tempDiv.querySelectorAll('a, span.current-site');
            
            // Apply icon-only classes based on position
            links.forEach((link, index) => {
                if (index >= 5) {
                    link.classList.add('icon-only');
                    link.classList.add('icon-only-always'); 
                    
                    const navText = link.querySelector('.nav-text');
                    if (navText) {
                        link.setAttribute('data-tooltip', navText.textContent);
                    }
                } else if (index >= 3) {
                    // Icon-only at medium screens
                    link.classList.add('icon-only-medium');
                    
                    const navText = link.querySelector('.nav-text');
                    if (navText) {
                        link.setAttribute('data-tooltip', navText.textContent);
                    }
                } else if (index >= 2) {
                    // Icon-only at small screens
                    link.classList.add('icon-only-small');
                    
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
        
        // Build navbar HTML
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

        // Set up mobile menu toggle
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

                // Force redraw of mobile menu
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

        // Add responsive behavior
        adjustNavbarForScreenSize();
        window.addEventListener('resize', adjustNavbarForScreenSize);

        // Check navbar visibility setting
        chrome.storage.sync.get(['showNavbar'], function (data) {
                const bufferEl = document.getElementById('itu-navbar-buffer');

                if (data.showNavbar === false) {
                    // Hide navbar container and collapse buffer (we rely on buffer for spacing)
                    navContainer.style.display = 'none';
                    if (bufferEl) {
                        bufferEl.style.setProperty('height', '0', 'important');
                        bufferEl.style.setProperty('display', 'none', 'important');
                    }
                    // Ensure body padding is cleared in case any compatibility CSS set it
                    document.body.style.setProperty('padding-top', '0', 'important');
                } else {
                    // Show navbar and set buffer height to the navbar height (buffer provides spacing)
                    navContainer.style.display = 'block';
                    if (bufferEl) bufferEl.style.removeProperty('display');

                    setTimeout(() => {
                        const exactHeight = nav.offsetHeight || 50;
                        if (bufferEl) bufferEl.style.setProperty('height', exactHeight + 'px', 'important');
                        // Ensure body padding is 0 to avoid combined spacing
                        document.body.style.setProperty('padding-top', '0', 'important');
                    }, 50);
                }
        });
    }

    /**
     * Sets up tooltip functionality for icon-only elements
     */
    function setupExternalTooltips() {
        document.querySelectorAll('.itu-external-tooltip').forEach(el => el.remove());
        
        const tooltip = document.createElement('div');
        tooltip.className = 'itu-external-tooltip';
        document.body.appendChild(tooltip);
        
        const iconOnlySelector = '#itu-navbar .nav-links a.icon-only-always, ' +
                                '#itu-navbar .nav-links span.icon-only-always, ' +
                                '#itu-navbar .nav-links a.icon-only-medium, ' +
                                '#itu-navbar .nav-links span.icon-only-medium, ' +
                                '#itu-navbar .nav-links a.icon-only-small, ' +
                                '#itu-navbar .nav-links span.icon-only-small';
        
        document.querySelectorAll(iconOnlySelector).forEach(item => {
            item.addEventListener('mouseenter', function(e) {
                // Check if label is currently hidden (making it an icon-only item)
                const navText = this.querySelector('.nav-text');
                const isHidden = navText && (window.getComputedStyle(navText).display === 'none');
                
                if (!isHidden) return;
                
                const tooltipText = this.getAttribute('data-tooltip');
                if (!tooltipText) return;
                
                // Position tooltip under the element
                const rect = this.getBoundingClientRect();
                tooltip.textContent = tooltipText;
                tooltip.style.display = 'block';
                tooltip.style.opacity = '1';
                
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

    /**
     * Initializes scroll behavior for hiding/showing navbar based on scroll direction
     */
    function initScrollBehavior() {
        window.addEventListener('scroll', function () {
            // Don't hide navbar if it's set to constant
            if (isNavbarConstant) {
                navContainer.classList.remove('nav-hidden');
                return;
            }

            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            // When scrolling down beyond threshold, hide navbar
            if (scrollTop > lastScrollTop && scrollTop > scrollThreshold) {
                navContainer.classList.add('nav-hidden');

                // Close mobile menu when scrolling down
                if (navContainer.classList.contains('mobile-menu-open')) {
                    navContainer.classList.remove('mobile-menu-open');

                    // Update hamburger icon
                    const iconElement = nav.querySelector('.mobile-menu-toggle i');
                    if (iconElement) {
                        iconElement.className = 'fa-solid fa-bars';
                    }

                    // Hide mobile menu
                    const navLinksContainer = nav.querySelector('.nav-links-container');
                    if (navLinksContainer && navLinksContainer.classList.contains('mobile-view')) {
                        navLinksContainer.style.display = 'none';
                    }
                }
            }
            // When scrolling up or at top, show navbar
            else if (scrollTop < lastScrollTop || scrollTop <= 0) {
                navContainer.classList.remove('nav-hidden');
            }

            lastScrollTop = scrollTop;
        });
        
        // Check setting on load
        chrome.storage.sync.get(['constantNavbar'], function (data) {
            isNavbarConstant = data.constantNavbar === true;
        });

        // Listen for setting changes
        chrome.storage.onChanged.addListener(function (changes) {
            if (changes.constantNavbar) {
                isNavbarConstant = changes.constantNavbar.newValue === true;
            }
        });
    }

    /**
     * Main initialization function for navbar
     */
    function initNavbar() {
        updateNavbar();
        initScrollBehavior();

        // Set default value for constantNavbar if not already set
        chrome.storage.sync.get(['constantNavbar'], function (data) {
            if (data.constantNavbar === undefined) {
                chrome.storage.sync.set({ constantNavbar: false });
            }
        });

        // Listen for messages from popup or other extension components
        chrome.runtime.onMessage.addListener(function (request) {
            if (request.action === "updateNavbar") {
                chrome.storage.sync.get(['navbarSites', 'showNavbar'], function (data) {
                    updateITUNavbar(data);
                });
                return true;
            }
            else if (request.action === "toggleConstantNavbar") {
                if (request.constant) {
                    navContainer.classList.remove('nav-hidden');
                } else {
                    // When turning off constant mode, check scroll position
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

        // Register updater function globally for other scripts to use
        window.updateITUNavbar = updateITUNavbar;
    }
})();
