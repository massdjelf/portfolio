module.exports = {
  content: ["./*.html", "./main.js"],
  theme: {
    extend: {
      colors: {
        sage: { 50:'#f6f7f5',100:'#e8eae6',200:'#d1d5cc',300:'#b4bba8',400:'#949e85',500:'#7c8471',600:'#626858',700:'#4f5449',800:'#41443c',900:'#363931' },
        ink:  { 50:'#f4f4f6',100:'#e4e4e9',400:'#5a5d6e',600:'#33364a',800:'#1c1e2b',900:'#12141c' },
        mint: { 300:'#c3d1b6',400:'#a8b896' }
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    }
  },
  plugins: []
}
