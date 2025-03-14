(function() {
    const UIUtils = {
        // Function to adjust navbar for different screen sizes
        adjustNavbarForScreenSize: function(nav, navContainer) {
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
            window.FontAwesomeLoader.ensureFontAwesomeIsLoaded();
        }
    };
    
    // Expose the UIUtils object to the global scope
    window.UIUtils = UIUtils;
})();
