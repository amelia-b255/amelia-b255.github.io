/* Theme Toggle – dark mode is default */
function toggleTheme() {
    document.documentElement.classList.toggle('light-mode');
    var isLight = document.documentElement.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    updateThemeUI();
}

function updateThemeUI() {
    var isLight = document.documentElement.classList.contains('light-mode');
    var label = document.getElementById('themeLabel');
    if (label) {
        label.textContent = isLight ? 'Dark' : 'Light';
    }
    var toggle = document.getElementById('themeToggle');
    if (toggle) {
        toggle.title = isLight ? 'Switch to dark mode' : 'Switch to light mode';
    }
    document.querySelectorAll('.logo-img').forEach(function(img) {
        img.src = isLight ? 'shared/AB logo.png' : 'shared/AB logo light.png';
    });
}

document.addEventListener('DOMContentLoaded', updateThemeUI);

// Opt out of Safari's back-forward cache entirely.
// Any 'unload' listener makes the page ineligible for bfcache in Safari iOS.
window.addEventListener('unload', function() {});

// Belt-and-suspenders: if the page is still restored from bfcache,
// mark it as a back-navigation (so the splash doesn't fire), then force a fresh load.
window.addEventListener('pageshow', function(e) {
    if (e.persisted) {
        sessionStorage.setItem('_from_back', '1');
        var url = window.location.pathname + '?_cb=' + Date.now() + window.location.hash;
        window.location.replace(url);
    }
});

// Remove the cache-buster from the URL after a forced reload so it doesn't stay visible.
(function() {
    if (window.location.search.indexOf('_cb=') !== -1) {
        var clean = window.location.search.replace(/[?&]_cb=\d+/g, '').replace(/^\?/, '');
        var cleanUrl = window.location.pathname + (clean ? '?' + clean : '') + window.location.hash;
        history.replaceState(null, '', cleanUrl);
    }
})();
