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
export type OnboardingStep = 'profile' | 'verification' | 'app-submission' | 'revenue-share' | 'review' | 'complete';
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
export declare class PartnerOnboardingFlow {
    private state;
    private readonly API_BASE;
    constructor();
    /**
     * Get current onboarding state
     */
    getState(): OnboardingState;
    /**
     * Start onboarding process
     */
    start(): Promise<void>;
    /**
     * Submit partner profile
     */
    submitProfile(profile: PartnerProfile): Promise<void>;
    /**
     * Verify partner identity
     */
    verifyIdentity(verificationType: 'email' | 'phone' | 'business'): Promise<void>;
    /**
     * Submit app for marketplace
     */
    submitApp(app: AppSubmission): Promise<void>;
    /**
     * Configure revenue share agreement
     */
    configureRevenueShare(agreement: RevenueShareAgreement): Promise<void>;
    /**
     * Complete onboarding
     */
    complete(): Promise<void>;
    /**
     * Go to previous step
     */
    goToPreviousStep(): void;
    private validateProfile;
    private validateAppSubmission;
    private validateRevenueShare;
    private validateWebhook;
    private uploadFile;
    private allVerificationsComplete;
    private canComplete;
    private isValidEmail;
    private saveState;
    private loadState;
}
export default PartnerOnboardingFlow;
//# sourceMappingURL=onboarding-flow.d.ts.map