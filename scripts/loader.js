console.log("[LT] loader.js injected");

(async () => {
  try {
    const src = chrome.runtime.getURL("scripts/leetcode.js");
    console.log("[LT] importing", src);

    const mainModule = await import(src);
    console.log("[LT] module loaded");

    new mainModule.default();
    console.log("[LT] LeetcodeTracker instantiated");
  } catch (error) {
    console.error("[LT] Loader error:", error);
  }
})();
/*(async () => {
  try {
    const src = chrome.runtime.getURL("scripts/leetcode.js");
    const mainModule = await import(src);

    // Initialize LeetcodeTracker
    new mainModule.default();
  } catch (error) {
    console.error("Error loading LeetCode Tracker modules:", error);
  }
})();*/