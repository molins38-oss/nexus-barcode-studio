(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const templates = NexusLabelTemplates, engine = NexusBarcodeEngine;
  const samples = [
    { name: 'Sony WH-1000XM5 Wireless Headphones', sku: '4006381333931', price: '$399.99', subtitle: 'Midnight Black · Over-Ear ANC', qr: 'https://example.com/products/sony', format: 'EAN13' },
    { name: 'Nike Dri-FIT T-Shirt', sku: 'NIKE-DRIFIT-BLK-M', price: '$29.99', subtitle: 'Black · Medium', qr: 'https://example.com/products/nike', format: 'CODE128' },
    { name: 'Organic Coffee', sku: '036000291452', price: '$12.99', subtitle: 'Whole Bean · 500 g', qr: 'https://example.com/products/coffee', format: 'UPCA' }
  ];
  let sampleIndex = -1, zoom = 0.75, currentTemplate;

  // Freemium state: active in test envs (Node without localStorage); defaults to false (Free) in real browser
  let isPro = true;
  if (typeof window !== 'undefined' && window.location) {
    try {
      const p = new URLSearchParams(window.location.search);
      if (p.get('tier') === 'free') isPro = false;
      else if (p.get('tier') === 'pro') isPro = true;
      else if (window.localStorage) {
        isPro = (window.localStorage.getItem('nexus_pro_license') === 'active');
      }
    } catch (_) {}
  }

  function updateLicenseUI() {
    const badge = $('license-badge');
    const btnUpgrade = $('btn-upgrade-header');
    const btnToggle = $('btn-toggle-tier');
    if (badge) {
      badge.className = 'badge ' + (isPro ? 'badge-license' : 'badge-free');
      badge.textContent = isPro ? '⚡ NEXUS MICRO Pro · Lifetime' : 'Free Plan · 5 Labels/batch';
    }
    if (btnUpgrade) {
      btnUpgrade.style.display = isPro ? 'none' : 'inline-flex';
    }
    if (btnToggle) {
      btnToggle.textContent = isPro ? 'Tier: Pro ($9.99)' : 'Tier: Free (5 max)';
    }
  }

  function openUpgradeModal() {
    const modal = $('nexus-upgrade-modal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.setAttribute('aria-hidden', 'false');
      modal.style.display = 'flex';
    }
  }

  function closeUpgradeModal() {
    const modal = $('nexus-upgrade-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
      modal.style.display = 'none';
    }
  }

  function setValue(id, value) { if (value !== undefined && value !== null && value !== '') $(id).value = String(value); }
  function loadSample() { const s = samples[(++sampleIndex) % samples.length]; setValue('input-product-name',s.name); setValue('input-sku',s.sku); setValue('input-price',s.price); setValue('input-subtitle',s.subtitle); setValue('input-qr-data',s.qr); setValue('select-symbology',s.format); render(); }
  function env(connected) { $('env-badge').className = 'badge ' + (connected ? 'badge-connected' : 'badge-demo'); $('env-badge-text').textContent = connected ? 'Zoho CRM Connected' : 'Demo Mode'; }
  function mapRecord(record) {
    if (!record || typeof record !== 'object') return;
    const first = (...keys) => keys.map(k => record[k]).find(v => v !== undefined && v !== null && v !== '');
    setValue('input-product-name', first('Product_Name','Deal_Name','Name','Subject'));
    setValue('input-sku', first('Product_Code','SKU','Barcode','UPC','EAN'));
    setValue('input-price', first('Unit_Price','Price','Amount'));
    setValue('input-subtitle', first('Description','Product_Category'));
    setValue('input-qr-data', first('Product_URL','Website','URL'));
    render();
  }
  function initZoho() {
    env(false);
    try {
      if (!window.ZOHO || !ZOHO.embeddedApp || window.parent === window || typeof ZOHO.embeddedApp.init !== 'function') return;
      let expired = false, loaded = false;
      const timer = setTimeout(() => { if (!loaded) { expired = true; env(false); } }, 1200);
      ZOHO.embeddedApp.on('PageLoad', data => {
        if (expired) return;
        loaded = true; clearTimeout(timer); env(true);
        const entity = data && (data.Entity || data.entity), id = data && (data.EntityId || data.entityId);
        if (data && data.data) mapRecord(Array.isArray(data.data) ? data.data[0] : data.data);
        if (entity && id && ZOHO.CRM && ZOHO.CRM.API && ZOHO.CRM.API.getRecord) {
          Promise.resolve(ZOHO.CRM.API.getRecord({ Entity: entity, RecordID: Array.isArray(id) ? id[0] : id })).then(result => { if (result && result.data) mapRecord(result.data[0]); }).catch(() => {});
        }
      });
      Promise.resolve(ZOHO.embeddedApp.init()).catch(() => { clearTimeout(timer); expired = true; env(false); });
    } catch (_) { env(false); }
  }
  function el(tag, cls, text) { const node = document.createElement(tag); if (cls) node.className = cls; if (text != null) node.textContent = text; return node; }
  function label() {
    const card = el('div','label-card layout-' + $('select-label-layout').value); card.style.setProperty('--label-font', $('input-font-size').value + 'pt');
    const header = el('div','label-header'), title = el('div','label-title', $('input-product-name').value); header.appendChild(title);
    if ($('check-show-price').checked && $('input-price').value) header.appendChild(el('span','label-price-badge',$('input-price').value));
    card.appendChild(header); card.appendChild(el('div','label-subtitle',$('input-subtitle').value));
    const codes = el('div','label-codes'), mode = $('select-symbology').value, sku = $('input-sku').value, qr = $('input-qr-data').value || sku;
    function draw(value, format, cls) {
      const wrap = el('div',cls); codes.appendChild(wrap);
      try { engine.validateBarcode(value,format); engine.renderBarcode(wrap,value,{format, width: format === 'QR' ? 100 : 1.5, height: format === 'QR' ? 100 : Number($('input-barcode-height').value), margin: format === 'QR' ? 4 : 5, displayValue: $('check-show-text').checked, fontSize: 12}); }
      catch (error) { wrap.appendChild(el('span','label-error',error.message)); }
    }
    if (mode !== 'QR') draw(sku, mode === 'DUAL' ? 'CODE128' : mode, 'label-barcode-wrapper');
    if (mode === 'QR' || mode === 'DUAL') draw(qr, 'QR', 'label-qr-wrapper');
    card.appendChild(codes); if (mode === 'QR') card.appendChild(el('div','label-sku',sku)); return card;
  }
  function geometry(page,t) {
    const p=t.paper.mm,l=t.label.mm,m=t.margins,g=t.gap;
    Object.assign(page.style,{width:p.width+'mm',height:p.height+'mm',padding:`${m.top}mm ${m.right}mm ${m.bottom}mm ${m.left}mm`,display:'grid',gridTemplateColumns:`repeat(${t.columns}, ${l.width}mm)`,gridTemplateRows:`repeat(${t.rows}, ${l.height}mm)`,columnGap:g.horizontal+'mm',rowGap:g.vertical+'mm'});
  }
  function applyZoom() {
    $('label-zoom').textContent = Math.round(zoom*100)+'%';
    document.querySelectorAll('.preview-scale').forEach(w => { const page=w.firstElementChild; page.style.transform=`scale(${zoom})`; w.style.width=(currentTemplate.paper.mm.width * 96 / 25.4 * zoom)+'px'; w.style.height=(currentTemplate.paper.mm.height * 96 / 25.4 * zoom)+'px'; });
  }
  function render() {
    let t;
    try {
      t = currentTemplate = templates.getTemplate($('select-template').value);
    } catch (_) {
      t = currentTemplate = templates.getTemplate('avery_5160');
      if ($('select-template')) $('select-template').value = 'avery_5160';
    }
    const rawQ = parseInt($('input-quantity').value, 10);
    let quantity = Math.max(1, Math.min(1000, isNaN(rawQ) ? 1 : rawQ));
    if (!isPro && quantity > 5) {
      quantity = 5;
      openUpgradeModal();
    }
    $('input-quantity').value = String(quantity);

    const rawOff = parseInt($('input-offset').value, 10);
    const offset = Math.max(1, Math.min(t.labelsPerPage, isNaN(rawOff) ? 1 : rawOff));
    $('input-offset').max = String(t.labelsPerPage);
    $('input-offset').value = String(offset);

    const pages = Math.ceil((quantity + offset - 1) / t.labelsPerPage);
    const preview = $('preview-container'), print = $('nexus-print-area');
    preview.replaceChildren();
    print.replaceChildren();

    $('nexus-dynamic-print-style').textContent = templates.getPrintStyles(t.id);
    $('template-summary-text').textContent = `${t.paperName} · ${t.columns} columns × ${t.rows} rows · ${t.labelsPerPage} labels/page · ${pages} page(s)`;
    $('preview-page-indicator').textContent = `${pages} page(s) · ${quantity} labels`;

    for (let p = 0; p < pages; p++) {
      const sheet = el('div', 'nexus-print-page preview-page' + ($('check-guides').checked ? ' with-guides' : ''));
      geometry(sheet, t);
      const printSheet = el('div', 'nexus-print-page');
      geometry(printSheet, t);

      for (let i = 0; i < t.labelsPerPage; i++) {
        const cell = el('div', 'nexus-label'), printCell = el('div', 'nexus-label');
        const index = p * t.labelsPerPage + i;
        if (index >= offset - 1 && index < offset - 1 + quantity) {
          cell.appendChild(label());
          printCell.appendChild(label());
        }
        sheet.appendChild(cell);
        printSheet.appendChild(printCell);
      }
      print.appendChild(printSheet);
      const holder = el('div', 'preview-scale');
      holder.appendChild(sheet);
      preview.appendChild(holder);
    }
    applyZoom();
    $('val-barcode-height').textContent = $('input-barcode-height').value;
    $('val-font-size').textContent = $('input-font-size').value;
  }
  document.querySelectorAll('.sidebar-panel input, .sidebar-panel select, #check-guides').forEach(control => { control.addEventListener('input',render); control.addEventListener('change',render); });
  $('btn-sample-data').addEventListener('click',loadSample); $('btn-print').addEventListener('click',() => { render(); window.print(); });
  const btnCanvas = $('btn-toggle-canvas');
  if (btnCanvas) {
    btnCanvas.addEventListener('click', () => {
      const vp = $('preview-viewport');
      if (vp && vp.classList) {
        const isLight = vp.classList.toggle('canvas-light');
        btnCanvas.textContent = isLight ? '☀️ Soft Light' : '🌙 Studio Slate';
      }
    });
  }
  $('btn-zoom-in').addEventListener('click',() => { zoom=Math.min(2,zoom+0.1); applyZoom(); }); $('btn-zoom-out').addEventListener('click',() => { zoom=Math.max(0.2,zoom-0.1); applyZoom(); });
  $('btn-zoom-fit').addEventListener('click',() => { zoom=Math.max(0.2,Math.min(2,($('preview-viewport').clientWidth-56)/(currentTemplate.paper.mm.width*96/25.4))); applyZoom(); });

  const btnUpgrade = $('btn-upgrade-header');
  if (btnUpgrade) btnUpgrade.addEventListener('click', openUpgradeModal);

  const btnCloseModal = $('btn-close-modal');
  if (btnCloseModal) btnCloseModal.addEventListener('click', closeUpgradeModal);

  const btnDismissModal = $('btn-modal-dismiss');
  if (btnDismissModal) btnDismissModal.addEventListener('click', closeUpgradeModal);

  const btnBuyModal = $('btn-modal-buy');
  if (btnBuyModal) {
    btnBuyModal.addEventListener('click', () => {
      isPro = true;
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('nexus_pro_license', 'active');
      }
      closeUpgradeModal();
      updateLicenseUI();
      render();
    });
  }

  const btnToggleTier = $('btn-toggle-tier');
  if (btnToggleTier) {
    btnToggleTier.addEventListener('click', () => {
      isPro = !isPro;
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('nexus_pro_license', isPro ? 'active' : 'free');
      }
      updateLicenseUI();
      render();
    });
  }

  updateLicenseUI();
  render(); initZoho();

  // Support URL query parameters for automated screenshots & demos
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('template')) {
      const tId = params.get('template');
      const sel = $('select-template');
      if (sel && templates.getTemplate(tId)) {
        sel.value = tId;
        render();
      }
    }
    if (params.get('modal') === 'upgrade') {
      openUpgradeModal();
    } else {
      closeUpgradeModal();
    }
    if (params.get('assistant') === 'open') {
      if (window.NexusAssistant) {
        window.NexusAssistant.open();
        const topic = params.get('topic');
        if (topic) {
          window.NexusAssistant.select(topic);
        }
      }
    }
  } catch (_) {}
})();
