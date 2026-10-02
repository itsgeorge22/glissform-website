"""Check the deployable HTML and discovery files, without executing JavaScript."""
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import struct
import unittest
from urllib.parse import urlsplit, unquote
import xml.etree.ElementTree as ET

DIST = Path(__file__).resolve().parents[1] / 'dist'
URL = 'https://glissform.app/'


class Page(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.tags = []
        self.headings = []
        self.text = []
        self.current_heading = None
        self.in_script = False
        self.schema_text = ''
        self.in_schema = False
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.tags.append((tag, attrs))
        if tag in ('h1', 'h2', 'h3'):
            self.current_heading = [tag, '']
        if tag == 'script':
            self.in_script = True
            self.in_schema = attrs.get('type') == 'application/ld+json'

    def handle_endtag(self, tag):
        if self.current_heading and tag == self.current_heading[0]:
            self.headings.append(self.current_heading)
            self.current_heading = None
        if tag == 'script':
            self.in_script = self.in_schema = False

    def handle_data(self, data):
        if self.in_schema:
            self.schema_text += data
        if not self.in_script:
            self.text.append(data)
            if self.current_heading:
                self.current_heading[1] += data


class SeoBuildTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = (DIST / 'index.html').read_text()
        cls.page = Page(cls.html)
        cls.schema = json.loads(cls.page.schema_text)

    def test_product_and_faq_available_in_initial_html(self):
        self.assertNotIn('<div id="root"></div>', self.html)
        h1 = [text for tag, text in self.page.headings if tag == 'h1']
        self.assertEqual(h1, ['Beautifully Polished Everyday Mac Moments'])
        self.assertIn(['h2', 'Before You Try It'], self.page.headings)
        text = ''.join(self.page.text)
        for fact in ['Seamless Close', 'Battery Ripple', 'macOS 15 or later',
                     'compatible lid-angle sensor', 'Screen Recording access',
                     'MacBook Air M5 15-inch', 'other models are not yet verified',
                     'Normal system sleep stays enabled.', 'No continuous recording',
                     'Screen images stay in memory. They are never saved or sent.']:
            self.assertIn(fact, text)
        ids = {attrs['id'] for _, attrs in self.page.tags if 'id' in attrs}
        self.assertTrue({'customise', 'privacy', 'good-to-know'} <= ids)
        self.assertEqual(sum(attrs.get('type') == 'module' for tag, attrs in self.page.tags if tag == 'script'), 1)

    def test_canonical_and_social_metadata(self):
        self.assertLess(self.html.index('<meta charset='), 1024)
        canonicals = [attrs['href'] for tag, attrs in self.page.tags if tag == 'link' and attrs.get('rel') == 'canonical']
        self.assertEqual(canonicals, [URL])
        metadata = {}
        for tag, attrs in self.page.tags:
            if tag == 'meta' and ('name' in attrs or 'property' in attrs):
                key = attrs.get('property', attrs.get('name'))
                self.assertNotIn(key, metadata)
                metadata[key] = attrs['content']
        self.assertEqual(metadata['og:url'], URL)
        self.assertEqual(metadata['og:type'], 'website')
        self.assertEqual(metadata['og:description'], metadata['description'])
        self.assertEqual(metadata['twitter:description'], metadata['description'])
        self.assertEqual(metadata['twitter:title'], metadata['og:title'])
        self.assertEqual(re.search(r'<title>(.*?)</title>', self.html).group(1), metadata['og:title'])
        self.assertEqual(metadata['twitter:card'], 'summary_large_image')
        self.assertEqual(metadata['og:image'], URL + 'assets/glissform-social.png')
        self.assertEqual(metadata['twitter:image'], metadata['og:image'])
        png = (DIST / 'assets/glissform-social.png').read_bytes()
        self.assertEqual(png[:8], b'\x89PNG\r\n\x1a\n')
        self.assertEqual(struct.unpack('>II', png[16:24]), (1200, 630))

    def test_software_facts_and_download_stay_consistent(self):
        self.assertEqual(self.schema['@type'], 'SoftwareApplication')
        self.assertEqual(self.schema['name'], 'Glissform')
        self.assertEqual(self.schema['url'], URL)
        self.assertEqual(self.schema['operatingSystem'], 'macOS 15 or later')
        self.assertNotIn('aggregateRating', self.schema)
        self.assertNotIn('review', self.schema)
        self.assertNotIn('offers', self.schema)
        downloads = {attrs['href'] for tag, attrs in self.page.tags if tag == 'a' and attrs.get('href', '').startswith('/downloads/')}
        self.assertEqual(len(downloads), 1)
        download = downloads.pop()
        self.assertEqual(self.schema['downloadUrl'], URL.rstrip('/') + download)
        self.assertEqual(download, '/downloads/Glissform-' + self.schema['softwareVersion'] + '.dmg')

    def test_all_rendered_assets_exist(self):
        paths = []
        for _, attrs in self.page.tags:
            for key in ('src', 'href'):
                if attrs.get(key, '').startswith('/assets/'):
                    paths.append(attrs[key])
            paths.extend(item.strip().split()[0] for item in attrs.get('srcset', '').split(',') if item.strip())
        for css in (DIST / 'assets').glob('*.css'):
            paths.extend(re.findall(r'url\([\"\']?(/assets/[^)\"\']+)', css.read_text()))
        for path in paths:
            self.assertTrue((DIST / unquote(urlsplit(path).path).lstrip('/')).is_file(), path)
        for tag, attrs in self.page.tags:
            if tag == 'img':
                self.assertIn('alt', attrs)
                self.assertIn('width', attrs)
                self.assertIn('height', attrs)
        self.assertFalse((DIST / 'entry-server.js').exists())
        self.assertFalse((DIST.parent / '.prerender').exists())

    def test_loading_assets_are_available_without_javascript(self):
        self.assertIn('<style data-site-styles>', self.html)
        self.assertEqual(self.html.count('data:font/woff2;base64,'), 3)
        self.assertFalse(any(tag == 'link' and attrs.get('rel') == 'stylesheet'
                             for tag, attrs in self.page.tags))
        for tag, attrs in self.page.tags:
            if tag == 'img' and any(name in attrs.get('src', '') for name in
                                   ['seamless-settings', 'battery-settings', 'blur-high', 'blur-regular', 'blur-subtle']):
                self.assertIn('srcset', attrs)
                self.assertIn('sizes', attrs)
                self.assertGreaterEqual(len(attrs['srcset'].split(',')), 3)
                self.assertIn('480w', attrs['srcset'])

    def test_sitemap_and_robots(self):
        sitemap = ET.parse(DIST / 'sitemap.xml')
        locations = [node.text for node in sitemap.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
        self.assertEqual(locations, [URL])
        robots = (DIST / 'robots.txt').read_text()
        self.assertIn('User-agent: *', robots)
        self.assertIn('Allow: /', robots)
        self.assertIn('Sitemap: ' + URL + 'sitemap.xml', robots)


if __name__ == '__main__':
    unittest.main()
