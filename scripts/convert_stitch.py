import re, os

def extract_content_sections(html):
    main_match = re.search(r'<main[^>]*>(.*?)</main>', html, re.DOTALL)
    if main_match:
        content = main_match.group(1)
    else:
        sections = re.findall(r'<section[^>]*>.*?</section>', html, re.DOTALL)
        content = '\n'.join(sections)
    content = re.sub(r'<header[^>]*>.*?</header>', '', content, flags=re.DOTALL)
    content = re.sub(r'<nav[^>]*>.*?</nav>', '', content, flags=re.DOTALL)
    content = re.sub(r'<footer[^>]*>.*?</footer>', '', content, flags=re.DOTALL)
    return content.strip()

def fix_colors(html):
    # Backgrounds
    html = html.replace('bg-gradient-to-b from-white via-forest-50/20 to-[#FAFBFB]', 'bg-white')
    html = html.replace('bg-gradient-to-tr from-gray-100 to-gray-50', 'bg-green-50')
    html = html.replace('bg-[#FAFBFB]', 'bg-white')
    html = html.replace('bg-forest-50', 'bg-green-50')
    html = html.replace('bg-forest-100', 'bg-green-100')
    html = html.replace('bg-forest-700/60', 'bg-green-600/60')
    html = html.replace('bg-forest-700', 'bg-green-700')
    html = html.replace('bg-forest-800', 'bg-green-800')
    html = html.replace('bg-forest-900/50', 'bg-green-900/50')
    html = html.replace('bg-forest-950', 'bg-green-950')
    html = html.replace('bg-emerald-50', 'bg-green-50')
    html = html.replace('bg-emerald-100/40', 'bg-green-100/40')
    html = html.replace('bg-emerald-100', 'bg-green-100')
    html = html.replace('bg-emerald-500', 'bg-green-500')
    html = html.replace('bg-gray-50/70', 'bg-white')
    html = html.replace('bg-gray-50', 'bg-white')
    html = html.replace('bg-surface-container-lowest', 'bg-white')
    html = html.replace('bg-surface-container-low', 'bg-green-50')
    html = html.replace('bg-surface-container', 'bg-green-50')
    html = html.replace('bg-surface', 'bg-white')
    html = html.replace('bg-primary-fixed/20', 'bg-green-100')
    html = html.replace('bg-primary-fixed/10', 'bg-green-50')
    html = html.replace('bg-primary-fixed', 'bg-green-100')
    html = html.replace('bg-primary-container/50', 'bg-green-700/50')
    html = html.replace('bg-primary-container', 'bg-green-700')
    html = html.replace('bg-primary', 'bg-green-800')
    html = html.replace('bg-tertiary-fixed/20', 'bg-green-100')
    html = html.replace('bg-tertiary-fixed', 'bg-green-100')
    html = html.replace('bg-tertiary', 'bg-green-500')
    html = html.replace('bg-secondary-fixed-dim', 'bg-amber-500')
    # Text
    html = html.replace('text-forest-100', 'text-green-100')
    html = html.replace('text-forest-300', 'text-green-300')
    html = html.replace('text-forest-700', 'text-green-700')
    html = html.replace('text-forest-800', 'text-green-800')
    html = html.replace('text-emerald-300', 'text-green-300')
    html = html.replace('text-emerald-500', 'text-green-500')
    html = html.replace('text-emerald-700', 'text-green-700')
    html = html.replace('text-emerald-800', 'text-green-800')
    html = html.replace('text-gray-400', 'text-gray-500')
    html = html.replace('text-gray-500', 'text-gray-600')
    html = html.replace('text-gray-600', 'text-gray-700')
    html = html.replace('text-gray-700', 'text-gray-800')
    html = html.replace('text-gray-800', 'text-gray-900')
    html = html.replace('text-gray-900', 'text-green-900')
    html = html.replace('text-on-surface-variant', 'text-gray-700')
    html = html.replace('text-on-surface', 'text-green-900')
    html = html.replace('text-on-primary', 'text-white')
    html = html.replace('text-primary-fixed-dim', 'text-green-300')
    html = html.replace('text-primary-fixed', 'text-green-100')
    html = html.replace('text-primary-container', 'text-green-700')
    html = html.replace('text-primary', 'text-green-800')
    html = html.replace('text-tertiary-fixed', 'text-green-400')
    html = html.replace('text-tertiary', 'text-green-700')
    html = html.replace('text-secondary-fixed-dim', 'text-amber-500')
    html = html.replace('text-outline', 'text-gray-500')
    html = html.replace('[#98E2C6]', '#86EFAC')
    # Borders
    html = html.replace('border-forest-100', 'border-green-100')
    html = html.replace('border-forest-200/80', 'border-green-200')
    html = html.replace('border-forest-300', 'border-green-300')
    html = html.replace('border-forest-600', 'border-green-600')
    html = html.replace('border-forest-700/60', 'border-green-700/60')
    html = html.replace('border-forest-700', 'border-green-700')
    html = html.replace('border-gray-100', 'border-green-100')
    html = html.replace('border-gray-200/70', 'border-green-200')
    html = html.replace('border-gray-200/80', 'border-green-200')
    html = html.replace('border-gray-200/90', 'border-green-200')
    html = html.replace('border-gray-200', 'border-green-200')
    html = html.replace('border-outline-variant', 'border-green-200')
    html = html.replace('border-primary-container', 'border-green-700')
    html = html.replace('border-primary-fixed/20', 'border-green-200')
    html = html.replace('border-primary-fixed/40', 'border-green-300')
    # Hover
    html = html.replace('hover:border-forest-300', 'hover:border-green-300')
    html = html.replace('hover:bg-forest-50', 'hover:bg-green-50')
    html = html.replace('hover:bg-forest-600', 'hover:bg-green-600')
    html = html.replace('hover:bg-forest-800', 'hover:bg-green-800')
    html = html.replace('group-hover:bg-forest-800', 'group-hover:bg-green-800')
    # Shadows
    html = html.replace('shadow-soft', 'shadow-md')
    html = html.replace('shadow-card-hover', 'shadow-lg')
    html = html.replace('shadow-inner', 'shadow-sm')
    return html

def html_to_jsx(html):
    html = html.replace(' class="', ' className="')
    html = html.replace(" class='", " className='")
    html = html.replace('></div>', ' />')
    html = html.replace('></span>', ' />')
    html = html.replace('></input>', ' />')
    html = html.replace('></br>', ' />')
    html = html.replace('viewbox="', 'viewBox="')
    html = html.replace('stroke-width="', 'strokeWidth="')
    html = html.replace('stroke-linecap="', 'strokeLinecap="')
    html = html.replace('stroke-linejoin="', 'strokeLinejoin="')
    html = re.sub(r'<path ([^>]*)></path>', r'<path \1 />', html)
    html = re.sub(r'<circle ([^>]*)></circle>', r'<circle \1 />', html)
    html = re.sub(r'<!--.*?-->', '', html, flags=re.DOTALL)
    return html.strip()

page_map = {
    'jagofarm_tentang_kami': ('about', 'Tentang Kami'),
    'jagofarm_halaman_kontak_modern': ('contact', 'Hubungi Kami'),
    'jagofarm_faq_pusat_bantuan_modern': ('faq', 'FAQ'),
    'jagofarm_panduan_cara_pemesanan_modern': ('how-to-order', 'Cara Pemesanan'),
    'jagofarm_kebijakan_pengiriman_modern': ('shipping-policy', 'Kebijakan Pengiriman'),
    'jagofarm_kebijakan_pengembalian_refund_modern': ('return-policy', 'Kebijakan Pengembalian'),
    'jagofarm_kebijakan_privasi_modern': ('privacy-policy', 'Kebijakan Privasi'),
    'jagofarm_syarat_dan_ketentuan_modern': ('terms', 'Syarat dan Ketentuan'),
    'jagofarm_live_chat_konsultasi_agronomis': ('consultation', 'Konsultasi'),
}

base = '.hermes/stitch_ref'
for folder, (route, title) in page_map.items():
    html_path = f'{base}/{folder}/code.html'
    if not os.path.exists(html_path):
        continue
    content = open(html_path, encoding='utf-8').read()
    main_html = extract_content_sections(content)
    if not main_html:
        continue
    main_html = fix_colors(main_html)
    jsx_content = html_to_jsx(main_html)
    jsx_escaped = jsx_content.replace('`', '\\`').replace('${', '\\${')
    component = f'export const metadata = {{ title: "{title} - JagoFarm" }};\n\nexport default function Page() {{\n  return (\n    <div dangerouslySetInnerHTML={{{{__html: `{jsx_escaped}`}}}} />\n  );\n}}\n'
    out_path = f'src/app/(shop)/{route}/page.tsx'
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(component)
    print(f'OK {route}: {len(component)} chars')