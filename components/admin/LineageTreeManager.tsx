'use client'
import { useState, useEffect, useCallback } from 'react'
import { GitBranch, Plus, Trash2, ChevronDown, ChevronLeft, Loader2, X, Check, Pencil } from 'lucide-react'

interface LineageNode {
  id: string
  name: string
  parent_id: string | null
  generation: number
  notes?: string
}

interface TreeNode extends LineageNode {
  children: TreeNode[]
}

function buildTree(nodes: LineageNode[]): TreeNode[] {
  const map = new Map<string, TreeNode>()
  nodes.forEach(n => map.set(n.id, { ...n, children: [] }))
  const roots: TreeNode[] = []
  nodes.forEach(n => {
    if (n.parent_id && map.has(n.parent_id)) {
      map.get(n.parent_id)!.children.push(map.get(n.id)!)
    } else if (!n.parent_id) {
      roots.push(map.get(n.id)!)
    }
  })
  return roots
}

function NodeRow({
  node,
  depth,
  onAddChild,
  onDelete,
  onEdit,
}: {
  node: TreeNode
  depth: number
  onAddChild: (parentId: string, parentName: string) => void
  onDelete: (id: string, name: string) => void
  onEdit: (id: string, name: string) => Promise<boolean>
}) {
  const [expanded, setExpanded] = useState(depth < 2)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(node.name)
  const [savingEdit, setSavingEdit] = useState(false)
  const hasChildren = node.children.length > 0

  const startEdit = () => { setEditName(node.name); setEditing(true) }
  const cancelEdit = () => { setEditing(false); setEditName(node.name) }
  const saveEdit = async () => {
    if (!editName.trim()) return
    setSavingEdit(true)
    const ok = await onEdit(node.id, editName.trim())
    setSavingEdit(false)
    if (ok) setEditing(false)
  }

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-slate-50 group transition-colors`}
        style={{ paddingRight: `${12 + depth * 20}px` }}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className={`w-5 h-5 flex items-center justify-center text-slate-400 flex-shrink-0 ${!hasChildren && 'invisible'}`}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
          <div className={`w-2 h-2 rounded-full ${depth === 0 ? 'bg-indigo-500' : depth === 1 ? 'bg-blue-400' : 'bg-slate-300'}`} />
        </div>

        {editing ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') saveEdit()
                if (e.key === 'Escape') cancelEdit()
              }}
              className="flex-1 rounded-lg border border-indigo-300 px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              onClick={saveEdit}
              disabled={savingEdit}
              className="p-1 rounded text-green-600 hover:bg-green-50"
              title="שמור"
            >
              {savingEdit ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            </button>
            <button onClick={cancelEdit} className="p-1 rounded text-slate-400 hover:bg-slate-100" title="ביטול">
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <span className="flex-1 text-sm text-slate-800 font-medium">{node.name}</span>
            <span className="text-xs text-slate-400 ml-2">דור {node.generation}</span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={startEdit}
                className="p-1 rounded text-slate-500 hover:bg-slate-100"
                title="ערוך שם"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => onAddChild(node.id, node.name)}
                className="p-1 rounded text-indigo-600 hover:bg-indigo-50"
                title="הוסף צאצא"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={() => onDelete(node.id, node.name)}
                className="p-1 rounded text-red-500 hover:bg-red-50"
                title="מחק"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </>
        )}
      </div>

      {expanded && hasChildren && (
        <div>
          {node.children.map(child => (
            <NodeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              onAddChild={onAddChild}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function LineageTreeManager() {
  const [nodes, setNodes] = useState<LineageNode[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formParentId, setFormParentId] = useState<string | null>(null)
  const [formParentName, setFormParentName] = useState('')
  const [formName, setFormName] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadNodes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/lineage')
      const data = await res.json()
      setNodes(data.nodes ?? [])
    } catch {
      setError('שגיאה בטעינת הנתונים')
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadNodes() }, [loadNodes])

  const openAddChild = (parentId: string, parentName: string) => {
    setFormParentId(parentId)
    setFormParentName(parentName)
    setFormName('')
    setFormNotes('')
    setShowForm(true)
    setError('')
  }

  const openAddRoot = () => {
    setFormParentId(null)
    setFormParentName('')
    setFormName('')
    setFormNotes('')
    setShowForm(true)
    setError('')
  }

  const handleSave = async () => {
    if (!formName.trim()) { setError('שם חובה'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/lineage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName, parent_id: formParentId, notes: formNotes }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'שגיאה'); return }
      setShowForm(false)
      await loadNodes()
    } catch {
      setError('שגיאת רשת')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`למחוק את "${name}" וכל צאצאיו?`)) return
    try {
      await fetch(`/api/admin/lineage?id=${id}`, { method: 'DELETE' })
      await loadNodes()
    } catch {
      alert('שגיאה במחיקה')
    }
  }

  const handleEdit = async (id: string, name: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/lineage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'שגיאה בעריכה'); return false }
      await loadNodes()
      return true
    } catch {
      alert('שגיאת רשת')
      return false
    }
  }

  const tree = buildTree(nodes)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch size={18} className="text-indigo-500" />
          <h2 className="text-sm font-semibold text-slate-700">עץ הדורות</h2>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{nodes.length} רשומות</span>
        </div>
        <button
          onClick={openAddRoot}
          className="flex items-center gap-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus size={14} />
          הוסף שורש
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-indigo-800">
              {formParentId ? `הוסף צאצא של: ${formParentName}` : 'הוסף שורש חדש'}
            </p>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
          <input
            type="text"
            value={formName}
            onChange={e => setFormName(e.target.value)}
            placeholder="שם (למשל: רבי אברהם שמואל בנימין סופר)"
            className="rounded-lg border border-indigo-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
          <input
            type="text"
            value={formNotes}
            onChange={e => setFormNotes(e.target.value)}
            placeholder="הערות (אופציונלי)"
            className="rounded-lg border border-indigo-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              שמור
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5">
              ביטול
            </button>
          </div>
        </div>
      )}

      {/* Tree */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">טוען עץ דורות...</span>
          </div>
        ) : tree.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            אין נתונים. הוסף שורש ראשון.
          </div>
        ) : (
          <div className="p-2">
            {tree.map(node => (
              <NodeRow
                key={node.id}
                node={node}
                depth={0}
                onAddChild={openAddChild}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
