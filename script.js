// Mobile menu toggle
const menuBtn = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');

if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => {
        const open = nav.classList.toggle('open');
        menuBtn.setAttribute('aria-expanded', String(open));
    });

    // Close on link click (mobile)
    nav.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
            if (nav.classList.contains('open')) {
                nav.classList.remove('open');
                menuBtn.setAttribute('aria-expanded', 'false');
            }
        });
    });
}

// Current year in footer
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Lightbox for gallery
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.querySelector('.lightbox__img');
const closeBtn = document.querySelector('.lightbox__close');

function openLightbox(src, alt) {
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightbox.removeAttribute('hidden');
}
function closeLightbox() {
    lightbox.setAttribute('hidden', '');
    lightboxImg.src = '';
    lightboxImg.alt = '';
}

document.querySelectorAll('[data-lightbox] a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const img = link.querySelector('img');
        openLightbox(link.href, img ? img.alt : '');
    });
});

if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
if (lightbox) {
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });
}
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !lightbox.hasAttribute('hidden')) closeLightbox();
});

// Smooth scroll for internal anchors
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const id = a.getAttribute('href').slice(1);
        const el = document.getElementById(id);
        if (el) {
            e.preventDefault();
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});