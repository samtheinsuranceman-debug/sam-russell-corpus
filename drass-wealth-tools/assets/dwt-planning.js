/**
 * The three planning calculators.
 *
 * One script drives all of them. Each form posts to admin-ajax, WordPress
 * relays to the platform, and the answer is rendered here. Nothing is stored
 * and nothing is sent anywhere else — no analytics event carries the figures,
 * because what somebody types into an estate calculator is their business.
 */
(function () {
  'use strict';
  if (typeof window.DWT_PLAN === 'undefined') return;

  var money = new Intl.NumberFormat(undefined, {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  });
  var pct = function (n) { return (Math.round(n * 10) / 10) + '%'; };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function row(label, value) {
    return '<div class="dwt-plan-line"><span>' + esc(label) + '</span><b>' + esc(value) + '</b></div>';
  }

  /** Each tool decides what its own answer looks like. */
  var RENDER = {
    'monte-carlo': function (d) {
      var s = d.summary || {};
      return row('Chance the money outlives you', pct(s.probabilityOfSuccess))
        + row('Middle outcome', money.format(s.median))
        + row('Poor outcome (10th percentile)', money.format(s.p10))
        + row('Good outcome (90th percentile)', money.format(s.p90));
    },
    tax: function (d) {
      return row('Federal tax', money.format(d.federalTax))
        + row('State tax', money.format(d.stateTax))
        + row('Total tax', money.format(d.totalTax))
        + row('Effective rate', pct(d.effectiveRate))
        + row('Marginal rate', pct(d.marginalRate));
    },
    'estate-tax': function (d) {
      return row('Gross estate', money.format(d.grossEstate))
        + row('Exemption', money.format(d.exemption))
        + row('Federal estate tax', money.format(d.federalEstateTax))
        + row('Reaches your heirs', money.format(d.netToHeirs))
        + row('Lost to tax', pct(d.estateShrinkagePercent));
    },
  };

  function wire(box) {
    var tool = box.getAttribute('data-dwt-plan');
    var form = box.querySelector('.dwt-plan-form');
    var out = box.querySelector('.dwt-plan-out');
    var btn = box.querySelector('.dwt-plan-go');
    if (!tool || !form || !out || !RENDER[tool]) return;

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var body = new FormData(form);
      body.append('action', 'dwt_plan');
      body.append('nonce', window.DWT_PLAN.nonce);
      body.append('tool', tool);

      btn.disabled = true;
      out.innerHTML = '<p class="dwt-plan-wait">Working it out…</p>';

      fetch(window.DWT_PLAN.ajax, { method: 'POST', body: body, credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (!j || !j.success) {
            // Say what went wrong. A calculator that silently shows nothing is
            // indistinguishable from a broken page.
            var m = (j && j.data && j.data.detail) ? j.data.detail : 'That did not work. Please try again.';
            out.innerHTML = '<div class="dwt-refusal" role="note"><p>' + esc(m) + '</p></div>';
            return;
          }
          var d = j.data;
          var html = '<div class="dwt-plan-result">' + RENDER[tool](d) + '</div>';
          // The basis sentence always travels with the number it qualifies.
          if (d.basis) html += '<p class="dwt-plan-basis">' + esc(d.basis) + '</p>';
          out.innerHTML = html;
        })
        .catch(function () {
          out.innerHTML = '<div class="dwt-refusal" role="note"><p>Could not reach the calculator. Please try again.</p></div>';
        })
        .finally(function () { btn.disabled = false; });
    });
  }

  function start() {
    var boxes = document.querySelectorAll('[data-dwt-plan]');
    for (var i = 0; i < boxes.length; i++) wire(boxes[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
