/**
 * Marketing Site - Homepage
 * 
 * Enhanced marketing page with personalization, A/B testing, and CMS integration
 */

import { Suspense } from 'react';
import { PersonalizedHero } from '@/components/PersonalizedHero';
import { ProductShowcase } from '@/components/ProductShowcase';
import { TestimonialsSection } from '@/components/TestimonialsSection';
import { CTASection } from '@/components/CTASection';
import { getPersonalizedContent } from '@/lib/personalization';
import { cookies } from 'next/headers';

export default async function HomePage() {
  // Get user context from cookies/headers
  const userContext = await getUserContext();
  
  // Fetch personalized content
  const personalizedContent = await getPersonalizedContent('homepage', userContext);

  return (
    <main className="min-h-screen">
      {/* Personalized Hero Section */}
      <Suspense fallback={<HeroSkeleton />}>
        <PersonalizedHero
          variant={personalizedContent.variant}
          content={personalizedContent.content.hero}
          userContext={userContext}
        />
      </Suspense>

      {/* Product Showcase with A/B Testing */}
      <Suspense fallback={<ProductSkeleton />}>
        <ProductShowcase
          products={personalizedContent.content.products}
          experiment={personalizedContent.content.experiment}
        />
      </Suspense>

      {/* Social Proof */}
      <Suspense fallback={<TestimonialsSkeleton />}>
        <TestimonialsSection
          testimonials={personalizedContent.content.testimonials}
        />
      </Suspense>

      {/* Personalized CTA */}
      <CTASection
        content={personalizedContent.content.cta}
        userRole={userContext.role}
      />

      {/* Recommendations based on intent signals */}
      {personalizedContent.recommendations.length > 0 && (
        <RecommendationsSection
          recommendations={personalizedContent.recommendations}
        />
      )}
    </main>
  );
}

async function getUserContext() {
  const cookieStore = cookies();
  
  return {
    tenantId: cookieStore.get('tenant_id')?.value || 'anonymous',
    userId: cookieStore.get('user_id')?.value,
    role: cookieStore.get('user_role')?.value as any,
    region: cookieStore.get('region')?.value || 'us',
    language: cookieStore.get('language')?.value || 'en',
    deviceType: getDeviceType() as any,
    intentSignals: getIntentSignals(cookieStore)
  };
}

function getDeviceType(): string {
  // In production, use user-agent parsing
  return 'desktop';
}

function getIntentSignals(cookieStore: any): string[] {
  const signals = cookieStore.get('intent_signals')?.value;
  return signals ? JSON.parse(signals) : [];
}

// Skeleton components for loading states
function HeroSkeleton() {
  return (
    <div className="h-screen w-full animate-pulse bg-gradient-to-br from-gray-100 to-gray-200" />
  );
}

function ProductSkeleton() {
  return (
    <div className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

function TestimonialsSkeleton() {
  return (
    <div className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

function RecommendationsSection({ recommendations }: { recommendations: any[] }) {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          Recommended for You
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="text-sm text-blue-600 font-semibold mb-2">
                {rec.type.toUpperCase()}
              </div>
              <h3 className="text-xl font-bold mb-2">{rec.title}</h3>
              <p className="text-gray-600 mb-4">{rec.description}</p>
              <div className="text-xs text-gray-500 italic">
                {rec.reason}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export const metadata = {
  title: 'AKA Industries - Enterprise Technology Platform',
  description: 'Build the future with our enterprise-grade platform for advanced technology solutions',
};
