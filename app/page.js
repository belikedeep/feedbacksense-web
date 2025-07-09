'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  CheckIcon,
  ChartBarIcon,
  ClockIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ArrowRightIcon,
  CogIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  ChevronDownIcon,
  PlayIcon,
  CloudArrowUpIcon,
  EyeIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline'
import {
  CheckIcon as CheckIconSolid,
  StarIcon as StarIconSolid
} from '@heroicons/react/24/solid'
import DemoModal from '@/components/DemoModal'
import BrandLogo from '@/components/icons/BrandLogo'
import HeroIllustration from '@/components/icons/HeroIllustration'
import AnalyticsIcon from '@/components/icons/AnalyticsIcon'
import AIIcon from '@/components/icons/AIIcon'
import SecurityIcon from '@/components/icons/SecurityIcon'
import DataProcessingIcon from '@/components/icons/DataProcessingIcon'
import DashboardMockup from '@/components/icons/DashboardMockup'
import AIProcessIllustration from '@/components/icons/AIProcessIllustration'
import SecurityIllustration from '@/components/icons/SecurityIllustration'

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showDemo, setShowDemo] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)

  // Redirect to dashboard if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        window.location.href = '/dashboard'
      }
    }
    checkAuth()
  }, [])

  const features = [
    {
      icon: SparklesIcon,
      title: "AI-Powered Sentiment Analysis",
      description: "Advanced natural language processing that understands context, emotion, and intent in customer feedback with industry-leading accuracy."
    },
    {
      icon: ChartBarIcon,
      title: "Real-Time Analytics Dashboard",
      description: "Beautiful, interactive dashboards that reveal trends, patterns, and actionable insights from your customer feedback data."
    },
    {
      icon: BoltIcon,
      title: "Instant Processing",
      description: "Process thousands of feedback entries in seconds. No more waiting hours or days for analysis results."
    },
    {
      icon: ShieldCheckIcon,
      title: "Enterprise Security",
      description: "Bank-grade security with encryption at rest and in transit. Your data remains private and secure at all times."
    },
    {
      icon: CogIcon,
      title: "Smart Categorization",
      description: "Automatically organize feedback by topics, urgency, and sentiment to prioritize what matters most to your business."
    },
    {
      icon: ArrowTrendingUpIcon,
      title: "Performance Tracking",
      description: "Monitor customer satisfaction trends over time and measure the impact of your improvements."
    }
  ]

  const benefits = [
    "Identify customer pain points before they escalate",
    "Make data-driven product decisions with confidence",
    "Reduce manual feedback analysis time by 90%",
    "Improve customer satisfaction scores systematically", 
    "Spot emerging trends and opportunities early",
    "Automate feedback categorization and routing"
  ]

  const integrations = [
    { name: "Email Platforms", icon: "📧" },
    { name: "Review Sites", icon: "⭐" },
    { name: "Social Media", icon: "📱" },
    { name: "Survey Tools", icon: "📋" },
    { name: "Support Tickets", icon: "🎫" },
    { name: "CSV Files", icon: "📊" }
  ]

  const pricingPlans = [
    {
      name: "Free",
      price: "$0",
      period: "/month",
      description: "Perfect for small businesses getting started",
      features: [
        "Up to 100 feedback entries/month",
        "Manual feedback entry",
        "Basic sentiment analysis",
        "Limited dashboard access",
        "Email support"
      ],
      cta: "Get Started Free",
      ctaLink: "/signup",
      popular: false,
      color: "gray"
    },
    {
      name: "Starter",
      price: "$19",
      period: "/month",
      description: "Ideal for growing businesses with moderate feedback volume",
      features: [
        "Up to 1,000 feedback entries/month",
        "One integration (email, etc.)",
        "Enhanced sentiment analysis",
        "Basic topic categorization",
        "Monthly reports",
        "Priority email support"
      ],
      cta: "Start Free Trial",
      ctaLink: "/signup",
      popular: true,
      color: "blue"
    },
    {
      name: "Professional",
      price: "$49", 
      period: "/month",
      description: "Complete solution for established businesses",
      features: [
        "Up to 5,000 feedback entries/month",
        "Multiple integrations",
        "Advanced sentiment & topic analysis",
        "Customizable dashboards",
        "Weekly reports",
        "API access",
        "Phone & email support"
      ],
      cta: "Start Free Trial",
      ctaLink: "/signup",
      popular: false,
      color: "blue"
    }
  ]

  const faqItems = [
    {
      question: "How accurate is the AI sentiment analysis?",
      answer: "Our AI sentiment analysis achieves high accuracy rates by using advanced natural language processing models trained on diverse datasets. The system continuously learns and improves from feedback patterns in your specific domain."
    },
    {
      question: "Can I import existing feedback from other platforms?",
      answer: "Yes! FeedbackSense supports CSV file imports, API integrations with popular platforms, and manual entry. You can easily migrate your existing feedback data and start getting insights immediately."
    },
    {
      question: "Is my data secure and private?",
      answer: "Absolutely. We use enterprise-grade security with encryption, secure data centers, and strict access controls. Your data is never shared with third parties or used to train models for other customers."
    },
    {
      question: "How quickly can I get started?",
      answer: "Setup is quick and straightforward. Most users are analyzing their first feedback within minutes of signing up. Our intuitive interface requires no technical expertise."
    },
    {
      question: "Can I upgrade or downgrade my plan anytime?",
      answer: "Yes, you can change your plan at any time. Upgrades take effect immediately, and downgrades apply at your next billing cycle. No long-term contracts required."
    },
    {
      question: "What kind of support do you provide?",
      answer: "We offer email support for all plans, with priority support for paid plans. Professional plan customers also get phone support during business hours."
    }
  ]

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50">
      {/* Navigation */}
      <nav className="bg-stone-50/95 backdrop-blur-sm shadow-lg border-b border-teal-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center space-x-3">
                <BrandLogo className="w-8 h-8 text-teal-700" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-800 via-teal-700 to-teal-600 bg-clip-text text-transparent">
                  FeedbackSense
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-teal-700 hover:text-teal-800 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-800 hover:to-teal-900 text-stone-50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid-teal-100/10 [mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.05))]"></div>
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12">
          <div className="w-96 h-96 bg-gradient-to-br from-stone-200/20 to-amber-200/20 rounded-full blur-3xl"></div>
        </div>
        <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12">
          <div className="w-96 h-96 bg-gradient-to-br from-teal-400/20 to-teal-500/20 rounded-full blur-3xl"></div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-64 h-64 bg-gradient-to-br from-stone-300/10 to-amber-300/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-stone-100/90 to-amber-100/90 text-teal-800 mb-8 border border-stone-200/50 backdrop-blur-sm">
              <SparklesIcon className="w-4 h-4 mr-2 text-teal-700" />
              AI-Powered Customer Feedback Analysis
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-stone-50 mb-6 leading-tight">
              Transform Customer
              <span className="bg-gradient-to-r from-stone-200 via-amber-200 to-stone-100 bg-clip-text text-transparent block">
                Feedback Into Growth
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-stone-100/90 mb-8 max-w-3xl mx-auto leading-relaxed">
              Stop manually analyzing feedback. Let our AI instantly reveal what your customers really think,
              so you can make data-driven decisions that drive business growth.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
              <Link
                href="/signup"
                className="bg-gradient-to-r from-stone-100 to-amber-100 hover:from-stone-200 hover:to-amber-200 text-teal-800 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 inline-flex items-center justify-center shadow-2xl hover:shadow-stone-500/25 transform hover:-translate-y-1 hover:scale-105"
              >
                Start Free Trial
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <button
                onClick={() => setShowDemo(true)}
                className="bg-teal-800/90 backdrop-blur-sm border-2 border-stone-200/30 text-stone-100 px-8 py-4 rounded-xl text-lg font-semibold hover:border-stone-200/50 hover:bg-teal-700/90 transition-all duration-300 inline-flex items-center justify-center shadow-lg hover:shadow-xl"
              >
                <PlayIcon className="mr-2 h-5 w-5 text-stone-200" />
                Watch Demo
              </button>
            </div>
            
            <div className="flex items-center justify-center space-x-6 text-sm text-stone-200/80">
              <div className="flex items-center">
                <CheckIconSolid className="h-4 w-4 text-amber-300 mr-1" />
                No credit card required
              </div>
              <div className="flex items-center">
                <CheckIconSolid className="h-4 w-4 text-amber-300 mr-1" />
                14-day free trial
              </div>
              <div className="flex items-center">
                <CheckIconSolid className="h-4 w-4 text-amber-300 mr-1" />
                Setup in 2 minutes
              </div>
            </div>
          </div>
          
          {/* Hero Illustration */}
          <div className="mt-16 flex justify-center">
            <HeroIllustration className="w-80 h-80 md:w-96 md:h-96" />
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 bg-stone-50 border-b border-teal-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm text-teal-700 mb-8">Trusted by growing businesses worldwide</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-70">
              {/* Placeholder for customer logos */}
              <div className="flex items-center justify-center space-x-2">
                <BuildingOfficeIcon className="h-8 w-8 text-teal-600" />
                <span className="font-semibold text-teal-600">Enterprise Co.</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <GlobeAltIcon className="h-8 w-8 text-teal-600" />
                <span className="font-semibold text-teal-600">Global Corp</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <ComputerDesktopIcon className="h-8 w-8 text-teal-600" />
                <span className="font-semibold text-teal-600">TechStart</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <DevicePhoneMobileIcon className="h-8 w-8 text-teal-600" />
                <span className="font-semibold text-teal-600">MobileFirst</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution */}
      <section className="py-24 bg-amber-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-teal-900 mb-4">
              Stop Drowning in Customer Feedback
            </h2>
            <p className="text-xl text-teal-700 max-w-3xl mx-auto">
              Many businesses struggle to make sense of scattered feedback across multiple channels
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-teal-900 mb-6">The Problem</h3>
              <div className="space-y-4">
                {[
                  "Feedback scattered across emails, reviews, surveys, and social media",
                  "Hours spent manually reading and categorizing responses",
                  "Missing critical insights that could improve your business",
                  "Unable to respond quickly to customer concerns"
                ].map((problem, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    </div>
                    <p className="text-teal-800">{problem}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-teal-900 mb-6">The Solution</h3>
              <div className="space-y-4">
                {[
                  "Centralize all feedback in one intelligent platform",
                  "AI instantly analyzes sentiment and extracts key topics",
                  "Get actionable insights with beautiful, easy-to-understand dashboards",
                  "Respond faster with automated alerts and prioritization"
                ].map((solution, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <CheckIconSolid className="w-6 h-6 text-amber-600 mt-0.5" />
                    </div>
                    <p className="text-teal-800">{solution}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-teal-900 mb-4">
              Powerful Features Built for Results
            </h2>
            <p className="text-xl text-teal-700 max-w-3xl mx-auto">
              Everything you need to transform customer feedback into actionable business insights
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              // Custom icons for specific features
              const customIcons = [
                { component: AIIcon, bg: 'bg-gradient-to-br from-teal-100 to-teal-200', border: 'hover:border-teal-300', shadow: 'hover:shadow-teal-200/50' },
                { component: AnalyticsIcon, bg: 'bg-gradient-to-br from-amber-100 to-amber-200', border: 'hover:border-amber-300', shadow: 'hover:shadow-amber-200/50' },
                { component: DataProcessingIcon, bg: 'bg-gradient-to-br from-stone-100 to-stone-200', border: 'hover:border-stone-300', shadow: 'hover:shadow-stone-200/50' },
                { component: SecurityIcon, bg: 'bg-gradient-to-br from-teal-200 to-cyan-200', border: 'hover:border-teal-400', shadow: 'hover:shadow-teal-300/50' },
                { component: AnalyticsIcon, bg: 'bg-gradient-to-br from-amber-200 to-orange-200', border: 'hover:border-amber-400', shadow: 'hover:shadow-amber-300/50' },
                { component: DataProcessingIcon, bg: 'bg-gradient-to-br from-stone-200 to-neutral-200', border: 'hover:border-stone-400', shadow: 'hover:shadow-stone-300/50' }
              ];
              const iconConfig = customIcons[index % customIcons.length];
              const IconComponent = iconConfig.component;
              
              return (
                <div key={index} className={`group p-6 bg-stone-100/50 backdrop-blur-sm rounded-xl border border-teal-200 ${iconConfig.border} hover:shadow-xl ${iconConfig.shadow} transition-all duration-300 transform hover:-translate-y-1`}>
                  <div className={`inline-flex items-center justify-center w-16 h-16 ${iconConfig.bg} rounded-lg mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-12 h-12 text-teal-700" />
                  </div>
                  <h3 className="text-lg font-semibold text-teal-900 mb-2">{feature.title}</h3>
                  <p className="text-teal-800 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-amber-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-teal-900 mb-4">
              How FeedbackSense Works
            </h2>
            <p className="text-xl text-teal-700">Get from feedback chaos to actionable insights in three simple steps</p>
          </div>
          
          {/* Large AI Process Illustration */}
          <div className="mb-16 flex justify-center">
            <AIProcessIllustration className="w-full max-w-5xl h-80" />
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Collect & Import",
                description: "Connect your feedback sources or upload CSV files. Support for email, reviews, surveys, social media, and more.",
                icon: CloudArrowUpIcon
              },
              {
                step: "2",
                title: "AI Analysis",
                description: "Our advanced AI instantly analyzes sentiment, extracts topics, and identifies patterns across all your feedback.",
                icon: SparklesIcon
              },
              {
                step: "3",
                title: "Actionable Insights",
                description: "View trends, identify issues, and get recommendations through intuitive dashboards and automated reports.",
                icon: EyeIcon
              }
            ].map((step, index) => (
              <div key={index} className="text-center relative">
                {index < 2 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-teal-200 z-0">
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
                      <ArrowRightIcon className="w-4 h-4 text-teal-400" />
                    </div>
                  </div>
                )}
                <div className="relative z-10 inline-flex items-center justify-center w-16 h-16 bg-teal-700 text-stone-50 rounded-full text-xl font-bold mb-4">
                  {step.step}
                </div>
                <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 rounded-lg mb-4">
                  <step.icon className="h-6 w-6 text-teal-700" />
                </div>
                <h3 className="text-xl font-semibold text-teal-900 mb-2">{step.title}</h3>
                <p className="text-teal-800 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-teal-900 mb-4">
              Drive Real Business Results
            </h2>
            <p className="text-xl text-teal-700">See the impact on your business from day one</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 bg-stone-100/50 backdrop-blur-sm rounded-lg border border-teal-100 hover:border-teal-200 hover:shadow-sm transition-all duration-200">
                <CheckIconSolid className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
                <span className="text-lg text-teal-800">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof with Dashboard Mockup */}
      <section className="py-24 bg-amber-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-teal-900 mb-4">
              Join Growing Businesses Worldwide
            </h2>
            <p className="text-xl text-teal-700">Businesses trust FeedbackSense to understand their customers better</p>
          </div>
          
          {/* Large Dashboard Mockup */}
          <div className="mb-16 flex justify-center">
            <DashboardMockup className="w-full max-w-6xl h-96" />
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                metric: "90%",
                label: "Time Saved",
                description: "Reduce manual feedback analysis time"
              },
              {
                metric: "24hrs",
                label: "Faster Response",
                description: "Average time to identify critical issues"
              },
              {
                metric: "99.9%",
                label: "Uptime",
                description: "Reliable platform you can count on"
              }
            ].map((stat, index) => (
              <div key={index} className="text-center p-8 bg-stone-100/50 backdrop-blur-sm rounded-xl border border-teal-200">
                <div className="text-4xl font-bold text-teal-700 mb-2">{stat.metric}</div>
                <div className="text-lg font-semibold text-teal-900 mb-1">{stat.label}</div>
                <div className="text-teal-800">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-teal-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-teal-700">Choose the plan that fits your business. Start free, upgrade as you grow.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => {
              const isPopular = plan.popular;
              const borderColor = isPopular ? 'border-teal-600' : 'border-teal-200 hover:border-teal-300';
              const bgColor = isPopular ? 'bg-gradient-to-br from-teal-50 to-amber-50' : 'bg-stone-100/50 hover:bg-gradient-to-br hover:from-stone-100 hover:to-amber-50';
              const shadowColor = isPopular ? 'shadow-teal-200/50' : 'hover:shadow-teal-100/50';
              
              return (
                <div key={index} className={`relative p-8 rounded-xl border-2 transition-all duration-300 transform hover:-translate-y-1 ${borderColor} ${bgColor} ${shadowColor} hover:shadow-xl ${isPopular ? 'scale-105' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-teal-600 to-teal-700 text-stone-50 px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                        ⭐ Most Popular
                      </span>
                    </div>
                  )}
                
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-teal-900 mb-2">{plan.name}</h3>
                    <div className="mb-1">
                      <span className="text-4xl font-bold text-teal-900">{plan.price}</span>
                      <span className="text-lg text-teal-700">{plan.period}</span>
                    </div>
                    <p className="text-teal-700 mb-8">{plan.description}</p>
                    
                    <ul className="space-y-4 mb-8 text-left">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start space-x-3">
                          <CheckIconSolid className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <span className="text-teal-800">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Link
                      href={plan.ctaLink}
                      className={`block w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                        plan.popular
                          ? 'bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-800 hover:to-teal-900 text-stone-50 shadow-lg hover:shadow-teal-500/25'
                          : 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-stone-50 shadow-md hover:shadow-lg'
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-teal-700 mb-4">Need a custom solution for your enterprise?</p>
            <Link
              href="/contact"
              className="inline-flex items-center text-teal-700 hover:text-teal-800 font-semibold"
            >
              Contact our sales team
              <ArrowRightIcon className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-amber-50/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-teal-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-teal-700">Everything you need to know about FeedbackSense</p>
          </div>
          
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div key={index} className="bg-stone-100/50 backdrop-blur-sm rounded-lg border border-teal-200 overflow-hidden">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-teal-50/50 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-teal-900 pr-4">{item.question}</h3>
                  <ChevronDownIcon
                    className={`h-5 w-5 text-teal-600 transition-transform ${
                      openFaq === index ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-teal-800 leading-relaxed">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Trust */}
      <section className="py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-teal-900 mb-4">
              Enterprise-Grade Security & Compliance
            </h2>
            <p className="text-xl text-teal-700">Your data security is our top priority</p>
          </div>
          
          {/* Large Security Illustration */}
          <div className="mb-16 flex justify-center">
            <SecurityIllustration className="w-full max-w-4xl h-64" />
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: ShieldCheckIcon, title: "SOC 2 Compliant", description: "Enterprise security standards" },
              { icon: LockClosedIcon, title: "Data Encryption", description: "End-to-end encryption at rest and in transit" },
              { icon: GlobeAltIcon, title: "GDPR Ready", description: "Full compliance with data protection regulations" },
              { icon: ClockIcon, title: "99.9% Uptime", description: "Reliable platform with guaranteed availability" }
            ].map((item, index) => (
              <div key={index} className="text-center p-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 rounded-lg mb-4">
                  <item.icon className="h-6 w-6 text-teal-700" />
                </div>
                <h3 className="text-lg font-semibold text-teal-900 mb-2">{item.title}</h3>
                <p className="text-teal-800 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-teal-800 via-teal-700 to-teal-600 text-stone-50 py-24 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-amber-400/20 to-stone-300/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-teal-400/20 to-teal-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        </div>
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Customer Insights?
          </h2>
          <p className="text-xl text-stone-100/90 mb-8 leading-relaxed">
            Join businesses already making smarter decisions with AI-powered feedback analysis.
            Start your free trial today and see the difference in minutes.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <Link
              href="/signup"
              className="bg-gradient-to-r from-stone-100 to-amber-100 text-teal-800 hover:from-stone-200 hover:to-amber-200 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 inline-flex items-center justify-center shadow-2xl hover:shadow-stone-500/25 transform hover:-translate-y-1 hover:scale-105"
            >
              Start Free Trial - No Credit Card Required
              <ArrowRightIcon className="ml-2 h-5 w-5 text-teal-800" />
            </Link>
          </div>
          
          <div className="flex items-center justify-center space-x-6 text-sm text-stone-200/80">
            <div className="flex items-center">
              <CheckIconSolid className="h-4 w-4 text-amber-300 mr-1" />
              14-day free trial
            </div>
            <div className="flex items-center">
              <CheckIconSolid className="h-4 w-4 text-amber-300 mr-1" />
              Cancel anytime
            </div>
            <div className="flex items-center">
              <CheckIconSolid className="h-4 w-4 text-amber-300 mr-1" />
              Setup in 2 minutes
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-teal-900 via-teal-800 to-stone-800 text-stone-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <BrandLogo className="w-8 h-8 text-stone-200" />
                <h3 className="text-2xl font-bold bg-gradient-to-r from-stone-200 via-amber-200 to-stone-100 bg-clip-text text-transparent">
                  FeedbackSense
                </h3>
              </div>
              <p className="text-stone-300 mb-4 max-w-md">
                Transform customer feedback into business growth with AI-powered sentiment analysis and actionable insights.
              </p>
              <div className="flex space-x-4">
                {/* Social media placeholder icons */}
                <div className="w-8 h-8 bg-teal-800 rounded-lg flex items-center justify-center hover:bg-teal-700 transition-colors cursor-pointer">
                  <span className="text-sm">𝕏</span>
                </div>
                <div className="w-8 h-8 bg-teal-800 rounded-lg flex items-center justify-center hover:bg-teal-700 transition-colors cursor-pointer">
                  <span className="text-sm">in</span>
                </div>
                <div className="w-8 h-8 bg-teal-800 rounded-lg flex items-center justify-center hover:bg-teal-700 transition-colors cursor-pointer">
                  <span className="text-sm">gh</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-stone-100">Product</h4>
              <ul className="space-y-2 text-stone-300">
                <li><Link href="/features" className="hover:text-stone-100 transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-stone-100 transition-colors">Pricing</Link></li>
                <li><Link href="/demo" className="hover:text-stone-100 transition-colors">Demo</Link></li>
                <li><Link href="/integrations" className="hover:text-stone-100 transition-colors">Integrations</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-stone-100">Company</h4>
              <ul className="space-y-2 text-stone-300">
                <li><Link href="/about" className="hover:text-stone-100 transition-colors">About</Link></li>
                <li><Link href="/contact" className="hover:text-stone-100 transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-stone-100 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-stone-100 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-teal-700 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-stone-300 text-sm">
              &copy; 2024 FeedbackSense. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0 text-sm text-stone-300">
              <Link href="/security" className="hover:text-stone-100 transition-colors">Security</Link>
              <Link href="/status" className="hover:text-stone-100 transition-colors">Status</Link>
              <Link href="/help" className="hover:text-stone-100 transition-colors">Help Center</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Demo Modal */}
      <DemoModal isOpen={showDemo} onClose={() => setShowDemo(false)} />
    </div>
  )
}
