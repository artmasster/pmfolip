#!/usr/bin/env python3
"""Fetch the roster's Wikimedia Commons portraits; print an apply_patch data update.

Run from the project root. Requires requests and beautifulsoup4 for this optional research tool.
Only downloaded image bytes are written directly. Metadata changes are emitted as
an apply_patch patch so the operator can review and apply them with the edit tool.
"""
import argparse
import json
import pathlib
import re
import sys
from urllib.parse import unquote

import requests
from bs4 import BeautifulSoup

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA = ROOT / 'src/data/leaders.json'
AGENT = {'User-Agent': 'PMfolioResearch/1.0 (https://artmasster.github.io/pmfolip/; attributed public-history portraits)'}
INDEX = 'https://en.wikipedia.org/wiki/List_of_prime_ministers_of_Thailand'
API = 'https://commons.wikimedia.org/w/api.php'


def get(url, **kwargs):
    response = requests.get(url, headers=AGENT, timeout=45, **kwargs)
    response.raise_for_status()
    return response


def clean(value):
    return BeautifulSoup(value, 'html.parser').get_text(' ', strip=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--download', action='store_true', help='Download missing portraits; never overwrite files')
    args = parser.parse_args()
    before = DATA.read_text()
    data = json.loads(before)
    html = BeautifulSoup(get(INDEX).text, 'html.parser')
    files = {}
    for row in html.select('table.wikitable')[0].select('tr'):
        cells = row.find_all(['td', 'th'], recursive=False)
        if not cells or not re.fullmatch(r'\d+', cells[0].get_text(strip=True)) or not row.select('img'):
            continue
        ordinal = int(cells[0].get_text(strip=True))
        title = unquote(row.select('img')[0].parent['href'].split('/wiki/')[-1])
        files[ordinal] = title.replace('_', ' ')
    if len(files) != len(data['leaders']):
        raise RuntimeError('Roster size changed; inspect identities before downloading')
    # Existing files keep the exact Commons source used on the first import.
    # A later Wikipedia portrait change must not relabel already saved bytes.
    for leader in data['leaders']:
        credit = leader.get('portraitCredit')
        if credit:
            source_title = unquote(credit['url'].split('/wiki/')[-1]).replace('_', ' ')
            if not source_title.startswith('File:'):
                raise RuntimeError('Portrait source is not a Commons file page')
            files[leader['ordinal']] = source_title
    payload = get(API, params={'action': 'query', 'format': 'json', 'titles': '|'.join(files.values()),
        'prop': 'imageinfo', 'iiprop': 'url|extmetadata', 'iiurlwidth': 500}).json()
    pages = {page['title']: page for page in payload['query']['pages'].values()}
    (ROOT / 'public/portraits').mkdir(parents=True, exist_ok=True)
    for leader in data['leaders']:
        title = files[leader['ordinal']]
        info = pages[title]['imageinfo'][0]
        metadata = info['extmetadata']
        license_name = clean(metadata.get('LicenseShortName', {}).get('value', ''))
        if license_name not in ('Public domain', 'CC0', 'CC BY 2.0', 'CC BY 3.0', 'CC BY 4.0', 'CC BY-SA 3.0', 'CC BY-SA 4.0', 'GODL-India'):
            raise RuntimeError(f'Unreviewed license: {title}: {license_name}')
        author = clean(metadata.get('Artist', {}).get('value', ''))
        if leader['id'] == 'anand':
            author = 'Universitätsarchiv St.Gallen | Regina Kühne | HSGN 028/01026'
        if not author:
            raise RuntimeError(f'Missing author: {title}')
        author = author.replace('Unknown author Unknown author', 'Unknown author').replace('unkonwn', 'Unknown author')
        extension = pathlib.Path(title).suffix.lower()
        relative = '/portraits/' + leader['id'] + extension
        target = ROOT / 'public' / relative.lstrip('/')
        if args.download and not target.exists():
            image = get(info.get('thumburl', info['url']))
            if not image.headers.get('Content-Type', '').startswith('image/'):
                raise RuntimeError(f'Non-image response: {title}')
            with target.open('xb') as handle:
                handle.write(image.content)
        if not target.exists():
            raise RuntimeError(f'Run with --download first: {target}')
        leader['portrait'] = relative
        leader['portraitCredit'] = {'author': author, 'license': license_name, 'url': info['descriptionurl']}
        print(f"{leader['ordinal']:02d}: {leader['id']}: {license_name}", file=sys.stderr)
    after = json.dumps(data, ensure_ascii=False, indent=2) + '\n'
    print('*** Begin Patch')
    print('*** Update File: ' + str(DATA))
    print('@@')
    for line in before.splitlines():
        print('-' + line)
    for line in after.splitlines():
        print('+' + line)
    print('*** End Patch')


if __name__ == '__main__':
    main()
