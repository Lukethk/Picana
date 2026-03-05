export const DEFAULT_INVENTORY = [
    { id: 'inv1', name: 'Pulpa de Acai', qty: 12, unit: 'kg', minOk: 10, minWarn: 5 },
    { id: 'inv2', name: 'Leche en Polvo', qty: 4, unit: 'kg', minOk: 6, minWarn: 3 },
    { id: 'inv3', name: 'Granola', qty: 8, unit: 'kg', minOk: 5, minWarn: 2 },
    { id: 'inv4', name: 'Fresa Congelada', qty: 2, unit: 'kg', minOk: 4, minWarn: 2 },
    { id: 'inv5', name: 'Banana', qty: 15, unit: 'unid.', minOk: 20, minWarn: 8 },
    { id: 'inv6', name: 'Vasos 200 ml', qty: 80, unit: 'unid.', minOk: 50, minWarn: 20 },
    { id: 'inv7', name: 'Vasos 400 ml', qty: 55, unit: 'unid.', minOk: 50, minWarn: 20 },
    { id: 'inv8', name: 'Vasos 500 ml', qty: 30, unit: 'unid.', minOk: 50, minWarn: 20 },
    { id: 'inv9', name: 'Vasos 1 Litro', qty: 12, unit: 'unid.', minOk: 20, minWarn: 8 },
    { id: 'inv10', name: 'Leche Condensada', qty: 6, unit: 'latas', minOk: 5, minWarn: 2 },
];

export function getStockStatus(item) {
    if (item.qty >= item.minOk) return 'ok';
    if (item.qty >= item.minWarn) return 'warn';
    return 'critical';
}
