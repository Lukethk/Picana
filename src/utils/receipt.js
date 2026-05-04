export function buildReceiptText({
    businessName,
    receiptConfig,
    printerConfig,
    saleId,
    paymentMethod,
    createdAt,
    cartItems,
    customerName,
    customerDocument
}) {
    const rc = receiptConfig || {};
    const pc = printerConfig || {};

    const paperWidth = Number(pc.paper_width_mm) || 80;
    const charsPerLineAuto = paperWidth === 58 ? 32 : 48;
    const charsPerLine = Number(pc.chars_per_line) || charsPerLineAuto;

    const pad = (s, len, align = 'left') => {
        const str = String(s ?? '');
        if (str.length >= len) return str.slice(0, len);
        const space = ' '.repeat(len - str.length);
        return align === 'right' ? space + str : str + space;
    };

    const line = (left, right) => {
        const r = String(right ?? '');
        const l = String(left ?? '');
        const room = Math.max(0, charsPerLine - r.length);
        return pad(l, room, 'left') + r;
    };

    const wrapLines = (text) => {
        const raw = String(text || '').split('\n').map(s => s.trim()).filter(Boolean);
        const out = [];
        for (const ln of raw) {
            if (ln.length <= charsPerLine) out.push(ln);
            else {
                let i = 0;
                while (i < ln.length) {
                    out.push(ln.slice(i, i + charsPerLine));
                    i += charsPerLine;
                }
            }
        }
        return out;
    };

    const amount = (n) => {
        const num = Number(n) || 0;
        return `Bs ${num.toFixed(2)}`;
    };

    const now = createdAt ? new Date(createdAt) : new Date();
    const methodLabel = paymentMethod ? String(paymentMethod).toUpperCase() : '';
    const headerTitle = (rc.header_title || businessName || '').trim();
    const headerLines = wrapLines(rc.header_lines);
    const footerLines = wrapLines(rc.footer_lines);
    const showDatetime = rc.show_datetime !== false;
    const showSaleId = rc.show_sale_id !== false;
    const showPayment = rc.show_payment_method !== false;
    const showOptions = rc.show_item_options !== false;

    const lines = [];
    if (headerTitle) lines.push(pad(headerTitle.toUpperCase(), charsPerLine, 'left'));
    lines.push(...headerLines);
    if (headerTitle || headerLines.length) lines.push('-'.repeat(charsPerLine));
    if (showDatetime) lines.push(`Fecha: ${now.toLocaleString('es-BO')}`);
    if (showSaleId) lines.push(`Pedido: ${saleId ? `#${saleId}` : '#—'}`);
    if (showPayment) lines.push(`Método: ${methodLabel || '—'}`);
    
    if (customerName || customerDocument) lines.push('-'.repeat(charsPerLine));
    if (customerName) lines.push(`Cliente: ${customerName}`);
    if (customerDocument) lines.push(`NIT/CI: ${customerDocument}`);
    
    lines.push('-'.repeat(charsPerLine));

    const items = Array.isArray(cartItems) ? cartItems : [];
    for (const it of items) {
        const qty = Number(it?.qty ?? it?.quantity ?? 0) || 0;
        const name = it?.product?.name ?? it?.name ?? '';
        const unitPrice = Number(it?.unitPrice ?? it?.unit_price ?? 0) || 0;
        const total = Number((it?.lineTotal ?? it?.total) ?? (qty * unitPrice)) || 0;
        lines.push(line(`${qty}x ${name}`, amount(total)));

        if (showOptions) {
            const toppings = it?.options?.toppings || [];
            const flavors = it?.options?.flavors || [];
            const details = [
                Array.isArray(flavors) && flavors.length ? `Sabores: ${flavors.map(f => f?.name ?? f).join(', ')}` : null,
                Array.isArray(toppings) && toppings.length ? `Toppings: ${toppings.map(t => t?.name ?? t).join(', ')}` : null,
            ].filter(Boolean);
            for (const d of details) lines.push(pad(`  ${d}`, charsPerLine, 'left'));
        }
    }

    const total = items.reduce((s, i) => {
        const qty = Number(i?.qty ?? i?.quantity ?? 0) || 0;
        const unitPrice = Number(i?.unitPrice ?? i?.unit_price ?? 0) || 0;
        const lineTotal = Number((i?.lineTotal ?? i?.total) ?? (qty * unitPrice)) || 0;
        return s + lineTotal;
    }, 0);
    lines.push('-'.repeat(charsPerLine));
    lines.push(line('TOTAL', amount(total)));

    if (footerLines.length) {
        lines.push('');
        lines.push(...footerLines);
    }

    return lines.join('\n');
}
