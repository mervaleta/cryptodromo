#!/usr/bin/env python3
"""
Patch Next.js SSR bundle chunks/487.js so that every word and title has Link wrappers.
"""

def patch_ssr(content):
    # Logo
    content = content.replace(
        'src: "/texturas/logo_cryptodromo_footer.png"',
        'src: "/texturas/logo_janch_header.png"'
    )

    # Words mapping
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
        # Pattern in 487.js:
        # react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_chakra_ui_react__WEBPACK_IMPORTED_MODULE_2__.Text, { color: "gray.100", fontSize: "15px", children: "History" ... })
        import re
        pattern = re.compile(
            r'react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__\.jsx\(_chakra_ui_react__WEBPACK_IMPORTED_MODULE_2__\.Text,\s*\{\s*color:\s*"gray\.100",\s*fontSize:\s*"15px",\s*children:\s*"' + re.escape(word) + r'"[^}]*\}\)',
            re.DOTALL
        )
        replacement = f'react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx((next_link__WEBPACK_IMPORTED_MODULE_3___default()), {{ href: "{url}", color: "gray.100", children: react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("a", {{ rel: "noopener noreferrer", children: react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_chakra_ui_react__WEBPACK_IMPORTED_MODULE_2__.Text, {{ color: "gray.100", fontSize: "15px", cursor: "pointer", _hover: {{ color: "#60efff" }}, children: "{word}" }}) }}) }})'
        content, count = pattern.subn(replacement, content)
        if count > 0:
            print(f"Patched SSR word: {word}")

    titles = [
        ("About us", "/aboutus"),
        ("Privacy Policy", "/privacypolicy"),
        ("Community", "/community"),
        ("Help Center", "/help"),
        ("Social", "/community/social")
    ]
    for title, url in titles:
        import re
        pattern = re.compile(
            r'react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__\.jsx\(_chakra_ui_react__WEBPACK_IMPORTED_MODULE_2__\.Text,\s*\{\s*color:\s*"white",\s*fontSize:\s*"18px",\s*fontWeight:\s*"700",\s*children:\s*"' + re.escape(title) + r'"[^}]*\}\)',
            re.DOTALL
        )
        replacement = f'react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx((next_link__WEBPACK_IMPORTED_MODULE_3___default()), {{ href: "{url}", children: react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("a", {{ rel: "noopener noreferrer", children: react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_chakra_ui_react__WEBPACK_IMPORTED_MODULE_2__.Text, {{ color: "white", fontSize: "18px", fontWeight: "700", cursor: "pointer", _hover: {{ color: "#60efff" }}, children: "{title}" }}) }}) }})'
        content, count = pattern.subn(replacement, content)
        if count > 0:
            print(f"Patched SSR title: {title}")

    return content

if __name__ == "__main__":
    import sys
    with open(sys.argv[1], "r", encoding="utf-8") as f:
        c = f.read()
    c = patch_ssr(c)
    with open(sys.argv[1], "w", encoding="utf-8") as f:
        f.write(c)
    print("Done patching SSR", sys.argv[1])
