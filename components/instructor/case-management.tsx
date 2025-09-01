"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Case {
  id: string
  title: string
  description: string
  difficulty: "beginner" | "intermediate" | "advanced"
  category: string
  createdAt: string
  updatedAt: string
  isActive: boolean
}

export function CaseManagement() {
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingCase, setEditingCase] = useState<Case | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "beginner" as const,
    category: "",
  })

  useEffect(() => {
    fetchCases()
  }, [])

  const fetchCases = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/cases")
      if (response.ok) {
        const data = await response.json()
        setCases(data)
      }
    } catch (error) {
      console.error("Failed to fetch cases:", error)
      setCases([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCase = async () => {
    try {
      const response = await fetch("/api/cases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchCases()
        setIsCreateModalOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error("Failed to create case:", error)
    }
  }

  const handleUpdateCase = async () => {
    if (!editingCase) return

    try {
      const response = await fetch(`/api/cases/${editingCase.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchCases()
        setEditingCase(null)
        resetForm()
      }
    } catch (error) {
      console.error("Failed to update case:", error)
    }
  }

  const handleDeleteCase = async (caseId: string) => {
    try {
      const response = await fetch(`/api/cases/${caseId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchCases()
      }
    } catch (error) {
      console.error("Failed to delete case:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      difficulty: "beginner",
      category: "",
    })
  }

  const openEditModal = (caseItem: Case) => {
    setEditingCase(caseItem)
    setFormData({
      title: caseItem.title,
      description: caseItem.description,
      difficulty: caseItem.difficulty,
      category: caseItem.category,
    })
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800"
      case "intermediate":
        return "bg-yellow-100 text-yellow-800"
      case "advanced":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredCases = cases.filter(
    (caseItem) =>
      caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Case Management</h2>
          <p className="text-slate-600">Create and manage medical cases for student assessment</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Case
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Case</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Case Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter case title"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Cardiology, Neurology"
                />
              </div>
              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value: any) => setFormData({ ...formData, difficulty: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Case Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter detailed case description"
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCase}>Create Case</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cases Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Cases</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search cases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">No cases found</p>
              <p className="text-sm text-slate-400 mt-1">Create your first case to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map((caseItem) => (
                  <TableRow key={caseItem.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-slate-900">{caseItem.title}</div>
                        <div className="text-sm text-slate-500 truncate max-w-xs">{caseItem.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>{caseItem.category}</TableCell>
                    <TableCell>
                      <Badge className={getDifficultyColor(caseItem.difficulty)}>{caseItem.difficulty}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-600">{caseItem.createdAt}</TableCell>
                    <TableCell>
                      <Badge variant={caseItem.isActive ? "default" : "secondary"}>
                        {caseItem.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(caseItem)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteCase(caseItem.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={!!editingCase} onOpenChange={() => setEditingCase(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Case</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Case Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter case title"
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Input
                id="edit-category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Cardiology, Neurology"
              />
            </div>
            <div>
              <Label htmlFor="edit-difficulty">Difficulty</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value: any) => setFormData({ ...formData, difficulty: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-description">Case Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter detailed case description"
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingCase(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateCase}>Update Case</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
