import re

with open("/data/workspace/cryptodromo/index.html", "r", encoding="utf-8") as f:
    html = f.read()

# 1. Favicon updates
favicon_tags = """
    <link rel="icon" type="image/x-icon" href="/favicon.ico"/>
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"/>
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png"/>
    <link rel="shortcut icon" href="/favicon.ico"/>
    <link rel="apple-touch-icon" href="/favicon-32x32.png"/>
"""

# Replace existing favicon link in head
if '<link rel="icon" href="/favicon.ico"/>' in html:
    html = html.replace('<link rel="icon" href="/favicon.ico"/>', favicon_tags.strip())
    print("Updated favicon tags in <head>")
else:
    print("Favicon tag not found directly, checking other patterns...")
    html = re.sub(r'<link[^>]*rel=["\'](?:shortcut )?icon["\'][^>]*>', favicon_tags.strip(), html)

# 2. Header titles linking in footer
headers_map = {
    'About us': '/aboutus',
    'Privacy Policy': '/privacypolicy',
    'Community': '/community',
    'Help Center': '/help',
    'Contact': '/contact',
    'Social': '/community/social'
}

for title, url in headers_map.items():
    old_p = f'<p class="chakra-text css-1xxcssw">{title}</p>'
    new_a = f'<a href="{url}" style="text-decoration:none;"><p class="chakra-text css-1xxcssw" style="transition:color 0.2s;" onmouseover="this.style.color=\'#60efff\'" onmouseout="this.style.color=\'var(--chakra-colors-white)\'">{title}</p></a>'
    if old_p in html:
        html = html.replace(old_p, new_a)
        print(f"Linked header: {title} -> {url}")
    else:
        # Check if already wrapped or other format
        print(f"Header pattern for {title} not found directly, checking...")

# Also replace contact if it was mailto:
if 'href="mailto:info@cryptodromo.com"><p class="chakra-text css-1xxcssw">Contact</p>' in html:
    html = html.replace('href="mailto:info@cryptodromo.com"><p class="chakra-text css-1xxcssw">Contact</p>', 'href="/contact"><p class="chakra-text css-1xxcssw">Contact</p>')
    print("Replaced mailto with /contact")

with open("/data/workspace/cryptodromo/index.html", "w", encoding="utf-8") as f:
    f.write(html)

print("Saved updated index.html")
