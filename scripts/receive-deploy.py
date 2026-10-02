#!/usr/bin/python3
"""Forced SSH receiver: accepts only website builds."""
import fcntl
import json
import os
import pathlib
import re
import shutil
import sys
import tarfile
import tempfile

ROOT_FILES = {'index.html', 'robots.txt', 'sitemap.xml'}


def extract_build(stream, stage):
    with tarfile.open(fileobj=stream, mode='r|gz') as archive:
        total = 0
        for member in archive:
            name = pathlib.PurePosixPath(member.name)
            parts = name.parts
            if name.is_absolute() or '..' in parts or member.issym() or member.islnk():
                raise ValueError('Unsafe archive member')
            if not parts and member.isdir():
                continue
            root_file = len(parts) == 1 and parts[0] in ROOT_FILES and member.isfile()
            asset = parts and parts[0] == 'assets' and (len(parts) > 1 or member.isdir())
            if not (root_file or asset) or not (member.isfile() or member.isdir()):
                raise ValueError('Unexpected archive member')
            total += member.size
            if total > 250_000_000:
                raise ValueError('Archive exceeds size limit')
            target = stage.joinpath(*parts)
            if member.isdir():
                target.mkdir(parents=True, exist_ok=True)
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                with archive.extractfile(member) as src, open(target, 'wb') as dest:
                    shutil.copyfileobj(src, dest)
                target.chmod(0o644)
    if not (stage / 'index.html').is_file() or not (stage / 'assets').is_dir():
        raise ValueError('Missing website build')


def publish_build(stage, root, commit):
    # Publish dependencies and discovery files before replacing the page.
    shutil.copytree(stage / 'assets', root / 'assets', dirs_exist_ok=True)
    for name in ('robots.txt', 'sitemap.xml', 'index.html'):
        if not (stage / name).is_file():
            continue
        temporary = root / (name + '.new')
        shutil.copyfile(stage / name, temporary)
        temporary.chmod(0o644)
        os.replace(temporary, root / name)
    marker = root / 'deployment.json.new'
    marker.write_text(json.dumps({'commit': commit}) + '\n')
    marker.chmod(0o644)
    os.replace(marker, root / 'deployment.json')


def main():
    match = re.fullmatch(r'deploy ([0-9a-f]{40})', os.environ.get('SSH_ORIGINAL_COMMAND', ''))
    if not match:
        sys.exit('Only deploy <commit SHA> is accepted')
    root = pathlib.Path('/var/www/glissform.app')
    with open('/home/glissform-website-deploy/deploy.lock', 'w') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        with tempfile.TemporaryDirectory() as staging:
            stage = pathlib.Path(staging)
            try:
                extract_build(sys.stdin.buffer, stage)
            except (ValueError, tarfile.TarError, OSError) as error:
                sys.exit(str(error))
            publish_build(stage, root, match.group(1))
    print('Published ' + match.group(1))


if __name__ == '__main__':
    main()
