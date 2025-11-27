from pathlib import Path
path = Path('src/components/admin/AdminPanel.jsx')
text = path.read_text()
marker = '      {/* Modal para agregar y eliminar alumnos */}'
first = text.find(marker)
second = text.find(marker, first + 1)
if second == -1:
    raise SystemExit('second marker not found')
end = text.find('\n      <div className="flex-1 overflow-y-auto">', second)
if end == -1:
    raise SystemExit('div marker not found after second modal')
new_text = text[:second] + text[end+1:]
path.write_text(new_text)
