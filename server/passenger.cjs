import('./index.js').catch((error) => {
  console.error('Failed to start the Oikos API:', error);
  process.exitCode = 1;
});
