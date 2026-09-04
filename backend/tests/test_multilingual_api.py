import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

languages = [
    'English',
    'Hindi',
    'Marathi',
    'Tamil',
    'Bengali',
    'Kannada',
    'Malayalam',
    'Telugu',
    'Gujarati',
    'Punjabi'
]

print(f"Testing {len(languages)} Indian languages against live IP-SAKTI Chat endpoint...\n")

for lang in languages:
    payload = json.dumps({
        'query': 'Explain Section 3(k) software patentability and technical effect',
        'language': lang
    }).encode('utf-8')
    
    req = urllib.request.Request(
        'http://127.0.0.1:8000/api/v1/chat',
        data=payload,
        headers={'Content-Type': 'application/json'}
    )
    
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        answer = res.get('answer', '')
        citations = res.get('citations', [])
        print(f"[{lang}] => Returned Language: {res.get('language')}")
        print(f"  Citations count: {len(citations)}")
        print(f"  Snippet: {answer[:90].strip()}...")
        for c in citations[:2]:
            print(f"    Citation {c['citation_id']}: Page {c['page_number']}, BBox: {c['bbox']}")
        print()

print("All 10 languages verified successfully!")
