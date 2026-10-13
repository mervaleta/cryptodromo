import paramiko
from pathlib import Path
host="195.35.41.12"; port=65002; user="u931528598"
key=paramiko.Ed25519Key.from_private_key_file("/data/.ssh/id_ed25519")
ssh=paramiko.SSHClient(); ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy()); ssh.connect(host,port=port,username=user,pkey=key,timeout=20)
sftp=ssh.open_sftp()
root="/home/u931528598/domains/rngmarketdriven.com/public_html"
for rel in ["index.html","casino/index.html"]:
    local=Path("/data/workspace")/rel
    remote=root+"/"+rel
    sftp.put(str(local),remote)
    print("uploaded",remote)
sftp.close(); ssh.close()
