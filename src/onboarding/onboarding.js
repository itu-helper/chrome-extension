// Handle the "Get Started" button click
document.getElementById('getStartedBtn').addEventListener('click', () => {
    // Forward to the specified URL
    window.location.href = "https://itu-helper.github.io";
});

// Optional: Add smooth scroll behavior for any internal links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Log that onboarding page was viewed
console.log('ITU Helper onboarding page loaded');
