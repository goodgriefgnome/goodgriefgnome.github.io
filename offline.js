if (navigator.serviceWorker) {
  navigator.serviceWorker.getRegistration().then(function(registration) {
    if (!registration || !navigator.serviceWorker.controller) {
      navigator.serviceWorker.register('./offline-service-worker.js').then(function() {
        console.log('Service worker registered, reloading the page');
        window.location.reload();
      });
    }
  });
}
