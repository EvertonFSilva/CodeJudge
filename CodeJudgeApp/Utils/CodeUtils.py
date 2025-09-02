import re
import os

def extractClassNameFromCode(code):
    match = re.search(r'class\s+([A-Za-z_]\w*)', code)
    if match:
        return match.group(1)
    return None

def deriveFileNameFromCode(code):
    className = extractClassNameFromCode(code)
    if className:
        return className + ".java"
    return "main.c"

def normalizeTemplateName(name):
    if not name:
        return ""
    base = os.path.basename(name)
    return base.lower().replace(' ', '_')
