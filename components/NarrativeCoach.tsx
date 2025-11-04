import { AlertCircle, Info, AlertTriangle, Lightbulb } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface NarrativeCoachSuggestion {
  type: 'pacing' | 'tension' | 'character' | 'structure' | 'emotion'
  severity: 'info' | 'warning' | 'critical'
  message: string
  suggestion: string
  actionable: boolean
}

interface NarrativeCoachProps {
  suggestions: NarrativeCoachSuggestion[]
}

export function NarrativeCoach({ suggestions }: NarrativeCoachProps) {
  if (!suggestions || suggestions.length === 0) {
    return (
      <Alert className="border-green-500/50 bg-green-500/10">
        <Lightbulb className="h-4 w-4 text-green-500" />
        <AlertTitle>Great Story Structure!</AlertTitle>
        <AlertDescription>
          Your story has a solid narrative arc with good pacing and character development.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-3">
      {suggestions.map((suggestion, i) => {
        const Icon = suggestion.severity === 'critical' ? AlertCircle 
          : suggestion.severity === 'warning' ? AlertTriangle 
          : Info

        const variant = suggestion.severity === 'critical' ? 'destructive' : 'default'
        
        return (
          <Alert key={i} variant={variant} className={
            suggestion.severity === 'warning' ? 'border-yellow-500/50 bg-yellow-500/10' :
            suggestion.severity === 'info' ? 'border-blue-500/50 bg-blue-500/10' : ''
          }>
            <Icon className="h-4 w-4" />
            <AlertTitle className="font-semibold">{suggestion.message}</AlertTitle>
            <AlertDescription className="mt-2">
              {suggestion.suggestion}
            </AlertDescription>
          </Alert>
        )
      })}
    </div>
  )
}
