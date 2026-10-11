"""Verify the isolated Astro candidate's generated, usable first response."""
from pathlib import Path
import json
import unittest
from urllib.parse import urlsplit, unquote
from seo_test import Page

DIST = Path(__file__).resolve().parents[1] / 'dist'

class HomeNextTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = (DIST / 'index.html').read_text()
        cls.page = Page(cls.html)

    def test_semantic_content_is_available_before_hydration(self):
        self.assertEqual([text for tag, text in self.page.headings if tag == 'h1'],
                         ['A little more room, please.', 'Your Lid Moves.Desktop Stays In Place'])
        self.assertEqual(sum(tag == 'main' for tag, attrs in self.page.tags), 1)
        text = ''.join(self.page.text)
        self.assertIn('Your Lid Moves.', text)
        self.assertIn('Perspective, blur and shadow follow the lid as it closes.', text)
        self.assertNotIn('Before You Try It', text)
        self.assertNotIn('A little magic.', text)
        self.assertNotIn('Scroll back to reopen', text)
        self.assertEqual([text for tag, text in self.page.headings if tag == 'h2'], ['Satisfying even when it’s time to close'])
        self.assertIn('hero-animation__character', self.html)
        self.assertIn('aria-label="Satisfying even when it’s time to close"', self.html)
        for removed in ['hero-animation__replay', 'hero-animation__eyebrow', 'hero-animation__gesture', 'hero-animation__annotation']:
            self.assertNotIn(removed, self.html)
        self.assertNotIn('hero-animation__halo', self.html)
        self.assertIn('hero-animation__continuation', self.html)
        self.assertEqual(sum(tag == 'section' for tag, attrs in self.page.tags), 1)

    def test_navigation_targets_exist_and_downloads_stay_production_urls(self):
        links = {attrs.get('href') for tag, attrs in self.page.tags if tag == 'a'}
        for name in ['customise', 'privacy', 'good-to-know']:
            self.assertIn('https://glissform.app/#' + name, links)
        downloads = [attrs['href'] for tag, attrs in self.page.tags
                     if tag == 'a' and attrs.get('href', '').endswith('.dmg')]
        self.assertEqual(len(downloads), 3)
        self.assertTrue(all(url.startswith('https://glissform.app/downloads/') for url in downloads))
        docks = [attrs for tag, attrs in self.page.tags if tag == 'div' and attrs.get('class') == 'hero-animation__navigation']
        self.assertEqual(len(docks), 1)
        self.assertEqual(docks[0].get('aria-hidden'), 'true')
        self.assertIn('inert', docks[0])

    def test_static_sections_do_not_hydrate_as_one_application(self):
        islands = [attrs for tag, attrs in self.page.tags if tag == 'astro-island']
        self.assertEqual(len(islands), 1)
        self.assertEqual(sorted(attrs['client'] for attrs in islands), ['load'])
        self.assertNotIn('src/App.tsx', self.html)

    def test_local_candidate_cannot_be_indexed(self):
        robots = [attrs['content'] for tag, attrs in self.page.tags
                  if tag == 'meta' and attrs.get('name') == 'robots']
        self.assertEqual(robots, ['noindex, nofollow'])
        theme = [attrs['content'] for tag, attrs in self.page.tags
                 if tag == 'meta' and attrs.get('name') == 'theme-color']
        self.assertEqual(theme, ['#ffffff'])
        workflow = (DIST.parent / '.github/workflows/deploy.yml').read_text()
        self.assertIn("if: github.ref == 'refs/heads/main'", workflow)

    def test_metadata_is_accurate(self):
        schema = json.loads(self.page.schema_text)
        self.assertEqual(schema['name'], 'Glissform')
        self.assertIs(schema['isAccessibleForFree'], True)
        self.assertEqual(schema['url'], 'https://glissform.app/')
        self.assertEqual(schema['softwareVersion'], '0.1.0-beta.6')

    def test_local_styles_scripts_and_images_resolve(self):
        for tag, attrs in self.page.tags:
            names = ['src'] if tag in ['script', 'img'] else ['href'] if tag == 'link' else []
            if tag == 'astro-island':
                names = ['component-url', 'renderer-url', 'before-hydration-url']
            for name in names:
                url = attrs.get(name, '')
                if not url.startswith('/') or url.startswith('//'):
                    continue
                path = DIST / unquote(urlsplit(url).path).lstrip('/')
                self.assertTrue(path.is_file(), f'Missing generated asset: {url}')
        css = ''.join(path.read_text() for path in (DIST / 'assets').glob('*.css'))
        self.assertIn('hero-animation__surface', css)
        self.assertIn('prefers-reduced-motion', css)

if __name__ == '__main__':
    unittest.main()
