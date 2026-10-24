#!/usr/bin/env python3
"""ДЗ8: запит лікаря до медичних даних СУМЗ: класифікація, правова підстава, згода, маскування, шифрування, аудит (data_flow.png).
Нотація як у ДЗ2/ДЗ5/ДЗ7: прямокутник = зовнішня сутність, заокруглений прямокутник = процес,
дві лінії = сховище, стрілка = потік, червоний пунктир = межа довіри (TB1-TB3 з ДЗ2)."""
from PIL import Image, ImageDraw, ImageFont
import math

W, H = 2000, 1140
img = Image.new('RGB', (W, H), 'white')
d = ImageDraw.Draw(img)
FONT = '/System/Library/Fonts/Supplemental/Arial Unicode.ttf'
f = lambda s: ImageFont.truetype(FONT, s)
F_T, F_B, F_S, F_Z, F_P = f(29), f(20), f(17), f(19), f(18)
INK, BLUE, GREEN, ORANGE, RED, GREY, PURPLE = '#1f2937', '#1d4ed8', '#047857', '#b45309', '#dc2626', '#6b7280', '#6d28d9'


def text_c(box, txt, font, fill=INK):
    x0, y0, x1, y1 = box
    lines = txt.split('\n')
    hs = [d.textbbox((0, 0), l, font=font) for l in lines]
    th = sum(b[3] - b[1] for b in hs) + 7 * (len(lines) - 1)
    y = (y0 + y1 - th) / 2
    for l, b in zip(lines, hs):
        d.text(((x0 + x1 - (b[2] - b[0])) / 2, y - b[1]), l, font=font, fill=fill)
        y += b[3] - b[1] + 7


def entity(box, txt):
    d.rectangle(box, outline=BLUE, width=4, fill='#eff6ff'); text_c(box, txt, F_B)


def process(box, txt, outline=GREEN, fill='#ecfdf5'):
    d.rounded_rectangle(box, radius=24, outline=outline, width=4, fill=fill); text_c(box, txt, F_B)


def store(box, txt):
    x0, y0, x1, y1 = box
    d.rectangle(box, fill='#fffbeb')
    d.line([(x0, y0), (x1, y0)], fill=ORANGE, width=4); d.line([(x0, y1), (x1, y1)], fill=ORANGE, width=4)
    d.line([(x0, y0), (x0, y1)], fill=ORANGE, width=4)
    text_c(box, txt, F_B)


def dashed_rect(box, color=RED, dash=16, gap=10, width=3):
    x0, y0, x1, y1 = box
    for a, b in [((x0, y0), (x1, y0)), ((x1, y0), (x1, y1)), ((x1, y1), (x0, y1)), ((x0, y1), (x0, y0))]:
        L = math.dist(a, b); n = int(L // (dash + gap)) + 1
        for i in range(n):
            s = i * (dash + gap) / L; e = min(1, (i * (dash + gap) + dash) / L)
            d.line([(a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s),
                    (a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e)], fill=color, width=width)


def label(x, y, txt, color=INK, font=None):
    font = font or F_S
    b = d.textbbox((0, 0), txt, font=font)
    d.rectangle((x - 4, y - 3, x + b[2] - b[0] + 4, y + b[3] - b[1] + 7), fill='white')
    d.text((x, y - b[1]), txt, font=font, fill=color)


def poly(points, color=INK, both=False, width=3):
    for a, b in zip(points, points[1:]):
        d.line([a, b], fill=color, width=width)

    def head(p, q):
        ang = math.atan2(q[1] - p[1], q[0] - p[0])
        for s in (+1, -1):
            d.line([q, (q[0] - 17 * math.cos(ang + s * 0.4), q[1] - 17 * math.sin(ang + s * 0.4))], fill=color, width=width)
    head(points[-2], points[-1])
    if both:
        head(points[1], points[0])


# Заголовок
d.text((40, 22), 'СУМЗ: запит до медичних даних (класифікація, правова підстава, маскування, шифрування, аудит)', font=F_T, fill=INK)

# Межі довіри
Z = [(20, 100, 330, 930, 'TB1 · клієнти'), (350, 100, 1360, 930, 'TB2 · застосунок (EKS)'), (1380, 100, 1980, 930, 'TB3 · дані (RDS, S3, KMS)')]
for x0, y0, x1, y1, t in Z:
    dashed_rect((x0, y0, x1, y1))
    label(x0 + 14, y1 - 38, t, RED, F_Z)

# Вузли
entity((40, 190, 310, 330), 'Лікар · медсестра\nреєстратор\n(веб / мобільний)')
entity((40, 690, 310, 830), 'Пацієнт: портал\n«Хто переглядав\nмою картку»')
process((380, 190, 640, 330), 'Envoy Gateway\nTLS 1.3 · JWT\nrate limit')
process((700, 190, 960, 330), 'FastAPI\nPEP: authorize()\n+ маскування полів')
# PDP
d.rounded_rectangle((1010, 165, 1340, 585), radius=24, outline=PURPLE, width=4, fill='#f5f3ff')
text_c((1010, 175, 1340, 225), 'PDP: рішення доступу', F_B, PURPLE)
checks = ['① RBAC: роль і дія', '② ABAC: care_assignment,', '     відділення, зміна', '③ Теги поля: клас,', '     підкатегорія', '④ Мета + правова', '     підстава, згода', '⑤ Break-the-glass:', '     причина + step-up MFA']
y = 235
for c in checks:
    d.text((1032, y), c, font=F_P, fill=INK); y += 30
label(1032, 518, 'allow · allow+mask · deny (404)', PURPLE, F_P)

store((380, 420, 640, 530), 'Реєстр класифікації\nclassification.yaml')
process((380, 620, 640, 730), 'OpenMetadata\n(каталог даних)', outline=GREY, fill='#f3f4f6')
store((1010, 640, 1340, 750), 'Consent-сервіс\n(таблиця consent)')

store((1400, 170, 1960, 300), 'D1 · PostgreSQL (RDS)\nRLS · Restricted-поля зашифровані\nключем пацієнта (DEK)')
entity((1400, 350, 1960, 450), 'AWS KMS · ключ «phi-fields»\nзагортає DEK пацієнтів')
store((1400, 510, 1960, 610), 'D2 · S3 (знімки, PDF)\nSSE-KMS · теги class, patient_ref')
store((1400, 680, 1960, 800), 'D3 · audit_event (хеш-ланцюг)\npurpose, legal_basis, patient_ref\n→ S3 Object Lock')

# Потоки
poly([(310, 260), (380, 260)], both=True)
label(318, 222, '①', INK)
poly([(640, 260), (700, 260)], both=True)
poly([(960, 260), (1010, 260)], PURPLE, both=True)
poly([(830, 190), (830, 140), (1680, 140), (1680, 170)], both=True)
label(880, 110, '② SELECT під RLS (SET LOCAL app.subject_id) → рядки → маскування полів за роллю', INK)
poly([(640, 475), (1010, 475)], PURPLE)
label(850, 487, 'мітки класу', PURPLE)
poly([(510, 530), (510, 620)])
label(522, 562, 'синхронізація міток')
poly([(1175, 585), (1175, 640)], PURPLE, both=True)
label(985, 600, 'мета + згода', PURPLE)
poly([(1680, 300), (1680, 350)], ORANGE, both=True)
label(1694, 310, 'розгорнути DEK', ORANGE)
poly([(1680, 450), (1680, 510)], ORANGE, both=True)
label(1694, 465, 'SSE-KMS', ORANGE)
poly([(830, 330), (830, 770), (1400, 770)])
label(860, 780, '③ audit_event у тій самій транзакції', INK)
poly([(1680, 800), (1680, 880), (175, 880), (175, 830)])
label(700, 868, '④ звіт доступів: дата, роль, відділення, мета, break-the-glass (GDPR ст. 15)', INK)

# Легенда
ly = 975
entity((40, ly, 200, ly + 50), 'Сутність'); process((230, ly, 390, ly + 50), 'Процес'); store((420, ly, 580, ly + 50), 'Сховище')
poly([(620, ly + 25), (720, ly + 25)]); d.text((735, ly + 12), 'потік даних', font=F_S, fill=INK)
dashed_rect((880, ly + 5, 960, ly + 45)); d.text((975, ly + 12), 'межа довіри', font=F_S, fill=RED)
d.rounded_rectangle((1130, ly, 1290, ly + 50), radius=16, outline=PURPLE, width=4, fill='#f5f3ff'); text_c((1130, ly, 1290, ly + 50), 'PDP', F_B, PURPLE)
d.text((1310, ly + 12), 'рішення доступу (у фазі 2 через OPA)', font=F_S, fill=INK)
d.text((40, ly + 80), 'Restricted = PHI (діагнози, нотатки, результати, знімки); підкатегорії (психіатрія, ВІЛ, генетика) бачить лише лікар, що веде пацієнта. Журнал містить лише псевдонім patient_ref.', font=F_S, fill=GREY)

img.save('data_flow.png')
print('data_flow.png', img.size)
