'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import MobileDetect from '@/components/mobile-detect';
import {
  ArrowLeft,
  BookOpen,
  LayoutGrid,
  Boxes,
  Play,
  Settings,
  BarChart3,
  Home,
  ChevronRight,
  Keyboard,
  MousePointer,
  Copy,
  Scissors,
  Undo2,
  Redo2,
  Trash2,
  Zap,
  CheckCircle,
  ArrowRight,
  Menu,
  X,
} from 'lucide-react';

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Getting Started</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">1</div>
            <div>
              <div className="font-medium">Add Components</div>
              <div className="text-sm text-gray-600">Drag and drop services from the component panel</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">2</div>
            <div>
              <div className="font-medium">Connect Services</div>
              <div className="text-sm text-gray-600">Create connections between components</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">3</div>
            <div>
              <div className="font-medium">Run Simulation</div>
              <div className="text-sm text-gray-600">Test your architecture with real traffic patterns</div>
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
        <CardTitle className="text-lg">Main Interface</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-700">
          The ArchScope interface is divided into several key areas that work together to provide 
          a seamless system design experience.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Component Panel</h4>
            <p className="text-sm text-gray-600">Browse and search for available services</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Canvas Area</h4>
            <p className="text-sm text-gray-600">Design your architecture visually</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Properties Panel</h4>
            <p className="text-sm text-gray-600">Configure component settings</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Simulation Controls</h4>
            <p className="text-sm text-gray-600">Run and analyze simulations</p>
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
        <CardTitle className="text-lg">Building Your First Architecture</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-700">
          Let's build a simple web application architecture to understand the basics.
        </p>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium mb-2">Step 1: Add a Load Balancer</h4>
            <p className="text-sm text-gray-600">Drag an Application Load Balancer to the canvas</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium mb-2">Step 2: Add Web Servers</h4>
            <p className="text-sm text-gray-600">Add EC2 instances behind the load balancer</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-medium mb-2">Step 3: Add Database</h4>
            <p className="text-sm text-gray-600">Connect an RDS database to your web servers</p>
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
        <CardTitle className="text-lg">Running Simulations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-700">
          Simulations help you understand how your architecture performs under different conditions.
        </p>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Play className="w-5 h-5 text-green-600" />
            <span>Start simulation with default traffic patterns</span>
          </div>
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Monitor real-time performance metrics</span>
          </div>
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-purple-600" />
            <span>Adjust parameters and re-run tests</span>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const ConfigurationContent = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Advanced Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-700">
          Fine-tune your components with advanced settings for realistic simulations.
        </p>
        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Rate Limiting</h4>
            <p className="text-sm text-gray-600">Set requests per second limits</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Caching</h4>
            <p className="text-sm text-gray-600">Configure cache hit rates and TTL</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Cost Overrides</h4>
            <p className="text-sm text-gray-600">Custom pricing for services</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const ShortcutsContent = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Keyboard Shortcuts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium">Basic Operations</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Delete</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded">Delete</kbd>
              </div>
              <div className="flex justify-between">
                <span>Copy</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl+C</kbd>
              </div>
              <div className="flex justify-between">
                <span>Paste</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl+V</kbd>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Selection</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Select Multiple</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded">Shift+Click</kbd>
              </div>
              <div className="flex justify-between">
                <span>Select All</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl+A</kbd>
              </div>
              <div className="flex justify-between">
                <span>Pan Canvas</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded">Space+Drag</kbd>
              </div>
            </div>
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
        <CardTitle className="text-lg">Understanding Analytics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-700">
          Analytics provide insights into your architecture's performance and help identify bottlenecks.
        </p>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium mb-2">Response Time</h4>
            <p className="text-sm text-gray-600">Average time to process requests</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium mb-2">Throughput</h4>
            <p className="text-sm text-gray-600">Requests processed per second</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-medium mb-2">Error Rate</h4>
            <p className="text-sm text-gray-600">Percentage of failed requests</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      description: 'Create a simple web application setup',
      icon: <Boxes className="w-4 h-4" />,
      content: <BuildingContent />,
    },
    {
      id: 'simulation',
      title: 'Running Simulations',
      description: 'Test your architecture with real traffic',
      icon: <Play className="w-4 h-4" />,
      content: <SimulationContent />,
    },
    {
      id: 'configuration',
      title: 'Advanced Configuration',
      description: 'Fine-tune components and settings',
      icon: <Settings className="w-4 h-4" />,
      content: <ConfigurationContent />,
    },
    {
      id: 'shortcuts',
      title: 'Keyboard Shortcuts',
      description: 'Work faster with keyboard shortcuts',
      icon: <Keyboard className="w-4 h-4" />,
      content: <ShortcutsContent />,
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
    <MobileDetect>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-50">
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
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-2">
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
              
              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </div>
          
          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t bg-white">
              <div className="px-4 py-3 space-y-2">
                <div className="flex items-center justify-between mb-3">
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
                <div className="space-y-1">
                  {sections.map((section) => (
                    <Button
                      key={section.id}
                      variant={activeSection === section.id ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => {
                        setActiveSection(section.id);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      {section.icon}
                      <span className="ml-2">{section.title}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">
            {/* Sidebar Navigation - Desktop Only */}
            <div className="hidden lg:block w-64 flex-shrink-0">
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
                          className="w-full justify-start"
                          onClick={() => setActiveSection(section.id)}
                        >
                          {section.icon}
                          <span className="ml-2">{section.title}</span>
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Content Area - Full Width on Mobile */}
            <div className="flex-1 min-w-0">
              <ScrollArea className="h-[calc(100vh-10rem)] lg:h-[calc(100vh-8rem)]">
                <div className="pb-8 max-w-4xl mx-auto">
                  {currentSection?.content}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
    </MobileDetect>
  );
};

export default GetStartedPage;
