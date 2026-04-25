/* Theme Toggle – dark on every fresh visit/refresh, but persists across in-site nav */
function toggleTheme() {
    document.documentElement.classList.toggle('light-mode');
    var isLight = document.documentElement.classList.contains('light-mode');
    // Use sessionStorage so the preference travels with internal navigation
    // but resets on tab close / refresh / fresh external visit.
    try { sessionStorage.setItem('theme', isLight ? 'light' : 'dark'); } catch(e) {}
    updateThemeUI();
}

function applyStoredTheme() {
    var html = document.documentElement;
    var stored;
    try { stored = sessionStorage.getItem('theme'); } catch(e) { stored = null; }
    if (stored === 'light') html.classList.add('light-mode');
    else                    html.classList.remove('light-mode');
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
    if (typeof applyNameStyle === 'function') applyNameStyle();
}

document.addEventListener('DOMContentLoaded', updateThemeUI);

// When the page is restored from bfcache (back navigation in Safari/Firefox),
// re-apply the stored theme so the page reflects the user's current preference,
// not whatever state the page was in when they navigated away.
window.addEventListener('pageshow', function(e) {
    if (e.persisted) {
        sessionStorage.setItem('_from_back', '1');
        applyStoredTheme();
        updateThemeUI();
    }
});
