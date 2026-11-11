(function (root) {
  'use strict';
  function create(doc) {
    let panel, log, choices, fab, target, step = 0;
    const steps = [
      ['input-product-name', 'Step 1 of 4: Enter the product name to show on your label.'],
      ['select-template', 'Step 2 of 4: Choose the label sheet or thermal size matching your stock.'],
      ['input-offset', 'Step 3 of 4: Set Start at Position to reuse a partially used sheet.'],
      ['btn-print', 'Step 4 of 4: Check the preview, then select Print Labels.']
    ];
    const topics = [ ['tour','Guided tour'], ['save_sheets','Save sheets'], ['thermal','Thermal printing'], ['troubleshoot','Troubleshoot'], ['pro_upgrade','Pro benefits'] ];
    function element(tag, cls, text) { const n = doc.createElement(tag); n.className = cls; if (text != null) n.textContent = text; return n; }
    function clearTarget() { if (target) target.classList.remove('assistant-target-pulse'); target = null; }
    function say(text, who) { const n = element('div', 'assistant-bubble assistant-' + (who || 'bot'), text); log.appendChild(n); log.scrollTop = log.scrollHeight; }
    function options(items) {
      choices.replaceChildren();
      items.forEach(function (item) { const b = element('button', 'assistant-chip', item[1]); b.type = 'button'; b.addEventListener('click', function () { item[2](); }); choices.appendChild(b); });
    }
    function menu() { clearTarget(); options(topics.map(function (t) { return [t[0], t[1], function () { select(t[0]); }]; })); }
    function tour() {
      clearTarget();
      if (step >= steps.length) { say('Tour complete! You are ready to print.'); menu(); return; }
      const current = steps[step]; target = doc.getElementById(current[0]);
      if (target) { target.classList.add('assistant-target-pulse'); if (target.scrollIntoView) target.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      say(current[1]);
      options([['next', step === 3 ? 'Finish tour' : 'Next', function () { step++; tour(); }], ['menu','All topics',menu]]);
    }
    function select(topic) {
      clearTarget();
      const name = topics.find(function (t) { return t[0] === topic; });
      if (!name) { say('Please choose a topic.'); menu(); return; }
      say(name[1], 'user');
      if (topic === 'tour') { step = 0; tour(); return; }
      if (topic === 'save_sheets') {
        say('Reuse an Avery sheet: count the positions already used, then enter the first unused position under Start at Position. For example, if positions 1 and 2 are used, enter 3. Check the preview and load the sheet in the correct orientation. Save Sheets is a Pro feature.');
        options([['show','Show the offset',function () { target = doc.getElementById('input-offset'); if (target) { target.classList.add('assistant-target-pulse'); if (target.scrollIntoView) target.scrollIntoView({behavior:'smooth',block:'center'}); } say('Enter the first unused position here.'); options([['menu','All topics',menu]]); }], ['menu','All topics',menu]]); return;
      }
      if (topic === 'thermal') say('Choose a thermal template that matches your Zebra or Dymo label dimensions. In the printer dialog select the same paper size, actual size / 100% scale, and the correct printer. For continuous rolls, configure a matching custom label size and feed settings in the printer driver; test on one label first.');
      if (topic === 'troubleshoot') say('EAN-13 requires 12 or 13 digits with no spaces or letters; a supplied check digit must be valid. Remove leading or trailing whitespace and check the SKU. For letters or mixed SKUs, choose Code 128. If a label is blank, check the preview, label orientation, printer and paper settings.');
      if (topic === 'pro_upgrade') {
        say('Pro includes larger batches, all sheet and thermal templates, QR and dual codes, and Save Sheets. The existing upgrade dialog lists the $9.99 one-time offer.');
        options([['upgrade','View Pro offer',function () { close(); const button = doc.getElementById('btn-upgrade-header'); if (button) button.click(); }], ['menu','All topics',menu]]); return;
      }
      options([['menu','All topics',menu]]);
    }
    function close() { menu(); panel.hidden = true; fab.setAttribute('aria-expanded','false'); fab.focus(); }
    function open() { panel.hidden = false; fab.setAttribute('aria-expanded','true'); if (!log.children.length) { say('Hi! How can I help you with your labels?'); menu(); } }
    function init() {
      if (fab) return;
      fab = element('button','assistant-fab','\u2728 Nexus Assistant'); fab.type = 'button'; fab.setAttribute('aria-expanded','false'); fab.setAttribute('aria-controls','nexus-assistant-panel');
      panel = element('section','assistant-panel'); panel.id = 'nexus-assistant-panel'; panel.hidden = true; panel.setAttribute('aria-label','Nexus Assistant');
      const header = element('div','assistant-header'); header.appendChild(element('strong','','\u2728 Nexus Assistant'));
      const dismiss = element('button','assistant-close','\u00d7'); dismiss.type = 'button'; dismiss.setAttribute('aria-label','Close assistant'); dismiss.addEventListener('click',close); header.appendChild(dismiss);
      log = element('div','assistant-log'); log.setAttribute('aria-live','polite'); choices = element('div','assistant-choices');
      panel.appendChild(header); panel.appendChild(log); panel.appendChild(choices); doc.body.appendChild(panel); doc.body.appendChild(fab);
      fab.addEventListener('click', function () { if (panel.hidden) open(); else close(); });
      panel.addEventListener('keydown', function (event) { if (event.key === 'Escape') close(); });
    }
    return { init:init, open:open, close:close, select:select };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { create:create };
  if (root && root.document) { root.NexusAssistant = create(root.document); root.NexusAssistant.init(); }
}(typeof window !== 'undefined' ? window : null));
