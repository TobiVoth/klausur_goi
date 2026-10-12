import os
import glob
import re
import sys
import json
import zipfile
import xml.etree.ElementTree as ET

sys.stdout = open('all_parsed_summary_v2.txt', 'w', encoding='utf-8')
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

def get_tc_text(tc):
    return ' '.join(''.join([t.text for t in p.findall('.//w:t', ns) if t.text]).strip() for p in tc.findall('.//w:p', ns)).strip()

def get_p_info(p):
    runs = []
    comment_ids = []
    for c in p.findall('.//w:commentReference', ns):
        cid = c.get(f'{{{ns["w"]}}}id')
        if cid: comment_ids.append(cid)
    for c in p.findall('.//w:commentRangeStart', ns):
        cid = c.get(f'{{{ns["w"]}}}id')
        if cid and cid not in comment_ids: comment_ids.append(cid)
            
    for r in p.findall('.//w:r', ns):
        b_elem = r.find('.//w:b', ns)
        is_bold = False
        if b_elem is not None:
            val = b_elem.get(f'{{{ns["w"]}}}val')
            if val not in ('0', 'false'):
                is_bold = True
        txt = ''.join([elem.text for elem in r.findall('.//w:t', ns) if elem.text])
        if txt:
            runs.append((txt, is_bold))
            
    full_text = ''.join(r[0] for r in runs).strip()
    any_bold = any(r[1] for r in runs if r[0].strip())
    all_bold = all(r[1] for r in runs if r[0].strip()) if any(r[0].strip() for r in runs) else False
    return {
        'text': full_text,
        'any_bold': any_bold,
        'all_bold': all_bold,
        'runs': runs,
        'comment_ids': comment_ids
    }

def load_docx(filepath):
    with zipfile.ZipFile(filepath) as z:
        tree = ET.fromstring(z.read('word/document.xml'))
        body = tree.find('.//w:body', ns)
        comments = {}
        if 'word/comments.xml' in z.namelist():
            c_tree = ET.fromstring(z.read('word/comments.xml'))
            for c in c_tree.findall('.//w:comment', ns):
                cid = c.get(f'{{{ns["w"]}}}id')
                ctxt = ''.join([elem.text for elem in c.findall('.//w:t', ns) if elem.text])
                comments[cid] = ctxt.strip()
    return tree, body, comments

def letters_to_indices(text):
    clean = re.sub(r'^(Richtige\s+Antwort(en)?|Richtige\s+Antworten|Richtig|Lösung|Antwort)\s*[:.]?\s*', '', text.strip(), flags=re.IGNORECASE)
    clean = re.split(r'(Begründung|Erklärung|–|-)', clean, flags=re.IGNORECASE)[0]
    letters = re.findall(r'\b([a-gA-G])\b', clean)
    res = []
    seen = set()
    for l in letters:
        idx = ord(l.upper()) - ord('A')
        if idx not in seen:
            seen.add(idx)
            res.append(idx)
    return sorted(res)

# 1. Cloud Computing
def parse_cloud(fp):
    tree, body, _ = load_docx(fp)
    qs = []
    cur = None
    for p in body.findall('.//w:p', ns):
        info = get_p_info(p)
        t = info['text']
        if not t: continue
        if re.match(r'^\d+\.\s+', t) and ('?' in t or info['any_bold']):
            if cur: qs.append(cur)
            cur = {'title': t, 'options': [], 'correctIndices': [], 'explanation': ''}
            continue
        if cur:
            if t.startswith('Begründung:'):
                cur['explanation'] = t[len('Begründung:'):].strip()
            elif re.match(r'^[A-Z]\)', t):
                corr = '✅' in t or '✔' in t
                clean = re.sub(r'^[A-Z]\)\s*', '', t).replace('✅', '').replace('❌', '').strip()
                idx = len(cur['options'])
                cur['options'].append(clean)
                if corr: cur['correctIndices'].append(idx)
    if cur: qs.append(cur)
    return 'Cloud Computing', qs

# 2. ITIL
def parse_itil(fp):
    tree, body, comments = load_docx(fp)
    all_p = [get_p_info(p) for p in body.findall('.//w:p', ns)]
    qs = []
    cur = None
    q_starters = ['ITIL ist eine Abkürzung', 'Welche Aussagen zu ITIL', 'Eins der bekanntesten Modelle',
                  'Welche Aussagen über die 34', 'ITIL bietet Zertifikate an', 'Wie werden plötzliche Störungen',
                  'Welche “C’s” existieren', 'Welche Arten von Changes', 'Welche Komponente ist Teil des ITIL',
                  'Welches sind Leitprinzipien', 'Welche Besonderheiten hat der Product', 'Was ist das Hauptziel',
                  'Was hat sich von ITIL 4', 'Welche Aussagen über die Historie', 'Welche Aussagen zum Change Advisory Board',
                  'BONUS: Was ist der Ablauf']
    for info in all_p:
        t = info['text']
        if not t or 'ITIL Fragenkatalog' in t: continue
        is_q = any(t.startswith(s) for s in q_starters)
        if is_q:
            if cur: qs.append(cur)
            cur = {'title': t, 'options': [], 'correctIndices': [], 'explanation_parts': []}
            continue
        if cur:
            idx = len(cur['options'])
            cur['options'].append(t)
            is_corr = False
            expl = ''
            for cid in info['comment_ids']:
                c = comments.get(cid, '')
                if c:
                    expl = c
                    clow = c.lower()
                    if any(pos in clow for pos in ['korrekt', 'richtig', 'alle so richtig', 'hier sind alle richtig', 'zertifikate für mitarbeiter', 'lernen aus vergangenen']):
                        if not clow.startswith('falsch') and not clow.startswith('hier als einziges falsch') and not 'er ist eben kein kreislauf' in clow and not 'kein hartes limit' in clow:
                            is_corr = True
            if 'Hier sind alle Richtig' in expl or 'Alle so richtig' in expl:
                is_corr = True
            if is_corr: cur['correctIndices'].append(idx)
            if expl: cur['explanation_parts'].append(f"{t}: {expl}")
            
    if cur: qs.append(cur)
    for q in qs:
        if 'vier Dimensionen Modell' in q['title']:
            q['correctIndices'] = [0, 1, 2, 3]
        if 'Leitprinzipien in ITIL' in q['title']:
            q['correctIndices'] = [0, 1, 2, 3]
        if 'Continual Improvement' in q['title'] and not q['correctIndices']:
            q['correctIndices'] = [1]
        if 'Zertifikate an' in q['title'] and not q['correctIndices']:
            q['correctIndices'] = [1]
        if 'Ablauf eines Incidents' in q['title']:
            q['explanation'] = "Reihenfolge: 1. Service Desk, 2. Incident, 3. Problem, 4. Change, 5. Deploy, 6. Improve"
            q['correctIndices'] = [3]
        else:
            q['explanation'] = " | ".join(q.pop('explanation_parts', []))
    return 'ITIL', qs

# 3. Besitz
def parse_besitz(fp):
    tree, body, _ = load_docx(fp)
    qs = []
    for tbl in body.findall('.//w:tbl', ns):
        rows = tbl.findall('.//w:tr', ns)
        if len(rows) < 5: continue
        row0 = [get_tc_text(c) for c in rows[0].findall('.//w:tc', ns)]
        if not any(re.match(r'FRAGE\s+\d+', c) for c in row0): continue
        title = ' '.join(get_tc_text(c) for c in rows[1].findall('.//w:tc', ns)).strip()
        why = get_tc_text(rows[2].findall('.//w:tc', ns)[0]) if len(rows) > 2 else ''
        q = {'title': title, 'options': [], 'correctIndices': [], 'explanation': why}
        expls = []
        for r in rows[4:]:
            cells = r.findall('.//w:tc', ns)
            if len(cells) < 4: continue
            opt = get_tc_text(cells[1])
            status = get_tc_text(cells[2]).lower()
            rat = get_tc_text(cells[3])
            idx = len(q['options'])
            q['options'].append(opt)
            if 'richtig' in status: q['correctIndices'].append(idx)
            if rat: expls.append(f"{opt}: {rat}")
        if expls: q['explanation'] = (q['explanation'] + " " + " ".join(expls)).strip()
        if len(q['options']) >= 2:
            qs.append(q)
    return 'Authentifizierung: Schwerpunkt Besitz', qs

# 4. Gesichtserkennung
def parse_gesicht(fp):
    tree, body, _ = load_docx(fp)
    qs = []
    children = list(body)
    cur_title = None
    for i, elem in enumerate(children):
        if elem.tag.endswith('p'):
            t = get_p_info(elem)['text']
            if re.match(r'^\d+\.\s+', t): cur_title = t
        elif elem.tag.endswith('tbl') and cur_title:
            opts = []
            corr = []
            for r in elem.findall('.//w:tr', ns):
                cells = r.findall('.//w:tc', ns)
                if len(cells) >= 2:
                    c0 = get_tc_text(cells[0])
                    c1 = get_tc_text(cells[1])
                    if c0.lower() == 'antwort' and c1.lower() == 'bewertung': continue
                    idx = len(opts)
                    opts.append(c0)
                    if c1.lower() == 'richtig': corr.append(idx)
            expl = ''
            for next_idx in range(i+1, min(len(children), i+5)):
                if children[next_idx].tag.endswith('p'):
                    nxt = get_p_info(children[next_idx])['text']
                    if nxt.startswith('Begründung:'):
                        expl = nxt[len('Begründung:'):].strip()
                        break
                    elif re.match(r'^\d+\.\s+', nxt): break
            qs.append({'title': cur_title, 'options': opts, 'correctIndices': corr, 'explanation': expl})
            cur_title = None
    return 'Authentifizierung: Gesichtserkennung', qs

# 5. IT Projektmanagement
def parse_it_pm(fp):
    tree, body, _ = load_docx(fp)
    qs = []
    cur = None
    for p in body.findall('.//w:p', ns):
        info = get_p_info(p)
        t = info['text']
        if not t or 'Korrekte Antworten sind fett gedruckt' in t: continue
        if re.match(r'^\d+\.\s+', t):
            if cur: qs.append(cur)
            cur = {'title': t, 'options': [], 'correctIndices': [], 'explanation': ''}
            continue
        if cur:
            if t.startswith('Begründung:'):
                cur['explanation'] = t[len('Begründung:'):].strip()
                qs.append(cur)
                cur = None
            else:
                idx = len(cur['options'])
                cur['options'].append(t)
                if info['all_bold'] or (info['any_bold'] and len(info['runs']) == 1):
                    cur['correctIndices'].append(idx)
    if cur: qs.append(cur)
    return 'IT-Projektmanagement', qs

# 6. KI Rechenzentren
def parse_ki_rechenzentren(fp):
    tree, body, _ = load_docx(fp)
    qs = []
    all_p = [get_p_info(p) for p in body.findall('.//w:p', ns)]
    i = 0
    while i < len(all_p):
        info = all_p[i]
        t = info['text']
        i += 1
        if not t or 'Fragenkatalog' in t or 'Colin' in t: continue
        
        m = re.match(r'^(\d+)\.\s+(.*)$', t)
        if m:
            parts = re.split(r'(?=[A-E]\))', t)
            title = parts[0].strip()
            opts = []
            sol_str = ''
            if len(parts) > 1:
                for part in parts[1:]:
                    if 'Lösung:' in part:
                        opt_part, sol_part = part.split('Lösung:', 1)
                        clean_opt = re.sub(r'^[A-E]\)\s*', '', opt_part).strip()
                        opts.append(clean_opt)
                        sol_str = sol_part.strip()
                    else:
                        clean_opt = re.sub(r'^[A-E]\)\s*', '', part).strip()
                        opts.append(clean_opt)
            else:
                while i < len(all_p):
                    p_next = all_p[i]
                    pt = p_next['text']
                    if pt.startswith('Lösung:'):
                        sol_str = pt[len('Lösung:'):].strip()
                        i += 1
                        break
                    elif re.match(r'^[A-E]\)', pt):
                        clean_opt = re.sub(r'^[A-E]\)\s*', '', pt).strip()
                        opts.append(clean_opt)
                        i += 1
                    else:
                        break
                        
            expl = ''
            if i < len(all_p) and all_p[i]['text'].startswith('Begründung:'):
                expl = all_p[i]['text'][len('Begründung:'):].strip()
                i += 1
                
            corr = letters_to_indices(sol_str)
            qs.append({
                'title': title,
                'options': opts,
                'correctIndices': corr,
                'explanation': expl
            })
    return 'KI-Rechenzentren', qs

# 7. Authentifizierung Spracherkennung
def parse_spracherkennung(fp):
    tree, body, _ = load_docx(fp)
    qs = []
    cur = None
    for p in body.findall('.//w:p', ns):
        info = get_p_info(p)
        t = info['text']
        if not t or 'Fragenkatalog' in t or 'Von Jan' in t: continue
        if t.startswith('Frage '):
            if cur: qs.append(cur)
            cur = {'title': t, 'options': [], 'correctIndices': [], 'explanation': ''}
            continue
        if cur:
            if t.startswith('Richtig:'):
                cur['correctIndices'] = letters_to_indices(t)
            elif t.startswith('Erklärung:'):
                cur['explanation'] = t[len('Erklärung:'):].strip()
            elif re.match(r'^[A-E]\)', t):
                cur['options'].append(re.sub(r'^[A-E]\)\s*', '', t).strip())
    if cur: qs.append(cur)
    return 'Authentifizierung: Spracherkennung', qs

# 8. Security Operations
def parse_security_operations(fp):
    tree, body, _ = load_docx(fp)
    qs = []
    all_text = "\n".join(get_p_info(p)['text'] for p in body.findall('.//w:p', ns) if get_p_info(p)['text'])
    tokens = re.split(r'(Frage\s+\d+[^:\n\r–-]*[–:-])', all_text)
    for k in range(1, len(tokens), 2):
        q_header = tokens[k].strip()
        q_body = tokens[k+1].strip()
        
        sol_m = re.search(r'(Richtige\s+Antworten:|Richtig:)(.*)', q_body, re.IGNORECASE)
        if sol_m:
            before_sol = q_body[:sol_m.start()].strip()
            after_sol = q_body[sol_m.start():].strip()
            
            expl_m = re.search(r'(Begründung\s*zur\s*Auswahl\s*der\s*Frage:|Begründung:)(.*)', after_sol, re.IGNORECASE | re.DOTALL)
            expl = ''
            if expl_m:
                sol_raw = after_sol[:expl_m.start()]
                expl = expl_m.group(2).strip()
            else:
                sol_raw = after_sol
                
            corr = letters_to_indices(sol_raw)
            # Split options by [A-E]\)
            opt_parts = re.split(r'(?=[A-E]\))', before_sol)
            q_title = f"{q_header} {opt_parts[0].strip()}"
            opts = [re.sub(r'^[A-E]\)\s*', '', op).strip() for op in opt_parts[1:] if op.strip()]
            
            qs.append({
                'title': q_title,
                'options': opts,
                'correctIndices': corr,
                'explanation': expl
            })
    return 'Security Operations', qs

# 9. Kryptologie
def parse_kryptologie(fp):
    tree, body, _ = load_docx(fp)
    qs = []
    cur = None
    all_p = [get_p_info(p) for p in body.findall('.//w:p', ns)]
    
    i = 0
    while i < len(all_p):
        t = all_p[i]['text']
        i += 1
        if not t or 'Fragen zur Präsentation' in t or 'Teil ' in t: continue
        if 'Lösungsschlüssel' in t:
            if cur: qs.append(cur)
            cur = None
            break
            
        if t.startswith('Frage ') and ('–' in t or '-' in t):
            if cur: qs.append(cur)
            header = t
            prompt_lines = []
            while i < len(all_p):
                pt = all_p[i]['text']
                if not pt:
                    i += 1; continue
                if pt in ['Mehrfachauswahl', 'Einfachauswahl', 'Mehrfach', 'Einfach']:
                    i += 1; continue
                if pt.startswith('•') or pt.startswith('Lösung:'):
                    break
                # If question 18..20: the actual prompt is short
                prompt_lines.append(pt)
                i += 1
                if '?' in pt or len(prompt_lines) >= 2:
                    break
            cur = {
                'title': f"{header}: {' '.join(prompt_lines)}".strip(),
                'options': [],
                'correctIndices': [],
                'explanation': ''
            }
            continue
            
        if cur:
            if t.startswith('Lösung:'):
                rest = t[len('Lösung:'):].strip()
                if '–' in rest or '-' in rest:
                    parts = re.split(r'[–-]', rest, maxsplit=1)
                    cur['correctIndices'] = letters_to_indices(parts[0])
                    cur['explanation'] = parts[1].strip()
                else:
                    cur['correctIndices'] = letters_to_indices(rest)
            elif t.startswith('•'):
                cur['options'].append(re.sub(r'^•\s*([A-E]\))?\s*', '', t).strip())
            elif not t.startswith('Frage ') and not t.startswith('Lösung'):
                # Regular paragraph option (for questions 18-20)
                cur['options'].append(t)
                
    if cur: qs.append(cur)
    return 'Kryptologie', qs

# 10. IT Governance
def parse_it_governance(fp):
    tree, body, _ = load_docx(fp)
    qs = []
    cur = None
    for p in body.findall('.//w:p', ns):
        info = get_p_info(p)
        t = info['text']
        if not t or 'IT-Governance –' in t: continue
        
        if t.startswith('Frage '):
            if cur: qs.append(cur)
            cur = {'title': t, 'options': [], 'correctIndices': [], 'explanation': ''}
            continue
            
        if cur:
            if any(t.startswith(prefix) for prefix in ['Richtige Antwort:', 'Richtige Antworten:', 'Richtige Antwort(en):']):
                cur['correctIndices'] = letters_to_indices(t)
            elif t.startswith('Begründung:'):
                cur['explanation'] = t[len('Begründung:'):].strip()
            elif cur['explanation']:
                cur['explanation'] += ' ' + t
            elif re.match(r'^[A-E]\)', t):
                parts = re.split(r'(?=[A-E]\))', t)
                for part in parts:
                    if part.strip():
                        cur['options'].append(re.sub(r'^[A-E]\)\s*', '', part).strip())
                        
    if cur: qs.append(cur)
    return 'IT-Governance', qs

# 11. Virtualisierung, Docker, Kubernetes
def parse_v_d_k(fp):
    tree, body, _ = load_docx(fp)
    qs = []
    cur = None
    for p in body.findall('.//w:p', ns):
        info = get_p_info(p)
        t = info['text']
        if not t or 'Fragen Michel' in t or 'Fragen Lars' in t or 'Fragen Lukas' in t: continue
        
        if t.startswith('Frage '):
            if cur: qs.append(cur)
            cur = {'title': t, 'options': [], 'correctIndices': [], 'explanation': ''}
            continue
            
        if cur:
            if t.startswith('Lösung:'):
                rest = t[len('Lösung:'):].strip()
                if '–' in rest or '-' in rest:
                    parts = re.split(r'[–-]', rest, maxsplit=1)
                    cur['correctIndices'] = letters_to_indices(parts[0])
                    cur['explanation'] = parts[1].strip()
                else:
                    cur['correctIndices'] = letters_to_indices(rest)
            else:
                clean_opt = re.sub(r'^[a-e]\)\s*', '', t).strip()
                cur['options'].append(clean_opt)
                
    if cur: qs.append(cur)
    return 'Virtualisierung, Docker & Kubernetes', qs

# 12. Neuronale Netze & Zahlenerkennung
def parse_neuronale_netze(fp):
    tree, body, _ = load_docx(fp)
    all_p = [get_p_info(p) for p in body.findall('.//w:p', ns)]
    qs = []
    i = 0
    while i < len(all_p):
        t = all_p[i]['text']
        if not t or 'Fragen und Antworten' in t:
            i += 1; continue
        if '?' in t or any(t.startswith(w) for w in ['Welche', 'Was', 'In welche', 'Welchem']):
            title = t
            i += 1
            opts = []
            corr = []
            while i < len(all_p):
                opt_info = all_p[i]
                opt_t = opt_info['text']
                if not opt_t:
                    i += 1; continue
                if '?' in opt_t or any(opt_t.startswith(w) for w in ['Welche', 'Was', 'In welche', 'Welchem']):
                    break
                peek_next_is_q = (i + 1 == len(all_p)) or ('?' in all_p[i+1]['text'] or any(all_p[i+1]['text'].startswith(w) for w in ['Welche', 'Was', 'In welche', 'Welchem']))
                if peek_next_is_q and len(opts) >= 2:
                    expl = opt_t
                    i += 1
                    qs.append({'title': title, 'options': opts, 'correctIndices': corr, 'explanation': expl})
                    break
                else:
                    idx = len(opts)
                    opts.append(opt_t)
                    if opt_info['all_bold'] or opt_info['any_bold']:
                        corr.append(idx)
                    i += 1
        else:
            i += 1
    return 'Neuronale Netze & Zahlenerkennung', qs

# 13. Quizfragen RPA
def parse_rpa(fp):
    tree, body, _ = load_docx(fp)
    qs = []
    cur = None
    for p in body.findall('.//w:p', ns):
        info = get_p_info(p)
        t = info['text']
        if not t or 'Quizfragen' in t: continue
        if t.startswith('Frage '):
            if cur: qs.append(cur)
            cur = {'title': t, 'options': [], 'correctIndices': [], 'explanation': ''}
            continue
        if cur:
            m = re.match(r'^([A-E,\sund]+)[–-](.*)$', t)
            if m and ('korrekt' in m.group(2) or 'richtig' in m.group(2)):
                cur['correctIndices'] = letters_to_indices(m.group(1))
                cur['explanation'] = m.group(2).strip()
            else:
                cur['options'].append(t)
    if cur: qs.append(cur)
    return 'Robotic Process Automation (RPA)', qs

# 14. Reinforcement Learning Quiz
def parse_rl(fp):
    tree, body, _ = load_docx(fp)
    qs = []
    cur = None
    for p in body.findall('.//w:p', ns):
        info = get_p_info(p)
        t = info['text']
        if not t: continue
        if '?' in t:
            if cur: qs.append(cur)
            cur = {'title': t, 'options': [], 'correctIndices': [], 'explanation': ''}
            continue
        if cur:
            if t.startswith('Antwort:'):
                cur['correctIndices'] = letters_to_indices(t)
            elif t.startswith('Begründung:'):
                cur['explanation'] = t[len('Begründung:'):].strip()
            else:
                cur['options'].append(t)
    if cur: qs.append(cur)
    return 'Reinforcement Learning', qs

# 15. Social Engineering
def parse_social_engineering(fp):
    tree, body, _ = load_docx(fp)
    all_p = [get_p_info(p)['text'] for p in body.findall('.//w:p', ns) if get_p_info(p)['text']]
    questions_map = {}
    cur_q_num = None
    cur_q = None
    mode = 'tasks'
    for t in all_p:
        if 'Lösungs- und Begründungsteil' in t:
            if cur_q and cur_q_num is not None:
                questions_map[cur_q_num] = cur_q
            mode = 'solutions'
            continue
        if mode == 'tasks':
            m = re.match(r'^Frage\s+(\d+)$', t)
            if m:
                if cur_q and cur_q_num is not None:
                    questions_map[cur_q_num] = cur_q
                cur_q_num = int(m.group(1))
                cur_q = {'title': '', 'options': [], 'correctIndices': [], 'explanation': ''}
                continue
            if cur_q:
                if not cur_q['title']:
                    cur_q['title'] = t
                elif re.match(r'^[A-E]\)', t):
                    cur_q['options'].append(re.sub(r'^[A-E]\)\s*', '', t).strip())
        elif mode == 'solutions':
            m = re.match(r'^Lösung zu Frage\s+(\d+)$', t)
            if m:
                cur_q_num = int(m.group(1))
                continue
            if cur_q_num in questions_map:
                if any(t.startswith(prefix) for prefix in ['Richtige Antworten:', 'Richtige Antwort:', 'Richtige Antwort(en):']):
                    questions_map[cur_q_num]['correctIndices'] = letters_to_indices(t)
                elif t.startswith('Begründung:'):
                    pass
                else:
                    if questions_map[cur_q_num]['explanation']:
                        questions_map[cur_q_num]['explanation'] += ' ' + t
                    else:
                        questions_map[cur_q_num]['explanation'] = t
                        
    qs = [questions_map[k] for k in sorted(questions_map.keys())]
    return 'Social Engineering', qs

parsers = [
    (parse_cloud, 'Fragen/Fragen - Cloud Computing.docx'),
    (parse_itil, 'Fragen/Fragen ITIL.docx'),
    (parse_besitz, 'Fragen/Fragen und Antworten Authentifizierung Schwerpunkt Besitz.docx'),
    (parse_gesicht, 'Fragen/Fragen_Antworten_Gesichtserkennung.docx'),
    (parse_it_pm, 'Fragen/Fragen_IT_Projektmanagement.docx'),
    (parse_ki_rechenzentren, 'Fragen/Fragenkatalog KI-Rechenzentren.docx'),
    (parse_spracherkennung, 'Fragen/Fragenkatalog – Authentifizierung_Spracherkennung.docx'),
    (parse_security_operations, 'Fragen/Gruppe 4_Fragen_Security_Operations.docx'),
    (parse_kryptologie, 'Fragen/Gruppe_3_Kryptologie_Fragen.docx'),
    (parse_it_governance, 'Fragen/IT-Governance Fragen_FabianBrick_DavidOyaifo.docx'),
    (parse_v_d_k, 'Fragen/Klausurfragen Gruppe 11 - Michel Lünnemann, Lars Hagemann, Lukas Plescher - Virtualisierung, Docker, Kubernetes.docx'),
    (parse_neuronale_netze, 'Fragen/NeuronaleNetze_Zahlenerkennung_Fragen.docx'),
    (parse_rpa, 'Fragen/Quizfragen RPA.docx'),
    (parse_rl, 'Fragen/Reinforcement_Learning_Quiz.docx'),
    (parse_social_engineering, 'Fragen/Social_Engineering_Fragenkatalog_neu.docx'),
]

all_extracted = []
total_count = 0
total_bad = 0

print("=== STARTING PARSER V2 ===")
q_id_counter = 1
for parse_fn, fp in parsers:
    try:
        topic, qs = parse_fn(fp)
        bad_in_topic = 0
        for i, q in enumerate(qs):
            q['id'] = f"q_{q_id_counter}"
            q_id_counter += 1
            q['topic'] = topic
            q['sourceFile'] = os.path.basename(fp)
            is_bad = len(q['options']) < 2 or len(q['correctIndices']) == 0
            if is_bad:
                bad_in_topic += 1
                total_bad += 1
                print(f"⚠️ [{topic}] Q{i+1}: BAD! opts={len(q['options'])}, corr={q['correctIndices']} | {q['title'][:80]}")
            all_extracted.append(q)
            
        total_count += len(qs)
        status = "✅ OK" if bad_in_topic == 0 else f"⚠️ {bad_in_topic} issues"
        print(f"File: {os.path.basename(fp)} -> Topic: {topic} | Count: {len(qs)} | Status: {status}")
    except Exception as e:
        print(f"❌ ERROR in {fp}: {e}")
        import traceback
        traceback.print_exc()

print(f"\n==========================================")
print(f"TOTAL QUESTIONS EXTRACTED: {total_count}")
print(f"TOTAL BAD QUESTIONS: {total_bad}")
print(f"==========================================")

with open('all_questions.json', 'w', encoding='utf-8') as f:
    json.dump(all_extracted, f, ensure_ascii=False, indent=2)
print("Saved all_questions.json successfully!")
