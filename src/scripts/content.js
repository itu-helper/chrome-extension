(function () {
    if (document.getElementById("itu-navbar")) return; // Avoid duplication - use itu-navbar as the main ID

    // Ensure styles are loaded
    const linkElement = document.createElement('link');
    linkElement.rel = 'stylesheet';
    linkElement.type = 'text/css';
    linkElement.href = chrome.runtime.getURL('styles/styles.css');
    document.head.appendChild(linkElement);
    
    // Add navbar styles
    const navbarStylesLink = document.createElement('link');
    navbarStylesLink.rel = 'stylesheet';
    navbarStylesLink.type = 'text/css';
    navbarStylesLink.href = chrome.runtime.getURL('src/styles/navbar-styles.css');
    document.head.appendChild(navbarStylesLink);
    
    // Add the shared sites data script
    const sitesDataScript = document.createElement('script');
    sitesDataScript.src = chrome.runtime.getURL('src/shared/sites-data.js');
    sitesDataScript.onload = function() {
        initNavbar(); // Initialize navbar after sites data is loaded
    };
    document.head.appendChild(sitesDataScript);

    // Add FontAwesome with a unique ID to avoid conflicts
    if (!document.getElementById('itu-helper-fontawesome')) {
        const script = document.createElement('script');
        script.id = 'itu-helper-fontawesome';
        script.src = 'https://kit.fontawesome.com/9e92a2c380.js';
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
        
        // Also add the CSS as a fallback
        const fontAwesomeLink = document.createElement('link');
        fontAwesomeLink.rel = 'stylesheet';
        fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css';
        document.head.appendChild(fontAwesomeLink);
    }

    // Create a container for the navbar
    const navContainer = document.createElement("div");
    navContainer.id = "custom-nav-container";
    document.body.insertAdjacentElement('afterbegin', navContainer);
    
    // Create the actual navbar inside the regular DOM (shadow DOM had issues with FontAwesome)
    const nav = document.createElement("div");
    nav.id = "itu-navbar"; // Use a single consistent ID
    nav.className = "custom-nav"; // Add a class for additional styling
    
    // Get current URL
    const currentUrl = window.location.href;
    
    // Helper function to generate HTML for links with site visibility check
    function generateLinksHtml(sites) {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['navbarSites', 'showNavbar'], function(data) {
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
    
    // Function to update navbar with sites
    function updateNavbar() {
        // If we can access the sites data from the injected script
        if (window.ITU_SITES) {
            Promise.all([
                generateLinksHtml(window.ITU_SITES.leftSites),
                generateLinksHtml(window.ITU_SITES.rightSites)
            ]).then(([leftLinksHtml, rightLinksHtml]) => {
                nav.innerHTML = `
                    <a href="https://itu-helper.github.io/home" class="logo-container">
                        <img src="https://raw.githubusercontent.com/itu-helper/home/main/images/logo.png" alt="ITU Helper Logo" class="logo">
                    </a>
                    <button class="mobile-menu-toggle">
                        <i class="fas fa-bars"></i>
                    </button>
                    <div class="nav-links left-links">
                        ${leftLinksHtml}
                    </div>
                    <div class="nav-links right-links">
                        ${rightLinksHtml}
                    </div>
                `;
                
                // Add mobile menu toggle functionality
                const mobileToggle = nav.querySelector('.mobile-menu-toggle');
                mobileToggle.addEventListener('click', function() {
                    navContainer.classList.toggle('mobile-menu-open');
                    
                    // Change icon based on menu state
                    if (navContainer.classList.contains('mobile-menu-open')) {
                        mobileToggle.innerHTML = '<i class="fas fa-times"></i>';
                    } else {
                        mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
                    }
                });

                window.addEventListener('resize', adjustNavbarForScreenSize);
                
                // Check if navbar should be shown
                chrome.storage.sync.get(['showNavbar'], function(data) {
                    navContainer.style.display = data.showNavbar === false ? 'none' : 'block';
                });

                // Initialize responsive behavior
                adjustNavbarForScreenSize();
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
                    url: "https://obs.itu.edu.tr",   
                    label: "OBS (Kepler)", 
                    icon: "fa-solid fa-graduation-cap" 
                },
                { 
                    url: "https://smartpay.itu.edu.tr", 
                    label: "Smartpay", 
                    icon: "fa-solid fa-credit-card",
                    hidden: true 
                },
                { 
                    url: "https://ninova.itu.edu.tr/Kampus1", 
                    label: "Ninova", 
                    icon: "fa-solid fa-book" 
                },
                { 
                    url: "https://yardim.itu.edu.tr", 
                    label: "İTÜ Yardım", 
                    icon: "fa-solid fa-circle-question" 
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
                    url: "https://ari24.com/", 
                    label: "ari24", 
                    icon: "fa-solid fa-newspaper" 
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
                nav.innerHTML = `
                    <a href="https://itu-helper.github.io/home/" class="logo-container">
                        <img src="https://raw.githubusercontent.com/itu-helper/home/main/images/logo.png" alt="ITU Helper Logo" class="logo">
                    </a>
                    <button class="mobile-menu-toggle">
                        <i class="fas fa-bars"></i>
                    </button>
                    <div class="nav-links left-links">
                        ${leftLinksHtml}
                    </div>
                    <div class="nav-links right-links">
                        ${rightLinksHtml}
                    </div>
                `;
                
                // Add mobile menu toggle functionality
                const mobileToggle = nav.querySelector('.mobile-menu-toggle');
                mobileToggle.addEventListener('click', function() {
                    navContainer.classList.toggle('mobile-menu-open');
                    
                    // Change icon based on menu state
                    if (navContainer.classList.contains('mobile-menu-open')) {
                        mobileToggle.innerHTML = '<i class="fas fa-times"></i>';
                    } else {
                        mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
                    }
                });

                // Add responsive behavior for small screens
                adjustNavbarForScreenSize();
                window.addEventListener('resize', adjustNavbarForScreenSize);
                
                // Check if navbar should be shown
                chrome.storage.sync.get(['showNavbar'], function(data) {
                    navContainer.style.display = data.showNavbar === false ? 'none' : 'block';
                });
            });
        }
    }
    
    // Legacy helper function to generate HTML for links respecting default hidden status
    function generateLinksHtmlLegacy(sites) {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['navbarSites'], function(data) {
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
    
    // Insert navbar at the beginning of body
    navContainer.appendChild(nav);
    
    // Add a buffer div to push content down
    const buffer = document.createElement('div');
    buffer.id = 'itu-navbar-buffer';
    navContainer.after(buffer);
    
    // Set padding on document body
    document.body.style.paddingTop = '50px';
    document.body.style.marginTop = '0';
    
    // Ensure the navbar is 50px tall - redundancy to make sure it works
    setTimeout(() => {
        document.body.style.paddingTop = '50px';
    }, 100);
    
    // Scroll behavior
    let lastScrollTop = 0;
    let scrollThreshold = 100; // Show/hide after scrolling this many pixels
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // If scrolled down more than threshold
        if (scrollTop > lastScrollTop && scrollTop > scrollThreshold) {
            navContainer.classList.add('nav-hidden');
        } 
        // If scrolled up or at the top
        else if (scrollTop < lastScrollTop || scrollTop <= 0) {
            navContainer.classList.remove('nav-hidden');
        }
        
        lastScrollTop = scrollTop;
    });
    
    // Function to initialize navbar
    function initNavbar() {
        updateNavbar();
        
        // Listen for messages to update the navbar
        chrome.runtime.onMessage.addListener(function(request) {
            if (request.action === "updateNavbar") {
                updateNavbar();
                return true;
            }
        });
    }
    
    // Wait a moment after page load to initialize navbar if sites data script hasn't loaded yet
    setTimeout(function() {
        if (!window.ITU_SITES) {
            initNavbar();
        }
    }, 500);
    
    // Function to adjust navbar for different screen sizes
    function adjustNavbarForScreenSize() {
        const windowWidth = window.innerWidth;
        const mobileToggle = nav.querySelector('.mobile-menu-toggle');
        
        // Apply appropriate classes based on screen width
        if (windowWidth < 768) {
            // Show mobile toggle in small screens
            if (mobileToggle) {
                mobileToggle.style.display = 'flex';
            }
        } else {
            // Hide mobile toggle in large screens
            if (mobileToggle) {
                mobileToggle.style.display = 'none';
            }
            // Ensure menu is not collapsed in desktop view
            navContainer.classList.remove('mobile-menu-open');
        }
    }
})();
