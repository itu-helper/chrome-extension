(function() {
    const FontAwesomeLoader = {
        init: function() {
            // Improved FontAwesome loading - add CSS first, then script
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
            
            // Initial check
            setTimeout(this.ensureFontAwesomeIsLoaded, 1000);
        },
        
        // Function to ensure FontAwesome is properly loaded
        ensureFontAwesomeIsLoaded: function() {
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
    };
    
    // Initialize the Font Awesome loader
    FontAwesomeLoader.init();
    
    // Expose the FontAwesomeLoader object to the global scope
    window.FontAwesomeLoader = FontAwesomeLoader;
})();
