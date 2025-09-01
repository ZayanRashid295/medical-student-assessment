"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, Filter, MessageSquare, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SOAPNote {
  id: string
  studentName: string
  studentEmail: string
  caseTitle: string
  submittedAt: string
  content: {
    subjective: string
    objective: string
    assessment: string
    plan: string
  }
  feedback?: {
    rating: number
    comments: string
    submittedAt: string
  }
  status: "pending" | "reviewed" | "needs_revision"
}

export function FeedbackManagement() {
  const [soapNotes, setSoapNotes] = useState<SOAPNote[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedNote, setSelectedNote] = useState<SOAPNote | null>(null)
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 5,
    comments: "",
  })

  useEffect(() => {
    fetchSOAPNotes()
  }, [])

  const fetchSOAPNotes = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/soap-notes")
      if (response.ok) {
        const data = await response.json()
        setSoapNotes(data)
      }
    } catch (error) {
      console.error("Failed to fetch SOAP notes:", error)
      setSoapNotes([])
    } finally {
      setLoading(false)
    }
  }

  const submitFeedback = async () => {
    if (!selectedNote) return

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          soapNoteId: selectedNote.id,
          rating: feedbackForm.rating,
          comments: feedbackForm.comments,
        }),
      })

      if (response.ok) {
        await fetchSOAPNotes()
        setSelectedNote(null)
        setFeedbackForm({ rating: 5, comments: "" })
      }
    } catch (error) {
      console.error("Failed to submit feedback:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "reviewed":
        return "bg-green-100 text-green-800"
      case "needs_revision":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredNotes = soapNotes.filter(
    (note) =>
      note.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.caseTitle.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const pendingCount = soapNotes.filter((note) => note.status === "pending").length
  const reviewedCount = soapNotes.filter((note) => note.status === "reviewed").length

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Submissions</p>
                  <p className="text-2xl font-bold text-slate-900">{soapNotes.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Pending Review</p>
                  <p className="text-2xl font-bold text-slate-900">{pendingCount}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Reviewed</p>
                  <p className="text-2xl font-bold text-slate-900">{reviewedCount}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* SOAP Notes Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>SOAP Note Submissions</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search submissions..."
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
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">No SOAP note submissions found</p>
              <p className="text-sm text-slate-400 mt-1">Student submissions will appear here for review</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Case</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotes.map((note) => (
                  <TableRow key={note.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-slate-900">{note.studentName}</div>
                        <div className="text-sm text-slate-500">{note.studentEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{note.caseTitle}</TableCell>
                    <TableCell className="text-slate-600">{note.submittedAt}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(note.status)}>{note.status.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell>
                      {note.feedback ? (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{note.feedback.rating}/5</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Not rated</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => setSelectedNote(note)}>
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Modal */}
      <Dialog open={!!selectedNote} onOpenChange={() => setSelectedNote(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review SOAP Note</DialogTitle>
          </DialogHeader>
          {selectedNote && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Student</label>
                  <p className="text-slate-900">{selectedNote.studentName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Case</label>
                  <p className="text-slate-900">{selectedNote.caseTitle}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Subjective</h4>
                    <div className="p-3 bg-slate-50 rounded-lg text-sm">
                      {selectedNote.content.subjective || "No content provided"}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Objective</h4>
                    <div className="p-3 bg-slate-50 rounded-lg text-sm">
                      {selectedNote.content.objective || "No content provided"}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Assessment</h4>
                    <div className="p-3 bg-slate-50 rounded-lg text-sm">
                      {selectedNote.content.assessment || "No content provided"}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Plan</h4>
                    <div className="p-3 bg-slate-50 rounded-lg text-sm">
                      {selectedNote.content.plan || "No content provided"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium text-slate-900 mb-4">Provide Feedback</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600">Rating</label>
                    <Select
                      value={feedbackForm.rating.toString()}
                      onValueChange={(value) => setFeedbackForm({ ...feedbackForm, rating: Number.parseInt(value) })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Star</SelectItem>
                        <SelectItem value="2">2 Stars</SelectItem>
                        <SelectItem value="3">3 Stars</SelectItem>
                        <SelectItem value="4">4 Stars</SelectItem>
                        <SelectItem value="5">5 Stars</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Comments</label>
                    <Textarea
                      value={feedbackForm.comments}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, comments: e.target.value })}
                      placeholder="Provide detailed feedback on the student's SOAP note..."
                      rows={4}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setSelectedNote(null)}>
                      Cancel
                    </Button>
                    <Button onClick={submitFeedback}>Submit Feedback</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
