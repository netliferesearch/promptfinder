// Debug scroll and sticky header for PromptFinder popup

console.log('[DEBUG] debug-sticky.js loaded');

document.addEventListener('DOMContentLoaded', function () {
  console.log('[DEBUG] DOMContentLoaded fired');
  const scrollEl = document.getElementById('scrollable-main');
  const sticky = document.querySelector('.sticky-search-header');
  console.log('[DEBUG] #scrollable-main:', scrollEl);
  console.log('[DEBUG] .sticky-search-header:', sticky);
  if (scrollEl && sticky) {
    scrollEl.addEventListener('scroll', function () {
      console.log('[DEBUG] #scrollable-main scrollTop:', scrollEl.scrollTop);
      const rect = sticky.getBoundingClientRect();
      console.log('[DEBUG] .sticky-search-header rect:', rect);
      const style = window.getComputedStyle(sticky);
      console.log(
        '[DEBUG] .sticky-search-header computed style: position',
        style.position,
        'top',
        style.top,
        'z-index',
        style.zIndex
      );
    });
  } else {
    console.warn('[DEBUG] Could not find #scrollable-main or .sticky-search-header');
  }
});

window.addEventListener('scroll', function () {
  console.log('[DEBUG] window scrollTop:', window.scrollY);
});
document.body.addEventListener('scroll', function () {
  console.log('[DEBUG] body scrollTop:', document.body.scrollTop);
});
