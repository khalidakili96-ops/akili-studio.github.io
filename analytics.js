(function () {
  'use strict';
  // Basic consent: do not load Google's library before an explicit opt-in.
  if (!['akilis.studio', 'www.akilis.studio'].includes(window.location.hostname)) return;
  var measurementId = 'G-6GSBP5QVWV';
  var storageKey = 'akili.analytics-consent.v1';
  var enabled = false, libraryAdded = false, pageViewSent = false, leadSent = false;
  var choice = null;
  try {
    var saved = JSON.parse(window.localStorage.getItem(storageKey));
    if (saved && saved.expires > Date.now() && ['allow', 'decline'].includes(saved.choice)) choice = saved.choice;
  } catch (_) { /* A storage restriction must not prevent browsing or enquiries. */ }

  var canonical = document.querySelector('link[rel="canonical"]');
  var page = new URL(canonical ? canonical.href : window.location.pathname, window.location.origin);
  var pageLocation = 'https://akilis.studio' + page.pathname;
  var referrer = '';
  try { referrer = new URL(document.referrer).origin; } catch (_) {}

  function tag() { window.dataLayer.push(arguments); }
  function enable() {
    if (enabled) return;
    enabled = true;
    window['ga-disable-' + measurementId] = false;
    window.dataLayer = window.dataLayer || [];
    if (!libraryAdded) {
      tag('consent', 'default', {
        analytics_storage: 'denied', ad_storage: 'denied',
        ad_user_data: 'denied', ad_personalization: 'denied'
      });
      tag('js', new Date());
    }
    tag('consent', 'update', { analytics_storage: 'granted' });
    tag('config', measurementId, {
      send_page_view: false, allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: pageLocation, page_referrer: referrer
    });
    if (!pageViewSent) {
      tag('event', 'page_view', { page_location: pageLocation, page_title: document.title, page_referrer: referrer });
      pageViewSent = true;
    }
    if (!libraryAdded) {
      libraryAdded = true;
      var script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
      document.head.appendChild(script);
    }
  }
  function disable() {
    enabled = false;
    window['ga-disable-' + measurementId] = true;
    // Remove GA cookies accessible to this site when a previous opt-in is withdrawn.
    document.cookie.split(';').forEach(function (cookie) {
      var name = cookie.split('=')[0].trim();
      if (!/^_ga(?:_|$)/.test(name)) return;
      var expired = name + '=; Max-Age=0; Path=/; SameSite=Lax; Secure';
      document.cookie = expired;
      document.cookie = expired + '; Domain=akilis.studio';
      document.cookie = expired + '; Domain=.akilis.studio';
      document.cookie = expired + '; Domain=' + window.location.hostname;
    });
  }
  window.AkiliAnalytics = {
    trackAcceptedEnquiry: function () {
      if (!enabled || leadSent) return;
      leadSent = true;
      // Only fixed metadata. Never include FormData or visitor contact details.
      tag('event', 'generate_lead', { lead_source: 'website_application', page_location: pageLocation });
    }
  };

  function initialiseChoices() {
    var notice = document.createElement('section');
    notice.className = 'analytics-notice';
    notice.setAttribute('role', 'region');
    notice.setAttribute('aria-labelledby', 'analytics-notice-title');
    notice.innerHTML = '<h2 id="analytics-notice-title">Website analytics</h2>' +
      '<p>We use optional Google Analytics cookies to understand visits and improve the website. Your enquiry works whether you allow or decline analytics.</p>' +
      '<div class="analytics-actions"><button type="button" data-choice="allow">Allow analytics</button><button type="button" data-choice="decline">Decline</button></div>' +
      '<p class="analytics-detail">Google Analytics records which pages you visit and whether an enquiry is accepted. Your form entries are not included. You can change your choice using Analytics settings.</p>';
    notice.hidden = choice !== null;
    document.body.appendChild(notice);
    var settings = document.createElement('button');
    settings.type = 'button';
    settings.className = 'analytics-settings';
    settings.textContent = 'Analytics settings';
    var footer = document.querySelector('.footer-contacts') || document.querySelector('footer');
    if (footer) footer.appendChild(settings);
    settings.addEventListener('click', function () {
      notice.hidden = false;
      notice.querySelector('[data-choice="allow"]').focus();
    });
    notice.querySelectorAll('[data-choice]').forEach(function (button) {
      button.addEventListener('click', function () {
        choice = button.getAttribute('data-choice');
        try { window.localStorage.setItem(storageKey, JSON.stringify({ choice: choice, expires: Date.now() + 180 * 86400000 })); } catch (_) {}
        if (choice === 'allow') enable(); else disable();
        notice.hidden = true;
        // The selected button disappears: return keyboard focus to the settings control.
        if (footer) settings.focus({ preventScroll: true });
      });
    });
    if (choice === 'allow') enable(); else disable();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialiseChoices, { once: true });
  else initialiseChoices();
})();
