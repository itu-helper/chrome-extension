(function() {
    // Helper function to detect PDF viewer
    function isPdfViewer() {
        return (
            window.location.pathname.toLowerCase().endsWith('.pdf') ||
            document.querySelector('embed[type="application/pdf"]') ||
            document.contentType === 'application/pdf' ||
            (document.body && document.body.children.length === 1 && 
             document.body.children[0].tagName === 'EMBED')
        );
    }

    // Main navbar object
    const ITUNavbar = {
        navContainer: null,
        nav: null,
        currentUrl: window.location.href,
        
        // Initialize the navbar
        init: function(container) {
            // Skip navbar initialization for PDF viewer
            if (isPdfViewer()) return;
            
            this.navContainer = container;
            
            // Create the actual navbar inside the container
            this.nav = document.createElement("div");
            this.nav.id = "itu-navbar";
            this.nav.className = "custom-nav";
            this.navContainer.appendChild(this.nav);
            
            // Add or reuse a buffer div to push content down
            let buffer = document.getElementById('itu-navbar-buffer');
            if (!buffer) {
                buffer = document.createElement('div');
                buffer.id = 'itu-navbar-buffer';
                this.navContainer.after(buffer);
            } else {
                this.navContainer.after(buffer);
            }
            
            // Initialize message listeners
            this.initMessageListeners();
            
            // Update the navbar contents
            this.updateNavbar();
            
            // Register the updater function globally
            window.updateITUNavbar = this.updateITUNavbar.bind(this);
            
            // Wait a moment after page load to initialize navbar if sites data script hasn't loaded yet
            setTimeout(() => {
                if (!window.ITU_SITES) {
                    this.updateNavbar();
                }
            }, 500);
        },
        
        // Update the navbar with settings
        updateNavbar: function(settings) {
            // If we can access the sites data from the injected script
            if (window.ITU_SITES) {
                Promise.all([
                    this.generateLinksHtml(window.ITU_SITES.leftSites),
                    this.generateLinksHtml(window.ITU_SITES.rightSites)
                ]).then(([leftLinksHtml, rightLinksHtml]) => {
                    this.renderNavbar(leftLinksHtml, rightLinksHtml);
                });
            } else {
                // Use the original hardcoded lists if shared data isn't available
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
                    this.generateLinksHtmlLegacy(leftSites),
                    this.generateLinksHtmlLegacy(rightSites)
                ]).then(([leftLinksHtml, rightLinksHtml]) => {
                    this.renderNavbar(leftLinksHtml, rightLinksHtml);
                });
            }
        },
        
        // Render navbar with links
        renderNavbar: function(leftLinksHtml, rightLinksHtml) {
            this.nav.innerHTML = `
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
                            ${leftLinksHtml}
                        </div>
                        <div class="nav-links right-links">
                            ${rightLinksHtml}
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
            
            // Enhanced mobile menu toggle functionality
            const mobileToggle = this.nav.querySelector('.mobile-menu-toggle');
            if (mobileToggle) {
                mobileToggle.addEventListener('click', e => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.navContainer.classList.toggle('mobile-menu-open');

                    // Change icon based on menu state
                    const iconElement = mobileToggle.querySelector('i');
                    if (iconElement) {
                        if (this.navContainer.classList.contains('mobile-menu-open')) {
                            iconElement.className = 'fa-solid fa-times';
                        } else {
                            iconElement.className = 'fa-solid fa-bars';
                        }
                    }

                    // Force redraw of the mobile menu
                    const navLinksContainer = this.nav.querySelector('.nav-links-container');
                    if (navLinksContainer) {
                        navLinksContainer.style.display = 'none';
                        setTimeout(() => {
                            if (this.navContainer.classList.contains('mobile-menu-open')) {
                                navLinksContainer.style.display = 'flex';
                            }
                        }, 10);
                    }
                });
            }

            // Add responsive behavior for small screens
            window.UIUtils.adjustNavbarForScreenSize(this.nav, this.navContainer);
            window.addEventListener('resize', () => window.UIUtils.adjustNavbarForScreenSize(this.nav, this.navContainer));

            // Navbar is always visible - just adjust buffer height
            const bufferEl = document.getElementById('itu-navbar-buffer');
            this.navContainer.style.display = 'block';
            if (bufferEl) bufferEl.style.removeProperty('display');

            setTimeout(() => {
                const exactHeight = this.nav.offsetHeight || 50;
                if (bufferEl) bufferEl.style.setProperty('height', exactHeight + 'px', 'important');
                // Ensure body padding is cleared to avoid double spacing
                document.body.style.setProperty('padding-top', '0', 'important');
            }, 50);
        },
        
        // Generate HTML for links
        generateLinksHtml: function(sites) {
            return new Promise(resolve => {
                chrome.storage.sync.get(['navbarSites'], data => {
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

                        if (this.currentUrl.startsWith(site.url)) {
                            html += `<span class="current-site">${iconHtml}<span class="nav-text">${site.label}</span></span>`;
                        } else {
                            html += `<a href="${site.url}">${iconHtml}<span class="nav-text">${site.label}</span></a>`;
                        }
                    }
                    resolve(html);
                });
            });
        },
        
        // Legacy helper function to generate HTML for links respecting default hidden status
        generateLinksHtmlLegacy: function(sites) {
            return new Promise(resolve => {
                chrome.storage.sync.get(['navbarSites'], data => {
                    let html = '';
                    for (const site of sites) {
                        // Skip sites that are hidden by default or explicitly in settings
                        if ((site.hidden && !data.navbarSites) ||
                            (data.navbarSites && data.navbarSites[site.url] === false)) {
                            continue;
                        }

                        const iconClass = site.icon;
                        const iconHtml = `<i class="${iconClass}" aria-hidden="true"></i>`;

                        if (this.currentUrl.startsWith(site.url)) {
                            html += `<span class="current-site">${iconHtml}<span class="nav-text">${site.label}</span></span>`;
                        } else {
                            html += `<a href="${site.url}">${iconHtml}<span class="nav-text">${site.label}</span></a>`;
                        }
                    }
                    resolve(html);
                });
            });
        },
        
        // Function to update navbar without page reload
        updateITUNavbar: function(settings) {
            if (settings) {
                this.updateNavbar(settings);
            } else {
                this.updateNavbar();
            }
        },
        
        // Initialize message listeners
        initMessageListeners: function() {
            chrome.runtime.onMessage.addListener(request => {
                if (request.action === "updateNavbar") {
                    // Get the current settings from storage
                    chrome.storage.sync.get(['navbarSites'], data => {
                        console.log("Navbar settings retrieved:", data);
                        this.updateITUNavbar(data);
                    });
                    return true;
                }
            });
        }
    };
    
    // Expose the navbar object to the global scope
    window.ITUNavbar = ITUNavbar;
})();
