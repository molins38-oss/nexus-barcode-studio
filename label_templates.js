/* Physical geometry is in millimetres. Load as a browser script or require in Node. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NexusLabelTemplates = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const inch = n => n * 25.4;
  function make(id, paperName, pw, ph, lw, lh, columns, rows, left, top, gapX, gapY, kind) {
    const right = pw - left - columns * lw - (columns - 1) * gapX;
    const bottom = ph - top - rows * lh - (rows - 1) * gapY;
    const dims = (width, height) => Object.freeze({ mm: Object.freeze({ width, height }), inches: Object.freeze({ width: width / 25.4, height: height / 25.4 }) });
    return Object.freeze({ id, kind, orientation: pw <= ph ? 'portrait' : 'landscape', paperName,
      paper: dims(pw, ph), label: dims(lw, lh), columns, rows, labelsPerPage: columns * rows,
      margins: Object.freeze({ top, right, bottom, left }), gap: Object.freeze({ horizontal: gapX, vertical: gapY }) });
  }
  const templates = Object.freeze({
    avery_5160: make('avery_5160','Letter',inch(8.5),inch(11),inch(2.625),inch(1),3,10,inch(.1875),inch(.5),inch(.125),0,'sheet'),
    avery_5163: make('avery_5163','Letter',inch(8.5),inch(11),inch(4),inch(2),2,5,inch(.15625),inch(.5),inch(.1875),0,'sheet'),
    avery_5167: make('avery_5167','Letter',inch(8.5),inch(11),inch(1.75),inch(.5),4,20,inch(.28125),inch(.5),inch(.3125),0,'sheet'),
    a4_l7160: make('a4_l7160','A4',210,297,63.5,38.1,3,7,7.25,15.15,2.5,0,'sheet'),
    thermal_4x6: make('thermal_4x6','Custom',inch(4),inch(6),inch(4),inch(6),1,1,0,0,0,0,'thermal'),
    thermal_2x1: make('thermal_2x1','Custom',inch(2.25),inch(1.25),inch(2.25),inch(1.25),1,1,0,0,0,0,'thermal'),
    thermal_50x30: make('thermal_50x30','Custom',50,30,50,30,1,1,0,0,0,0,'thermal')
  });
  function getTemplate(id) {
    if (!Object.prototype.hasOwnProperty.call(templates, id)) throw new RangeError('Unknown label template: ' + id);
    return templates[id];
  }
  function calculatePages(id, quantity) {
    const t = getTemplate(id);
    if (!Number.isSafeInteger(quantity) || quantity < 0) throw new RangeError('Quantity must be a non-negative safe integer');
    return Math.ceil(quantity / t.labelsPerPage);
  }
  function getPrintStyles(id) {
    const t = getTemplate(id), p = t.paper.mm, l = t.label.mm, m = t.margins, g = t.gap;
    // A .nexus-print-page is required for each physical page; its direct children are .nexus-label.
    return `@page { size: ${p.width}mm ${p.height}mm; margin: 0; }\n@media print {\n  html, body { margin: 0; padding: 0; }\n  .nexus-print-page { box-sizing: border-box; width: ${p.width}mm; height: ${p.height}mm; margin: 0; padding: ${m.top}mm ${m.right}mm ${m.bottom}mm ${m.left}mm; display: grid; grid-template-columns: repeat(${t.columns}, ${l.width}mm); grid-template-rows: repeat(${t.rows}, ${l.height}mm); column-gap: ${g.horizontal}mm; row-gap: ${g.vertical}mm; break-after: page; page-break-after: always; overflow: hidden; }\n  .nexus-print-page:last-child { break-after: auto; page-break-after: auto; }\n  .nexus-label { box-sizing: border-box; width: ${l.width}mm; height: ${l.height}mm; overflow: hidden; break-inside: avoid; }\n}`;
  }
  return Object.freeze({ templates, getTemplate, calculatePages, getPrintStyles });
});
