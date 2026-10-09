import os
import re

md_file = r"C:\Users\kkart\.gemini\antigravity\scratch\SmartRideTIET\docs\final_report\SmartRideTIET_Capstone_Project_Report.md"
html_file = r"C:\Users\kkart\.gemini\antigravity\scratch\SmartRideTIET\docs\final_report\SmartRideTIET_Capstone_Project_Report.html"

with open(md_file, "r", encoding="utf-8") as f:
    text = f.read()

# Replace pagebreak
text = text.replace(r"\pagebreak", "<div class='page-break'></div>")

# Simple HTML template with high-grade typography, KaTeX and Mermaid CDN
html_template = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SmartRideTIET - Capstone Project Report</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"
          onload="renderMathInElement(document.body);"></script>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600;700&family=Fira+Code:wght@400;500&display=swap');
    
    :root {
      --primary: #1e3a8a;
      --text: #1f2937;
      --bg: #ffffff;
      --border: #e5e7eb;
    }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: 'Crimson Pro', Georgia, serif;
      font-size: 18px;
      line-height: 1.65;
      color: var(--text);
      background: #f3f4f6;
    }
    
    .print-bar {
      position: sticky;
      top: 0;
      background: #1e3a8a;
      color: white;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      z-index: 1000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.15);
    }
    
    .btn-print {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    }
    .btn-print:hover { background: #2563eb; }
    
    .document-container {
      max-width: 900px;
      margin: 30px auto;
      background: white;
      padding: 60px 80px;
      box-shadow: 0 4px 25px rgba(0,0,0,0.08);
      border-radius: 4px;
    }
    
    h1, h2, h3, h4 {
      font-family: 'Inter', sans-serif;
      color: #0f172a;
      margin-top: 1.6em;
      margin-bottom: 0.6em;
      font-weight: 700;
      line-height: 1.3;
    }
    
    h1 { font-size: 2.1rem; border-bottom: 2px solid #1e3a8a; padding-bottom: 8px; margin-top: 2em; }
    h2 { font-size: 1.6rem; color: #1e3a8a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
    h3 { font-size: 1.25rem; color: #1e293b; }
    h4 { font-size: 1.1rem; color: #334155; }
    
    p { margin-bottom: 1.1em; text-align: justify; }
    
    ul, ol { margin-left: 28px; margin-bottom: 1.2em; }
    li { margin-bottom: 6px; }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5em 0;
      font-family: 'Inter', sans-serif;
      font-size: 14.5px;
    }
    
    th, td {
      border: 1px solid #cbd5e1;
      padding: 10px 14px;
      text-align: left;
    }
    
    th {
      background: #f1f5f9;
      font-weight: 600;
      color: #0f172a;
    }
    
    tr:nth-child(even) td { background: #f8fafc; }
    
    blockquote {
      border-left: 4px solid #3b82f6;
      padding: 10px 20px;
      background: #eff6ff;
      margin: 1.5em 0;
      font-style: italic;
    }
    
    code {
      font-family: 'Fira Code', monospace;
      font-size: 0.88em;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      color: #be185d;
    }
    
    pre code {
      display: block;
      padding: 16px;
      background: #0f172a;
      color: #f8fafc;
      overflow-x: auto;
      border-radius: 6px;
      line-height: 1.5;
    }
    
    .mermaid {
      margin: 2em 0;
      text-align: center;
      background: #f8fafc;
      padding: 20px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }
    
    .page-break {
      page-break-before: always;
      break-before: page;
      margin-top: 40px;
      border-top: 2px dashed #e2e8f0;
      padding-top: 20px;
    }
    
    @media print {
      body { background: white; font-size: 15pt; color: black; }
      .print-bar { display: none !important; }
      .document-container {
        margin: 0;
        padding: 0;
        box-shadow: none;
        max-width: 100%;
      }
      .page-break { border-top: none; }
      h1, h2 { page-break-after: avoid; }
      table, pre, .mermaid { page-break-inside: avoid; }
    }
  </style>
</head>
<body>

<div class="print-bar">
  <div><strong>SmartRideTIET</strong> — Academic Capstone Project Report</div>
  <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
</div>

<div class="document-container">
  <div id="content"></div>
</div>

<script>
  mermaid.initialize({ startOnLoad: false, theme: 'neutral' });
  const rawMarkdown = """ + repr(text) + """;
  
  // Custom marked options
  document.getElementById('content').innerHTML = marked.parse(rawMarkdown);
  
  // Render mermaid blocks
  document.querySelectorAll('pre code.language-mermaid').forEach((block) => {
    const parent = block.parentElement;
    const div = document.createElement('div');
    div.className = 'mermaid';
    div.textContent = block.textContent;
    parent.parentElement.replaceChild(div, parent);
  });
  
  mermaid.run();
</script>

</body>
</html>
"""

with open(html_file, "w", encoding="utf-8") as f:
    f.write(html_template)

print("HTML report successfully written to:", html_file)
