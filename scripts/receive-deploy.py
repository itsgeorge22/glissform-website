#!/usr/bin/python3
"""Forced SSH receiver: accepts only website builds."""
import fcntl, json, os, pathlib, re, shutil, sys, tarfile, tempfile
match = re.fullmatch(r'deploy ([0-9a-f]{40})', os.environ.get('SSH_ORIGINAL_COMMAND', ''))
if not match:
    sys.exit('Only deploy <commit SHA> is accepted')
root = pathlib.Path('/var/www/glissform.app')
with open('/home/glissform-website-deploy/deploy.lock', 'w') as lock:
    fcntl.flock(lock, fcntl.LOCK_EX)
    with tempfile.TemporaryDirectory() as staging:
        stage = pathlib.Path(staging)
        with tarfile.open(fileobj=sys.stdin.buffer, mode='r|gz') as archive:
            total = 0
            for member in archive:
                name = pathlib.PurePosixPath(member.name)
                parts = name.parts
                if name.is_absolute() or '..' in parts or member.issym() or member.islnk():
                    sys.exit('Unsafe archive member')
                if not parts and member.isdir():
                    continue
                if not (parts == ('index.html',) or (parts and parts[0] == 'assets')) or not (member.isfile() or member.isdir()):
                    sys.exit('Unexpected archive member')
                total += member.size
                if total > 250_000_000:
                    sys.exit('Archive exceeds size limit')
                target = stage.joinpath(*parts)
                if member.isdir():
                    target.mkdir(parents=True, exist_ok=True)
                else:
                    target.parent.mkdir(parents=True, exist_ok=True)
                    with archive.extractfile(member) as src, open(target, 'wb') as dest:
                        shutil.copyfileobj(src, dest)
                    target.chmod(0o644)
        if not (stage / 'index.html').is_file() or not (stage / 'assets').is_dir():
            sys.exit('Missing website build')
        shutil.copytree(stage / 'assets', root / 'assets', dirs_exist_ok=True)
        shutil.copyfile(stage / 'index.html', root / 'index.html.new')
        (root / 'index.html.new').chmod(0o644)
        os.replace(root / 'index.html.new', root / 'index.html')
        marker = root / 'deployment.json.new'
        marker.write_text(json.dumps({'commit': match.group(1)}) + '\n')
        marker.chmod(0o644)
        os.replace(marker, root / 'deployment.json')
print('Published ' + match.group(1))
