"""Hosting contracts used by already-installed apps and existing links."""
from pathlib import Path
import unittest
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]

class PagesMigrationTests(unittest.TestCase):
    def test_signed_feed_is_copied_without_changes(self):
        self.assertEqual((ROOT / 'public/updates/appcast.xml').read_bytes(),
                         (ROOT / 'dist/updates/appcast.xml').read_bytes())

    def test_every_feed_download_has_a_versioned_release_redirect(self):
        redirects = {}
        for line in (ROOT / 'dist/_redirects').read_text().splitlines():
            if line and not line.startswith('#'):
                source, target, status = line.split()
                redirects[source] = (target, status)
        feed = ET.parse(ROOT / 'dist/updates/appcast.xml')
        for item in feed.findall('./channel/item'):
            version = item.find('{http://www.andymatuschak.org/xml-namespaces/sparkle}shortVersionString').text
            enclosure = item.find('enclosure')
            name = enclosure.attrib['url'].rsplit('/', 1)[1]
            for suffix in ('', '.sha256'):
                self.assertEqual(redirects['/downloads/' + name + suffix],
                    (f'https://github.com/itsgeorge22/glissform/releases/download/v{version}/{name}{suffix}', '302'))
