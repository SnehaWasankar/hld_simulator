'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  ChevronRight,
  Play,
  Settings,
  BarChart3,
  Zap,
  Boxes,
  LayoutGrid,
  BookOpen,
  ArrowRight,
  CheckCircle,
  ArrowLeft,
  Home,
} from 'lucide-react';

interface GuideSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  completed?: boolean;
}

const GetStartedPage = () => {
  const [activeSection, setActiveSection] = useState('overview');

  const sections: GuideSection[] = [
    {
      id: 'overview',
      title: 'Welcome to ArchScope',
      description: 'Learn what ArchScope can do for you',
      icon: <BookOpen className="w-4 h-4" />,
      content: <OverviewContent />,
    },
    {
      id: 'interface',
      title: 'Understanding the Interface',
      description: 'Tour the main components and layout',
      icon: <LayoutGrid className="w-4 h-4" />,
      content: <InterfaceContent />,
    },
    {
      id: 'building',
      title: 'Building Your First Architecture',
      description: 'Create and connect system components',
      icon: <Boxes className="w-4 h-4" />,
      content: <BuildingContent />,
    },
    {
      id: 'simulation',
      title: 'Running Simulations',
      description: 'Test performance and analyze results',
      icon: <Play className="w-4 h-4" />,
      content: <SimulationContent />,
    },
    {
      id: 'configuration',
      title: 'Advanced Configuration',
      description: 'Customize components and settings',
      icon: <Settings className="w-4 h-4" />,
      content: <ConfigurationContent />,
    },
    {
      id: 'analytics',
      title: 'Understanding Analytics',
      description: 'Interpret simulation results and metrics',
      icon: <BarChart3 className="w-4 h-4" />,
      content: <AnalyticsContent />,
    },
  ];

  const currentSection = sections.find(s => s.id === activeSection);
  const currentIndex = sections.findIndex(s => s.id === activeSection);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">ArchScope Guide</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {currentIndex + 1} of {sections.length}
              </Badge>
              <Link href="/">
                <Button variant="outline" size="sm" className="gap-2">
                  <Home className="w-4 h-4" />
                  Open App
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <div className="flex gap-8 h-[calc(100vh-8rem)]">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Guide Sections</CardTitle>
                <CardDescription className="text-xs">
                  Navigate through the guide to learn ArchScope
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <div className="p-4 space-y-1">
                    {sections.map((section, index) => (
                      <Button
                        key={section.id}
                        variant={activeSection === section.id ? "secondary" : "ghost"}
                        size="sm"
                        className="w-full justify-start h-auto p-3 text-left"
                        onClick={() => setActiveSection(section.id)}
                      >
                        <div className="flex items-center gap-3 w-full">
                          {section.icon}
                          <div className="flex-1">
                            <div className="font-medium text-sm">{section.title}</div>
                            <div className="text-xs text-gray-500 mt-1">{section.description}</div>
                          </div>
                          {section.completed && <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />}
                        </div>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            <Card className="h-full">
              <CardContent className="p-6 h-full overflow-hidden">
                <ScrollArea className="h-full">
                  {currentSection && (
                    <div className="space-y-6 pb-8">
                      <div className="flex items-center justify-between sticky top-0 bg-white z-10 pb-4">
                        <div className="flex items-center gap-3">
                          {currentSection.icon}
                          <h2 className="text-2xl font-bold text-gray-900">{currentSection.title}</h2>
                        </div>
                        <div className="flex items-center gap-2">
                          {currentIndex > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActiveSection(sections[currentIndex - 1].id)}
                            >
                              Previous
                            </Button>
                          )}
                          {currentIndex < sections.length - 1 && (
                            <Button
                              size="sm"
                              onClick={() => setActiveSection(sections[currentIndex + 1].id)}
                            >
                              Next
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-600">{currentSection.description}</p>
                      <Separator />
                      {currentSection.content}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// Content Components
const OverviewContent = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">What is ArchScope?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-700">
          ArchScope is an interactive system architecture simulator that lets you design, visualize, 
          and test system architectures before implementing them. Think of it as a digital playground 
          for architects and engineers to experiment with different system designs without committing 
          to expensive infrastructure decisions.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
            <Zap className="w-6 h-6 text-blue-600" />
            <div>
              <div className="font-medium">Real-time Simulation</div>
              <div className="text-sm text-gray-600">Test performance under various conditions</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
            <BarChart3 className="w-6 h-6 text-green-600" />
            <div>
              <div className="font-medium">Performance Analytics</div>
              <div className="text-sm text-gray-600">Detailed metrics and bottleneck detection</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
            <Boxes className="w-6 h-6 text-purple-600" />
            <div>
              <div className="font-medium">30+ Cloud Services</div>
              <div className="text-sm text-gray-600">AWS, GCP, Azure, and generic components</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
            <Settings className="w-6 h-6 text-orange-600" />
            <div>
              <div className="font-medium">Custom Configurations</div>
              <div className="text-sm text-gray-600">Rate limiting, caching, and cost overrides</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Key Benefits</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium">Cost Planning</h4>
              <p className="text-gray-600">Estimate infrastructure costs before deployment with realistic cloud pricing</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium">Performance Testing</h4>
              <p className="text-gray-600">Identify bottlenecks and capacity limits under different load conditions</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium">Architecture Validation</h4>
              <p className="text-gray-600">Test design decisions with real data and traffic patterns</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium">Risk Reduction</h4>
              <p className="text-gray-600">Validate designs before investing in expensive infrastructure</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const InterfaceContent = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Main Layout Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-700">
          The ArchScope interface is divided into three main sections for optimal workflow:
        </p>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
            <div className="w-4 h-4 bg-blue-200 rounded" />
            <div>
              <h4 className="font-medium">Left Panel - Simulation Controls</h4>
              <p className="text-gray-600">Configure simulation parameters, users, requests, and load patterns</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
            <div className="w-4 h-4 bg-green-200 rounded" />
            <div>
              <h4 className="font-medium">Center Canvas - Architecture Workspace</h4>
              <p className="text-gray-600">Visual diagram area where you build and connect system components</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg">
            <div className="w-4 h-4 bg-purple-200 rounded" />
            <div>
              <h4 className="font-medium">Right Panel - Tools & Results</h4>
              <p className="text-gray-600">Component palette, configuration, and simulation results</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Right Panel Tabs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <LayoutGrid className="w-5 h-5 text-blue-600" />
            <div>
              <div className="font-medium text-sm">Add</div>
              <div className="text-xs text-gray-600">Drag components to build architecture</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <Zap className="w-5 h-5 text-yellow-600" />
            <div>
              <div className="font-medium text-sm">Live</div>
              <div className="text-xs text-gray-600">Real-time monitoring during simulation</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <Settings className="w-5 h-5 text-gray-600" />
            <div>
              <div className="font-medium text-sm">Config</div>
              <div className="text-xs text-gray-600">Customize component settings</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <BarChart3 className="w-5 h-5 text-green-600" />
            <div>
              <div className="font-medium text-sm">Report</div>
              <div className="text-xs text-gray-600">View simulation results and analytics</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const BuildingContent = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Step 1: Add Components</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-700">
          Navigate to the <Badge variant="outline" className="text-xs">Add</Badge> tab and drag components 
          from the palette to the canvas.
        </p>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Available Components:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>· Load Balancers</div>
            <div>· API Servers</div>
            <div>· Caches</div>
            <div>· Databases</div>
            <div>· Message Queues</div>
            <div>· Workers</div>
            <div>· Notification Services</div>
            <div>· Rate Limiters</div>
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-1">Pro Tip</h4>
          <p className="text-blue-700 text-sm">
            Start with a simple pattern: Client &rarr; Load Balancer &rarr; API Server &rarr; Database
          </p>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Step 2: Connect Components</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-700">
          Click and drag from connection points on components to create data flow paths.
        </p>
        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
          <ArrowRight className="w-5 h-5 text-green-600" />
          <div>
            <div className="font-medium">Connection Direction Matters</div>
            <div className="text-sm text-gray-600">Connections represent request flow through your system</div>
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-1">Important</h4>
          <p className="text-yellow-700 text-sm">
            Always start connections from a client or load balancer and end at database or cache services.
          </p>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Step 3: Configure Components</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-700">
          Click any component to open the <Badge variant="outline" className="text-xs">Config</Badge> tab 
          and customize settings.
        </p>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span className="text-sm">Select cloud provider and service type</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span className="text-sm">Override default costs with actual pricing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span className="text-sm">Configure advanced settings (rate limiting, cache, etc.)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const SimulationContent = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Setting Up Simulation Parameters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-700">
          Use the left panel to configure how your architecture will be tested:
        </p>
        <div className="space-y-3">
          <div className="p-3 border rounded-lg">
            <h4 className="font-medium text-sm mb-1">Concurrent Users</h4>
            <p className="text-gray-600 text-sm">Number of simulated users accessing your system</p>
          </div>
          <div className="p-3 border rounded-lg">
            <h4 className="font-medium text-sm mb-1">Requests per Second per User</h4>
            <p className="text-gray-600 text-sm">How many requests each user makes per second</p>
          </div>
          <div className="p-3 border rounded-lg">
            <h4 className="font-medium text-sm mb-1">Simulation Duration</h4>
            <p className="text-gray-600 text-sm">How long to run the simulation (in seconds)</p>
          </div>
          <div className="p-3 border rounded-lg">
            <h4 className="font-medium text-sm mb-1">Load Profile</h4>
            <p className="text-gray-600 text-sm">Traffic pattern: constant, sine wave, or repeating spikes</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Running the Simulation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-700">
          Click the <Badge variant="default" className="text-xs">Run Simulation</Badge> button to start testing.
        </p>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full" />
            <span className="text-sm">Watch real-time metrics in the <Badge variant="outline" className="text-xs">Live</Badge> tab</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full" />
            <span className="text-sm">Monitor component utilization and response times</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-500 rounded-full" />
            <span className="text-sm">View detailed results in the <Badge variant="outline" className="text-xs">Report</Badge> tab</span>
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-1">Best Practice</h4>
          <p className="text-blue-700 text-sm">
            Start with lower traffic levels and gradually increase to find breaking points and optimal capacity.
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
);

const ConfigurationContent = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Service Selection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-700">
          Each component can be configured with different cloud services:
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 border rounded-lg text-center">
            <div className="font-medium text-sm">AWS</div>
            <div className="text-xs text-gray-600">Lambda, EC2, RDS, etc.</div>
          </div>
          <div className="p-3 border rounded-lg text-center">
            <div className="font-medium text-sm">GCP</div>
            <div className="text-xs text-gray-600">Cloud Functions, Compute Engine</div>
          </div>
          <div className="p-3 border rounded-lg text-center">
            <div className="font-medium text-sm">Azure</div>
            <div className="text-xs text-gray-600">Functions, Virtual Machines</div>
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Example Configuration</h4>
          <p className="text-sm text-gray-600">
            Configure an API Server with AWS Lambda for serverless, EC2 for traditional, 
            or Fargate for containerized deployments.
          </p>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Custom Cost Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-700">
          Override default pricing with your actual negotiated rates:
        </p>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm">Navigate to component configuration</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm">Find "Cost Configuration" section</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm">Enter custom hourly cost</span>
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-1">Important Note</h4>
          <p className="text-yellow-700 text-sm">
            Default pricing is for simulation purposes only. Always verify with current cloud provider rates.
          </p>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Advanced Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="p-3 border rounded-lg">
            <h4 className="font-medium text-sm mb-1">Rate Limiting Algorithms</h4>
            <p className="text-gray-600 text-sm">Token bucket, sliding window, leaky bucket, fixed window</p>
          </div>
          <div className="p-3 border rounded-lg">
            <h4 className="font-medium text-sm mb-1">Cache Configuration</h4>
            <p className="text-gray-600 text-sm">TTL settings, hit rates, Redis integration</p>
          </div>
          <div className="p-3 border rounded-lg">
            <h4 className="font-medium text-sm mb-1">Queue Processing</h4>
            <p className="text-gray-600 text-sm">Message queue depths, processing times, worker scaling</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const AnalyticsContent = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Performance Metrics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-700">
          ArchScope provides comprehensive performance analytics:
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 border rounded-lg">
            <h4 className="font-medium text-sm mb-1">Latency Analysis</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>· Average response times</li>
              <li>· P99 latency (99th percentile)</li>
              <li>· End-to-end request latency</li>
            </ul>
          </div>
          <div className="p-3 border rounded-lg">
            <h4 className="font-medium text-sm mb-1">Throughput Metrics</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>· Requests per second handled</li>
              <li>· Peak capacity utilization</li>
              <li>· Connection limits</li>
            </ul>
          </div>
          <div className="p-3 border rounded-lg">
            <h4 className="font-medium text-sm mb-1">Resource Utilization</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>· CPU and memory usage</li>
              <li>· Database connection pools</li>
              <li>· Network bandwidth</li>
            </ul>
          </div>
          <div className="p-3 border rounded-lg">
            <h4 className="font-medium text-sm mb-1">Error Analysis</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>· Failed request rates</li>
              <li>· Rate-limited requests</li>
              <li>· Queue overflow events</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Cost Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-700">
          Understand the financial impact of your architecture:
        </p>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm">Hourly and monthly cost breakdowns</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm">Cost per component and total infrastructure</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm">Cost scaling with traffic patterns</span>
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium text-green-800 mb-1">Cost Factors</h4>
          <p className="text-green-700 text-sm">
            Service selection, configuration settings, traffic patterns, and custom pricing all impact total costs.
          </p>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Bottleneck Detection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-700">
          ArchScope automatically identifies performance issues:
        </p>
        <div className="space-y-3">
          <div className="p-3 border-l-4 border-red-500 bg-red-50 rounded">
            <h4 className="font-medium text-sm mb-1">Common Bottlenecks</h4>
            <ul className="text-xs text-gray-700 space-y-1">
              <li>· Database connection limits</li>
              <li>· Cache misses causing downstream load</li>
              <li>· Rate limits blocking legitimate requests</li>
              <li>· Network latency between services</li>
            </ul>
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-1">Optimization Suggestions</h4>
          <p className="text-blue-700 text-sm">
            Each bottleneck includes specific recommendations for improving performance and capacity.
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default GetStartedPage;
