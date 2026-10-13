import re

with open("/data/workspace/cryptodromo/index.html", "r", encoding="utf-8") as f:
    html = f.read()

# 1. Update footer logo to match header logo
old_footer_logo = '/texturas/logo_cryptodromo_footer.png'
new_footer_logo = '/texturas/logo_janch_header.png'
if old_footer_logo in html:
    html = html.replace(old_footer_logo, new_footer_logo)
    print("Replaced footer logo with header logo (/texturas/logo_janch_header.png)")
else:
    print("old_footer_logo not found directly")

# 2. Comprehensive word-to-link mapping
MAPPINGS = [
    # Column 1
    ("About us", "/aboutus"),
    ("History", "/aboutus/history"),
    ("How it works", "/aboutus/howItWorks"),
    ("Mission", "/aboutus/mission"),
    ("Vision", "/aboutus/vision"),
    ("Our Team", "/aboutus/ourteam"),
    ("Roadmap", "/aboutus/roadmap"),
    
    # Column 2
    ("Privacy Policy", "/privacypolicy"),
    ("Terms of Service", "/privacypolicy/legal"),
    ("Legal Notice", "/privacypolicy/tos"),
    
    # Column 3
    ("Community", "/community"),
    ("Social Media", "/community/social"),
    ("Referral Program", "/community/referral"),
    ("Affiliate Program", "/community/affiliate"),
    ("Events", "/community/events"),
    ("Downloads", "/community/downloads"),
    ("News Blog", "/community/blog"),
    
    # Column 4
    ("Help Center", "/help"),
    ("Tutorials", "/help/tutorials"),
    ("Guides", "/help/guides"),
    ("Glossary", "/help/glossary"),
    ("FAQ", "/help/faq"),
    ("Troubleshooting", "/help/troubleshooting"),
    ("Support", "/help/support"),
    
    # Column 5
    ("Contact", "/contact"),
    ("Media Kit", "/contact/mediakit"),
    ("Careers", "/contact/careers"),
    ("Newsletter", "/contact/newsletter"),
    ("Sitemap", "/contact/sitemap"),
    
    # Column 6
    ("Social", "/community/social"),
    ("Facebook", "https://facebook.com"),
    ("Instagram", "https://instagram.com"),
    ("X", "https://x.com"),
    ("Tiktok", "https://tiktok.com"),
    ("Youtube", "https://youtube.com")
]

# Style helper: ensure links look crisp and interactive
link_style = 'style="color:#cbd5e1; text-decoration:none; transition:color 0.2s;" onmouseover="this.style.color=\'#60efff\'" onmouseout="this.style.color=\'#cbd5e1\'"'
header_style = 'style="color:#ffffff; font-weight:700; text-decoration:none; transition:color 0.2s;" onmouseover="this.style.color=\'#60efff\'" onmouseout="this.style.color=\'#ffffff\'"'

# Locate the footer container in index.html
footer_start = html.find('About us')
if footer_start != -1:
    footer_block_start = html.rfind('<div class="css-', 0, footer_start)
    footer_block_end = html.find('</div></div><style data-emotion="css gof756">', footer_start)
    
    if footer_block_start != -1 and footer_block_end != -1:
        print("Found exact footer block boundaries!")
        
        # Build clean, modern, fully-linked footer markup
        clean_footer = f"""
<div class="css-zu6lid" style="display:flex; flex-direction:column; gap:6px;">
  <a href="/aboutus" {header_style}><p class="chakra-text css-1xxcssw">About us</p></a>
  <a href="/aboutus/history" {link_style}><p class="chakra-text css-s9j3r2">History</p></a>
  <a href="/aboutus/howItWorks" {link_style}><p class="chakra-text css-s9j3r2">How it works</p></a>
  <a href="/aboutus/mission" {link_style}><p class="chakra-text css-s9j3r2">Mission</p></a>
  <a href="/aboutus/vision" {link_style}><p class="chakra-text css-s9j3r2">Vision</p></a>
  <a href="/aboutus/ourteam" {link_style}><p class="chakra-text css-s9j3r2">Our Team</p></a>
  <a href="/aboutus/roadmap" {link_style}><p class="chakra-text css-s9j3r2">Roadmap</p></a>
</div>

<div class="css-zu6lid" style="display:flex; flex-direction:column; gap:6px;">
  <a href="/privacypolicy" {header_style}><p class="chakra-text css-1xxcssw">Privacy Policy</p></a>
  <a href="/privacypolicy/legal" {link_style}><p class="chakra-text css-s9j3r2">Terms of Service</p></a>
  <a href="/privacypolicy/tos" {link_style}><p class="chakra-text css-s9j3r2">Legal Notice</p></a>
</div>

<div class="css-zu6lid" style="display:flex; flex-direction:column; gap:6px;">
  <a href="/community" {header_style}><p class="chakra-text css-1xxcssw">Community</p></a>
  <a href="/community/social" {link_style}><p class="chakra-text css-s9j3r2">Social Media</p></a>
  <a href="/community/referral" {link_style}><p class="chakra-text css-s9j3r2">Referral Program</p></a>
  <a href="/community/affiliate" {link_style}><p class="chakra-text css-s9j3r2">Affiliate Program</p></a>
  <a href="/community/events" {link_style}><p class="chakra-text css-s9j3r2">Events</p></a>
  <a href="/community/downloads" {link_style}><p class="chakra-text css-s9j3r2">Downloads</p></a>
  <a href="/community/blog" {link_style}><p class="chakra-text css-s9j3r2">News Blog</p></a>
</div>

<div class="css-zu6lid" style="display:flex; flex-direction:column; gap:6px;">
  <a href="/help" {header_style}><p class="chakra-text css-1xxcssw">Help Center</p></a>
  <a href="/help/tutorials" {link_style}><p class="chakra-text css-s9j3r2">Tutorials</p></a>
  <a href="/help/guides" {link_style}><p class="chakra-text css-s9j3r2">Guides</p></a>
  <a href="/help/glossary" {link_style}><p class="chakra-text css-s9j3r2">Glossary</p></a>
  <a href="/help/faq" {link_style}><p class="chakra-text css-s9j3r2">FAQ</p></a>
  <a href="/help/troubleshooting" {link_style}><p class="chakra-text css-s9j3r2">Troubleshooting</p></a>
  <a href="/help/support" {link_style}><p class="chakra-text css-s9j3r2">Support</p></a>
</div>

<div class="css-zu6lid" style="display:flex; flex-direction:column; gap:6px;">
  <a href="/contact" {header_style}><p class="chakra-text css-1xxcssw">Contact</p></a>
  <a href="/contact/mediakit" {link_style}><p class="chakra-text css-s9j3r2">Media Kit</p></a>
  <a href="/contact/careers" {link_style}><p class="chakra-text css-s9j3r2">Careers</p></a>
  <a href="/contact/newsletter" {link_style}><p class="chakra-text css-s9j3r2">Newsletter</p></a>
  <a href="/contact/sitemap" {link_style}><p class="chakra-text css-s9j3r2">Sitemap</p></a>
</div>

<div class="css-zu6lid" style="display:flex; flex-direction:column; gap:6px;">
  <a href="/community/social" {header_style}><p class="chakra-text css-1xxcssw">Social</p></a>
  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" {link_style}><p class="chakra-text css-s9j3r2">Facebook</p></a>
  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" {link_style}><p class="chakra-text css-s9j3r2">Instagram</p></a>
  <a href="https://x.com" target="_blank" rel="noopener noreferrer" {link_style}><p class="chakra-text css-s9j3r2">X</p></a>
  <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" {link_style}><p class="chakra-text css-s9j3r2">Tiktok</p></a>
  <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" {link_style}><p class="chakra-text css-s9j3r2">Youtube</p></a>
</div>
"""
        html = html[:footer_block_start] + clean_footer + html[footer_block_end:]
        print("Replaced whole footer block cleanly!")

with open("/data/workspace/cryptodromo/index.html", "w", encoding="utf-8") as f:
    f.write(html)
print("Finished updating index.html")
