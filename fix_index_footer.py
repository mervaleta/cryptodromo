import re

FOOTER_LINKS = {
    "History": "/aboutus/history",
    "Mission": "/aboutus/mission",
    "Vision": "/aboutus/vision",
    "Our Team": "/aboutus/ourteam",
    "Terms of Service": "/privacypolicy/legal",
    "Legal Notice": "/privacypolicy/tos",
    "Social Media": "/community/social",
    "Referral Program": "/community/referral",
    "Affiliate Program": "/community/affiliate",
    "Events": "/community/events",
    "Downloads": "/community/downloads",
    "News Blog": "/community/blog",
    "Tutorials": "/help/tutorials",
    "Guides": "/help/guides",
    "Glossary": "/help/glossary",
    "FAQ": "/help/faq",
    "Troubleshooting": "/help/troubleshooting",
    "Support": "/help/support",
    "Media Kit": "/contact/mediakit",
    "Careers": "/contact/careers",
    "Newsletter": "/contact/newsletter",
    "Sitemap": "/contact/sitemap",
    "Facebook": "https://facebook.com",
    "Instagram": "https://instagram.com",
    "X": "https://x.com",
    "Tiktok": "https://tiktok.com",
    "Youtube": "https://youtube.com"
}

with open("/data/workspace/cryptodromo/index.html", "r", encoding="utf-8") as f:
    html = f.read()

# Replace plain <p class="chakra-text css-s9j3r2">Label</p> with <a href="url"><p ...>Label</p></a>
count = 0
for label, url in FOOTER_LINKS.items():
    pattern = f'<p class="chakra-text css-s9j3r2">{label}</p>'
    target = f'<a rel="noopener noreferrer" href="{url}"><p class="chakra-text css-s9j3r2" style="transition:color 0.2s;" onmouseover="this.style.color=\'#60efff\'" onmouseout="this.style.color=\'var(--chakra-colors-gray-100)\'">{label}</p></a>'
    if pattern in html:
        html = html.replace(pattern, target)
        count += 1

print(f"Replaced {count} footer links in index.html")

# Also ensure top navbar links navigate properly
# Check nav links in top-nav if any
with open("/data/workspace/cryptodromo/index.html", "w", encoding="utf-8") as f:
    f.write(html)
