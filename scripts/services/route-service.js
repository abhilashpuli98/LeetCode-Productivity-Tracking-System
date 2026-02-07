/**
 * Service that watches LeetCode SPA route changes
 * and triggers a callback when problem slug changes.
 */
export default class RouteService {
  constructor(onRouteChange) {
    if (typeof onRouteChange !== "function") {
      throw new Error("RouteService requires a callback function");
    }

    this.onRouteChange = onRouteChange;
    this.problemSlug = this.getSlug();
    this.observeUrlChanges();
  }

  getSlug() {
    return location.pathname.match(/\/problems\/([^/]+)/)?.[1] || null;
  }

  observeUrlCzzhanges() {
    const observer = new MutationObserver(() => {
      const newSlug = this.getSlug();

      if (newSlug !== this.problemSlug) {
        this.problemSlug = newSlug;

        // Debounce SPA noise
        clearTimeout(this._timer);
        this._timer = setTimeout(() => {
          this.onRouteChange();
        }, 800);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
}
