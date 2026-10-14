"""Small, offline checks for a built v2 candidate; no copy/layout assertions."""
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import unittest
from urllib.parse import unquote, urljoin, urlsplit

DEPLOY_V2 = os.environ.get('DEPLOY_V2') == '1'
BASE = '/v2/' if DEPLOY_V2 else '/'
DIST = Path(__file__).resolve().parents[1] / ('dist-v2' if DEPLOY_V2 else 'dist')


class BuildPage(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.tags = []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))


class DeploymentBuildTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = (DIST / 'index.html').read_text()
        cls.page = BuildPage(cls.html)

    def assert_asset_exists(self, url, source=BASE + 'index.html'):
        if not url or url.startswith('#') or urlsplit(url).scheme or url.startswith('//'):
            return
        path = unquote(urlsplit(urljoin(source, url)).path)
        self.assertTrue(path.startswith(BASE), f'Asset escapes deployment path: {url} in {source}')
        path = path[len(BASE):]
        self.assertTrue((DIST / path).is_file(), f'Missing asset: {url} referenced by {source}')

    def test_referenced_assets_exist(self):
        for tag, attrs in self.page.tags:
            if tag == 'meta' and attrs.get('property') == 'og:image':
                image_path = urlsplit(attrs.get('content', '')).path
                self.assert_asset_exists(image_path if DEPLOY_V2 else image_path.removeprefix('/v2'))
            if tag in ('script', 'img', 'source', 'video', 'audio', 'iframe'):
                self.assert_asset_exists(attrs.get('src'))
                self.assert_asset_exists(attrs.get('poster'))
            if tag == 'link' and attrs.get('rel') in ('stylesheet', 'icon', 'preload', 'modulepreload'):
                self.assert_asset_exists(attrs.get('href'))
            if tag == 'astro-island':
                for key in ('component-url', 'renderer-url', 'before-hydration-url'):
                    self.assert_asset_exists(attrs.get(key))
            srcset = attrs.get('srcset', '')
            if srcset and not srcset.startswith('data:'):
                for candidate in srcset.split(','):
                    self.assert_asset_exists(candidate.strip().split()[0])
        for css in (DIST / 'assets').rglob('*.css'):
            for url in re.findall(r'url\(\s*[\"\']?([^\)\"\']+)', css.read_text()):
                self.assert_asset_exists(url.strip(), BASE + css.relative_to(DIST).as_posix())
        # Include literal local imports/assets referenced by hydrated chunks.
        for script in (DIST / 'assets').rglob('*.js'):
            for url in re.findall(r'''["']((?:/(?:v2/)?(?:assets|models)/|\./|\.\./)[^"'\s\\]+\.(?:js|css|svg|webp|png|jpg|woff2?|ttf|glb))["']''', script.read_text()):
                self.assert_asset_exists(url, BASE + script.relative_to(DIST).as_posix())

    def test_section_links_have_targets(self):
        ids = {attrs['id'] for _, attrs in self.page.tags if 'id' in attrs}
        for tag, attrs in self.page.tags:
            href = attrs.get('href', '')
            if tag == 'a' and href.startswith('#') and len(href) > 1:
                self.assertIn(unquote(href[1:]), ids, f'Broken section link: {href}')

    def test_download_links_match_release_metadata(self):
        schemas = [json.loads(text) for text in re.findall(
            r'<script\b[^>]*type=[\"\']application/ld\+json[\"\'][^>]*>(.*?)</script>', self.html, re.S)]
        app = next((schema for schema in schemas if schema.get('@type') == 'SoftwareApplication'), None)
        self.assertIsNotNone(app, 'Missing app release metadata')
        expected = f'https://glissform.app/downloads/Glissform-{app["softwareVersion"]}.dmg'
        self.assertEqual(app.get('downloadUrl'), expected)
        downloads = [attrs.get('href') for tag, attrs in self.page.tags if tag == 'a' and
                     ('download-link' in attrs.get('class', '').split() or urlsplit(attrs.get('href', '')).path.endswith('.dmg'))]
        self.assertTrue(downloads, 'No app download links')
        for href in downloads:
            self.assertEqual(href, expected, f'Incorrect download destination: {href}')

    def test_v2_stays_excluded_from_indexing(self):
        directives = set()
        for tag, attrs in self.page.tags:
            if tag == 'meta' and attrs.get('name', '').lower() == 'robots':
                directives.update(value.strip().lower() for value in attrs.get('content', '').split(','))
        self.assertTrue({'noindex', 'nofollow'} <= directives, 'V2 must retain noindex, nofollow')
        self.assertFalse({'index', 'follow', 'all'} & directives, 'Conflicting indexing directives')


if __name__ == '__main__':
    unittest.main()
