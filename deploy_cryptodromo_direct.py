#!/usr/bin/env python3
"""
Direct SSH / SCP Deployer for Cryptodromo & RNGMarketDriven on Hostinger.
"""

import subprocess
import sys
import os

SSH_HOST = "195.35.41.12"
SSH_PORT = "65002"
SSH_USER = "u931528598"
REMOTE_PATH = "domains/cryptodromo.com/public_html"

def deploy():
    print(f"[SSH Deploy] Sincronizando Cryptodromo hacia {SSH_USER}@{SSH_HOST}...")

    # 1. Copiar index.html
    cmd_index = [
        "scp", "-P", SSH_PORT, "-o", "StrictHostKeyChecking=no",
        "/data/workspace/cryptodromo/index.html",
        f"{SSH_USER}@{SSH_HOST}:{REMOTE_PATH}/index.html"
    ]
    subprocess.run(cmd_index, check=True)

    # 2. Copiar profile.html
    cmd_profile = [
        "scp", "-P", SSH_PORT, "-o", "StrictHostKeyChecking=no",
        "/data/workspace/cryptodromo/profile.html",
        f"{SSH_USER}@{SSH_HOST}:{REMOTE_PATH}/profile.html"
    ]
    subprocess.run(cmd_profile, check=True)

    # 3. Crear profile/ y copiar index.html
    cmd_ssh = [
        "ssh", "-p", SSH_PORT, "-o", "StrictHostKeyChecking=no",
        f"{SSH_USER}@{SSH_HOST}",
        f"mkdir -p {REMOTE_PATH}/profile && cp {REMOTE_PATH}/profile.html {REMOTE_PATH}/profile/index.html"
    ]
    subprocess.run(cmd_ssh, check=True)

    print("[SSH Deploy] ¡Despliegue directo completado con éxito!")

if __name__ == "__main__":
    deploy()
