#!/usr/bin/env python3
"""
Hostinger FTP Deployer
Uploads contents of public/ to public_html/ on Hostinger.
"""

import os
import sys
from ftplib import FTP, error_perm

FTP_HOST = os.environ.get("FTP_HOST", "195.35.41.12")
FTP_USER = os.environ.get("FTP_USER", "u931528598")
FTP_PORT = int(os.environ.get("FTP_PORT", 21))
FTP_PASS = os.environ.get("FTP_PASSWORD", "")
LOCAL_DIR = os.environ.get("DEPLOY_SOURCE", "public")
REMOTE_DIR = os.environ.get("REMOTE_DIR", "public_html")

def upload_directory(ftp: FTP, local_path: str, remote_path: str):
    print(f"[FTP] Syncing directory: {local_path} -> {remote_path}")
    
    # Try to change to remote directory, create if missing
    try:
        ftp.cwd(remote_path)
    except error_perm:
        try:
            ftp.mkd(remote_path)
            ftp.cwd(remote_path)
        except Exception as e:
            print(f"[FTP] Warning creating {remote_path}: {e}")

    for item in os.listdir(local_path):
        local_item = os.path.join(local_path, item)
        if os.path.isdir(local_item):
            upload_directory(ftp, local_item, item)
            ftp.cwd("..")
        else:
            print(f"[FTP] Uploading file: {item} ...")
            with open(local_item, "rb") as f:
                ftp.storbinary(f"STOR {item}", f)
            print(f"[FTP] [+] {item} uploaded successfully.")

def main():
    if not FTP_PASS:
        print("[FTP] Error: FTP_PASSWORD environment variable is not set.", file=sys.stderr)
        sys.exit(1)

    print(f"[FTP] Connecting to {FTP_HOST}:{FTP_PORT} as {FTP_USER}...")
    ftp = FTP()
    ftp.connect(FTP_HOST, FTP_PORT, timeout=30)
    ftp.login(FTP_USER, FTP_PASS)
    ftp.set_pasv(True)
    print(f"[FTP] [+] Connected and authenticated.")

    upload_directory(ftp, LOCAL_DIR, REMOTE_DIR)
    
    ftp.quit()
    print("[FTP] >>> All files deployed successfully to Hostinger!")

if __name__ == "__main__":
    main()
