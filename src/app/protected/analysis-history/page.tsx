import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { AnalysisLog } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { format } from 'date-fns'

async function getAnalysisLogs() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return redirect('/sign-in')
  }
  
  const { data, error } = await supabase
    .from('analysis_logs')
    .select('*')
    .order('created_at', { ascending: false })
    
  if (error) {
    console.error('Error fetching analysis logs:', error)
    throw new Error('Failed to fetch analysis logs')
  }
  
  return data as AnalysisLog[]
}

export default async function AnalysisHistoryPage() {
  const logs = await getAnalysisLogs()
  
  return (
    <div className="container mx-auto py-2">
      <h1 className="text-2xl font-bold mb-6">Analysis History</h1>
      <div className="grid gap-6">
        {logs.map((log) => (
          <Card key={log.id}>
            <CardHeader>
              <div className="">
                <div>
                  <CardTitle>{log.dish_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(log.created_at), "MMM d, yyyy 'at' HH:mm")}
                  </p>
                </div>
                <div className="text-sm">
                  <p>Weight: {log.total_weight_g}g</p>
                  <p>Digestion Time: ~{log.total_digestion_time_m} min</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <img
                    src={log.image_url}
                    alt={log.dish_name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Macronutrients</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Calories: {log.macros.calories_kcal} kcal</div>
                      <div>Protein: {log.macros.protein_g}g</div>
                      <div>Carbs: {log.macros.carbs_g}g</div>
                      <div>Fat: {(log.macros.fat_g + log.macros.sat_fat_g).toFixed(2)}g</div>
                      <div>Sugars: {log.macros.sugars_g}g</div>
                      <div>Fiber: {log.macros.fiber_g}g</div>
                    </div>
                  </div>
                  {log.notes.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Notes</h3>
                      <ScrollArea className="h-24 pr-4">
                        <div className="space-y-2 text-sm">
                          {log.notes.map((note, index) => (
                            <p key={index} className="text-muted-foreground">
                              {note}
                            </p>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 