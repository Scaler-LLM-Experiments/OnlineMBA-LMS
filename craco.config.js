module.exports = {
  babel: {
    plugins: [
      // Remove console logs only in production builds
      process.env.NODE_ENV === 'production' && [
        'babel-plugin-transform-remove-console',
        {
          exclude: ['error', 'warn'] // Keep console.error and console.warn even in production
        }
      ]
    ].filter(Boolean)
  }
};
