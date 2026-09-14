/**
 * The concierge microphone.
 *
 * Speech recognition runs here, in the visitor's browser, via the Web Speech
 * API. No audio is captured by this script, uploaded, or stored anywhere —
 * only the recognised text is sent. Browsers without the API simply never see
 * the microphone button and type instead; the feature degrades to a text box
 * rather than to a broken control.
 */
(function () {
  'use strict';

  var cfg = window.DWT_ASK || {};
  var root = document.querySelector('[data-dwt-concierge]');
  if (!root || !cfg.ajax) return;

  var input = root.querySelector('[data-dwt-q]');
  var go = root.querySelector('[data-dwt-go]');
  var mic = root.querySelector('[data-dwt-mic]');
  var answer = root.querySelector('[data-dwt-answer]');
  var disclosure = root.querySelector('[data-dwt-disclosure]');
  var privacy = root.querySelector('[data-dwt-privacy]');
  var busy = false;

  function show(el, html) {
    el.innerHTML = html;
    el.hidden = false;
  }

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.textContent = String(s == null ? '' : s);
    return d.innerHTML;
  }

  function ask(q) {
    if (busy) return;
    q = String(q || '').trim();
    if (q.length < 3) {
      input.focus();
      return;
    }
    busy = true;
    go.disabled = true;
    go.textContent = 'Thinking…';
    show(answer, '<p class="dwt-thinking">Working on that…</p>');

    var body = new URLSearchParams();
    body.set('action', 'dwt_ask');
    body.set('nonce', cfg.nonce || '');
    body.set('q', q);

    fetch(cfg.ajax, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    })
      .then(function (r) { return r.json().catch(function () { return null; }); })
      .then(function (j) {
        if (!j || !j.success || !j.data) {
          var detail = (j && j.data && j.data.detail) || 'That did not go through. Please try again in a moment.';
          show(answer, '<p class="dwt-error">' + escapeHtml(detail) + '</p>');
          return;
        }
        var html = '<p>' + escapeHtml(j.data.answer).replace(/\n{2,}/g, '</p><p>') + '</p>';
        if (j.data.booking) {
          html +=
            '<p class="dwt-cta-wrap"><a class="dwt-cta" href="' +
            escapeHtml(j.data.booking) +
            '" target="_blank" rel="noopener">' +
            escapeHtml(cfg.cta || 'Book a conversation') +
            '</a></p>';
        }
        show(answer, html);
        if (j.data.disclosure) show(disclosure, escapeHtml(j.data.disclosure));
      })
      .catch(function () {
        show(answer, '<p class="dwt-error">Could not reach the service. Nothing was sent.</p>');
      })
      .finally(function () {
        busy = false;
        go.disabled = false;
        go.textContent = 'Ask';
      });
  }

  go.addEventListener('click', function () { ask(input.value); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); ask(input.value); }
  });

  Array.prototype.forEach.call(root.querySelectorAll('[data-dwt-chip]'), function (chip) {
    chip.addEventListener('click', function () {
      input.value = chip.textContent.trim();
      ask(input.value);
    });
  });

  // ── Voice, only where the browser can do it locally ──────────────────────
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return; // no button, no broken control, no explanation needed

  mic.hidden = false;
  if (privacy) privacy.hidden = false;

  var rec = new SR();
  rec.lang = document.documentElement.lang || 'en-US';
  rec.interimResults = true;
  rec.continuous = false;
  var listening = false;

  rec.addEventListener('result', function (e) {
    var text = '';
    for (var i = e.resultIndex; i < e.results.length; i++) text += e.results[i][0].transcript;
    input.value = text;
    // Only a final result asks; interim text just fills the box so the
    // visitor can see they are being heard.
    if (e.results[e.results.length - 1].isFinal) ask(text);
  });

  rec.addEventListener('end', function () {
    listening = false;
    mic.classList.remove('is-listening');
    mic.querySelector('.dwt-mic-label').textContent = 'Speak';
  });

  rec.addEventListener('error', function (e) {
    listening = false;
    mic.classList.remove('is-listening');
    mic.querySelector('.dwt-mic-label').textContent = 'Speak';
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
      show(answer, '<p class="dwt-error">Microphone permission was declined. You can type your question instead.</p>');
    }
  });

  mic.addEventListener('click', function () {
    if (listening) { rec.stop(); return; }
    try {
      rec.start();
      listening = true;
      mic.classList.add('is-listening');
      mic.querySelector('.dwt-mic-label').textContent = 'Listening…';
    } catch (err) {
      /* start() throws if already running; nothing useful to say */
    }
  });
})();
