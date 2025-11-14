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
        'chat-bg': '#f7f7f8',
        'chat-user': '#ffffff',
        'chat-assistant': '#f7f7f8',
        'chat-border': '#e5e7eb',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            maxWidth: 'none',
          },
        },
        invert: {
          css: {
            '--tw-prose-body': theme('colors.gray[300]'),
            '--tw-prose-headings': theme('colors.white'),
            '--tw-prose-links': theme('colors.blue[400]'),
            '--tw-prose-bold': theme('colors.white'),
            '--tw-prose-code': theme('colors.gray[300]'),
            '--tw-prose-pre-bg': theme('colors.gray[800]'),
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
