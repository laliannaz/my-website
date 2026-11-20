const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#primary-nav');
const siteHeader = document.querySelector('.site-header');
const desktopNavigation = window.matchMedia('(min-width: 64rem)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function setMenuOpen(open) {
    navigation.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.textContent = open ? 'Close' : 'Menu';
}

siteHeader.classList.add('has-menu');
menuButton.hidden = false;

menuButton.addEventListener('click', () => {
    setMenuOpen(menuButton.getAttribute('aria-expanded') === 'false');
});

navigation.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenuOpen(false);
});

document.addEventListener('pointerdown', (event) => {
    if (!siteHeader.contains(event.target)) setMenuOpen(false);
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
        setMenuOpen(false);
        menuButton.focus();
    }
});

desktopNavigation.addEventListener('change', () => setMenuOpen(false));

const sectionLinks = Array.from(navigation.querySelectorAll('a[href^="#"]'), link => ({
    link,
    section: document.getElementById(link.hash.slice(1)),
}));
let currentSectionLink = null;
let sectionUpdateFrame = 0;

function updateCurrentSection() {
    sectionUpdateFrame = 0;
    const readingLine = siteHeader.offsetHeight + Math.min(window.innerHeight * .16, 140);
    const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    let nextLink = null;
    let closestTop = -Infinity;

    for (const { link, section } of sectionLinks) {
        const top = section.getBoundingClientRect().top;
        if (top > readingLine || top < closestTop) continue;

        // Skills and Education can start on the same row.
        if (top === closestTop && link.hash !== window.location.hash) continue;

        nextLink = link;
        closestTop = top;
    }

    if (atBottom) nextLink = sectionLinks.at(-1).link;

    if (nextLink !== currentSectionLink) {
        currentSectionLink?.removeAttribute('aria-current');
        nextLink?.setAttribute('aria-current', 'location');
        currentSectionLink = nextLink;
    }

    navigation.classList.toggle('has-current-section', Boolean(nextLink));
    if (nextLink && desktopNavigation.matches) {
        navigation.style.setProperty('--nav-indicator-x', nextLink.offsetLeft + 'px');
        navigation.style.setProperty('--nav-indicator-width', nextLink.offsetWidth + 'px');
    }
}

function queueSectionUpdate() {
    if (!sectionUpdateFrame) sectionUpdateFrame = requestAnimationFrame(updateCurrentSection);
}

window.addEventListener('scroll', queueSectionUpdate, { passive: true });
window.addEventListener('resize', queueSectionUpdate);
window.addEventListener('hashchange', queueSectionUpdate);
document.fonts.ready.then(queueSectionUpdate);
queueSectionUpdate();

if (!reducedMotion.matches && 'IntersectionObserver' in window) {
    const featuredCards = document.querySelectorAll('.gallery-card--featured');
    const revealThreshold = .12;
    const revealObserver = new IntersectionObserver((entries, observer) => {
        for (const { target, intersectionRatio } of entries) {
            if (intersectionRatio < revealThreshold) continue;

            observer.unobserve(target);
            target.classList.replace('is-awaiting-reveal', 'is-revealing');
        }
    }, { threshold: revealThreshold });

    featuredCards.forEach(card => {
        card.classList.add('is-awaiting-reveal');
        revealObserver.observe(card);
        card.querySelector('img').addEventListener('animationend', () => {
            card.classList.remove('is-revealing');
        }, { once: true });
        card.addEventListener('focusin', () => {
            revealObserver.unobserve(card);
            card.classList.remove('is-awaiting-reveal', 'is-revealing');
        }, { once: true });
    });

    reducedMotion.addEventListener('change', () => {
        if (!reducedMotion.matches) return;

        revealObserver.disconnect();
        featuredCards.forEach(card => card.classList.remove('is-awaiting-reveal', 'is-revealing'));
    });
}

const lightbox = document.querySelector('#lightbox');
const galleryLinks = Array.from(document.querySelectorAll('.gallery-link'));
const previewImages = lightbox.querySelector('.lightbox-images');
const previewCaption = lightbox.querySelector('figcaption');
const previewCount = lightbox.querySelector('.lightbox-count');
let openedFrom = null;
let photoIndex = 0;
let photoRequest = 0;
let swipeStart = null;

async function showPhoto(index) {
    photoIndex = (index + galleryLinks.length) % galleryLinks.length;
    const request = ++photoRequest;
    const position = photoIndex + 1;
    const link = galleryLinks[photoIndex];
    const photo = new Image();

    photo.alt = link.querySelector('img').alt;
    photo.draggable = false;
    photo.src = link.href;

    if (previewImages.firstElementChild) {
        // Keep the current photo visible while the next image loads.
        await photo.decode().catch(() => {});
    }

    if (request !== photoRequest || !lightbox.open) return;

    const previousPhoto = previewImages.lastElementChild;
    previewCaption.textContent = link.nextElementSibling.textContent;
    previewCount.textContent = position + ' / ' + galleryLinks.length;

    if (!previousPhoto || reducedMotion.matches) {
        previewImages.replaceChildren(photo);
        return;
    }

    previousPhoto.getAnimations().forEach(animation => animation.cancel());
    previousPhoto.setAttribute('aria-hidden', 'true');
    previewImages.replaceChildren(previousPhoto, photo);
    const fade = photo.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: 'ease-out' });
    fade.onfinish = fade.oncancel = () => previousPhoto.remove();
}

function clearPreview() {
    photoRequest += 1;
    swipeStart = null;
    previewImages.replaceChildren();
    previewCaption.textContent = '';
    previewCount.textContent = '';
}

if (typeof lightbox.showModal === 'function') {
    galleryLinks.forEach((link, index) => {
        link.addEventListener('click', (event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

            event.preventDefault();
            clearPreview();
            openedFrom = link;
            lightbox.showModal();
            showPhoto(index);
        });
    });

    lightbox.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());

    lightbox.addEventListener('click', (event) => {
        if (event.target === lightbox) lightbox.close();
    });

    lightbox.querySelectorAll('[data-direction]').forEach((button) => {
        button.addEventListener('click', () => showPhoto(photoIndex + Number(button.dataset.direction)));
    });

    previewImages.addEventListener('pointerdown', (event) => {
        if (event.pointerType !== 'touch') return;

        swipeStart = event.isPrimary
            ? { id: event.pointerId, x: event.clientX, y: event.clientY }
            : null;
    });

    previewImages.addEventListener('pointerup', (event) => {
        if (swipeStart?.id !== event.pointerId) return;

        const distanceX = event.clientX - swipeStart.x;
        const distanceY = event.clientY - swipeStart.y;
        swipeStart = null;

        if (Math.abs(distanceX) >= 48 && Math.abs(distanceX) > Math.abs(distanceY) * 1.25) {
            showPhoto(photoIndex + (distanceX < 0 ? 1 : -1));
        }
    });

    previewImages.addEventListener('pointercancel', (event) => {
        if (swipeStart?.id === event.pointerId) swipeStart = null;
    });

    reducedMotion.addEventListener('change', () => {
        if (reducedMotion.matches) {
            previewImages.lastElementChild?.getAnimations().forEach(animation => animation.cancel());
        }
    });

    lightbox.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            showPhoto(photoIndex + (event.key === 'ArrowLeft' ? -1 : 1));
        }
    });

    lightbox.addEventListener('close', () => {
        if (lightbox.open) return;

        clearPreview();
        openedFrom?.focus({ preventScroll: true });
        openedFrom = null;
    });
}

const contactForm = document.querySelector('.contact-form');

contactForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const fields = new FormData(contactForm);
    const body = 'Name: ' + fields.get('Name') + '\r\n' +
        'Email: ' + fields.get('Email') + '\r\n\r\n' +
        fields.get('Message');

    window.location.href = contactForm.action + '&body=' + encodeURIComponent(body);
});

document.querySelector('#year').textContent = new Date().getFullYear();
