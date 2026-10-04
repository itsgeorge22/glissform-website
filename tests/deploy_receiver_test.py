"""Verify the restricted receiver against new and legacy website archives."""
import importlib.util
import io
import json
from pathlib import Path
import tarfile
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('receiver', Path(__file__).resolve().parents[1] / 'scripts/receive-deploy.py')
receiver = importlib.util.module_from_spec(spec)
spec.loader.exec_module(receiver)


def archive(extra=(), discovery=True):
    stream = io.BytesIO()
    with tarfile.open(fileobj=stream, mode='w:gz') as tar:
        items = [('index.html', b'<main>Product</main>'), ('assets/new.js', b'console.log(1)')]
        if discovery:
            items += [('robots.txt', b'User-agent: *\nAllow: /'), ('sitemap.xml', b'<urlset/>')]
        for name, value in items:
            entry = tarfile.TarInfo('./' + name)
            entry.size = len(value)
            tar.addfile(entry, io.BytesIO(value))
        for entry in extra:
            tar.addfile(entry)
    stream.seek(0)
    return stream


class ReceiverTests(unittest.TestCase):
    def test_publish_discovery_before_html_preserves_releases_and_old_assets(self):
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory)
            stage, root = base / 'stage', base / 'root'
            stage.mkdir(); root.mkdir()
            for name in ('downloads', 'updates', 'assets'):
                (root / name).mkdir()
                (root / name / 'existing').write_text('preserve')
            receiver.extract_build(archive(), stage)
            original = receiver.os.replace
            order = []
            def record(source, destination):
                order.append(Path(destination).name)
                self.assertTrue((root / 'assets/new.js').is_file())
                return original(source, destination)
            with patch.object(receiver.os, 'replace', side_effect=record):
                receiver.publish_build(stage, root, 'a' * 40)
            self.assertEqual(order, ['robots.txt', 'sitemap.xml', 'index.html', 'deployment.json'])
            self.assertEqual(json.loads((root / 'deployment.json').read_text())['commit'], 'a' * 40)
            for name in ('downloads', 'updates', 'assets'):
                self.assertEqual((root / name / 'existing').read_text(), 'preserve')

    def test_hero_page_is_accepted_and_published(self):
        entries = [tarfile.TarInfo('hero-test.html'), tarfile.TarInfo('hero-test/index.html')]
        with tempfile.TemporaryDirectory() as directory:
            stage, root = Path(directory) / 'stage', Path(directory) / 'root'
            stage.mkdir(); root.mkdir()
            receiver.extract_build(archive(entries), stage)
            receiver.publish_build(stage, root, 'b' * 40)
            self.assertTrue((root / 'hero-test/index.html').is_file())
            self.assertTrue((root / 'hero-test.html').is_file())

    def test_legacy_build_still_accepted(self):
        with tempfile.TemporaryDirectory() as directory:
            receiver.extract_build(archive(discovery=False), Path(directory))

    def test_animation_page_is_accepted_and_published(self):
        entries = [tarfile.TarInfo('hero-test-animation.html'), tarfile.TarInfo('hero-test-animation/index.html')]
        with tempfile.TemporaryDirectory() as directory:
            stage, root = Path(directory) / 'stage', Path(directory) / 'root'
            stage.mkdir(); root.mkdir()
            receiver.extract_build(archive(entries), stage)
            receiver.publish_build(stage, root, 'c' * 40)
            self.assertTrue((root / 'hero-test-animation/index.html').is_file())
            self.assertTrue((root / 'hero-test-animation.html').is_file())

    def test_unsafe_and_unrelated_archive_members_rejected(self):
        for name in ('../index.html', '/index.html', 'assets/../escape', 'downloads/new.dmg',
                     'updates/appcast.xml', 'hero-test/other.html', 'hero-test/assets/bad.js',
                     'hero-test-animation/other.html', 'hero-test-animation/assets/bad.js',
                     'deployment.json', 'robots.txt/nested', 'assets'):
            with self.subTest(name=name), tempfile.TemporaryDirectory() as directory:
                with self.assertRaises(ValueError):
                    receiver.extract_build(archive([tarfile.TarInfo(name)]), Path(directory))
        for kind in (tarfile.SYMTYPE, tarfile.LNKTYPE):
            entry = tarfile.TarInfo('assets/linked')
            entry.type = kind
            entry.linkname = '/etc/passwd'
            with self.subTest(kind=kind), tempfile.TemporaryDirectory() as directory:
                with self.assertRaises(ValueError):
                    receiver.extract_build(archive([entry]), Path(directory))
        entry = tarfile.TarInfo('sitemap.xml')
        entry.type = tarfile.DIRTYPE
        with tempfile.TemporaryDirectory() as directory, self.assertRaises(ValueError):
            receiver.extract_build(archive([entry]), Path(directory))

    def test_archive_limit_checked_before_extracting(self):
        entry = tarfile.TarInfo('assets/huge')
        entry.size = 250_000_001
        # Only the header is needed: receiver rejects it before reading its body.
        import gzip
        stream = io.BytesIO(gzip.compress(entry.tobuf()))
        with tempfile.TemporaryDirectory() as directory, self.assertRaisesRegex(ValueError, 'size limit'):
            receiver.extract_build(stream, Path(directory))

    def test_missing_build_rejected(self):
        stream = io.BytesIO()
        with tarfile.open(fileobj=stream, mode='w:gz'):
            pass
        stream.seek(0)
        with tempfile.TemporaryDirectory() as directory, self.assertRaisesRegex(ValueError, 'Missing website'):
            receiver.extract_build(stream, Path(directory))


if __name__ == '__main__':
    unittest.main()
