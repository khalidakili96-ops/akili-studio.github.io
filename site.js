const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav-links');
if (menu && nav) {
  menu.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
    menu.textContent = open ? 'Close' : 'Menu';
  });
}

// Akili Studio typography override: Caviar Dreams is the primary typeface.
const caviarFont = document.createElement('link');
caviarFont.rel = 'stylesheet';
caviarFont.href = 'https://fonts.bunny.net/css?family=Caviar+Dreams:400,700&display=swap';
document.head.appendChild(caviarFont);

const typography = document.createElement('style');
typography.textContent = `:root { --serif: 'Caviar Dreams', sans-serif; --sans: 'Caviar Dreams', sans-serif; }`;
document.head.appendChild(typography);
