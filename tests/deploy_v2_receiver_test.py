"""Keep v2 publication confined to its subdirectory."""
import importlib.util
import io
from pathlib import Path
import tarfile
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('v2_receiver', Path(__file__).resolve().parents[1] / 'scripts/receive-v2-deploy.py')
receiver = importlib.util.module_from_spec(spec)
spec.loader.exec_module(receiver)


def archive(extra=None):
    stream = io.BytesIO()
    with tarfile.open(fileobj=stream, mode='w:gz') as tar:
        for name, data in [('index.html', b'v2'), ('assets/new.js', b'v2 asset'), ('models/mac.glb', b'model')]:
            entry = tarfile.TarInfo(name)
            entry.size = len(data)
            tar.addfile(entry, io.BytesIO(data))
        if extra is not None:
            tar.addfile(extra)
    stream.seek(0)
    return stream


class V2ReceiverTests(unittest.TestCase):
    def test_v1_and_releases_are_untouched(self):
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory)
            root, stage = base / 'website', base / 'stage'
            root.mkdir(); stage.mkdir()
            originals = ['index.html', 'deployment.json', 'robots.txt', 'sitemap.xml',
                         'assets/v1.js', 'downloads/app.dmg', 'updates/appcast.xml']
            for name in originals:
                path = root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(b'preserve')
            receiver.extract_build(archive(), stage)
            receiver.publish_build(stage, root, 'a' * 40)
            for name in originals:
                self.assertEqual((root / name).read_bytes(), b'preserve')
            self.assertEqual((root / 'v2/index.html').read_bytes(), b'v2')
            self.assertTrue((root / 'v2/models/mac.glb').is_file())

    def test_unrelated_and_traversal_paths_are_rejected(self):
        for name in ('../index.html', '/index.html', 'assets/../escape', 'downloads/app.dmg',
                     'updates/appcast.xml', 'v2/index.html', 'robots.txt', 'deployment.json'):
            with self.subTest(name=name), tempfile.TemporaryDirectory() as directory:
                with self.assertRaises(ValueError):
                    receiver.extract_build(archive(tarfile.TarInfo(name)), Path(directory))
        for kind in (tarfile.SYMTYPE, tarfile.LNKTYPE):
            entry = tarfile.TarInfo('models/linked'); entry.type = kind; entry.linkname = '/etc/passwd'
            with self.subTest(kind=kind), tempfile.TemporaryDirectory() as directory:
                with self.assertRaises(ValueError):
                    receiver.extract_build(archive(entry), Path(directory))

    def test_symlink_target_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'v2').symlink_to(root, target_is_directory=True)
            with self.assertRaises(ValueError):
                receiver.publish_build(root, root, 'a' * 40)
