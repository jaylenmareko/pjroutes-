"""
Operator Enrichment Script
Searches aviation directories (jetmembership.com, jetsreview.com) for each
Part 135 operator, extracts phone, website, email.
Run: python enrich_operators.py
Saves progress as it goes — safe to restart if interrupted.
"""

import csv, re, time, random
import requests
from bs4 import BeautifulSoup
from ddgs import DDGS

INPUT  = "tier1-operators.csv"
OUTPUT = "tier1-operators-enriched.csv"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36"
}

PHONE_RE = re.compile(r'(\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})')
EMAIL_RE = re.compile(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}')

SKIP_DOMAINS = {
    'google.com','facebook.com','linkedin.com','yelp.com','youtube.com',
    'instagram.com','twitter.com','faa.gov','wikipedia.org','indeed.com',
    'ziprecruiter.com','glassdoor.com','bbb.org','dnb.com','aircharteradvisors.com',
    'stratosjets.com','mercuryjets.com','paramountbusinessjets.com','charterx.com'
}

PRIORITY_DOMAINS = ['jetmembership.com', 'jetsreview.com', 'v-1x.com']


def slug(name: str) -> str:
    return name.lower().replace(',', '').replace('.', '').replace('  ', ' ').replace(' ', '-')


def try_jetmembership(name: str) -> dict:
    url = f"https://jetmembership.com/operators/{slug(name)}/"
    try:
        r = requests.get(url, headers=HEADERS, timeout=8)
        if r.status_code == 200 and 'Operator Details' in r.text:
            soup = BeautifulSoup(r.text, 'html.parser')
            text = soup.get_text(' ')
            phone = PHONE_RE.search(text)
            email = EMAIL_RE.search(text)
            # Find website link
            site = ''
            for a in soup.find_all('a', href=True):
                href = a['href']
                if href.startswith('http') and 'jetmembership' not in href:
                    site = href
                    break
            return {
                'phone': phone.group(1) if phone else '',
                'email': email.group(0) if email else '',
                'website': site,
                'source': 'jetmembership'
            }
    except Exception:
        pass
    return {}


def ddg_search(name: str, state: str) -> str | None:
    try:
        ddgs = DDGS()
        query = f'"{name}" {state} aviation charter phone'
        results = list(ddgs.text(query, max_results=5))
        for r in results:
            href = r.get('href', '')
            domain = href.split('/')[2].replace('www.', '') if '//' in href else ''
            # Prefer aviation directories
            for pd in PRIORITY_DOMAINS:
                if pd in domain:
                    return href
            # Accept any non-skip domain
            if domain and not any(s in domain for s in SKIP_DOMAINS):
                return href
    except Exception:
        pass
    return None


def scrape_page(url: str) -> dict:
    try:
        r = requests.get(url, headers=HEADERS, timeout=8)
        if r.status_code != 200:
            return {}
        soup = BeautifulSoup(r.text, 'html.parser')
        text = soup.get_text(' ')
        phone = PHONE_RE.search(text)
        email = EMAIL_RE.search(text)

        # Check if it's a jetmembership or jetsreview page
        source = 'web'
        for pd in PRIORITY_DOMAINS:
            if pd in url:
                source = pd
                break

        # Find operator website link if on a directory
        site = url
        if source != 'web':
            for a in soup.find_all('a', href=True):
                href = a['href']
                if href.startswith('http') and not any(pd in href for pd in PRIORITY_DOMAINS):
                    if not any(s in href for s in SKIP_DOMAINS):
                        site = href
                        break

        return {
            'phone': phone.group(1) if phone else '',
            'email': email.group(0) if email and 'noreply' not in email.group(0) else '',
            'website': site,
            'source': source
        }
    except Exception:
        return {}


def enrich(name: str, state: str) -> dict:
    # 1. Try jetmembership directly by slug
    result = try_jetmembership(name)
    if result.get('phone') or result.get('email') or result.get('website'):
        return result

    # 2. DDG search
    time.sleep(random.uniform(1, 2))
    url = ddg_search(name, state)
    if url:
        result = scrape_page(url)
        if result.get('phone') or result.get('website'):
            return result

    return {'phone': '', 'email': '', 'website': '', 'source': ''}


def load_done(path: str) -> set:
    done = set()
    try:
        with open(path, newline='', encoding='utf-8') as f:
            for row in csv.DictReader(f):
                done.add(row['Operator Name'])
    except FileNotFoundError:
        pass
    return done


def main():
    with open(INPUT, newline='', encoding='utf-8') as f:
        rows = list(csv.DictReader(f))

    # Add new columns
    new_cols = ['Website', 'Source']
    for r in rows:
        for c in new_cols:
            if c not in r:
                r[c] = ''

    fieldnames = list(rows[0].keys())
    if 'Website' not in fieldnames:
        fieldnames += new_cols

    done = load_done(OUTPUT)
    print(f"Total: {len(rows)} | Done: {len(done)} | Remaining: {len(rows)-len(done)}\n")

    to_do = [r for r in rows if r['Operator Name'] not in done]

    write_header = len(done) == 0
    with open(OUTPUT, 'a', newline='', encoding='utf-8') as out_f:
        writer = csv.DictWriter(out_f, fieldnames=fieldnames)
        if write_header:
            writer.writeheader()

        for i, row in enumerate(to_do, 1):
            name, state = row['Operator Name'], row['State']
            print(f"[{i}/{len(to_do)}] {name} ({state})", end=' ... ', flush=True)

            data = enrich(name, state)
            row['Phone']   = row.get('Phone') or data.get('phone', '')
            row['Email']   = row.get('Email') or data.get('email', '')
            row['Website'] = data.get('website', '')
            row['Source']  = data.get('source', '')

            tag = 'OK' if row['Phone'] or row['Email'] else '--'
            print(f"{tag} {row['Phone'] or 'no phone'} | {row['Email'] or 'no email'}")

            writer.writerow(row)
            out_f.flush()

            time.sleep(random.uniform(2, 4))

    print(f"\nDone. Results saved to {OUTPUT}")


if __name__ == '__main__':
    main()
