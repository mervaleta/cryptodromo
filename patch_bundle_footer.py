#!/usr/bin/env python3
"""
Patch Next.js frontend bundle and SSR bundle to wrap every footer word in <Link href="..."><a><Text>...</Text></a></Link>
and replace the footer logo with /texturas/logo_janch_header.png.
"""

def patch_bundle(content):
    # 1. Logo
    content = content.replace(
        'src:"/texturas/logo_cryptodromo_footer.png"',
        'src:"/texturas/logo_janch_header.png"'
    )

    # 2. Titles mapping: (title, url)
    titles = [
        ("About us", "/aboutus"),
        ("Privacy Policy", "/privacypolicy"),
        ("Community", "/community"),
        ("Help Center", "/help"),
        ("Social", "/community/social")
    ]
    for title, url in titles:
        # Pattern in 4764 chunk: (0,i.jsx)(n.xv,{color:"white",fontSize:"18px",fontWeight:"700",children:"About us"})
        old_pattern = f'(0,i.jsx)(n.xv,{{color:"white",fontSize:"18px",fontWeight:"700",children:"{title}"}})'
        new_pattern = f'(0,i.jsx)(x(),{{href:"{url}",children:(0,i.jsx)("a",{{rel:"noopener noreferrer",children:(0,i.jsx)(n.xv,{{color:"white",fontSize:"18px",fontWeight:"700",cursor:"pointer",_hover:{{color:"#60efff"}},children:"{title}"}})}})}})'
        if old_pattern in content:
            content = content.replace(old_pattern, new_pattern)
            print(f"Patched title: {title}")

    # 3. Words mapping: (word, url)
    words = [
        ("History", "/aboutus/history"),
        ("Mission", "/aboutus/mission"),
        ("Vision", "/aboutus/vision"),
        ("Our Team", "/aboutus/ourteam"),
        ("Terms of Service", "/privacypolicy/legal"),
        ("Legal Notice", "/privacypolicy/tos"),
        ("Social Media", "/community/social"),
        ("Referral Program", "/community/referral"),
        ("Affiliate Program", "/community/affiliate"),
        ("Events", "/community/events"),
        ("Downloads", "/community/downloads"),
        ("News Blog", "/community/blog"),
        ("Tutorials", "/help/tutorials"),
        ("Guides", "/help/guides"),
        ("Glossary", "/help/glossary"),
        ("FAQ", "/help/faq"),
        ("Troubleshooting", "/help/troubleshooting"),
        ("Support", "/help/support"),
        ("Media Kit", "/contact/mediakit"),
        ("Careers", "/contact/careers"),
        ("Newsletter", "/contact/newsletter"),
        ("Sitemap", "/contact/sitemap"),
        ("Facebook", "https://facebook.com/cryptodromo"),
        ("Instagram", "https://instagram.com/cryptodromo"),
        ("X", "https://x.com/cryptodromo"),
        ("Youtube", "https://youtube.com/@cryptodromo")
    ]
    for word, url in words:
        old_pattern = f'(0,i.jsx)(n.xv,{{color:"gray.100",fontSize:"15px",children:"{word}"}})'
        new_pattern = f'(0,i.jsx)(x(),{{href:"{url}",color:"gray.100",children:(0,i.jsx)("a",{{rel:"noopener noreferrer",children:(0,i.jsx)(n.xv,{{color:"gray.100",fontSize:"15px",cursor:"pointer",_hover:{{color:"#60efff"}},children:"{word}"}})}})}})'
        if old_pattern in content:
            content = content.replace(old_pattern, new_pattern)
            print(f"Patched word: {word}")
        else:
            print(f"Word pattern not matched: {word}")

    return content

if __name__ == "__main__":
    import sys
    with open(sys.argv[1], "r", encoding="utf-8") as f:
        c = f.read()
    c = patch_bundle(c)
    with open(sys.argv[1], "w", encoding="utf-8") as f:
        f.write(c)
    print("Done patching", sys.argv[1])
