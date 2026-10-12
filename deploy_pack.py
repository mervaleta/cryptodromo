#!/usr/bin/env python3
"""
Deploy Packager for Hostinger
Generates a production-ready public_html package (site_release.zip)
to replace the Hostinger AI Builder entirely.
"""

import os
import zipfile
import shutil
import time

def build_release_package(source_dir: str = "public", output_zip: str = "site_release.zip"):
    if not os.path.exists(source_dir):
        raise FileNotFoundError(f"Source dir {source_dir} not found.")

    with zipfile.ZipFile(output_zip, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            for file in files:
                abs_path = os.path.join(root, file)
                rel_path = os.path.relpath(abs_path, source_dir)
                zipf.write(abs_path, arcname=rel_path)

    print(f"[DeployPackager] [+] Package created successfully: {output_zip} ({os.path.getsize(output_zip)} bytes)")
    return output_zip

if __name__ == "__main__":
    build_release_package()
