"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter } from "lucide-react"

interface CaseFiltersProps {
  onSearchChange: (search: string) => void
  onDifficultyChange: (difficulty: string) => void
  onSpecialtyChange: (specialty: string) => void
}

export function CaseFilters({ onSearchChange, onDifficultyChange, onSpecialtyChange }: CaseFiltersProps) {
  const [search, setSearch] = useState("")

  const handleSearchChange = (value: string) => {
    setSearch(value)
    onSearchChange(value)
  }

  return (
    <div className="bg-white rounded-lg border p-4 mb-6">
      <div className="flex items-center mb-4">
        <Filter className="h-5 w-5 text-gray-500 mr-2" />
        <h3 className="font-semibold text-gray-900">Filter Cases</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search cases..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Difficulty Filter */}
        <Select onValueChange={onDifficultyChange}>
          <SelectTrigger>
            <SelectValue placeholder="All Difficulties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Difficulties</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>

        {/* Specialty Filter */}
        <Select onValueChange={onSpecialtyChange}>
          <SelectTrigger>
            <SelectValue placeholder="All Specialties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Specialties</SelectItem>
            <SelectItem value="cardiology">Cardiology</SelectItem>
            <SelectItem value="gastroenterology">Gastroenterology</SelectItem>
            <SelectItem value="emergency">Emergency Medicine</SelectItem>
            <SelectItem value="internal">Internal Medicine</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
