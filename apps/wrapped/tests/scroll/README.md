# Scroll interaction regression checks

Start the Vite development server, then run from the repository root:

```sh
SCROLL_TEST_URL=http://127.0.0.1:5173 node apps/wrapped/tests/scroll/browser.mjs
```

The script uses Playwright's Chromium. To use a locally installed Chrome, add
`SCROLL_BROWSER_CHANNEL=chrome`. The fixture is intercepted by the test browser;
it is not a production route.

Checks cover wheel intent versus momentum, immediate reversal, ignored zoom and
horizontal gestures, keyboard/form handling, forward quiz gates and backward
navigation, persistent feedback, tall content, restoration, viewport resizing,
reduced motion, reading mode, and mobile touch events via CDP. The regular
`e2e` suites cover the actual edition and speaker journeys, accessibility,
rotation, and retained content/effect lifecycles. Touch emulation does not replace
checking scroll feel on a physical iOS/Android device and trackpad.
