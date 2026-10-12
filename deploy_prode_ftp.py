#!/usr/bin/env python3
"""
Deploy Prode Bursátil to Hostinger via FTP
"""

import os
import sys
from ftplib import FTP, error_perm

FTP_HOST = os.environ.get("FTP_HOST", "195.35.41.12")
FTP_USER = os.environ.get("FTP_USER", "u931528598.mediumvioletred-shrew-934553.hostingersite.com")
FTP_PORT = int(os.environ.get("FTP_PORT", 21))
FTP_PASS = os.environ.get("FTP_PASSWORD", "")
LOCAL_DIR = os.environ.get("DEPLOY_SOURCE", "/data/workspace/prode-bursatil")
REMOTE_DIR = os.environ.get("REMOTE_DIR", "public_html")


def upload_directory(ftp: FTP, local_path: str, remote_path: str):
    print(f"[FTP] Sincronizando directorio: {local_path} -> {remote_path}")
    try:
        ftp.cwd(remote_path)
    except error_perm:
        try:
            ftp.mkd(remote_path)
            ftp.cwd(remote_path)
        except Exception as e:
            print(f"[FTP] Aviso creando {remote_path}: {e}")

    for item in os.listdir(local_path):
        local_item = os.path.join(local_path, item)
        if os.path.isdir(local_item):
            upload_directory(ftp, local_item, item)
            ftp.cwd("..")
        else:
            print(f"[FTP] Subiendo archivo: {item} ...")
            with open(local_item, "rb") as f:
                ftp.storbinary(f"STOR {item}", f)
            print(f"[FTP] [+] {item} subido con éxito.")


def main():
    if not FTP_PASS:
        print("[FTP] Error: FTP_PASSWORD no está configurada.", file=sys.stderr)
        sys.exit(1)

    print(f"[FTP] Conectando a {FTP_HOST}:{FTP_PORT} como usuario {FTP_USER}...")
    ftp = FTP()
    try:
        ftp.connect(FTP_HOST, FTP_PORT, timeout=30)
        ftp.login(FTP_USER, FTP_PASS)
        print("[FTP] [+] Autenticación exitosa.")

        # Inspeccionar qué hay en la raíz
        lines = []
        ftp.retrlines("LIST", lines.append)
        print("[FTP] Contenido raíz:")
        for line in lines:
            print("     ", line)

        # Si existe default.php o index.php viejo en public_html que tape el index.html, avisar o reemplazar
        upload_directory(ftp, LOCAL_DIR, REMOTE_DIR)
        print("[FTP] [✔] Despliegue completado con éxito.")
    except Exception as e:
        print(f"[FTP] [-] Error durante el despliegue: {e}", file=sys.stderr)
        sys.exit(2)
    finally:
        try:
            ftp.quit()
        except Exception:
            pass


if __name__ == "__main__":
    main()
