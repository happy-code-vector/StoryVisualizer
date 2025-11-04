"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Clock, DollarSign, TrendingUp, Zap, Crown, ArrowUpRight } from 'lucide-react'

interface UsageStats {
  minutesUsed: number
  monthlyLimit: number
  overageCharges: number
  tier: string
  renderMinutes: number
}

interface SubscriptionTier {
  id: string
  name: string
  price: number
  monthlyMinutes: number
  overageRate: number
  features: string[]
  current?: boolean
}

const TIERS: SubscriptionTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    monthlyMinutes: 180,
    overageRate: 0.25,
    features: ['~3 videos/month', 'Standard queue', 'Basic support']
  },
  {
    id: 'creator',
    name: 'Creator',
    price: 99,
    monthlyMinutes: 360,
    overageRate: 0.22,
    features: ['~6 videos/month', '10% priority queue', 'Email support']
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 249,
    monthlyMinutes: 1000,
    overageRate: 0.20,
    features: ['~16 videos/month', '30% priority queue', 'Priority support']
  },
  {
    id: 'studio',
    name: 'Studio',
    price: 499,
    monthlyMinutes: 2400,
    overageRate: 0.18,
    features: ['~40 videos/month', '60% priority queue', 'Dedicated support']
  }
]

export function UsageDashboard() {
  const [usage, setUsage] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsage()
  }, [])

  const fetchUsage = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/usage')
      // const data = await response.json()
      
      // Mock data for now
      setUsage({
        minutesUsed: 120,
        monthlyLimit: 180,
        overageCharges: 0,
        tier: 'starter',
        renderMinutes: 120
      })
    } catch (error) {
      console.error('Error fetching usage:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!usage) return null

  const usagePercentage = (usage.minutesUsed / usage.monthlyLimit) * 100
  const minutesRemaining = Math.max(0, usage.monthlyLimit - usage.minutesUsed)
  const isOverage = usage.minutesUsed > usage.monthlyLimit

  return (
    <div className="space-y-6">
      <Tabs defaultValue="usage" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
        </TabsList>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-4">
          {/* Current Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Current Usage
              </CardTitle>
              <CardDescription>
                Your render minutes for this billing period
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Minutes Used</span>
                  <span className="font-bold">
                    {usage.minutesUsed} / {usage.monthlyLimit} min
                  </span>
                </div>
                <Progress 
                  value={Math.min(usagePercentage, 100)} 
                  className={`h-3 ${isOverage ? 'bg-red-100' : ''}`}
                />
                {isOverage && (
                  <p className="text-xs text-red-500">
                    ⚠️ You've exceeded your monthly limit. Overage charges apply.
                  </p>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">{minutesRemaining}</div>
                  <div className="text-xs text-muted-foreground">Minutes Remaining</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">${usage.overageCharges.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">Overage Charges</div>
                </div>
              </div>

              {/* Current Tier */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-semibold capitalize">{usage.tier} Plan</div>
                  <div className="text-sm text-muted-foreground">
                    {TIERS.find(t => t.id === usage.tier)?.price || 0}/month
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                  Upgrade
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Usage History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Usage History
              </CardTitle>
              <CardDescription>
                Your rendering activity over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { date: 'Today', minutes: 15, cost: 0.45 },
                  { date: 'Yesterday', minutes: 30, cost: 0.90 },
                  { date: '2 days ago', minutes: 25, cost: 0.75 },
                  { date: '3 days ago', minutes: 20, cost: 0.60 },
                  { date: '4 days ago', minutes: 30, cost: 0.90 }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{item.date}</div>
                      <div className="text-sm text-muted-foreground">{item.minutes} minutes</div>
                    </div>
                    <Badge variant="outline">${item.cost.toFixed(2)}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TIERS.map(tier => {
              const isCurrent = tier.id === usage.tier
              return (
                <Card key={tier.id} className={isCurrent ? 'border-primary' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {tier.name}
                        {isCurrent && (
                          <Badge className="bg-primary">Current</Badge>
                        )}
                      </CardTitle>
                      {tier.id === 'studio' && (
                        <Crown className="w-5 h-5 text-yellow-500" />
                      )}
                    </div>
                    <CardDescription>
                      <span className="text-3xl font-bold">${tier.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Render Minutes</span>
                        <span className="font-medium">{tier.monthlyMinutes} min</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Overage Rate</span>
                        <span className="font-medium">${tier.overageRate}/min</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {tier.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button 
                      className="w-full" 
                      variant={isCurrent ? 'outline' : 'default'}
                      disabled={isCurrent}
                    >
                      {isCurrent ? 'Current Plan' : 'Upgrade'}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
