// Збирає «ДЗ8_Джафарлі_Фарід.docx» з content.js і data_flow.png (docx-js).
// Запуск: NODE_PATH=<node_modules з docx> node build_docx.js
const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, ShadingType,
  ImageRun, AlignmentType, LevelFormat, BorderStyle, PageBreak } = require('docx');
const C = require('./content.js');

const FONT = 'Arial', MONO = 'Courier New', W = 9638; // A4 мінус поля по 2 см
const border = { style: BorderStyle.SINGLE, size: 4, color: 'B8BEC9' };
const borders = { top: border, bottom: border, left: border, right: border };
const p = (text, o = {}) => new Paragraph({ spacing: { after: 120 }, ...o, children: [new TextRun({ text, font: FONT, size: 21, ...(o.run || {}) })] });
const h = (text, level) => new Paragraph({ heading: level, spacing: { before: 240, after: 120 }, children: [new TextRun({ text, font: FONT })] });
const bullet = t => new Paragraph({ numbering: { reference: 'bullets', level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text: t, font: FONT, size: 21 })] });
const step = (t, instance) => new Paragraph({ numbering: { reference: 'steps', level: 0, instance }, spacing: { after: 60 }, children: [new TextRun({ text: t, font: FONT, size: 21 })] });
const cell = (text, w, { head = false, bold = false, fill, size = 17 } = {}) => new TableCell({
  borders, width: { size: w, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 90, right: 90 },
  shading: (head || fill) ? { fill: fill || 'E8EDF7', type: ShadingType.CLEAR, color: 'auto' } : undefined,
  children: [new Paragraph({ children: [new TextRun({ text, font: FONT, size, bold: head || bold })] })],
});
const table = (widths, header, rows, o = {}) => new Table({
  width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: widths,
  rows: [new TableRow({ tableHeader: true, children: header.map((t, i) => cell(t, widths[i], { head: true, size: o.size || 17 })) }),
    ...rows.map(r => new TableRow({ children: r.map((t, i) => cell(t, widths[i], { bold: o.firstBold && i === 0, size: o.size || 17 })) }))],
});
const code = lines => new Table({ // блок коду: одна клітинка з моноширинним текстом
  width: { size: W, type: WidthType.DXA }, columnWidths: [W],
  rows: [new TableRow({ children: [new TableCell({
    borders, width: { size: W, type: WidthType.DXA }, margins: { top: 100, bottom: 100, left: 140, right: 140 },
    shading: { fill: 'F4F6FA', type: ShadingType.CLEAR, color: 'auto' },
    children: lines.map(l => new Paragraph({ children: [new TextRun({ text: l, font: MONO, size: 16 })] })),
  })] })],
});
const gap = () => new Paragraph({ spacing: { before: 60, after: 60 }, children: [] });

const b = [];
b.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: C.title, font: FONT, size: 34, bold: true })] }));
b.push(table([2000, W - 2000], ['Поле', 'Значення'], C.meta, { size: 18 }));
b.push(h('Контекст', HeadingLevel.HEADING_1)); C.context.forEach(t => b.push(p(t)));
b.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120 }, children: [new ImageRun({
  type: 'png', data: fs.readFileSync('data_flow.png'), transformation: { width: 640, height: 365 },
  altText: { title: 'Запит до медичних даних СУМЗ', description: 'Потік запиту лікаря: Envoy Gateway, PEP authorize() у FastAPI, PDP з перевірками RBAC, ABAC, тегів класу, мети і згоди, break-the-glass; PostgreSQL з RLS і шифруванням полів ключем пацієнта через KMS; журнал аудиту з хеш-ланцюгом і звіт доступів пацієнту', name: 'data_flow' },
})] }));
b.push(p(C.figureCaption, { alignment: AlignmentType.CENTER, run: { italics: true, size: 18 } }));

// 1
b.push(new Paragraph({ children: [new PageBreak()] }));
b.push(h('1. Класифікація даних', HeadingLevel.HEADING_1));
C.s1.intro.forEach(t => b.push(p(t)));
b.push(table([1650, 2600, 1150, 1700, 2538], ['Категорія', 'Приклади в СУМЗ', 'Рівень', 'Вплив C / I / A', 'Регуляторні мітки'], C.s1.categories));
b.push(h('Як мітки інтегруються в систему', HeadingLevel.HEADING_2));
b.push(table([1900, W - 1900], ['Де', 'Як'], C.s1.integration, { size: 18 }));
b.push(p(C.s1.note, { spacing: { before: 140, after: 120 }, run: { italics: true, size: 19, color: '374151' } }));

// 2
b.push(h('2. Правова підстава обробки (legal basis)', HeadingLevel.HEADING_1));
C.s2.intro.forEach(t => b.push(p(t)));
b.push(table([2500, 4100, 3038], ['Мета (purpose)', 'Правова підстава', 'Що це означає для системи'], C.s2.purposes));
b.push(h('Як зберігається згода: таблиця consent', HeadingLevel.HEADING_2));
b.push(table([2600, W - 2600], ['Поле', 'Призначення'], C.s2.consentSchema));
b.push(h('Як це використовується під час доступу', HeadingLevel.HEADING_2));
C.s2.usage.forEach(t => b.push(bullet(t)));

// 3
b.push(h('3. Контроль доступу до даних', HeadingLevel.HEADING_1));
C.s3.intro.forEach(t => b.push(p(t)));
b.push(h('PoLP і need-to-know за ролями', HeadingLevel.HEADING_2));
b.push(table([1500, 4200, 3938], ['Роль', 'Бачить (need-to-know)', 'Не бачить / маскується'], C.s3.roles));
b.push(h('Механізми', HeadingLevel.HEADING_2));
b.push(table([1500, 3400, 4738], ['Механізм', 'На чому базується', 'Як діє'], C.s3.mechanisms));
b.push(p(C.s3.note, { spacing: { before: 140, after: 120 }, run: { italics: true, size: 19, color: '374151' } }));

// 4
b.push(h('4. Логування та аудит', HeadingLevel.HEADING_1));
C.s4.intro.forEach(t => b.push(p(t)));
b.push(h('Що потрапляє в audit trail', HeadingLevel.HEADING_2));
C.s4.events.forEach(t => b.push(bullet(t)));
b.push(h('Вигляд запису журналу доступу до чутливих даних', HeadingLevel.HEADING_2));
b.push(code(C.s4.logJson));
b.push(gap());
C.s4.portal.forEach(t => b.push(p(t)));

// 5
b.push(h('5. Retention і право на забуття', HeadingLevel.HEADING_1));
C.s5.intro.forEach(t => b.push(p(t)));
b.push(table([2400, 2650, 1500, 3088], ['Тип даних', 'Строк зберігання', 'Підстава', 'Що відбувається після строку'], C.s5.retention));
b.push(h('Як виконується запит на видалення', HeadingLevel.HEADING_2));
C.s5.rtbf.forEach(t => b.push(step(t, 1)));
b.push(h('Технічні виклики', HeadingLevel.HEADING_2));
b.push(table([1700, 2700, 5238], ['Виклик', 'У чому проблема', 'Рішення'], C.s5.challenges));

// 6
b.push(h('6. Шифрування й тестування', HeadingLevel.HEADING_1));
b.push(table([1200, 5000, 3438], ['Стан даних', 'Механізм', 'Навіщо'], C.s6.encryption));
b.push(p(C.s6.keys, { spacing: { before: 140, after: 120 } }));
b.push(h('Тестування без production-даних', HeadingLevel.HEADING_2));
C.s6.testing.forEach(t => b.push(p(t)));
b.push(h('Запобіжники: як prod-дані не потрапляють у dev/test', HeadingLevel.HEADING_2));
C.s6.guardrails.forEach(t => b.push(bullet(t)));

// Бонус
b.push(h('Бонус: залишкові ризики', HeadingLevel.HEADING_1));
b.push(table([2300, 2300, 3438, 1600], ['Ризик', 'Чому лишається', 'Як зменшуємо', 'Відповідальний'], C.risks));

b.push(h('Висновок', HeadingLevel.HEADING_1));
C.conclusion.forEach(t => b.push(p(t)));

b.push(h('Звʼязок з попередніми ДЗ', HeadingLevel.HEADING_2));
b.push(table([2300, 3300, 4038], ['Елемент ДЗ8', 'На що спирається', 'Що додано'], C.trace));

const doc = new Document({
  creator: 'Фарід Джафарлі', title: C.title,
  styles: { default: { document: { run: { font: FONT, size: 21 } } }, paragraphStyles: [
    { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 28, bold: true, color: '1F3A8A', font: FONT }, paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 0 } },
    { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 23, bold: true, color: '1F2937', font: FONT }, paragraph: { spacing: { before: 220, after: 100 }, outlineLevel: 1 } },
  ] },
  numbering: { config: [
    { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] },
    { reference: 'steps', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 320 } } } }] },
  ] },
  sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } }, children: b }],
});
const out = 'ДЗ8_Джафарлі_Фарід.docx';
Packer.toBuffer(doc).then(buf => { fs.writeFileSync(out, buf); console.log('written', out, buf.length); });
