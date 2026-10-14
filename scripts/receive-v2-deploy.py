#!/usr/bin/env python3
"""Receive only a v2 build; the publication target cannot be supplied by callers."""
import fcntl
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import sys
import tarfile
import tempfile

WEBSITE_ROOT = Path('/var/www/glissform.app')


def extract_build(stream, stage):
    with tarfile.open(fileobj=stream, mode='r|gz') as archive:
        total = 0
        for member in archive:
            name = PurePosixPath(member.name)
            parts = name.parts
            if name.is_absolute() or '..' in parts or member.issym() or member.islnk():
                raise ValueError('Unsafe archive member')
            if not parts and member.isdir():
                continue
            page = parts == ('index.html',) and member.isfile()
            asset = parts and parts[0] in ('assets', 'models') and (len(parts) > 1 or member.isdir())
            if not (page or asset) or not (member.isfile() or member.isdir()):
                raise ValueError('Unexpected archive member')
            total += member.size
            if total > 250_000_000:
                raise ValueError('Archive exceeds size limit')
            target = stage.joinpath(*parts)
            if member.isdir():
                target.mkdir(parents=True, exist_ok=True)
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                with archive.extractfile(member) as source, target.open('wb') as output:
                    shutil.copyfileobj(source, output)
                target.chmod(0o644)
    if not (stage / 'index.html').is_file() or not (stage / 'assets').is_dir() or not (stage / 'models').is_dir():
        raise ValueError('Missing v2 build')


def publish_build(stage, website_root, commit):
    root = website_root / 'v2'
    if root.is_symlink():
        raise ValueError('V2 target must not be a symlink')
    root.mkdir(parents=True, exist_ok=True)
    # Keep prior hashed assets available to open tabs; replace HTML only after its dependencies.
    for directory in ('assets', 'models'):
        shutil.copytree(stage / directory, root / directory, dirs_exist_ok=True)
    temporary = root / 'index.html.new'
    shutil.copyfile(stage / 'index.html', temporary)
    temporary.chmod(0o644)
    os.replace(temporary, root / 'index.html')
    marker = root / 'deployment.json.new'
    marker.write_text(json.dumps({'commit': commit, 'path': '/v2/'}) + '\n')
    marker.chmod(0o644)
    os.replace(marker, root / 'deployment.json')


def main():
    if len(sys.argv) != 2 or not re.fullmatch(r'[0-9a-f]{40}', sys.argv[1]):
        sys.exit('Expected a full commit SHA')
    with open('/var/lock/glissform-v2-deploy.lock', 'w') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        with tempfile.TemporaryDirectory() as staging:
            stage = Path(staging)
            extract_build(sys.stdin.buffer, stage)
            publish_build(stage, WEBSITE_ROOT, sys.argv[1])
    print('Published /v2/ at ' + sys.argv[1])


if __name__ == '__main__':
    main()
