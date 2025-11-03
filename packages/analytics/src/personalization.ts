/**
 * Server-side Personalization Engine
 * 
 * Provides personalized content and experiences based on user context,
 * role, region, and intent signals.
 */

export interface UserContext {
  tenantId: string;
  userId?: string;
  role?: 'admin' | 'developer' | 'viewer' | 'partner';
  region: string;
  language: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  intentSignals: string[];
  sessionData?: Record<string, any>;
}

export interface PersonalizedContent {
  id: string;
  content: any;
  variant?: string;
  recommendations: Recommendation[];
  metadata: {
    personalized: boolean;
    context: UserContext;
    timestamp: Date;
  };
}

export interface Recommendation {
  type: 'product' | 'article' | 'feature' | 'action';
  id: string;
  title: string;
  description: string;
  score: number;
  reason: string;
}

export class PersonalizationEngine {
  private cache: Map<string, PersonalizedContent> = new Map();
  private readonly CACHE_TTL = 300000; // 5 minutes

  /**
   * Get personalized content for a user
   */
  async getPersonalizedContent(
    contentId: string,
    context: UserContext
  ): Promise<PersonalizedContent> {
    // Check cache
    const cacheKey = this.getCacheKey(contentId, context);
    const cached = this.cache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      return cached;
    }

    // Fetch base content
    const baseContent = await this.fetchContent(contentId);

    // Apply personalizations
    const personalizedContent = await this.applyPersonalizations(
      baseContent,
      context
    );

    // Get recommendations
    const recommendations = await this.getRecommendations(context);

    const result: PersonalizedContent = {
      id: contentId,
      content: personalizedContent.content,
      variant: personalizedContent.variant,
      recommendations,
      metadata: {
        personalized: true,
        context,
        timestamp: new Date()
      }
    };

    // Cache result
    this.cache.set(cacheKey, result);

    return result;
  }

  /**
   * Apply personalization rules based on context
   */
  private async applyPersonalizations(
    content: any,
    context: UserContext
  ): Promise<{ content: any; variant?: string }> {
    let personalizedContent = { ...content };
    let variant: string | undefined;

    // Regional personalization
    if (content.variants?.[context.region]) {
      personalizedContent = {
        ...personalizedContent,
        ...content.variants[context.region]
      };
      variant = `region-${context.region}`;
    }

    // Role-based personalization
    if (context.role && content.roleVariants?.[context.role]) {
      personalizedContent = {
        ...personalizedContent,
        ...content.roleVariants[context.role]
      };
      variant = `role-${context.role}`;
    }

    // Language localization
    if (content.translations?.[context.language]) {
      personalizedContent = {
        ...personalizedContent,
        ...content.translations[context.language]
      };
    }

    // Device-specific optimizations
    if (context.deviceType === 'mobile' && content.mobileOptimized) {
      personalizedContent = {
        ...personalizedContent,
        ...content.mobileOptimized
      };
    }

    // A/B test variant selection
    if (content.experiments?.length > 0) {
      const experiment = this.selectExperiment(content.experiments, context);
      if (experiment) {
        personalizedContent = {
          ...personalizedContent,
          ...experiment.variant
        };
        variant = `experiment-${experiment.id}`;
      }
    }

    return { content: personalizedContent, variant };
  }

  /**
   * Get AI-powered recommendations
   */
  private async getRecommendations(
    context: UserContext
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Intent-based recommendations
    for (const signal of context.intentSignals) {
      const intentRecs = await this.getIntentBasedRecommendations(
        signal,
        context
      );
      recommendations.push(...intentRecs);
    }

    // Role-based recommendations
    if (context.role) {
      const roleRecs = await this.getRoleBasedRecommendations(
        context.role,
        context
      );
      recommendations.push(...roleRecs);
    }

    // Collaborative filtering recommendations
    if (context.userId) {
      const collabRecs = await this.getCollaborativeRecommendations(
        context.userId,
        context.tenantId
      );
      recommendations.push(...collabRecs);
    }

    // Sort by score and limit
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  /**
   * Get recommendations based on intent signals
   */
  private async getIntentBasedRecommendations(
    signal: string,
    context: UserContext
  ): Promise<Recommendation[]> {
    const intentMap: Record<string, Recommendation[]> = {
      'pricing': [
        {
          type: 'action',
          id: 'view-pricing',
          title: 'View Pricing Plans',
          description: 'Compare plans and find the best fit for your needs',
          score: 0.9,
          reason: 'User showed interest in pricing'
        },
        {
          type: 'action',
          id: 'contact-sales',
          title: 'Contact Sales',
          description: 'Get a custom quote for enterprise plans',
          score: 0.8,
          reason: 'User showed interest in pricing'
        }
      ],
      'api': [
        {
          type: 'article',
          id: 'api-quickstart',
          title: 'API Quickstart Guide',
          description: 'Get started with our API in 5 minutes',
          score: 0.95,
          reason: 'User showed interest in API'
        },
        {
          type: 'feature',
          id: 'api-explorer',
          title: 'Interactive API Explorer',
          description: 'Test API endpoints directly in your browser',
          score: 0.85,
          reason: 'User showed interest in API'
        }
      ]
    };

    return intentMap[signal] || [];
  }

  /**
   * Get role-specific recommendations
   */
  private async getRoleBasedRecommendations(
    role: string,
    context: UserContext
  ): Promise<Recommendation[]> {
    const roleMap: Record<string, Recommendation[]> = {
      'developer': [
        {
          type: 'article',
          id: 'sdk-docs',
          title: 'SDK Documentation',
          description: 'Integrate our platform with your application',
          score: 0.9,
          reason: 'Recommended for developers'
        }
      ],
      'admin': [
        {
          type: 'feature',
          id: 'user-management',
          title: 'User Management',
          description: 'Manage team members and permissions',
          score: 0.85,
          reason: 'Recommended for admins'
        }
      ],
      'partner': [
        {
          type: 'product',
          id: 'partner-program',
          title: 'Partner Program',
          description: 'Learn about our partner benefits and revenue share',
          score: 0.9,
          reason: 'Recommended for partners'
        }
      ]
    };

    return roleMap[role] || [];
  }

  /**
   * Get collaborative filtering recommendations
   */
  private async getCollaborativeRecommendations(
    userId: string,
    tenantId: string
  ): Promise<Recommendation[]> {
    // In production, this would use ML models or vector similarity
    // For now, return empty array
    return [];
  }

  /**
   * Select A/B test experiment variant
   */
  private selectExperiment(experiments: any[], context: UserContext): any {
    // Deterministic assignment based on user ID
    if (!context.userId) return null;

    const activeExperiments = experiments.filter(exp => exp.active);
    if (activeExperiments.length === 0) return null;

    // Hash user ID to get consistent variant
    const hash = this.hashString(context.userId);
    const experiment = activeExperiments[hash % activeExperiments.length];

    // Check if user qualifies for experiment
    if (experiment.targetAudience) {
      if (!this.matchesAudience(context, experiment.targetAudience)) {
        return null;
      }
    }

    return experiment;
  }

  /**
   * Check if user matches target audience
   */
  private matchesAudience(context: UserContext, audience: any): boolean {
    if (audience.roles && !audience.roles.includes(context.role)) {
      return false;
    }

    if (audience.regions && !audience.regions.includes(context.region)) {
      return false;
    }

    return true;
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Fetch content from CMS or database
   */
  private async fetchContent(contentId: string): Promise<any> {
    // In production, this would fetch from CMS (Contentful, Strapi, etc.)
    return {
      id: contentId,
      title: 'Default Content',
      body: 'This is default content',
      variants: {},
      roleVariants: {},
      translations: {},
      experiments: []
    };
  }

  /**
   * Generate cache key
   */
  private getCacheKey(contentId: string, context: UserContext): string {
    return `${contentId}:${context.tenantId}:${context.userId}:${context.region}:${context.role}`;
  }

  /**
   * Check if cached content is still valid
   */
  private isCacheValid(content: PersonalizedContent): boolean {
    const age = Date.now() - content.metadata.timestamp.getTime();
    return age < this.CACHE_TTL;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export default PersonalizationEngine;
