// Shared sites data for use in both popup and content scripts

const ITU_SITES = {
  // Left-aligned sites
  leftSites: [
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
      url: "https://smartpay.itu.edu.tr",
      label: "Smartpay",
      icon: "fa-solid fa-credit-card",
      hidden: true
    },
    {
      url: "https://ninova.itu.edu.tr/Kampus1",
      label: "Ninova",
      icon: "fa-solid fa-book",
      hidden: false
    },
    {
      url: "https://yardim.itu.edu.tr",
      label: "İTÜ Yardım",
      icon: "fa-solid fa-circle-question",
      hidden: true
    },
    {
      url: "https://webmail.itu.edu.tr",
      label: "Webmail",
      icon: "fa-solid fa-envelope",
      hidden: false
    },
    {
      url: "https://kutuphane.itu.edu.tr/",
      label: "Kütüphane",
      icon: "fa-solid fa-book-open",
      hidden: true
    },
    {
      url: "https://obs.itu.edu.tr/public/DersProgram",
      label: "Ders Programları",
      icon: "fa-solid fa-calendar-alt",
      hidden: true
    },
    {
      url: "https://obs.itu.edu.tr/public/DersPlan",
      label: "Ders Planları",
      icon: "fa-solid fa-calendar-week",
      hidden: true
    },
    {
      url: "https://www.mathavuz.itu.edu.tr/",
      label: "Mat Havuz",
      icon: "fa-solid fa-calculator",
      hidden: true
    }
  ],

  // Separator between groups
  separator: {
    isSeparator: true,
    hidden: false
  },

  // Right-aligned sites
  rightSites: [
    {
      url: "https://itu-helper.github.io/prereq-scheduler/prerequsitory_chains",
      label: "Ön Şart Diyagramı",
      icon: "fa-solid fa-sitemap",
      hidden: false
    },
    {
      url: "https://ari24.com",
      label: "ari24",
      icon: "fa-solid fa-newspaper",
      hidden: true
    },
    {
      url: "http://www.notkutusu.com",
      label: "Not Kutusu",
      icon: "fa-solid fa-notes-medical",
      hidden: true
    },
    {
      url: "https://ituprogram.com/",
      label: "Program Arşivi",
      icon: "fa-solid fa-box-archive",
      hidden: true
    },
    {
      url: "https://itusenlikci.com/",
      label: "Şenlikçi",
      icon: "fa-solid fa-calendar-days",
      hidden: true
    }
  ],

  // Get a flat array of all sites
  getAllSites: function () {
    return [...this.leftSites, this.separator, ...this.rightSites];
  },

  // Get default visibility settings for all sites
  getDefaultSettings: function () {
    const settings = {};
    this.getAllSites().forEach(site => {
      if (!site.isSeparator) {
        settings[site.url] = !site.hidden; // true if shown, false if hidden
      } else {
        settings['separator'] = !site.hidden;
      }
    });
    return settings;
  },

  // Get a site by URL
  getSiteByUrl: function (url) {
    return this.getAllSites().find(site =>
      !site.isSeparator && (
        url === site.url ||
        url.startsWith(site.url + "/") ||
        new URL(url).hostname === new URL(site.url).hostname
      )
    );
  }
};

// Make it available globally
if (typeof window !== 'undefined') {
  window.ITU_SITES = ITU_SITES;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ITU_SITES;
}
