/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gov: {
          navy: '#0A2540',
          'navy-dark': '#061729',
          blue: '#1B365D',
          'blue-light': '#254E82',
          'blue-50': '#EFF6FF',
          saffron: '#E65100',
          'saffron-light': '#FFF3E0',
          'saffron-amber': '#FF9933',
          green: '#138808',
          'green-light': '#E8F5E9',
          'green-dark': '#0d5c05',
          gold: '#B8860B',
          gray: '#475569',
          border: '#CBD5E1',
          bg: '#F8FAFC',
          card: '#FFFFFF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'h1': ['var(--font-size-h1)', { lineHeight: 'var(--line-height-h1)', fontWeight: '700' }],
        'h2': ['var(--font-size-h2)', { lineHeight: 'var(--line-height-h2)', fontWeight: '700' }],
        'h3': ['var(--font-size-h3)', { lineHeight: 'var(--line-height-h3)', fontWeight: '600' }],
        'body': ['var(--font-size-body)', { lineHeight: 'var(--line-height-body)' }],
        'label': ['var(--font-size-label)', { lineHeight: 'var(--line-height-label)', fontWeight: '600' }],
        'button': ['var(--font-size-button)', { lineHeight: 'var(--line-height-button)', fontWeight: '600' }],
        'table': ['var(--font-size-table)', { lineHeight: '1.4' }],
        'id': ['var(--font-size-id)', { fontWeight: '600' }],
        'group': ['var(--font-size-group-heading)', { fontWeight: '600' }],
        'helper': ['var(--font-size-helper)', { lineHeight: 'var(--line-height-helper)' }],
        'badge': ['var(--font-size-badge)', { fontWeight: '600' }],
      },
      boxShadow: {
        'gov': '0 1px 3px 0 rgba(10, 37, 64, 0.08), 0 1px 2px -1px rgba(10, 37, 64, 0.08)',
        'gov-md': '0 4px 6px -1px rgba(10, 37, 64, 0.1), 0 2px 4px -2px rgba(10, 37, 64, 0.08)',
        'gov-lg': '0 10px 15px -3px rgba(10, 37, 64, 0.12), 0 4px 6px -4px rgba(10, 37, 64, 0.08)',
      },
    },
  },
  plugins: [],
};
