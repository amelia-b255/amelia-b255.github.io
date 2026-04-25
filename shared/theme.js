/* Theme Toggle – dark mode is default */
function toggleTheme() {
    document.documentElement.classList.toggle('light-mode');
    var isLight = document.documentElement.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    updateThemeUI();
}

function applyStoredTheme() {
    var isLight = localStorage.getItem('theme') === 'light';
    var html = document.documentElement;
    if (isLight) {
        html.classList.add('light-mode');
    } else {
        html.classList.remove('light-mode');
    }
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
