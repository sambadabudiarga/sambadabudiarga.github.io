import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Engineering Notebook',
  description:
    'Production troubleshooting, root cause analysis, and operational lessons learned from real-world systems.',
  lang: 'en-US',
  base: '/',
  cleanUrls: true,
  srcExclude: ['templates/**'],
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
  ],
  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'About', link: '/about' },
      { text: 'Notebook', link: '/notebook/' },
      { text: 'Experience', link: '/experience/' },
      { text: 'Contact', link: '/contact' },
      { text: 'Uses', link: '/uses' },
    ],
    sidebar: {
      '/experience/': [
        {
          text: 'Experience',
          items: [
            { text: 'Overview', link: '/experience/' },
            { text: 'Resume', link: '/experience/resume' },
            { text: 'Talks & Mentoring', link: '/experience/talks' },
          ],
        },
      ],
      '/notebook/incidents/': [
        {
          text: 'Incident Library',
          items: [
            { text: 'Overview', link: '/notebook/incidents/' },
            { text: 'Applications', link: '/notebook/incidents/applications/' },
            { text: 'Infrastructure', link: '/notebook/incidents/infrastructure/' },
            { text: 'Integrations', link: '/notebook/incidents/integrations/' },
            { text: 'Security', link: '/notebook/incidents/security/' },
            { text: 'Data', link: '/notebook/incidents/data/' },
          ],
        },
      ],
      '/notebook/': [
        {
          text: 'Notebook',
          items: [
            { text: 'Overview', link: '/notebook/' },
            { text: 'Incident Library', link: '/notebook/incidents/' },
            { text: 'Case Studies', link: '/notebook/case-studies/' },
            { text: 'Technical Notes', link: '/notebook/notes/' },
            { text: 'Runbooks', link: '/notebook/runbooks/' },
            { text: 'Architecture Notes', link: '/notebook/architecture/' },
            { text: 'Documentation Samples', link: '/notebook/documentation/' },
          ],
        },
      ],
    },
    search: {
      provider: 'local',
    },
  },
})