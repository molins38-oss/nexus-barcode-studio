/* JsBarcode and QRCode are injected or read from browser globals. */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NexusBarcodeEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';
  function checksum(body) {
    let sum = 0;
    for (let i = body.length - 1, pos = 0; i >= 0; i--, pos++) sum += Number(body[i]) * (pos % 2 === 0 ? 3 : 1);
    return String((10 - sum % 10) % 10);
  }
  function validateBarcode(value, format) {
    if (typeof value !== 'string' && typeof value !== 'number') throw new TypeError('Barcode value must be a string or number');
    const raw = String(value);
    if (!raw.trim() || /[\x00-\x1f\x7f]/.test(raw)) throw new Error('Barcode data is empty or contains control characters');
    const text = raw.trim();
    const requested = String(format || 'CODE128').toUpperCase().replace(/[-_]/g, '');
    if (!['EAN13','UPCA','CODE128','QR','QRCODE'].includes(requested)) throw new Error('Unsupported barcode format');
    if (requested === 'QR' || requested === 'QRCODE') return { format: 'QR', value: text, fallback: false };
    if (requested === 'CODE128') {
      if (!/^[\x20-\x7e]+$/.test(text)) throw new Error('Code 128 supports printable ASCII only');
      return { format: 'CODE128', value: text, fallback: false };
    }
    if (!/^\d+$/.test(text)) throw new Error('Invalid ' + requested + ': must contain digits only');
    const bodyLength = requested === 'EAN13' ? 12 : 11;
    if (text.length !== bodyLength && text.length !== bodyLength + 1) throw new Error('Invalid ' + requested + ' length');
    const body = text.slice(0, bodyLength), digit = checksum(body);
    if (text.length === bodyLength + 1 && text.slice(-1) !== digit) throw new Error('Invalid ' + requested + ' check digit');
    return { format: requested === 'UPCA' ? 'UPC' : 'EAN13', value: body + digit, fallback: false };
  }
  function renderBarcode(container, value, options) {
    options = options || {};
    if (!container || !container.ownerDocument || typeof container.replaceChildren !== 'function') throw new TypeError('A DOM container is required');
    const result = validateBarcode(value, options.format);
    const width = options.width == null ? (result.format === 'QR' ? 128 : 2) : options.width;
    const height = options.height == null ? (result.format === 'QR' ? 128 : 60) : options.height;
    const margin = options.margin == null ? 10 : options.margin;
    if (![width,height,margin].every(Number.isFinite) || width <= 0 || height <= 0 || margin < 0) throw new RangeError('Invalid dimensions');
    const doc = container.ownerDocument, stage = doc.createElement('div');
    if (result.format === 'QR') {
      const QR = options.QRCode || root.QRCode;
      if (typeof QR !== 'function') throw new Error('QRCode library is unavailable');
      const size = Math.floor(Math.min(width, height) - 2 * margin);
      if (size < 1) throw new RangeError('QR margin leaves no room for the code');
      new QR(stage, { text: result.value, width: size, height: size, correctLevel: options.correctLevel == null ? QR.CorrectLevel.M : options.correctLevel });
      stage.style.padding = margin + 'px';
      stage.style.display = 'inline-block';
      // QRCode.js selects Canvas when supported, otherwise it may render a table.
    } else {
      const jsBarcode = options.JsBarcode || root.JsBarcode;
      if (typeof jsBarcode !== 'function') throw new Error('JsBarcode library is unavailable');
      const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
      jsBarcode(svg, result.value, { format: result.format, width, height, margin, displayValue: options.displayValue !== false, fontSize: options.fontSize == null ? 16 : options.fontSize });
      svg.style.maxWidth = '100%'; svg.style.height = 'auto';
      stage.appendChild(svg);
    }
    container.replaceChildren(stage);
    return result;
  }
  return Object.freeze({ validateBarcode, renderBarcode });
});
