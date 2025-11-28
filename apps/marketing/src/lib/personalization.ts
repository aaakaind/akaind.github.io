export async function getPersonalizedContent(_page: string, _context: any) {
  return {
    variant: 'default',
    content: {
      hero: {},
      products: [],
      testimonials: [],
      cta: {},
      experiment: null,
    },
    recommendations: [],
  };
}
