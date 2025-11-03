/**
 * Partner Onboarding Flow
 * 
 * Multi-step onboarding process for partners joining the marketplace
 */

export interface PartnerProfile {
  companyName: string;
  contactEmail: string;
  contactName: string;
  website?: string;
  description: string;
  category: 'integration' | 'consulting' | 'reseller' | 'technology';
  size: 'startup' | 'smb' | 'enterprise';
  logo?: File;
}

export interface AppSubmission {
  name: string;
  description: string;
  category: string;
  webhookUrl?: string;
  oauthConfig?: {
    clientId: string;
    redirectUri: string;
    scopes: string[];
  };
  pricing: {
    model: 'free' | 'paid' | 'freemium';
    price?: number;
    currency?: string;
  };
  screenshots: File[];
  documentation?: string;
}

export interface RevenueShareAgreement {
  percentage: number;
  paymentMethod: 'stripe' | 'paypal' | 'wire';
  paymentSchedule: 'monthly' | 'quarterly';
  minimumPayout: number;
  taxDetails: {
    country: string;
    taxId?: string;
    w9Form?: File;
  };
}

export type OnboardingStep = 
  | 'profile'
  | 'verification'
  | 'app-submission'
  | 'revenue-share'
  | 'review'
  | 'complete';

export interface OnboardingState {
  currentStep: OnboardingStep;
  profile?: PartnerProfile;
  verification?: {
    emailVerified: boolean;
    phoneVerified: boolean;
    businessVerified: boolean;
  };
  appSubmission?: AppSubmission;
  revenueShare?: RevenueShareAgreement;
  completed: boolean;
}

export class PartnerOnboardingFlow {
  private state: OnboardingState;
  private readonly API_BASE = '/api/partners';

  constructor() {
    this.state = {
      currentStep: 'profile',
      completed: false
    };
  }

  /**
   * Get current onboarding state
   */
  getState(): OnboardingState {
    return { ...this.state };
  }

  /**
   * Start onboarding process
   */
  async start(): Promise<void> {
    // Load existing state if any
    const savedState = await this.loadState();
    if (savedState) {
      this.state = savedState;
    }
  }

  /**
   * Submit partner profile
   */
  async submitProfile(profile: PartnerProfile): Promise<void> {
    try {
      // Validate profile
      this.validateProfile(profile);

      // Upload logo if provided
      if (profile.logo) {
        const logoUrl = await this.uploadFile(profile.logo);
        profile = { ...profile, logo: logoUrl as any };
      }

      // Save profile
      const response = await fetch(`${this.API_BASE}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });

      if (!response.ok) {
        throw new Error('Failed to submit profile');
      }

      // Update state
      this.state.profile = profile;
      this.state.currentStep = 'verification';
      await this.saveState();
    } catch (error) {
      throw new Error(`Profile submission failed: ${error.message}`);
    }
  }

  /**
   * Verify partner identity
   */
  async verifyIdentity(verificationType: 'email' | 'phone' | 'business'): Promise<void> {
    const response = await fetch(`${this.API_BASE}/verify/${verificationType}`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`Verification failed for ${verificationType}`);
    }

    // Update verification status
    if (!this.state.verification) {
      this.state.verification = {
        emailVerified: false,
        phoneVerified: false,
        businessVerified: false
      };
    }

    this.state.verification[`${verificationType}Verified`] = true;

    // Check if all verifications are complete
    if (this.allVerificationsComplete()) {
      this.state.currentStep = 'app-submission';
    }

    await this.saveState();
  }

  /**
   * Submit app for marketplace
   */
  async submitApp(app: AppSubmission): Promise<void> {
    try {
      // Validate app submission
      this.validateAppSubmission(app);

      // Upload screenshots
      const screenshotUrls = await Promise.all(
        app.screenshots.map(file => this.uploadFile(file))
      );
      app.screenshots = screenshotUrls as any;

      // Validate webhook URL if provided
      if (app.webhookUrl) {
        await this.validateWebhook(app.webhookUrl);
      }

      // Submit app
      const response = await fetch(`${this.API_BASE}/apps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(app)
      });

      if (!response.ok) {
        throw new Error('Failed to submit app');
      }

      this.state.appSubmission = app;
      this.state.currentStep = 'revenue-share';
      await this.saveState();
    } catch (error) {
      throw new Error(`App submission failed: ${error.message}`);
    }
  }

  /**
   * Configure revenue share agreement
   */
  async configureRevenueShare(agreement: RevenueShareAgreement): Promise<void> {
    try {
      // Validate agreement
      this.validateRevenueShare(agreement);

      // Upload tax documents if provided
      if (agreement.taxDetails.w9Form) {
        const documentUrl = await this.uploadFile(agreement.taxDetails.w9Form);
        agreement.taxDetails.w9Form = documentUrl as any;
      }

      // Submit agreement
      const response = await fetch(`${this.API_BASE}/revenue-share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agreement)
      });

      if (!response.ok) {
        throw new Error('Failed to submit revenue share agreement');
      }

      this.state.revenueShare = agreement;
      this.state.currentStep = 'review';
      await this.saveState();
    } catch (error) {
      throw new Error(`Revenue share configuration failed: ${error.message}`);
    }
  }

  /**
   * Complete onboarding
   */
  async complete(): Promise<void> {
    // Verify all steps are complete
    if (!this.canComplete()) {
      throw new Error('Cannot complete onboarding: missing required steps');
    }

    // Submit for final review
    const response = await fetch(`${this.API_BASE}/onboarding/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.state)
    });

    if (!response.ok) {
      throw new Error('Failed to complete onboarding');
    }

    this.state.completed = true;
    this.state.currentStep = 'complete';
    await this.saveState();
  }

  /**
   * Go to previous step
   */
  goToPreviousStep(): void {
    const steps: OnboardingStep[] = [
      'profile',
      'verification',
      'app-submission',
      'revenue-share',
      'review',
      'complete'
    ];

    const currentIndex = steps.indexOf(this.state.currentStep);
    if (currentIndex > 0) {
      this.state.currentStep = steps[currentIndex - 1];
    }
  }

  // Private helper methods

  private validateProfile(profile: PartnerProfile): void {
    if (!profile.companyName || profile.companyName.length < 2) {
      throw new Error('Company name is required');
    }

    if (!profile.contactEmail || !this.isValidEmail(profile.contactEmail)) {
      throw new Error('Valid email is required');
    }

    if (!profile.description || profile.description.length < 50) {
      throw new Error('Description must be at least 50 characters');
    }
  }

  private validateAppSubmission(app: AppSubmission): void {
    if (!app.name || app.name.length < 3) {
      throw new Error('App name is required');
    }

    if (!app.description || app.description.length < 100) {
      throw new Error('App description must be at least 100 characters');
    }

    if (!app.screenshots || app.screenshots.length < 2) {
      throw new Error('At least 2 screenshots are required');
    }

    if (app.pricing.model === 'paid' && !app.pricing.price) {
      throw new Error('Price is required for paid apps');
    }
  }

  private validateRevenueShare(agreement: RevenueShareAgreement): void {
    if (agreement.percentage < 0 || agreement.percentage > 100) {
      throw new Error('Revenue share percentage must be between 0 and 100');
    }

    if (agreement.minimumPayout < 0) {
      throw new Error('Minimum payout must be non-negative');
    }

    if (!agreement.taxDetails.country) {
      throw new Error('Tax country is required');
    }
  }

  private async validateWebhook(url: string): Promise<void> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'ping' })
      });

      if (!response.ok) {
        throw new Error('Webhook validation failed');
      }
    } catch (error) {
      throw new Error(`Invalid webhook URL: ${error.message}`);
    }
  }

  private async uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.API_BASE}/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('File upload failed');
    }

    const data = await response.json();
    return data.url;
  }

  private allVerificationsComplete(): boolean {
    return !!(
      this.state.verification?.emailVerified &&
      this.state.verification?.phoneVerified &&
      this.state.verification?.businessVerified
    );
  }

  private canComplete(): boolean {
    return !!(
      this.state.profile &&
      this.allVerificationsComplete() &&
      this.state.appSubmission &&
      this.state.revenueShare
    );
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private async saveState(): Promise<void> {
    try {
      await fetch(`${this.API_BASE}/onboarding/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.state)
      });
    } catch (error) {
      console.error('Failed to save onboarding state:', error);
    }
  }

  private async loadState(): Promise<OnboardingState | null> {
    try {
      const response = await fetch(`${this.API_BASE}/onboarding/state`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to load onboarding state:', error);
    }
    return null;
  }
}

export default PartnerOnboardingFlow;
